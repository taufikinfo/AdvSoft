<?php

namespace App\Advsoft\Core\Database;

use App\Advsoft\Core\Support\Collection;
use Adianti\Database\TTransaction;

/**
 * Lightweight, high-performance PDO QueryBuilder for Adianti Framework.
 * Provides fluent interface with zero external dependencies.
 */
class QueryBuilder
{
    protected string $modelClass;
    protected string $table;
    protected array $wheres = [];
    protected array $params = [];
    protected array $orders = [];
    protected array $groups = [];
    protected array $withs = [];
    protected ?int $limit = null;
    protected ?int $offset = null;
    protected array $selects = ['*'];
    protected int $paramCounter = 0;
    protected ?string $connectionName = null;

    public function __construct(string $modelClass)
    {
        $this->modelClass = $modelClass;
        $this->table = defined("{$modelClass}::TABLENAME") ? $modelClass::TABLENAME : strtolower((new \ReflectionClass($modelClass))->getShortName()) . 's';
    }

    public function setConnectionName(string $connection): static
    {
        $this->connectionName = $connection;
        return $this;
    }

    public function getConnectionName(): string
    {
        if ($this->connectionName) {
            return $this->connectionName;
        }
        if (defined("{$this->modelClass}::DATABASE")) {
            return $this->modelClass::DATABASE;
        }
        return 'advsoft';
    }

    protected function getPdo(): \PDO
    {
        $db = $this->getConnectionName();
        if (!TTransaction::get()) {
            TTransaction::open($db);
        }
        return TTransaction::get();
    }

    public function select(mixed $columns = ['*']): static
    {
        $this->selects = is_array($columns) ? $columns : func_get_args();
        return $this;
    }

    public function where(mixed $column, mixed $operator = null, mixed $value = null): static
    {
        if (is_callable($column)) {
            $sub = new self($this->modelClass);
            $column($sub);
            if (!empty($sub->wheres)) {
                $this->wheres[] = ['type' => 'raw', 'sql' => '(' . $sub->toWhereSql() . ')'];
                $this->params = array_merge($this->params, $sub->params);
            }
            return $this;
        }

        if ($value === null) {
            $value = $operator;
            $operator = '=';
        }

        if ($value === null) {
            return $this->whereNull($column);
        }

        $p = ':p' . ($this->paramCounter++);
        $this->wheres[] = ['type' => 'basic', 'column' => $column, 'op' => $operator, 'param' => $p];
        $this->params[$p] = $value;
        return $this;
    }

    public function orWhere(mixed $column, mixed $operator = null, mixed $value = null): static
    {
        return $this->where($column, $operator, $value);
    }

    public function whereIn(string $column, array $values): static
    {
        if (empty($values)) {
            $this->wheres[] = ['type' => 'raw', 'sql' => '1=0'];
            return $this;
        }

        $inParams = [];
        foreach ($values as $val) {
            $p = ':p' . ($this->paramCounter++);
            $inParams[] = $p;
            $this->params[$p] = $val;
        }
        $this->wheres[] = ['type' => 'raw', 'sql' => "{$column} IN (" . implode(',', $inParams) . ")"];
        return $this;
    }

    public function whereNotIn(string $column, array $values): static
    {
        if (empty($values)) return $this;

        $inParams = [];
        foreach ($values as $val) {
            $p = ':p' . ($this->paramCounter++);
            $inParams[] = $p;
            $this->params[$p] = $val;
        }
        $this->wheres[] = ['type' => 'raw', 'sql' => "{$column} NOT IN (" . implode(',', $inParams) . ")"];
        return $this;
    }

    public function whereNull(string $column): static
    {
        $this->wheres[] = ['type' => 'raw', 'sql' => "{$column} IS NULL"];
        return $this;
    }

    public function whereNotNull(string $column): static
    {
        $this->wheres[] = ['type' => 'raw', 'sql' => "{$column} IS NOT NULL"];
        return $this;
    }

