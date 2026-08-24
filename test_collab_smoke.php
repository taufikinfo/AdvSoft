<?php
/** Smoke test for Spreadsheet Collaboration API endpoints. */

require_once __DIR__ . '/app/bootstrap.php';
require_once __DIR__ . '/routes/web.php';

use App\Advsoft\Core\Http\Request;
use App\Control\Controllers\AuthController;
use App\Control\Controllers\SpreadsheetCollaborationController;

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
    $req = new Request($get, $post, [], $server, $raw);
    app()->instance(Request::class, $req);
    return $req;
}

$fail = 0;
function check($label, $cond) {
    global $fail;
    echo ($cond ? "  [PASS] " : "  [FAIL] ") . $label . PHP_EOL;
    if (!$cond) $fail++;
}

// Login as admin so SecurityContext has a user
$auth = app(AuthController::class);
$auth->login(makeReq('/api/auth/login', 'POST', ['login' => 'admin', 'password' => 'admin']));

function closeAllTransactions() {
    while (\Adianti\Database\TTransaction::get()) {
        try { \Adianti\Database\TTransaction::close(); } catch (\Throwable $e) { break; }
    }
}

function cleanupTestData() {
    closeAllTransactions();
    \Adianti\Database\TTransaction::open('advsoft');
    \Adianti\Database\TTransaction::get()->exec("DELETE FROM spreadsheet_operations WHERE spreadsheet_id = 999001");
    \Adianti\Database\TTransaction::get()->exec("DELETE FROM spreadsheet_collaboration WHERE spreadsheet_id = 999001");
    \Adianti\Database\TTransaction::close();
}

cleanupTestData();

$ctrl = app(SpreadsheetCollaborationController::class);

echo "=== presence ===" . PHP_EOL;
$res = $ctrl->presence(makeReq('/api/spreadsheet/presence', 'POST', [
    'spreadsheet_id' => 1, 'cursor_col' => 2, 'cursor_row' => 3, 'selection' => 'A1:B2',
]));
$body = json_decode($res->getContent(), true);
check('presence success', $body['success'] === true);
check('presence returns cursors array', is_array($body['cursors']));

echo "=== apply_op (server-assigned revision) ===" . PHP_EOL;
$res = $ctrl->applyOp(makeReq('/api/spreadsheet/apply_op', 'POST', [
    'spreadsheet_id' => 999001,
    'operation' => ['type' => 'cellUpdate', 'col' => 0, 'row' => 0, 'value' => 'hello'],
]));
$body = json_decode($res->getContent(), true);
check('apply_op success', $body['success'] === true);
check('revision assigned = 1', ($body['revision'] ?? 0) === 1);

$res = $ctrl->applyOp(makeReq('/api/spreadsheet/apply_op', 'POST', [
    'spreadsheet_id' => 999001,
    'operation' => ['type' => 'cellUpdate', 'col' => 1, 'row' => 0, 'value' => 'world'],
]));
$body = json_decode($res->getContent(), true);
check('revision increments = 2', ($body['revision'] ?? 0) === 2);

echo "=== batch_publish ===" . PHP_EOL;
$res = $ctrl->batchPublish(makeReq('/api/spreadsheet/batch_publish', 'POST', [
    'spreadsheet_id' => 999001,
    'operations' => [
        ['type' => 'cellUpdate', 'col' => 0, 'row' => 1, 'value' => 'a'],
        ['type' => 'cellUpdate', 'col' => 0, 'row' => 2, 'value' => 'b'],
    ],
]));
$body = json_decode($res->getContent(), true);
check('batch stored 2', ($body['stored'] ?? 0) === 2);
check('batch revisions', ($body['revisions'] ?? []) === [3, 4]);

echo "=== longpoll ===" . PHP_EOL;
$res = $ctrl->longpoll(makeReq('/api/spreadsheet/longpoll', 'POST', [
    'spreadsheet_id' => 999001, 'since_rev' => 0,
]));
$body = json_decode($res->getContent(), true);
check('longpoll 4 messages', count($body['messages'] ?? []) === 4);
check('last_revision = 4', ($body['last_revision'] ?? 0) === 4);
check('message has sender', isset($body['messages'][0]['sender']));
check('message type preserved', ($body['messages'][0]['type'] ?? '') === 'cellUpdate');

$res = $ctrl->longpoll(makeReq('/api/spreadsheet/longpoll', 'POST', [
    'spreadsheet_id' => 999001, 'since_rev' => 3,
]));
$body = json_decode($res->getContent(), true);
check('longpoll since 3 returns 1', count($body['messages'] ?? []) === 1);

echo "=== fetch_ops ===" . PHP_EOL;
$res = $ctrl->fetchOps(makeReq('/api/spreadsheet/fetch_ops', 'GET', [
    'spreadsheet_id' => 999001, 'since_rev' => 0,
]));
$body = json_decode($res->getContent(), true);
check('fetch_ops 4 rows', count($body['ops'] ?? []) === 4);
check('op fields', isset($body['ops'][0]['revision'], $body['ops'][0]['type'], $body['ops'][0]['data'], $body['ops'][0]['appliedAt']));

echo "=== history ===" . PHP_EOL;
$res = $ctrl->history(makeReq('/api/spreadsheet/history', 'GET', [
    'spreadsheet_id' => 999001, 'limit' => 2,
]));
$body = json_decode($res->getContent(), true);
check('history limit 2 (latest first)', count($body['ops'] ?? []) === 2 && ($body['ops'][0]['revision'] ?? 0) === 4);

echo "=== cleanup ===" . PHP_EOL;
$res = $ctrl->cleanup(makeReq('/api/spreadsheet/cleanup', 'POST', []));
$body = json_decode($res->getContent(), true);
check('cleanup success', $body['success'] === true);

cleanupTestData();

echo PHP_EOL . ($fail === 0 ? "ALL SMOKE TESTS PASSED" : "{$fail} FAILURES") . PHP_EOL;
exit($fail === 0 ? 0 : 1);
