<?php

namespace App\Http\Controllers;

use App\Odoo\{Registry, Domain, Field, Security\SecurityContext, Security\SecurityService};
use App\Odoo\Exceptions\AccessDenied;
use App\Models\SavedFilter;
use App\Core\Http\Request;
use App\Core\Http\JsonResponse;
use Adianti\Database\TTransaction;

/**
 * OrmController – Fully generic, configuration-driven ORM gateway.
 *
 * ALL model knowledge comes from the Registry (ModelDefinition classes).
 * No field names, no model classes, no view layouts are hardcoded here.
 * This controller can serve ANY model registered in the Odoo Registry.
 *
 * Security layers enforced (per odoo2.png):
 *   - L1 res.users identification      → SecurityContext auto-restored from session
 *   - L3 ir.model.access (CRUD)        → resolveModel() + checkAccessRights()
 *   - L4 ir.rule (record filter)       → applyRuleDomain() injected in queries
 *   - L5 with_user / sudo / for_company → ?uid=X&sudo=1&company=ID in request
 *   - L6 field groups= stripping       → filterFieldsMetadata() in fieldsGet / read
 */
class OrmController extends Controller
{
    public function __construct(
        protected SecurityContext $ctx,
        protected SecurityService $security,
    ) {}

    /**
     * Resolve model definition from request, enforcing security.
     * Order of checks (Odoo parity):
     *   1. Resolve model
     *   2. check_access_rights(operation)  → ir.model.access
     *   3. Set context flags (sudo, with_user, company)
     */
    private function resolveModel(Request $request, string $operation = 'read')
    {
        $modelName = $request->input('model', 'task');
        if (is_array($modelName)) {
            $modelName = $modelName[0];
        }
        $def = Registry::get($modelName);
        if (!$def) {
            abort(404, "Model '$modelName' not found in registry.");
        }

        // Honor ?sudo=1 to bypass ACL (Odoo's recordset.sudo())
        if ($request->boolean('sudo')) {
            $def = $def->sudo();
        }

        // Honor ?uid=N to impersonate another user
        if ($uid = $request->input('uid')) {
            $impersonate = \App\Models\Res\ResUser::find($uid);
            if ($impersonate) {
                $def = $def->withUser($impersonate);
            }
        }

        // Honor ?company=N to switch company context
        if ($cid = $request->input('company')) {
            $def = $def->withCompany((int)$cid);
        }

        // L3: model-level ACL
        if (!$def->checkAccessRights($operation, false)) {
            abort(403, "Access denied: $operation on $modelName.");
        }

        return $def;
    }

    /**
     * Inject DB-driven record rules (ir.rule) into the query.
     * Combines with in-code recordRules via AND.
     */
    private function applyRuleDomain($query, string $modelName, string $operation = 'read'): void
    {
        if ($this->ctx->isSuperuser()) return;

        $dbDomain = $this->security->filterDomain($modelName, $operation);
        if (!empty($dbDomain)) {
            $def = Registry::get($modelName);
            $query->where(function ($q) use ($dbDomain, $def) {
                Domain::apply($q, $dbDomain, $def);
            });
        }
    }

    /**
     * Strip forbidden fields (field-level groups=) from a record before sending to client.
     */
    private function sanitizeRecord(string $modelName, array $record): array
    {
        return $this->security->filterRecordData($modelName, $record);
    }

    // ================================================================
    //  Aggregation endpoint (for Graph/Pivot views)
    // ================================================================

