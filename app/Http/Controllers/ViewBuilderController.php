<?php

namespace App\Http\Controllers;

use App\Odoo\Registry;
use App\Odoo\Field;
use App\Core\Http\Request;
use App\Core\Http\JsonResponse;

/**
 * ViewBuilderController — API for the Odoo-style View Builder.
 *
 * Provides endpoints to:
 *  - Load model fields metadata for the builder palette
 *  - Load/save/preview view definitions (list, form, kanban, calendar, pivot)
 *  - Generate XML arch from builder config
 *  - Apply custom views to override model defaults
 */
class ViewBuilderController extends Controller
{
    /**
     * GET /api/view-builder/models
     * List all registered models for the model selector.
     */
    public function listModels()
    {
        $models = Registry::all();
        $result = [];
        foreach ($models as $name => $def) {
            $result[] = [
                'name'        => $name,
                'description' => $def->_description ?: $name,
                'table'       => $def->_table,
                'rec_name'    => $def->_rec_name,
            ];
        }
        usort($result, fn($a, $b) => strcmp($a['description'], $b['description']));
        return response()->json($result);
    }

    /**
     * POST /api/view-builder/fields
     * Load all field definitions for a model (for the field palette).
     */
    public function loadFields(Request $req)
    {
        $model = $req->input('model');
        $def = Registry::get($model);
        if (!$def) {
            return response()->json(['error' => "Model '{$model}' not found"], 404);
        }

        $fields = $def->fieldsGet();
        $enriched = [];
        foreach ($fields as $fname => $fmeta) {
            $field = $def->getField($fname);
            $enriched[$fname] = array_merge($fmeta, [
                'is_relational'  => $field ? $field->isRelational() : false,
                'is_numeric'     => $field ? $field->isNumeric() : false,
                'is_temporal'    => $field ? $field->isTemporal() : false,
                'is_string'      => $field ? $field->isString() : false,
                'default_widget' => $field ? $field->getDefaultWidget() : 'char',
            ]);
        }

        return response()->json([
            'model'       => $model,
            'description' => $def->_description,
            'rec_name'    => $def->_rec_name,
            'order'       => $def->_order,
            'fields'      => $enriched,
        ]);
    }

    /**
     * POST /api/view-builder/load-view
     * Load the current view definition for a model + view type.
     * First checks ir_ui_views for custom overrides, then falls back to code definition.
     * Returns builder-compatible arch format for editing.
     */
    public function loadView(Request $req)
    {
        $model = $req->input('model');
        $type  = $req->input('type', 'list');

        // Check for custom override in ir_ui_views
        \Adianti\Database\TTransaction::open('adiantisoft');
        $conn = \Adianti\Database\TTransaction::get();
        $stmt = $conn->prepare("SELECT * FROM ir_ui_views WHERE model = :m AND type = :t AND active = 1 ORDER BY priority ASC LIMIT 1");
        $stmt->execute([':m' => $model, ':t' => $type]);
        $custom = $stmt->fetch(\PDO::FETCH_OBJ);

        if ($custom) {
            return response()->json([
                'source'  => 'custom',
                'view_id' => $custom->id,
                'arch'    => json_decode($custom->arch, true),
            ]);
        }

        // Fall back to code definition — convert to builder-compatible format
        $def = Registry::get($model);
        if (!$def) {
            return response()->json(['arch' => [], 'source' => 'empty']);
        }

        // Get the raw view config arrays from the ModelDefinition
        $rawView = match ($type) {
            'list'     => $def->getListView(),
            'form'     => $def->getFormView(),
            'kanban'   => $def->getKanbanView(),
            'calendar' => $def->getCalendarView(),
            'pivot'    => $def->getPivotView(),
            'graph'    => $def->getGraphView(),
            'spreadsheet' => method_exists($def, 'getSpreadsheetView') ? $def->getSpreadsheetView() : [],
            default    => [],
        };

        // Convert raw view config into builder-editable arch
        $arch = $this->codeViewToBuilderArch($type, $rawView, $def);

        return response()->json([
            'source' => 'code',
            'arch'   => $arch,
        ]);
    }

    /**
     * Convert a code-defined view config array into builder-compatible arch format.
     * This bridges the gap between ModelDefinition's raw view arrays and what the
     * frontend View Builder component expects to render and edit.
     */
    private function codeViewToBuilderArch(string $type, array $raw, $def): array
    {
        return match ($type) {
            'list'     => $this->listViewToArch($raw, $def),
            'form'     => $this->formViewToArch($raw, $def),
            'kanban'   => $this->kanbanViewToArch($raw),
            'calendar' => $this->calendarViewToArch($raw),
            'pivot'    => $this->pivotViewToArch($raw),
            'spreadsheet' => $this->spreadsheetViewToArch($raw),
            default    => $raw,
        };
    }

    private function listViewToArch(array $raw, $def): array
    {
        // If the code view has explicit fields, use them; otherwise derive from field definitions
        $fields = $raw['fields'] ?? array_keys($def->getFields());

        // Build column_config from code view config
        $columnConfig = $raw['column_config'] ?? [];

        return [
            'fields'         => $fields,
            'column_config'  => $columnConfig,
            'editable'       => $raw['editable'] ?? '',
            'multi_edit'     => $raw['multi_edit'] ?? false,
            'limit'          => $raw['limit'] ?? 80,
            'decoration'     => $raw['decoration'] ?? [],
            'header_buttons' => $raw['header_buttons'] ?? [],
            'default_order'  => $raw['default_order'] ?? $def->_order,
            'string'         => $raw['string'] ?? $def->_description,
        ];
    }

