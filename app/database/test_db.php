<?php
require_once __DIR__ . '/../../init.php';

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Events\Dispatcher;
use Illuminate\Container\Container;

$dbPath = file_exists(__DIR__ . '/database.sqlite') ? __DIR__ . '/database.sqlite' : __DIR__ . '/../../database/database.sqlite';
echo "Checking DB at: $dbPath\n";
echo "File exists: " . (file_exists($dbPath) ? "YES" : "NO") . "\n";

try {
    $pdo = new PDO("sqlite:{$dbPath}", null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);
    echo "Connected successfully via PDO! Tables count: " . count($tables) . "\n";
    foreach ($tables as $name) {
        echo " - " . $name . "\n";
    }
} catch (\Exception $e) {
    echo "DB Error: " . $e->getMessage() . "\n";
}
