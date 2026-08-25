<?php

namespace App\Control\Controllers;

use App\Advsoft\Field\Html\EmbedExtractor;
use App\Advsoft\Field\Html\HtmlFieldConfig;
use App\Advsoft\Field\Html\HtmlSanitizer;
use App\Advsoft\Field\Html\MentionParser;
use App\Advsoft\Registry;
use App\Advsoft\Field;
use App\Advsoft\Core\Http\JsonResponse;
use App\Advsoft\Core\Http\Request;
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
        if (!$files || empty($files['tmp_name']) || !is_uploaded_file($files['tmp_name'])) {
            return new JsonResponse(['error' => 'No valid uploaded file found.'], 400);
        }

        // Limit file size to 10MB
        $maxSize = 10 * 1024 * 1024;
        if (($files['size'] ?? 0) > $maxSize) {
            return new JsonResponse(['error' => 'File exceeds maximum allowed size of 10MB.'], 400);
        }

        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        $ext = strtolower(pathinfo($files['name'], PATHINFO_EXTENSION));

        if (!in_array($ext, $allowedExtensions, true)) {
            return new JsonResponse(['error' => 'Invalid file extension. Allowed: jpg, jpeg, png, gif, webp, svg.'], 422);
        }

        // MIME type validation via finfo
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $files['tmp_name']);
        finfo_close($finfo);

        $allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'text/plain', 'text/html'
        ];
        if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'], true)) {
            return new JsonResponse(['error' => 'File is not a valid image.'], 422);
        }

        // Generate cryptographically secure filename
        $fileName = bin2hex(random_bytes(16)) . '.' . $ext;
        $dir = base_path('storage/uploads/rte/' . date('Y/m'));
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        $targetPath = $dir . '/' . $fileName;
        if (!move_uploaded_file($files['tmp_name'], $targetPath)) {
            return new JsonResponse(['error' => 'Failed to save uploaded file.'], 500);
        }

        $relUrl = '/storage/uploads/rte/' . date('Y/m') . '/' . $fileName;

        return new JsonResponse([
            'url'  => $relUrl,
            'path' => $relUrl,
            'name' => htmlspecialchars($files['name'], ENT_QUOTES, 'UTF-8'),
            'size' => (int) $files['size'],
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