    private function formViewToArch(array $raw, $def): array
    {
        // Convert code form groups to builder format, preserving field config
        $groups = [];
        foreach ($raw['groups'] ?? [] as $grp) {
            $builderGroup = [
                'string' => $grp['string'] ?? null,
                'col'    => $grp['col'] ?? null,
                'columns' => [],
            ];
            foreach ($grp['columns'] ?? [] as $colFields) {
                $column = [];
                foreach ($colFields as $f) {
                    if (is_string($f)) {
                        $column[] = $f;
                    } else {
                        // Preserve full field config (name, widget, attrs, options, etc.)
                        $column[] = $f;
                    }
                }
                $builderGroup['columns'][] = $column;
            }
            $groups[] = $builderGroup;
        }

        // Convert tabs — preserve ALL properties
        $tabs = [];
        foreach ($raw['tabs'] ?? [] as $tab) {
            $builderTab = [
                'name'     => $tab['name'] ?? $tab['label'] ?? '',
                'label'    => $tab['label'] ?? $tab['name'] ?? '',
                'type'     => $tab['type'] ?? 'field',
                'field'    => $tab['field'] ?? '',
            ];

            // One2many specific properties — preserve everything
            if (($builderTab['type'] ?? '') === 'one2many') {
                $builderTab['editable']           = $tab['editable'] ?? 'bottom';
                $builderTab['tree_fields']        = $tab['tree_fields'] ?? [];
                $builderTab['tree_column_config']  = $tab['tree_column_config'] ?? [];
                $builderTab['sum_field']           = $tab['sum_field'] ?? '';
                $builderTab['sum_label']           = $tab['sum_label'] ?? '';
                $builderTab['default_group_by']    = $tab['default_group_by'] ?? '';
                $builderTab['group_limit']         = $tab['group_limit'] ?? null;
                $builderTab['column_invisible']    = $tab['column_invisible'] ?? [];
                $builderTab['tree_field_attrs']    = $tab['tree_field_attrs'] ?? [];
            }

            // Layout tab groups
            if (!empty($tab['groups'])) {
                $builderTab['groups'] = $tab['groups'];
            }

            $tabs[] = $builderTab;
        }

        return [
            'string'              => $raw['string'] ?? $def->_description,
            'groups'              => $groups,
            'tabs'                => $tabs,
            'statusbar'           => $raw['statusbar'] ?? '',
            'statusbar_clickable' => $raw['statusbar_clickable'] ?? true,
            'header_buttons'      => $raw['header_buttons'] ?? [],
            'stat_buttons'        => $raw['stat_buttons'] ?? [],
            'title'               => $raw['title'] ?? '',
            'priority'            => $raw['priority'] ?? '',
            'chatter'             => $raw['chatter'] ?? false,
        ];
    }

    private function kanbanViewToArch(array $raw): array
    {
        return [
            'default_group_by' => $raw['default_group_by'] ?? '',
            'quick_create'     => $raw['quick_create'] ?? true,
            'card_title'       => $raw['card_title'] ?? 'name',
            'card_fields'      => $raw['card_fields'] ?? [],
            'card_tags'        => $raw['card_tags'] ?? '',
            'card_footer'      => $raw['card_footer'] ?? [],
            'card_image'       => $raw['card_image'] ?? '',
            'color_field'      => $raw['color_field'] ?? '',
            'decoration'       => $raw['decoration'] ?? [],
            'aggregates'       => $raw['aggregates'] ?? [],
            'fold_field'       => $raw['fold_field'] ?? '',
        ];
    }

    private function calendarViewToArch(array $raw): array
    {
        return [
            'date_start'           => $raw['date_start'] ?? '',
            'date_stop'            => $raw['date_stop'] ?? '',
            'color'                => $raw['color'] ?? '',
            'mode'                 => $raw['mode'] ?? 'month',
            'event_display_fields' => $raw['event_display_fields'] ?? [],
            'quick_create'         => $raw['quick_create'] ?? true,
            'create_name_field'    => $raw['create_name_field'] ?? '',
            'date_delay'           => $raw['date_delay'] ?? '',
            'color_legend'         => $raw['color_legend'] ?? true,
        ];
    }

    private function pivotViewToArch(array $raw): array
    {
        return [
            'row_groupby' => $raw['row_groupby'] ?? [],
            'col_groupby' => $raw['col_groupby'] ?? [],
            'measures'    => $raw['measures'] ?? [],
        ];
    }

    private function spreadsheetViewToArch(array $raw): array
    {
        return [
            'fields'        => $raw['fields'] ?? [],
            'column_width'  => $raw['column_width'] ?? 120,
            'row_height'    => $raw['row_height'] ?? 28,
            'limit'         => $raw['limit'] ?? 1000,
            'aggregation'   => $raw['aggregation'] ?? 'sum',
            'readonly'      => $raw['readonly'] ?? false,
        ];
    }

