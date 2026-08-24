<?php

namespace App\Advsoft;

use Adianti\Database\TTransaction;
use App\Model\BaseModel;

// Import concern traits
use App\Advsoft\Concerns\HasLifecycleHooks;
use App\Advsoft\Concerns\HasApiDecorators;
use App\Advsoft\Concerns\HasInheritance;
use App\Advsoft\Concerns\HasAccessControl;

/**
 * ModelDefinition – Odoo-style model configuration + business logic.
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  models.Model — definisi tabel + logika bisnis              ║
 * ║  _name · _description · _order · _rec_name · _table         ║
 * ║  _inherit · _inherits                                        ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Integrates all four concerns from Odoo's model architecture:
 *   - HasLifecycleHooks:  create() / write() / unlink() / name_get()
 *   - HasApiDecorators:   @api.depends / @api.constrains / @api.onchange / @api.model
 *   - HasInheritance:     _inherit / _inherits / _inherit + _name
 *   - HasAccessControl:   ir.model.access / ir.rule / field-level access
 */
abstract class ModelDefinition
{
    use HasLifecycleHooks;
    use HasApiDecorators;
    use HasInheritance;
    use HasAccessControl;

    // ══════════════════════════════════════════════════════
    //  Odoo-style class attributes
    // ══════════════════════════════════════════════════════
    public string $_name;                    // e.g. 'project.task'
    public string $_description = '';        // Human-readable name
    public string $_module = '';             // Addon module name (e.g. 'account', 'project')
    public string $_table = '';              // DB table name (auto: _name → underscore)
    public string $_order = 'id desc';       // Default sort
    public string $_rec_name = 'name';       // Display name field
    public array $_inherit = [];             // Mixin chain (class extension)
    // $_inherits defined in HasInheritance trait

    // ── Eloquent model class ─────────────────────────────
    public string $modelClass;               // e.g. Task::class

    public function getModule(): string
    {
        if (!empty($this->_module)) {
            return $this->_module;
        }

        $class = static::class;
        if (preg_match('/Addons\\\\([^\\\\]+)/i', $class, $m)) {
            return strtolower($m[1]);
        }
        if (!empty($this->_name)) {
            if (str_starts_with($this->_name, 'project.')) return 'project';
            if (str_starts_with($this->_name, 'account.')) return 'account';
            if (str_starts_with($this->_name, 'res.') || str_starts_with($this->_name, 'ir.')) return 'base';
            if (str_starts_with($this->_name, 'showcase.')) return 'showcase';
        }

        return 'AdvSoft';
    }

    // ── Field definitions ────────────────────────────────
    /** @var Field[] Keyed by field name */
    protected array $fields = [];

    // ── View definitions ─────────────────────────────────
    protected array $listView = [];
    protected array $formView = [];
    protected array $searchView = [];
    protected array $kanbanView = [];
    protected array $calendarView = [];
    protected array $graphView = [];
    protected array $pivotView = [];
    protected array $spreadsheetView = [];

    // ══════════════════════════════════════════════════════
    //  Constructor — drives the full model definition
    // ══════════════════════════════════════════════════════

    public function __construct()
    {
        // Auto-derive table name from _name if not set
        if (empty($this->_table)) {
            $this->_table = str_replace('.', '_', $this->_name) . 's';
        }

        $this->defineFields();
        $this->defineViews();
        $this->defineSecurity();
        $this->defineBusinessLogic();
    }

    // ── Abstract: Subclasses must define these ───────────
    abstract protected function defineFields(): void;

    // ── Optional overrides ───────────────────────────────
    protected function defineViews(): void {}
    protected function defineSecurity(): void {}
    protected function defineBusinessLogic(): void {}

    // ══════════════════════════════════════════════════════
    //  Field helpers
    // ══════════════════════════════════════════════════════

    protected function addField(string $name, string $type, array $attrs = []): Field
    {
        $field = new Field($name, $type, $attrs);
        $this->fields[$name] = $field;
        return $field;
    }

    public function getField(string $name): ?Field
    {
        return $this->fields[$name] ?? null;
    }

    /** @return Field[] */
    public function getFields(): array
    {
        return $this->fields;
    }

    /**
     * fields_get – Return field metadata (Odoo API).
     */
    public function fieldsGet(?array $fieldNames = null): array
    {
        $result = [];
        foreach ($this->fields as $name => $field) {
            if ($fieldNames && !in_array($name, $fieldNames)) continue;
            if ($field->invisible) continue;
            $result[$name] = $field->toArray();
        }
        return $result;
    }

    // ══════════════════════════════════════════════════════
    //  View definitions
    // ══════════════════════════════════════════════════════

    public function getListView(): array { return $this->listView; }
    public function getFormView(): array { return $this->formView; }
    public function getSearchView(): array { return $this->searchView; }
    public function getKanbanView(): array { return $this->kanbanView; }
    public function getCalendarView(): array { return $this->calendarView; }
    public function getGraphView(): array { return $this->graphView; }
    public function getPivotView(): array { return $this->pivotView; }
    public function getSpreadsheetView(): array { return $this->spreadsheetView; }

