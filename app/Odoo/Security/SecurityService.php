<?php

namespace App\Odoo\Security;

use App\Model\Ir\IrModel;
use App\Model\Ir\IrModelAccess;
use App\Model\Ir\IrRule;
use App\Model\Res\ResUser;
use App\Odoo\Domain;
use App\Odoo\Exceptions\AccessDenied;

/**
 * SecurityService — the enforcement brain of AdvSoft security.
 *
 * Implements the 6 layers from odoo2.png:
 *   1. res.users            → identify caller
 *   2. res.groups           → resolve user's group set
 *   3. ir.model.access      → model-level CRUD permission
 *   4. ir.rule              → record-level (row) domain restriction
 *   5. record.sudo() / .with_user() → context switching
 *   6. field groups= / readonly / invisible → field-level stripping
 *
 * Plus: dynamic model registry sync from AdvSoft's Registry.
 */
class SecurityService
{
    public function __construct(protected SecurityContext $ctx) {}

    /**
     * Always resolve the live SecurityContext from the container.
     * This is critical: when someone does $ctx = $ctx->sudo(true),
     * they get a new instance; SecurityService must follow.
     */
    protected function live(): SecurityContext
    {
        return app(SecurityContext::class);
    }
    public function authenticate(string $login, string $password): ?ResUser
    {
        $user = ResUser::where('login', '=', $login)->first();
        if (!$user) {
            return null;
        }

        if (password_verify($password, $user->password) || $password === $user->password) {
            return $user;
        }

        return null;
    }

    // ─────────────────────────────────────────────────────────
    //  LAYER 0: Sync ir_model with the AdvSoft model registry
    //  Called on every request, idempotent.
    // ─────────────────────────────────────────────────────────
    public function syncModels(array $models): void
    {
        $existing = IrModel::pluck('id', 'model')->all();
        foreach ($models as $model) {
            $name = class_basename($model);
            $modelName = $this->extractModelName($model);
            if (!$modelName) continue;

            if (!isset($existing[$modelName])) {
                IrModel::create([
                    'model' => $modelName,
                    'name'  => $name,
                    'module'=> 'AdvSoft',
                ]);
            }
        }
    }

    protected function extractModelName(string $class): ?string
    {
        // Heuristic: 'App\Odoo\Models\Res\ResUserDef' → 'res.user'
        $short = class_basename($class);            // ResUserDef
        $short = preg_replace('/Def$/', '', $short); // ResUser

        // Try to find _name property source — fall back to snake_case
        try {
            $ref = new \ReflectionClass($class);
            if ($ref->hasProperty('_name')) {
                $prop = $ref->getProperty('_name');
                $prop->setAccessible(true);
                $val = $prop->getValue(new $class());
                if ($val) return $val;
            }
        } catch (\Throwable) {}

        // Heuristic camel→snake
        return strtolower(preg_replace('/(?<!^)([A-Z])/', '.$1', $short));
    }

    // ─────────────────────────────────────────────────────────
    //  LAYER 3: ir.model.access — model-level CRUD
    // ─────────────────────────────────────────────────────────

    /**
     * check_access_rights — Odoo: returns bool, raise AccessDenied if raise_exception.
     *  $operation: 'read' | 'write' | 'create' | 'unlink'
     */
    public function checkAccessRights(string $modelName, string $operation, bool $raise = true): bool
    {
        if ($this->live()->isSuperuser()) return true;

        $model = IrModel::where('model', '=', $modelName)->first();
        if (!$model) return true;

        $userGroupIds = $this->live()->getGroupIds();

        \Adianti\Database\TTransaction::open('advsoft');
        $pdo = \Adianti\Database\TTransaction::get();

        $groupClause = "group_id IS NULL";
        if (!empty($userGroupIds)) {
            $inList = implode(',', array_map('intval', $userGroupIds));
            $groupClause .= " OR group_id IN ({$inList})";
        }

        $sql = "SELECT id FROM ir_model_access 
                WHERE active = 1 
                  AND perm_{$operation} = 1 
                  AND model_id = :mid 
                  AND ({$groupClause}) 
                LIMIT 1";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([':mid' => $model->id]);
        $allowed = (bool) $stmt->fetchColumn();
        \Adianti\Database\TTransaction::close();

        if (!$allowed) {
            if ($raise) {
                throw new AccessDenied(sprintf(
                    "Access denied: operation '%s' on %s (user id=%s)",
                    $operation, $modelName, $this->live()->getUserId()
                ));
            }
            return false;
        }
        return true;
    }

