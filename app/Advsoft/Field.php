<?php

namespace App\Advsoft;

/**
 * Field
 *
 * @version    2.0.0
 * @package    Advsoft
 * @author     Taufik
 * @author     AdvSoft Team
 * @copyright  Copyright (c) 2026 AdvSoft Technologies
 * @license    https://opensource.org/licenses/MIT MIT License
 */
class Field
{
    // ══════════════════════════════════════════════════════
    //  SCALAR FIELD TYPES
    // ══════════════════════════════════════════════════════

    // ── String types ─────────────────────────────────────
    const CHAR = 'char';           // VARCHAR(size)
    const TEXT = 'text';           // TEXT (longform)
    const HTML = 'html';           // HTML content (rich text)

    // ── Numeric types ────────────────────────────────────
    const INTEGER = 'integer';     // INT
    const FLOAT = 'float';        // DECIMAL(digits)
    const MONETARY = 'monetary';   // DECIMAL + currency_id FK

    // ── Temporal types ───────────────────────────────────
    const DATE = 'date';           // DATE column
    const DATETIME = 'datetime';   // DATETIME/TIMESTAMP column

    // ── Choice & binary types ────────────────────────────
    const BOOLEAN = 'boolean';     // BOOLEAN / TINYINT(1)
    const SELECTION = 'selection'; // ENUM-like via app logic
    const BINARY = 'binary';       // BLOB / base64 data
    const JSON = 'json';           // JSONB / structured data (Odoo 15+)
    const PROPERTIES = 'properties'; // Dynamic property field (Odoo 16+)

    // ══════════════════════════════════════════════════════
    //  RELATIONAL FIELD TYPES
    // ══════════════════════════════════════════════════════
    const MANY2ONE = 'many2one';   // FK → satu record terkait
    const ONE2MANY = 'one2many';   // Virtual, butuh inverse_name
    const MANY2MANY = 'many2many'; // Tabel pivot otomatis
    const REFERENCE = 'reference'; // FK dinamis ke model apapun

    // ══════════════════════════════════════════════════════
    //  SPECIAL FIELD TYPES
    // ══════════════════════════════════════════════════════
    const COMPUTED = 'computed';   // @api.depends, store=True/False
    const RELATED = 'related';    // Shortcut ke field lain

    // ══════════════════════════════════════════════════════
    //  CORE ATTRIBUTES
    // ══════════════════════════════════════════════════════
    public string $name;
    public string $type;
    public string $string;              // Human-readable label
    public ?string $help = null;        // Tooltip/help text
    public bool $required = false;      // SQL NOT NULL + form validation
    public bool $readonly = false;      // Read-only in views
    public bool $store = true;          // Whether stored in DB (false = computed on read)
    public $default = null;             // Default value (scalar or callable)
    public bool $searchable = false;    // Can be used in search filters
    public bool $sortable = false;      // Can sort by this field
    public bool $groupable = false;     // Can group by this field
    public bool $invisible = false;     // Hidden from views
    public bool $copy = true;           // Copied on duplicate
    public bool $index = false;         // Database index
    public bool $tracking = false;      // Track changes (chatter)
    public ?string $groups = null;      // Access groups (comma-separated)
    public ?array $states = null;       // Legacy states attribute: e.g. ['draft', 'confirmed']
    public bool $companyDependent = false; // Value differs per company (Odoo 14+)
    public ?string $columnInvisible = null;  // Tree-view column visibility expression
    public ?string $columnRequired = null;   // Tree-view column required expression
    public bool $sanitize = true;       // HTML sanitization (default: true)
    public bool $trim = true;           // Trim whitespace for char fields