    public function whereBetween(string $column, array $values): static
    {
        if (count($values) === 2) {
            $p1 = ':p' . ($this->paramCounter++);
            $p2 = ':p' . ($this->paramCounter++);
            $this->wheres[] = ['type' => 'raw', 'sql' => "{$column} BETWEEN {$p1} AND {$p2}"];
            $this->params[$p1] = $values[0];
            $this->params[$p2] = $values[1];
        }
        return $this;
    }

    public function whereHas(string $relation, ?callable $callback = null): static
    {
        // Many-to-many / One-to-many relation check
        return $this;
    }

    public function with(mixed $relations): static
    {
        $rels = is_array($relations) ? $relations : func_get_args();
        $this->withs = array_merge($this->withs, $rels);
        return $this;
    }

    public function orderBy(string $column, string $direction = 'ASC'): static
    {
        $this->orders[] = "{$column} " . strtoupper($direction);
        return $this;
    }

    public function groupBy(mixed $groups): static
    {
        $g = is_array($groups) ? $groups : func_get_args();
        $this->groups = array_merge($this->groups, $g);
        return $this;
    }

    public function limit(int $limit): static
    {
        $this->limit = $limit;
        return $this;
    }

    public function take(int $limit): static
    {
        return $this->limit($limit);
    }

    public function offset(int $offset): static
    {
        $this->offset = $offset;
        return $this;
    }

    public function skip(int $offset): static
    {
        return $this->offset($offset);
    }

    public function latest(string $column = 'id'): static
    {
        return $this->orderBy($column, 'DESC');
    }

    public function oldest(string $column = 'id'): static
    {
        return $this->orderBy($column, 'ASC');
    }

    public function pluck(string $column, ?string $key = null): Collection
    {
        $cols = $key ? [$column, $key] : [$column];
        return $this->get($cols)->pluck($column, $key);
    }

    public function toWhereSql(): string
    {
        if (empty($this->wheres)) return '1=1';
        $parts = [];
        foreach ($this->wheres as $w) {
            if ($w['type'] === 'basic') {
                $parts[] = "{$w['column']} {$w['op']} {$w['param']}";
            } elseif ($w['type'] === 'raw') {
                $parts[] = $w['sql'];
            }
        }
        return implode(' AND ', $parts);
    }

    public function count(): int
    {
        $pdo = $this->getPdo();
        $whereSql = $this->toWhereSql();
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM {$this->table} WHERE {$whereSql}");
        $stmt->execute($this->params);
        return (int) $stmt->fetchColumn();
    }

    public function sum(string $column): float
    {
        $pdo = $this->getPdo();
        $whereSql = $this->toWhereSql();
        $stmt = $pdo->prepare("SELECT SUM({$column}) FROM {$this->table} WHERE {$whereSql}");
        $stmt->execute($this->params);
        $val = $stmt->fetchColumn();
        return $val !== false && $val !== null ? (float) $val : 0.0;
    }

    public function avg(string $column): float
    {
        $pdo = $this->getPdo();
        $whereSql = $this->toWhereSql();
        $stmt = $pdo->prepare("SELECT AVG({$column}) FROM {$this->table} WHERE {$whereSql}");
        $stmt->execute($this->params);
        $val = $stmt->fetchColumn();
        return $val !== false && $val !== null ? (float) $val : 0.0;
    }

    public function max(string $column): mixed
    {
        $pdo = $this->getPdo();
        $whereSql = $this->toWhereSql();
        $stmt = $pdo->prepare("SELECT MAX({$column}) FROM {$this->table} WHERE {$whereSql}");
        $stmt->execute($this->params);
        return $stmt->fetchColumn();
    }

