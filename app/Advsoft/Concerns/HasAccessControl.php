<?php

namespace App\Advsoft\Concerns;

use App\Advsoft\{Registry, Domain, Field, Security\SecurityContext, Security\SecurityService};
use App\Advsoft\Exceptions\AccessDenied;

/**
 * HasAccessControl — Odoo-style security system (full odoo2.png parity).
 *
 * Six layers of enforcement (matches odoo2.png diagram):
 *   1. res.users / res.groups         → identify caller & groups
 *   2. ir.model.access                → model-level CRUD per group
 *   3. ir.rule                        → record-level domain restriction
 *   4. with_user() / sudo() / for_company() → context switching
 *   5. Field groups= / readonly / invisible → field-level stripping
 *   6. PostgreSQL row-level rules     → enforced by Eloquent + where clauses
 *
 * Two ways to declare ACLs:
 *   A. In-code DSL  (old way, still works — declarative in *Def.php)
 *      $this->setAccess([...])
 *      $this->addAccessRule('group', [...])
 *      $this->addRecordRule(...)
 *      $this->setFieldAccess(...)
 *
 *   B. Database-driven (Odoo standard — ir.model.access + ir.rule tables)
 *      Auto-synced from Registry; managed via UI or seeder.
 *
 * At runtime, BOTH are checked. DB ACLs take precedence (explicit data wins).
 *
 * Instance methods (Odoo parity):
 *   $rec->check_access_rights('write', raise=true)
 *   $rec->check_access_rule('read')
 *   $rec->check_access('write')                 → convenience: rights + rule
 *   $rec->sudo()                                 → bypass ACL
 *   $rec->sudo(false)                            → drop sudo
 *   $rec->with_user($user)                       → impersonate
 *   $rec->with_context(['company_id' => 5])
 *   $rec->get_metadata('res.users')              → fields_get filtered
 */
trait HasAccessControl
{
    // ── CRUD access ─────────────────────────────────────
    protected array $access = [
        'read'   => true,
        'write'  => true,
        'create' => true,
        'unlink' => true,
    ];

    // ── Group-based access rules (ir.model.access) ──────
    protected array $groupAccess = [];
    // Format: ['group_name' => ['read', 'write', 'create', 'unlink']]

    // ── Record rules (ir.rule) ──────────────────────────
    protected array $recordRules = [];
    // Format: [['name' => 'rule_name', 'domain' => [...], 'apply_on' => ['read','write'], 'groups' => ['user']]]

    // ── Field-level access ──────────────────────────────
    protected array $fieldAccess = [];
    // Format: ['field_name' => ['read' => true|'group_name', 'write' => true|'group_name']]

    // ══════════════════════════════════════════════════════
    //  Layer 1: Model-level CRUD access
    // ══════════════════════════════════════════════════════

    /**
     * Set model-level CRUD access (default for all users).
     */
    protected function setAccess(array $access): void
    {
        $this->access = array_merge($this->access, $access);
    }

    /**
     * Add group-based access rule (ir.model.access equivalent).
     *
     * @param string $group      Group/role name
     * @param array  $operations Allowed operations: ['read', 'write', 'create', 'unlink']
     */
    protected function addAccessRule(string $group, array $operations): void
    {
        $this->groupAccess[$group] = $operations;
    }

    /**
     * Check if current user has CRUD access.
     * Checks: default access → group-based overrides.
     */
    public function checkAccess(string $operation): bool
    {
        // Default access check
        $allowed = $this->access[$operation] ?? false;

        // Group-based access could override
        $user = $this->getCurrentUser();
        if ($user && !empty($this->groupAccess)) {
            foreach ($this->groupAccess as $group => $ops) {
                if ($this->userInGroup($user, $group)) {
                    // If group explicitly allows this operation
                    if (in_array($operation, $ops)) {
                        return true;
                    }
                }
            }
            // If group rules exist but none match, deny (strict mode)
            // For now, fall through to default
        }

        return $allowed;
    }

    /**
     * Get all access rights for introspection.
     */
    public function getAccessRights(): array
    {
        return $this->access;
    }

