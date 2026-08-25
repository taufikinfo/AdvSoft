<?php

namespace App\Advsoft\Concerns;

use Adianti\Database\TTransaction;

/**
 * HasLifecycleHooks
 *
 * @version    2.0.0
 * @package    Advsoft
 * @author     Taufik
 * @author     AdvSoft Team
 * @copyright  Copyright (c) 2026 AdvSoft Technologies
 * @license    https://opensource.org/licenses/MIT MIT License
 */
trait HasLifecycleHooks
{
    /** Flag to disable hooks during batch/migration ops */
    public bool $enableLifecycleHooks = true;

    public function performCreate(array $vals): object
    {
        $hasTx = (bool) TTransaction::get();
        if (!$hasTx) {
            TTransaction::open('advsoft');
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
            TTransaction::open('advsoft');
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
            TTransaction::open('advsoft');
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