    /**
     * POST /api/view-builder/save-view
     * Save a custom view definition (upsert into ir_ui_views).
     */
    public function saveView(Request $req)
    {
        $model = $req->input('model');
        $type  = $req->input('type');
        $arch  = $req->input('arch', []);
        $name  = $req->input('name', "{$model}.{$type}.custom");

        \Adianti\Database\TTransaction::open('adiantisoft');
        $conn = \Adianti\Database\TTransaction::get();
        $stmt = $conn->prepare("SELECT id FROM ir_ui_views WHERE model = :m AND type = :t AND active = 1 LIMIT 1");
        $stmt->execute([':m' => $model, ':t' => $type]);
        $existing = $stmt->fetch(\PDO::FETCH_ASSOC);

        $now = date('Y-m-d H:i:s');
        if ($existing) {
            $stmtU = $conn->prepare("UPDATE ir_ui_views SET arch = :arch, updated_at = :updated_at WHERE id = :id");
            $stmtU->execute([
                ':id'         => $existing['id'],
                ':arch'       => json_encode($arch),
                ':updated_at' => $now,
            ]);
            $viewId = $existing['id'];
        } else {
            $stmtI = $conn->prepare("INSERT INTO ir_ui_views (name, model, type, arch, priority, active, created_at, updated_at) VALUES (:name, :model, :type, :arch, 16, 1, :created_at, :updated_at)");
            $stmtI->execute([
                ':name'       => $name,
                ':model'      => $model,
                ':type'       => $type,
                ':arch'       => json_encode($arch),
                ':created_at' => $now,
                ':updated_at' => $now,
            ]);
            $viewId = (int)$conn->lastInsertId();
        }

        return response()->json(['success' => true, 'view_id' => $viewId]);
    }

    /**
     * POST /api/view-builder/preview-xml
     * Generate Odoo-style XML arch string from a builder config.
     */
    public function previewXml(Request $req)
    {
        $type = $req->input('type', 'list');
        $arch = $req->input('arch', []);

        $xml = match ($type) {
            'list'     => $this->generateListXml($arch),
            'form'     => $this->generateFormXml($arch),
            'kanban'   => $this->generateKanbanXml($arch),
            'calendar' => $this->generateCalendarXml($arch),
            'pivot'    => $this->generatePivotXml($arch),
            'spreadsheet' => '<spreadsheet/>',
            default    => '<view/>',
        };

        return response()->json(['xml' => $xml]);
    }

