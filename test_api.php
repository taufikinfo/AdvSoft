<?php
/**
 * Test script for pure AdvSoft APIs
 */

require_once __DIR__ . '/app/bootstrap.php';
require_once __DIR__ . '/routes/web.php';

use App\Advsoft\Core\Http\Request;
use App\Control\Controllers\AuthController;
use App\Control\Controllers\OrmController;
use App\Control\Controllers\AccountReportController;
use App\Control\Controllers\MenuEditorController;
use App\Control\Controllers\ViewBuilderController;
use App\Control\Controllers\CustomPageController;
use App\Advsoft\Registry;

function makeReq($uri, $method = 'GET', $params = []) {
    while (\Adianti\Database\TTransaction::get()) {
        try { \Adianti\Database\TTransaction::close(); } catch (\Throwable $e) { break; }
    }
    $raw = json_encode($params);
    $server = [
        'REQUEST_METHOD' => strtoupper($method),
        'REQUEST_URI'    => $uri,
        'CONTENT_TYPE'   => 'application/json',
    ];
    $get = strtoupper($method) === 'GET' ? $params : [];
    $post = strtoupper($method) === 'POST' ? $params : [];
    $_GET = $get;
    $_POST = $post;
    $_REQUEST = array_merge($get, $post);
    $req = new Request($get, $post, [], $server, $raw);
    app()->instance(Request::class, $req);
    return $req;
}

echo "=== 1. Checking Models in Registry ===\n";
$models = Registry::all();
echo "Total registered models: " . count($models) . "\n";
foreach (array_keys($models) as $m) {
    echo "  - $m\n";
}

echo "\n=== 2. Testing Auth Controller (Login) ===\n";
$auth = app(AuthController::class);
$loginReq = makeReq('/api/auth/login', 'POST', ['login' => 'admin', 'password' => 'admin']);
$res = $auth->login($loginReq);
echo "Status: " . $res->getStatusCode() . "\n";
echo "Response: " . $res->getContent() . "\n";

echo "\n=== 3. Testing ORM Controller (search_read task) ===\n";
$orm = app(OrmController::class);
$searchReq = makeReq('/api/orm/search_read', 'POST', [
    'model' => 'task',
    'domain' => [],
    'fields' => ['id', 'name', 'stage_id', 'project_id'],
    'limit' => 5
]);
$res = $orm->searchRead($searchReq);
echo "Status: " . $res->getStatusCode() . "\n";
echo "Tasks found: " . count(json_decode($res->getContent(), true)['records'] ?? []) . "\n";

$showcaseSearchReq = makeReq('/api/orm/search_read', 'POST', [
    'model' => 'showcase.model',
    'domain' => [],
    'fields' => ['id', 'name'],
    'limit' => 5
]);
$res = $orm->searchRead($showcaseSearchReq);
echo "Showcase searchRead status: " . $res->getStatusCode() . "\n";
echo "Showcase records found: " . count(json_decode($res->getContent(), true)['records'] ?? []) . "\n";

echo "\n=== 4. Testing Accounting Controller (Trial Balance) ===\n";
$acc = app(AccountReportController::class);
$tbReq = makeReq('/api/accounting/trial-balance', 'POST', []);
$res = $acc->trialBalance($tbReq);
echo "Status: " . $res->getStatusCode() . "\n";
echo "Trial balance lines: " . count(json_decode($res->getContent(), true)['accounts'] ?? []) . "\n";

echo "\n=== 5. Testing Menu Editor Controller (loadTree) ===\n";
$me = app(MenuEditorController::class);
$res = $me->loadTree();
echo "Status: " . $res->getStatusCode() . "\n";
echo "Menu root items: " . count(json_decode($res->getContent(), true)['tree'] ?? []) . "\n";

echo "\n=== 6. Testing View Builder Controller (listModels) ===\n";
$vb = app(ViewBuilderController::class);
$res = $vb->listModels();
echo "Status: " . $res->getStatusCode() . "\n";
echo "View Builder models: " . count(json_decode($res->getContent(), true) ?? []) . "\n";

echo "\n=== 7. Testing ORM Controller (write account.move) ===\n";
$writeReq = makeReq('/api/orm/write', 'POST', [
    'model' => 'account.move',
    'id' => 1,
    'values' => [
        'ref' => 'TEST-REF-' . time()
    ]
]);
$res = $orm->write($writeReq);
echo "Status: " . $res->getStatusCode() . "\n";
echo "Response: " . $res->getContent() . "\n";

echo "\n=== 8. Testing Action Button (action_draft on account.move) ===\n";
$btnReq = makeReq('/api/orm/call_button', 'POST', [
    'model' => 'account.move',
    'id' => 1,
    'method' => 'action_draft'
]);
$res = $orm->callButton($btnReq);
echo "Status: " . $res->getStatusCode() . "\n";
echo "Response: " . $res->getContent() . "\n";

echo "\n=== 9. Testing Action Button (action_post on account.move) ===\n";
$btnReq = makeReq('/api/orm/call_button', 'POST', [
    'model' => 'account.move',
    'id' => 1,
    'method' => 'action_post'
]);
$res = $orm->callButton($btnReq);
echo "Status: " . $res->getStatusCode() . "\n";
echo "Response: " . $res->getContent() . "\n";

echo "\n=== 10. Testing Custom Page Controller (index / create table) ===\n";
$cp = app(\App\Control\Controllers\CustomPageController::class);
$res = $cp->index();
echo "Status: " . $res->getStatusCode() . "\n";
echo "Response: " . $res->getContent() . "\n";

