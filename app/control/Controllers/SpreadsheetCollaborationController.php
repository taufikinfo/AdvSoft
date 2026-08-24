<?php

namespace App\Control\Controllers;

use App\Model\Spreadsheet\SpreadsheetCollaboration;
use App\Model\Spreadsheet\SpreadsheetOperation;
use App\Model\Res\ResUser;
use App\Advsoft\Core\Http\JsonResponse;
use App\Advsoft\Core\Http\Request;
use App\Advsoft\Security\SecurityContext;

class SpreadsheetCollaborationController extends Controller
{
    /** Presence rows older than this are considered offline. */
    private const PRESENCE_TTL_MINUTES = 5;

    /** Operations older than this are purged by cleanup. */
    private const OPERATION_TTL_DAYS = 7;

    public function __construct(
        protected SecurityContext $ctx
    ) {}

    protected function requireUserId(): int
    {
        $userId = $this->ctx->getUserId();
        if (!$userId) {
            abort(401, 'Unauthenticated');
        }
        return (int) $userId;
    }

    protected function requireSpreadsheetId(Request $request): int
    {
        $spreadsheetId = (int) $request->input('spreadsheet_id');
        if (!$spreadsheetId) {
            abort(400, 'spreadsheet_id is required');
        }
        return $spreadsheetId;
    }

    /**
     * POST /api/spreadsheet/presence
     * Upserts the current user's cursor and returns all other online collaborators.
     */
    public function presence(Request $request): JsonResponse
    {
        $userId = $this->requireUserId();
        $spreadsheetId = $this->requireSpreadsheetId($request);

        $selection = $request->input('selection');
        $collab = SpreadsheetCollaboration::where('spreadsheet_id', '=', $spreadsheetId)
            ->where('user_id', '=', $userId)
            ->first();

        if (!$collab) {
            $collab = new SpreadsheetCollaboration;
            $collab->spreadsheet_id = $spreadsheetId;
            $collab->user_id = $userId;
        }
        $collab->cursor_col = (int) $request->input('cursor_col', 0);
        $collab->cursor_row = (int) $request->input('cursor_row', 0);
        $collab->selection  = is_string($selection) ? $selection : json_encode($selection);
        $collab->last_active_at = date('Y-m-d H:i:s');
        $collab->save();

        return new JsonResponse([
            'success'     => true,
            'cursors'     => $this->getOtherCursors($spreadsheetId, $userId),
            'server_time' => date('c'),
        ]);
    }

    /**
     * POST /api/spreadsheet/apply_op  (also aliased as /publish)
     * Commits a single atomic operation with a server-assigned revision.
     */
    public function applyOp(Request $request): JsonResponse
    {
        $userId = $this->requireUserId();
        $spreadsheetId = $this->requireSpreadsheetId($request);
        $operation = $request->input('operation');

        if (!is_array($operation)) {
            abort(400, 'operation payload is required');
        }

        $op = $this->storeOperation($spreadsheetId, $userId, $operation);

        return new JsonResponse([
            'success'  => true,
            'op_id'    => $op['id'],
            'revision' => $op['revision'],
        ]);
    }

    /**
     * POST /api/spreadsheet/batch_publish
     * Commits multiple operations in one request.
     */
    public function batchPublish(Request $request): JsonResponse
    {
        $userId = $this->requireUserId();
        $spreadsheetId = $this->requireSpreadsheetId($request);
        $operations = $request->input('operations');

        if (!is_array($operations) || count($operations) > 500) {
            abort(400, 'operations array is required (max 500)');
        }

        $stored = [];
        foreach ($operations as $operation) {
            if (is_array($operation)) {
                $stored[] = $this->storeOperation($spreadsheetId, $userId, $operation);
            }
        }

        return new JsonResponse([
            'success'   => true,
            'stored'    => count($stored),
            'revisions' => array_column($stored, 'revision'),
        ]);
    }

    /**
     * POST /api/spreadsheet/longpoll
     * Returns all operations newer than the given revision (poll transport).
     */
    public function longpoll(Request $request): JsonResponse
    {
        $userId = $this->requireUserId();
        $spreadsheetId = $this->requireSpreadsheetId($request);
        $since = (int) $request->input('since_rev', $request->input('last_revision', $request->input('last_sequence', 0)));

        $ops = $this->fetchOperations($spreadsheetId, $since, 200);
        $lastRevision = $since;
        $messages = [];
        foreach ($ops as $op) {
            $lastRevision = max($lastRevision, $op['revision']);
            $message = $op['data'];
            if (!is_array($message)) {
                $message = ['type' => 'operation', 'operation' => $op['data']];
            }
            $message['sender'] = $message['sender'] ?? $op['userId'];
            $message['revision'] = $op['revision'];
            $messages[] = $message;
        }

        return new JsonResponse([
            'success'       => true,
            'messages'      => $messages,
            'last_revision' => $lastRevision,
            'last_sequence' => $lastRevision, // backward-compatible alias
        ]);
    }