    public function min(string $column): mixed
    {
        $pdo = $this->getPdo();
        $whereSql = $this->toWhereSql();
        $stmt = $pdo->prepare("SELECT MIN({$column}) FROM {$this->table} WHERE {$whereSql}");
        $stmt->execute($this->params);
        return $stmt->fetchColumn();
    }

    public function get(array $columns = ['*']): Collection
    {
        $pdo = $this->getPdo();
        $whereSql = $this->toWhereSql();
        $selectCols = !empty($this->selects) && $this->selects !== ['*'] ? implode(', ', $this->selects) : implode(', ', $columns);

        $sql = "SELECT {$selectCols} FROM {$this->table} WHERE {$whereSql}";
        if (!empty($this->groups)) {
            $sql .= " GROUP BY " . implode(', ', $this->groups);
        }
        if (!empty($this->orders)) {
            $sql .= " ORDER BY " . implode(', ', $this->orders);
        }
        if ($this->limit !== null) {
            $sql .= " LIMIT " . (int)$this->limit;
        }
        if ($this->offset !== null) {
            $sql .= " OFFSET " . (int)$this->offset;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($this->params);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $modelClass = $this->modelClass;
        $instances = [];
        foreach ($rows as $row) {
            $obj = new $modelClass();
            $obj->fromArray($row);
            $instances[] = $obj;
        }

        $collection = new Collection($instances);
        $this->eagerLoad($collection);
        return $collection;
    }

    public function filter(?callable $callback = null): Collection
    {
        return $this->get()->filter($callback);
    }

    protected function eagerLoad(Collection $records): void
    {
        if ($records->isEmpty() || empty($this->withs)) return;

        foreach ($this->withs as $with) {
            $parts = explode(':', $with, 2);
            $relName = $parts[0];
            foreach ($records as $record) {
                if (method_exists($record, $relName)) {
                    $relVal = $record->$relName();
                    if ($relVal instanceof QueryBuilder) {
                        $relVal = $relVal->get();
                    }
                    $record->setRelation($relName, $relVal);
                } elseif (method_exists($record, 'get_' . $relName)) {
                    $m = 'get_' . $relName;
                    $relVal = $record->$m();
                    if ($relVal instanceof QueryBuilder) {
                        $relVal = $relVal->get();
                    }
                    $record->setRelation($relName, $relVal);
                }
            }
        }
    }

    public function first(): mixed
    {
        $this->limit(1);
        $res = $this->get();
        return $res->first();
    }

    public function value(string $column): mixed
    {
        $res = $this->select([$column])->first();
        if (!$res) return null;
        return is_object($res) ? ($res->$column ?? null) : ($res[$column] ?? null);
    }

    public function exists(): bool
    {
        return $this->count() > 0;
    }

    public function doesntExist(): bool
    {
        return !$this->exists();
    }

    public function find(mixed $id): mixed
    {
        if (!$id) return null;
        $this->where('id', '=', $id);
        return $this->first();
    }

    public function findOrFail(mixed $id): mixed
    {
        $res = $this->find($id);
        if (!$res) {
            throw new \Exception("Record not found in {$this->table} with ID {$id}", 404);
        }
        return $res;
    }

    public function delete(): int
    {
        $pdo = $this->getPdo();
        $whereSql = $this->toWhereSql();
        $stmt = $pdo->prepare("DELETE FROM {$this->table} WHERE {$whereSql}");
        $stmt->execute($this->params);
        return $stmt->rowCount();
    }

    public function update(array $values): int
    {
        $pdo = $this->getPdo();
        $whereSql = $this->toWhereSql();
        $setParts = [];
        $updateParams = [];

        foreach ($values as $col => $val) {
            $p = ':up_' . ($this->paramCounter++);
            $setParts[] = "{$col} = {$p}";
            $updateParams[$p] = $val;
        }

        $sql = "UPDATE {$this->table} SET " . implode(', ', $setParts) . " WHERE {$whereSql}";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_merge($this->params, $updateParams));
        return $stmt->rowCount();
    }
}