    /**
     * get_view – Return complete view definition (Odoo API).
     * Supports: list, form, search, kanban, calendar, graph, pivot
     */
    public function getView(string $type = 'list'): array
    {
        return match ($type) {
            'list' => $this->mergeSearchView($this->buildListViewDef()),
            'form' => $this->buildFormViewDef(),
            'search' => [
                'type' => 'search',
                'filters' => $this->searchView['filters'] ?? [],
                'group_by' => $this->searchView['group_by'] ?? [],
                'searchpanel' => $this->searchView['searchpanel'] ?? [],
                'custom_filter_fields' => $this->searchView['custom_filter_fields']
                    ?? array_keys(array_filter($this->fields, fn(Field $f) => $f->searchable)),
                'field_defs' => $this->fieldsGet(),
            ],
            'kanban' => $this->mergeSearchView([
                'type' => 'kanban',
                'default_group_by' => $this->kanbanView['default_group_by'] ?? null,
                'quick_create' => $this->kanbanView['quick_create'] ?? true,
                'card_fields' => $this->kanbanView['card_fields'] ?? [],
                'card_title' => $this->kanbanView['card_title'] ?? $this->_rec_name,
                'card_tags' => $this->kanbanView['card_tags'] ?? null,
                'card_footer' => $this->kanbanView['card_footer'] ?? [],
                'card_image' => $this->kanbanView['card_image'] ?? null,
                'color_field' => $this->kanbanView['color_field'] ?? null,
                'progress_bar' => $this->kanbanView['progress_bar'] ?? null,
                'decoration' => $this->kanbanView['decoration'] ?? [],
                'aggregates' => $this->kanbanView['aggregates'] ?? [],
                'fold_field' => $this->kanbanView['fold_field'] ?? null,
                'field_defs' => $this->fieldsGet(),
            ]),
            'calendar' => $this->mergeSearchView([
                'type' => 'calendar',
                'date_start' => $this->calendarView['date_start'] ?? 'date_start',
                'date_stop' => $this->calendarView['date_stop'] ?? null,
                'color' => $this->calendarView['color'] ?? null,
                'mode' => $this->calendarView['mode'] ?? 'month',
                'all_day' => $this->calendarView['all_day'] ?? true,
                'event_display_fields' => $this->calendarView['event_display_fields'] ?? [$this->_rec_name],
                'quick_create' => $this->calendarView['quick_create'] ?? true,
                'create_name_field' => $this->calendarView['create_name_field'] ?? null,
                'date_delay' => $this->calendarView['date_delay'] ?? null,
                'color_legend' => $this->calendarView['color_legend'] ?? true,
                'field_defs' => $this->fieldsGet(),
            ]),
            'graph' => $this->mergeSearchView([
                'type' => 'graph',
                'graph_type' => $this->graphView['type'] ?? 'bar',
                'measure' => $this->graphView['measure'] ?? null,
                'groupby' => $this->graphView['groupby'] ?? [],
                'stacked' => $this->graphView['stacked'] ?? false,
                'measures' => $this->graphView['measures'] ?? $this->getNumericFieldNames(),
                'dimensions' => $this->graphView['dimensions'] ?? $this->getGroupableFieldNames(),
                'field_defs' => $this->fieldsGet(),
            ]),
            'pivot' => $this->mergeSearchView([
                'type' => 'pivot',
                'row_groupby' => $this->pivotView['row_groupby'] ?? [],
                'col_groupby' => $this->pivotView['col_groupby'] ?? [],
                'col_groupby_max_depth' => $this->pivotView['col_groupby_max_depth'] ?? 2,
                'measures' => $this->pivotView['measures'] ?? $this->getNumericFieldNames(),
                'dimensions' => $this->pivotView['dimensions'] ?? $this->getGroupableFieldNames(),
                'field_defs' => $this->fieldsGet(),
            ]),
            'spreadsheet' => $this->mergeSearchView([
                'type' => 'spreadsheet',
                'fields' => $this->spreadsheetView['fields'] ?? [],
                'column_width' => $this->spreadsheetView['column_width'] ?? 120,
                'row_height' => $this->spreadsheetView['row_height'] ?? 28,
                'limit' => $this->spreadsheetView['limit'] ?? 1000,
                'aggregation' => $this->spreadsheetView['aggregation'] ?? 'sum',
                'readonly' => $this->spreadsheetView['readonly'] ?? false,
                'field_defs' => $this->fieldsGet(),
            ]),
            default => [],
        };
    }

    /**
     * Attach search view metadata to other view types so a single
     * search view can drive list/kanban/graph/pivot filtering.
     */
    protected function mergeSearchView(array $viewDef): array
    {
        if (empty($this->searchView)) return $viewDef;
        $viewDef['search_view'] = [
            'filters' => $this->searchView['filters'] ?? [],
            'group_by' => $this->searchView['group_by'] ?? [],
            'searchpanel' => $this->searchView['searchpanel'] ?? [],
        ];
        return $viewDef;
    }

    // ══════════════════════════════════════════════════════
    //  List View Definition Builder (Full Odoo <tree> arch)
    // ══════════════════════════════════════════════════════

    /**
     * Build the full list view definition matching Odoo's <tree> architecture.
     *
     * Supports:
     *   - <tree> root attrs: string, editable, default_order, limit
     *   - <field> column attrs: name, widget, sum/avg/max/min, optional
     *   - <header> buttons: multi-record action buttons
     *   - groupby: fold/aggregates
     *   - decoration rules: decoration-danger, decoration-success, etc.
     *   - editable mode: top/bottom + multi_edit
     *   - control panel: search/pager (via search view)
     */
    protected function buildListViewDef(): array
    {
        $fieldNames = $this->listView['fields'] ?? array_keys($this->fields);
        $fieldDefs = $this->fieldsGet($fieldNames);

        // ── Column definitions with per-field config ──────────
        $columns = [];
        $columnConfig = $this->listView['column_config'] ?? [];
        foreach ($fieldNames as $fname) {
            $fDef = $fieldDefs[$fname] ?? null;
            if (!$fDef) continue;

            $col = [
                'name'    => $fname,
                'string'  => $fDef['string'] ?? ucfirst(str_replace('_', ' ', $fname)),
                'type'    => $fDef['type'] ?? 'char',
                'widget'  => $fDef['widget'] ?? null,
                'sortable' => $fDef['sortable'] ?? false,
            ];

            // Per-column overrides from column_config
            $cc = $columnConfig[$fname] ?? [];

            // optional= show/hide kolom  (show | hide | false)
            $col['optional'] = $cc['optional'] ?? null;

            // aggregation: sum/avg/max/min with label
            foreach (['sum', 'avg', 'max', 'min'] as $agg) {
                if (isset($cc[$agg])) {
                    $col['aggregation'] = $agg;
                    $col['aggregation_label'] = $cc[$agg]; // e.g. "Total" for sum="Total"
                }
            }

            // Column width override
            if (isset($cc['width'])) $col['width'] = $cc['width'];

            // Column-level widget override
            if (isset($cc['widget'])) $col['widget'] = $cc['widget'];

            // Column-level invisible condition
            if (isset($cc['column_invisible'])) $col['column_invisible'] = $cc['column_invisible'];

            $columns[] = $col;
        }

        // ── Decoration rules (conditional row coloring) ───────
        // Format: ['decoration-danger' => "state == 'cancel'", 'decoration-success' => "state == 'done'"]
        $decorations = $this->listView['decoration'] ?? [];

        // ── Header buttons (multi-record actions) ────────────
        $headerButtons = $this->listView['header_buttons'] ?? [];

        // ── Editable mode ────────────────────────────────────
        $editable = $this->listView['editable'] ?? null; // 'top', 'bottom', or null
        $multiEdit = $this->listView['multi_edit'] ?? false;

        // ── Group-by defaults ────────────────────────────────
        $groupBy = $this->listView['default_group_by'] ?? null;

        return [
            'type'          => 'list',
            'string'        => $this->listView['string'] ?? $this->_description,
            'fields'        => $fieldNames,
            'columns'       => $columns,
            'field_defs'    => $fieldDefs,
            'default_order' => $this->listView['default_order'] ?? $this->_order,
            'limit'         => $this->listView['limit'] ?? 80,
            'editable'      => $editable,
            'multi_edit'    => $multiEdit,
            'decoration'    => $decorations,
            'header_buttons' => $headerButtons,
            'default_group_by' => $groupBy,
            '_rec_name'     => $this->_rec_name,
        ];
    }

    // ══════════════════════════════════════════════════════
    //  Form View Definition Builder (Full Odoo <form> arch)
    // ══════════════════════════════════════════════════════

