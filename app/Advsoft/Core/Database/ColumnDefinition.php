<?php

namespace App\Advsoft\Core\Database;

/**
 * Fluent Column Definition — Drop-in replacement for Illuminate\Database\Schema\ColumnDefinition
 */
class ColumnDefinition
{
    public string $name;
    public string $type;
    public ?int $length = null;
    public ?int $total = null;
    public ?int $places = null;
    public array $allowed = [];
    public bool $isNullable = false;
    public mixed $default = null;
    public bool $hasDefault = false;
    public bool $isUnique = false;
    public bool $isIndex = false;
    public bool $isPrimary = false;
    public bool $isAutoIncrement = false;
    public bool $isUnsigned = false;
    public ?string $after = null;
    public ?string $comment = null;
    public bool $isChange = false;

    // Foreign key properties
    public ?string $foreignTable = null;
    public ?string $foreignColumn = null;
    public ?string $onDelete = null;
    public ?string $onUpdate = null;

    public function __construct(string $name, string $type, array $attributes = [])
    {
        $this->name = $name;
        $this->type = $type;
        foreach ($attributes as $k => $v) {
            if (property_exists($this, $k)) {
                $this->{$k} = $v;
            }
        }
    }

    public function nullable(bool $value = true): self
    {
        $this->isNullable = $value;
        return $this;
    }

    public function default(mixed $value): self
    {
        $this->default = $value;
        $this->hasDefault = true;
        return $this;
    }

    public function useCurrent(): self
    {
        $this->default = 'CURRENT_TIMESTAMP';
        $this->hasDefault = true;
        return $this;
    }

    public function useCurrentOnUpdate(): self
    {
        return $this;
    }

    public function unique(): self
    {
        $this->isUnique = true;
        return $this;
    }

    public function index(): self
    {
        $this->isIndex = true;
        return $this;
    }

    public function primary(): self
    {
        $this->isPrimary = true;
        return $this;
    }

    public function autoIncrement(): self
    {
        $this->isAutoIncrement = true;
        return $this;
    }

    public function unsigned(): self
    {
        $this->isUnsigned = true;
        return $this;
    }

    public function after(string $column): self
    {
        $this->after = $column;
        return $this;
    }

    public function comment(string $comment): self
    {
        $this->comment = $comment;
        return $this;
    }

    public function change(): self
    {
        $this->isChange = true;
        return $this;
    }

    public function constrained(?string $table = null, string $column = 'id'): self
    {
        if ($table === null) {
            // infer table from column name (e.g. 'user_id' -> 'users', 'stage_id' -> 'stages')
            $base = preg_replace('/_id$/', '', $this->name);
            $table = str_ends_with($base, 's') ? $base : $base . 's';
        }
        $this->foreignTable = $table;
        $this->foreignColumn = $column;
        return $this;
    }

    public function references(string $column): self
    {
        $this->foreignColumn = $column;
        return $this;
    }

    public function on(string $table): self
    {
        $this->foreignTable = $table;
        return $this;
    }

    public function onDelete(string $action): self
    {
        $this->onDelete = strtoupper($action);
        return $this;
    }

    public function onUpdate(string $action): self
    {
        $this->onUpdate = strtoupper($action);
        return $this;
    }

    public function cascadeOnDelete(): self
    {
        $this->onDelete = 'CASCADE';
        return $this;
    }

    public function nullOnDelete(): self
    {
        $this->onDelete = 'SET NULL';
        return $this;
    }

    public function cascadeOnUpdate(): self
    {
        $this->onUpdate = 'CASCADE';
        return $this;
    }
}
