<?php

namespace App\Control\Controllers;

use App\Advsoft\Core\Http\Request;
use App\Advsoft\Core\Http\JsonResponse;
use App\Advsoft\QWeb\QWeb;
use App\Advsoft\QWeb\QWebLoader;
use Adianti\Database\TTransaction;

/**
 * QWebController – API endpoints for QWeb template management.
 */
class QWebController extends Controller
{
    public function __construct(
        private QWeb $qweb,
        private QWebLoader $loader,
    ) {}

    public function index(): JsonResponse
    {
        $templates = $this->loader->listTemplates();
        return new JsonResponse([
            'templates' => array_map(fn($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'key' => $t->key,
                'priority' => $t->priority,
                'inherit_id' => $t->inherit_id,
                'primary' => $t->primary,
                'active' => $t->active,
                'created_at' => $t->created_at,
                'updated_at' => $t->updated_at,
            ], $templates),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        TTransaction::open('advsoft');
        $conn = TTransaction::get();
        $stmt = $conn->prepare("SELECT * FROM ir_ui_views WHERE type = 'qweb' AND (id = :id OR name = :name OR `key` = :key) LIMIT 1");
        $stmt->execute([':id' => $id, ':name' => $id, ':key' => $id]);
        $template = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$template) {
            return new JsonResponse(['error' => 'Template not found'], 404);
        }

        return new JsonResponse($template);
    }

    public function save(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required',
            'arch' => 'required',
        ]);

        $id = $this->loader->saveTemplate(
            name: $request->input('name'),
            xml: $request->input('arch'),
            key: $request->input('key'),
            priority: (int) $request->input('priority', 16),
            inheritId: $request->input('inherit_id'),
            primary: (bool) $request->input('primary', false),
        );

        $this->qweb->clearCache();

        return new JsonResponse([
            'id' => $id,
            'message' => 'Template saved successfully',
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $deleted = $this->loader->deleteTemplate($id);
        if (!$deleted) {
            return new JsonResponse(['error' => 'Template not found'], 404);
        }
        $this->qweb->clearCache();
        return new JsonResponse(['message' => 'Template deleted']);
    }

    public function preview(Request $request): JsonResponse
    {
        $name = $request->input('name');
        $data = $request->input('data', []);

        try {
            $html = $this->qweb->render($name, $data);
            return new JsonResponse(['html' => $html]);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }
    }

    public function validate(Request $request): JsonResponse
    {
        $arch = $request->input('arch', '');
        $doc = new \DOMDocument();
        $valid = @$doc->loadXML($arch);

        return new JsonResponse([
            'valid'  => (bool) $valid,
            'errors' => $valid ? [] : [
                'message' => libxml_get_last_error()->message ?? 'Unknown XML error',
            ],
        ]);
    }

    public function clearCache(): JsonResponse
    {
        $this->qweb->clearCache();
        return new JsonResponse(['message' => 'Cache cleared']);
    }
}
