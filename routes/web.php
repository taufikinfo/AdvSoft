<?php

use App\Advsoft\Core\Support\Route;
use App\Advsoft\Core\Http\Request;
use App\Advsoft\Core\Http\JsonResponse;
use App\Control\Controllers\OrmController;
use App\Control\Controllers\AuthController;
use App\Control\Controllers\ProfileController;
use App\Control\Controllers\SecurityController;
use App\Control\Controllers\MenuEditorController;
use App\Control\Controllers\SpreadsheetCollaborationController;
use App\Control\Controllers\ViewBuilderController;
use App\Control\Controllers\AccountReportController;
use App\Control\Controllers\ReportController;
use App\Control\Controllers\CustomPageController;
use App\Control\Controllers\HtmlFieldController;
use App\Control\Controllers\QWebController;

// Helper function to dispatch standard/legacy Adianti controllers
function handleAdiantiClassRoute(Request $request, string $class, ?string $method = null): mixed
{
    $cleanClass = str_replace(['/', '.'], ['\\', ''], $class);

    // Resolve class with fallback namespaces
    $resolvedClass = null;
    $candidates = [
        $cleanClass,
        "App\\Control\\{$cleanClass}",
        "App\\Control\\Controllers\\{$cleanClass}",
        "Addons\\Base\\Models\\{$cleanClass}",
    ];

    foreach ($candidates as $candidate) {
        if (class_exists($candidate)) {
            $resolvedClass = $candidate;
            break;
        }
    }

    if (!$resolvedClass) {
        return new \App\Advsoft\Core\Http\Response(
            "Adianti controller or page class '{$class}' not found.",
            404,
            ['Content-Type' => 'text/plain; charset=utf-8']
        );
    }

    // If it is an AdvSoft REST controller (instance of Controller)
    if (is_subclass_of($resolvedClass, \App\Control\Controllers\Controller::class)) {
        $methodName = $method ?: ($request->input('method') ?: 'index');
        $instance = new $resolvedClass();
        if (method_exists($instance, $methodName)) {
            return $instance->$methodName($request);
        }
    }

    // Set standard Adianti execution parameters
    $_GET['class'] = $resolvedClass;
    $_REQUEST['class'] = $resolvedClass;

    $methodName = $method ?: $request->input('method');
    if ($methodName) {
        $_GET['method'] = $methodName;
        $_REQUEST['method'] = $methodName;
    }

    if ($request->input('static')) {
        $_GET['static'] = '1';
        $_REQUEST['static'] = '1';
    }

    $hasTx = (bool) \Adianti\Database\TTransaction::get();
    if (!$hasTx) {
        try {
            \Adianti\Database\TTransaction::open('advsoft');
        } catch (\Throwable $e) {}
    }

    try {
        ob_start();
        \Adianti\Core\AdiantiCoreApplication::run();
        $output = ob_get_clean();

        if (\Adianti\Database\TTransaction::get()) {
            \Adianti\Database\TTransaction::close();
        }

        return new \App\Advsoft\Core\Http\Response(
            $output,
            200,
            ['Content-Type' => 'text/html; charset=utf-8']
        );
    } catch (\Throwable $e) {
        if (\Adianti\Database\TTransaction::get()) {
            \Adianti\Database\TTransaction::rollback();
        }
        throw $e;
    }
}

// Fallback Dynamic Class Loader for Standard Adianti Controllers
Route::any('/page/{class}/{method}', function (Request $request, string $class, string $method) {
    return handleAdiantiClassRoute($request, $class, $method);
});

Route::any('/page/{class}', function (Request $request, string $class) {
    return handleAdiantiClassRoute($request, $class);
});

Route::any('/adianti/{class}/{method}', function (Request $request, string $class, string $method) {
    return handleAdiantiClassRoute($request, $class, $method);
});

Route::any('/adianti/{class}', function (Request $request, string $class) {
    return handleAdiantiClassRoute($request, $class);
});

Route::any('/app/{class}/{method}', function (Request $request, string $class, string $method) {
    return handleAdiantiClassRoute($request, $class, $method);
});

Route::any('/app/{class}', function (Request $request, string $class) {
    return handleAdiantiClassRoute($request, $class);
});

// Main SPA & Standard Adianti Controller entry point
Route::any('/engine.php', function (Request $request) {
    $class = $request->input('class');
    if ($class) {
        return handleAdiantiClassRoute($request, $class, $request->input('method'));
    }
    return response()->json(['status' => 'ok']);
});