    // ══════════════════════════════════════════════════════
    //  Layer 2: Record-level rules (ir.rule)
    // ══════════════════════════════════════════════════════

    /**
     * Add a record-level security rule.
     * Domain can use special values:
     *   __user_id__   → current user ID
     *   __user_name__ → current user name
     *   __today__     → current date
     *
     * @param string $name     Rule name (for debugging)
     * @param array  $domain   Domain filter (Odoo-style)
     * @param array  $applyOn  Operations to apply on: ['read', 'write', 'unlink']
     * @param array  $groups   Groups this rule applies to (empty = all users)
     */
    protected function addRecordRule(string $name, array $domain, array $applyOn = ['read'], array $groups = []): void
    {
        $this->recordRules[] = [
            'name'     => $name,
            'domain'   => $domain,
            'apply_on' => $applyOn,
            'groups'   => $groups,
        ];
    }

    /**
     * Get all record rules.
     */
    public function getRecordRules(): array
    {
        return $this->recordRules;
    }

    /**
     * Apply record rules to a query for a specific operation.
     * Resolves dynamic values (__user_id__, __today__, etc.).
     */
    public function applyRecordRules(mixed $query, string $operation = 'read'): mixed
    {
        $user = $this->getCurrentUser();

        foreach ($this->recordRules as $rule) {
            $applyOn = is_array($rule['apply_on'] ?? null)
                ? $rule['apply_on']
                : [$rule['apply_on'] ?? 'read'];

            if (!in_array($operation, $applyOn)) continue;

            // Check group restriction
            if (!empty($rule['groups']) && $user) {
                $matches = false;
                foreach ($rule['groups'] as $group) {
                    if ($this->userInGroup($user, $group)) {
                        $matches = true;
                        break;
                    }
                }
                if (!$matches) continue;
            }

            // Resolve dynamic domain values
            $domain = $this->resolveRuleDomain($rule['domain']);
            $query = Domain::apply($query, $domain, $this);
        }

        return $query;
    }

    /**
     * Resolve dynamic placeholders in record rule domains.
     */
    protected function resolveRuleDomain(array $domain): array
    {
        $user = $this->getCurrentUser();
        $resolved = [];

        foreach ($domain as $condition) {
            if (is_array($condition) && count($condition) === 3) {
                $value = $condition[2];
                if ($value === '__user_id__') {
                    $value = $user?->id ?? 0;
                } elseif ($value === '__user_name__') {
                    $value = $user?->name ?? '';
                } elseif ($value === '__today__') {
                    $value = date('Y-m-d');
                } elseif ($value === '__now__') {
                    $value = date('Y-m-d H:i:s');
                }
                $resolved[] = [$condition[0], $condition[1], $value];
            } else {
                $resolved[] = $condition;
            }
        }

        return $resolved;
    }

    // ══════════════════════════════════════════════════════
    //  Layer 5: Field-level access control
    // ══════════════════════════════════════════════════════

    protected function setFieldAccess(string $field, $read = true, $write = true): void
    {
        $this->fieldAccess[$field] = ['read' => $read, 'write' => $write];
    }

    public function checkFieldAccess(string $field): array
    {
        $access = $this->fieldAccess[$field] ?? ['read' => true, 'write' => true];
        $user = $this->getCurrentUser();

        $result = [];
        foreach (['read', 'write'] as $op) {
            $perm = $access[$op] ?? true;
            if (is_string($perm)) {
                // It's a group name — check if user is in that group
                $result[$op] = $user ? $this->userInGroup($user, $perm) : false;
            } else {
                $result[$op] = (bool) $perm;
            }
        }

        return $result;
    }

    // ══════════════════════════════════════════════════════
    //  User/Group resolution helpers
    // ══════════════════════════════════════════════════════

    /**
     * Get current authenticated user.
     */
    protected function getCurrentUser(): ?object
    {
        // Try Laravel auth
        if (function_exists('auth') && auth()->check()) {
            return auth()->user();
        }
        return null;
    }