    /**
     * Build the full form view definition matching Odoo's <form> architecture.
     *
     * Hierarchy:
     *   <form> → <header> → <button> + statusbar
     *                <sheet> → <group> + <notebook>
     *                    → <page> → <field O2m> → tree inline
     *                <div class="oe_chatter">
     *
     * Supports:
     *   - <form> root: string, create, edit, delete, duplicate
     *   - <header>: buttons (type/string/class/states) + statusbar (widget="statusbar", clickable)
     *   - <sheet>: groups (col/string/colspan), notebook/pages
     *   - <field>: widget, attrs (invisible/readonly/required with domain expr), nolabel
     *   - One2many inline: editable, column_invisible
     *   - Chatter: mail.thread, activity_ids
     */
    protected function buildFormViewDef(): array
    {
        $fieldDefs = $this->fieldsGet();

        // ── <form> root attrs ────────────────────────────
        $formAttrs = [
            'string'    => $this->formView['string'] ?? $this->_description,
            'create'    => $this->formView['create'] ?? true,
            'edit'      => $this->formView['edit'] ?? true,
            'delete'    => $this->formView['delete'] ?? true,
            'duplicate' => $this->formView['duplicate'] ?? true,
        ];

        // ── <header> → buttons ──────────────────────────
        $headerButtons = [];
        foreach (($this->formView['header_buttons'] ?? []) as $btn) {
            $headerButtons[] = [
                'name'      => $btn['name'],
                'type'      => $btn['type'] ?? 'object',
                'string'    => $btn['string'] ?? ucfirst($btn['name']),
                'class'     => $btn['class'] ?? 'ls-btn-secondary',
                'confirm'   => $btn['confirm'] ?? null,
                'invisible' => $btn['invisible'] ?? null,     // domain expr for visibility
                'states'    => $btn['states'] ?? null,         // shortcut: states="draft,confirmed"
                'icon'      => $btn['icon'] ?? null,
            ];
        }

        // ── <header> → statusbar ────────────────────────
        $statusbar = $this->formView['statusbar'] ?? null;
        $statusbarClickable = $this->formView['statusbar_clickable'] ?? true;
        $statusbarVisible = $this->formView['statusbar_visible'] ?? null; // e.g. "draft,confirmed,done"

        // ── Stat buttons (oe_button_box) ────────────────
        $statButtons = [];
        foreach (($this->formView['stat_buttons'] ?? []) as $btn) {
            $statButtons[] = [
                'name'      => $btn['name'],
                'type'      => $btn['type'] ?? 'object',
                'string'    => $btn['string'] ?? '',
                'icon'      => $btn['icon'] ?? null,
                'field'     => $btn['field'] ?? null,   // field to show value
                'invisible' => $btn['invisible'] ?? null,
            ];
        }

        // ── <sheet> → groups with Odoo attrs ────────────
        $groups = [];
        foreach (($this->formView['groups'] ?? []) as $grpIdx => $grp) {
            $groupDef = [
                'string'  => null,
                'col'     => 2,
                'colspan' => 1,
                'columns' => [],
            ];

            // Check if group has metadata wrapper
            if (isset($grp['string']) || isset($grp['col']) || isset($grp['columns'])) {
                $groupDef['string'] = $grp['string'] ?? null;
                $groupDef['col'] = $grp['col'] ?? 2;
                $groupDef['colspan'] = $grp['colspan'] ?? 1;
                $rawColumns = $grp['columns'] ?? [];
            } else {
                // Legacy format: array of [left_fields, right_fields]
                $rawColumns = $grp;
            }

            foreach ($rawColumns as $colFields) {
                $colDef = [];
                foreach ($colFields as $fieldEntry) {
                    // Field can be string name or dict with attrs
                    if (is_string($fieldEntry)) {
                        $fDef = $fieldDefs[$fieldEntry] ?? null;
                        if (!$fDef) continue;
                        $colDef[] = [
                            'name'     => $fieldEntry,
                            'label'    => $fDef['string'] ?? $fieldEntry,
                            'nolabel'  => false,
                            'colspan'  => 1,
                            'widget'   => $fDef['widget'] ?? null,
                            'options'  => $fDef['options'] ?? [],
                            'attrs'    => [],
                        ];
                    } elseif (is_array($fieldEntry)) {
                        $fname = $fieldEntry['name'] ?? '';
                        $fDef = $fieldDefs[$fname] ?? null;
                        if (!$fDef && !$fname) continue;
                        $colDef[] = [
                            'name'      => $fname,
                            'label'     => $fieldEntry['string'] ?? $fDef['string'] ?? $fname,
                            'nolabel'   => $fieldEntry['nolabel'] ?? false,
                            'colspan'   => $fieldEntry['colspan'] ?? 1,
                            'widget'    => $fieldEntry['widget'] ?? $fDef['widget'] ?? null,
                            'options'   => array_merge($fDef['options'] ?? [], $fieldEntry['options'] ?? []),
                            'attrs'     => [
                                'invisible' => $fieldEntry['invisible'] ?? null,
                                'readonly'  => $fieldEntry['readonly'] ?? null,
                                'required'  => $fieldEntry['required'] ?? null,
                            ],
                        ];
                    }
                }
                $groupDef['columns'][] = $colDef;
            }
            $groups[] = $groupDef;
        }

        // ── <notebook> → <page> tabs ────────────────────
        $tabs = [];
        foreach (($this->formView['tabs'] ?? []) as $tab) {
            $tabDef = [
                'name'    => $tab['name'],
                'label'   => $tab['label'] ?? ucfirst($tab['name']),
                'type'    => $tab['type'] ?? 'field',
                'string'  => $tab['label'] ?? ucfirst($tab['name']),
                'groups'  => $tab['groups'] ?? null,       // access groups
                'attrs'   => [
                    'invisible' => $tab['invisible'] ?? null,
                ],
            ];

            if ($tab['type'] === 'field') {
                $tabDef['field'] = $tab['field'];
            } elseif ($tab['type'] === 'one2many') {
                $tabDef['field'] = $tab['field'];
                $tabDef['tree_fields'] = $tab['tree_fields'] ?? [];
                // editable: 'top' | 'bottom' | 'both' | false (read-only)
                $tabDef['editable'] = $tab['editable'] ?? 'bottom';
                $tabDef['multi_edit'] = $tab['multi_edit'] ?? false;
                $tabDef['quick_create'] = $tab['quick_create'] ?? true;
                $tabDef['read_only'] = $tab['read_only'] ?? false;
                $tabDef['sum_field'] = $tab['sum_field'] ?? null;
                $tabDef['sum_label'] = $tab['sum_label'] ?? 'Total';
                $tabDef['column_invisible'] = $tab['column_invisible'] ?? [];
                $tabDef['tree_field_attrs'] = $tab['tree_field_attrs'] ?? [];
                $tabDef['tree_column_config'] = $tab['tree_column_config'] ?? [];
                $tabDef['optional_hide'] = $tab['optional_hide'] ?? [];
                $tabDef['sequence_field'] = $tab['sequence_field'] ?? null;
                $tabDef['create'] = $tab['create'] ?? true;
                $tabDef['delete'] = $tab['delete'] ?? true;
                $tabDef['limit'] = $tab['limit'] ?? 0;
                $tabDef['virtual'] = $tab['virtual'] ?? false;
                $tabDef['onchange_handlers'] = $tab['onchange_handlers'] ?? [];
                $tabDef['add_from_list'] = $tab['add_from_list'] ?? null;
                $tabDef['context'] = $tab['context'] ?? [];
                // Per-row button actions
                $tabDef['buttons'] = $tab['buttons'] ?? [];
                // Decoration expressions
                $tabDef['decoration'] = $tab['decoration'] ?? [];
                $tabDef['decoration_today'] = $tab['decoration_today'] ?? null;
                $tabDef['decoration_date'] = $tab['decoration_date'] ?? null;
                // Column sort control
                $tabDef['default_order'] = $tab['default_order'] ?? null;
                $tabDef['no_open'] = $tab['no_open'] ?? false;
                $tabDef['sticky_first'] = $tab['sticky_first'] ?? false;
                // Section grouping (Odoo <tree default_group_by="field">)
                $tabDef['default_group_by'] = $tab['default_group_by'] ?? null;
                $tabDef['group_expand'] = $tab['group_expand'] ?? false;
                $tabDef['group_limit'] = $tab['group_limit'] ?? 10;
                // ── Odoo parity extensions ──
                // Exclusive fields: groups of fields where setting one zeroes the others
                $tabDef['exclusive_fields'] = $tab['exclusive_fields'] ?? [];
                // Dynamic readonly: expression evaluated against parent record
                $tabDef['readonly_when'] = $tab['readonly_when'] ?? null;
                // Parent field propagation: fields copied from parent to new child lines
                $tabDef['propagate_fields'] = $tab['propagate_fields'] ?? [];

                $fieldDef = $this->fields[$tab['field']] ?? null;
                if ($fieldDef && $fieldDef->relation) {
                    $childDef = Registry::get($fieldDef->relation);
                    if ($childDef) {
                        $tabDef['child_field_defs'] = $childDef->fieldsGet();
                        $tabDef['child_model'] = $fieldDef->relation;
                        $tabDef['model_label'] = $childDef->_description ?: ucfirst(str_replace('.', ' ', $fieldDef->relation));
                        $tabDef['inverse_field'] = $fieldDef->inverseField;
                        $tabDef['child_rec_name'] = $childDef->_rec_name;
                        // Expose onchange_handlers from child model def if not manually set
                        if (empty($tabDef['onchange_handlers'])) {
                            $allOnchangeFields = [];
                            foreach ($childDef->getDecorators()['onchange'] ?? [] as $method => $fields) {
                                $allOnchangeFields = array_merge($allOnchangeFields, $fields);
                            }
                            $tabDef['onchange_handlers'] = array_unique($allOnchangeFields);
                        }
                    }
                }
            } elseif ($tab['type'] === 'group') {
                // Tab containing field groups (like form groups inside a page)
                $tabDef['groups_content'] = $tab['groups_content'] ?? [];
            }

            $tabs[] = $tabDef;
        }

        // ── Chatter config ──────────────────────────────
        $chatter = $this->formView['chatter'] ?? null;

        // ── Title / Priority fields ─────────────────────
        $titleField = $this->formView['title'] ?? $this->_rec_name;
        $priorityField = $this->formView['priority'] ?? null;

        return [
            'type'              => 'form',
            'form_attrs'        => $formAttrs,
            'statusbar'         => $statusbar,
            'statusbar_clickable' => $statusbarClickable,
            'statusbar_visible' => $statusbarVisible,
            'title_field'       => $titleField,
            'priority_field'    => $priorityField,
            'header_buttons'    => $headerButtons,
            'stat_buttons'      => $statButtons,
            'groups'            => $groups,
            'tabs'              => $tabs,
            'chatter'           => $chatter,
            'field_defs'        => $fieldDefs,
            '_rec_name'         => $this->_rec_name,
        ];
    }

