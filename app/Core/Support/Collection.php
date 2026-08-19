<?php

namespace App\Core\Support;

use ArrayAccess;
use Countable;
use IteratorAggregate;
use ArrayIterator;
use JsonSerializable;
use Traversable;

/**
 * Lightweight Collection for Adianti PHP backend without Laravel/Illuminate.
 */
class Collection implements ArrayAccess, Countable, IteratorAggregate, JsonSerializable
{
    protected array $items = [];

    public function __construct(mixed $items = [])
    {
        $this->items = $this->getArrayableItems($items);
    }

    public static function make(mixed $items = []): static
    {
        return new static($items);
    }

    protected function getArrayableItems(mixed $items): array
    {
        if (is_array($items)) {
            return $items;
        } elseif ($items instanceof self) {
            return $items->all();
        } elseif ($items instanceof Traversable) {
            return iterator_to_array($items);
        } elseif ($items instanceof JsonSerializable) {
            return (array) $items->jsonSerialize();
        }
        return (array) $items;
    }

    public function all(): array
    {
        return $this->items;
    }

    public function toArray(): array
    {
        return array_map(function ($value) {
            if ($value instanceof self || (is_object($value) && method_exists($value, 'toArray'))) {
                return $value->toArray();
            }
            return $value;
        }, $this->items);
    }

    public function count(): int
    {
        return count($this->items);
    }

    public function isEmpty(): bool
    {
        return empty($this->items);
    }

    public function isNotEmpty(): bool
    {
        return !$this->isEmpty();
    }

    public function first(?callable $callback = null, mixed $default = null): mixed
    {
        if (is_null($callback)) {
            if (empty($this->items)) {
                return $default;
            }
            foreach ($this->items as $item) {
                return $item;
            }
        }
        foreach ($this->items as $key => $value) {
            if ($callback($value, $key)) {
                return $value;
            }
        }
        return $default;
    }

    public function last(?callable $callback = null, mixed $default = null): mixed
    {
        if (is_null($callback)) {
            return empty($this->items) ? $default : end($this->items);
        }
        return (new static(array_reverse($this->items, true)))->first($callback, $default);
    }

    public function map(callable $callback): static
    {
        $keys = array_keys($this->items);
        $items = array_map($callback, $this->items, $keys);
        return new static(array_combine($keys, $items));
    }

    public function filter(?callable $callback = null): static
    {
        if ($callback) {
            return new static(array_filter($this->items, $callback, ARRAY_FILTER_USE_BOTH));
        }
        return new static(array_filter($this->items));
    }

    public function pluck(string|int $value, string|int|null $key = null): static
    {
        $results = [];
        foreach ($this->items as $item) {
            $itemValue = is_object($item) ? ($item->$value ?? null) : ($item[$value] ?? null);
            if (is_null($key)) {
                $results[] = $itemValue;
            } else {
                $itemKey = is_object($item) ? ($item->$key ?? null) : ($item[$key] ?? null);
                $results[$itemKey] = $itemValue;
            }
        }
        return new static($results);
    }

    public function keyBy(string|callable $keyBy): static
    {
        $results = [];
        foreach ($this->items as $key => $item) {
            $resolvedKey = is_callable($keyBy) ? $keyBy($item, $key) : (is_object($item) ? ($item->$keyBy ?? null) : ($item[$keyBy] ?? null));
            if ($resolvedKey !== null) {
                $results[$resolvedKey] = $item;
            }
        }
        return new static($results);
    }

    public function groupBy(string|callable $groupBy): static
    {
        $results = [];
        foreach ($this->items as $key => $item) {
            $resolvedKey = is_callable($groupBy) ? $groupBy($item, $key) : (is_object($item) ? ($item->$groupBy ?? null) : ($item[$groupBy] ?? null));
            $results[$resolvedKey][] = $item;
        }
        return new static(array_map(fn($group) => new static($group), $results));
    }

