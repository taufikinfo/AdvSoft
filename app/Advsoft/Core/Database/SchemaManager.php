<?php

namespace App\Advsoft\Core\Database;

use Adianti\Database\TTransaction;

/**
 * SchemaManager
 *
 * @version    2.0.0
 * @package    Advsoft
 * @author     Taufik
 * @author     AdvSoft Team
 * @copyright  Copyright (c) 2026 AdvSoft Technologies
 * @license    https://opensource.org/licenses/MIT MIT License
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
