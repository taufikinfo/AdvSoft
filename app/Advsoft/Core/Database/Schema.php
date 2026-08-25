<?php

namespace App\Advsoft\Core\Database;

use Adianti\Database\TTransaction;

/**
 * Database Schema Facade / Builder — Drop-in replacement for Illuminate\Support\Facades\Schema
 */
class Schema
{
    protected static ?\PDO $customPdo = null;
    protected static string $customDriver = 'sqlite';
    protected static ?string $targetConnection = null;

    public static function setConnection(\PDO $pdo, string $driver = 'sqlite'): void
    {
        self::$customPdo = $pdo;
        self::$customDriver = $driver;
    }

    public static function connection(string $database): self
    {
        self::$targetConnection = $database;
        return new self;
    }

    public static function getConnection(): array
    {
        if (self::$customPdo) {
            return [self::$customPdo, self::$customDriver];
        }

        $db = self::$targetConnection ?: 'advsoft';

        try {
            TTransaction::open($db);
            $pdo = TTransaction::get();
            $driver = $pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);
            return [$pdo, strtolower($driver)];
        } catch (\Throwable $e) {
            // fallback to default sqlite file
            $sqlitePath = __DIR__ . '/../../../../database/database.sqlite';
            $pdo = new \PDO("sqlite:{$sqlitePath}", null, null, [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);
            return [$pdo, 'sqlite'];
        }
    }

    public static function create(string $table, \Closure $callback): void
    {
        [$pdo, $driver] = self::getConnection();
        $blueprint = new Blueprint($table, true);
        $callback($blueprint);
        $blueprint->buildAndExecute($pdo, $driver);
    }

    public static function table(string $table, \Closure $callback): void
    {
        [$pdo, $driver] = self::getConnection();
        $blueprint = new Blueprint($table, false);
        $callback($blueprint);
        $blueprint->buildAndExecute($pdo, $driver);
    }

    public static function drop(string $table): void
    {
        [$pdo] = self::getConnection();
        $pdo->exec("DROP TABLE `{$table}`;");
    }

    public static function dropIfExists(string $table): void
    {
        [$pdo] = self::getConnection();
        $pdo->exec("DROP TABLE IF EXISTS `{$table}`;");
    }

    public static function hasTable(string $table): bool
    {
        [$pdo, $driver] = self::getConnection();
        try {
            if ($driver === 'sqlite') {
                $stmt = $pdo->prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = :t");
                $stmt->execute([':t' => $table]);
                return (bool) $stmt->fetchColumn();
            } else {
                $stmt = $pdo->prepare("SHOW TABLES LIKE :t");
                $stmt->execute([':t' => $table]);
                return (bool) $stmt->fetchColumn();
            }
        } catch (\Throwable $e) {
            return false;
        }
    }

    public static function hasColumn(string $table, string $column): bool
    {
        [$pdo, $driver] = self::getConnection();
        try {
            if ($driver === 'sqlite') {
                $stmt = $pdo->query("PRAGMA table_info(`{$table}`)");
                $cols = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                foreach ($cols as $col) {
                    if (strcasecmp($col['name'], $column) === 0) {
                        return true;
                    }
                }
                return false;
            } else {
                $stmt = $pdo->prepare("SHOW COLUMNS FROM `{$table}` LIKE :c");
                $stmt->execute([':c' => $column]);
                return (bool) $stmt->fetchColumn();
            }
        } catch (\Throwable $e) {
            return false;
        }
    }

    public static function rename(string $from, string $to): void
    {
        [$pdo, $driver] = self::getConnection();
        if ($driver === 'sqlite') {
            $pdo->exec("ALTER TABLE `{$from}` RENAME TO `{$to}`;");
        } else {
            $pdo->exec("RENAME TABLE `{$from}` TO `{$to}`;");
        }
    }

    public static function disableForeignKeyConstraints(): void
    {
        [$pdo, $driver] = self::getConnection();
        if ($driver === 'sqlite') {
            $pdo->exec("PRAGMA foreign_keys = OFF;");
        } else {
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
        }
    }

    public static function enableForeignKeyConstraints(): void
    {
        [$pdo, $driver] = self::getConnection();
        if ($driver === 'sqlite') {
            $pdo->exec("PRAGMA foreign_keys = ON;");
        } else {
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
        }
    }
}