    // ─────────────────────────────────────────────────────────
    //  LAYER 4: ir.rule — record-level domain restriction
    // ─────────────────────────────────────────────────────────

    /**
     * check_access_rule — returns true if all $ids pass active rules.
     *  In Odoo: combines all read rules with AND; for write/unlink combines write rules.
     */
    public function checkAccessRule(string $modelName, string $operation, array $ids, bool $raise = true): bool
    {
        if ($this->live()->isSuperuser()) return true;
        if (empty($ids)) return true;

        $rules = $this->getRulesForModel($modelName, $operation);
        if (empty($rules)) return true;  // no rules → no restriction

        // Each rule = "id in {ids matching domain}"
        $allowedIds = $this->applyRules($modelName, $rules);
        $diff = array_diff($ids, $allowedIds);

        if (!empty($diff)) {
            if ($raise) {
                throw new AccessDenied(sprintf(
                    "Access denied (record rule): %d record(s) on %s blocked for user id=%s",
                    count($diff), $modelName, $this->live()->getUserId()
                ));
            }
            return false;
        }
        return true;
    }

    /**
     * Build a single combined domain that filters records
     * to those the current user is allowed to read/operate.
     *
     * In Odoo: per-model read rules AND-combined using OR for same-perm rules
     * within same group. We use simpler approach: OR-combined across all rules.
     */
    public function filterDomain(string $modelName, string $operation = 'read'): array
    {
        if ($this->live()->isSuperuser()) return [];

        $rules = $this->getRulesForModel($modelName, $operation);
        if (empty($rules)) return [];

        $resolvedDomains = [];
        foreach ($rules as $rule) {
            $dom = $this->resolveDomainPlaceholders($rule->domain_force);
            if ($dom === '' || $dom === '[]') continue;
            $resolvedDomains[] = $this->parseDomainString($dom);
        }

        if (empty($resolvedDomains)) return [];
        if (count($resolvedDomains) === 1) {
            return $resolvedDomains[0];
        }
        // OR-combine: ['|', dom1, dom2, dom3, ...]
        return array_merge(['|'], $resolvedDomains[0], ...array_slice($resolvedDomains, 1));
    }

    public function getRulesForModel(string $modelName, string $operation): array
    {
        if ($this->live()->isSuperuser()) return [];

        $model = IrModel::where('model', '=', $modelName)->first();
        if (!$model) return [];

        $userGroupIds = $this->live()->getGroupIds();

        \Adianti\Database\TTransaction::open('advsoft');
        $pdo = \Adianti\Database\TTransaction::get();

        $groupClause = "r.global = 1";
        if (!empty($userGroupIds)) {
            $inList = implode(',', array_map('intval', $userGroupIds));
            $groupClause .= " OR r.id IN (SELECT rule_id FROM ir_rule_groups_rel WHERE group_id IN ({$inList}))";
        }

        $sql = "SELECT r.* FROM ir_rule r 
                WHERE r.active = 1 
                  AND r.perm_{$operation} = 1 
                  AND r.model_id = :mid 
                  AND ({$groupClause})";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([':mid' => $model->id]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];
        \Adianti\Database\TTransaction::close();

        $rules = [];
        foreach ($rows as $row) {
            $rule = new IrRule;
            $rule->fromArray($row);
            $rules[] = $rule;
        }
        return $rules;
    }

    public function applyRules(string $modelName, array $rules): array
    {
        // Returns the set of record IDs allowed by these rules.
        $union = [];
        foreach ($rules as $rule) {
            $dom = $this->resolveDomainPlaceholders($rule->domain_force);
            $parsed = $this->parseDomainString($dom);
            try {
                $ids = $this->queryModel($modelName, $parsed)->pluck('id')->all();
                $union = array_unique(array_merge($union, $ids));
            } catch (\Throwable) {
                // If model has no DB table, skip
                continue;
            }
        }
        return $union;
    }

