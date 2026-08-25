<?php

namespace App\Advsoft;

use Adianti\Database\TTransaction;
use App\Advsoft\Core\Support\Log;

/**
 * DataFileLoader
 *
 * @version    2.0.0
 * @package    Advsoft
 * @author     Taufik
 * @author     AdvSoft Team
 * @copyright  Copyright (c) 2026 AdvSoft Technologies
 * @license    https://opensource.org/licenses/MIT MIT License
 */
class DataFileLoader
{
    /** @var array External ID → DB ID mapping cache */
    private array $xmlIdMap = [];

    /** @var string Current module being loaded */
    private string $currentModule = '';

    /**
     * Load a data file (XML or CSV) for a given module.
     *
     * @param string $moduleName  Addon directory name (e.g. 'account')
     * @param string $filePath    Relative path within addon (e.g. 'views/menus.xml')
     */
    public function loadFile(string $moduleName, string $filePath): void
    {
        $this->currentModule = $moduleName;
        $fullPath = app_path("control/{$moduleName}/{$filePath}");

        if (!file_exists($fullPath)) {
            Log::warning("[DataFileLoader] File not found: {$fullPath}");
            return;
        }

        $extension = pathinfo($fullPath, PATHINFO_EXTENSION);

        match ($extension) {
            'xml' => $this->loadXml($fullPath),
            'csv' => $this->loadCsv($fullPath, $moduleName),
            default => Log::warning("[DataFileLoader] Unsupported file type: {$extension}"),
        };
    }