Route::any('/index.php', function (Request $request) {
    $class = $request->input('class');
    if ($class) {
        if ($request->ajax() || $request->input('static') || $request->isMethod('POST')) {
            return handleAdiantiClassRoute($request, $class, $request->input('method'));
        }
        $query = http_build_query($_GET);
        header("Location: /#{$query}");
        exit;
    }
    $user = app(\App\Advsoft\Security\SecurityContext::class)->getUser();
    if (!$user) {
        return view('landing');
    }
    return view('welcome');
});

Route::get('/', function (Request $request) {
    $class = $request->input('class');
    if ($class) {
        if ($request->ajax() || $request->input('static')) {
            ob_start();
            \Adianti\Core\AdiantiCoreApplication::run();
            return ob_get_clean();
        }
        $query = http_build_query($_GET);
        header("Location: /#{$query}");
        exit;
    }
    $user = app(\App\Advsoft\Security\SecurityContext::class)->getUser();
    if (!$user) {
        return view('landing');
    }
    return view('welcome');
});

Route::get('/landing', function (Request $request) {
    return view('landing');
})->name('landing');

Route::get('/login', function (Request $request) {
    if (app(\App\Advsoft\Security\SecurityContext::class)->getUser()) {
        header('Location: /');
        exit;
    }
    return view('login');
})->name('login');

Route::get('/register', function (Request $request) {
    if (app(\App\Advsoft\Security\SecurityContext::class)->getUser()) {
        header('Location: /');
        exit;
    }
    return view('register');
})->name('register');

Route::get('/logout', function (Request $request) {
    app(\App\Advsoft\Security\SecurityContext::class)->logout();
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
    header('Location: /login');
    exit;
})->name('logout');

// ================================================================
// Profile routes
// ================================================================
Route::prefix('profile')->group(function () {
    Route::get('/',         [ProfileController::class, 'show'])->name('profile.show');
    Route::post('/',        [ProfileController::class, 'update'])->name('profile.update');
    Route::get('/password', [ProfileController::class, 'showPassword'])->name('profile.password.show');
    Route::post('/password',[ProfileController::class, 'updatePassword'])->name('profile.password.update');
});

// ================================================================
// Security admin API
// ================================================================
Route::prefix('api/security')->group(function () {
    Route::get('/overview',             [SecurityController::class, 'overview']);
    Route::get('/diagnostics',          [SecurityController::class, 'diagnostics']);
    Route::post('/sync-models',         [SecurityController::class, 'syncModels']);

    // ACL matrix
    Route::get('/acl/matrix',           [SecurityController::class, 'aclMatrix']);
    Route::post('/acl/toggle',          [SecurityController::class, 'toggleAcl']);

    // Groups
    Route::get('/groups/{id}/users',    [SecurityController::class, 'groupUsers']);

    // Users
    Route::post('/users',               [SecurityController::class, 'createUser']);
    Route::post('/users/{id}/password', [SecurityController::class, 'resetPassword']);
    Route::post('/users/{id}/groups',   [SecurityController::class, 'setUserGroups']);
});

