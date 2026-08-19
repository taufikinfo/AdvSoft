/**
 * Plugin Registry - Initialize and register all spreadsheet plugins
 */
(function() {
    'use strict';

    const registry = new window.SpreadsheetPluginRegistry();

    registry.register('chart', window.SpreadsheetChartPlugin, {
        description: 'Chart plugin for bar, line, pie, doughnut, KPI, gauge charts',
    });

    registry.register('pivot', window.SpreadsheetPivotPlugin, {
        description: 'Pivot plugin for PIVOT() formula and inline pivot tables',
    });

    registry.register('list', window.SpreadsheetListPlugin, {
        description: 'List plugin for ODOO.LIST() formula and linked lists',
    });

    registry.register('filter', window.SpreadsheetFilterPlugin, {
        description: 'Filter plugin for auto-filters and column filtering',
    });

    window.SpreadsheetPluginRegistryInstance = registry;
})();
