<?php

namespace App\Odoo\Core\Database;

use Adianti\Database\TTransaction;

/**
 * Pure Adianti Database Schema & Migration Manager.
 */
class SchemaManager
{
    protected string $database;

    public function __construct(string $database = 'AdvSoft')
    {
        $this->database = $database;
    }

    public function connection(): \PDO
    {
        TTransaction::open($this->database);
        return TTransaction::get();
    }

    public function tableExists(string $tableName): bool
    {
        $pdo = $this->connection();
        $stmt = $pdo->prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = :t");
        $stmt->execute([':t' => $tableName]);
        return (bool) $stmt->fetchColumn();
    }

    public function executeSql(string $sql): void
    {
        $pdo = $this->connection();
        $pdo->exec($sql);
    }
}
