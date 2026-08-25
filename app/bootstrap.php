<?php
/**
 * AdvSoft Application Bootstrap — Pure Adianti PHP Framework
 * Initializes Adianti Core, Service Container, Security Context, and AdvSoft Registry.
 */

require_once __DIR__ . '/../init.php';
require_once __DIR__ . '/Advsoft/Core/Application.php';
require_once __DIR__ . '/Advsoft/Core/helpers.php';

use App\Advsoft\Core\Application;
use App\Advsoft\Core\Http\Request;
use App\Advsoft\Core\Support\Log;
use App\Advsoft\Security\SecurityContext;
use App\Advsoft\Security\SecurityService;
use App\Advsoft\Registry;
use Adianti\Database\TTransaction;

if (!class_exists('Log')) {
    class_alias(Log::class, 'Log');
}
if (!class_exists('Illuminate\Support\Facades\Log')) {
    class_alias(Log::class, 'Illuminate\Support\Facades\Log');
}

// Dynamic Class Resolver for Model & Framework namespaces (Pure Adianti / PSR-4)
spl_autoload_register(function (string $class) {
    if (str_starts_with($class, 'App\\Core\\')) {
        $target = 'App\\Advsoft\\' . substr($class, 4);
        if (class_exists($target)) {
            class_alias($target, $class);
            return;
        }
    }
    if (str_starts_with($class, 'App\\Http\\Controllers\\')) {
        $target = 'App\\Control\\Controllers\\' . substr($class, 21);
        if (class_exists($target)) {
            class_alias($target, $class);
            return;
        }
    }
    if (str_starts_with($class, 'App\\Model\\') || str_starts_with($class, 'App\\Models\\')) {
        $shortName = basename(str_replace('\\', '/', $class));
        $subfolders = ['Project', 'Base', 'Account', 'Res', 'Ir', 'Spreadsheet'];
        foreach ($subfolders as $sub) {
            $candidate = "App\\Model\\{$sub}\\{$shortName}";
            if (class_exists($candidate)) {
                class_alias($candidate, $class);
                return;
            }
        }
    }
});

// 1. Initialize Dependency Container
$basePath = realpath(__DIR__ . '/..');
$app = new Application($basePath);

// 2. Ensure Database Connection is ready
try {
    TTransaction::open('advsoft');
    $conn = TTransaction::get();
    if ($conn instanceof \PDO) {
        @$conn->exec("PRAGMA journal_mode = WAL;");
        @$conn->exec("PRAGMA busy_timeout = 10000;");
        @$conn->exec("PRAGMA synchronous = NORMAL;");
    }
    TTransaction::close();
} catch (\Throwable $e) {
    error_log("Database connection note: " . $e->getMessage());
}

// 3. Setup Request binding
$app->singleton(Request::class, function () {
    return Request::getInstance();
});
$app->bind('request', function ($c) {
    return $c->make(Request::class);
});

// 4. Setup Security Context & Service
$app->singleton(SecurityContext::class, function () {
    return new SecurityContext();
});
$app->singleton(SecurityService::class, function ($c) {
    return new SecurityService($c->make(SecurityContext::class));
});

// 5. Boot AdvSoft Registry
Registry::boot();

// 6. Setup Clean RESTful URL Router for Adianti Core
\Adianti\Core\AdiantiCoreApplication::setRouter(function (string $url, bool $isAction = true) {
    parse_str($url, $params);
    $class = $params['class'] ?? null;
    $method = $params['method'] ?? null;
    unset($params['class'], $params['method']);

    if ($class) {
        $path = "/page/{$class}" . ($method ? "/{$method}" : "");
        $queryString = http_build_query($params);
        return $queryString ? "{$path}?{$queryString}" : $path;
    }

    return 'engine.php?' . $url;
});

return $app;