    /**
     * Get all numeric field names (for graph/pivot measures).
     */
    protected function getNumericFieldNames(): array
    {
        return array_keys(array_filter($this->fields, fn(Field $f) =>
            in_array($f->type, [Field::INTEGER, Field::FLOAT, Field::MONETARY]) && $f->store !== false
        ));
    }

    /**
     * Get all groupable field names (for graph/pivot dimensions).
     */
    protected function getGroupableFieldNames(): array
    {
        return array_keys(array_filter($this->fields, fn(Field $f) =>
            $f->groupable || $f->type === Field::SELECTION || $f->type === Field::MANY2ONE
        ));
    }

    // ══════════════════════════════════════════════════════
    //  ORM: Query Builder
    // ══════════════════════════════════════════════════════

    public function newQuery(): mixed
    {
        return ($this->modelClass)::query();
    }

    /**
     * Get Eloquent eager-load relations list based on field definitions.
     */
    public function getEagerLoads(?array $fieldNames = null): array
    {
        $loads = [];
        $fields = $fieldNames
            ? array_intersect_key($this->fields, array_flip($fieldNames))
            : $this->fields;

        foreach ($fields as $field) {
            if ($field->type === Field::MANY2ONE && $field->relation) {
                $relName = \App\Advsoft\Core\Support\Str::camel(preg_replace('/_id$/', '', $field->name));
                $relDef = Registry::get($field->relation);
                if ($relDef) {
                    $selectFields = $field->displayFields ?: ['id', $relDef->_rec_name];
                    $relFieldNames = array_keys(array_filter($relDef->getFields(), fn($f) => $f->store !== false));
                    if (in_array('color', $relFieldNames)) $selectFields[] = 'color';
                    if (in_array('sequence', $relFieldNames)) $selectFields[] = 'sequence';
                    $selectFields = array_unique($selectFields);
                    $loads[] = $relName . ':' . implode(',', $selectFields);
                }
            } elseif ($field->type === Field::MANY2MANY && $field->relation) {
                $baseName = preg_replace('/_ids?$/', '', $field->name);
                $o1 = \App\Advsoft\Core\Support\Str::camel($baseName . 's');
                $o2 = \App\Advsoft\Core\Support\Str::camel($baseName);
                $o3 = \App\Advsoft\Core\Support\Str::camel($field->name);
                $relName = method_exists($this->modelClass, $o1) ? $o1 : (method_exists($this->modelClass, $o2) ? $o2 : $o3);
                if (method_exists($this->modelClass, $relName)) {
                    $relDef = Registry::get($field->relation);
                    $selectFields = ['id', $relDef ? $relDef->_rec_name : 'name'];
                    $relFieldNames = $relDef ? array_keys(array_filter($relDef->getFields(), fn($f) => $f->store !== false)) : [];
                    if (in_array('color', $relFieldNames)) $selectFields[] = 'color';
                    $loads[] = $relName . ':' . implode(',', $selectFields);
                }
            } elseif ($field->type === Field::ONE2MANY) {
                $baseName = preg_replace('/_ids?$/', '', $field->name);
                $o1 = \App\Advsoft\Core\Support\Str::camel($baseName . 's');
                $o2 = \App\Advsoft\Core\Support\Str::camel($baseName);
                $o3 = \App\Advsoft\Core\Support\Str::camel($field->name);
                $relName = method_exists($this->modelClass, $o1) ? $o1 : (method_exists($this->modelClass, $o2) ? $o2 : $o3);
                if (method_exists($this->modelClass, $relName)) {
                    $loads[] = $relName;
                    $childDef = Registry::get($field->relation);
                    if ($childDef) {
                        foreach ($childDef->getFields() as $childField) {
                            if ($childField->type === Field::MANY2ONE && $childField->relation) {
                                $childRelName = \App\Advsoft\Core\Support\Str::camel(preg_replace('/_id$/', '', $childField->name));
                                $childRelDef = Registry::get($childField->relation);
                                if ($childRelDef && method_exists($childDef->modelClass, $childRelName)) {
                                    $selectFields = ['id', $childRelDef->_rec_name];
                                    $loads[] = $relName . '.' . $childRelName . ':' . implode(',', $selectFields);
                                }
                            }
                        }
                    }
                }
            }
        }
        return $loads;
    }

