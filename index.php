<?php

/**
 * Adiantisoft — Pure Adianti Framework Front Controller & Application Gateway.
 */

require_once __DIR__ . '/app/bootstrap.php';

use App\Core\Application;
use App\Core\Http\Request;
use App\Core\Http\Response;
use App\Core\Http\JsonResponse;
use App\Core\Http\Router;
use App\Odoo\Security\SecurityContext;
use App\Odoo\Security\SecurityService;

$container = Application::getInstance();
$request = Request::capture();
$container->instance(Request::class, $request);

$ctx = $container->make(SecurityContext::class);
$security = $container->make(SecurityService::class);

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// -------------------------------------------------------------
// 1. Static Asset Serving with ETag & Browser Caching
// -------------------------------------------------------------
$publicFile = __DIR__ . '/public' . $uri;
if ($uri !== '/' && is_file($publicFile) && strtolower(pathinfo($publicFile, PATHINFO_EXTENSION)) !== 'php') {
    $mtime = filemtime($publicFile);
    $etag = '"' . md5($mtime . filesize($publicFile)) . '"';

    if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
        http_response_code(304);
        exit;
    }

    $ext = pathinfo($publicFile, PATHINFO_EXTENSION);
    $mimes = [
        'css'   => 'text/css',
        'js'    => 'application/javascript',
        'json'  => 'application/json',
        'png'   => 'image/png',
        'jpg'   => 'image/jpeg',
        'jpeg'  => 'image/jpeg',
        'gif'   => 'image/gif',
        'svg'   => 'image/svg+xml',
        'ico'   => 'image/x-icon',
        'woff'  => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf'   => 'font/ttf',
        'eot'   => 'application/vnd.ms-fontobject',
        'xml'   => 'application/xml',
        'pdf'   => 'application/pdf',
    ];
    $contentType = $mimes[strtolower($ext)] ?? mime_content_type($publicFile) ?: 'application/octet-stream';
    header("Content-Type: $contentType");
    header("Cache-Control: public, max-age=86400");
    header("ETag: $etag");
    header("Last-Modified: " . gmdate('D, d M Y H:i:s', $mtime) . " GMT");
    readfile($publicFile);
    exit;
}

// -------------------------------------------------------------
// 2. Load Routes and Dispatch via Pure Adianti Router
// -------------------------------------------------------------
$router = Router::getInstance();
require_once __DIR__ . '/routes/web.php';

try {
    $result = $router->dispatch($request);

    if (\Adianti\Database\TTransaction::get()) {
        \Adianti\Database\TTransaction::close();
    }

    if ($result instanceof JsonResponse || $result instanceof Response) {
        $result->send();
    } elseif (is_array($result) || is_object($result)) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($result);
    } else {
        echo $result;
    }
} catch (\Throwable $e) {
    if (\Adianti\Database\TTransaction::get()) {
        \Adianti\Database\TTransaction::rollback();
    }

    $rawCode = $e->getCode();
    $code = (is_numeric($rawCode) && (int)$rawCode >= 400 && (int)$rawCode < 600) ? (int)$rawCode : 500;
    http_response_code($code);

    if ($request->expectsJson() || str_starts_with($uri, '/api/')) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'error' => $e->getMessage(),
            'code'  => $code,
            'trace' => explode("\n", $e->getTraceAsString()),
        ]);
    } else {
        echo "<div style='font-family:sans-serif;padding:30px;background:#fff1f2;color:#9f1239;border-radius:8px;max-width:800px;margin:50px auto;border:1px solid #fecdd3;'>";
        echo "<h2 style='margin-top:0;'>HTTP " . htmlspecialchars($code) . " Error</h2>";
        echo "<p style='font-size:16px;'>" . htmlspecialchars($e->getMessage()) . "</p>";
        echo "<pre style='background:#fff;padding:15px;border-radius:6px;overflow:auto;font-size:12px;color:#333;'>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
        echo "</div>";
    }
}
exit;
