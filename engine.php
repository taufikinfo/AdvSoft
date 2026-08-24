<?php

/**
 * AdvSoft — Standard Adianti Framework Engine Gateway.
 * Dispatches standard Adianti controller actions via class & method parameters.
 */

require_once __DIR__ . '/app/bootstrap.php';

use Adianti\Core\AdiantiCoreApplication;
use Adianti\Database\TTransaction;

try {
    AdiantiCoreApplication::run();
    if (TTransaction::get()) {
        TTransaction::close();
    }
} catch (\Throwable $e) {
    if (TTransaction::get()) {
        TTransaction::rollback();
    }
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => $e->getMessage(),
        'file'  => $e->getFile(),
        'line'  => $e->getLine(),
    ]);
}