    /**
     * GET /api/spreadsheet/history
     * Returns the latest operations with structured metadata.
     */
    public function history(Request $request): JsonResponse
    {
        $this->requireUserId();
        $spreadsheetId = $this->requireSpreadsheetId($request);
        $since = (int) $request->input('since_rev', 0);
        $limit = min(500, max(1, (int) $request->input('limit', 100)));

        $ops = SpreadsheetOperation::query()
            ->where('spreadsheet_id', '=', $spreadsheetId)
            ->where('revision', '>', $since)
            ->orderBy('revision', 'DESC')
            ->limit($limit)
            ->get();

        $result = [];
        foreach ($ops as $op) {
            $result[] = [
                'id'        => $op->id,
                'revision'  => (int) $op->revision,
                'type'      => $op->operation_type,
                'data'      => json_decode((string) $op->operation_data, true) ?: [],
                'userId'    => $op->user_id,
                'appliedAt' => $op->applied_at,
            ];
        }

        return new JsonResponse([
            'success' => true,
            'ops'     => $result,
        ]);
    }

    /**
     * GET /api/spreadsheet/fetch_ops — alias of longpoll with the ops format.
     */
    public function fetchOps(Request $request): JsonResponse
    {
        $this->requireUserId();
        $spreadsheetId = $this->requireSpreadsheetId($request);
        $since = (int) $request->input('since_rev', 0);

        return new JsonResponse([
            'success' => true,
            'ops'     => $this->fetchOperations($spreadsheetId, $since, 200),
        ]);
    }

    /**
     * POST /api/spreadsheet/cleanup
     * Removes stale presence rows and expired operations.
     */
    public function cleanup(Request $request): JsonResponse
    {
        $this->requireUserId();

        $presenceCutoff = date('Y-m-d H:i:s', time() - (self::PRESENCE_TTL_MINUTES * 60));
        $stalePresence = SpreadsheetCollaboration::query()
            ->where('last_active_at', '<', $presenceCutoff)
            ->delete();

        $opCutoff = date('Y-m-d H:i:s', time() - (self::OPERATION_TTL_DAYS * 86400));
        $staleOps = SpreadsheetOperation::query()
            ->where('applied_at', '<', $opCutoff)
            ->delete();

        return new JsonResponse([
            'success'          => true,
            'removed_presence' => $stalePresence,
            'removed_ops'      => $staleOps,
        ]);
    }

    protected function getOtherCursors(int $spreadsheetId, int $userId): array
    {
        $cutoff = date('Y-m-d H:i:s', time() - (self::PRESENCE_TTL_MINUTES * 60));
        $allCollabs = SpreadsheetCollaboration::query()
            ->where('spreadsheet_id', '=', $spreadsheetId)
            ->where('user_id', '!=', $userId)
            ->where('last_active_at', '>=', $cutoff)
            ->get();

        $cursors = [];
        foreach ($allCollabs as $c) {
            $u = ResUser::find($c->user_id);
            $cursors[] = [
                'userId'     => $c->user_id,
                'userName'   => $u?->name ?? ('User ' . $c->user_id),
                'userColor'  => $c->cursor_color ?: '#6366f1',
                'col'        => (int) $c->cursor_col,
                'row'        => (int) $c->cursor_row,
                'selection'  => json_decode((string) $c->selection, true) ?: [],
                'lastActive' => $c->last_active_at,
            ];
        }
        return $cursors;
    }

    /**
     * Persists one operation with a monotonic per-spreadsheet revision.
     */
    protected function storeOperation(int $spreadsheetId, int $userId, array $operation): array
    {
        $revision = (int) ($operation['revision'] ?? 0);
        if ($revision <= 0) {
            $max = SpreadsheetOperation::query()
                ->where('spreadsheet_id', '=', $spreadsheetId)
                ->max('revision');
            $revision = (int) ($max ?? 0) + 1;
        }

        $type = is_string($operation['type'] ?? null) ? $operation['type'] : 'set_cell';

        $op = SpreadsheetOperation::create([
            'spreadsheet_id' => $spreadsheetId,
            'user_id'        => $userId,
            'revision'       => $revision,
            'operation_type' => $type,
            'operation_data' => json_encode($operation, JSON_UNESCAPED_UNICODE),
            'applied_at'     => date('Y-m-d H:i:s'),
        ]);

        return [
            'id'       => $op->id,
            'revision' => $revision,
        ];
    }

    protected function fetchOperations(int $spreadsheetId, int $sinceRevision, int $limit): array
    {
        $ops = SpreadsheetOperation::query()
            ->where('spreadsheet_id', '=', $spreadsheetId)
            ->where('revision', '>', $sinceRevision)
            ->orderBy('revision', 'ASC')
            ->limit($limit)
            ->get();

        $result = [];
        foreach ($ops as $op) {
            $result[] = [
                'id'        => $op->id,
                'revision'  => (int) $op->revision,
                'type'      => $op->operation_type,
                'data'      => json_decode((string) $op->operation_data, true) ?: [],
                'userId'    => $op->user_id,
                'appliedAt' => $op->applied_at,
            ];
        }
        return $result;
    }
}
