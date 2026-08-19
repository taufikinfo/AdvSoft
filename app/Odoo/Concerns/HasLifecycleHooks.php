<?php

namespace App\Odoo\Concerns;

use Adianti\Database\TTransaction;

/**
 * Trait HasLifecycleHooks — Odoo-style Model Lifecycle Hooks.
 *
 * Provides:
 *   - beforeCreate(&$values)   — Validate or transform values before insert
 *   - afterCreate($record, $values) — Trigger side effects (events, logging)
 *   - beforeWrite($record, &$values) — Validate state transitions, transform
 *   - afterWrite($record, $values)   — Recalculate dependents, cascade
 *   - beforeUnlink($record)    — Guard against deletion (return error string to block)
 *   - afterUnlink($id)         — Cleanup related resources
 *   - nameGet($record)         — Custom display name generator
 *   - nameSearch($query)       — Custom search logic for M2O dropdowns
 */
trait HasLifecycleHooks
{
    /** Flag to disable hooks during batch/migration ops */
    public bool $enableLifecycleHooks = true;

    public function performCreate(array $vals): object
    {
        $hasTx = (bool) TTransaction::get();
        if (!$hasTx) {
            TTransaction::open('adiantisoft');
        }
        try {
            if ($this->enableLifecycleHooks) {
                $vals = $this->applyDefaults($vals);
                $this->beforeCreate($vals);
            }

            $scalar = $this->prepareWriteValues($vals);
            $record = ($this->modelClass)::create($scalar);

            $this->applyRelationalWrites($record, $vals);

            if ($this->enableLifecycleHooks) {
                if (method_exists($this, 'validateConstraints')) {
                    $error = $this->validateConstraints($record, $vals);
                    if ($error) {
                        throw new \RuntimeException($error);
                    }
                }
                $this->recomputeStoredFields($record);
                $this->afterCreate($record, $vals);
            }

            if (!$hasTx) {
                TTransaction::close();
            }
            return $record;
        } catch (\Throwable $e) {
            if (!$hasTx) {
                TTransaction::rollback();
            }
            throw $e;
        }
    }

    public function performWrite(array $ids, array $vals): array
    {
        $hasTx = (bool) TTransaction::get();
        if (!$hasTx) {
            TTransaction::open('adiantisoft');
        }
        try {
            $scalar = $this->prepareWriteValues($vals);
            foreach ($ids as $id) {
                $record = ($this->modelClass)::find($id);
                if (!$record) continue;

                if ($this->enableLifecycleHooks) {
                    $this->beforeWrite($record, $vals);
                }

                $record->fill($scalar);
                $record->save();
                $this->applyRelationalWrites($record, $vals);

                if ($this->enableLifecycleHooks) {
                    if (method_exists($this, 'validateConstraints')) {
                        $error = $this->validateConstraints($record, $vals);
                        if ($error) {
                            throw new \RuntimeException($error);
                        }
                    }
                    $this->recomputeStoredFields($record);
                    $this->afterWrite($record, $vals);
                }
            }

            if (!$hasTx) {
                TTransaction::close();
            }
            return $ids;
        } catch (\Throwable $e) {
            if (!$hasTx) {
                TTransaction::rollback();
            }
            throw $e;
        }
    }

    public function performUnlink(array $ids): ?string
    {
        $hasTx = (bool) TTransaction::get();
        if (!$hasTx) {
            TTransaction::open('adiantisoft');
        }
        try {
            foreach ($ids as $id) {
                $record = ($this->modelClass)::find($id);
                if (!$record) continue;

                if ($this->enableLifecycleHooks) {
                    $error = $this->beforeUnlink($record);
                    if ($error) {
                        throw new \RuntimeException($error);
                    }
                }
                $record->delete();
                if ($this->enableLifecycleHooks) {
                    $this->afterUnlink($id);
                }
            }

            if (!$hasTx) {
                TTransaction::close();
            }
            return null;
        } catch (\Throwable $e) {
            if (!$hasTx) {
                TTransaction::rollback();
            }
            throw $e;
        }
    }

    public function nameGet(object $record): string
    {
        $recName = $this->_rec_name ?? 'name';
        return (string) ($record->$recName ?? "#{$record->id}");
    }

    public function nameSearch(string $query, array $domain = [], int $limit = 8): array
    {
        $recName = $this->_rec_name ?? 'name';
        $q = ($this->modelClass)::query();

        if ($query !== '') {
            $q->where($recName, 'like', "%{$query}%");
        }

        if (!empty($domain)) {
            $this->applyDomainToQuery($q, $domain);
        }

        $records = $q->limit($limit)->get();
        $results = [];
        foreach ($records as $r) {
            $results[] = [
                'id'           => $r->id,
                'display_name' => $this->nameGet($r),
            ];
        }
        return $results;
    }

    protected function beforeCreate(array &$vals): void {}
    protected function afterCreate(object $record, array $vals): void {}
    protected function beforeWrite(object $record, array &$vals): void {}
    protected function afterWrite(object $record, array $vals): void {}
    protected function beforeUnlink(object $record): ?string { return null; }
    protected function afterUnlink(int|string $id): void {}
}