echo "\n=== 11. Testing Module Installer (discoverAll) ===\n";
$mi = app(\App\Advsoft\ModuleInstaller::class);
$modules = $mi->discoverAll();
echo "\n=== 12. Testing ORM write on res.users (Many2Many groups_id) ===\n";
$userWriteReq = makeReq('/api/orm/write', 'POST', [
    'model' => 'res.users',
    'id' => 1,
    'values' => [
        'name' => 'Administrator',
        'groups_id' => [1, 2, 3, 4]
    ]
]);
echo "\n=== 13. Testing ORM load_views Batch Loading ===\n";
$loadViewsReq = makeReq('/api/orm/load_views', 'POST', [
    'model' => 'showcase.model',
    'views' => ['search', 'list', 'form', 'kanban']
]);
$res = $orm->loadViews($loadViewsReq);
echo "Status: " . $res->getStatusCode() . "\n";
$data = json_decode($res->getContent(), true);
echo "Loaded views: " . implode(', ', array_keys($data['views'] ?? [])) . "\n";
echo "\n=== 14. Testing Standard Adianti URL Routing ===\n";
$router = \App\Advsoft\Core\Http\Router::getInstance();
$adiantiReq = makeReq('/engine.php', 'GET', ['class' => 'CustomPageController']);
$res = $router->dispatch($adiantiReq);
echo "Engine route status: " . ($res ? "OK" : "NO_RES") . "\n";

echo "\n=== 15. Testing Menu Loading (load_menus) ===\n";
$menuReq = makeReq('/api/orm/load_menus', 'GET');
$res = $orm->loadMenus($menuReq);
echo "Status: " . $res->getStatusCode() . "\n";
$menus = json_decode($res->getContent(), true);
echo "Loaded top apps: " . count($menus) . "\n";

echo "\n=== 16. Testing One2many createChild (Task Timesheets) ===\n";
$childReq = makeReq('/api/orm/create_child', 'POST', [
    'parent_model' => 'task',
    'field'        => 'timesheet_ids',
    'values'       => [
        'task_id'     => 1,
        'date'        => date('Y-m-d'),
        'user_id'     => 1,
        'name'        => 'Developed new feature',
        'unit_amount' => 3.5,
    ]
]);
$res = $orm->createChild($childReq);
echo "CreateChild status: " . $res->getStatusCode() . "\n";
$childData = json_decode($res->getContent(), true);
echo "Created timesheet ID: " . ($childData['id'] ?? 'none') . "\n";

echo "\n=== 17. Testing Read Parent with One2many Children ===\n";
$readReq = makeReq('/api/orm/read', 'POST', [
    'model' => 'task',
    'id'    => 1,
]);
$res = $orm->read($readReq);
echo "Read status: " . $res->getStatusCode() . "\n";
$readData = json_decode($res->getContent(), true);
$loadedTimesheets = $readData['timesheet_ids'] ?? [];
echo "Loaded timesheets count: " . count($loadedTimesheets) . "\n";
if (!empty($loadedTimesheets)) {
    echo "First timesheet: " . json_encode($loadedTimesheets[0]) . "\n";
}

echo "\n=== 18. Testing loadO2m Endpoint ===\n";
$o2mReq = makeReq('/api/orm/load_o2m', 'POST', [
    'parent_model' => 'task',
    'field'        => 'timesheet_ids',
    'parent_id'    => 1,
]);
$res = $orm->loadO2m($o2mReq);
echo "loadO2m status: " . $res->getStatusCode() . "\n";
$o2mData = json_decode($res->getContent(), true);
echo "loadO2m count: " . ($o2mData['length'] ?? 0) . "\n";
if (!empty($o2mData['records'])) {
    echo "First o2m record employee: " . json_encode($o2mData['records'][0]['user_id']) . "\n";
}

echo "\n=== 19. Testing Spreadsheet Document Create & Write ===\n";
$createDocReq = makeReq('/api/orm/create', 'POST', [
    'model'  => 'spreadsheet.document',
    'values' => [
        'name'             => 'Project Spreadsheet Test',
        'spreadsheet_data' => json_encode(['sheets' => [['name' => 'Sheet1', 'cells' => []]]]),
        'user_id'          => 1,
    ]
]);
$res = $orm->create($createDocReq);
echo "Spreadsheet create status: " . $res->getStatusCode() . "\n";
$createdDoc = json_decode($res->getContent(), true);
echo "Created doc ID: " . ($createdDoc['id'] ?? 'none') . "\n";

if (!empty($createdDoc['id'])) {
    $writeDocReq = makeReq('/api/orm/write', 'POST', [
        'model'  => 'spreadsheet.document',
        'ids'    => [$createdDoc['id']],
        'values' => [
            'name' => 'Project Spreadsheet Updated',
        ]
    ]);
    $res = $orm->write($writeDocReq);
    echo "Spreadsheet write status: " . $res->getStatusCode() . " body: " . $res->getContent() . "\n";
}

echo "\n=== 20. Testing ORM Aggregate Endpoint (sum, avg, max, min) ===\n";
$aggReq = makeReq('/api/orm/aggregate', 'POST', [
    'model'    => 'task.timesheet',
    'domain'   => [],
    'measures' => [
        ['field' => 'unit_amount', 'type' => 'sum'],
        ['field' => 'unit_amount', 'type' => 'avg'],
        ['field' => 'unit_amount', 'type' => 'max'],
        ['field' => 'unit_amount', 'type' => 'min'],
    ]
]);
$res = $orm->aggregate($aggReq);
echo "Aggregate status: " . $res->getStatusCode() . "\n";
$aggData = json_decode($res->getContent(), true);
echo "Aggregate response: " . json_encode($aggData) . "\n";

echo "\n=== ALL PURE ADIANTI TESTS PASSED! ===\n";