    /**
     * DELETE /api/view-builder/delete-view/{id}
     * Remove a custom view override.
     */
    public function deleteView($id)
    {
        \Adianti\Database\TTransaction::open('adiantisoft');
        $conn = \Adianti\Database\TTransaction::get();
        $stmt = $conn->prepare("DELETE FROM ir_ui_views WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return response()->json(['success' => true]);
    }

    /**
     * GET /api/view-builder/custom-views
     * List all custom view overrides.
     */
    public function listCustomViews()
    {
        \Adianti\Database\TTransaction::open('adiantisoft');
        $conn = \Adianti\Database\TTransaction::get();
        $stmt = $conn->query("SELECT * FROM ir_ui_views WHERE active = 1 ORDER BY model ASC, type ASC");
        $views = $stmt->fetchAll(\PDO::FETCH_OBJ) ?: [];

        return response()->json($views);
    }

    // ══════════════════════════════════════════════════════
    //  XML Generation Helpers
    // ══════════════════════════════════════════════════════

    private function generateListXml(array $arch): string
    {
        $attrs = '';
        if (!empty($arch['string']))        $attrs .= ' string="' . e($arch['string']) . '"';
        if (!empty($arch['editable']))       $attrs .= ' editable="' . e($arch['editable']) . '"';
        if (!empty($arch['multi_edit']))     $attrs .= ' multi_edit="1"';
        if (!empty($arch['default_order']))  $attrs .= ' default_order="' . e($arch['default_order']) . '"';
        if (!empty($arch['limit']))          $attrs .= ' limit="' . (int)$arch['limit'] . '"';

        // Decoration rules
        foreach ($arch['decoration'] ?? [] as $key => $expr) {
            if ($expr) $attrs .= " {$key}=\"{$expr}\"";
        }

        $xml = "<tree{$attrs}>\n";

        // Header buttons
        foreach ($arch['header_buttons'] ?? [] as $btn) {
            $xml .= "    <header>\n";
            $xml .= '        <button name="' . e($btn['name'] ?? '') . '"';
            $xml .= ' type="' . e($btn['type'] ?? 'object') . '"';
            $xml .= ' string="' . e($btn['string'] ?? '') . '"';
            if (!empty($btn['class'])) $xml .= ' class="' . e($btn['class']) . '"';
            $xml .= "/>\n";
            $xml .= "    </header>\n";
        }

        // Fields
        foreach ($arch['fields'] ?? [] as $fieldName) {
            $cc = $arch['column_config'][$fieldName] ?? [];
            $fAttrs = ' name="' . e($fieldName) . '"';
            if (!empty($cc['widget']))   $fAttrs .= ' widget="' . e($cc['widget']) . '"';
            if (!empty($cc['optional'])) $fAttrs .= ' optional="' . e($cc['optional']) . '"';
            if (!empty($cc['sum']))      $fAttrs .= ' sum="' . e($cc['sum']) . '"';
            if (!empty($cc['avg']))      $fAttrs .= ' avg="' . e($cc['avg']) . '"';
            if (!empty($cc['width']))    $fAttrs .= ' width="' . e($cc['width']) . '"';
            $xml .= "    <field{$fAttrs}/>\n";
        }

        $xml .= "</tree>";
        return $xml;
    }

    private function generateFormXml(array $arch): string
    {
        $xml = '<form string="' . e($arch['string'] ?? '') . "\">\n";

        // Header
        if (!empty($arch['statusbar']) || !empty($arch['header_buttons'])) {
            $xml .= "    <header>\n";
            foreach ($arch['header_buttons'] ?? [] as $btn) {
                $xml .= '        <button name="' . e($btn['name'] ?? '') . '"';
                $xml .= ' string="' . e($btn['string'] ?? '') . '"';
                $xml .= ' type="' . e($btn['type'] ?? 'object') . '"';
                if (!empty($btn['class'])) $xml .= ' class="' . e($btn['class']) . '"';
                $xml .= "/>\n";
            }
            if (!empty($arch['statusbar'])) {
                $xml .= '        <field name="' . e($arch['statusbar']) . '" widget="statusbar"';
                if (!empty($arch['statusbar_clickable'])) $xml .= ' clickable="1"';
                $xml .= "/>\n";
            }
            $xml .= "    </header>\n";
        }

        $xml .= "    <sheet>\n";

        // Stat buttons
        if (!empty($arch['stat_buttons'])) {
            $xml .= '        <div class="oe_button_box" name="button_box">' . "\n";
            foreach ($arch['stat_buttons'] as $sb) {
                $xml .= '            <button name="' . e($sb['name'] ?? '') . '" type="object"'
                      . ' class="oe_stat_button" icon="fa-bar-chart"/>' . "\n";
            }
            $xml .= "        </div>\n";
        }

        // Title
        if (!empty($arch['title'])) {
            $xml .= '        <div class="oe_title">' . "\n";
            $xml .= '            <field name="' . e($arch['title']) . '"/>' . "\n";
            $xml .= "        </div>\n";
        }

        // Groups
        foreach ($arch['groups'] ?? [] as $group) {
            $xml .= $this->generateGroupXml($group, $arch, '        ');
        }

        // Notebook/Tabs
        if (!empty($arch['tabs'])) {
            $xml .= "        <notebook>\n";
            foreach ($arch['tabs'] as $tab) {
                $xml .= '            <page string="' . e($tab['label'] ?? '') . "\">\n";

                // New format: groups within tabs (from Form Builder)
                if (!empty($tab['groups'])) {
                    foreach ($tab['groups'] as $group) {
                        $xml .= $this->generateGroupXml($group, $arch, '                ');
                    }
                }
                // Legacy format: single field reference
                elseif (!empty($tab['type']) && $tab['type'] === 'field' && !empty($tab['field'])) {
                    $xml .= '                <field name="' . e($tab['field']) . "\"/>\n";
                }
                // Legacy format: one2many with inline tree
                elseif (!empty($tab['type']) && $tab['type'] === 'one2many' && !empty($tab['field'])) {
                    $xml .= '                <field name="' . e($tab['field']) . "\">\n";
                    $xml .= "                    <tree editable=\"" . e($tab['editable'] ?? 'bottom') . "\">\n";
                    foreach ($tab['tree_fields'] ?? [] as $tf) {
                        $xml .= "                        <field name=\"{$tf}\"/>\n";
                    }
                    $xml .= "                    </tree>\n";
                    $xml .= "                </field>\n";
                }

                $xml .= "            </page>\n";
            }
            $xml .= "        </notebook>\n";
        }

        $xml .= "    </sheet>\n";

        // Chatter
        if (!empty($arch['chatter'])) {
            $xml .= "    <div class=\"oe_chatter\">\n";
            $xml .= "        <field name=\"message_ids\"/>\n";
            $xml .= "        <field name=\"activity_ids\"/>\n";
            $xml .= "    </div>\n";
        }

        $xml .= "</form>";
        return $xml;
    }

    /**
     * Generate XML for a single group element (shared by main groups and tab groups).
     */
    private function generateGroupXml(array $group, array $arch, string $indent): string
    {
        $gAttrs = '';
        if (!empty($group['string'])) $gAttrs .= ' string="' . e($group['string']) . '"';
        $xml = "{$indent}<group{$gAttrs}>\n";
        foreach ($group['columns'] ?? [] as $col) {
            $xml .= "{$indent}    <group>\n";
            foreach ($col as $f) {
                $fn = is_string($f) ? $f : ($f['name'] ?? '');
                if (empty($fn)) continue;

                // Handle separator fields
                if (str_starts_with($fn, 'separator_')) {
                    $xml .= "{$indent}        <separator/>\n";
                    continue;
                }

                // Build field attributes from field_config
                $fA = ' name="' . e($fn) . '"';
                $fc = $arch['field_config'][$fn] ?? [];
                if (is_array($f) && !empty($f['widget'])) $fc['widget'] = $f['widget'];

                if (!empty($fc['widget']))      $fA .= ' widget="' . e($fc['widget']) . '"';
                if (!empty($fc['placeholder'])) $fA .= ' placeholder="' . e($fc['placeholder']) . '"';
                if (!empty($fc['required']))    $fA .= ' required="1"';
                if (!empty($fc['readonly']))    $fA .= ' readonly="1"';
                if (!empty($fc['invisible']))   $fA .= ' invisible="1"';
                if (!empty($fc['nolabel']))     $fA .= ' nolabel="1"';

                $xml .= "{$indent}        <field{$fA}/>\n";
            }
            $xml .= "{$indent}    </group>\n";
        }
        $xml .= "{$indent}</group>\n";
        return $xml;
    }

    private function generateKanbanXml(array $arch): string
    {
        $attrs = '';
        if (!empty($arch['default_group_by'])) $attrs .= ' default_group_by="' . e($arch['default_group_by']) . '"';
        if (isset($arch['quick_create'])) $attrs .= ' quick_create="' . ($arch['quick_create'] ? '1' : '0') . '"';
        if (!empty($arch['card_image'])) $attrs .= ' image="' . e($arch['card_image']) . '"';
        if (!empty($arch['color_field'])) $attrs .= ' color="' . e($arch['color_field']) . '"';
        if (!empty($arch['fold_field'])) $attrs .= ' fold="' . e($arch['fold_field']) . '"';

        $xml = "<kanban{$attrs}>\n";
        $xml .= "    <templates>\n";
        $xml .= "        <t t-name=\"kanban-box\">\n";
        $xml .= "            <div class=\"oe_kanban_card\">\n";

        if (!empty($arch['card_title'])) {
            $xml .= "                <div class=\"oe_kanban_title\">\n";
            $xml .= '                    <field name="' . e($arch['card_title']) . "\"/>\n";
            $xml .= "                </div>\n";
        }

        foreach ($arch['card_fields'] ?? [] as $cf) {
            $xml .= '                <field name="' . e($cf) . "\"/>\n";
        }

        if (!empty($arch['card_tags'])) {
            $xml .= '                <field name="' . e($arch['card_tags']) . "\" widget=\"many2many_tags\"/>\n";
        }

        foreach ($arch['card_footer'] ?? [] as $cff) {
            $xml .= '                <field name="' . e($cff) . "\" widget=\"kanban_footer\"/>\n";
        }

        $xml .= "            </div>\n";
        $xml .= "        </t>\n";
        $xml .= "    </templates>\n";
        $xml .= "</kanban>";
        return $xml;
    }

    private function generateCalendarXml(array $arch): string
    {
        $attrs = '';
        if (!empty($arch['date_start'])) $attrs .= ' date_start="' . e($arch['date_start']) . '"';
        if (!empty($arch['date_stop']))  $attrs .= ' date_stop="' . e($arch['date_stop']) . '"';
        if (!empty($arch['color']))      $attrs .= ' color="' . e($arch['color']) . '"';
        if (!empty($arch['mode']))       $attrs .= ' mode="' . e($arch['mode']) . '"';
        if (!empty($arch['date_delay'])) $attrs .= ' date_delay="' . e($arch['date_delay']) . '"';
        if (isset($arch['quick_create'])) $attrs .= ' quick_create="' . ($arch['quick_create'] ? '1' : '0') . '"';
        if (!empty($arch['create_name_field'])) $attrs .= ' create_name_field="' . e($arch['create_name_field']) . '"';

        $xml = "<calendar{$attrs}>\n";
        foreach ($arch['event_display_fields'] ?? [] as $ef) {
            $xml .= '    <field name="' . e($ef) . "\"/>\n";
        }
        $xml .= "</calendar>";
        return $xml;
    }

    private function generatePivotXml(array $arch): string
    {
        $xml = "<pivot>\n";

        foreach ($arch['row_groupby'] ?? [] as $rg) {
            $xml .= '    <field name="' . e($rg) . "\" type=\"row\"/>\n";
        }
        foreach ($arch['col_groupby'] ?? [] as $cg) {
            $xml .= '    <field name="' . e($cg) . "\" type=\"col\"/>\n";
        }
        foreach ($arch['measures'] ?? [] as $m) {
            $xml .= '    <field name="' . e($m) . "\" type=\"measure\"/>\n";
        }

        $xml .= "</pivot>";
        return $xml;
    }

    private function generateSpreadsheetXml(array $arch): string
    {
        $attrs = '';
        if (isset($arch['column_width'])) $attrs .= ' column_width="' . e($arch['column_width']) . '"';
        if (isset($arch['row_height'])) $attrs .= ' row_height="' . e($arch['row_height']) . '"';
        if (isset($arch['limit'])) $attrs .= ' limit="' . e($arch['limit']) . '"';
        if (!empty($arch['aggregation'])) $attrs .= ' aggregation="' . e($arch['aggregation']) . '"';
        if (isset($arch['readonly'])) $attrs .= ' readonly="' . ($arch['readonly'] ? '1' : '0') . '"';

        $xml = "<spreadsheet{$attrs}>\n";
        foreach ($arch['fields'] ?? [] as $f) {
            $xml .= '    <field name="' . e($f) . "\"/>\n";
        }
        $xml .= "</spreadsheet>";
        return $xml;
    }

    // ══════════════════════════════════════════════════════
    //  Export to Code — generate PHP array for ModelDefinition
    // ══════════════════════════════════════════════════════

    /**
     * POST /api/view-builder/export-code
     * Generate PHP array code that can be pasted into a ModelDefinition file.
     */
    public function exportCode(Request $req)
    {
        $type = $req->input('type', 'list');
        $arch = $req->input('arch', []);
        $model = $req->input('model', 'model');

        $varName = match ($type) {
            'list'       => 'listView',
            'form'       => 'formView',
            'kanban'     => 'kanbanView',
            'calendar'   => 'calendarView',
            'pivot'      => 'pivotView',
            'graph'      => 'graphView',
            'spreadsheet'=> 'spreadsheetView',
            default      => "{$type}View",
        };

        $code = match ($type) {
            'list'       => $this->exportListCode($arch),
            'form'       => $this->exportFormCode($arch),
            'kanban'     => $this->exportKanbanCode($arch),
            'calendar'   => $this->exportCalendarCode($arch),
            'pivot'      => $this->exportPivotCode($arch),
            'spreadsheet'=> $this->exportSpreadsheetCode($arch),
            default      => var_export($arch, true),
        };

        $php = "// Paste this into your ModelDefinition's __construct() method\n";
        $php .= "\$this->{$varName} = {$code};\n";

        return response()->json(['code' => $php]);
    }

    private function exportListCode(array $a): string
    {
        $lines = ["["];
        if (!empty($a['string'])) $lines[] = "    'string' => " . $this->phpVal($a['string']) . ",";
        if (!empty($a['editable'])) $lines[] = "    'editable' => " . $this->phpVal($a['editable']) . ",";
        if (!empty($a['multi_edit'])) $lines[] = "    'multi_edit' => true,";
        if (!empty($a['limit']) && $a['limit'] != 80) $lines[] = "    'limit' => {$a['limit']},";
        if (!empty($a['default_order'])) $lines[] = "    'default_order' => " . $this->phpVal($a['default_order']) . ",";

        // Fields
        if (!empty($a['fields'])) {
            $lines[] = "    'fields' => [";
            $cc = $a['column_config'] ?? [];
            foreach ($a['fields'] as $f) {
                $cfg = $cc[$f] ?? [];
                $hasConfig = array_filter($cfg);
                if ($hasConfig) {
                    $parts = ["'name' => " . $this->phpVal($f)];
                    foreach (['widget', 'optional', 'sum', 'avg', 'width'] as $k) {
                        if (!empty($cfg[$k])) $parts[] = "'$k' => " . $this->phpVal($cfg[$k]);
                    }
                    $lines[] = "        [" . implode(', ', $parts) . "],";
                } else {
                    $lines[] = "        " . $this->phpVal($f) . ",";
                }
            }
            $lines[] = "    ],";
        }

        // Decoration
        if (!empty($a['decoration'])) {
            $lines[] = "    'decoration' => [";
            foreach ($a['decoration'] as $k => $v) {
                if ($v) $lines[] = "        '$k' => " . $this->phpVal($v) . ",";
            }
            $lines[] = "    ],";
        }

        // Header buttons
        if (!empty($a['header_buttons'])) {
            $lines[] = "    'header_buttons' => " . $this->phpArrayShort($a['header_buttons'], 2) . ",";
        }

        $lines[] = "]";
        return implode("\n", $lines);
    }

    private function exportFormCode(array $a): string
    {
        $lines = ["["];
        if (!empty($a['string'])) $lines[] = "    'string' => " . $this->phpVal($a['string']) . ",";

        // Statusbar
        if (!empty($a['statusbar'])) {
            $lines[] = "    'statusbar' => " . $this->phpVal($a['statusbar']) . ",";
            if (isset($a['statusbar_clickable'])) $lines[] = "    'statusbar_clickable' => " . ($a['statusbar_clickable'] ? 'true' : 'false') . ",";
        }

        // Header buttons (with invisible, confirm, icon support)
        if (!empty($a['header_buttons'])) {
            $lines[] = "    'header_buttons' => [";
            foreach ($a['header_buttons'] as $btn) {
                $lines[] = "        [";
                foreach (['name', 'type', 'string', 'class', 'icon', 'invisible', 'confirm'] as $bk) {
                    if (!empty($btn[$bk])) $lines[] = "            '$bk' => " . $this->phpVal($btn[$bk]) . ",";
                }
                $lines[] = "        ],";
            }
            $lines[] = "    ],";
        }

        // Stat buttons (with icon, field, type)
        if (!empty($a['stat_buttons'])) {
            $lines[] = "    'stat_buttons' => [";
            foreach ($a['stat_buttons'] as $sb) {
                $lines[] = "        [";
                foreach (['name', 'type', 'string', 'icon', 'field'] as $sk) {
                    if (!empty($sb[$sk])) $lines[] = "            '$sk' => " . $this->phpVal($sb[$sk]) . ",";
                }
                $lines[] = "        ],";
            }
            $lines[] = "    ],";
        }

        // Title + Priority
        if (!empty($a['title'])) $lines[] = "    'title' => " . $this->phpVal($a['title']) . ",";
        if (!empty($a['priority'])) $lines[] = "    'priority' => " . $this->phpVal($a['priority']) . ",";

        // Groups (with attrs, options, widget per field)
        if (!empty($a['groups'])) {
            $fc = $a['field_config'] ?? [];
            $lines[] = "    'groups' => [";
            foreach ($a['groups'] as $grp) {
                $lines[] = "        [";
                if (!empty($grp['string'])) $lines[] = "            'string' => " . $this->phpVal($grp['string']) . ",";
                $colCount = count($grp['columns'] ?? []);
                $lines[] = "            'col' => {$colCount},";
                $lines[] = "            'columns' => [";
                foreach ($grp['columns'] ?? [] as $col) {
                    $lines[] = "                [";
                    foreach ($col as $f) {
                        if (is_string($f)) {
                            // Check field_config for overrides
                            $fieldFc = $fc[$f] ?? [];
                            if (!empty($fieldFc)) {
                                $lines[] = $this->exportFieldArray($f, $fieldFc, '                    ');
                            } else {
                                $lines[] = "                    " . $this->phpVal($f) . ",";
                            }
                        } else {
                            // Already an array — export with all properties
                            $fname = $f['name'] ?? '';
                            if (empty($fname)) continue;
                            // Merge field_config overrides
                            $merged = $f;
                            if (!empty($fc[$fname])) {
                                $merged = array_merge($f, array_filter($fc[$fname]));
                            }
                            $lines[] = $this->exportFieldArray($fname, $merged, '                    ');
                        }
                    }
                    $lines[] = "                ],";
                }
                $lines[] = "            ],";
                $lines[] = "        ],";
            }
            $lines[] = "    ],";
        }

        // Tabs
        if (!empty($a['tabs'])) {
            $lines[] = "    'tabs' => [";
            foreach ($a['tabs'] as $tab) {
                $lines[] = "        [";
                foreach (['name', 'label'] as $tk) {
                    if (!empty($tab[$tk])) $lines[] = "            '$tk' => " . $this->phpVal($tab[$tk]) . ",";
                }
                $ttype = $tab['type'] ?? 'field';
                $lines[] = "            'type' => " . $this->phpVal($ttype) . ",";
                if (!empty($tab['field'])) $lines[] = "            'field' => " . $this->phpVal($tab['field']) . ",";

                // One2many specifics
                if ($ttype === 'one2many') {
                    if (!empty($tab['editable'])) $lines[] = "            'editable' => " . $this->phpVal($tab['editable']) . ",";
                    if (!empty($tab['tree_fields'])) {
                        $tf = array_map(fn($t) => $this->phpVal($t), $tab['tree_fields']);
                        $lines[] = "            'tree_fields' => [" . implode(', ', $tf) . "],";
                    }
                    // tree_column_config
                    if (!empty($tab['tree_column_config'])) {
                        $lines[] = "            'tree_column_config' => [";
                        foreach ($tab['tree_column_config'] as $tcfName => $tcfVal) {
                            $lines[] = "                " . $this->phpVal($tcfName) . " => [";
                            foreach ($tcfVal as $ck => $cv) {
                                if ($ck === 'options' && is_array($cv)) {
                                    $lines[] = "                    'options' => [";
                                    foreach ($cv as $ok => $ov) {
                                        $lines[] = "                        " . $this->phpVal($ok) . " => " . $this->phpVal($ov) . ",";
                                    }
                                    $lines[] = "                    ],";
                                } else {
                                    $lines[] = "                    " . $this->phpVal($ck) . " => " . $this->phpVal($cv) . ",";
                                }
                            }
                            $lines[] = "                ],";
                        }
                        $lines[] = "            ],";
                    }
                    // sum_field, sum_label
                    if (!empty($tab['sum_field'])) $lines[] = "            'sum_field' => " . $this->phpVal($tab['sum_field']) . ",";
                    if (!empty($tab['sum_label'])) $lines[] = "            'sum_label' => " . $this->phpVal($tab['sum_label']) . ",";
                    // default_group_by, group_limit
                    if (!empty($tab['default_group_by'])) $lines[] = "            'default_group_by' => " . $this->phpVal($tab['default_group_by']) . ",";
                    if (!empty($tab['group_limit'])) $lines[] = "            'group_limit' => " . (int)$tab['group_limit'] . ",";
                    // column_invisible
                    if (!empty($tab['column_invisible'])) {
                        $lines[] = "            'column_invisible' => " . $this->phpExportDeep($tab['column_invisible'], 3) . ",";
                    }
                    // tree_field_attrs
                    if (!empty($tab['tree_field_attrs'])) {
                        $lines[] = "            'tree_field_attrs' => [";
                        foreach ($tab['tree_field_attrs'] as $tfaName => $tfaVal) {
                            $attrParts = [];
                            foreach ($tfaVal as $ak => $av) {
                                $attrParts[] = "'$ak' => " . $this->phpVal($av);
                            }
                            $lines[] = "                " . $this->phpVal($tfaName) . " => [" . implode(', ', $attrParts) . "],";
                        }
                        $lines[] = "            ],";
                    }
                }

                // Layout tab groups
                if (!empty($tab['groups'])) {
                    $lines[] = "            'groups' => [";
                    foreach ($tab['groups'] as $tgrp) {
                        $lines[] = "                [";
                        if (!empty($tgrp['string'])) $lines[] = "                    'string' => " . $this->phpVal($tgrp['string']) . ",";
                        $lines[] = "                    'columns' => [";
                        foreach ($tgrp['columns'] ?? [] as $tcol) {
                            $tf = array_map(fn($t) => $this->phpVal(is_string($t) ? $t : ($t['name'] ?? '')), $tcol);
                            $lines[] = "                        [" . implode(', ', $tf) . "],";
                        }
                        $lines[] = "                    ],";
                        $lines[] = "                ],";
                    }
                    $lines[] = "            ],";
                }

                $lines[] = "        ],";
            }
            $lines[] = "    ],";
        }

        // Chatter (supports both bool and array)
        if (!empty($a['chatter'])) {
            if (is_array($a['chatter'])) {
                $lines[] = "    'chatter' => [";
                foreach ($a['chatter'] as $ck => $cv) {
                    $lines[] = "        '$ck' => " . $this->phpVal($cv) . ",";
                }
                $lines[] = "    ],";
            } else {
                $lines[] = "    'chatter' => true,";
            }
        }

        $lines[] = "]";
        return implode("\n", $lines);
    }

    /**
     * Export a single field as PHP array (when it has widget/attrs/options).
     * Returns plain string if no config, or ['name' => ..., 'widget' => ..., 'attrs' => [...]] format.
     */
    private function exportFieldArray(string $fname, array $config, string $indent): string
    {
        // Filter out 'name' key since we handle it separately
        $extras = array_filter($config, fn($v, $k) => $k !== 'name' && $v !== null && $v !== '' && $v !== false, ARRAY_FILTER_USE_BOTH);
        if (empty($extras)) {
            return "{$indent}" . $this->phpVal($fname) . ",";
        }

        $parts = ["'name' => " . $this->phpVal($fname)];

        // Simple scalar properties
        foreach (['widget', 'placeholder', 'string', 'label', 'nolabel', 'readonly', 'required', 'invisible', 'colspan'] as $k) {
            if (isset($extras[$k]) && $extras[$k] !== false && $extras[$k] !== '') {
                $parts[] = "'$k' => " . $this->phpVal($extras[$k]);
            }
        }

        // attrs: associative array of domain expressions
        if (!empty($extras['attrs']) && is_array($extras['attrs'])) {
            $attrParts = [];
            foreach ($extras['attrs'] as $ak => $av) {
                $attrParts[] = "'$ak' => " . $this->phpVal($av);
            }
            $parts[] = "'attrs' => [" . implode(', ', $attrParts) . "]";
        }

        // options: associative array
        if (!empty($extras['options']) && is_array($extras['options'])) {
            $optParts = [];
            foreach ($extras['options'] as $ok => $ov) {
                $optParts[] = "'$ok' => " . $this->phpVal($ov);
            }
            $parts[] = "'options' => [" . implode(', ', $optParts) . "]";
        }

        return "{$indent}[" . implode(', ', $parts) . "],";
    }

    private function exportKanbanCode(array $a): string
    {
        $lines = ["["];
        foreach (['default_group_by', 'card_title', 'card_tags', 'card_image', 'color_field', 'fold_field'] as $k) {
            if (!empty($a[$k])) $lines[] = "    '$k' => " . $this->phpVal($a[$k]) . ",";
        }
        if (isset($a['quick_create'])) $lines[] = "    'quick_create' => " . ($a['quick_create'] ? 'true' : 'false') . ",";
        if (!empty($a['card_fields'])) {
            $cf = array_map(fn($f) => $this->phpVal($f), $a['card_fields']);
            $lines[] = "    'card_fields' => [" . implode(', ', $cf) . "],";
        }
        if (!empty($a['card_footer'])) {
            $cff = array_map(fn($f) => $this->phpVal($f), $a['card_footer']);
            $lines[] = "    'card_footer' => [" . implode(', ', $cff) . "],";
        }
        if (!empty($a['decoration'])) {
            $lines[] = "    'decoration' => [";
            foreach ($a['decoration'] as $dk => $dv) {
                $lines[] = "        '" . addcslashes($dk, "'\\") . "' => " . $this->phpVal($dv) . ",";
            }
            $lines[] = "    ],";
        }
        if (!empty($a['aggregates'])) {
            $lines[] = "    'aggregates' => [";
            foreach ($a['aggregates'] as $ak => $av) {
                $lines[] = "        '" . addcslashes($ak, "'\\") . "' => " . $this->phpVal($av) . ",";
            }
            $lines[] = "    ],";
        }
        $lines[] = "]";
        return implode("\n", $lines);
    }

    private function exportCalendarCode(array $a): string
    {
        $lines = ["["];
        foreach (['date_start', 'date_stop', 'color', 'mode', 'create_name_field', 'date_delay'] as $k) {
            if (!empty($a[$k])) $lines[] = "    '$k' => " . $this->phpVal($a[$k]) . ",";
        }
        if (isset($a['quick_create'])) $lines[] = "    'quick_create' => " . ($a['quick_create'] ? 'true' : 'false') . ",";
        if (isset($a['color_legend'])) $lines[] = "    'color_legend' => " . ($a['color_legend'] ? 'true' : 'false') . ",";
        if (isset($a['all_day'])) $lines[] = "    'all_day' => " . ($a['all_day'] ? 'true' : 'false') . ",";
        if (!empty($a['event_display_fields'])) {
            $ef = array_map(fn($f) => $this->phpVal($f), $a['event_display_fields']);
            $lines[] = "    'event_display_fields' => [" . implode(', ', $ef) . "],";
        }
        $lines[] = "]";
        return implode("\n", $lines);
    }

    private function exportPivotCode(array $a): string
    {
        $lines = ["["];
        foreach (['row_groupby', 'col_groupby', 'measures'] as $k) {
            if (!empty($a[$k])) {
                $items = array_map(fn($v) => $this->phpVal($v), $a[$k]);
                $lines[] = "    '$k' => [" . implode(', ', $items) . "],";
            }
        }
        $lines[] = "]";
        return implode("\n", $lines);
    }

    private function exportSpreadsheetCode(array $a): string
    {
        $lines = ["["];
        if (!empty($a['fields'])) {
            $items = array_map(fn($v) => $this->phpVal($v), $a['fields']);
            $lines[] = "    'fields' => [" . implode(', ', $items) . "],";
        }
        foreach (['column_width', 'row_height', 'limit'] as $k) {
            if (isset($a[$k]) && $a[$k] !== '') $lines[] = "    '$k' => {$a[$k]},";
        }
        if (!empty($a['aggregation']) && $a['aggregation'] !== 'sum') {
            $lines[] = "    'aggregation' => " . $this->phpVal($a['aggregation']) . ",";
        }
        if (isset($a['readonly']) && $a['readonly']) {
            $lines[] = "    'readonly' => true,";
        }
        $lines[] = "]";
        return implode("\n", $lines);
    }

    /** Quote a scalar PHP value. */
    private function phpVal($v): string
    {
        if (is_bool($v)) return $v ? 'true' : 'false';
        if (is_int($v) || is_float($v)) return (string)$v;
        return "'" . addcslashes((string)$v, "'\\") . "'";
    }

    /** Export a simple array of assoc arrays in short syntax. */
    private function phpArrayShort(array $arr, int $depth): string
    {
        $indent = str_repeat('    ', $depth);
        $inner = str_repeat('    ', $depth + 1);
        $lines = ["["];
        foreach ($arr as $item) {
            if (is_array($item)) {
                $parts = [];
                foreach ($item as $k => $v) {
                    if ($v === null || $v === '' || $v === false) continue;
                    $parts[] = "'$k' => " . $this->phpVal($v);
                }
                $lines[] = "{$inner}[" . implode(', ', $parts) . "],";
            }
        }
        $lines[] = "{$indent}]";
        return implode("\n", $lines);
    }

    /** Recursively export a PHP array/value (for nested structures). */
    private function phpExportDeep($val, int $depth = 0): string
    {
        if (!is_array($val)) return $this->phpVal($val);
        if (empty($val)) return '[]';

        $indent = str_repeat('    ', $depth);
        $inner = str_repeat('    ', $depth + 1);
        $isAssoc = array_keys($val) !== range(0, count($val) - 1);
        $parts = [];
        foreach ($val as $k => $v) {
            $exported = $this->phpExportDeep($v, $depth + 1);
            $parts[] = $isAssoc
                ? "{$inner}" . $this->phpVal($k) . " => {$exported}"
                : "{$inner}{$exported}";
        }
        return "[\n" . implode(",\n", $parts) . ",\n{$indent}]";
    }
}
