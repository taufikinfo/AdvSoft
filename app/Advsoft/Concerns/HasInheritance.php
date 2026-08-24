<?php

namespace App\Advsoft\Concerns;

use App\Advsoft\{Registry, Field};

/**
 * HasInheritance — Odoo-style model inheritance engine.
 *
 * Three types of inheritance (matching Odoo exactly):
 *
 * 1. _inherit = "model.x" (same _name)
 *    → Class extension: merges fields/views/logic into the SAME table.
 *    → Most common. Like Python's class Child(Model): _inherit = 'parent'.
 *
 * 2. _inherits = { "res.partner" => "partner_id" }
 *    → Delegation: two tables, FK auto-created.
 *    → Child can read/write parent fields transparently.
 *    → Like Python's _inherits = { 'res.partner': 'partner_id' }.
 *
 * 3. _inherit = "model.x" + different _name
 *    → Copy: creates a NEW model with its own table, copying all fields/logic.
 *    → Rarely used in practice.
 */
trait HasInheritance
{
    // ── Inheritance attributes ──────────────────────────
    // public array $_inherit = [];        // Already in ModelDefinition
    public array $_inherits = [];          // Delegation: ['model.name' => 'fk_field']

    // ── Tracking ────────────────────────────────────────
    private bool $_inheritanceResolved = false;
    private array $_inheritedFrom = [];   // Track which models we inherited from

    // ══════════════════════════════════════════════════════
    //  Type 1: _inherit (class extension, same table)
    // ══════════════════════════════════════════════════════

    /**
     * Resolve _inherit chain: merge fields, views, constraints, hooks from parent.
     * Called by Registry during boot phase.
     */
    public function resolveInheritance(): void
    {
        if ($this->_inheritanceResolved) return;
        $this->_inheritanceResolved = true;

        // Type 1 & 3: _inherit merging
        foreach ($this->_inherit as $parentName) {
            $parent = Registry::get($parentName);
            if (!$parent) continue;

            // Ensure parent is resolved first
            if (method_exists($parent, 'resolveInheritance')) {
                $parent->resolveInheritance();
            }

            $this->mergeFromParent($parent);
            $this->_inheritedFrom[] = $parentName;
        }

        // Type 2: _inherits (delegation)
        foreach ($this->_inherits as $delegateModel => $fkField) {
            $this->setupDelegation($delegateModel, $fkField);
        }
    }

    /**
     * Merge fields, views, and business logic from parent definition.
     * Child fields take precedence (can override parent).
     */
    protected function mergeFromParent($parent): void
    {
        // Merge fields (parent fields first, child can override)
        $parentFields = $parent->getFields();
        $childFields = $this->getFields();

        foreach ($parentFields as $name => $field) {
            if (!isset($childFields[$name])) {
                // Import parent field (clone to avoid shared state)
                $this->fields[$name] = clone $field;
            }
        }

        // Merge views (child takes precedence)
        if (empty($this->listView) && !empty($parent->getListView())) {
            $this->listView = $parent->getListView();
        }
        if (empty($this->formView) && !empty($parent->getFormView())) {
            $this->formView = $parent->getFormView();
        }
        if (empty($this->searchView) && !empty($parent->getSearchView())) {
            $this->searchView = $parent->getSearchView();
        }

        // Merge security (most permissive wins for parent, child can restrict)
        $parentAccess = $parent->getAccessRights();
        foreach ($parentAccess as $op => $allowed) {
            if (!isset($this->access[$op])) {
                $this->access[$op] = $allowed;
            }
        }

        // Merge record rules
        $parentRules = $parent->getRecordRules();
        $this->recordRules = array_merge($parentRules, $this->recordRules);
    }

    // ══════════════════════════════════════════════════════
    //  Type 2: _inherits (delegation, two tables)
    // ══════════════════════════════════════════════════════

    /**
     * Setup delegation inheritance: auto-add FK field + proxy fields.
     * Like Odoo's _inherits = { 'res.partner': 'partner_id' }.
     */
    protected function setupDelegation(string $delegateModel, string $fkField): void
    {
        $delegate = Registry::get($delegateModel);
        if (!$delegate) return;

        // Auto-add the FK field if not already defined
        if (!isset($this->fields[$fkField])) {
            $this->addField($fkField, Field::MANY2ONE, [
                'string' => $delegate->_description . ' (delegate)',
                'relation' => $delegateModel,
                'required' => true,
                'ondelete' => 'cascade',
                'invisible' => true,  // Hidden from views
                'store' => true,
            ]);
        }

        // Import delegate's fields as "related" proxy fields
        foreach ($delegate->getFields() as $name => $field) {
            if (!isset($this->fields[$name]) && $name !== 'id') {
                $proxy = clone $field;
                // Mark as delegated — reads/writes go through the FK
                $proxy->store = false;  // Not in this table
                $proxy->relatedField = $fkField . '.' . $name;
                $this->fields[$name] = $proxy;
            }
        }

        $this->_inheritedFrom[] = $delegateModel . ' (delegation)';
    }

    /**
     * Read a delegated field value from the related model.
     */
    public function readDelegatedField($record, string $fieldName): mixed
    {
        foreach ($this->_inherits as $delegateModel => $fkField) {
            $delegate = Registry::get($delegateModel);
            if (!$delegate) continue;

            $delegateFields = $delegate->getFields();
            if (isset($delegateFields[$fieldName])) {
                $relName = str_replace('_id', '', $fkField);
                $related = $record->$relName;
                return $related ? $related->$fieldName : null;
            }
        }
        return null;
    }

    /**
     * Write a delegated field value to the related model.
     */
    public function writeDelegatedField($record, string $fieldName, $value): void
    {
        foreach ($this->_inherits as $delegateModel => $fkField) {
            $delegate = Registry::get($delegateModel);
            if (!$delegate) continue;

            $delegateFields = $delegate->getFields();
            if (isset($delegateFields[$fieldName])) {
                $relName = str_replace('_id', '', $fkField);
                $related = $record->$relName;
                if ($related) {
                    $related->update([$fieldName => $value]);
                }
                return;
            }
        }
    }

    // ══════════════════════════════════════════════════════
    //  Introspection
    // ══════════════════════════════════════════════════════

    /**
     * Get the list of models this definition inherits from.
     */
    public function getInheritedModels(): array
    {
        return $this->_inheritedFrom;
    }

    /**
     * Check if this model inherits from another.
     */
    public function inheritsFrom(string $modelName): bool
    {
        return in_array($modelName, $this->_inherit)
            || array_key_exists($modelName, $this->_inherits);
    }

    /**
     * Check if this is a delegation inheritance.
     */
    public function hasDelegation(): bool
    {
        return !empty($this->_inherits);
    }

    /**
     * Get inheritance type for this model.
     */
    public function getInheritanceType(): string
    {
        if (!empty($this->_inherits)) return 'delegation';
        if (!empty($this->_inherit)) return 'extension';
        return 'none';
    }
}
