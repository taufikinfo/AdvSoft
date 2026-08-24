<?php

namespace App\Control\Controllers;

use App\Odoo\Field\Html\EmbedExtractor;
use App\Odoo\Field\Html\HtmlFieldConfig;
use App\Odoo\Field\Html\HtmlSanitizer;
use App\Odoo\Field\Html\MentionParser;
use App\Odoo\Registry;
use App\Odoo\Field;
use App\Odoo\Core\Http\JsonResponse;
use App\Odoo\Core\Http\Request;
use Adianti\Database\TTransaction;

/**
 * HtmlFieldController – Backend support for the Rich-Text Editor.
 */
class HtmlFieldController extends Controller
{
    public function __construct(
        protected ?EmbedExtractor $embeds = null,
        protected ?MentionParser $mentions = null,
    ) {
        $this->embeds = $this->embeds ?: new EmbedExtractor();
        $this->mentions = $this->mentions ?: new MentionParser();
    }

    protected function resolveConfig(Request $request): HtmlFieldConfig
    {
        $preset = $request->input('preset') ?: HtmlFieldConfig::PRESET_STANDARD;
        $model  = $request->input('model');
        $field  = $request->input('field');

        if ($model && $field) {
            $def = Registry::get($model);
            $fld = $def?->getField($field);
            if ($fld && $fld->type === Field::HTML) {
                $preset = $fld->htmlPreset ?: $preset;
                $cfg = new HtmlFieldConfig(['preset' => $preset]);
                if (is_array($fld->htmlOptions)) {
                    foreach ($fld->htmlOptions as $k => $v) {
                        if (property_exists($cfg, $k)) {
                            $cfg->$k = $v;
                        }
                    }
                }
                return $cfg;
            }
        }

        return new HtmlFieldConfig(['preset' => $preset]);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $cfg = $this->resolveConfig($request);

        if (!in_array('image', $cfg->plugins, true)) {
            return new JsonResponse(['error' => 'Image upload is disabled for this field.'], 403);
        }

        $files = $_FILES['file'] ?? $_FILES['image'] ?? null;
        if (!$files || empty($files['tmp_name'])) {
            return new JsonResponse(['error' => 'No file uploaded.'], 400);
        }

        $ext = strtolower(pathinfo($files['name'], PATHINFO_EXTENSION) ?: 'jpg');
        $fileName = bin2hex(random_bytes(8)) . '.' . $ext;
        $dir = base_path('storage/uploads/rte/' . date('Y/m'));
        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }
        $targetPath = $dir . '/' . $fileName;
        move_uploaded_file($files['tmp_name'], $targetPath);

        $relUrl = '/storage/uploads/rte/' . date('Y/m') . '/' . $fileName;

        return new JsonResponse([
            'url'  => $relUrl,
            'path' => $relUrl,
            'name' => $files['name'],
            'size' => $files['size'],
        ]);
    }

    public function embeds(Request $request): JsonResponse
    {
        $url = (string) $request->input('url', '');
        if ($url === '') {
            return new JsonResponse(['error' => 'Missing url.'], 400);
        }

        $meta = $this->embeds->extract($url);
        return new JsonResponse($meta);
    }

    public function mentions(Request $request): JsonResponse
    {
        $cfg = $this->resolveConfig($request);
        $term = trim((string) $request->input('term', ''));
        $model = (string) ($request->input('model') ?: $cfg->mentionModel ?: 'res.partner');
        $limit = (int) $request->input('limit', 8);

        $def = Registry::get($model);
        if (!$def) {
            return new JsonResponse(['error' => "Unknown mention model: $model", 'results' => []], 400);
        }

        $recName = $def->_rec_name;
        TTransaction::open('advsoft');
        $table = $def->_table;
        $conn = TTransaction::get();
        if ($term !== '') {
            $stmt = $conn->prepare("SELECT id, $recName FROM $table WHERE $recName LIKE :term LIMIT :lim");
            $stmt->bindValue(':term', '%' . $term . '%');
            $stmt->bindValue(':lim', $limit, \PDO::PARAM_INT);
            $stmt->execute();
        } else {
            $stmt = $conn->prepare("SELECT id, $recName FROM $table LIMIT :lim");
            $stmt->bindValue(':lim', $limit, \PDO::PARAM_INT);
            $stmt->execute();
        }
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $results = [];
        foreach ($rows as $r) {
            $results[] = [
                'id'    => (int) $r['id'],
                'name'  => (string) ($r[$recName] ?? ''),
                'model' => $model,
            ];
        }

        return new JsonResponse([
            'model'   => $model,
            'term'    => $term,
            'results' => $results,
        ]);
    }

    public function sanitize(Request $request): JsonResponse
    {
        $cfg = $this->resolveConfig($request);
        $html = (string) $request->input('html', '');
        $san = new HtmlSanitizer($cfg);
        $clean = $san->sanitize($html);
        $mentions = $this->mentions->extract($clean);

        return new JsonResponse([
            'html'           => $clean,
            'length'         => mb_strlen(strip_tags($clean)),
            'mentions_count' => count($mentions),
            'mentions'       => $mentions,
        ]);
    }

    public function config(Request $request): JsonResponse
    {
        $cfg = $this->resolveConfig($request);
        return new JsonResponse($cfg->toArray());
    }
}