    protected function resolveDomainPlaceholders(string $domain): string
    {
        $user = $this->live()->getUser();
        $company = $this->live()->getCompany();
        $replacements = [
            '__user_id__'    => (string)($user?->id ?? 0),
            '__uid__'        => (string)($user?->id ?? 0),
            '__user_login__' => "'" . addslashes($user?->login ?? '') . "'",
            '__company_id__' => (string)($company?->id ?? 0),
            '__cid__'        => (string)($company?->id ?? 0),
            '__time__'       => (string)time(),
            '__date__'       => "'" . date('Y-m-d') . "'",
            '__datetime__'   => "'" . date('Y-m-d H:i:s') . "'",
        ];
        return strtr($domain, $replacements);
    }

    protected function parseDomainString(string $domain): array
    {
        $domain = trim($domain);
        if ($domain === '' || $domain === '[]') return [];

        return Domain::parse($domain);
    }

    protected function queryModel(string $modelName, array $domain)
    {
        $modelClass = $this->resolveModelClass($modelName);
        $q = $modelClass::query();
        if (!empty($domain)) {
            (new Domain($domain))->applyToQuery($q);
        }
        return $q;
    }

    protected function resolveModelClass(string $modelName): string
    {
        // Map 'res.users' → \App\Odoo\Models\Res\ResUserDef
        $parts = explode('.', $modelName);
        $ns = 'App\\Odoo\\Models\\' . array_shift($parts);
        $class = $ns . '\\' . implode('', array_map('ucfirst', $parts)) . 'Def';
        if (class_exists($class)) return $class;
        // fallback: try generic
        $class2 = str_replace('Def', '', class_basename($modelName));
        return $class2;
    }

    // ─────────────────────────────────────────────────────────
    //  LAYER 6: field-level groups= / readonly / invisible
    // ─────────────────────────────────────────────────────────

    /**
     * Filter the field metadata returned by fieldsGet().
     * In Odoo: fields with groups= are hidden from users not in those groups.
     */
    public function filterFieldsMetadata(string $modelName, array $fields): array
    {
        if ($this->live()->isSuperuser()) return $fields;
        $userGroupIds = $this->live()->getGroupIds();

        foreach ($fields as $name => $attrs) {
            $groupSpec = $attrs['groups'] ?? null;
            if ($groupSpec && !$this->userMatchesGroups($groupSpec, $userGroupIds)) {
                unset($fields[$name]);
                continue;
            }
            // For visible fields, set readonly per user groups
            // (Laravel-side: we just clean the field; UI handles readonly state)
        }
        return $fields;
    }

    /**
     * Filter record data: strip fields the user cannot read.
     * Used after read/search_read before returning JSON.
     */
    public function filterRecordData(string $modelName, array $record): array
    {
        if ($this->live()->isSuperuser()) return $record;
        $userGroupIds = $this->live()->getGroupIds();

        $fieldsMeta = app(\App\Odoo\Registry::class)->get($modelName)?->getFields() ?? [];
        foreach ($fieldsMeta as $fname => $fdef) {
            $groupSpec = is_array($fdef) ? ($fdef['groups'] ?? null) : ($fdef->groups ?? null);
            if ($groupSpec && !$this->userMatchesGroups($groupSpec, $userGroupIds)) {
                unset($record[$fname]);
            }
        }
        return $record;
    }

    protected function userMatchesGroups(mixed $groupSpec, array $userGroupIds): bool
    {
        // groupSpec can be: 'group.name' (string) | ['group.a', 'group.b'] (array) | comma-separated string
        if (is_string($groupSpec)) {
            $groupSpec = array_map('trim', explode(',', $groupSpec));
        }
        if (!is_array($groupSpec) || empty($groupSpec)) return true;

        foreach ($groupSpec as $nameOrId) {
            if (is_int($nameOrId) && in_array($nameOrId, $userGroupIds, true)) return true;
            if (is_string($nameOrId)) {
                $gid = \App\Model\Res\ResGroup::where('name', $nameOrId)->value('id');
                if ($gid && in_array($gid, $userGroupIds, true)) return true;
            }
        }
        return false;
    }
}
