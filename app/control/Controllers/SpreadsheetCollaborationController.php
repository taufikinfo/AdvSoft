<?php

namespace App\Control\Controllers;

use App\Model\SpreadsheetDocument;
use App\Model\SpreadsheetCollaboration;
use App\Model\SpreadsheetOperation;
use App\Model\Res\ResUser;
use App\Advsoft\Core\Http\JsonResponse;
use App\Advsoft\Core\Http\Request;
use App\Advsoft\Security\SecurityContext;

class SpreadsheetCollaborationController extends Controller
{
    public function __construct(
        protected SecurityContext $ctx
    ) {}

    public function presence(Request $request): JsonResponse
    {
        $userId = $this->ctx->getUserId() ?: 1;
        $spreadsheetId = (int) $request->input('spreadsheet_id');

        $collab = SpreadsheetCollaboration::where('spreadsheet_id', '=', $spreadsheetId)
            ->where('user_id', '=', $userId)
            ->first();

        if (!$collab) {
            $collab = new SpreadsheetCollaboration;
            $collab->spreadsheet_id = $spreadsheetId;
            $collab->user_id = $userId;
        }
        $collab->cursor_col = $request->input('cursor_col');
        $collab->cursor_row = $request->input('cursor_row');
        $collab->selection  = json_encode($request->input('selection'));
        $collab->last_active_at = date('Y-m-d H:i:s');
        $collab->save();

        $allCollabs = SpreadsheetCollaboration::where('spreadsheet_id', '=', $spreadsheetId)
            ->where('user_id', '!=', $userId)
            ->get();

        $cursors = [];
        foreach ($allCollabs as $c) {
            $u = ResUser::find($c->user_id);
            $cursors[] = [
                'userId'     => $c->user_id,
                'userName'   => $u?->name ?? 'User ' . $c->user_id,
                'userColor'  => $c->cursor_color ?: '#6366f1',
                'col'        => (int)$c->cursor_col,
                'row'        => (int)$c->cursor_row,
                'selection'  => json_decode($c->selection, true) ?: [],
                'lastActive' => $c->last_active_at,
            ];
        }

        return new JsonResponse([
            'success' => true,
            'cursors' => $cursors,
        ]);
    }

    public function applyOp(Request $request): JsonResponse
    {
        $userId = $this->ctx->getUserId() ?: 1;
        $spreadsheetId = (int) $request->input('spreadsheet_id');
        $operation = $request->input('operation');
        $revision = (int) $request->input('revision');

        $op = SpreadsheetOperation::create([
            'spreadsheet_id' => $spreadsheetId,
            'user_id'        => $userId,
            'revision'       => $revision,
            'operation_type' => $operation['type'] ?? 'set_cell',
            'operation_data' => json_encode($operation),
            'applied_at'     => date('Y-m-d H:i:s'),
        ]);

        return new JsonResponse([
            'success'  => true,
            'op_id'    => $op->id,
            'revision' => $revision,
        ]);
    }

    public function fetchOps(Request $request): JsonResponse
    {
        $spreadsheetId = (int) $request->input('spreadsheet_id');
        $sinceRev = (int) $request->input('since_rev', 0);

        $ops = SpreadsheetOperation::where('spreadsheet_id', '=', $spreadsheetId)
            ->where('revision', '>', $sinceRev)
            ->get();

        $result = [];
        foreach ($ops as $op) {
            $result[] = [
                'id'        => $op->id,
                'revision'  => (int)$op->revision,
                'type'      => $op->operation_type,
                'data'      => json_decode($op->operation_data, true) ?: [],
                'userId'    => $op->user_id,
                'appliedAt' => $op->applied_at,
            ];
        }

        return new JsonResponse([
            'success' => true,
            'ops'     => $result,
        ]);
    }
}