    // ══════════════════════════════════════════════════════
    //  HTML / RICH-TEXT ATTRIBUTES (AdvSoft-style html_field config)
    //  These are only meaningful when $type === self::HTML.
    //  They are forwarded to HtmlFieldConfig on the server and
    //  consumed by the RTE widget on the client.
    // ══════════════════════════════════════════════════════
    public ?string $htmlPreset = null;     // 'text' | 'standard' | 'full' | 'inline' | 'knowledge'
    public ?array $htmlOptions = null;     // Override any HtmlFieldConfig property
    public ?string $htmlPlaceholder = null; // Placeholder text shown in empty editor
    public ?string $htmlMinHeight = null;  // CSS height, e.g. '200px'
    public ?string $htmlMaxHeight = null;  // CSS height, e.g. '500px'
    public bool $htmlCompact = false;      // Compact toolbar (icon-only)
    public bool $htmlAllowFullscreen = true; // Show fullscreen toggle
    public ?array $htmlToolbar = null;     // Override toolbar layout
    public ?array $htmlPlugins = null;     // Override enabled plugins list
    public ?array $htmlAllowedTags = null; // Override allowed HTML tags
    public ?array $htmlAllowedClasses = null; // Override allowed CSS classes
    public ?array $htmlAllowedStyles = null; // Override allowed inline styles

    // ══════════════════════════════════════════════════════
    //  SELECTION ATTRIBUTES
    // ══════════════════════════════════════════════════════
    public array $selection = [];       // [['value','label'], ...] or ['value','label','groups'|[...]]

    // ══════════════════════════════════════════════════════
    //  RELATIONAL ATTRIBUTES
    // ══════════════════════════════════════════════════════
    public ?string $relation = null;    // Related model name (comodel_name)
    public ?string $inverseField = null; // For One2many: FK field on child
    public ?string $pivot = null;       // For Many2many: pivot table name
    public ?string $relationTable = null; // Alias for pivot
    public ?string $column1 = null;     // Many2many source FK column
    public ?string $column2 = null;     // Many2many target FK column
    public ?string $foreignKey = null;  // Alias for column1
    public ?string $relatedKey = null;  // Alias for column2
    public ?string $relatedField = null; // For Related fields: 'project_id.name'
    public ?array $domain = null;       // Domain filter for relational fields (array, legacy string auto-decoded)
    public ?string $ondelete = null;    // cascade, restrict, set null
    public array $displayFields = [];   // Fields to eager-load for relation display
    public ?array $context = null;      // Context dict passed with relational operations
    public bool $noOpen = false;        // M2O: disable click-to-open related record
    public bool $noOpenEdit = false;    // M2O: disable edit in popup
    public ?array $attrs = null;        // Odoo XML-style attrs="{invisible:..., readonly:..., required:...}"

    // ══════════════════════════════════════════════════════
    //  COMPUTED FIELD ATTRIBUTES
    // ══════════════════════════════════════════════════════
    public ?string $compute = null;     // Method name for computing
    public array $depends = [];         // Dependency fields (@api.depends)
    public ?string $inverse = null;     // Inverse method (make computed writable)
    public ?string $search = null;      // Search method for computed fields

    // ══════════════════════════════════════════════════════
    //  CONSTRAINT ATTRIBUTES
    // ══════════════════════════════════════════════════════
    public ?int $size = null;           // Max length for Char
    public ?array $digits = null;       // Precision for Float [total, decimal]
    public ?string $constraintMethod = null;
    public ?string $constraintMessage = null;

    // ══════════════════════════════════════════════════════
    //  MONETARY ATTRIBUTES
    // ══════════════════════════════════════════════════════
    public ?string $currencyField = null; // Field name holding currency (for monetary)
    public ?string $currencySymbol = null; // Static currency symbol fallback

    // ══════════════════════════════════════════════════════
    //  WIDGET & UI ATTRIBUTES
    // ══════════════════════════════════════════════════════
    public ?string $widget = null;      // Widget name: statusbar, priority, progressbar, etc.
    public array $options = [];         // Widget options (e.g. color_field, size, no_create, etc.)
    public ?string $placeholder = null; // Placeholder text
    public ?string $statusbar_visible = null; // For statusbar widget: visible states

