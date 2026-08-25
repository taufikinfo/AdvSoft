<?php

namespace App\Model;

use Adianti\Database\TRecord;
use Adianti\Database\TTransaction;
use Adianti\Database\TRepository;
use Adianti\Database\TCriteria;
use Adianti\Database\TFilter;
use App\Advsoft\Core\Support\Collection;
use App\Advsoft\Core\Database\QueryBuilder;

/**
 * Base Active Record Model for AdvSoft built on Adianti TRecord.
 */
abstract class BaseModel extends TRecord
{
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
    const DATABASE   = 'advsoft';

    protected array $relations = [];

    /**
     * Get configured database connection name for this model
     */
    public static function getDatabaseName(): string
    {
        return defined("static::DATABASE") ? static::DATABASE : 'advsoft';
    }

    /**
     * Ensure active Adianti transaction
     */
    public static function openTransaction(?string $database = null): void
    {
        $db = $database ?: static::getDatabaseName();
        if (!TTransaction::get()) {
            TTransaction::open($db);
        }
    }

    /**
     * Start a new query builder on a specific connection
     */
    public static function onConnection(string $database): QueryBuilder
    {
        $qb = new QueryBuilder(static::class);
        $qb->setConnectionName($database);
        return $qb;
    }

    /**
     * Start a new query builder
     */
    public static function query(): QueryBuilder
    {
        self::openTransaction();
        $qb = new QueryBuilder(static::class);
        $qb->setConnectionName(static::getDatabaseName());
        return $qb;
    }