    /**
     * Transform a single Eloquent record to Odoo-style read format.
     */
    public function transformRecord(object $record, ?array $fieldNames = null): array
    {
        $result = ['id' => $record->id];
        $fields = $fieldNames
            ? array_intersect_key($this->fields, array_flip($fieldNames))
            : $this->fields;

        foreach ($fields as $name => $field) {
            // Handle delegated fields from _inherits (not RELATED type fields)
            if (!empty($field->relatedField) && !$field->store
                && $field->type !== Field::RELATED && $field->type !== Field::COMPUTED) {
                $result[$name] = $this->readDelegatedField($record, $name);
                continue;
            }

            switch ($field->type) {
                case Field::MANY2ONE:
                    $relName = \App\Advsoft\Core\Support\Str::camel(preg_replace('/_id$/', '', $name));
                    $rel = $record->relationLoaded($relName) ? $record->getRelation($relName) : null;
                    if ($rel) {
                        $recName = $rel->{Registry::get($field->relation)?->_rec_name ?? 'name'} ?? '';
                        $result[$name] = [$rel->id, $recName];
                        if (isset($rel->color)) $result[$name . '_color'] = $rel->color;
                    } elseif ($record->$name) {
                        $relDef = Registry::get($field->relation);
                        $recNameField = $relDef?->_rec_name ?? 'name';
                        $relModelClass = $relDef?->modelClass;
                        $recName = '';
                        if ($relModelClass && class_exists($relModelClass)) {
                            $targetObj = $relModelClass::find($record->$name);
                            if ($targetObj) {
                                $recName = $targetObj->$recNameField ?? '';
                            }
                        }
                        $result[$name] = [(int)$record->$name, $recName];
                    } else {
                        $result[$name] = false;
                    }
                    break;

                case Field::MANY2MANY:
                    $baseName = preg_replace('/_ids?$/', '', $name);
                    $o1 = \App\Advsoft\Core\Support\Str::camel($baseName . 's');
                    $o2 = \App\Advsoft\Core\Support\Str::camel($baseName);
                    $o3 = \App\Advsoft\Core\Support\Str::camel($name);
                    $relName = method_exists($record, $o1) ? $o1 : (method_exists($record, $o2) ? $o2 : $o3);
                    if ($record->relationLoaded($relName)) {
                        $relDef = Registry::get($field->relation);
                        $recNameField = $relDef?->_rec_name ?? 'name';
                        $result[$name] = $record->getRelation($relName)->map(function ($r) use ($recNameField) {
                            $item = ['id' => $r->id, 'name' => $r->$recNameField ?? ''];
                            if (isset($r->color)) $item['color'] = $r->color;
                            return $item;
                        })->values()->toArray();
                    } else {
                        $result[$name] = [];
                    }
                    break;

                case Field::ONE2MANY:
                    $baseName = preg_replace('/_ids?$/', '', $name);
                    $o1 = \App\Advsoft\Core\Support\Str::camel($baseName . 's');
                    $o2 = \App\Advsoft\Core\Support\Str::camel($baseName);
                    $o3 = \App\Advsoft\Core\Support\Str::camel($name);
                    $relName = method_exists($record, $o1) ? $o1 : (method_exists($record, $o2) ? $o2 : $o3);
                    $childDef = Registry::get($field->relation);

                    $childRecords = [];
                    if ($record->relationLoaded($relName)) {
                        $childRecords = $record->getRelation($relName);
                    } elseif ($childDef && $field->inverseField && !empty($record->id)) {
                        $childClass = $childDef->modelClass;
                        if (class_exists($childClass)) {
                            $childRecords = $childClass::where($field->inverseField, '=', $record->id)->get();
                        }
                    }

                    if (!empty($childRecords) && $childDef) {
                        $result[$name] = collect($childRecords)->map(
                            fn($r) => $childDef->transformRecord($r)
                        )->values()->toArray();
                    } else {
                        $result[$name] = [];
                    }
                    break;

                case Field::DATE:
                    $val = $record->$name;
                    $result[$name] = $val ? (is_string($val) ? $val : $val->format('Y-m-d')) : false;
                    break;

                case Field::DATETIME:
                    $val = $record->$name;
                    $result[$name] = $val ? (is_string($val) ? $val : $val->format('Y-m-d H:i:s')) : false;
                    break;

                case Field::FLOAT:
                case Field::INTEGER:
                    $result[$name] = $record->$name !== null ? (float) $record->$name : 0;
                    break;

                case Field::BOOLEAN:
                    $result[$name] = (bool) $record->$name;
                    break;

                case Field::MONETARY:
                    $result[$name] = $record->$name !== null ? (float) $record->$name : 0;
                    break;

                case Field::REFERENCE:
                    // Reference stores "model_name,id" in a single column
                    $val = $record->$name;
                    if ($val && is_string($val) && str_contains($val, ',')) {
                        [$refModel, $refId] = explode(',', $val, 2);
                        $refDef = Registry::get($refModel);
                        if ($refDef && $refId) {
                            $refRecord = $refDef->newQuery()->find((int)$refId);
                            $refName = $refRecord ? ($refRecord->{$refDef->_rec_name} ?? '') : '';
                            $result[$name] = [$refModel, (int)$refId, $refName];
                        } else {
                            $result[$name] = $val;
                        }
                    } else {
                        $result[$name] = $val ?? false;
                    }
                    break;

                case Field::COMPUTED:
                    // Computed: call compute method if store=false, else read from DB
                    if (!$field->store && $field->compute && method_exists($this, $field->compute)) {
                        $computedResult = $this->{$field->compute}($record, $result);
                        $result[$name] = is_array($computedResult) ? ($computedResult[$name] ?? null) : $computedResult;
                    } elseif ($field->store) {
                        $result[$name] = $record->$name ?? '';
                    } else {
                        $result[$name] = '';
                    }
                    break;

                case Field::RELATED:
                    // Related field: shortcut to another field chain (e.g. 'project_id.name')
                    $relatedPath = $field->relatedField;
                    if ($relatedPath) {
                        $result[$name] = $this->resolveRelatedField($record, $relatedPath);
                    } else {
                        $result[$name] = $record->$name ?? '';
                    }
                    break;

                default:
                    $result[$name] = $record->$name ?? ($field->default ?? '');
                    break;
            }
        }

        // Run computed fields
        foreach ($fields as $name => $field) {
            if ($field->compute && method_exists($this, $field->compute)) {
                $computedResult = $this->{$field->compute}($record, $result);
                $result[$name] = is_array($computedResult) ? ($computedResult[$name] ?? null) : $computedResult;
            }
        }

        // Auto fields
        if ($record->created_at) $result['create_date'] = is_string($record->created_at) ? $record->created_at : $record->created_at->format('Y-m-d H:i:s');
        if ($record->updated_at) $result['write_date'] = is_string($record->updated_at) ? $record->updated_at : $record->updated_at->format('Y-m-d H:i:s');

        // Display name
        $result['display_name'] = $this->nameGet($record);

        return $result;
    }