    // ══════════════════════════════════════════════════════
    //  BINARY ATTRIBUTES
    // ══════════════════════════════════════════════════════
    public bool $attachment = false;    // Store as ir.attachment
    public ?string $filename = null;    // Related filename field
    public ?int $maxSize = null;        // Max file size in bytes
    public ?string $subtype = null;     // 'image' | 'pdf' | 'file' | 'signature' | null
    public ?array $allowedTypes = null; // MIME types allowed: ['image/png', 'image/jpeg']

    // ══════════════════════════════════════════════════════
    //  REFERENCE ATTRIBUTES
    // ══════════════════════════════════════════════════════
    public array $referenceSelection = []; // [['model.name', 'Label'], ...] for Reference field

    // ══════════════════════════════════════════════════════
    //  CONSTRUCTOR
    // ══════════════════════════════════════════════════════

    public function __construct(string $name, string $type, array $attrs = [])
    {
        $this->name = $name;
        $this->type = $type;
        $this->string = $attrs['string'] ?? ucfirst(str_replace('_', ' ', $name));

        // ── Domain shim: accept string (legacy) or array, normalize to array ──
        if (isset($attrs['domain'])) {
            if (is_string($attrs['domain'])) {
                $decoded = json_decode($attrs['domain'], true);
                $attrs['domain'] = is_array($decoded) ? $decoded : [];
            }
        }

        // Map snake_case to camelCase
        $keyMap = [
            'inverse_field' => 'inverseField',
            'inverse_name' => 'inverseField',
            'related_field' => 'relatedField',
            'relation_table' => 'relationTable',
            'foreign_key' => 'foreignKey',
            'related_key' => 'relatedKey',
            'currency_field' => 'currencyField',
            'currency_symbol' => 'currencySymbol',
            'max_size' => 'maxSize',
            'allowed_types' => 'allowedTypes',
            'reference_selection' => 'referenceSelection',
            'company_dependent' => 'companyDependent',
            'column_invisible' => 'columnInvisible',
            'column_required' => 'columnRequired',
        ];

        // Apply all attributes from attrs array
        foreach ($attrs as $key => $value) {
            $mappedKey = $keyMap[$key] ?? $key;
            if (property_exists($this, $mappedKey) && $mappedKey !== 'name' && $mappedKey !== 'type') {
                $this->{$mappedKey} = $value;
            }
        }

        // Normalize Many2many aliases
        if ($this->pivot && !$this->relationTable) $this->relationTable = $this->pivot;
        if ($this->relationTable && !$this->pivot) $this->pivot = $this->relationTable;
        if ($this->foreignKey && !$this->column1) $this->column1 = $this->foreignKey;
        if ($this->column1 && !$this->foreignKey) $this->foreignKey = $this->column1;
        if ($this->relatedKey && !$this->column2) $this->column2 = $this->relatedKey;
        if ($this->column2 && !$this->relatedKey) $this->relatedKey = $this->column2;

        // ── Auto-set defaults based on type ──────────────
        $this->applyTypeDefaults($type, $attrs);

        // ── Auto-detect binary subtype from widget (A2) ──
        if ($type === self::BINARY && !$this->subtype) {
            $this->subtype = match ($attrs['widget'] ?? null) {
                'image'        => 'image',
                'pdf_viewer'   => 'pdf',
                'signature'    => 'signature',
                default        => 'file',
            };
        }

        // ── Auto-suggest allowed mime types (A2) ─────────
        if ($type === self::BINARY && !$this->allowedTypes) {
            $this->allowedTypes = match ($this->subtype) {
                'image'     => ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
                'pdf'       => ['application/pdf'],
                'signature' => ['image/png'],
                default     => null, // accept all
            };
        }
    }