    /**
     * Check if user belongs to a group/role.
     * Integrates with Laravel's role/permission system if available.
     */
    protected function userInGroup($user, string $group): bool
    {
        // Check Laravel Spatie permissions if available
        if (method_exists($user, 'hasRole')) {
            return $user->hasRole($group);
        }

        // Check simple 'role' column
        if (isset($user->role)) {
            return $user->role === $group;
        }

        // Check group via many-to-many relation
        if (method_exists($user, 'groups')) {
            return $user->groups()->where('name', $group)->exists();
        }

        // Fallback: admin group always has access
        if ($group === 'admin' && isset($user->is_admin)) {
            return (bool) $user->is_admin;
        }

        return false;
    }

    // ══════════════════════════════════════════════════════
    //  Introspection
    // ══════════════════════════════════════════════════════

    /**
     * Export security configuration for admin/debug.
     */
    public function getSecurityInfo(): array
    {
        return [
            'model_access'  => $this->access,
            'group_access'  => $this->groupAccess,
            'record_rules'  => array_map(fn($r) => [
                'name' => $r['name'],
                'domain' => $r['domain'],
                'apply_on' => $r['apply_on'],
                'groups' => $r['groups'],
            ], $this->recordRules),
            'field_access'  => $this->fieldAccess,
        ];
    }

    // ══════════════════════════════════════════════════════
    //  ODOO-PARITY INSTANCE METHODS
    //  Mirrors Odoo's recordset API:
    //    - check_access_rights(op, raise)
    //    - check_access_rule(op)
    //    - check_access(op, ids)
    //    - sudo([flag])
    //    - with_user(user)
    //    - with_context(ctx)
    //    - has_access(op)
    //  See: odoo/models.py @ line ~1500
    // ══════════════════════════════════════════════════════

    /** @var bool Superuser flag (bypass all ACLs) */
    protected bool $_isSuperuser = false;

    /** @var \App\Model\Res\ResUser|null Override user for this recordset */
    protected ?\App\Model\Res\ResUser $_user = null;

    /** @var int|null Override company for this recordset */
    protected ?int $_companyId = null;

    /** @var array Extra context (lang, tz, default_*, …) */
    protected array $_context = [];

    /**
     * Get the SecurityService bound to this record.
     */
    public function getSecurityService(): SecurityService
    {
        return app(SecurityService::class);
    }

    public function getSecurityContext(): SecurityContext
    {
        return app(SecurityContext::class);
    }

    /**
     * check_access_rights(operation, raise_exception=True)
     * Odoo: returns True if access is granted. If raise_exception=True and denied,
     * throws AccessError.
     *
     * In AdvSoft: also checks in-code $this->access AND DB ir.model.access.
     */
    public function checkAccessRights(string $operation, bool $raise = true): bool
    {
        // 1. superuser bypass
        if ($this->_isSuperuser) return true;
        if ($this->getSecurityContext()->isSuperuser()) return true;

        $modelName = $this->getModelName();
        $svc = $this->getSecurityService();
        $svc->syncModels([static::class]);  // ensure registered

        // 2. DB ir.model.access check
        // If the model has ANY rules defined in DB, DB is the strict source of truth.
        $modelId = \App\Model\Ir\IrModel::where('model', $modelName)->value('id');
        $hasDbRules = $modelId ? \App\Model\Ir\IrModelAccess::where('model_id', $modelId)->where('active', true)->exists() : false;

        if ($hasDbRules) {
            try {
                return $svc->checkAccessRights($modelName, $operation, $raise);
            } catch (AccessDenied $e) {
                if ($raise) throw $e;
                return false;
            }
        }

        // 3. in-code $this->access DSL check (Fallback)
        $declared = $this->access[$operation] ?? false;
        if ($declared === true) {
            return true;
        }

        if ($raise) throw new AccessDenied("Access denied by DSL.");
        return false;
    }

    /**
     * check_access_rule(operation) — verify records pass active record rules.
     *  Must be called on a recordset with ids. Loads model, evaluates each rule.
     */
    public function checkAccessRule(string $operation, ?array $ids = null, bool $raise = true): bool
    {
        if ($this->_isSuperuser) return true;
        if ($this->getSecurityContext()->isSuperuser()) return true;

        $modelName = $this->getModelName();
        $ids ??= $this->getKey() !== null ? [$this->getKey()] : ($this->getQueueableIds() ?? []);

        try {
            return $this->getSecurityService()->checkAccessRule($modelName, $operation, $ids, $raise);
        } catch (AccessDenied $e) {
            if ($raise) throw $e;
            return false;
        }
    }

