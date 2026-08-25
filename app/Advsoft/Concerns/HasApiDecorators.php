<?php

namespace App\Advsoft\Concerns;


/**
 * HasApiDecorators
 *
 * @version    2.0.0
 * @package    Advsoft
 * @author     Taufik
 * @author     AdvSoft Team
 * @copyright  Copyright (c) 2026 AdvSoft Technologies
 * @license    https://opensource.org/licenses/MIT MIT License
 */
trait HasApiDecorators
{
    // ── Registration storage ─────────────────────────────
    protected array $computeMethods = [];
    protected array $onchangeMethods = [];
    protected array $constraintMethods = [];
    protected array $modelMethods = [];

    // ── Dependency map: field → compute methods to trigger ─
    protected array $dependsMap = [];

    // ══════════════════════════════════════════════════════
    //  @api.depends — Trigger field recomputation
    // ══════════════════════════════════════════════════════

    /**
     * Register a computed field method with its dependencies.
     *
     * @param string $method  Method name on this definition class
     * @param array  $depends Array of field names that trigger recompute
     * @param string|null $targetField The field being computed (optional, auto-detected from method name)
     */
    protected function apiDepends(string $method, array $depends, ?string $targetField = null): void
    {
        $this->computeMethods[$method] = $depends;

        // Build reverse dependency map: when field X changes → run method Y
        foreach ($depends as $dep) {
            $this->dependsMap[$dep][] = $method;
        }
    }

    /**
     * Get all compute methods that should trigger when given fields change.
     */
    public function getComputeMethodsForFields(array $changedFields): array
    {
        $methods = [];
        foreach ($changedFields as $field) {
            if (isset($this->dependsMap[$field])) {
                $methods = array_merge($methods, $this->dependsMap[$field]);
            }
        }
        return array_unique($methods);
    }

    /**
     * Execute all @api.depends computations for changed fields.
     * Returns updated values array (UI-side computed fields).
     */
    public function executeDepends(object $record, array $values, array $changedFields): array
    {
        $methods = $this->getComputeMethodsForFields($changedFields);
        foreach ($methods as $method) {
            if (method_exists($this, $method)) {
                $result = $this->{$method}($record, $values);
                if (is_array($result)) {
                    $values = array_merge($values, $result);
                }
            }
        }
        return $values;
    }

    // ══════════════════════════════════════════════════════
    //  @api.constrains — Validation on write/create
    // ══════════════════════════════════════════════════════

    /**
     * Register a constraint method that validates on write/create.
     *
     * @param string $method Method name (should return null on success, error string on failure)
     * @param array  $fields Fields that trigger this constraint check
     */
    protected function apiConstrains(string $method, array $fields): void
    {
        $this->constraintMethods[$method] = $fields;
    }

    /**
     * Run all @api.constrains validations for affected fields.
     * Returns first error message or null if all pass.
     */
    public function validateConstraints(object $record, array $values): ?string
    {
        foreach ($this->constraintMethods as $method => $fields) {
            $affectedFields = array_intersect(array_keys($values), $fields);
            if (!empty($affectedFields) && method_exists($this, $method)) {
                $error = $this->{$method}($record, $values);
                if ($error) return $error;
            }
        }
        return null;
    }

    // ══════════════════════════════════════════════════════
    //  @api.onchange — UI-only change triggers
    // ══════════════════════════════════════════════════════

    /**
     * Register an onchange method (UI-only, values NOT stored automatically).
     *
     * @param string $method Method name (receives field name + current values, returns modified values)
     * @param array  $fields Fields that trigger this onchange
     */
    protected function apiOnchange(string $method, array $fields): void
    {
        $this->onchangeMethods[$method] = $fields;
    }

    /**
     * Process @api.onchange for a changed field.
     * Returns updated values dict (frontend applies these without storing).
     */
    public function applyOnchange(string $field, array $values): array
    {
        foreach ($this->onchangeMethods as $method => $triggerFields) {
            if (in_array($field, $triggerFields) && method_exists($this, $method)) {
                $result = $this->{$method}($field, $values);
                if (is_array($result)) {
                    $values = array_merge($values, $result);
                }
            }
        }
        return $values;
    }

    /**
     * Process @api.onchange for multiple changed fields at once.
     */
    public function applyOnchangeMulti(array $changedFields, array $values): array
    {
        foreach ($changedFields as $field) {
            $values = $this->applyOnchange($field, $values);
        }
        return $values;
    }

    // ══════════════════════════════════════════════════════
    //  @api.model — Class-level methods (no self record)
    // ══════════════════════════════════════════════════════

    /**
     * Register a model-level method (callable without a specific record).
     * E.g., default_get(), create(), custom actions.
     */
    protected function apiModel(string $method): void
    {
        $this->modelMethods[] = $method;
    }

    /**
     * Check if a method is registered as @api.model.
     */
    public function isModelMethod(string $method): bool
    {
        return in_array($method, $this->modelMethods);
    }

    /**
     * default_get — Return default values for new records.
     * Collects defaults from field definitions + custom logic.
     */
    public function defaultGet(?array $fieldNames = null): array
    {
        $defaults = [];
        $fields = $fieldNames
            ? array_intersect_key($this->getFields(), array_flip($fieldNames))
            : $this->getFields();

        foreach ($fields as $name => $field) {
            if ($field->default !== null) {
                $defaults[$name] = is_callable($field->default) ? ($field->default)() : $field->default;
            }
        }

        // Allow subclass to add custom defaults
        if (method_exists($this, '_default_get')) {
            $customs = $this->_default_get($defaults);
            if (is_array($customs)) {
                $defaults = array_merge($defaults, $customs);
            }
        }

        return $defaults;
    }

    // ══════════════════════════════════════════════════════
    //  Introspection (for debug/admin)
    // ══════════════════════════════════════════════════════

    /**
     * Export all registered decorators for introspection.
     */
    public function getDecorators(): array
    {
        return [
            'depends' => $this->computeMethods,
            'constrains' => $this->constraintMethods,
            'onchange' => $this->onchangeMethods,
            'model' => $this->modelMethods,
        ];
    }
}