    /**
     * Apply sensible defaults based on field type.
     * Matches AdvSoft's automatic behavior.
     */
    private function applyTypeDefaults(string $type, array $attrs): void
    {
        switch ($type) {
            case self::MANY2ONE:
                $this->sortable = $attrs['sortable'] ?? true;
                $this->searchable = $attrs['searchable'] ?? true;
                $this->ondelete = $attrs['ondelete'] ?? 'set null';
                break;

            case self::CHAR:
                $this->searchable = $attrs['searchable'] ?? true;
                $this->sortable = $attrs['sortable'] ?? true;
                $this->size = $attrs['size'] ?? 255;
                break;

            case self::TEXT:
            case self::HTML:
                $this->searchable = $attrs['searchable'] ?? true;
                break;

            case self::INTEGER:
            case self::FLOAT:
                $this->sortable = $attrs['sortable'] ?? true;
                break;

            case self::MONETARY:
                $this->currencyField = $attrs['currencyField'] ?? 'currency_id';
                $this->currencySymbol = $attrs['currencySymbol'] ?? '$';
                $this->sortable = $attrs['sortable'] ?? true;
                $this->digits = $attrs['digits'] ?? [16, 2];
                break;

            case self::BOOLEAN:
                $this->default = $attrs['default'] ?? false;
                break;

            case self::SELECTION:
                $this->groupable = $attrs['groupable'] ?? true;
                break;

            case self::JSON:
                $this->searchable = $attrs['searchable'] ?? true;
                $this->sortable = $attrs['sortable'] ?? false;
                break;

            case self::PROPERTIES:
                $this->store = false;  // Computed on read
                $this->copy = false;
                break;

            case self::DATE:
            case self::DATETIME:
                $this->sortable = $attrs['sortable'] ?? true;
                break;

            case self::ONE2MANY:
                $this->store = false;  // Virtual, never stored in this table
                $this->copy = false;
                break;

            case self::MANY2MANY:
                $this->store = false;  // Stored in pivot, not this table
                break;

            case self::REFERENCE:
                // Reference fields store "model,id" in a single column
                $this->searchable = $attrs['searchable'] ?? true;
                break;

            case self::RELATED:
                // Related fields are shortcuts — computed from another field chain
                $this->store = $attrs['store'] ?? false;
                $this->readonly = $attrs['readonly'] ?? true;
                break;

            case self::COMPUTED:
                // Computed fields may or may not be stored
                $this->store = $attrs['store'] ?? false;
                $this->readonly = $attrs['readonly'] ?? true;
                break;
        }
    }

    // ══════════════════════════════════════════════════════
    //  EXPORT (fields_get response)
    // ══════════════════════════════════════════════════════

