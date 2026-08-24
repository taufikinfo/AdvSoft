<?php
/**
 * AdvSoft Application Bootstrap — Pure Adianti PHP Framework
 * Initializes Adianti Core, Service Container, Security Context, and Odoo Registry.
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

// Register domain model, core, and legacy aliases
$modelAliases = [
    // Core Aliases
    'App\Core\Application'                => \App\Advsoft\Core\Application::class,
    'App\Core\Http\Request'               => \App\Advsoft\Core\Http\Request::class,
    'App\Core\Http\Response'              => \App\Advsoft\Core\Http\Response::class,
    'App\Core\Http\JsonResponse'          => \App\Advsoft\Core\Http\JsonResponse::class,
    'App\Core\Http\Router'                => \App\Advsoft\Core\Http\Router::class,
    'App\Core\Support\Route'              => \App\Advsoft\Core\Support\Route::class,
    'App\Core\Support\Log'                => \App\Advsoft\Core\Support\Log::class,
    'App\Core\Support\Str'                => \App\Advsoft\Core\Support\Str::class,
    'App\Core\Support\Collection'         => \App\Advsoft\Core\Support\Collection::class,
    'App\Core\Support\AssetCompiler'      => \App\Advsoft\Core\Support\AssetCompiler::class,
    'App\Core\View\ViewEngine'            => \App\Advsoft\Core\View\ViewEngine::class,
    'App\Core\Database\QueryBuilder'      => \App\Advsoft\Core\Database\QueryBuilder::class,
    'App\Core\Database\SchemaManager'     => \App\Advsoft\Core\Database\SchemaManager::class,
    'App\Core\Database\Seeder'            => \App\Advsoft\Core\Database\Seeder::class,
    // Odoo Legacy Aliases
    'App\Odoo\Registry'                   => \App\Advsoft\Registry::class,
    'App\Odoo\Field'                      => \App\Advsoft\Field::class,
    'App\Odoo\Domain'                     => \App\Advsoft\Domain::class,
    'App\Odoo\ModelDefinition'            => \App\Advsoft\ModelDefinition::class,
    'App\Odoo\ModuleInstaller'            => \App\Advsoft\ModuleInstaller::class,
    'App\Odoo\DataFileLoader'             => \App\Advsoft\DataFileLoader::class,
    'App\Odoo\Security\SecurityContext'   => \App\Advsoft\Security\SecurityContext::class,
    'App\Odoo\Security\SecurityService'   => \App\Advsoft\Security\SecurityService::class,
    'App\Odoo\Core\Application'           => \App\Advsoft\Core\Application::class,
    'App\Odoo\Core\Http\Request'          => \App\Advsoft\Core\Http\Request::class,
    'App\Odoo\Core\Http\Response'         => \App\Advsoft\Core\Http\Response::class,
    'App\Odoo\Core\Http\JsonResponse'     => \App\Advsoft\Core\Http\JsonResponse::class,
    'App\Odoo\Core\Http\Router'           => \App\Advsoft\Core\Http\Router::class,
    'App\Odoo\Core\Support\Route'         => \App\Advsoft\Core\Support\Route::class,
    'App\Odoo\Core\Support\Log'           => \App\Advsoft\Core\Support\Log::class,
    'App\Odoo\Core\Support\Str'           => \App\Advsoft\Core\Support\Str::class,
    'App\Odoo\Core\Support\Collection'    => \App\Advsoft\Core\Support\Collection::class,
    'App\Odoo\Core\Support\AssetCompiler' => \App\Advsoft\Core\Support\AssetCompiler::class,
    'App\Odoo\Core\View\ViewEngine'       => \App\Advsoft\Core\View\ViewEngine::class,
    'App\Odoo\Core\Database\QueryBuilder' => \App\Advsoft\Core\Database\QueryBuilder::class,
    'App\Odoo\Core\Database\SchemaManager'=> \App\Advsoft\Core\Database\SchemaManager::class,
    'App\Odoo\Core\Database\Seeder'       => \App\Advsoft\Core\Database\Seeder::class,
    // Model Aliases
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

// 5. Boot Odoo Registry
Registry::boot();

return $app;
