<?php

/**
 * helpers
 *
 * @version    2.0.0
 * @package    Advsoft
 * @author     Taufik
 * @author     AdvSoft Team
 * @copyright  Copyright (c) 2026 AdvSoft Technologies
 * @license    https://opensource.org/licenses/MIT MIT License
 */

use App\Advsoft\Core\Application;
use App\Advsoft\Core\Http\Request;
use App\Advsoft\Core\Http\Response;
use App\Advsoft\Core\Http\JsonResponse;
use App\Advsoft\Core\Support\Collection;
use App\Advsoft\Core\Support\Str;

if (!function_exists('app')) {
    function app(?string $abstract = null, array $parameters = []): mixed
    {
        if (is_null($abstract)) {
            return Application::getInstance();
        }
        return Application::getInstance()->make($abstract, $parameters);
    }
}

if (!function_exists('collect')) {
    function collect(mixed $value = []): Collection
    {
        return new Collection($value);
    }
}

if (!function_exists('now')) {
    function now(mixed $tz = null): \DateTimeImmutable
    {
        return new \DateTimeImmutable('now', $tz ? new \DateTimeZone($tz) : null);
    }
}

if (!function_exists('today')) {
    function today(mixed $tz = null): \DateTimeImmutable
    {
        return (new \DateTimeImmutable('today', $tz ? new \DateTimeZone($tz) : null));
    }
}

if (!function_exists('base_path')) {
    function base_path(string $path = ''): string
    {
        return app()->basePath($path);
    }
}

if (!function_exists('app_path')) {
    function app_path(string $path = ''): string
    {
        return app()->path($path);
    }
}

if (!function_exists('public_path')) {
    function public_path(string $path = ''): string
    {
        return app()->publicPath($path);
    }
}

if (!function_exists('storage_path')) {
    function storage_path(string $path = ''): string
    {
        return app()->storagePath($path);
    }
}

if (!function_exists('config_path')) {
    function config_path(string $path = ''): string
    {
        return app()->configPath($path);
    }
}

if (!function_exists('config')) {
    function config(?string $key = null, mixed $default = null): mixed
    {
        static $cached = null;
        if ($cached === null) {
            $configFile = config_path('application.php');
            $cached = file_exists($configFile) ? (require $configFile) : [];
        }

        if ($key === null) {
            return $cached;
        }

        $parts = explode('.', $key);
        $current = $cached;
        foreach ($parts as $part) {
            if (!is_array($current) || !array_key_exists($part, $current)) {
                return $default;
            }
            $current = $current[$part];
        }
        return $current;
    }
}

if (!function_exists('resource_path')) {
    function resource_path(string $path = ''): string
    {
        return app()->resourcePath($path);
    }
}

if (!function_exists('response')) {
    function response(mixed $content = '', int $status = 200, array $headers = []): Response|JsonResponse
    {
        if (is_array($content) || is_object($content)) {
            return new JsonResponse($content, $status, $headers);
        }
        return new Response((string)$content, $status, $headers);
    }
}

if (!function_exists('abort')) {
    function abort(int $code, string $message = '', array $headers = []): void
    {
        app()->abort($code, $message, $headers);
    }
}

if (!function_exists('csrf_token')) {
    function csrf_token(): string
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            @session_start();
        }
        if (empty($_SESSION['_token'])) {
            $_SESSION['_token'] = bin2hex(random_bytes(20));
        }
        return $_SESSION['_token'];
    }
}

if (!function_exists('str_studly')) {
    function str_studly(string $value): string
    {
        return Str::studly($value);
    }
}

if (!function_exists('str_camel')) {
    function str_camel(string $value): string
    {
        return Str::camel($value);
    }
}

if (!function_exists('class_basename')) {
    function class_basename(string|object $class): string
    {
        $class = is_object($class) ? get_class($class) : $class;
        return basename(str_replace('\\', '/', $class));
    }
}

if (!function_exists('view')) {
    function view(string $view, array $data = []): string
    {
        return \App\Advsoft\Core\View\ViewEngine::render($view, $data);
    }
}

if (!function_exists('asset')) {
    function asset(string $path): string
    {
        return '/' . ltrim($path, '/');
    }
}

if (!function_exists('redirect')) {
    function redirect(string $url): void
    {
        header("Location: $url");
        exit;
    }
}
