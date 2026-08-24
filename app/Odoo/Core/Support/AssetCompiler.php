<?php

namespace App\Odoo\Core\Support;

/**
 * AssetCompiler — Compiles, concatenates, and minifies JS and CSS for Production.
 */
class AssetCompiler
{
    public static function getJsFileList(): array
    {
        $coreFiles = [
            'js/core/owl-dialog-system.js',
            'js/core/owl-rpc.js',
            'js/core/owl-icons.js',
            'js/core/owl-layout-service.js',
            'js/core/owl-templates.js',
            'js/core/owl-root-tpl.js',
        ];

        $widgetFiles = [
            'js/widgets/fields/owl-field-widgets.js',
            'js/widgets/fields/owl-field-m2o.js',
            'js/widgets/fields/owl-field-datetime.js',
            'js/widgets/fields/owl-field-domain.js',
            'js/widgets/fields/owl-rte.js',
            'js/widgets/fields/owl-m2o-dialog.js',
            'js/widgets/fields/owl-domain-dialog.js',
            'js/widgets/inline-tree/owl-inline-tree-attrs.js',
            'js/widgets/inline-tree/owl-inline-tree-state.js',
            'js/widgets/inline-tree/owl-inline-tree-columns.js',
            'js/widgets/inline-tree/owl-inline-tree-cell-editors.js',
            'js/widgets/inline-tree/owl-inline-tree-drag.js',
            'js/widgets/inline-tree/owl-inline-tree-onchange.js',
            'js/widgets/inline-tree/owl-inline-tree-bulk.js',
            'js/widgets/inline-tree/owl-inline-tree-picker.js',
            'js/widgets/inline-tree/owl-inline-tree-row.js',
            'js/widgets/inline-tree/owl-inline-tree.js',
        ];

        $viewFiles = [
            'js/views/list/owl-list.js',
            'js/views/form/owl-form-tpl.js',
            'js/views/form/owl-form.js',
            'js/views/form/owl-form-dialog.js',
            'js/views/kanban/owl-kanban.js',
            'js/views/calendar/owl-calendar.js',
            'js/views/graph/owl-graph.js',
            'js/views/pivot/owl-pivot.js',
            'js/views/spreadsheet/engine/cell-model.js',
            'js/views/spreadsheet/engine/range-parser.js',
            'js/views/spreadsheet/engine/formula-engine.js',
            'js/views/spreadsheet/engine/command-history.js',
            'js/views/spreadsheet/engine/spreadsheet-model.js',
            'js/views/spreadsheet/engine/plugin-system.js',
            'js/views/spreadsheet/engine/chart-plugin.js',
            'js/views/spreadsheet/engine/pivot-plugin.js',
            'js/views/spreadsheet/engine/list-plugin.js',
            'js/views/spreadsheet/engine/filter-plugin.js',
            'js/views/spreadsheet/engine/plugin-registry.js',
            'js/views/spreadsheet/engine/spreadsheet-document.js',
            'js/views/spreadsheet/engine/sheet-manager.js',
            'js/views/spreadsheet/engine/conditional-formatting.js',
            'js/views/spreadsheet/engine/data-validation.js',
            'js/views/spreadsheet/engine/find-replace.js',
            'js/views/spreadsheet/engine/keyboard-navigation.js',
            'js/views/spreadsheet/engine/context-menu-builder.js',
            'js/views/spreadsheet/engine/xlsx-export.js',
            'js/views/spreadsheet/engine/collaboration-bus.js',
            'js/views/spreadsheet/engine/spreadsheet-engine.js',
            'js/views/spreadsheet/owl-spreadsheet.js',
        ];

        $pageDir = public_path('js/pages');
        $pageTpls = [];
        $pageScripts = [];
        if (is_dir($pageDir)) {
            $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($pageDir));
            foreach ($iterator as $file) {
                if ($file->isFile() && $file->getExtension() === 'js') {
                    $path = 'js/pages/' . str_replace('\\', '/', $iterator->getSubPathname());
                    if (str_ends_with($path, '-tpl.js')) {
                        $pageTpls[] = $path;
                    } else {
                        $pageScripts[] = $path;
                    }
                }
            }
        }
        sort($pageTpls);
        sort($pageScripts);

        return array_merge($coreFiles, $widgetFiles, $viewFiles, $pageTpls, $pageScripts, ['js/core/owl-root.js']);
    }

    public static function getCssFileList(): array
    {
        return [
            'css/odoo-layout.css',
            'css/odoo-dialog.css',
            'css/odoo-list.css',
            'css/odoo-form.css',
            'css/odoo-menu.css',
            'css/odoo-widgets.css',
            'css/odoo-kanban.css',
            'css/odoo-calendar.css',
            'css/odoo-spreadsheet.css',
            'css/odoo-views.css',
            'css/odoo-inline-tree.css',
            'css/odoo-security.css',
            'css/odoo-menu-editor.css',
            'css/odoo-view-builder.css',
            'css/odoo-rte.css',
            'css/odoo-report.css',
            'css/odoo-dark.css',
            'css/odoo-custom-page.css',
        ];
    }

    public static function compileJs(): string
    {
        $files = self::getJsFileList();
        $buffer = "/**\n * AdvSoft Compiled Production Bundle\n * Generated: " . date('Y-m-d H:i:s') . "\n */\n\n";

        foreach ($files as $file) {
            $fullPath = public_path($file);
            if (file_exists($fullPath)) {
                $content = file_get_contents($fullPath);
                $buffer .= "/* --- [FILE: {$file}] --- */\n";
                $buffer .= $content . "\n\n";
            }
        }

        $outPath = public_path('js/app.bundle.js');
        if (!is_dir(dirname($outPath))) {
            @mkdir(dirname($outPath), 0777, true);
        }
        file_put_contents($outPath, $buffer);
        return $outPath;
    }

    public static function compileCss(): string
    {
        $files = self::getCssFileList();
        $buffer = "/**\n * AdvSoft Compiled Production Stylesheet\n * Generated: " . date('Y-m-d H:i:s') . "\n */\n\n";

        foreach ($files as $file) {
            $fullPath = public_path($file);
            if (file_exists($fullPath)) {
                $content = file_get_contents($fullPath);
                $buffer .= "/* --- [FILE: {$file}] --- */\n";
                $buffer .= $content . "\n\n";
            }
        }

        $outPath = public_path('css/app.bundle.css');
        if (!is_dir(dirname($outPath))) {
            @mkdir(dirname($outPath), 0777, true);
        }
        file_put_contents($outPath, $buffer);
        return $outPath;
    }

    public static function compileAll(): array
    {
        $js = self::compileJs();
        $css = self::compileCss();
        return [
            'js'  => $js,
            'css' => $css,
            'js_size'  => file_exists($js) ? filesize($js) : 0,
            'css_size' => file_exists($css) ? filesize($css) : 0,
            'version'  => time(),
        ];
    }
}
