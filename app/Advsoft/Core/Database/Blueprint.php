<?php

namespace App\Advsoft\Core\Database;

/**
 * Table Schema Blueprint — Drop-in replacement for Illuminate\Database\Schema\Blueprint
 */
class Blueprint
{
    public string $table;
    public bool $isCreate = true;

    /** @var ColumnDefinition[] */
    public array $columns = [];

    /** @var array */
    public array $indexes = [];

    /** @var array */
    public array $uniques = [];

    /** @var array */
    public array $primaries = [];

    /** @var array */
    public array $foreignKeys = [];

    /** @var string[] */
    public array $dropColumns = [];

    /** @var array */
    public array $renameColumns = [];

    public function __construct(string $table, bool $isCreate = true)
    {
        $this->table = $table;
        $this->isCreate = $isCreate;
    }

    protected function addColumn(string $name, string $type, array $attributes = []): ColumnDefinition
    {
        $col = new ColumnDefinition($name, $type, $attributes);
        $this->columns[] = $col;
        return $col;
    }

    // ── Column Types ──────────────────────────────────────────────

    public function id(string $name = 'id'): ColumnDefinition
    {
        return $this->bigIncrements($name);
    }

    public function increments(string $name = 'id'): ColumnDefinition
    {
        return $this->addColumn($name, 'integer', ['isPrimary' => true, 'isAutoIncrement' => true, 'isUnsigned' => true]);
    }

    public function bigIncrements(string $name = 'id'): ColumnDefinition
    {
        return $this->addColumn($name, 'bigInteger', ['isPrimary' => true, 'isAutoIncrement' => true, 'isUnsigned' => true]);
    }

    public function string(string $name, int $length = 255): ColumnDefinition
    {
        return $this->addColumn($name, 'string', ['length' => $length]);
    }

    public function char(string $name, int $length = 255): ColumnDefinition
    {
        return $this->addColumn($name, 'char', ['length' => $length]);
    }