    /**
     * Export field definition (like AdvSoft's fields_get response).
     * Includes all widget-relevant metadata for the frontend.
     *
     * The frontend widget registry uses this to:
     *   1. Choose the correct widget (widget attr or default by type)
     *   2. Configure the widget (options, selection, digits, etc.)
     *   3. Handle relational field behavior (relation, domain, context)
     */
    public function toArray(): array
    {
        $result = [
            'name'       => $this->name,
            'type'       => $this->type,
            'string'     => $this->string,
            'required'   => $this->required,
            'readonly'   => $this->readonly,
            'searchable' => $this->searchable,
            'sortable'   => $this->sortable,
            'groupable'  => $this->groupable,
            'store'      => $this->store,
        ];

        // Conditional exports (only send non-default values)
        if ($this->help) $result['help'] = $this->help;
        if ($this->widget) $result['widget'] = $this->widget;
        if ($this->selection) {
            // Normalize legacy [k => v], tuple [[k, v]], and dict [{value, label}] to consistent dict shape
            $normSelection = [];
            foreach ($this->selection as $k => $item) {
                if (is_array($item)) {
                    if (count($item) === 2 && isset($item[0], $item[1])) {
                        $normSelection[] = ['value' => $item[0], 'label' => $item[1]];
                    } elseif (count($item) === 3 && isset($item[0], $item[1])) {
                        $normSelection[] = ['value' => $item[0], 'label' => $item[1], 'groups' => (array) $item[2]];
                    } else {
                        $normSelection[] = $item;
                    }
                } else {
                    $normSelection[] = ['value' => (string) $k, 'label' => (string) $item];
                }
            }
            $result['selection'] = $normSelection;
        }
        if ($this->relation) $result['relation'] = $this->relation;
        if ($this->inverseField) $result['inverse_field'] = $this->inverseField;
        if ($this->pivot) $result['pivot'] = $this->pivot;
        if ($this->relatedField) $result['related'] = $this->relatedField;
        if ($this->default !== null) $result['default'] = $this->default;
        if ($this->digits) $result['digits'] = $this->digits;
        if ($this->size) $result['size'] = $this->size;
        if ($this->placeholder) $result['placeholder'] = $this->placeholder;
        if ($this->currencyField) $result['currency_field'] = $this->currencyField;
        if ($this->currencySymbol) $result['currency_symbol'] = $this->currencySymbol;
        if ($this->options) $result['options'] = $this->options;
        if ($this->statusbar_visible) $result['statusbar_visible'] = $this->statusbar_visible;
        if ($this->attachment) $result['attachment'] = true;
        if ($this->filename) $result['filename'] = $this->filename;
        if ($this->maxSize) $result['max_size'] = $this->maxSize;
        if ($this->subtype) $result['subtype'] = $this->subtype;
        if ($this->allowedTypes) $result['allowed_types'] = $this->allowedTypes;
        if ($this->referenceSelection) $result['reference_selection'] = $this->referenceSelection;
        if ($this->tracking) $result['tracking'] = true;
        if ($this->invisible) $result['invisible'] = true;
        if ($this->copy === false) $result['copy'] = false;
        if ($this->compute) $result['compute'] = true;
        if ($this->depends) $result['depends'] = $this->depends;
        if ($this->domain) $result['domain'] = $this->domain;
        if ($this->context) $result['context'] = $this->context;
        if ($this->ondelete) $result['ondelete'] = $this->ondelete;
        if ($this->inverse) $result['inverse'] = true;
        if ($this->noOpen) $result['no_open'] = true;
        if ($this->noOpenEdit) $result['no_open_edit'] = true;
        if ($this->attrs) $result['attrs'] = $this->attrs;
        if ($this->groups) $result['groups'] = $this->groups;
        if ($this->states) $result['states'] = $this->states;
        if ($this->companyDependent) $result['company_dependent'] = true;
        if ($this->columnInvisible) $result['column_invisible'] = $this->columnInvisible;
        if ($this->columnRequired) $result['column_required'] = $this->columnRequired;
        if (!$this->sanitize) $result['sanitize'] = false;
        if ($this->trim === false) $result['trim'] = false;

        // ── Rich-Text / HTML field configuration ─────────────
        // Export the resolved HtmlFieldConfig when type === html so that
        // the RTE widget on the client knows exactly what to render.
        if ($this->type === self::HTML) {
            $result['html'] = $this->buildHtmlFieldConfig();
        }

        return $result;
    }

