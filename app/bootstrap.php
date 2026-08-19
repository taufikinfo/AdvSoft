<?php
/**
 * Adiantisoft Application Bootstrap — Pure Adianti PHP Framework
 * Initializes Adianti Core, Service Container, Security Context, and Odoo Registry.
 */

require_once __DIR__ . '/../init.php';
require_once __DIR__ . '/Core/Application.php';
require_once __DIR__ . '/Core/helpers.php';

use App\Core\Application;
use App\Core\Http\Request;
use App\Core\Support\Log;
use App\Odoo\Security\SecurityContext;
use App\Odoo\Security\SecurityService;
use App\Odoo\Registry;
use Adianti\Database\TTransaction;

if (!class_exists('Log')) {
    class_alias(Log::class, 'Log');
}
if (!class_exists('Illuminate\Support\Facades\Log')) {
    class_alias(Log::class, 'Illuminate\Support\Facades\Log');
}

// Register domain model aliases
$modelAliases = [
    'App\Models\Project'                  => \App\Models\Project\Project::class,
    'App\Models\Task'                     => \App\Models\Project\Task::class,
    'App\Models\Stage'                    => \App\Models\Project\Stage::class,
    'App\Models\Tag'                      => \App\Models\Project\Tag::class,
    'App\Models\TaskTimesheet'            => \App\Models\Project\TaskTimesheet::class,
    'App\Models\SpreadsheetDocument'      => \App\Models\Spreadsheet\SpreadsheetDocument::class,
    'App\Models\SpreadsheetCollaboration' => \App\Models\Spreadsheet\SpreadsheetCollaboration::class,
    'App\Models\SpreadsheetOperation'     => \App\Models\Spreadsheet\SpreadsheetOperation::class,
    'App\Models\Action'                   => \App\Models\Base\Action::class,
    'App\Models\Menu'                     => \App\Models\Base\Menu::class,
    'App\Models\SavedFilter'              => \App\Models\Base\SavedFilter::class,
    'App\Models\Showcase'                 => \App\Models\Base\Showcase::class,
];
foreach ($modelAliases as $alias => $target) {
    if (!class_exists($alias, false)) {
        class_alias($target, $alias);
    }
}

// 1. Initialize Dependency Container
$basePath = realpath(__DIR__ . '/..');
$app = new Application($basePath);

// 2. Ensure Database Connection / Transaction is ready
try {
    if (!TTransaction::get()) {
        TTransaction::open('adiantisoft');
    }
    $conn = TTransaction::get();
    if ($conn instanceof \PDO) {
        @$conn->exec("PRAGMA journal_mode = WAL;");
        @$conn->exec("PRAGMA busy_timeout = 10000;");
        @$conn->exec("PRAGMA synchronous = NORMAL;");
    }
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

// 5. Boot Odoo Registry
Registry::boot();

return $app;