    /**
     * Find a record by ID
     * @param mixed $id
     * @param bool $withTrashed
     * @return static|null
     */
    public static function find($id, $withTrashed = false)
    {
        if (!$id) return null;
        self::openTransaction();
        try {
            $record = new static;
            $loaded = $record->load($id);
            return $loaded ?: null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Find a record by ID or fail
     */
    public static function findOrFail(mixed $id): static
    {
        $record = self::find($id);
        if (!$record) {
            throw new \Exception("Record not found in " . static::TABLENAME . " with ID: $id", 404);
        }
        return $record;
    }

    /**
     * Load all records matching criteria or indexed
     */
    public static function all($indexed = false, $withTrashed = false)
    {
        self::openTransaction();
        $repo = new TRepository(static::class);
        $criteria = ($indexed instanceof TCriteria) ? $indexed : new TCriteria();
        $records = $repo->load($criteria);
        return new Collection($records ?: []);
    }

    /**
     * Count records matching criteria
     */
    public static function count(?TCriteria $criteria = null): int
    {
        self::openTransaction();
        $repo = new TRepository(static::class);
        return (int) $repo->count($criteria ?: new TCriteria());
    }

    public static function sum(string $column): float
    {
        return static::query()->sum($column);
    }

    public static function avg(string $column): float
    {
        return static::query()->avg($column);
    }

    public static function max(string $column): mixed
    {
        return static::query()->max($column);
    }

    public static function min(string $column): mixed
    {
        return static::query()->min($column);
    }

    /**
     * Query by single condition
     */
    public static function where($variable, $operator = '=', $value = null, $logicOperator = \Adianti\Database\TExpression::AND_OPERATOR)
    {
        return static::query()->where($variable, $operator, $value);
    }

    public static function whereIn(string $field, array $values): QueryBuilder
    {
        return static::query()->whereIn($field, $values);
    }

    public static function whereNull(string $field): QueryBuilder
    {
        return static::query()->whereNull($field);
    }

    public static function whereNotNull(string $field): QueryBuilder
    {
        return static::query()->whereNotNull($field);
    }

    public static function orderBy($order, $direction = 'asc')
    {
        return static::query()->orderBy($order, $direction);
    }

    public static function pluck(string $column, ?string $key = null): Collection
    {
        return static::query()->pluck($column, $key);
    }

    public static function select(mixed $columns = ['*']): QueryBuilder
    {
        return static::query()->select($columns);
    }

    public static function limit(int $limit): QueryBuilder
    {
        return static::query()->limit($limit);
    }

    public static function with(mixed $relations): QueryBuilder
    {
        return static::query()->with($relations);
    }

    /**
     * Get first record
     * @param bool $withTrashed
     * @return static|null
     */
    public static function first($withTrashed = false)
    {
        return static::query()->first();
    }

    /**
     * First record matching condition
     */
    public static function firstWhere(string $field, mixed $value, string $operator = '='): ?static
    {
        return static::query()->where($field, $operator, $value)->first();
    }

    /**
     * Create and persist a new record
     */
    public static function create(mixed $data = []): static
    {
        self::openTransaction();
        $record = new static;
        $record->fromArray(is_array($data) ? $data : (array)$data);
        $record->store();
        return $record;
    }

    public static function firstOrCreate($attributes = NULL, $values = [])
    {
        self::openTransaction();
        if (is_array($attributes)) {
            $query = static::query();
            foreach ($attributes as $field => $val) {
                $query->where($field, '=', $val);
            }
            $record = $query->first();
            if ($record) {
                return $record;
            }
            return static::create(array_merge($attributes, is_array($values) ? $values : []));
        }
        return parent::firstOrCreate($attributes);
    }

    public static function updateOrCreate($attributes = NULL, $values = [])
    {
        self::openTransaction();
        if (is_array($attributes)) {
            $query = static::query();
            foreach ($attributes as $field => $val) {
                $query->where($field, '=', $val);
            }
            $record = $query->first();
            if ($record) {
                if (is_array($values) && !empty($values)) {
                    $record->fill($values);
                    $record->store();
                }
                return $record;
            }
            return static::create(array_merge($attributes, is_array($values) ? $values : []));
        }
        return static::create(is_array($values) ? $values : []);
    }

    /**
     * Convert record attributes to array
     */
    public function toArray($filter_attributes = null): array
    {
        return $this->data ?? [];
    }

    /**
     * Fill attributes from array
     */
    public function fill(array $data): static
    {
        $this->fromArray($data);
        return $this;
    }

    /**
     * Update record attributes and persist to database
     */
    public function update(array $attributes = []): bool
    {
        self::openTransaction();
        if (!empty($attributes)) {
            $this->fromArray($attributes);
        }
        $this->store();
        return true;
    }

    /**
     * Save record to database
     */
    public function save(): void
    {
        self::openTransaction();
        $this->store();
    }

    /**
     * Save record without firing events
     */
    public function saveQuietly(): void
    {
        self::openTransaction();
        $this->store();
    }

    /**
     * Delete record from database
     */
    public function delete($id = NULL)
    {
        self::openTransaction();
        return parent::delete($id);
    }

    public function load($id)
    {
        if (is_numeric($id) || (is_string($id) && ctype_digit($id))) {
            return parent::load($id);
        }
        if (is_string($id) || is_array($id)) {
            $this->loadRelations($id);
            return $this;
        }
        return parent::load($id);
    }

    public function loadRelations(mixed $relations): static
    {
        $rels = is_array($relations) ? $relations : func_get_args();
        foreach ($rels as $with) {
            $parts = explode(':', $with, 2);
            $relName = $parts[0];
            if (method_exists($this, $relName)) {
                $relVal = $this->$relName();
                if ($relVal instanceof QueryBuilder) {
                    $relVal = $relVal->get();
                }
                $this->setRelation($relName, $relVal);
            } elseif (method_exists($this, 'get_' . $relName)) {
                $m = 'get_' . $relName;
                $relVal = $this->$m();
                if ($relVal instanceof QueryBuilder) {
                    $relVal = $relVal->get();
                }
                $this->setRelation($relName, $relVal);
            }
        }
        return $this;
    }

    /**
     * Relation helpers
     */
    public function relationLoaded(string $relation): bool
    {
        return array_key_exists($relation, $this->relations);
    }

    public function getRelation(string $relation): mixed
    {
        return $this->relations[$relation] ?? null;
    }

    public function setRelation(string $relation, mixed $value): static
    {
        $this->relations[$relation] = $value;
        return $this;
    }

    /**
     * Magic getter for attributes and relations
     */
    public function __get($property)
    {
        if (array_key_exists($property, $this->relations)) {
            return $this->relations[$property];
        }
        if (isset($this->data[$property]) || (is_array($this->data ?? null) && array_key_exists($property, $this->data))) {
            return $this->data[$property];
        }
        // Dynamic relationship resolution
        if (method_exists($this, $property)) {
            $val = $this->$property();
            if ($val instanceof QueryBuilder) {
                $val = $val->get();
            }
            $this->relations[$property] = $val;
            return $val;
        }
        if (method_exists($this, 'get_' . $property)) {
            $m = 'get_' . $property;
            $val = $this->$m();
            if ($val instanceof QueryBuilder) {
                $val = $val->get();
            }
            $this->relations[$property] = $val;
            return $val;
        }
        return null;
    }

    /**
     * Magic setter for attributes
     */
    public function __set($property, $value)
    {
        $this->data[$property] = $value;
    }

    /**
     * Magic isset for attributes
     */
    public function __isset($property)
    {
        return isset($this->data[$property]) || isset($this->relations[$property]);
    }
}