    public function sortBy(string|callable $callback, int $options = SORT_REGULAR, bool $descending = false): static
    {
        $results = [];
        $callback = is_callable($callback) ? $callback : fn($item) => is_object($item) ? ($item->$callback ?? null) : ($item[$callback] ?? null);

        foreach ($this->items as $key => $value) {
            $results[$key] = $callback($value, $key);
        }

        $descending ? arsort($results, $options) : asort($results, $options);

        foreach (array_keys($results) as $key) {
            $results[$key] = $this->items[$key];
        }

        return new static($results);
    }

    public function sortByDesc(string|callable $callback, int $options = SORT_REGULAR): static
    {
        return $this->sortBy($callback, $options, true);
    }

    public function values(): static
    {
        return new static(array_values($this->items));
    }

    public function keys(): static
    {
        return new static(array_keys($this->items));
    }

    public function unique(?string $key = null): static
    {
        if (is_null($key)) {
            return new static(array_unique($this->items, SORT_REGULAR));
        }
        $exists = [];
        return $this->filter(function ($item) use ($key, &$exists) {
            $id = is_object($item) ? ($item->$key ?? null) : ($item[$key] ?? null);
            if (in_array($id, $exists, true)) {
                return false;
            }
            $exists[] = $id;
            return true;
        });
    }

    public function sum(string|callable|null $callback = null): float|int
    {
        if (is_null($callback)) {
            return array_sum($this->items);
        }
        $callback = is_callable($callback) ? $callback : fn($item) => is_object($item) ? ($item->$callback ?? 0) : ($item[$callback] ?? 0);
        $total = 0;
        foreach ($this->items as $key => $item) {
            $total += $callback($item, $key);
        }
        return $total;
    }

    public function avg(string|callable|null $callback = null): float|int|null
    {
        $count = $this->count();
        if ($count === 0) return null;
        return $this->sum($callback) / $count;
    }

    public function get(string|int $key, mixed $default = null): mixed
    {
        return array_key_exists($key, $this->items) ? $this->items[$key] : $default;
    }

    public function put(string|int $key, mixed $value): static
    {
        $this->items[$key] = $value;
        return $this;
    }

    public function forget(string|int|array $keys): static
    {
        foreach ((array) $keys as $key) {
            unset($this->items[$key]);
        }
        return $this;
    }

    public function contains(mixed $key, mixed $operator = null, mixed $value = null): bool
    {
        if (func_num_args() === 1) {
            if (is_callable($key)) {
                return !is_null($this->first($key));
            }
            return in_array($key, $this->items, true);
        }

        if (func_num_args() === 2) {
            $value = $operator;
            $operator = '=';
        }

        return !is_null($this->first(function ($item) use ($key, $operator, $value) {
            $retrieved = is_object($item) ? ($item->$key ?? null) : ($item[$key] ?? null);
            return $retrieved == $value;
        }));
    }

    public function push(mixed ...$values): static
    {
        foreach ($values as $value) {
            $this->items[] = $value;
        }
        return $this;
    }

    public function each(callable $callback): static
    {
        foreach ($this->items as $key => $item) {
            if ($callback($item, $key) === false) {
                break;
            }
        }
        return $this;
    }

    public function mapWithKeys(callable $callback): static
    {
        $result = [];
        foreach ($this->items as $key => $value) {
            $assoc = $callback($value, $key);
            foreach ($assoc as $mapKey => $mapValue) {
                $result[$mapKey] = $mapValue;
            }
        }
        return new static($result);
    }

    public function getIterator(): Traversable
    {
        return new ArrayIterator($this->items);
    }

    public function offsetExists(mixed $offset): bool
    {
        return array_key_exists($offset, $this->items);
    }

    public function offsetGet(mixed $offset): mixed
    {
        return $this->items[$offset] ?? null;
    }

    public function offsetSet(mixed $offset, mixed $value): void
    {
        if (is_null($offset)) {
            $this->items[] = $value;
        } else {
            $this->items[$offset] = $value;
        }
    }

    public function offsetUnset(mixed $offset): void
    {
        unset($this->items[$offset]);
    }

    public function jsonSerialize(): mixed
    {
        return array_map(function ($value) {
            if ($value instanceof JsonSerializable) {
                return $value->jsonSerialize();
            } elseif ($value instanceof self || (is_object($value) && method_exists($value, 'toArray'))) {
                return $value->toArray();
            }
            return $value;
        }, $this->items);
    }
}
