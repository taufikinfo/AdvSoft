<?php
require_once __DIR__ . '/../../init.php';

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Events\Dispatcher;
use Illuminate\Container\Container;

$dbPath = __DIR__ . '/../../database/database.sqlite';
echo "Checking DB at: $dbPath\n";
echo "File exists: " . (file_exists($dbPath) ? "YES" : "NO") . "\n";

$capsule = new Capsule;
$capsule->addConnection([
    'driver'    => 'sqlite',
    'database'  => $dbPath,
    'prefix'    => '',
]);
$capsule->setEventDispatcher(new Dispatcher(new Container));
$capsule->setAsGlobal();
$capsule->bootEloquent();

try {
    $tables = Capsule::select("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    echo "Connected successfully! Tables count: " . count($tables) . "\n";
    foreach ($tables as $t) {
        echo " - " . $t->name . "\n";
    }
} catch (\Exception $e) {
    echo "DB Error: " . $e->getMessage() . "\n";
}