    /**
     * Build the HtmlFieldConfig payload sent to the client.
     * Resolves the preset and merges in per-field overrides.
     */
    protected function buildHtmlFieldConfig(): array
    {
        $class = '\\App\\Advsoft\\Field\\Html\\HtmlFieldConfig';

        if (!class_exists($class)) {
            return [];
        }

        /** @var \App\Advsoft\Field\Html\HtmlFieldConfig $cfg */
        $cfg = new $class(['preset' => $this->htmlPreset ?: 'standard']);

        // Per-field overrides
        if ($this->htmlPlaceholder !== null) $cfg->placeholder = $this->htmlPlaceholder;
        if ($this->htmlMinHeight !== null)   $cfg->minHeight   = $this->htmlMinHeight;
        if ($this->htmlMaxHeight !== null)   $cfg->maxHeight   = $this->htmlMaxHeight;
        if ($this->htmlCompact)              $cfg->compact     = true;
        if (!$this->htmlAllowFullscreen)     $cfg->allowFullscreen = false;
        if ($this->htmlToolbar)              $cfg->toolbar     = $this->htmlToolbar;
        if ($this->htmlPlugins)              $cfg->plugins     = $this->htmlPlugins;
        if ($this->htmlAllowedTags)          $cfg->allowedTags = $this->htmlAllowedTags;
        if ($this->htmlAllowedClasses)       $cfg->allowedClasses = $this->htmlAllowedClasses;
        if ($this->htmlAllowedStyles)        $cfg->allowedStyles  = $this->htmlAllowedStyles;
        if (is_array($this->htmlOptions)) {
            foreach ($this->htmlOptions as $k => $v) {
                if (property_exists($cfg, $k)) {
                    $cfg->$k = $v;
                }
            }
        }
        $cfg->string = $this->string;
        $cfg->name   = $this->name;

        return $cfg->toArray();
    }

    // ══════════════════════════════════════════════════════
    //  TYPE CHECKS
    // ══════════════════════════════════════════════════════

    /** Check if this is a relational field. */
    public function isRelational(): bool
    {
        return in_array($this->type, [self::MANY2ONE, self::ONE2MANY, self::MANY2MANY, self::REFERENCE]);
    }

    /** Check if this is a scalar (database-stored) field. */
    public function isScalar(): bool
    {
        return in_array($this->type, [
            self::CHAR, self::TEXT, self::INTEGER, self::FLOAT,
            self::BOOLEAN, self::DATE, self::DATETIME, self::SELECTION,
            self::HTML, self::MONETARY, self::BINARY, self::REFERENCE,
            self::JSON,
        ]);
    }

    /** Check if this is a numeric field (for aggregation measures). */
    public function isNumeric(): bool
    {
        return in_array($this->type, [self::INTEGER, self::FLOAT, self::MONETARY]);
    }

    /** Check if this is a string-like field. */
    public function isString(): bool
    {
        return in_array($this->type, [self::CHAR, self::TEXT, self::HTML]);
    }

    /** Check if this is a temporal field. */
    public function isTemporal(): bool
    {
        return in_array($this->type, [self::DATE, self::DATETIME]);
    }

    /** Check if this is a computed/related (non-stored) field. */
    public function isVirtual(): bool
    {
        return $this->store === false || in_array($this->type, [self::COMPUTED, self::RELATED]);
    }

    // ══════════════════════════════════════════════════════
    //  DEFAULT WIDGET RESOLUTION
    // ══════════════════════════════════════════════════════

    /**
     * Get the default widget name for this field type.
     * Used when no explicit widget= is set in the view.
     *
     * Matches AdvSoft's auto-selection logic:
     *   Field → Column PostgreSQL · Widget → Komponen OWL di browser
     *   tanpa widget= maka Odoo pilih default otomatis
     */
    public function getDefaultWidget(): string
    {
        if ($this->widget) return $this->widget;

        return match ($this->type) {
            self::CHAR      => 'char',
            self::TEXT      => 'text',
            self::HTML      => 'html',
            self::INTEGER   => 'integer',
            self::FLOAT     => 'float',
            self::MONETARY  => 'monetary',
            self::BOOLEAN   => 'boolean',
            self::DATE      => 'date',
            self::DATETIME  => 'datetime',
            self::SELECTION => 'selection',
            self::BINARY    => 'binary',
            self::JSON      => 'json',
            self::PROPERTIES => 'section_and_note',
            self::MANY2ONE  => 'many2one',
            self::ONE2MANY  => 'one2many',
            self::MANY2MANY => 'many2many_tags',
            self::REFERENCE => 'reference',
            self::RELATED   => 'char',
            self::COMPUTED  => 'char',
            default         => 'char',
        };
    }
}