// ================================================================
// Authentication routes
// ================================================================
Route::prefix('api/auth')->group(function () {
    Route::post('/login',    [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/logout',   [AuthController::class, 'logout']);
    Route::get('/me',        [AuthController::class, 'me']);
    Route::get('/menu',      [AuthController::class, 'menu']);
});

// ================================================================
// ORM-style API routes
// ================================================================
Route::prefix('api/orm')->group(function () {
    // Core CRUD
    Route::post('/search_read',       [OrmController::class, 'searchRead']);
    Route::get('/search_read',        [OrmController::class, 'searchRead']);
    Route::post('/read',              [OrmController::class, 'read']);
    Route::get('/read',               [OrmController::class, 'read']);
    Route::post('/create',            [OrmController::class, 'create']);
    Route::post('/write',             [OrmController::class, 'write']);
    Route::post('/unlink',            [OrmController::class, 'unlink']);

    // Metadata & Views
    Route::post('/load_views',        [OrmController::class, 'loadViews']);
    Route::get('/load_views',         [OrmController::class, 'loadViews']);
    Route::post('/fields_get',        [OrmController::class, 'fieldsGet']);
    Route::get('/fields_get',         [OrmController::class, 'fieldsGet']);
    Route::post('/get_view',          [OrmController::class, 'getViewDef']);
    Route::get('/get_view',           [OrmController::class, 'getViewDef']);
    Route::post('/read_group',        [OrmController::class, 'readGroup']);
    Route::get('/read_group',         [OrmController::class, 'readGroup']);
    Route::post('/onchange',          [OrmController::class, 'onchange']);
    Route::post('/call_button',       [OrmController::class, 'callButton']);
    Route::post('/call_button_multi', [OrmController::class, 'callButtonMulti']);
    Route::post('/aggregate',         [OrmController::class, 'aggregate']);
    Route::post('/name_search',       [OrmController::class, 'nameSearch']);
    Route::get('/name_search',        [OrmController::class, 'nameSearch']);
    Route::post('/quick_create',      [OrmController::class, 'quickCreate']);
    Route::post('/default_get',       [OrmController::class, 'defaultGet']);
    Route::get('/default_get',        [OrmController::class, 'defaultGet']);
    Route::post('/model_info',        [OrmController::class, 'modelInfo']);
    Route::get('/model_info',         [OrmController::class, 'modelInfo']);

    // One2many child CRUD
    Route::post('/create_child',      [OrmController::class, 'createChild']);
    Route::put('/update_child/{id}',  [OrmController::class, 'updateChild']);
    Route::delete('/delete_child/{id}', [OrmController::class, 'deleteChild']);
    Route::post('/onchange_o2m',      [OrmController::class, 'onchangeO2m']);
    Route::post('/load_o2m',          [OrmController::class, 'loadO2m']);
    Route::post('/load_o2m_grouped',  [OrmController::class, 'loadO2mGrouped']);
    Route::post('/bulk_create_child', [OrmController::class, 'bulkCreateChild']);
    Route::post('/bulk_delete_child', [OrmController::class, 'bulkDeleteChild']);
    Route::post('/bulk_write_child',  [OrmController::class, 'bulkWriteChild']);
    Route::post('/reorder_o2m',       [OrmController::class, 'reorderO2m']);
    Route::post('/call_button_o2m',   [OrmController::class, 'callButtonO2m']);
    Route::post('/print_o2m',         [OrmController::class, 'printO2m']);

    // Model introspection
    Route::get('/models',             [OrmController::class, 'listModels']);

    // Menu system
    Route::get('/load_menus',         [OrmController::class, 'loadMenus']);
    Route::post('/load_action',       [OrmController::class, 'loadAction']);
    Route::get('/load_action',        [OrmController::class, 'loadAction']);
});

// ================================================================
// Menu Editor API
// ================================================================
Route::prefix('api/menu-editor')->group(function () {
    Route::get('/tree',               [MenuEditorController::class, 'loadTree']);
    Route::post('/save-tree',         [MenuEditorController::class, 'saveTree']);
    Route::post('/create',            [MenuEditorController::class, 'createMenu']);
    Route::put('/update/{id}',        [MenuEditorController::class, 'updateMenu']);
    Route::delete('/delete/{id}',     [MenuEditorController::class, 'deleteMenu']);
    Route::post('/move',              [MenuEditorController::class, 'moveMenu']);
    Route::post('/toggle-active',     [MenuEditorController::class, 'toggleActive']);
    Route::post('/reorder',           [MenuEditorController::class, 'reorder']);
    Route::get('/available-models',   [MenuEditorController::class, 'availableModels']);
    Route::get('/available-actions',  [MenuEditorController::class, 'availableActions']);
    Route::post('/create-action',     [MenuEditorController::class, 'createAction']);
    Route::get('/export',             [MenuEditorController::class, 'exportTree']);
    Route::post('/import',            [MenuEditorController::class, 'importTree']);
});

// ================================================================
// Spreadsheet Collaboration API
// ================================================================
Route::prefix('api/spreadsheet')->group(function () {
    Route::post('/presence',       [SpreadsheetCollaborationController::class, 'presence']);
    Route::post('/publish',        [SpreadsheetCollaborationController::class, 'publish']);
    Route::post('/apply_op',       [SpreadsheetCollaborationController::class, 'applyOp']);
    Route::post('/batch_publish',  [SpreadsheetCollaborationController::class, 'batchPublish']);
    Route::post('/longpoll',       [SpreadsheetCollaborationController::class, 'longpoll']);
    Route::get('/fetch_ops',       [SpreadsheetCollaborationController::class, 'fetchOps']);
    Route::get('/history',         [SpreadsheetCollaborationController::class, 'history']);
    Route::post('/cleanup',        [SpreadsheetCollaborationController::class, 'cleanup']);
});

// ================================================================
// View Builder API
// ================================================================
Route::prefix('api/view-builder')->group(function () {
    Route::get('/models',              [ViewBuilderController::class, 'listModels']);
    Route::post('/fields',             [ViewBuilderController::class, 'loadFields']);
    Route::post('/load-view',          [ViewBuilderController::class, 'loadView']);
    Route::post('/save-view',          [ViewBuilderController::class, 'saveView']);
    Route::post('/preview-xml',        [ViewBuilderController::class, 'previewXml']);
    Route::delete('/delete-view/{id}', [ViewBuilderController::class, 'deleteView']);
    Route::get('/custom-views',        [ViewBuilderController::class, 'listCustomViews']);
    Route::post('/export-code',        [ViewBuilderController::class, 'exportCode']);
});

// ================================================================
// Accounting Financial Reports API
// ================================================================
Route::prefix('api/accounting')->group(function () {
    Route::post('/trial-balance',     [AccountReportController::class, 'trialBalance']);
    Route::post('/general-ledger',    [AccountReportController::class, 'generalLedger']);
    Route::post('/balance-sheet',     [AccountReportController::class, 'balanceSheet']);
    Route::post('/income-statement',  [AccountReportController::class, 'incomeStatement']);
});

// ================================================================
// Report Generator API
// ================================================================
Route::prefix('api/report')->group(function () {
    Route::get('/actions',          [ReportController::class, 'getPrintActions']);
    Route::get('/pdf/{report_id}',  [ReportController::class, 'downloadPdf']);
    Route::get('/html/{report_id}', [ReportController::class, 'previewHtml']);
});

// Saved filters
Route::prefix('api')->group(function () {
    Route::get('/filters',         [OrmController::class, 'getFilters']);
    Route::post('/filters',        [OrmController::class, 'saveFilter']);
    Route::delete('/filters/{id}', [OrmController::class, 'deleteFilter']);
});

// Custom Page API
Route::prefix('api/custom-page')->group(function () {
    Route::post('/items',         [CustomPageController::class, 'index']);
    Route::post('/items/create',  [CustomPageController::class, 'create']);
    Route::post('/items/update',  [CustomPageController::class, 'update']);
    Route::post('/items/delete',  [CustomPageController::class, 'delete']);
});

// Rich-Text Editor (RTE)
Route::prefix('api/html-field')->group(function () {
    Route::post('/image-upload', [HtmlFieldController::class, 'uploadImage']);
    Route::post('/embeds',       [HtmlFieldController::class, 'embeds']);
    Route::post('/mentions',     [HtmlFieldController::class, 'mentions']);
    Route::post('/sanitize',     [HtmlFieldController::class, 'sanitize']);
    Route::get('/config',        [HtmlFieldController::class, 'config']);
});

// Module Management API
Route::prefix('api/modules')->group(function () {
    Route::get('/discover', function (Request $request) {
        $installer = app(\App\Advsoft\ModuleInstaller::class);
        $modules = $installer->discoverAll();
        return response()->json(['modules' => $modules->map(fn($m) => $m->toArray())]);
    });
    Route::post('/install', function (Request $request) {
        $installer = app(\App\Advsoft\ModuleInstaller::class);
        try {
            $installer->install($request->input('module'));
            return response()->json(['success' => true, 'message' => "Module installed."]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    });
    Route::post('/upgrade', function (Request $request) {
        $installer = app(\App\Advsoft\ModuleInstaller::class);
        try {
            $installer->upgrade($request->input('module'));
            return response()->json(['success' => true, 'message' => "Module upgraded."]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    });
});

// System Config API
Route::prefix('api/config')->group(function () {
    Route::get('/params', function (Request $request) {
        return response()->json(\App\Model\Ir\IrConfigParameter::getAllParams());
    });
    Route::get('/param/{key}', function (Request $request, string $key) {
        return response()->json(['value' => \App\Model\Ir\IrConfigParameter::getParam($key)]);
    });
    Route::post('/param', function (Request $request) {
        \App\Model\Ir\IrConfigParameter::setParam($request->input('key'), $request->input('value'));
        return response()->json(['success' => true]);
    });
});

// Sequence API
Route::prefix('api/sequence')->group(function () {
    Route::post('/next', function (Request $request) {
        $code = $request->input('code');
        $companyId = $request->input('company_id');
        $value = \App\Model\Ir\IrSequence::nextByCode($code, $companyId);
        return response()->json(['value' => $value]);
    });
});

// QWeb Template Engine API
Route::prefix('api/qweb')->group(function () {
    Route::get('/templates',        [QWebController::class, 'index']);
    Route::get('/template/{id}',    [QWebController::class, 'show']);
    Route::post('/template',        [QWebController::class, 'save']);
    Route::delete('/template/{id}', [QWebController::class, 'destroy']);
    Route::post('/preview',         [QWebController::class, 'preview']);
    Route::post('/validate',        [QWebController::class, 'validate']);
    Route::post('/clear-cache',     [QWebController::class, 'clearCache']);
});