    /**
     * check_access(operation, ids=False)  —  Odoo name
     * Combines check_access_rights + check_access_rule.
     * Aliased to checkAccessFor() to avoid signature collision with the legacy
     * model-level checkAccess(string $operation) method.
     */
    public function checkAccessFor(string $operation, mixed $ids = null, bool $raise = true): bool
    {
        if (!$this->checkAccessRights($operation, $raise)) return false;
        $idList = match (true) {
            is_array($ids)  => $ids,
            is_int($ids)    => [$ids],
            $ids === null   => $this->exists() ? [$this->getKey()] : [],
            default         => [],
        };
        if (!empty($idList)) {
            return $this->checkAccessRule($operation, $idList, $raise);
        }
        return true;
    }

    /**
     * has_access(operation) — returns bool, never throws.
     */
    public function hasAccess(string $operation): bool
    {
        try {
            return $this->checkAccess($operation, null, false);
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * sudo([flag=True]) — returns a copy with superuser flag set.
     */
    public function sudo(bool $flag = true): static
    {
        $clone = clone $this;
        $clone->_isSuperuser = $flag;
        return $clone;
    }

    /**
     * with_user(user) — returns a copy acting as the given user.
     */
    public function withUser(\App\Model\Res\ResUser $user): static
    {
        $clone = clone $this;
        $clone->_user = $user;
        $clone->_isSuperuser = false;
        $clone->_companyId = $user->company_id;
        return $clone;
    }

    /**
     * with_company(company_id) — returns a copy with different company context.
     */
    public function withCompany(int|\App\Model\Res\ResCompany $company): static
    {
        $clone = clone $this;
        $clone->_companyId = is_int($company) ? $company : $company->id;
        return $clone;
    }

    /**
     * with_context(ctx) — merge context dict.
     */
    public function withContext(array $context): static
    {
        $clone = clone $this;
        $clone->_context = array_merge($clone->_context, $context);
        return $clone;
    }

    public function getContext(): array
    {
        return $this->_context;
    }

    public function isSuperuser(): bool
    {
        if ($this->_isSuperuser) return true;
        return $this->getSecurityContext()->isSuperuser();
    }

    /**
     * get_metadata(fields) — return field metadata filtered by user's groups.
     *  Equivalent to Odoo's fields_get().
     */
    public function getMetadata(?array $fields = null): array
    {
        $modelName = $this->getModelName();
        $allFields = $this->getFields();
        if ($fields) {
            $allFields = array_intersect_key($allFields, array_flip($fields));
        }
        return $this->getSecurityService()->filterFieldsMetadata($modelName, $allFields);
    }

    /**
     * Strip forbidden fields from a record (used after read).
     */
    public function filterFields(array $record): array
    {
        $modelName = $this->getModelName();
        return $this->getSecurityService()->filterRecordData($modelName, $record);
    }

    /**
     * getModelName() — return the registry key, e.g. 'project.task'.
     * Tries to use the ModelDefinition's $_name first.
     */
    public function getModelName(): string
    {
        if (property_exists($this, '_name') && !empty($this->_name)) {
            return $this->_name;
        }
        // Derive from class: TaskDef → 'task'
        $cls = class_basename($this);
        $cls = preg_replace('/Def$/', '', $cls);
        return strtolower(preg_replace('/(?<!^)([A-Z])/', '.$1', $cls));
    }

    /**
     * getFields() — return fields array. If the model has a ModelDefinition
     * (via getModelDefinition), use its fields; else fallback to fillable.
     */
    public function getFields(): array
    {
        if (method_exists($this, 'getModelDefinition')) {
            $def = $this->getModelDefinition();
            if ($def && method_exists($def, 'getFields')) {
                return $def->getFields();
            }
        }
        return $this->getFillable() ? array_fill_keys($this->getFillable(), ['type' => 'char']) : [];
    }
}
