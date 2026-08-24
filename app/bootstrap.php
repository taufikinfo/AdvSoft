<?php
/**
 * Adiantisoft Application Bootstrap — Pure Adianti PHP Framework
 * Initializes Adianti Core, Service Container, Security Context, and Odoo Registry.
 */

require_once __DIR__ . '/../init.php';
require_once __DIR__ . '/Odoo/Core/Application.php';
require_once __DIR__ . '/Odoo/Core/helpers.php';

use App\Odoo\Core\Application;
use App\Odoo\Core\Http\Request;
use App\Odoo\Core\Support\Log;
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

// Register domain model & core aliases
$modelAliases = [
    'App\Core\Application'                => \App\Odoo\Core\Application::class,
    'App\Core\Http\Request'               => \App\Odoo\Core\Http\Request::class,
    'App\Core\Http\Response'              => \App\Odoo\Core\Http\Response::class,
    'App\Core\Http\JsonResponse'          => \App\Odoo\Core\Http\JsonResponse::class,
    'App\Core\Http\Router'                => \App\Odoo\Core\Http\Router::class,
    'App\Core\Support\Route'              => \App\Odoo\Core\Support\Route::class,
    'App\Core\Support\Log'                => \App\Odoo\Core\Support\Log::class,
    'App\Core\Support\Str'                => \App\Odoo\Core\Support\Str::class,
    'App\Core\Support\Collection'         => \App\Odoo\Core\Support\Collection::class,
    'App\Core\Support\AssetCompiler'      => \App\Odoo\Core\Support\AssetCompiler::class,
    'App\Core\View\ViewEngine'            => \App\Odoo\Core\View\ViewEngine::class,
    'App\Core\Database\QueryBuilder'      => \App\Odoo\Core\Database\QueryBuilder::class,
    'App\Core\Database\SchemaManager'     => \App\Odoo\Core\Database\SchemaManager::class,
    'App\Core\Database\Seeder'            => \App\Odoo\Core\Database\Seeder::class,
    'App\Model\Project'                   => \App\Model\Project\Project::class,
    'App\Model\Task'                      => \App\Model\Project\Task::class,
    'App\Model\Stage'                     => \App\Model\Project\Stage::class,
    'App\Model\Tag'                       => \App\Model\Project\Tag::class,
    'App\Model\TaskTimesheet'             => \App\Model\Project\TaskTimesheet::class,
    'App\Model\SpreadsheetDocument'       => \App\Model\Spreadsheet\SpreadsheetDocument::class,
    'App\Model\SpreadsheetCollaboration'  => \App\Model\Spreadsheet\SpreadsheetCollaboration::class,
    'App\Model\SpreadsheetOperation'      => \App\Model\Spreadsheet\SpreadsheetOperation::class,
    'App\Model\Action'                    => \App\Model\Base\Action::class,
    'App\Model\Menu'                      => \App\Model\Base\Menu::class,
    'App\Model\SavedFilter'               => \App\Model\Base\SavedFilter::class,
    'App\Model\Showcase'                  => \App\Model\Base\Showcase::class,
    'App\Models\Project'                  => \App\Model\Project\Project::class,
    'App\Models\Task'                     => \App\Model\Project\Task::class,
    'App\Models\Stage'                    => \App\Model\Project\Stage::class,
    'App\Models\Tag'                      => \App\Model\Project\Tag::class,
    'App\Models\TaskTimesheet'            => \App\Model\Project\TaskTimesheet::class,
    'App\Models\SpreadsheetDocument'      => \App\Model\Spreadsheet\SpreadsheetDocument::class,
    'App\Models\SpreadsheetCollaboration' => \App\Model\Spreadsheet\SpreadsheetCollaboration::class,
    'App\Models\SpreadsheetOperation'     => \App\Model\Spreadsheet\SpreadsheetOperation::class,
    'App\Models\Action'                   => \App\Model\Base\Action::class,
    'App\Models\Menu'                     => \App\Model\Base\Menu::class,
    'App\Models\SavedFilter'              => \App\Model\Base\SavedFilter::class,
    'App\Models\Showcase'                 => \App\Model\Base\Showcase::class,
    'App\Http\Controllers\AccountReportController'            => \App\Control\Controllers\AccountReportController::class,
    'App\Http\Controllers\AuthController'                     => \App\Control\Controllers\AuthController::class,
    'App\Http\Controllers\Controller'                         => \App\Control\Controllers\Controller::class,
    'App\Http\Controllers\CustomPageController'               => \App\Control\Controllers\CustomPageController::class,
    'App\Http\Controllers\HtmlFieldController'                => \App\Control\Controllers\HtmlFieldController::class,
    'App\Http\Controllers\MenuEditorController'               => \App\Control\Controllers\MenuEditorController::class,
    'App\Http\Controllers\OrmController'                      => \App\Control\Controllers\OrmController::class,
    'App\Http\Controllers\ProfileController'                  => \App\Control\Controllers\ProfileController::class,
    'App\Http\Controllers\QWebController'                     => \App\Control\Controllers\QWebController::class,
    'App\Http\Controllers\ReportController'                   => \App\Control\Controllers\ReportController::class,
    'App\Http\Controllers\SecurityController'                 => \App\Control\Controllers\SecurityController::class,
    'App\Http\Controllers\SpreadsheetCollaborationController' => \App\Control\Controllers\SpreadsheetCollaborationController::class,
    'App\Http\Controllers\ViewBuilderController'              => \App\Control\Controllers\ViewBuilderController::class,
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