    /**
     * Resolve a related field path (e.g. 'project_id.name').
     * Walks the dot-separated chain to get the final value.
     */
    protected function resolveRelatedField(object $record, string $path)
    {
        $parts = explode('.', $path);
        $current = $record;

        foreach ($parts as $i => $part) {
            if ($current === null) return '';

            // If this is the last part, return the attribute
            if ($i === count($parts) - 1) {
                return $current->$part ?? '';
            }

            // Navigate through relation (strip _id to get relation name)
            $relName = str_replace('_id', '', $part);
            if ($current->relationLoaded($relName)) {
                $current = $current->$relName;
            } elseif (method_exists($current, $relName)) {
                $current = $current->$relName;
            } else {
                return '';
            }
        }

        return '';
    }

    /**
     * Read a delegated field (from _inherits delegation).
     */
    protected function readDelegatedField(object $record, string $fieldName)
    {
        $field = $this->fields[$fieldName] ?? null;
        if (!$field || !$field->relatedField) return '';

        return $this->resolveRelatedField($record, $field->relatedField);
    }

    /**
     * Get read/write access for a specific field based on current user groups.
     *
     * @return array{read: bool, write: bool}
     */
    public function getFieldAccess(string $fieldName): array
    {
        $field = $this->fields[$fieldName] ?? null;
        if (!$field) {
            return ['read' => true, 'write' => true];
        }

        // If field has specific required groups (e.g. 'groups' attribute)
        if (!empty($field->groups)) {
            $user = app(\App\Advsoft\Security\SecurityContext::class)->getUser();
            if (!$user) {
                return ['read' => false, 'write' => false];
            }
            if ($user->isAdmin()) {
                return ['read' => true, 'write' => true];
            }

            $requiredGroups = is_array($field->groups) ? $field->groups : explode(',', (string)$field->groups);
            $hasGroup = false;
            foreach ($requiredGroups as $groupXmlId) {
                $groupXmlId = trim($groupXmlId);
                if ($groupXmlId && $user->hasGroup($groupXmlId)) {
                    $hasGroup = true;
                    break;
                }
            }

            if (!$hasGroup) {
                return ['read' => false, 'write' => false];
            }
        }

        return ['read' => true, 'write' => !$field->readonly];
    }

    /**
     * Apply default values defined on fields for missing keys.
     */
    public function applyDefaults(array $values): array
    {
        foreach ($this->fields as $name => $field) {
            if (!array_key_exists($name, $values) && $field->default !== null) {
                if (is_callable($field->default)) {
                    $values[$name] = call_user_func($field->default);
                } elseif (is_string($field->default) && method_exists($this, $field->default)) {
                    $values[$name] = $this->{$field->default}();
                } else {
                    $values[$name] = $field->default;
                }
            }
        }
        return $values;
    }

