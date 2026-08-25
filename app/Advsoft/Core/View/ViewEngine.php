<?php

namespace App\Advsoft\Core\View;

/**
 * ViewEngine
 *
 * @version    2.0.0
 * @package    Advsoft
 * @author     Taufik
 * @author     AdvSoft Team
 * @copyright  Copyright (c) 2026 AdvSoft Technologies
 * @license    https://opensource.org/licenses/MIT MIT License
 */
class ViewEngine
{
    protected static string $cachePath = __DIR__ . '/../../../../storage/framework/views';

    public static function render(string $view, array $data = []): string
    {
        $filePath = self::findViewFile($view);
        if (!$filePath) {
            throw new \Exception("View [$view] not found.", 404);
        }

        if (str_ends_with($filePath, '.blade.php')) {
            $compiledPath = self::compileBlade($filePath);
            return self::evaluatePath($compiledPath, $data);
        }

        return self::evaluatePath($filePath, $data);
    }

    protected static function findViewFile(string $view): ?string
    {
        $normalized = str_replace('.', '/', $view);
        $candidates = [
            __DIR__ . "/../../../resources/views/{$normalized}.blade.php",
            __DIR__ . "/../../../resources/views/{$normalized}.php",
            __DIR__ . "/../../../resources/views/{$normalized}.html",
            __DIR__ . "/../../../resources/{$normalized}.html",
            __DIR__ . "/../../../resources/{$normalized}.php",
            __DIR__ . "/../../../view/{$normalized}.php",
            __DIR__ . "/../../../templates/{$normalized}.html",
        ];

        foreach ($candidates as $candidate) {
            if (file_exists($candidate)) {
                return $candidate;
            }
        }
        return null;
    }

    public static function compileBlade(string $filePath): string
    {
        if (!is_dir(self::$cachePath)) {
            @mkdir(self::$cachePath, 0777, true);
        }

        $cacheFile = self::$cachePath . '/' . md5($filePath) . '.php';

        $content = file_get_contents($filePath);

        // Remove @vite directives
        $content = preg_replace_callback('/@vite\s*(\((?:(?>[^()]+)|(?1))*\))/', fn() => '', $content);

        // JSON and helper directives with nested parenthesis support
        $content = preg_replace_callback('/@json\s*(\((?:(?>[^()]+)|(?1))*\))/', fn($m) => "<?= json_encode{$m[1]} ?>", $content);
        $content = preg_replace_callback('/@include\s*(\((?:(?>[^()]+)|(?1))*\))/', fn($m) => "<?= view{$m[1]} ?>", $content);

        $content = preg_replace('/@csrf\b/', '<input type="hidden" name="_token" value="<?= csrf_token() ?>">', $content);
        $content = preg_replace_callback('/@method\s*(\((?:(?>[^()]+)|(?1))*\))/', function($m) {
            $val = trim($m[1], '()\'" ');
            return "<input type=\"hidden\" name=\"_method\" value=\"{$val}\">";
        }, $content);

        $content = preg_replace('/@php\b/', '<?php ', $content);
        $content = preg_replace('/@endphp\b/', ' ?>', $content);

        // Control structures with recursive balanced parentheses
        $content = preg_replace_callback('/@if\s*(\((?:(?>[^()]+)|(?1))*\))/', fn($m) => "<?php if{$m[1]}: ?>", $content);
        $content = preg_replace_callback('/@elseif\s*(\((?:(?>[^()]+)|(?1))*\))/', fn($m) => "<?php elseif{$m[1]}: ?>", $content);
        $content = preg_replace('/@else\b/', '<?php else: ?>', $content);
        $content = preg_replace('/@endif\b/', '<?php endif; ?>', $content);

        $content = preg_replace_callback('/@foreach\s*(\((?:(?>[^()]+)|(?1))*\))/', fn($m) => "<?php foreach{$m[1]}: ?>", $content);
        $content = preg_replace('/@endforeach\b/', '<?php endforeach; ?>', $content);

        $content = preg_replace_callback('/@for\s*(\((?:(?>[^()]+)|(?1))*\))/', fn($m) => "<?php for{$m[1]}: ?>", $content);
        $content = preg_replace('/@endfor\b/', '<?php endfor; ?>', $content);

        $content = preg_replace_callback('/@while\s*(\((?:(?>[^()]+)|(?1))*\))/', fn($m) => "<?php while{$m[1]}: ?>", $content);
        $content = preg_replace('/@endwhile\b/', '<?php endwhile; ?>', $content);

        // Echo statements: {!! raw !!} and {{ escaped }}
        $content = preg_replace('/\{\{\{\s*(.*?)\s*\}\}\}/s', '<?= htmlspecialchars((string)($1), ENT_QUOTES, \'UTF-8\') ?>', $content);
        $content = preg_replace('/\{\!!\s*(.*?)\s*!!\}/s', '<?= $1 ?>', $content);
        $content = preg_replace('/\{\{\s*(.*?)\s*\}\}/s', '<?= htmlspecialchars((string)($1), ENT_QUOTES, \'UTF-8\') ?>', $content);

        file_put_contents($cacheFile, $content);
        return $cacheFile;
    }

    protected static function evaluatePath(string $path, array $data): string
    {
        ob_start();
        extract($data, EXTR_SKIP);
        try {
            include $path;
        } catch (\Throwable $e) {
            ob_end_clean();
            throw $e;
        }
        return ob_get_clean() ?: '';
    }

    public static function clearCache(): void
    {
        if (is_dir(self::$cachePath)) {
            $files = glob(self::$cachePath . '/*.php');
            foreach ($files as $f) {
                @unlink($f);
            }
        }
    }
}