    public function text(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'text');
    }

    public function mediumText(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'mediumText');
    }

    public function longText(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'longText');
    }

    public function integer(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'integer');
    }

    public function tinyInteger(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'tinyInteger');
    }

    public function smallInteger(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'smallInteger');
    }

    public function mediumInteger(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'mediumInteger');
    }

    public function bigInteger(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'bigInteger');
    }

    public function unsignedInteger(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'integer', ['isUnsigned' => true]);
    }

    public function unsignedTinyInteger(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'tinyInteger', ['isUnsigned' => true]);
    }

    public function unsignedSmallInteger(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'smallInteger', ['isUnsigned' => true]);
    }

    public function unsignedBigInteger(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'bigInteger', ['isUnsigned' => true]);
    }

    public function foreignId(string $name): ColumnDefinition
    {
        return $this->unsignedBigInteger($name);
    }

    public function boolean(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'boolean');
    }

    public function decimal(string $name, int $total = 8, int $places = 2): ColumnDefinition
    {
        return $this->addColumn($name, 'decimal', ['total' => $total, 'places' => $places]);
    }

    public function float(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'float');
    }

    public function double(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'double');
    }

    public function date(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'date');
    }

    public function dateTime(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'dateTime');
    }

    public function timestamp(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'timestamp');
    }

    public function timestamps(): void
    {
        $this->timestamp('created_at')->nullable();
        $this->timestamp('updated_at')->nullable();
    }

    public function softDeletes(string $column = 'deleted_at'): ColumnDefinition
    {
        return $this->timestamp($column)->nullable();
    }

    public function rememberToken(): ColumnDefinition
    {
        return $this->string('remember_token', 100)->nullable();
    }

    public function json(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'json');
    }

    public function jsonb(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'json');
    }

    public function enum(string $name, array $allowed): ColumnDefinition
    {
        return $this->addColumn($name, 'enum', ['allowed' => $allowed]);
    }

    public function binary(string $name): ColumnDefinition
    {
        return $this->addColumn($name, 'binary');
    }

    // ── Modifiers / Constraints ────────────────────────────────────

    public function primary(string|array $columns): self
    {
        $this->primaries = (array) $columns;
        return $this;
    }

    public function unique(string|array $columns, ?string $name = null): self
    {
        $this->uniques[] = ['columns' => (array) $columns, 'name' => $name];
        return $this;
    }

    public function index(string|array $columns, ?string $name = null): self
    {
        $this->indexes[] = ['columns' => (array) $columns, 'name' => $name];
        return $this;
    }

    public function foreign(string|array $columns): ColumnDefinition
    {
        $colName = is_array($columns) ? $columns[0] : $columns;
        $def = new ColumnDefinition($colName, 'foreign');
        $this->foreignKeys[] = $def;
        return $def;
    }

    public function dropColumn(string|array $columns): self
    {
        foreach ((array) $columns as $col) {
            $this->dropColumns[] = $col;
        }
        return $this;
    }

    public function dropForeign(string|array $name): self
    {
        return $this;
    }

    public function dropUnique(string|array $name): self
    {
        return $this;
    }

    public function dropIndex(string|array $name): self
    {
        return $this;
    }

    public function renameColumn(string $from, string $to): self
    {
        $this->renameColumns[] = ['from' => $from, 'to' => $to];
        return $this;
    }

    // ── SQL DDL Generation & Execution ─────────────────────────────

    public function buildAndExecute(\PDO $pdo, string $driver = 'sqlite'): void
    {
        if ($this->isCreate) {
            $this->executeCreate($pdo, $driver);
        } else {
            $this->executeAlter($pdo, $driver);
        }
    }

    protected function executeCreate(\PDO $pdo, string $driver): void
    {
        $colSqls = [];
        $pkCols = [];
        $uniqueList = [];
        $indexList = [];
        $foreignList = [];

        foreach ($this->columns as $col) {
            $sqlType = $this->mapColumnType($col, $driver);
            $nullSql = $col->isNullable ? 'NULL' : 'NOT NULL';
            
            $defaultSql = '';
            if ($col->hasDefault) {
                if ($col->default === null) {
                    $defaultSql = 'DEFAULT NULL';
                } elseif (is_bool($col->default)) {
                    $defaultSql = 'DEFAULT ' . ($col->default ? '1' : '0');
                } elseif (is_numeric($col->default)) {
                    $defaultSql = "DEFAULT {$col->default}";
                } elseif (strtoupper((string)$col->default) === 'CURRENT_TIMESTAMP') {
                    $defaultSql = 'DEFAULT CURRENT_TIMESTAMP';
                } else {
                    $escaped = str_replace("'", "''", (string)$col->default);
                    $defaultSql = "DEFAULT '{$escaped}'";
                }
            }

            if ($col->isPrimary) {
                $pkCols[] = "`{$col->name}`";
            }

            if ($driver === 'sqlite' && $col->isAutoIncrement) {
                $colSqls[] = "`{$col->name}` INTEGER PRIMARY KEY AUTOINCREMENT";
            } elseif ($driver === 'mysql' && $col->isAutoIncrement) {
                $colSqls[] = "`{$col->name}` {$sqlType} NOT NULL AUTO_INCREMENT";
            } else {
                $colDef = "`{$col->name}` {$sqlType} {$nullSql}";
                if ($defaultSql) {
                    $colDef .= " {$defaultSql}";
                }
                $colSqls[] = trim($colDef);
            }

            if ($col->isUnique) {
                $uniqueList[] = [$col->name];
            }
            if ($col->isIndex && !$col->isUnique && !$col->isPrimary) {
                $indexList[] = [$col->name];
            }

            if ($col->foreignTable) {
                $foreignList[] = [
                    'column' => $col->name,
                    'refTable' => $col->foreignTable,
                    'refColumn' => $col->foreignColumn ?: 'id',
                    'onDelete' => $col->onDelete,
                    'onUpdate' => $col->onUpdate,
                ];
            }
        }

        foreach ($this->foreignKeys as $fk) {
            if ($fk->foreignTable) {
                $foreignList[] = [
                    'column' => $fk->name,
                    'refTable' => $fk->foreignTable,
                    'refColumn' => $fk->foreignColumn ?: 'id',
                    'onDelete' => $fk->onDelete,
                    'onUpdate' => $fk->onUpdate,
                ];
            }
        }

        if (!empty($this->primaries)) {
            $pkCols = array_map(fn($c) => "`{$c}`", $this->primaries);
        }

        // Add PRIMARY KEY constraint for MySQL or non-autoincrement SQLite
        if (!empty($pkCols) && ($driver === 'mysql' || !empty($this->primaries))) {
            $colSqls[] = "PRIMARY KEY (" . implode(', ', $pkCols) . ")";
        }

        // Add UNIQUE constraints
        foreach ($this->uniques as $u) {
            $uniqueList[] = $u['columns'];
        }
        foreach ($uniqueList as $uCols) {
            $escaped = array_map(fn($c) => "`{$c}`", (array)$uCols);
            $colSqls[] = "UNIQUE (" . implode(', ', $escaped) . ")";
        }

        // Add FOREIGN KEY constraints
        foreach ($foreignList as $fk) {
            $fkSql = "FOREIGN KEY (`{$fk['column']}`) REFERENCES `{$fk['refTable']}`(`{$fk['refColumn']}`)";
            if ($fk['onDelete']) $fkSql .= " ON DELETE {$fk['onDelete']}";
            if ($fk['onUpdate']) $fkSql .= " ON UPDATE {$fk['onUpdate']}";
            $colSqls[] = $fkSql;
        }

        $engine = $driver === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';
        $createSql = "CREATE TABLE IF NOT EXISTS `{$this->table}` (\n  " . implode(",\n  ", $colSqls) . "\n){$engine};";

        $pdo->exec($createSql);

        // Execute Indexes
        foreach ($this->indexes as $idx) {
            $indexList[] = $idx['columns'];
        }
        foreach ($indexList as $iCols) {
            $colsStr = implode('_', (array)$iCols);
            $idxName = "idx_{$this->table}_{$colsStr}";
            $escaped = array_map(fn($c) => "`{$c}`", (array)$iCols);
            $idxSql = "CREATE INDEX IF NOT EXISTS `{$idxName}` ON `{$this->table}` (" . implode(', ', $escaped) . ");";
            try {
                $pdo->exec($idxSql);
            } catch (\Throwable $e) {}
        }
    }

    protected function executeAlter(\PDO $pdo, string $driver): void
    {
        // 1. Rename columns
        foreach ($this->renameColumns as $ren) {
            try {
                if ($driver === 'sqlite') {
                    $pdo->exec("ALTER TABLE `{$this->table}` RENAME COLUMN `{$ren['from']}` TO `{$ren['to']}`;");
                } else {
                    // For MySQL, inspect old column definition or use CHANGE / RENAME COLUMN
                    $pdo->exec("ALTER TABLE `{$this->table}` RENAME COLUMN `{$ren['from']}` TO `{$ren['to']}`;");
                }
            } catch (\Throwable $e) {}
        }

        // 2. Drop columns
        foreach ($this->dropColumns as $col) {
            try {
                $pdo->exec("ALTER TABLE `{$this->table}` DROP COLUMN `{$col}`;");
            } catch (\Throwable $e) {}
        }

        // 3. Add or Modify columns
        foreach ($this->columns as $col) {
            $sqlType = $this->mapColumnType($col, $driver);
            $nullSql = $col->isNullable ? 'NULL' : 'NOT NULL';
            $defaultSql = '';
            if ($col->hasDefault) {
                if ($col->default === null) $defaultSql = 'DEFAULT NULL';
                elseif (is_bool($col->default)) $defaultSql = 'DEFAULT ' . ($col->default ? '1' : '0');
                elseif (is_numeric($col->default)) $defaultSql = "DEFAULT {$col->default}";
                else $defaultSql = "DEFAULT '" . str_replace("'", "''", (string)$col->default) . "'";
            }
            $afterSql = ($driver === 'mysql' && $col->after) ? " AFTER `{$col->after}`" : "";

            if ($col->isChange) {
                try {
                    if ($driver === 'mysql') {
                        $pdo->exec("ALTER TABLE `{$this->table}` MODIFY `{$col->name}` {$sqlType} {$nullSql} {$defaultSql}{$afterSql};");
                    }
                    // SQLite doesn't natively support MODIFY COLUMN without table rebuild, skip safely
                } catch (\Throwable $e) {}
            } else {
                try {
                    $colDef = "`{$col->name}` {$sqlType} {$nullSql} {$defaultSql}{$afterSql}";
                    $pdo->exec("ALTER TABLE `{$this->table}` ADD COLUMN " . trim($colDef) . ";");
                } catch (\Throwable $e) {}
            }
        }
    }

    protected function mapColumnType(ColumnDefinition $col, string $driver): string
    {
        $type = strtolower($col->type);
        if ($driver === 'sqlite') {
            return match ($type) {
                'integer', 'tinyinteger', 'smallinteger', 'mediuminteger', 'biginteger', 'boolean' => 'INTEGER',
                'decimal', 'float', 'double' => 'REAL',
                'date', 'datetime', 'timestamp' => 'DATETIME',
                'binary' => 'BLOB',
                default => 'TEXT',
            };
        }

        // MySQL mapping
        return match ($type) {
            'tinyinteger', 'boolean' => 'TINYINT(1)',
            'smallinteger' => 'SMALLINT',
            'mediuminteger' => 'MEDIUMINT',
            'integer' => $col->isUnsigned ? 'INT UNSIGNED' : 'INT',
            'biginteger' => $col->isUnsigned ? 'BIGINT UNSIGNED' : 'BIGINT',
            'decimal' => "DECIMAL({$col->total},{$col->places})",
            'float' => 'FLOAT',
            'double' => 'DOUBLE',
            'string' => "VARCHAR(" . ($col->length ?: 255) . ")",
            'char' => "CHAR(" . ($col->length ?: 255) . ")",
            'text' => 'TEXT',
            'mediumtext' => 'MEDIUMTEXT',
            'longtext' => 'LONGTEXT',
            'date' => 'DATE',
            'datetime' => 'DATETIME',
            'timestamp' => 'DATETIME',
            'json' => 'LONGTEXT',
            'binary' => 'BLOB',
            'enum' => !empty($col->allowed) ? "ENUM('" . implode("','", array_map('addslashes', $col->allowed)) . "')" : 'VARCHAR(255)',
            default => 'VARCHAR(255)',
        };
    }
}