    /**
     * Parse and process an XML data file.
     */
    protected function loadXml(string $path): void
    {
        $xml = simplexml_load_file($path);
        if (!$xml) {
            Log::error("[DataFileLoader] Failed to parse XML: {$path}");
            return;
        }

        DB::beginTransaction();
        try {
            foreach ($xml->children() as $element) {
                $this->processElement($element);
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("[DataFileLoader] Error processing {$path}: {$e->getMessage()}");
            throw $e;
        }
    }

    /**
     * Process a single XML element.
     */
    protected function processElement(\SimpleXMLElement $element): void
    {
        $tag = $element->getName();

        match ($tag) {
            'record' => $this->processRecord($element),
            'menuitem' => $this->processMenuitem($element),
            'act_window' => $this->processActWindow($element),
            'delete' => $this->processDelete($element),
            'function' => $this->processFunction($element),
            'data' => $this->processDataWrapper($element),
            default => null, // Skip unknown elements
        };
    }

    /**
     * Process <data> wrapper element — just recurse into children.
     * Supports noupdate="1" attribute.
     */
    protected function processDataWrapper(\SimpleXMLElement $element): void
    {
        $noupdate = (string) ($element['noupdate'] ?? '0') === '1';
        foreach ($element->children() as $child) {
            if ($noupdate && $this->xmlIdExists($child)) {
                continue; // Skip if noupdate and record already exists
            }
            $this->processElement($child);
        }
    }

    /**
     * Process <record model="..." id="..."> element.
     *
     * Example:
     *   <record model="ir.ui.menu" id="menu_accounting_root">
     *     <field name="name">Accounting</field>
     *     <field name="web_icon">calculator</field>
     *     <field name="sequence">40</field>
     *   </record>
     */
    protected function processRecord(\SimpleXMLElement $element): void
    {
        $modelName = (string) $element['model'];
        $xmlId = (string) $element['id'];

        if (!$modelName) {
            Log::warning("[DataFileLoader] <record> missing model attribute");
            return;
        }

        // Special handling for ir.ui.view (QWeb templates)
        if ($modelName === 'ir.ui.view') {
            $this->processIrUiView($element, $xmlId);
            return;
        }

        // Resolve model definition
        $def = Registry::get($modelName);
        if (!$def) {
            Log::warning("[DataFileLoader] Model '{$modelName}' not found in registry");
            return;
        }

        // Parse field values
        $values = $this->parseFieldValues($element, $def);

        // Check if record exists (by XML ID)
        $existingId = $this->resolveXmlId($xmlId);

        if ($existingId) {
            // Update existing record
            $def->newQuery()->where('id', $existingId)->update(
                $def->prepareWriteValues($values)
            );
            // Apply relational writes
            $record = $def->newQuery()->find($existingId);
            if ($record) {
                $def->applyRelationalWrites($record, $values);
            }
        } else {
            // Create new record
            $scalar = $def->prepareWriteValues($values);
            $record = $def->newQuery()->create($scalar);
            $def->applyRelationalWrites($record, $values);

            // Store XML ID mapping
            if ($xmlId) {
                $this->storeXmlId($xmlId, $modelName, $record->id);
            }
        }
    }

    /**
     * Process an ir.ui.view record (QWeb template).
     * Handles template storage directly in the ir_ui_views table.
     */
    protected function processIrUiView(\SimpleXMLElement $element, string $xmlId): void
    {
        $values = [];
        foreach ($element->children() as $field) {
            if ($field->getName() !== 'field') continue;
            $name = (string) $field['name'];
            $ref = (string) ($field['ref'] ?? '');

            if ($ref) {
                $values[$name] = $ref; // Store ref as string; will be resolved later
            } else {
                // Get the text content (may contain CDATA)
                $values[$name] = trim((string) $field);
            }
        }

        // Resolve ref fields (e.g. inherit_id="base.view_qweb_html_container")
        foreach ($values as $k => $v) {
            if (str_ends_with($k, '_id') && is_string($v) && !is_numeric($v)) {
                $resolvedId = $this->resolveXmlId($v);
                if ($resolvedId) {
                    $values[$k] = $resolvedId;
                }
            }
        }

        // Ensure required fields
        $values['model'] = $values['model'] ?? '';
        $values['type'] = $values['type'] ?? 'qweb';
        $values['priority'] = $values['priority'] ?? 16;
        $values['active'] = $values['active'] ?? true;

        // Check if record exists by XML ID
        $existingId = $this->resolveXmlId($xmlId);

        if ($existingId) {
            DB::table('ir_ui_views')->where('id', $existingId)->update(array_merge($values, ['updated_at' => now()]));
        } else {
            $values['created_at'] = now();
            $values['updated_at'] = now();
            $dbId = DB::table('ir_ui_views')->insertGetId($values);
            if ($xmlId && $dbId) {
                $this->storeXmlId($xmlId, 'ir.ui.view', $dbId);
            }
        }
    }

    /**
     * Parse <field> elements from a <record>.
     *
     * Supports:
     *   <field name="name">Text Value</field>
     *   <field name="parent_id" ref="menu_root"/>
     *   <field name="active" eval="True"/>
     *   <field name="sequence">10</field>
     *   <field name="domain">[('type','=','sale')]</field>
     */
    protected function parseFieldValues(\SimpleXMLElement $element, ModelDefinition $def): array
    {
        $values = [];

        foreach ($element->field as $fieldEl) {
            $name = (string) $fieldEl['name'];
            if (!$name) continue;

            $fieldDef = $def->getField($name);

            // Handle ref="" (Many2one reference by XML ID)
            if (isset($fieldEl['ref'])) {
                $refId = $this->resolveXmlId((string) $fieldEl['ref']);
                $values[$name] = $refId ?: null;
                continue;
            }

            // Handle eval="" (Python-style expression → PHP evaluation)
            if (isset($fieldEl['eval'])) {
                $values[$name] = $this->evaluateExpression((string) $fieldEl['eval']);
                continue;
            }

            // Handle search="" (domain search to find related record)
            if (isset($fieldEl['search'])) {
                $searchDomain = (string) $fieldEl['search'];
                $searchModel = (string) ($fieldEl['model'] ?? ($fieldDef->relation ?? ''));
                if ($searchModel) {
                    $searchDef = Registry::get($searchModel);
                    if ($searchDef) {
                        $result = $searchDef->newQuery()->first();
                        $values[$name] = $result ? $result->id : null;
                    }
                }
                continue;
            }

            // Handle file="" (binary field from file path)
            if (isset($fieldEl['file'])) {
                $filePath = app_path("control/{$this->currentModule}/" . (string) $fieldEl['file']);
                if (file_exists($filePath)) {
                    $values[$name] = base64_encode(file_get_contents($filePath));
                }
                continue;
            }

            // Regular text content
            $textValue = trim((string) $fieldEl);

            // Type-aware conversion
            if ($fieldDef) {
                $values[$name] = match ($fieldDef->type) {
                    Field::INTEGER => (int) $textValue,
                    Field::FLOAT, Field::MONETARY => (float) $textValue,
                    Field::BOOLEAN => in_array(strtolower($textValue), ['true', '1', 'yes']),
                    Field::MANY2ONE => is_numeric($textValue) ? (int) $textValue : null,
                    default => $textValue,
                };
            } else {
                $values[$name] = $textValue;
            }
        }

        return $values;
    }

    /**
     * Process <menuitem> shortcut element.
     *
     * Example:
     *   <menuitem id="menu_accounting" name="Accounting"
     *             parent="menu_root" action="action_account_list"
     *             sequence="40" web_icon="calculator"/>
     */
    protected function processMenuitem(\SimpleXMLElement $element): void
    {
        $xmlId = (string) $element['id'];
        $values = [
            'name' => (string) ($element['name'] ?? ''),
            'sequence' => (int) ($element['sequence'] ?? 10),
            'active' => true,
        ];

        // Parent menu reference
        if (isset($element['parent'])) {
            $parentId = $this->resolveXmlId((string) $element['parent']);
            $values['parent_id'] = $parentId;
        }

        // Action reference
        if (isset($element['action'])) {
            $actionId = $this->resolveXmlId((string) $element['action']);
            $values['action_id'] = $actionId;
        }

        // Icon
        if (isset($element['icon'])) $values['icon'] = (string) $element['icon'];
        if (isset($element['web_icon'])) $values['web_icon'] = (string) $element['web_icon'];
        if (isset($element['web_icon_color'])) $values['web_icon_color'] = (string) $element['web_icon_color'];

        // Groups (access control)
        if (isset($element['groups'])) $values['groups'] = (string) $element['groups'];

        // Security view (for custom SPA pages)
        if (isset($element['security_view'])) $values['security_view'] = (string) $element['security_view'];

        // Model + view_type (for simple model menus)
        if (isset($element['model'])) $values['model'] = (string) $element['model'];
        if (isset($element['view_type'])) $values['view_type'] = (string) $element['view_type'];

        $existingId = $this->resolveXmlId($xmlId);
        $menuModel = \App\Model\Menu::class;

        if ($existingId) {
            $menuModel::where('id', $existingId)->update($values);
        } else {
            $record = $menuModel::create($values);
            if ($xmlId) $this->storeXmlId($xmlId, 'ir.ui.menu', $record->id);
        }
    }

    /**
     * Process <act_window> shortcut element.
     *
     * Example:
     *   <act_window id="action_account_list" name="Chart of Accounts"
     *               res_model="account.account" view_mode="list,form"/>
     */
    protected function processActWindow(\SimpleXMLElement $element): void
    {
        $xmlId = (string) $element['id'];
        $values = [
            'name' => (string) ($element['name'] ?? ''),
            'type' => 'ir.actions.act_window',
            'res_model' => (string) ($element['res_model'] ?? ''),
            'view_mode' => (string) ($element['view_mode'] ?? 'list,form'),
            'target' => (string) ($element['target'] ?? 'current'),
            'limit' => (int) ($element['limit'] ?? 80),
        ];

        if (isset($element['domain'])) $values['domain'] = (string) $element['domain'];
        if (isset($element['context'])) $values['context'] = (string) $element['context'];
        if (isset($element['help'])) $values['help'] = (string) $element['help'];

        $existingId = $this->resolveXmlId($xmlId);
        $actionModel = \App\Model\Action::class;

        if ($existingId) {
            $actionModel::where('id', $existingId)->update($values);
        } else {
            $record = $actionModel::create($values);
            if ($xmlId) $this->storeXmlId($xmlId, 'ir.action', $record->id);
        }
    }

    /**
     * Process <delete> element.
     *
     * Example:
     *   <delete model="ir.ui.menu" id="menu_old_item"/>
     */
    protected function processDelete(\SimpleXMLElement $element): void
    {
        $xmlId = (string) ($element['id'] ?? '');
        $model = (string) ($element['model'] ?? '');

        if ($xmlId) {
            $dbId = $this->resolveXmlId($xmlId);
            if ($dbId && $model) {
                $def = Registry::get($model);
                if ($def) {
                    $def->newQuery()->where('id', $dbId)->delete();
                    $this->deleteXmlId($xmlId);
                }
            }
        }
    }

    /**
     * Process <function> element (call a method on a model).
     */
    protected function processFunction(\SimpleXMLElement $element): void
    {
        $model = (string) ($element['model'] ?? '');
        $name = (string) ($element['name'] ?? '');

        if ($model && $name) {
            $def = Registry::get($model);
            if ($def && method_exists($def, $name)) {
                $def->$name();
            }
        }
    }

    /**
     * Evaluate a Python-style expression to PHP.
     * Handles common Odoo eval patterns.
     */
    protected function evaluateExpression(string $expr)
    {
        // Boolean
        if ($expr === 'True' || $expr === 'true') return true;
        if ($expr === 'False' || $expr === 'false') return false;
        if ($expr === 'None' || $expr === 'null') return null;

        // Numeric
        if (is_numeric($expr)) return strpos($expr, '.') !== false ? (float) $expr : (int) $expr;

        // List/dict (JSON-like)
        $jsonExpr = str_replace(["'", 'True', 'False', 'None'], ['"', 'true', 'false', 'null'], $expr);
        $decoded = json_decode($jsonExpr, true);
        if (json_last_error() === JSON_ERROR_NONE) return $decoded;

        // ref() function
        if (preg_match('/^ref\([\'"](.+?)[\'"]\)$/', $expr, $m)) {
            return $this->resolveXmlId($m[1]);
        }

        return $expr;
    }

    // ═══════════════════════════════════════════════════
    //  XML ID Resolution (ir.model.data equivalent)
    // ═══════════════════════════════════════════════════

    /**
     * Resolve an XML ID to a database ID.
     * Format: "module.xml_id" or just "xml_id" (assumes current module)
     */
    public function resolveXmlId(string $xmlId): ?int
    {
        if (empty($xmlId)) return null;

        // Normalize: add module prefix if missing
        if (!str_contains($xmlId, '.')) {
            $xmlId = $this->currentModule . '.' . $xmlId;
        }

        // Check cache first
        if (isset($this->xmlIdMap[$xmlId])) {
            return $this->xmlIdMap[$xmlId];
        }

        // Look up in database
        $record = DB::table('ir_model_data')
            ->where('complete_name', $xmlId)
            ->first();

        if ($record) {
            $this->xmlIdMap[$xmlId] = $record->res_id;
            return $record->res_id;
        }

        return null;
    }

    /**
     * Store an XML ID → DB ID mapping.
     */
    protected function storeXmlId(string $xmlId, string $model, int $dbId): void
    {
        // Normalize
        if (!str_contains($xmlId, '.')) {
            $xmlId = $this->currentModule . '.' . $xmlId;
        }

        [$module, $name] = explode('.', $xmlId, 2);

        DB::table('ir_model_data')->updateOrInsert(
            ['complete_name' => $xmlId],
            [
                'module' => $module,
                'name' => $name,
                'model' => $model,
                'res_id' => $dbId,
                'updated_at' => now(),
            ]
        );

        $this->xmlIdMap[$xmlId] = $dbId;
    }

    /**
     * Delete an XML ID mapping.
     */
    protected function deleteXmlId(string $xmlId): void
    {
        if (!str_contains($xmlId, '.')) {
            $xmlId = $this->currentModule . '.' . $xmlId;
        }
        DB::table('ir_model_data')->where('complete_name', $xmlId)->delete();
        unset($this->xmlIdMap[$xmlId]);
    }

    /**
     * Check if an XML ID already exists.
     */
    protected function xmlIdExists(\SimpleXMLElement $element): bool
    {
        $xmlId = (string) ($element['id'] ?? '');
        return $xmlId && $this->resolveXmlId($xmlId) !== null;
    }

    // ═══════════════════════════════════════════════════
    //  CSV Loader
    // ═══════════════════════════════════════════════════

    /**
     * Load a CSV data file (e.g. ir.model.access.csv).
     *
     * The CSV filename determines the target model:
     *   ir.model.access.csv → model is 'ir.model.access'
     *
     * First row = headers (field names), remaining rows = data.
     */
    protected function loadCsv(string $path, string $moduleName): void
    {
        $filename = pathinfo($path, PATHINFO_FILENAME);
        $modelName = str_replace('.', '.', $filename); // e.g. 'ir.model.access'

        $def = Registry::get($modelName);
        if (!$def) {
            Log::warning("[DataFileLoader] CSV model not found: {$modelName}");
            return;
        }

        $handle = fopen($path, 'r');
        if (!$handle) return;

        $headers = fgetcsv($handle);
        if (!$headers) {
            fclose($handle);
            return;
        }

        DB::beginTransaction();
        try {
            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) !== count($headers)) continue;

                $values = array_combine($headers, $row);
                $xmlId = $values['id'] ?? null;
                unset($values['id']);

                // Resolve ref fields (e.g. model_id:id → model reference)
                foreach ($values as $key => $val) {
                    if (str_ends_with($key, ':id')) {
                        $realKey = str_replace(':id', '', $key);
                        $values[$realKey] = $this->resolveXmlId($val);
                        unset($values[$key]);
                    } elseif (str_ends_with($key, '/id')) {
                        $realKey = str_replace('/id', '', $key);
                        $values[$realKey] = $this->resolveXmlId($val);
                        unset($values[$key]);
                    }
                }

                // Type conversion
                foreach ($values as $k => $v) {
                    if ($v === '') $values[$k] = null;
                    if (strtolower($v) === 'true') $values[$k] = true;
                    if (strtolower($v) === 'false') $values[$k] = false;
                    if (is_numeric($v)) $values[$k] = strpos($v, '.') !== false ? (float)$v : (int)$v;
                }

                $existingId = $xmlId ? $this->resolveXmlId($xmlId) : null;

                if ($existingId) {
                    $def->newQuery()->where('id', $existingId)->update(
                        $def->prepareWriteValues($values)
                    );
                } else {
                    $record = $def->newQuery()->create($def->prepareWriteValues($values));
                    if ($xmlId) $this->storeXmlId($xmlId, $modelName, $record->id);
                }
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("[DataFileLoader] CSV error: {$e->getMessage()}");
            throw $e;
        } finally {
            fclose($handle);
        }
    }
}