    /**
     * read_group – Group-by with aggregation (graph/pivot).
     * Returns aggregated measures per group combination.
     */
    public function readGroup(Request $request): JsonResponse
    {
        $def = $this->resolveModel($request, 'read');
        $modelName = $def->_name ?? null;
        $domain = $request->input('domain', []);
        $groupBy = $request->input('groupby', $request->input('group_by', []));
        if (is_string($groupBy)) {
            $groupBy = array_filter(array_map('trim', explode(',', $groupBy)));
        }
        $measures = $request->input('measures', []);
        if (is_string($measures)) {
            $measures = array_filter(array_map('trim', explode(',', $measures)));
        }
        $lazy = $request->input('lazy', true);

        if (empty($groupBy)) {
            return new JsonResponse(['groups' => [], 'error' => 'group_by is required']);
        }

        $query = $def->newQuery();

        // L4: record rules
        $query = $def->applyRecordRules($query, 'read');
        if ($modelName) {
            $this->applyRuleDomain($query, $modelName, 'read');
        }

        $query = Domain::apply($query, $domain, $def);

        // If single groupBy and defined on model, delegate to modelDef readGroup
        if (count($groupBy) === 1 && !str_contains($groupBy[0], ':')) {
            $groups = $def->readGroup($query, $groupBy[0], $measures);
            return new JsonResponse(['groups' => $groups]);
        }

        TTransaction::open('adiantisoft');
        $pdo = TTransaction::get();
        $table = $def->_table;

        $selects = [];
        $groupCols = [];
        foreach ($groupBy as $gb) {
            $fieldName = explode(':', $gb)[0];
            $selects[] = $fieldName;
            $groupCols[] = $fieldName;
        }

        foreach ($measures as $m) {
            $selects[] = "SUM({$m}) as {$m}_sum";
            $selects[] = "AVG({$m}) as {$m}_avg";
            $selects[] = "MIN({$m}) as {$m}_min";
            $selects[] = "MAX({$m}) as {$m}_max";
        }
        $selects[] = "COUNT(*) as __count";

        $sql = "SELECT " . implode(', ', $selects) . " FROM {$table}";
        $domSql = Domain::toSql($domain, $def);
        if (!empty($domSql['where'])) {
            $sql .= " WHERE " . $domSql['where'];
        }
        if (!empty($groupCols)) {
            $sql .= " GROUP BY " . implode(', ', $groupCols);
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($domSql['params'] ?? []);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $groups = [];
        foreach ($rows as $row) {
            $item = ['__count' => (int)$row['__count']];
            foreach ($groupBy as $gb) {
                $fieldName = explode(':', $gb)[0];
                $val = $row[$fieldName] ?? null;
                $item[$fieldName] = $val;
                $item[$fieldName . '_label'] = (string)($val ?? 'Undefined');
            }
            foreach ($measures as $m) {
                $item[$m . ':sum'] = round((float)($row[$m . '_sum'] ?? 0), 2);
                $item[$m . ':avg'] = round((float)($row[$m . '_avg'] ?? 0), 2);
                $item[$m . ':count'] = (int)$row['__count'];
            }
            $groups[] = $item;
        }

        return new JsonResponse(['groups' => $groups]);
    }

    // ================================================================
    //  Core ORM Methods (search_read, read, create, write, unlink)
    // ================================================================

    /**
     * search_read – Generic search with domain filtering, pagination, grouping.
     */
    public function searchRead(Request $request): JsonResponse
    {
        $def = $this->resolveModel($request, 'read');
        $modelName = $def->_name ?? null;
        $domain = $request->input('domain', []);
        $orderBy = $request->input('order', $def->_order);
        $limit = $request->input('limit', 80);
        $offset = $request->input('offset', 0);
        $groupBy = $request->input('group_by', null);

        $query = $def->newQuery();

        // L4: in-code record rules (ir.rule from *Def.php)
        $query = $def->applyRecordRules($query, 'read');

        // L4: DB-driven record rules (ir.rule table)
        if ($modelName) {
            $this->applyRuleDomain($query, $modelName, 'read');
        }

        // Apply domain filters
        $query = Domain::apply($query, $domain, $def);

        // Group by
        if ($groupBy) {
            $groups = $def->readGroup($query, $groupBy);
            return response()->json([
                'groups' => $groups,
                'length' => array_sum(array_column($groups, '__count')),
            ]);
        }

        $totalCount = $query->count();

        // Ordering (supports multi-field: "date desc, id desc")
        $orderClauses = array_map('trim', explode(',', $orderBy));
        foreach ($orderClauses as $clause) {
            $parts = preg_split('/\s+/', trim($clause));
            $field = $parts[0] ?? 'id';
            $dir = strtolower($parts[1] ?? 'desc');
            if (!in_array($dir, ['asc', 'desc'])) $dir = 'desc';

            // Map standard Odoo audit aliases to database columns
            if ($field === 'write_date') {
                $field = 'updated_at';
            } elseif ($field === 'create_date') {
                $field = 'created_at';
            }

            $query->orderBy($field, $dir);
        }

        // Pagination
        $query->skip($offset)->take($limit);

        // Eager loading (derived from field definitions)
        $eagerLoads = $def->getEagerLoads();
        if (!empty($eagerLoads)) {
            $query->with($eagerLoads);
        }

        $records = $query->get()->map(fn($r) => $def->transformRecord($r));

        // L6: strip fields user cannot read (groups=)
        if ($modelName) {
            $records = $records->map(fn($r) => $this->sanitizeRecord($modelName, $r));
        }

        return response()->json([
            'records' => $records,
            'length' => $totalCount,
        ]);
    }

    /**
     * read – Read a single record by ID.
     */
    public function read(Request $request): JsonResponse
    {
        $def = $this->resolveModel($request, 'read');
        $modelName = $def->_name ?? null;
        $id = $request->input('id');
        if (is_array($id)) {
            $id = $id[0];
        }

        $query = $def->newQuery();

        // L4: in-code + DB record rules
        $query = $def->applyRecordRules($query, 'read');
        if ($modelName) {
            $this->applyRuleDomain($query, $modelName, 'read');
        }

        $eagerLoads = $def->getEagerLoads();
        if (!empty($eagerLoads)) $query->with($eagerLoads);

        $record = $query->findOrFail($id);
        $payload = $def->transformRecord($record);

        // L6: strip fields user cannot read
        if ($modelName) {
            $payload = $this->sanitizeRecord($modelName, $payload);
        }

        return response()->json($payload);
    }

    /**
     * create – Create a new record with lifecycle hooks.
     * Flow: beforeCreate → Eloquent create → relational writes → constraints → afterCreate
     */
    public function create(Request $request): JsonResponse
    {
        // Check ACL FIRST (before any DB op or validation)
        $def = $this->resolveModel($request, 'create');
        $modelName = $def->_name ?? null;

        // L4: For create, check record rules with perm_create
        if ($modelName && !$def->isSuperuser()) {
            try {
                $this->security->checkAccessRule($modelName, 'create', [0], true);
            } catch (\App\Odoo\Exceptions\AccessDenied $e) {
                return response()->json(['error' => $e->getMessage()], 403);
            }
        }

        $values = $request->input('values', []);

        // Apply onchange for initial values
        $values = $def->applyOnchangeMulti(array_keys($values), $values);

        // Validate constraints pre-create (with a temp model)
        $tempRecord = new ($def->modelClass);
        $error = $def->validateConstraints($tempRecord, $values);
        if ($error) {
            return response()->json(['error' => $error], 422);
        }

        try {
            // Use lifecycle-aware create (beforeCreate → create → afterCreate)
            $record = $def->performCreate($values);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        // Reload with relations
        $eagerLoads = $def->getEagerLoads();
        if (!empty($eagerLoads)) $record->load($eagerLoads);

        $payload = $def->transformRecord($record);
        if ($modelName) $payload = $this->sanitizeRecord($modelName, $payload);

        return response()->json([
            'id' => $record->id,
            'record' => $payload,
        ]);
    }

    /**
     * write – Update existing records with lifecycle hooks.
     * Flow: beforeWrite → Eloquent update → relational writes → recompute → afterWrite
     */
    public function write(Request $request): JsonResponse
    {
        $def = $this->resolveModel($request, 'write');
        $modelName = $def->_name ?? null;
        $ids = $request->input('ids', []);
        $values = $request->input('values', []);

        // L4: verify each id passes write record rules
        if ($modelName && !empty($ids) && !$def->isSuperuser()) {
            try {
                $this->security->checkAccessRule($modelName, 'write', (array)$ids, true);
            } catch (\App\Odoo\Exceptions\AccessDenied $e) {
                return response()->json(['error' => $e->getMessage()], 403);
            }
        }

        // Apply onchange
        $values = $def->applyOnchangeMulti(array_keys($values), $values);

        // Validate constraints on first record
        $firstRecord = $def->newQuery()->find($ids[0] ?? 0);
        if ($firstRecord) {
            $error = $def->validateConstraints($firstRecord, $values);
            if ($error) {
                return response()->json(['error' => $error], 422);
            }
        }

        try {
            // Use lifecycle-aware write (beforeWrite → update → afterWrite)
            $def->performWrite($ids, $values);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json(['success' => true, 'ids' => $ids]);
    }

    /**
     * unlink – Delete records with lifecycle hooks.
     * Flow: beforeUnlink → Eloquent delete → afterUnlink
     */
    public function unlink(Request $request): JsonResponse
    {
        $def = $this->resolveModel($request, 'unlink');
        $modelName = $def->_name ?? null;
        $ids = $request->input('ids', []);

        // L4: verify each id passes unlink record rules
        if ($modelName && !empty($ids) && !$def->isSuperuser()) {
            try {
                $this->security->checkAccessRule($modelName, 'unlink', (array)$ids, true);
            } catch (\App\Odoo\Exceptions\AccessDenied $e) {
                return response()->json(['error' => $e->getMessage()], 403);
            }
        }

        try {
            $error = $def->performUnlink($ids);
            if ($error) {
                return response()->json(['error' => $error], 422);
            }
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json(['success' => true]);
    }

    // ================================================================
    //  Metadata endpoints
    // ================================================================

    /**
     * fields_get – Return field definitions for a model.
     */
    public function fieldsGet(Request $request): JsonResponse
    {
        $def = $this->resolveModel($request, 'read');
        $modelName = $def->_name ?? null;
        $fields = $def->fieldsGet();

        // L6: filter fields the user cannot read (groups=)
        if ($modelName) {
            $fields = $this->security->filterFieldsMetadata($modelName, $fields);
        }

        return response()->json($fields);
    }

    /**
     * load_views – Batch load all view definitions, fields metadata, and filters in a single request.
     * Replaces 8+ separate HTTP requests with a single fast ~15ms round-trip.
     */
    public function loadViews(Request $request): JsonResponse
    {
        $def = $this->resolveModel($request, 'read');
        $modelName = $request->input('model');
        $requestedViews = $request->input('views', ['search', 'list', 'form', 'kanban', 'calendar', 'graph', 'pivot', 'spreadsheet']);

        $views = [];
        foreach ($requestedViews as $vt) {
            $views[$vt] = $this->resolveViewWithOverrides($modelName, $vt, $def);
        }

        $fields = $def->fieldsGet();
        if ($modelName) {
            $fields = $this->security->filterFieldsMetadata($modelName, $fields);
        }

        // Also fetch custom saved filters for this model
        $filters = [];
        try {
            \Adianti\Database\TTransaction::open('adiantisoft');
            $conn = \Adianti\Database\TTransaction::get();
            $stmt = $conn->prepare("SELECT * FROM saved_filter WHERE model = :m AND (is_global = 1 OR user_id = :uid) ORDER BY name ASC");
            $uid = $this->ctx->getUid() ?: 1;
            $stmt->execute([':m' => $modelName, ':uid' => $uid]);
            $filters = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];
        } catch (\Throwable $e) {
            $filters = [];
        }

        return response()->json([
            'views'   => $views,
            'fields'  => $fields,
            'filters' => $filters,
        ]);
    }

    /**
     * get_view – Return view definition (list, form, search, kanban, calendar, graph, pivot).
     *
     * Resolution order:
     *   1. ir_ui_views custom override (from View Builder)
     *   2. Code-defined view in ModelDefinition
     */
    public function getViewDef(Request $request): JsonResponse
    {
        $def = $this->resolveModel($request, 'read');
        $viewType = $request->input('view_type', 'list');
        $modelName = $request->input('model');

        return response()->json(
            $this->resolveViewWithOverrides($modelName, $viewType, $def)
        );
    }

    /**
     * Resolve view definition with ir_ui_views override support.
     *
     * If a custom view exists in ir_ui_views, merge its arch config
     * into the base ModelDefinition view definition. This allows the
     * View Builder to override field lists, column configs, decorations,
     * etc. while preserving the full field_defs metadata.
     */
    private function resolveViewWithOverrides(string $modelName, string $viewType, $def): array
    {
        // 1. Get code-defined base view
        $codeView = $def->getView($viewType);

        // 2. Check for custom override from View Builder
        \Adianti\Database\TTransaction::open('adiantisoft');
        $conn = \Adianti\Database\TTransaction::get();
        $stmt = $conn->prepare("SELECT * FROM ir_ui_views WHERE model = :m AND type = :t AND active = 1 ORDER BY priority ASC LIMIT 1");
        $stmt->execute([':m' => $modelName, ':t' => $viewType]);
        $custom = $stmt->fetch(\PDO::FETCH_OBJ);

        if (!$custom) {
            return $codeView;
        }

        $customArch = json_decode($custom->arch, true);
        if (empty($customArch) || !is_array($customArch)) {
            return $codeView;
        }

        // 3. Merge custom arch into code view based on view type
        return match ($viewType) {
            'list'     => $this->mergeListView($codeView, $customArch, $def),
            'form'     => $this->mergeFormView($codeView, $customArch, $def),
            'kanban'   => $this->mergeKanbanView($codeView, $customArch, $def),
            'calendar' => $this->mergeCalendarView($codeView, $customArch, $def),
            'pivot'    => $this->mergePivotView($codeView, $customArch, $def),
            'graph'    => $this->mergeGraphView($codeView, $customArch, $def),
            'spreadsheet' => $this->mergeSpreadsheetView($codeView, $customArch, $def),
            default    => $codeView,
        };
    }

    /**
     * Merge custom list view arch from View Builder into code-defined list view.
     */
    private function mergeListView(array $base, array $custom, $def): array
    {
        // Override field list if builder has one
        if (!empty($custom['fields'])) {
            $fieldNames = $custom['fields'];
            $fieldDefs = $def->fieldsGet($fieldNames);
            $columnConfig = $custom['column_config'] ?? [];

            $columns = [];
            foreach ($fieldNames as $fname) {
                $fDef = $fieldDefs[$fname] ?? null;
                if (!$fDef) continue;

                $col = [
                    'name'     => $fname,
                    'string'   => $fDef['string'] ?? ucfirst(str_replace('_', ' ', $fname)),
                    'type'     => $fDef['type'] ?? 'char',
                    'widget'   => $fDef['widget'] ?? null,
                    'sortable' => $fDef['sortable'] ?? false,
                ];

                $cc = $columnConfig[$fname] ?? [];
                $col['optional'] = $cc['optional'] ?? null;
                foreach (['sum', 'avg', 'max', 'min'] as $agg) {
                    if (isset($cc[$agg])) {
                        $col['aggregation'] = $agg;
                        $col['aggregation_label'] = $cc[$agg];
                    }
                }
                if (isset($cc['width'])) $col['width'] = $cc['width'];
                if (isset($cc['widget'])) $col['widget'] = $cc['widget'];

                $columns[] = $col;
            }

            $base['fields'] = $fieldNames;
            $base['columns'] = $columns;
            $base['field_defs'] = $fieldDefs;
        }

        // Override tree-level attributes
        if (isset($custom['editable']))    $base['editable'] = $custom['editable'] ?: null;
        if (isset($custom['multi_edit']))  $base['multi_edit'] = (bool)$custom['multi_edit'];
        if (isset($custom['limit']))       $base['limit'] = (int)$custom['limit'];
        if (!empty($custom['decoration'])) $base['decoration'] = $custom['decoration'];
        if (!empty($custom['header_buttons'])) $base['header_buttons'] = $custom['header_buttons'];
        if (isset($custom['default_order'])) $base['default_order'] = $custom['default_order'];

        return $base;
    }

    /**
     * Merge custom form view arch from View Builder.
     */
    private function mergeFormView(array $base, array $custom, $def): array
    {
        $fieldDefs = $def->fieldsGet();
        $fieldConfig = $custom['field_config'] ?? [];

        // Override groups layout
        if (!empty($custom['groups'])) {
            $groups = [];
            foreach ($custom['groups'] as $grp) {
                $groupDef = [
                    'string' => $grp['string'] ?? null,
                    'columns' => [],
                ];
                foreach ($grp['columns'] ?? [] as $colFields) {
                    $column = [];
                    foreach ($colFields as $f) {
                        $fname = is_string($f) ? $f : ($f['name'] ?? '');
                        if (empty($fname) || !isset($fieldDefs[$fname])) continue;

                        // Start from field def defaults
                        $fieldCfg = [
                            'name'     => $fname,
                            'string'   => $fieldDefs[$fname]['string'] ?? $fname,
                            'type'     => $fieldDefs[$fname]['type'] ?? 'char',
                            'widget'   => is_array($f) ? ($f['widget'] ?? $fieldDefs[$fname]['widget'] ?? null) : ($fieldDefs[$fname]['widget'] ?? null),
                            'required' => $fieldDefs[$fname]['required'] ?? false,
                            'readonly' => $fieldDefs[$fname]['readonly'] ?? false,
                        ];
                        if (is_array($f) && !empty($f['invisible'])) $fieldCfg['invisible'] = $f['invisible'];
                        if (is_array($f) && !empty($f['attrs']))     $fieldCfg['attrs'] = $f['attrs'];

                        // Apply field_config overrides from builder
                        if (!empty($fieldConfig[$fname])) {
                            $fc = $fieldConfig[$fname];
                            if (!empty($fc['widget']))      $fieldCfg['widget'] = $fc['widget'];
                            if (!empty($fc['placeholder'])) $fieldCfg['placeholder'] = $fc['placeholder'];
                            if (!empty($fc['required']))    $fieldCfg['required'] = true;
                            if (!empty($fc['readonly']))    $fieldCfg['readonly'] = true;
                            if (!empty($fc['invisible']))   $fieldCfg['invisible'] = true;
                            if (!empty($fc['nolabel']))     $fieldCfg['nolabel'] = true;
                        }

                        $column[] = $fieldCfg;
                    }
                    $groupDef['columns'][] = $column;
                }
                $groups[] = $groupDef;
            }
            $base['groups'] = $groups;
        }

        // Override statusbar
        if (isset($custom['statusbar'])) {
            $base['statusbar'] = $custom['statusbar'] ?: null;
            $base['statusbar_clickable'] = $custom['statusbar_clickable'] ?? true;
        }

        // Override header buttons
        if (!empty($custom['header_buttons'])) {
            $base['header_buttons'] = $custom['header_buttons'];
        }

        // Override tabs
        if (!empty($custom['tabs'])) {
            $baseTabsMap = [];
            if (!empty($base['tabs'])) {
                foreach ($base['tabs'] as $btab) {
                    $baseTabsMap[$btab['name']] = $btab;
                }
            }

            $mergedTabs = [];
            foreach ($custom['tabs'] as $ctab) {
                // Normalize builder's 'layout' type tabs to 'group' type with nested groups
                $tabType = $ctab['type'] ?? '';
                if ($tabType === 'layout' || ($tabType === '' && !empty($ctab['groups']))) {
                    $ctab['type'] = 'group';
                    // Convert groups fields from plain strings to proper field config objects
                    if (!empty($ctab['groups'])) {
                        $convertedGroups = [];
                        foreach ($ctab['groups'] as $tgrp) {
                            $tgroupDef = ['string' => $tgrp['string'] ?? null, 'columns' => []];
                            foreach ($tgrp['columns'] ?? [] as $tcol) {
                                $tcolumn = [];
                                foreach ($tcol as $tf) {
                                    $tfname = is_string($tf) ? $tf : ($tf['name'] ?? '');
                                    if (empty($tfname) || !isset($fieldDefs[$tfname])) continue;
                                    $tfCfg = [
                                        'name'     => $tfname,
                                        'string'   => $fieldDefs[$tfname]['string'] ?? $tfname,
                                        'type'     => $fieldDefs[$tfname]['type'] ?? 'char',
                                        'widget'   => $fieldDefs[$tfname]['widget'] ?? null,
                                        'required' => $fieldDefs[$tfname]['required'] ?? false,
                                        'readonly' => $fieldDefs[$tfname]['readonly'] ?? false,
                                    ];
                                    // Apply field_config overrides
                                    if (!empty($fieldConfig[$tfname])) {
                                        $fc = $fieldConfig[$tfname];
                                        if (!empty($fc['widget']))      $tfCfg['widget'] = $fc['widget'];
                                        if (!empty($fc['placeholder'])) $tfCfg['placeholder'] = $fc['placeholder'];
                                        if (!empty($fc['required']))    $tfCfg['required'] = true;
                                        if (!empty($fc['readonly']))    $tfCfg['readonly'] = true;
                                        if (!empty($fc['invisible']))   $tfCfg['invisible'] = true;
                                        if (!empty($fc['nolabel']))     $tfCfg['nolabel'] = true;
                                    }
                                    $tcolumn[] = $tfCfg;
                                }
                                $tgroupDef['columns'][] = $tcolumn;
                            }
                            $convertedGroups[] = $tgroupDef;
                        }
                        $ctab['groups'] = $convertedGroups;
                    }
                }

                if (isset($baseTabsMap[$ctab['name']])) {
                    $mergedTabs[] = array_merge($baseTabsMap[$ctab['name']], $ctab);
                } else {
                    $mergedTabs[] = $ctab;
                }
            }
            $base['tabs'] = $mergedTabs;
        }

        // Chatter (preserve both bool and array format)
        if (isset($custom['chatter'])) {
            $base['chatter'] = $custom['chatter'];
        }

        // Title field
        if (isset($custom['title'])) {
            $base['title'] = $custom['title'];
        }

        // Priority field
        if (isset($custom['priority'])) {
            $base['priority'] = $custom['priority'];
        }

        // Stat buttons
        if (!empty($custom['stat_buttons'])) {
            $base['stat_buttons'] = $custom['stat_buttons'];
        }

        // Store field_config for frontend access
        if (!empty($fieldConfig)) {
            $base['field_config'] = $fieldConfig;
        }

        $base['field_defs'] = $fieldDefs;
        return $base;
    }

    /**
     * Merge custom kanban view arch from View Builder.
     */
    private function mergeKanbanView(array $base, array $custom, $def): array
    {
        if (isset($custom['default_group_by'])) $base['default_group_by'] = $custom['default_group_by'] ?: null;
        if (isset($custom['quick_create']))     $base['quick_create'] = (bool)$custom['quick_create'];
        if (isset($custom['card_title']))       $base['card_title'] = $custom['card_title'];
        if (isset($custom['card_tags']))        $base['card_tags'] = $custom['card_tags'] ?: null;
        if (!empty($custom['card_fields']))     $base['card_fields'] = $custom['card_fields'];
        if (!empty($custom['card_footer']))     $base['card_footer'] = $custom['card_footer'];
        if (isset($custom['card_image']))       $base['card_image'] = $custom['card_image'] ?: null;
        if (isset($custom['color_field']))      $base['color_field'] = $custom['color_field'] ?: null;
        if (!empty($custom['decoration']))      $base['decoration'] = $custom['decoration'];
        if (!empty($custom['aggregates']))      $base['aggregates'] = $custom['aggregates'];
        if (isset($custom['fold_field']))       $base['fold_field'] = $custom['fold_field'] ?: null;
        $base['field_defs'] = $def->fieldsGet();
        return $base;
    }

    /**
     * Merge custom calendar view arch from View Builder.
     */
    private function mergeCalendarView(array $base, array $custom, $def): array
    {
        if (isset($custom['date_start']))  $base['date_start'] = $custom['date_start'];
        if (isset($custom['date_stop']))   $base['date_stop'] = $custom['date_stop'] ?: null;
        if (isset($custom['color']))       $base['color'] = $custom['color'] ?: null;
        if (isset($custom['mode']))        $base['mode'] = $custom['mode'];
        if (!empty($custom['event_display_fields'])) $base['event_display_fields'] = $custom['event_display_fields'];
        if (isset($custom['quick_create']))     $base['quick_create'] = (bool)$custom['quick_create'];
        if (isset($custom['create_name_field'])) $base['create_name_field'] = $custom['create_name_field'] ?: null;
        if (isset($custom['date_delay']))       $base['date_delay'] = $custom['date_delay'] ?: null;
        if (isset($custom['color_legend']))     $base['color_legend'] = (bool)$custom['color_legend'];
        $base['field_defs'] = $def->fieldsGet();
        return $base;
    }

    /**
     * Merge custom pivot view arch from View Builder.
     */
    private function mergePivotView(array $base, array $custom, $def): array
    {
        if (!empty($custom['row_groupby'])) $base['row_groupby'] = $custom['row_groupby'];
        if (!empty($custom['col_groupby'])) $base['col_groupby'] = $custom['col_groupby'];
        if (!empty($custom['measures']))    $base['measures'] = $custom['measures'];
        $base['field_defs'] = $def->fieldsGet();
        return $base;
    }

    /**
     * Merge custom graph view arch from View Builder.
     */
    private function mergeGraphView(array $base, array $custom, $def): array
    {
        if (isset($custom['graph_type'])) $base['graph_type'] = $custom['graph_type'];
        if (isset($custom['measure']))    $base['measure'] = $custom['measure'];
        if (!empty($custom['groupby']))   $base['groupby'] = $custom['groupby'];
        if (!empty($custom['measures']))  $base['measures'] = $custom['measures'];
        $base['field_defs'] = $def->fieldsGet();
        return $base;
    }

    /**
     * Merge custom spreadsheet view arch from View Builder.
     */
    private function mergeSpreadsheetView(array $base, array $custom, $def): array
    {
        if (!empty($custom['fields']))       $base['fields'] = $custom['fields'];
        if (isset($custom['column_width']))  $base['column_width'] = (int)$custom['column_width'];
        if (isset($custom['row_height']))    $base['row_height'] = (int)$custom['row_height'];
        if (isset($custom['limit']))         $base['limit'] = (int)$custom['limit'];
        if (isset($custom['aggregation']))   $base['aggregation'] = $custom['aggregation'];
        if (isset($custom['readonly']))      $base['readonly'] = (bool)$custom['readonly'];
        $base['field_defs'] = $def->fieldsGet();
        return $base;
    }

    /**
     * onchange – Process field change and return updated values.
     */
    public function onchange(Request $request): JsonResponse
    {
        $def = $this->resolveModel($request, 'write');
        $field = $request->input('field');
        $values = $request->input('values', []);
        $result = $def->applyOnchange($field, $values);
        return response()->json(['values' => $result]);
    }

    /**
     * call_button – Execute an action button method (type="object").
     */
    public function callButton(Request $request): JsonResponse
    {
        $def = $this->resolveModel($request, 'write');
        $method = $request->input('method');
        $id = $request->input('id');

        if (!method_exists($def, $method)) {
            return response()->json(['error' => "Method $method not found on " . $def->_name], 400);
        }

        $record = $def->newQuery()->find($id);
        if (!$record) {
            return response()->json(['error' => "Record not found"], 404);
        }

        try {
            $result = $def->{$method}($record);
            return response()->json(['action' => $result]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * call_button_multi – Execute a header button action on multiple records.
     * Called from <header> buttons in list view (multi-record actions).
     */
    public function callButtonMulti(Request $request): JsonResponse
    {
        $def = $this->resolveModel($request, 'write');
        $method = $request->input('method');
        $ids = $request->input('ids', []);

        if (!method_exists($def, $method)) {
            return response()->json(['error' => "Method $method not found on " . $def->_name], 400);
        }

        $results = [];
        $errors = [];

        foreach ($ids as $id) {
            $record = $def->newQuery()->find($id);
            if (!$record) {
                $errors[] = "Record $id not found";
                continue;
            }

            try {
                $result = $def->{$method}($record);
                $results[] = ['id' => $id, 'result' => $result];
            } catch (\Exception $e) {
                $errors[] = "Record $id: " . $e->getMessage();
            }
        }

        return response()->json([
            'success' => empty($errors),
            'results' => $results,
            'errors'  => $errors,
            'count'   => count($results),
        ]);
    }

    /**
     * aggregate – Compute column aggregates for visible records.
     * Used by list view footer to show sum/avg/max/min per column.
     */
    public function aggregate(Request $request): JsonResponse
    {
        $def = $this->resolveModel($request, 'read');
        $domain = $request->input('domain', []);
        $measures = $request->input('measures', []); // [{field, type}]

        $query = $def->newQuery();
        $query = $def->applyRecordRules($query, 'read');
        $query = Domain::apply($query, $domain, $def);

        $result = [];
        foreach ($measures as $m) {
            $fieldName = is_array($m) ? ($m['field'] ?? '') : $m;
            $aggType = is_array($m) ? ($m['type'] ?? 'sum') : 'sum';

            $field = $def->getField($fieldName);
            if (!$field || !$field->isNumeric()) continue;

            $val = match ($aggType) {
                'sum'  => (clone $query)->sum($fieldName),
                'avg'  => (clone $query)->avg($fieldName),
                'max'  => (clone $query)->max($fieldName),
                'min'  => (clone $query)->min($fieldName),
                default => 0,
            };

            $result[$fieldName] = [
                'type'  => $aggType,
                'value' => round((float) $val, 2),
            ];
        }

        return response()->json(['aggregates' => $result]);
    }

    // ================================================================
    //  Generic relation data endpoints
    // ================================================================

    /**
     * name_search – Search a related model by name (for autocomplete).
     * Uses model's nameGet() for display labels.
     * NOW ENFORCES read ACL.
     */
    public function nameSearch(Request $request): JsonResponse
    {
        $modelName = $request->input('model');
        $query = $request->input('query', '');
        $limit = $request->input('limit', 20);

        $def = Registry::get($modelName);
        if (!$def) return response()->json([]);

        // ACL gate
        if (!$def->checkAccess('read')) {
            abort(403, "Access denied: read on $modelName.");
        }

        $q = $def->newQuery();
        $q = $def->applyRecordRules($q, 'read');
        if ($query) {
            $q->where($def->_rec_name, 'like', "%{$query}%");
        }

        $records = $q->orderBy($def->_rec_name)->limit($limit)->get();
        return response()->json($records->map(function ($r) use ($def) {
            $data = ['id' => $r->id, 'name' => $def->nameGet($r)];
            if (isset($r->color)) $data['color'] = $r->color;
            if (isset($r->sequence)) $data['sequence'] = $r->sequence;
            if (isset($r->fold)) $data['fold'] = $r->fold;
            return $data;
        }));
    }

    /**
     * Quick Create — Odoo name_create equivalent.
     * Creates a record with just a name (using _rec_name).
     * Used by the M2O autocomplete "Create ..." action.
     * NOW ENFORCES create ACL.
     */
    public function quickCreate(Request $request): JsonResponse
    {
        $modelName = $request->input('model');
        $name = $request->input('name', '');

        $def = Registry::get($modelName);
        if (!$def) abort(404, "Model not found: {$modelName}");

        if (!$def->checkAccess('create')) {
            abort(403, "Access denied: create on $modelName.");
        }

        $recName = $def->_rec_name;
        $values = [$recName => $name];

        // Apply any default values
        $scalar = $def->prepareWriteValues($values);
        $record = $def->performCreate($scalar);

        return response()->json([
            'id'   => $record->id,
            'name' => $def->nameGet($record),
        ]);
    }

    // ================================================================
    //  One2many child CRUD (generic — ACL enforced)
    // ================================================================

    /**
     * Create a child record for a one2many field.
     * Enforces parent.write ACL, child.create ACL, record rules, onchange, constraints.
     * Returns: {id, record, write_date}
     */
    public function createChild(Request $request): JsonResponse
    {
        $parentModel = $request->input('parent_model');
        $fieldName = $request->input('field');
        $values = $request->input('values', []);

        error_log("createChild hit: $parentModel $fieldName: " . json_encode($values));

        $parentDef = $this->resolveO2mParent($request, $parentModel, $fieldName);
        $field = $parentDef->getField($fieldName);
        $childDef = $this->resolveChild($field->relation, 'create');

        $scalar = $childDef->prepareWriteValues($values);
        if ($field->inverseField) {
            $scalar[$field->inverseField] = $values[$field->inverseField] ?? null;
        }

        // Apply default + onchange + constraint
        $scalar = $childDef->applyOnchangeMulti(array_keys($scalar), $scalar);

        TTransaction::open('adiantisoft');
        try {
            $temp = new ($childDef->modelClass);
            $err = $childDef->validateConstraints($temp, $scalar);
            if ($err) {
                TTransaction::rollback();
                return response()->json(['error' => $err], 422);
            }

            $record = $childDef->performCreate($scalar);
            
            $eagerLoads = $childDef->getEagerLoads();
            $record = $childDef->newQuery()->with($eagerLoads)->findOrFail($record->id);

            TTransaction::close();

            return response()->json([
                'id' => $record->id,
                'record' => $childDef->transformRecord($record),
                'write_date' => $record->write_date ?? null,
            ]);
        } catch (\Exception $e) {
            TTransaction::rollback();
            throw $e;
        }
    }

    /**
     * Update a child record.
     * Enforces child.write ACL, record rules, onchange, constraints, optimistic concurrency.
     * Returns: {id, record, write_date}
     */
    public function updateChild(Request $request, int $id): JsonResponse
    {
        $childModel = $request->input('child_model');
        $expectedWriteDate = $request->input('write_date');
        $values = $request->input('values', []);

        error_log("updateChild hit: $childModel $id: " . json_encode($values));

        $childDef = $this->resolveChild($childModel, 'write');

        $query = $childDef->newQuery();
        $query = $childDef->applyRecordRules($query, 'write');
        $record = $query->findOrFail($id);

        // Optimistic concurrency check
        if ($expectedWriteDate && isset($record->write_date) && $record->write_date != $expectedWriteDate) {
            return response()->json([
                'error' => 'Conflict: record was modified by another user.',
                'conflict' => true,
                'current' => $childDef->transformRecord($record),
            ], 409);
        }

        $scalar = $childDef->prepareWriteValues($values);
        $scalar = $childDef->applyOnchangeMulti(array_keys($scalar), $scalar);

        TTransaction::open('adiantisoft');
        try {
            $err = $childDef->validateConstraints($record, $scalar);
            if ($err) {
                TTransaction::rollback();
                return response()->json(['error' => $err], 422);
            }

            $childDef->performWrite([$id], $scalar);
            
            $eagerLoads = $childDef->getEagerLoads();
            $record = $childDef->newQuery()->with($eagerLoads)->findOrFail($id);

            TTransaction::close();

            return response()->json([
                'id' => $record->id,
                'record' => $childDef->transformRecord($record),
                'write_date' => $record->write_date ?? null,
            ]);
        } catch (\Exception $e) {
            TTransaction::rollback();
            throw $e;
        }
    }

    /**
     * Delete a child record.
     * Enforces child.unlink ACL and record rules.
     * Returns: {success, id}
     */
    public function deleteChild(Request $request, int $id): JsonResponse
    {
        $childModel = $request->input('child_model');
        $childDef = $this->resolveChild($childModel, 'unlink');

        $query = $childDef->newQuery();
        $query = $childDef->applyRecordRules($query, 'unlink');
        $record = $query->find($id);
        if (!$record) {
            return response()->json(['error' => "Record $id not found"], 404);
        }

        $err = $childDef->performUnlink([$id]);
        if ($err) return response()->json(['error' => $err], 422);

        return response()->json(['success' => true, 'id' => $id]);
    }

    /**
     * Onchange simulation for a single O2M line.
     * POST /api/orm/onchange_o2m
     * Body: { child_model, changed_field, values, context }
     * Returns: { values, changed_fields, warning? }
     */
    public function onchangeO2m(Request $request): JsonResponse
    {
        $childModel = $request->input('child_model');
        $changedField = $request->input('changed_field');
        $values = $request->input('values', []);

        $childDef = $this->resolveChild($childModel, 'write');

        $onchangeResult = $childDef->applyOnchange($changedField, $values);

        $changed = [];
        foreach ($onchangeResult as $k => $v) {
            if (array_key_exists($k, $values) && $values[$k] !== $v) {
                $changed[] = $k;
            } elseif (!array_key_exists($k, $values)) {
                $changed[] = $k;
            }
        }

        return response()->json([
            'values' => $onchangeResult,
            'changed_fields' => $changed,
        ]);
    }

    /**
     * Load O2M children (paginated, for virtual scroll or load-more).
     * GET /api/orm/load_o2m
     * Body: { parent_model, field, parent_id, domain, offset, limit, order }
     */
    public function loadO2m(Request $request): JsonResponse
    {
        $parentModel = $request->input('parent_model');
        $fieldName = $request->input('field');
        $parentId = $request->input('parent_id');
        $domain = $request->input('domain', []);
        $offset = $request->input('offset', 0);
        $limit = $request->input('limit', 80);
        $order = $request->input('order', null);

        $parentDef = $this->resolveO2mParent($request, $parentModel, $fieldName);
        $field = $parentDef->getField($fieldName);
        $childDef = $this->resolveChild($field->relation, 'read');

        if (!$field->inverseField) {
            return response()->json(['records' => [], 'length' => 0]);
        }

        $query = $childDef->newQuery();
        $query = $childDef->applyRecordRules($query, 'read');
        $query->where($field->inverseField, $parentId);
        if (!empty($domain)) {
            $query = Domain::apply($query, $domain, $childDef);
        }

        if ($order) {
            $parts = explode(' ', $order);
            $query->orderBy($parts[0], $parts[1] ?? 'asc');
        } else {
            $query->orderBy('id', 'asc');
        }

        $total = $query->count();
        $query->skip($offset)->take($limit);

        $eagerLoads = $childDef->getEagerLoads();
        if (!empty($eagerLoads)) $query->with($eagerLoads);

        $records = $query->get()->map(fn($r) => $childDef->transformRecord($r));

        return response()->json(['records' => $records, 'length' => $total]);
    }

    /**
     * Load O2M children grouped by a field (section grouping in inline tree).
     * POST /api/orm/load_o2m_grouped
     * Body: { parent_model, field, parent_id, group_by, aggregate_fields, domain }
     *
     * Returns groups with aggregate values and optionally the child records per group.
     * This powers the Odoo-style "default_group_by" for <tree> inside <form>.
     */
    public function loadO2mGrouped(Request $request): JsonResponse
    {
        $parentModel = $request->input('parent_model');
        $fieldName = $request->input('field');
        $parentId = $request->input('parent_id');
        $groupByField = $request->input('group_by');
        $aggregateFields = $request->input('aggregate_fields', []);
        $domain = $request->input('domain', []);
        $loadRecords = $request->boolean('load_records', false);
        $limit = $request->input('limit', 40);

        if (!$groupByField) {
            return response()->json(['error' => 'group_by is required'], 422);
        }

        $parentDef = $this->resolveO2mParent($request, $parentModel, $fieldName);
        $field = $parentDef->getField($fieldName);
        $childDef = $this->resolveChild($field->relation, 'read');

        if (!$field->inverseField) {
            return response()->json(['groups' => [], 'length' => 0]);
        }

        // Base query: all children of this parent
        $baseQuery = $childDef->newQuery();
        $baseQuery = $childDef->applyRecordRules($baseQuery, 'read');
        $baseQuery->where($field->inverseField, $parentId);
        if (!empty($domain)) {
            $baseQuery = Domain::apply($baseQuery, $domain, $childDef);
        }

        // Build GROUP BY query with aggregates
        $gbFieldDef = $childDef->getField($groupByField);
        if (!$gbFieldDef) {
            return response()->json(['error' => "Field '$groupByField' not found in child model"], 422);
        }

        $selects = [$groupByField, 'COUNT(*) as __count'];
        foreach ($aggregateFields as $af) {
            $afDef = $childDef->getField($af);
            if ($afDef && in_array($afDef->type, [\App\Odoo\Field::INTEGER, \App\Odoo\Field::FLOAT, \App\Odoo\Field::MONETARY])) {
                $selects[] = "SUM({$af}) as {$af}__sum";
                $selects[] = "AVG({$af}) as {$af}__avg";
            }
        }

        $groupRows = (clone $baseQuery)->select($selects)->groupBy($groupByField)->get();

        // Resolve display names for many2one group-by field
        $labelMap = [];
        if ($gbFieldDef->type === \App\Odoo\Field::MANY2ONE && $gbFieldDef->relation) {
            $relDef = Registry::get($gbFieldDef->relation);
            if ($relDef) {
                $ids = $groupRows->pluck($groupByField)->filter()->unique()->toArray();
                $recNameField = $relDef->_rec_name;
                $relRecords = ($relDef->modelClass)::whereIn('id', $ids)->get()->keyBy('id');
                $labelMap = $relRecords->mapWithKeys(fn($r) => [$r->id => $r->$recNameField])->toArray();
            }
        } elseif ($gbFieldDef->type === \App\Odoo\Field::SELECTION) {
            $labelMap = collect($gbFieldDef->selection)->pluck(1, 0)->toArray();
        }

        // Build groups array
        $groups = $groupRows->map(function ($g) use ($groupByField, $aggregateFields, $labelMap, $gbFieldDef) {
            $val = $g->$groupByField;
            $name = $labelMap[$val] ?? (string)($val ?? 'Undefined');

            $aggregates = [];
            foreach ($aggregateFields as $af) {
                $sumKey = $af . '__sum';
                $avgKey = $af . '__avg';
                $aggregates[$af] = [
                    'sum' => round((float)($g->$sumKey ?? 0), 2),
                    'avg' => round((float)($g->$avgKey ?? 0), 2),
                ];
            }

            return [
                'id'           => $val,
                'value'        => $val,
                'name'         => $name,
                '__count'      => $g->__count,
                '__aggregates' => $aggregates,
                '__domain'     => [[$groupByField, '=', $val]],
                '__groupBy'    => $groupByField,
                'isFolded'     => false,
                'records'      => [],
            ];
        })->values()->toArray();

        // Optionally preload records for each group (first N per group)
        if ($loadRecords) {
            $eagerLoads = $childDef->getEagerLoads();
            foreach ($groups as &$group) {
                $gQuery = (clone $baseQuery);
                $gQuery->where($groupByField, $group['value']);
                $gQuery->orderBy('id', 'asc')->take($limit);
                if (!empty($eagerLoads)) $gQuery->with($eagerLoads);
                $group['records'] = $gQuery->get()->map(fn($r) => $childDef->transformRecord($r))->toArray();
            }
            unset($group);
        }

        $totalCount = (clone $baseQuery)->count();

        return response()->json([
            'groups'   => $groups,
            'length'   => $totalCount,
            'group_by' => $groupByField,
        ]);
    }

    /**
     * Bulk create child records (atomic, for duplicate / paste).
     * POST /api/orm/bulk_create_child
     * Body: { parent_model, field, records: [{...}, ...] }
     */
    public function bulkCreateChild(Request $request): JsonResponse
    {
        $parentModel = $request->input('parent_model');
        $fieldName = $request->input('field');
        $records = $request->input('records', []);

        if (empty($records)) return response()->json(['records' => []]);

        $parentDef = $this->resolveO2mParent($request, $parentModel, $fieldName);
        $field = $parentDef->getField($fieldName);
        $childDef = $this->resolveChild($field->relation, 'create');

        TTransaction::open('adiantisoft');
        try {
            $created = [];
            foreach ($records as $values) {
                $scalar = $childDef->prepareWriteValues($values);
                if ($field->inverseField) {
                    $scalar[$field->inverseField] = $values[$field->inverseField] ?? null;
                }
                $scalar = $childDef->applyOnchangeMulti(array_keys($scalar), $scalar);
                $temp = new ($childDef->modelClass);
                $err = $childDef->validateConstraints($temp, $scalar);
                if ($err) {
                    TTransaction::rollback();
                    return response()->json(['error' => $err, 'failed_index' => count($created)], 422);
                }
                $rec = $childDef->performCreate($scalar);
                $created[] = $childDef->transformRecord($rec);
            }

            TTransaction::close();
            return response()->json(['records' => $created, 'count' => count($created)]);
        } catch (\Exception $e) {
            TTransaction::rollback();
            throw $e;
        }
    }

    /**
     * Bulk delete child records.
     * POST /api/orm/bulk_delete_child
     * Body: { child_model, ids: [int] }
     */
    public function bulkDeleteChild(Request $request): JsonResponse
    {
        $childModel = $request->input('child_model');
        $ids = $request->input('ids', []);

        if (empty($ids)) return response()->json(['success' => true, 'deleted' => 0]);

        $childDef = $this->resolveChild($childModel, 'unlink');

        $err = $childDef->performUnlink($ids);
        if ($err) return response()->json(['error' => $err], 422);

        return response()->json(['success' => true, 'deleted' => count($ids)]);
    }

    /**
     * Bulk write (e.g. archive multiple lines).
     * POST /api/orm/bulk_write_child
     * Body: { child_model, ids: [int], values: {...} }
     */
    public function bulkWriteChild(Request $request): JsonResponse
    {
        $childModel = $request->input('child_model');
        $ids = $request->input('ids', []);
        $values = $request->input('values', []);

        $childDef = $this->resolveChild($childModel, 'write');

        $scalar = $childDef->prepareWriteValues($values);
        $childDef->performWrite($ids, $scalar);

        return response()->json(['success' => true, 'updated' => count($ids)]);
    }

    /**
     * Reorder O2M by sequence_field (drag-drop).
     * POST /api/orm/reorder_o2m
     * Body: { child_model, sequence_field, ordered_ids: [int] }
     */
    public function reorderO2m(Request $request): JsonResponse
    {
        $childModel = $request->input('child_model');
        $sequenceField = $request->input('sequence_field', 'sequence');
        $orderedIds = $request->input('ordered_ids', []);

        $childDef = $this->resolveChild($childModel, 'write');

        $i = 10;
        foreach ($orderedIds as $id) {
            $childDef->newQuery()->where('id', $id)->update([$sequenceField => $i]);
            $i += 10;
        }

        return response()->json(['success' => true, 'count' => count($orderedIds)]);
    }

    /**
     * Call a per-row button method (e.g. action_archive on a line).
     * POST /api/orm/call_button_o2m
     * Body: { child_model, id, method }
     */
    public function callButtonO2m(Request $request): JsonResponse
    {
        $childModel = $request->input('child_model');
        $id = $request->input('id');
        $method = $request->input('method');

        $childDef = $this->resolveChild($childModel, 'write');
        if (!method_exists($childDef, $method)) {
            return response()->json(['error' => "Method $method not found"], 400);
        }

        $record = $childDef->newQuery()->findOrFail($id);
        try {
            $result = $childDef->{$method}($record);
            return response()->json(['action' => $result, 'record' => $childDef->transformRecord($record)]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Print O2M section as HTML (for PDF export — Phase 7).
     * POST /api/orm/print_o2m
     * Body: { parent_model, field, parent_id, template? }
     */
    public function printO2m(Request $request): JsonResponse
    {
        $parentModel = $request->input('parent_model');
        $fieldName = $request->input('field');
        $parentId = $request->input('parent_id');

        $parentDef = $this->resolveO2mParent($request, $parentModel, $fieldName);
        $field = $parentDef->getField($fieldName);
        $childDef = $this->resolveChild($field->relation, 'read');

        if (!$field->inverseField) {
            return response()->json(['html' => '']);
        }

        $records = $childDef->newQuery()->where($field->inverseField, $parentId)->get();
        $html = '<table class="table"><thead><tr>';
        foreach ($records->first() ? array_keys($records->first()->toArray()) : ['id'] as $col) {
            $html .= '<th>' . esc($col) . '</th>';
        }
        $html .= '</tr></thead><tbody>';
        foreach ($records as $r) {
            $html .= '<tr>';
            foreach ($r->toArray() as $v) {
                $html .= '<td>' . esc((string)$v) . '</td>';
            }
            $html .= '</tr>';
        }
        $html .= '</tbody></table>';

        return response()->json(['html' => $html, 'count' => $records->count()]);
    }

    /**
     * Resolve parent model for O2M operations.
     */
    private function resolveO2mParent(Request $request, string $parentModel, string $fieldName)
    {
        $parentDef = Registry::get($parentModel);
        if (!$parentDef) abort(404, "Parent model not found: $parentModel");
        if (!$parentDef->checkAccess('write')) {
            abort(403, "Access denied: write on $parentModel.");
        }
        $field = $parentDef->getField($fieldName);
        if (!$field || $field->type !== Field::ONE2MANY) {
            abort(400, "Field $fieldName is not a one2many.");
        }
        return $parentDef;
    }

    /**
     * Resolve child model for O2M operations (ACL gated).
     */
    private function resolveChild(string $childModel, string $operation)
    {
        $def = Registry::get($childModel);
        if (!$def) abort(404, "Child model not found: $childModel");
        if (!$def->checkAccess($operation)) {
            abort(403, "Access denied: $operation on $childModel.");
        }
        return $def;
    }

    // ================================================================
    //  Saved Filters (ir.filters equivalent)
    // ================================================================

    public function getFilters(Request $request): JsonResponse
    {
        $modelName = $request->input('model', 'task');
        return response()->json(
            SavedFilter::where('model_name', $modelName)->orderBy('name')->get()
        );
    }

    public function saveFilter(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'model_name' => 'required|string',
            'domain' => 'nullable|array',
            'group_by' => 'nullable|array',
            'order_by' => 'nullable|array',
            'is_default' => 'boolean',
            'is_shared' => 'boolean',
        ]);
        if (!empty($data['is_default'])) {
            SavedFilter::where('model_name', $data['model_name'])
                ->where('is_default', true)->update(['is_default' => false]);
        }
        return response()->json(SavedFilter::create($data));
    }

    public function deleteFilter(Request $request, int $id): JsonResponse
    {
        SavedFilter::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    // ================================================================
    //  Model listing (for admin/debug)
    // ================================================================
    //  Menu System (ir.ui.menu + ir.actions)
    // ================================================================

    /**
     * load_menus – Return the full menu tree with actions (cached at login).
     * Like Odoo's /web/webclient/load_menus.
     * Filters menus based on user group membership.
     */
    public function loadMenus(): JsonResponse
    {
        $menus = \App\Models\Menu::whereNull('parent_id')
            ->where('active', true)
            ->orderBy('sequence')
            ->get();

        $ctx = app(\App\Odoo\Security\SecurityContext::class);
        $user = $ctx->getUser();
        $isAdmin = $user && ($user->isAdmin() || $ctx->isSuperuser());
        $userGroupNames = $ctx->getGroupNames();
        $userGroupIds = $user ? $user->getGroupIds() : [];

        $result = $this->buildMenuTree($menus, $isAdmin, $userGroupNames, $userGroupIds);

        // Add hardcoded Security app for admin users (backward compat)
        if ($isAdmin) {
            // Check if security app already exists in DB-driven menus
            $hasSecurityApp = collect($result)->contains(fn($m) => ($m['id'] ?? '') === 'app_security' || ($m['security_view'] ?? null));
            if (!$hasSecurityApp) {
                $result[] = [
                    'id' => 'app_security',
                    'name' => 'Security',
                    'sequence' => 999,
                    'icon' => 'shield',
                    'web_icon' => 'shield',
                    'web_icon_color' => '#dc2626',
                    'action_id' => null,
                    'children' => [
                        ['id' => 'sec_overview',  'name' => 'Overview',         'security_view' => 'security_overview',   'icon' => 'shield'],
                        ['id' => 'sec_access',    'name' => 'Access Rights',    'security_view' => 'security_access',      'icon' => 'key'],
                        ['id' => 'sec_rules',     'name' => 'Record Rules',     'security_view' => 'security_rules',       'icon' => 'filter'],
                        ['id' => 'sec_groups',    'name' => 'Groups',           'security_view' => 'security_groups',      'icon' => 'users'],
                        ['id' => 'sec_users',     'name' => 'Users',            'security_view' => 'security_users',       'icon' => 'user'],
                        ['id' => 'sec_menu_editor', 'name' => 'Menu Items',     'security_view' => 'menu_editor',          'icon' => 'layout-list'],
                        ['id' => 'sec_view_builder','name' => 'View Builder',   'security_view' => 'view_builder',         'icon' => 'layout-template'],
                        ['id' => 'sec_actions',   'name' => 'Actions',          'model' => 'ir.action',                    'view' => 'list', 'icon' => 'zap'],
                        ['id' => 'sec_companies', 'name' => 'Companies',        'model' => 'res.company',         'view' => 'list', 'icon' => 'building'],
                        ['id' => 'sec_models',    'name' => 'Models Registry',  'model' => 'ir.model',            'view' => 'list', 'icon' => 'database'],
                        ['id' => 'sec_acl',       'name' => 'ACL (legacy)',     'model' => 'ir.model.access',     'view' => 'list', 'icon' => 'lock'],
                        ['id' => 'sec_irrule',    'name' => 'IR Rules (legacy)','model' => 'ir.rule',             'view' => 'list', 'icon' => 'shield'],
                    ],
                ];
            }
        }

        return response()->json($result);
    }

    /**
     * Build recursive menu tree array with group-based access filtering.
     */
    private function buildMenuTree($menus, bool $isAdmin = true, array $userGroupNames = [], array $userGroupIds = []): array
    {
        return $menus->filter(function ($menu) use ($isAdmin, $userGroupNames, $userGroupIds) {
            // Admin sees everything
            if ($isAdmin) return true;

            // No group restriction = visible to all
            if (empty($menu->groups) && empty($menu->group_ids)) return true;

            // Check group name match
            if (!empty($menu->groups)) {
                $menuGroups = array_map('trim', explode(',', $menu->groups));
                if (!empty(array_intersect($menuGroups, $userGroupNames))) return true;
            }

            // Check group ID match
            if (!empty($menu->group_ids)) {
                $menuGroupIds = array_map('intval', array_map('trim', explode(',', $menu->group_ids)));
                if (!empty(array_intersect($menuGroupIds, $userGroupIds))) return true;
            }

            return false;
        })->map(function ($menu) use ($isAdmin, $userGroupNames, $userGroupIds) {
            $item = [
                'id' => $menu->id,
                'name' => $menu->name,
                'sequence' => $menu->sequence,
                'icon' => $menu->icon,
                'web_icon' => $menu->web_icon,
                'web_icon_color' => $menu->web_icon_color,
                'action_id' => $menu->action_id,
                'model' => $menu->model,
                'view_type' => $menu->view_type,
                'security_view' => $menu->security_view,
            ];

            $action = $menu->action();
            if ($action) {
                $item['action'] = [
                    'id' => $action->id,
                    'name' => $action->name,
                    'type' => $action->type,
                    'res_model' => $action->res_model,
                    'view_mode' => $action->view_mode,
                    'domain' => $action->domain,
                    'context' => $action->context,
                    'target' => $action->target,
                    'limit' => $action->limit,
                    'help' => $action->help,
                ];
            }

            // Simple model binding (no action record)
            if (!$action && $menu->model) {
                $item['model'] = $menu->model;
                $item['view'] = $menu->view_type ?? 'list';
            }

            $children = $menu->children()->get();
            if ($children && $children->count() > 0) {
                $item['children'] = $this->buildMenuTree($children, $isAdmin, $userGroupNames, $userGroupIds);
            } else {
                $item['children'] = [];
            }

            return $item;
        })->values()->toArray();
    }

    /**
     * load_action – Load a single action and its view definitions.
     */
    public function loadAction(Request $request): JsonResponse
    {
        $actionId = $request->input('action_id');
        $action = \App\Models\Action::findOrFail($actionId);

        $modelDef = Registry::get($action->res_model);
        $viewModes = array_map('trim', explode(',', $action->view_mode));

        // Always include 'search' view, plus all modes from view_mode
        $allViewTypes = array_unique(array_merge(['search'], $viewModes, ['list', 'form', 'kanban', 'calendar', 'graph', 'pivot']));

        $views = [];
        foreach ($allViewTypes as $mode) {
            if ($modelDef) {
                // Use override-aware resolution (checks ir_ui_views first)
                $viewData = $this->resolveViewWithOverrides($action->res_model, $mode, $modelDef);
                if (!empty($viewData)) {
                    $views[$mode] = $viewData;
                }
            }
        }

        return response()->json([
            'action' => [
                'id' => $action->id,
                'name' => $action->name,
                'res_model' => $action->res_model,
                'view_mode' => $action->view_mode,
                'domain' => $action->domain ?? [],
                'context' => $action->context ?? [],
                'target' => $action->target,
                'limit' => $action->limit,
                'help' => $action->help,
            ],
            'views' => $views,
            'fields' => $modelDef ? $modelDef->fieldsGet() : [],
        ]);
    }

    /**
     * List all registered models with full metadata.
     */
    public function listModels(): JsonResponse
    {
        return response()->json(Registry::getModelInfoAll());
    }

    /**
     * default_get – Return default values for a new record.
     */
    public function defaultGet(Request $request): JsonResponse
    {
        $def = $this->resolveModel($request, 'read');
        $fieldNames = $request->input('fields', null);
        if (is_string($fieldNames)) {
            $fieldNames = array_filter(array_map('trim', explode(',', $fieldNames)));
        }
        return response()->json($def->defaultGet($fieldNames));
    }

    /**
     * model_info – Return full model introspection data.
     * Includes: meta-attributes, inheritance, security, decorators.
     */
    public function modelInfo(Request $request): JsonResponse
    {
        $def = $this->resolveModel($request, 'read');
        return response()->json($def->getModelInfo());
    }
}