    /**
     * Get default values for given fields (Odoo default_get).
     */
    public function defaultGet(?array $fields = null): array
    {
        $fieldList = $fields ?? array_keys($this->fields);
        $defaults = [];
        foreach ($fieldList as $fname) {
            $field = $this->fields[$fname] ?? null;
            if ($field && $field->default !== null) {
                if (is_callable($field->default)) {
                    $defaults[$fname] = call_user_func($field->default);
                } elseif (is_string($field->default) && method_exists($this, $field->default)) {
                    $defaults[$fname] = $this->{$field->default}();
                } else {
                    $defaults[$fname] = $field->default;
                }
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

    /**
     * Recompute stored computed fields on a record after insert/update.
     */
    public function recomputeStoredFields(object $record): void
    {
        $dirty = false;
        foreach ($this->fields as $name => $field) {
            if ($field->compute && $field->store === true) {
                $computeMethod = $field->compute;
                if (is_string($computeMethod) && method_exists($this, $computeMethod)) {
                    $record->$name = $this->$computeMethod($record, []);
                    $dirty = true;
                }
            }
        }
        if ($dirty) {
            $record->save();
        }
    }

    /**
     * Prepare values for Eloquent create/update (strip non-scalar fields).
     * Applies field defaults for missing keys (including callable defaults).
     */
    public function prepareWriteValues(array $values, bool $applyDefaults = false): array
    {
        if ($applyDefaults) {
            $values = $this->applyDefaults($values);
        }

        $scalar = [];
        foreach ($values as $key => $value) {
            $field = $this->fields[$key] ?? null;
            if (!$field) continue;
            if ($field->store === false) continue;
            if ($field->compute && $field->readonly) continue;

            if ($field->isScalar() || $field->type === Field::MANY2ONE) {
                $access = $this->getFieldAccess($key);
                if (!($access['write'] ?? true)) continue;
                $scalar[$key] = $this->sanitizeValue($field, $value);
            }
        }
        return $scalar;
    }

    /**
     * Sanitize a value based on field type before writing to DB.
     */
    protected function sanitizeValue(Field $field, $value)
    {
        if (in_array($field->type, [Field::DATE, Field::DATETIME])) {
            if (empty($value) || $value === 0 || $value === '0' || $value === 'false') {
                return null;
            }
            return $value;
        }

        if ($field->type === Field::MANY2ONE) {
            if (is_array($value)) {
                $value = isset($value['id']) ? $value['id'] : ($value[0] ?? null);
            } elseif (is_object($value)) {
                $value = $value->id ?? null;
            }
            return (empty($value) || $value === 0 || $value === '0') ? null : (int) $value;
        }

        if (in_array($field->type, [Field::BINARY, Field::HTML])) {
            return empty($value) ? null : $value;
        }

        if ($field->type === Field::INTEGER) {
            return is_numeric($value) ? (int) $value : ($value === '' || $value === null ? null : 0);
        }

        if ($field->type === Field::FLOAT) {
            return is_numeric($value) ? (float) $value : ($value === '' || $value === null ? null : 0.0);
        }

        if ($field->type === Field::BOOLEAN) {
            return filter_var($value, FILTER_VALIDATE_BOOLEAN);
        }

        if ($field->type === Field::REFERENCE) {
            if (is_array($value)) {
                $model = $value[0] ?? '';
                $id = $value[1] ?? null;
                return ($model && $id) ? "{$model},{$id}" : null;
            }
            return empty($value) ? null : (string) $value;
        }

        if ($field->type === Field::JSON) {
            if (is_string($value)) {
                $decoded = json_decode($value, true);
                return json_last_error() === JSON_ERROR_NONE ? $value : null;
            }
            return $value === null ? null : json_encode($value);
        }

        if ($field->trim && $field->type === Field::CHAR && is_string($value)) {
            return trim($value);
        }

        if ($field->type === Field::HTML && $field->sanitize && is_string($value)) {
            return $this->sanitizeHtml($value, $field);
        }

        return $value;
    }

    /**
     * Sanitize HTML content (B2 — Odoo parity).
     * Removes dangerous tags/attributes while preserving formatting.
     * Uses the full Odoo-style HtmlSanitizer if available; otherwise
     * falls back to the legacy strip_tags pipeline.
     */
    protected function sanitizeHtml(string $html, ?Field $field = null): string
    {
        $sanitizerClass = '\\App\\Odoo\\Field\\Html\\HtmlSanitizer';
        $configClass    = '\\App\\Odoo\\Field\\Html\\HtmlFieldConfig';

        if (class_exists($sanitizerClass) && class_exists($configClass)) {
            $preset = $field?->htmlPreset ?: 'standard';
            $cfg = new $configClass(['preset' => $preset]);
            if ($field) {
                if ($field->htmlAllowedTags)    $cfg->allowedTags    = $field->htmlAllowedTags;
                if ($field->htmlAllowedClasses) $cfg->allowedClasses = $field->htmlAllowedClasses;
                if ($field->htmlAllowedStyles)  $cfg->allowedStyles  = $field->htmlAllowedStyles;
                if (is_array($field->htmlOptions)) {
                    foreach ($field->htmlOptions as $k => $v) {
                        if (property_exists($cfg, $k)) $cfg->$k = $v;
                    }
                }
            }
            return (new $sanitizerClass($cfg))->sanitize($html);
        }

        // Fallback (legacy)
        $allowedTags = '<p><br><strong><b><em><i><u><s><ul><ol><li><h1><h2><h3><h4><h5><h6>'
            . '<blockquote><pre><code><a><img><table><thead><tbody><tr><th><td><span><div><hr>';
        $html = preg_replace('#<script(.*?)>(.*?)</script>#is', '', $html);
        $html = preg_replace('#<style(.*?)>(.*?)</style>#is', '', $html);
        $html = preg_replace('#\s*on\w+\s*=\s*"[^"]*"#i', '', $html);
        $html = preg_replace('#\s*on\w+\s*=\s*\'[^\']*\'#i', '', $html);
        $html = preg_replace('#javascript\s*:#i', '', $html);
        return strip_tags($html, $allowedTags);
    }

    /**
     * Apply relational writes (many2many sync, one2many operations).
     */
    public function applyRelationalWrites(object $record, array $values): void
    {
        foreach ($values as $key => $value) {
            $field = $this->fields[$key] ?? null;
            if (!$field) continue;

            if ($field->type === Field::MANY2MANY && is_array($value)) {
                $baseName = preg_replace('/_ids?$/', '', $key);
                $o1 = \App\Advsoft\Core\Support\Str::camel($baseName . 's');
                $o2 = \App\Advsoft\Core\Support\Str::camel($baseName);
                $o3 = \App\Advsoft\Core\Support\Str::camel($key);
                $syncMethod1 = 'sync' . ucfirst($o1);
                $syncMethod2 = 'sync' . ucfirst($o2);
                $syncMethod3 = 'sync' . ucfirst($o3);

                $syncIds = $value;
                // Detect Odoo X2M command: e.g. [[6, 0, [1, 2, 3]]]
                if (!empty($value) && is_array($value[0])) {
                    $syncIds = [];
                    foreach ($value as $cmd) {
                        if (is_array($cmd) && $cmd[0] === 6) {
                            $syncIds = $cmd[2] ?? [];
                            break; // Command 6 replaces everything
                        } elseif (is_array($cmd) && $cmd[0] === 4) {
                            $syncIds[] = $cmd[1];
                        }
                    }
                }
                
                // Sanitize $syncIds to ensure it is a flat array of scalar IDs.
                $flatIds = [];
                foreach ($syncIds as $sId) {
                    if (is_array($sId) && isset($sId['id'])) {
                        $flatIds[] = (int)$sId['id'];
                    } elseif (is_scalar($sId)) {
                        $flatIds[] = (int)$sId;
                    }
                }

                if (method_exists($record, $syncMethod1)) {
                    $record->$syncMethod1($flatIds);
                } elseif (method_exists($record, $syncMethod2)) {
                    $record->$syncMethod2($flatIds);
                } elseif (method_exists($record, $syncMethod3)) {
                    $record->$syncMethod3($flatIds);
                } else {
                    $relName = method_exists($record, $o1) ? $o1 : (method_exists($record, $o2) ? $o2 : $o3);
                    $relObj = method_exists($record, $relName) ? $record->$relName() : null;
                    if ($relObj && is_object($relObj) && method_exists($relObj, 'sync')) {
                        $relObj->sync($flatIds);
                    } elseif (!empty($field->relationTable) && !empty($field->column1) && !empty($field->column2)) {
                        $opened = false;
                        if (!TTransaction::get()) {
                            TTransaction::open('advsoft');
                            $opened = true;
                        }
                        $conn = TTransaction::get();
                        $driver = $conn->getAttribute(\PDO::ATTR_DRIVER_NAME);
                        $table = $field->relationTable;
                        $col1 = $field->column1;
                        $col2 = $field->column2;

                        $delStmt = $conn->prepare("DELETE FROM {$table} WHERE {$col1} = :rec_id");
                        $delStmt->execute([':rec_id' => $record->id]);

                        $insSql = ($driver === 'mysql')
                            ? "INSERT IGNORE INTO {$table} ({$col1}, {$col2}) VALUES (:rec_id, :rel_id)"
                            : "INSERT OR IGNORE INTO {$table} ({$col1}, {$col2}) VALUES (:rec_id, :rel_id)";
                        $insStmt = $conn->prepare($insSql);
                        foreach ($flatIds as $fId) {
                            $insStmt->execute([':rec_id' => $record->id, ':rel_id' => $fId]);
                        }
                        if ($opened) {
                            TTransaction::close();
                        }
                    }
                }
            }

            if ($field->type === Field::ONE2MANY && is_array($value)) {
                $childDef = Registry::get($field->relation);
                if ($childDef) {
                    $inverseField = $field->inverseField;
                    foreach ($value as $cmd) {
                        if (is_array($cmd)) {
                            // Odoo tuple commands: [0, 0, {...}], [1, id, {...}], [2, id]
                            if (isset($cmd[0]) && is_int($cmd[0])) {
                                $op = $cmd[0];
                                if ($op === 0) { // CREATE
                                    $childVals = $cmd[2] ?? [];
                                    if ($inverseField) {
                                        $childVals[$inverseField] = $record->id;
                                    }
                                    $childScalar = $childDef->prepareWriteValues($childVals);
                                    $childDef->performCreate($childScalar);
                                } elseif ($op === 1) { // UPDATE
                                    $childId = $cmd[1];
                                    $childVals = $cmd[2] ?? [];
                                    $childScalar = $childDef->prepareWriteValues($childVals);
                                    $childDef->performWrite([$childId], $childScalar);
                                } elseif ($op === 2) { // DELETE
                                    $childId = $cmd[1];
                                    $childDef->performUnlink([$childId]);
                                }
                            } else {
                                // Plain array/object record
                                if (!empty($cmd['id'])) {
                                    $childId = (int)$cmd['id'];
                                    $childScalar = $childDef->prepareWriteValues($cmd);
                                    $childDef->performWrite([$childId], $childScalar);
                                } else {
                                    $childVals = $cmd;
                                    if ($inverseField) {
                                        $childVals[$inverseField] = $record->id;
                                    }
                                    $childScalar = $childDef->prepareWriteValues($childVals);
                                    $childDef->performCreate($childScalar);
                                }
                            }
                        }
                    }
                }
            }

            // Handle delegated field writes
            if (!empty($field->relatedField) && !$field->store) {
                $this->writeDelegatedField($record, $key, $value);
            }
        }
    }

    // ══════════════════════════════════════════════════════
    //  Group-by query (read_group)
    // ══════════════════════════════════════════════════════

    public function readGroup($query, string $groupBy, array $measures = []): array
    {
        $field = $this->fields[$groupBy] ?? null;
        if (!$field) return [];

        // Auto-detect numeric fields for aggregation if none specified
        if (empty($measures)) {
            foreach ($this->fields as $f) {
                if (in_array($f->type, [Field::INTEGER, Field::FLOAT, Field::MONETARY]) && $f->store !== false) {
                    $measures[] = $f->name;
                }
            }
        }

        TTransaction::open('advsoft');
        $pdo = TTransaction::get();
        $table = $this->_table;

        $selects = "{$groupBy}, COUNT(*) as __count";
        foreach ($measures as $m) {
            if (isset($this->fields[$m]) && $m !== $groupBy) {
                $selects .= ", SUM({$m}) as {$m}__sum";
            }
        }

        $stmt = $pdo->query("SELECT {$selects} FROM {$table} GROUP BY {$groupBy}");
        $groups = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];
        TTransaction::close();

        $extractAggs = function (array $g) use ($measures, $groupBy) {
            $aggs = [];
            foreach ($measures as $m) {
                if ($m === $groupBy) continue;
                $sumKey = $m . '__sum';
                if (isset($g[$sumKey])) {
                    $aggs[$m] = round((float) $g[$sumKey], 2);
                }
            }
            return $aggs;
        };

        if ($field->type === Field::MANY2ONE && $field->relation) {
            $relDef = Registry::get($field->relation);
            $relModel = $relDef ? $relDef->modelClass : null;
            $recNameField = $relDef?->_rec_name ?? 'name';

            $res = [];
            foreach ($groups as $g) {
                $val = $g[$groupBy];
                $rel = $relModel && $val ? $relModel::find($val) : null;
                $res[] = [
                    'id'           => $val,
                    'name'         => $rel ? ($rel->$recNameField ?? 'Undefined') : 'Undefined',
                    'value'        => $val,
                    '__count'      => (int) $g['__count'],
                    '__domain'     => [[$groupBy, '=', $val]],
                    '__groupBy'    => $groupBy,
                    '__aggregates' => $extractAggs($g),
                    'sequence'     => $rel && isset($rel->sequence) ? (int)$rel->sequence : 0,
                ];
            }
            usort($res, fn($a, $b) => ($a['sequence'] <=> $b['sequence']));
            return $res;
        }

        if ($field->type === Field::SELECTION) {
            $allOptions = [];
            foreach ($field->selection as $opt) {
                if (is_array($opt)) {
                    $k = $opt[0];
                    $v = $opt[1] ?? $opt[0];
                } else {
                    $k = $opt;
                    $v = $opt;
                }
                $allOptions[$k] = $v;
            }

            $existingMap = [];
            foreach ($groups as $g) {
                $existingMap[$g[$groupBy]] = $g;
            }

            $result = [];
            foreach ($allOptions as $val => $name) {
                $g = $existingMap[$val] ?? null;
                $result[] = [
                    'id'           => $val,
                    'name'         => $name,
                    'value'        => $val,
                    '__count'      => $g ? (int) $g['__count'] : 0,
                    '__domain'     => [[$groupBy, '=', $val]],
                    '__groupBy'    => $groupBy,
                    '__aggregates' => $g ? $extractAggs($g) : [],
                ];
            }
            return $result;
        }

        $res = [];
        foreach ($groups as $g) {
            $val = $g[$groupBy];
            $res[] = [
                'id'           => $val ?? '__none__',
                'name'         => (string) ($val ?? 'Unset'),
                'value'        => $val,
                '__count'      => (int) $g['__count'],
                '__domain'     => [[$groupBy, '=', $val]],
                '__groupBy'    => $groupBy,
                '__aggregates' => $extractAggs($g),
            ];
        }
        return $res;
    }

    // ══════════════════════════════════════════════════════
    //  Model metadata export
    // ══════════════════════════════════════════════════════

    /**
     * Export full model metadata (for admin/debug/introspection).
     */
    public function getModelInfo(): array
    {
        return [
            '_name'        => $this->_name,
            '_description' => $this->_description,
            '_table'       => $this->_table,
            '_order'       => $this->_order,
            '_rec_name'    => $this->_rec_name,
            '_inherit'     => $this->_inherit,
            '_inherits'    => $this->_inherits,
            'model_class'  => $this->modelClass,
            'field_count'  => count($this->fields),
            'inheritance'  => $this->getInheritanceType(),
            'inherited_from' => $this->getInheritedModels(),
            'security'     => $this->getSecurityInfo(),
            'decorators'   => $this->getDecorators(),
        ];
    }
}
