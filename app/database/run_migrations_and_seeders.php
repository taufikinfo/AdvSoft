<?php
require_once __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

$dbPath = __DIR__ . '/../../database/database.sqlite';
$container = app();

if (!function_exists('app_path')) {
    function app_path($path = '') {
        return __DIR__ . '/../' . ltrim($path, '/\\');
    }
}
if (!function_exists('bcrypt')) {
    function bcrypt($value, $options = []) {
        return password_hash($value, PASSWORD_BCRYPT, $options);
    }
}

echo "Starting migrations on: $dbPath\n";

$migrationFiles = glob(__DIR__ . '/../../database/migrations/*.php');
sort($migrationFiles);

foreach ($migrationFiles as $file) {
    echo "Running migration: " . basename($file) . " ... ";
    try {
        $migration = require $file;
        if (is_object($migration) && method_exists($migration, 'up')) {
            $migration->up();
            echo "OK\n";
        } else {
            echo "SKIPPED (no up method)\n";
        }
    } catch (\Throwable $e) {
        echo "NOTICE/ERROR: " . $e->getMessage() . "\n";
    }
}

echo "\nMigrations finished. Now seeding data...\n";

$seeders = [
    \Database\Seeders\TaskSeeder::class,
    \Database\Seeders\TimesheetSeeder::class,
    \Database\Seeders\ShowcaseSeeder::class,
    \Database\Seeders\MenuSeeder::class,
    \Database\Seeders\SecuritySeeder::class,
    \Database\Seeders\AccountingSeeder::class,
];

foreach ($seeders as $seederClass) {
    echo "Running seeder: $seederClass ... ";
    try {
        if (class_exists($seederClass)) {
            $seeder = new $seederClass();
            $seeder->run();
            echo "OK\n";
        } else {
            echo "CLASS NOT FOUND\n";
        }
    } catch (\Throwable $e) {
        echo "ERROR: " . $e->getMessage() . "\n";
    }
}

echo "\nDatabase migration & seeding completed!\n";
