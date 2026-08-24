<?php
/**
 * AdvSoft — SQLite to MySQL Migration Script
 * Usage: php app/database/migrate_to_mysql.php
 */

$sqliteFile = file_exists(__DIR__ . '/database.sqlite') ? __DIR__ . '/database.sqlite' : __DIR__ . '/../../database/database.sqlite';
$iniPath    = __DIR__ . '/../config/advsoft.ini';

$ini = parse_ini_file($iniPath);
$mysqlHost = $ini['host'] ?? '127.0.0.1';
$mysqlPort = $ini['port'] ?? '3306';
$mysqlUser = $ini['user'] ?? 'root';
$mysqlPass = $ini['pass'] ?? '';
$mysqlDb   = $ini['name'] ?? 'advsoft';

echo "=== AdvSoft Database Migration to MySQL ===\n";
echo "Host: {$mysqlHost}:{$mysqlPort} | Database: {$mysqlDb} | User: {$mysqlUser}\n\n";

if (!file_exists($sqliteFile)) {
    die("Error: SQLite database file not found at {$sqliteFile}\n");
}

$sqlite = new PDO("sqlite:{$sqliteFile}", null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

$mysqlRoot = new PDO("mysql:host={$mysqlHost};port={$mysqlPort}", $mysqlUser, $mysqlPass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

echo "1. Ensuring database `{$mysqlDb}` exists...\n";
$mysqlRoot->exec("CREATE DATABASE IF NOT EXISTS `{$mysqlDb}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");

$mysql = new PDO("mysql:host={$mysqlHost};port={$mysqlPort};dbname={$mysqlDb};charset=utf8mb4", $mysqlUser, $mysqlPass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

echo "2. Inspecting and copying tables...\n";
$tables = $sqlite->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);

$mysql->exec("SET FOREIGN_KEY_CHECKS = 0;");

foreach ($tables as $table) {
    if (str_starts_with($table, 'sqlite_')) continue;

    $mysql->exec("DROP TABLE IF EXISTS `{$table}`;");

    $cols = $sqlite->query("PRAGMA table_info(\"{$table}\")")->fetchAll(PDO::FETCH_ASSOC);
    $colDefs = [];
    $pkCols = [];

    foreach ($cols as $col) {
        $cname = $col['name'];
        $rawType = strtoupper(trim($col['type']));
        $notNull = $col['notnull'] ? 'NOT NULL' : 'NULL';
        $dflt = $col['dflt_value'] !== null ? "DEFAULT " . $col['dflt_value'] : "";
        $isPk = (bool)$col['pk'];

        if ($isPk) {
            $pkCols[] = "`{$cname}`";
        }

        $myType = 'VARCHAR(255)';
        if (str_contains($rawType, 'INT') || $rawType === 'INTEGER') {
            $myType = 'INT';
        } elseif (str_contains($rawType, 'TINYINT') || str_contains($rawType, 'BOOL')) {
            $myType = 'TINYINT(1)';
        } elseif (str_contains($rawType, 'TEXT') || str_contains($rawType, 'JSON') || str_contains($rawType, 'CLOB') || str_contains($rawType, 'BLOB')) {
            $myType = 'LONGTEXT';
        } elseif (str_contains($rawType, 'DATE') && !str_contains($rawType, 'TIME')) {
            $myType = 'DATE';
        } elseif (str_contains($rawType, 'TIME') || str_contains($rawType, 'DATE')) {
            $myType = 'DATETIME';
        } elseif (str_contains($rawType, 'NUMERIC') || str_contains($rawType, 'DECIMAL')) {
            $myType = 'DECIMAL(14,2)';
        } elseif (str_contains($rawType, 'FLOAT') || str_contains($rawType, 'DOUBLE') || str_contains($rawType, 'REAL')) {
            $myType = 'DOUBLE';
        } elseif (str_contains($rawType, 'VARCHAR') || str_contains($rawType, 'CHAR')) {
            if (preg_match('/VARCHAR\s*\((\d+)\)/i', $rawType, $m)) {
                $myType = "VARCHAR({$m[1]})";
            } else {
                $myType = 'VARCHAR(255)';
            }
        }

        if ($isPk && count($pkCols) === 1 && $cname === 'id' && str_contains($myType, 'INT')) {
            $colDefs[] = "`{$cname}` INT AUTO_INCREMENT";
        } else {
            $colDefs[] = "`{$cname}` {$myType} {$notNull} {$dflt}";
        }
    }

    if (!empty($pkCols)) {
        $colDefs[] = "PRIMARY KEY (" . implode(', ', $pkCols) . ")";
    }

    $createSql = "CREATE TABLE `{$table}` (\n  " . implode(",\n  ", $colDefs) . "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    $mysql->exec($createSql);

    $rows = $sqlite->query("SELECT * FROM \"{$table}\"")->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($rows)) {
        $colNames = array_keys($rows[0]);
        $escapedCols = array_map(fn($c) => "`{$c}`", $colNames);
        $placeholders = array_map(fn($c) => ":{$c}", $colNames);

        $insertSql = "INSERT INTO `{$table}` (" . implode(', ', $escapedCols) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $mysql->prepare($insertSql);

        foreach ($rows as $row) {
            $params = [];
            foreach ($row as $k => $v) {
                $params[":{$k}"] = $v;
            }
            $stmt->execute($params);
        }
        echo "  [OK] `{$table}` (" . count($rows) . " rows)\n";
    } else {
        echo "  [OK] `{$table}` (0 rows)\n";
    }
}

$mysql->exec("SET FOREIGN_KEY_CHECKS = 1;");
echo "\n=== Migration to MySQL completed successfully! ===\n";
