/**
 * Dynamic Context Menus - Based on selection type
 */
(function() {
    'use strict';

    const ContextMenuType = Object.freeze({
        CELL: 'cell',
        COLUMN: 'column',
        ROW: 'row',
        RANGE: 'range',
        CHART: 'chart',
        SHEET: 'sheet',
        HEADER: 'header',
        FORMULA_BAR: 'formulaBar',
    });

    const MenuItemType = Object.freeze({
        ACTION: 'action',
        SEPARATOR: 'separator',
        SUBMENU: 'submenu',
        CHECKBOX: 'checkbox',
        RADIO: 'radio',
        DISABLED: 'disabled',
    });

    class MenuItem {
        constructor(config) {
            this.id = config.id || 'menu_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            this.label = config.label || '';
            this.icon = config.icon || '';
            this.type = config.type || MenuItemType.ACTION;
            this.shortcut = config.shortcut || '';
            this.action = config.action || null;
            this.submenu = config.submenu || [];
            this.checked = config.checked || false;
            this.disabled = config.disabled || false;
            this.visible = config.visible !== false;
            this.separator = config.separator || false;
            this.description = config.description || '';
        }
    }

    class ContextMenuBuilder {
        constructor(model, config = {}) {
            this._model = model;
            this._clipboard = config.clipboard || null;
            this._navigation = config.navigation || null;
            this._history = config.history || null;
            this._filter = config.filter || null;
        }

        buildCellContextMenu(col, row, selection) {
            const items = [];
            const cell = this._model.getCell(col, row);

            items.push(new MenuItem({
                id: 'cut',
                label: 'Cut',
                icon: 'scissors',
                shortcut: 'Ctrl+X',
                action: () => this._emit('cut', { selection }),
            }));

            items.push(new MenuItem({
                id: 'copy',
                label: 'Copy',
                icon: 'copy',
                shortcut: 'Ctrl+C',
                action: () => this._emit('copy', { selection }),
            }));

            items.push(new MenuItem({
                id: 'paste',
                label: 'Paste',
                icon: 'clipboard',
                shortcut: 'Ctrl+V',
                action: () => this._emit('paste', { cell: { col, row } }),
            }));

            items.push(new MenuItem({ id: 'sep1', type: MenuItemType.SEPARATOR }));

            items.push(new MenuItem({
                id: 'insertRowAbove',
                label: 'Insert 1 row above',
                icon: 'arrow-up',
                action: () => this._model.insertRow(row),
            }));

            items.push(new MenuItem({
                id: 'insertRowBelow',
                label: 'Insert 1 row below',
                icon: 'arrow-down',
                action: () => this._model.insertRow(row + 1),
            }));

            items.push(new MenuItem({
                id: 'insertColLeft',
                label: 'Insert 1 column left',
                icon: 'arrow-left',
                action: () => this._model.insertCol(col),
            }));

            items.push(new MenuItem({
                id: 'insertColRight',
                label: 'Insert 1 column right',
                icon: 'arrow-right',
                action: () => this._model.insertCol(col + 1),
            }));

            items.push(new MenuItem({ id: 'sep2', type: MenuItemType.SEPARATOR }));

            items.push(new MenuItem({
                id: 'deleteRow',
                label: 'Delete row',
                icon: 'trash-2',
                action: () => this._model.deleteRow(row),
            }));

            items.push(new MenuItem({
                id: 'deleteCol',
                label: 'Delete column',
                icon: 'trash-2',
                action: () => this._model.deleteCol(col),
            }));

            items.push(new MenuItem({ id: 'sep3', type: MenuItemType.SEPARATOR }));

            items.push(new MenuItem({
                id: 'clearCell',
                label: 'Clear cell',
                icon: 'eraser',
                shortcut: 'Delete',
                action: () => this._model.deleteCell(col, row),
            }));

            items.push(new MenuItem({ id: 'sep4', type: MenuItemType.SEPARATOR }));

            items.push(new MenuItem({
                id: 'sortAsc',
                label: 'Sort A → Z',
                icon: 'arrow-up-narrow-wide',
                action: () => this._model.sortColumn(col, 'asc'),
            }));

            items.push(new MenuItem({
                id: 'sortDesc',
                label: 'Sort Z → A',
                icon: 'arrow-down-wide-narrow',
                action: () => this._model.sortColumn(col, 'desc'),
            }));

            if (cell && cell.raw && cell.raw.startsWith('=')) {
                items.push(new MenuItem({ id: 'sep5', type: MenuItemType.SEPARATOR }));
                items.push(new MenuItem({
                    id: 'showFormula',
                    label: 'Show formula',
                    icon: 'function',
                    action: () => this._emit('toggleShowFormulas'),
                }));
            }

            return items.filter(item => item.visible !== false);
        }

        buildColumnContextMenu(col) {
            const items = [];

            items.push(new MenuItem({
                id: 'insertColLeft',
                label: `Insert column left`,
                icon: 'arrow-left',
                action: () => this._model.insertCol(col),
            }));

            items.push(new MenuItem({
                id: 'insertColRight',
                label: `Insert column right`,
                icon: 'arrow-right',
                action: () => this._model.insertCol(col + 1),
            }));

            items.push(new MenuItem({ id: 'sep1', type: MenuItemType.SEPARATOR }));

            items.push(new MenuItem({
                id: 'deleteCol',
                label: 'Delete column',
                icon: 'trash-2',
                action: () => this._model.deleteCol(col),
            }));

            items.push(new MenuItem({ id: 'sep2', type: MenuItemType.SEPARATOR }));

            items.push(new MenuItem({
                id: 'autoFitWidth',
                label: 'Auto-fit width',
                icon: 'maximize-2',
                action: () => this._autoFitColumnWidth(col),
            }));

            items.push(new MenuItem({
                id: 'hideCol',
                label: 'Hide column',
                icon: 'eye-off',
                action: () => this._hideColumn(col),
            }));

            items.push(new MenuItem({ id: 'sep3', type: MenuItemType.SEPARATOR }));

            items.push(new MenuItem({
                id: 'sortAsc',
                label: 'Sort A → Z',
                icon: 'arrow-up-narrow-wide',
                action: () => this._model.sortColumn(col, 'asc'),
            }));

            items.push(new MenuItem({
                id: 'sortDesc',
                label: 'Sort Z → A',
                icon: 'arrow-down-wide-narrow',
                action: () => this._model.sortColumn(col, 'desc'),
            }));

            if (this._filter) {
                items.push(new MenuItem({ id: 'sep4', type: MenuItemType.SEPARATOR }));
                items.push(new MenuItem({
                    id: 'filter',
                    label: 'Add filter',
                    icon: 'filter',
                    action: () => this._filter.enableAutoFilter(),
                }));
            }

            return items;
        }

        buildRowContextMenu(row) {
            const items = [];

            items.push(new MenuItem({
                id: 'insertRowAbove',
                label: 'Insert row above',
                icon: 'arrow-up',
                action: () => this._model.insertRow(row),
            }));

            items.push(new MenuItem({
                id: 'insertRowBelow',
                label: 'Insert row below',
                icon: 'arrow-down',
                action: () => this._model.insertRow(row + 1),
            }));

            items.push(new MenuItem({ id: 'sep1', type: MenuItemType.SEPARATOR }));

            items.push(new MenuItem({
                id: 'deleteRow',
                label: 'Delete row',
                icon: 'trash-2',
                action: () => this._model.deleteRow(row),
            }));

            items.push(new MenuItem({ id: 'sep2', type: MenuItemType.SEPARATOR }));

            items.push(new MenuItem({
                id: 'autoFitHeight',
                label: 'Auto-fit height',
                icon: 'maximize-2',
                action: () => this._autoFitRowHeight(row),
            }));

            items.push(new MenuItem({
                id: 'hideRow',
                label: 'Hide row',
                icon: 'eye-off',
                action: () => this._hideRow(row),
            }));

            return items;
        }

        buildRangeContextMenu(selection) {
            const items = this.buildCellContextMenu(selection.startCol, selection.startRow, selection);

            items.push(new MenuItem({ id: 'sep10', type: MenuItemType.SEPARATOR }));

            items.push(new MenuItem({
                id: 'mergeCells',
                label: 'Merge cells',
                icon: 'maximize-2',
                action: () => this._mergeCells(selection),
            }));

            items.push(new MenuItem({
                id: 'unmergeCells',
                label: 'Unmerge cells',
                icon: 'minimize-2',
                action: () => this._unmergeCells(selection),
            }));

            items.push(new MenuItem({ id: 'sep11', type: MenuItemType.SEPARATOR }));

            items.push(new MenuItem({
                id: 'conditionalFormat',
                label: 'Conditional formatting',
                icon: 'paintbrush',
                action: () => this._emit('openConditionalFormat', { selection }),
            }));

            items.push(new MenuItem({
                id: 'dataValidation',
                label: 'Data validation',
                icon: 'check-circle',
                action: () => this._emit('openDataValidation', { selection }),
            }));

            items.push(new MenuItem({ id: 'sep12', type: MenuItemType.SEPARATOR }));

            items.push(new MenuItem({
                id: 'insertChart',
                label: 'Insert chart',
                icon: 'bar-chart-2',
                action: () => this._emit('insertChart', { selection }),
            }));

            items.push(new MenuItem({
                id: 'namedRange',
                label: 'Define named range',
                icon: 'tag',
                action: () => this._emit('defineNamedRange', { selection }),
            }));

            return items;
        }

        buildSheetContextMenu(sheetId) {
            const items = [];

            items.push(new MenuItem({
                id: 'renameSheet',
                label: 'Rename',
                icon: 'edit-3',
                action: () => this._emit('renameSheet', { sheetId }),
            }));

            items.push(new MenuItem({
                id: 'duplicateSheet',
                label: 'Duplicate',
                icon: 'copy',
                action: () => this._emit('duplicateSheet', { sheetId }),
            }));

            items.push(new MenuItem({ id: 'sep1', type: MenuItemType.SEPARATOR }));

            items.push(new MenuItem({
                id: 'deleteSheet',
                label: 'Delete',
                icon: 'trash-2',
                disabled: this._model.sheets.length <= 1,
                action: () => this._emit('deleteSheet', { sheetId }),
            }));

            items.push(new MenuItem({ id: 'sep2', type: MenuItemType.SEPARATOR }));

            items.push(new MenuItem({
                id: 'tabColor',
                label: 'Tab color',
                icon: 'palette',
                submenu: this._buildTabColorSubmenu(sheetId),
            }));

            items.push(new MenuItem({ id: 'sep3', type: MenuItemType.SEPARATOR }));

            items.push(new MenuItem({
                id: 'protectSheet',
                label: 'Protect sheet',
                icon: 'lock',
                action: () => this._emit('protectSheet', { sheetId }),
            }));

            return items;
        }

        _buildTabColorSubmenu(sheetId) {
            const colors = [
                '#ef4444', '#f97316', '#f59e0b', '#84cc16',
                '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
                '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
                null,
            ];

            return colors.map(color => new MenuItem({
                id: `color_${color || 'none'}`,
                label: color ? '' : 'No color',
                icon: color ? 'circle' : 'x-circle',
                type: MenuItemType.ACTION,
                action: () => this._model.setTabColor(sheetId, color),
            }));
        }

        _autoFitColumnWidth(col) {
            let maxWidth = 40;
            for (let r = 0; r < this._model.rowCount; r++) {
                const val = this._model.getCellFormattedValue(col, r);
                if (val) {
                    const width = val.length * 8 + 24;
                    maxWidth = Math.max(maxWidth, width);
                }
            }
            this._model.setColWidth(col, Math.min(maxWidth, 300));
        }

        _autoFitRowHeight(row) {
            this._model.setRowHeight(row, 28);
        }

        _hideColumn(col) {
            this._model._hiddenCols.add(col);
            this._model._emit('colHidden', { col });
        }

        _hideRow(row) {
            this._model._hiddenRows.add(row);
            this._model._emit('rowHidden', { row });
        }

        _mergeCells(selection) {
            const rangeStr = selection.toString();
            this._model.setMergedCells(rangeStr, true);
        }

        _unmergeCells(selection) {
            const rangeStr = selection.toString();
            this._model.setMergedCells(rangeStr, false);
        }

        _emit(event, data) {
            this._model._emit(event, data);
        }
    }

    window.SpreadsheetContextMenuType = ContextMenuType;
    window.SpreadsheetMenuItemType = MenuItemType;
    window.SpreadsheetMenuItem = MenuItem;
    window.SpreadsheetContextMenuBuilder = ContextMenuBuilder;
})();
