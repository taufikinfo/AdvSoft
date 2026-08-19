/**
 * Spreadsheet Engine Integration
 * Bridges engine modules with the OWL SpreadsheetView component
 */
(function() {
    'use strict';

    class SpreadsheetEngine {
        constructor(config = {}) {
            this._config = config;

            this.model = null;
            this.plugins = null;
            this.navigation = null;
            this.contextMenuBuilder = null;
            this.findReplace = null;
            this.document = null;
            this.sheetManager = null;
            this.conditionalFormatting = null;
            this.dataValidation = null;
            this.exporter = null;
            this.collaboration = null;

            this._initialized = false;
        }

        get isInitialized() { return this._initialized; }

        init(config = {}) {
            if (this._initialized) return;

            this._config = { ...this._config, ...config };

            this.model = new window.SpreadsheetModel({
                defaultColWidth: this._config.defaultColWidth || 100,
                defaultRowHeight: this._config.defaultRowHeight || 28,
                maxRows: this._config.maxRows || 10000,
                maxCols: this._config.maxCols || 702,
            });

            this.sheetManager = new window.SpreadsheetSheetManager(this.model);
            this.navigation = new window.SpreadsheetKeyboardNavigation(this.model);
            this.contextMenuBuilder = new window.SpreadsheetContextMenuBuilder(this.model);
            this.findReplace = new window.SpreadsheetFindReplace(this.model);
            this.conditionalFormatting = new window.SpreadsheetConditionalFormattingManager(this.model);
            this.dataValidation = new window.SpreadsheetDataValidationManager(this.model);
            this.exporter = new window.SpreadsheetExport(this.model);
            this.document = new window.SpreadsheetDocument();

            if (this._config.collaboration) {
                this.collaboration = new window.SpreadsheetCollaborationBus(this._config.collaboration);
            }

            this.plugins = window.SpreadsheetPluginRegistryInstance;
            this.plugins.createAll(this.model);
            this.plugins.setupAll();

            this.navigation.setup();
            this._setupEventHandlers();

            this._initialized = true;
        }

        _setupEventHandlers() {
            this.navigation.on('copy', (data) => this._handleCopy(data));
            this.navigation.on('paste', (data) => this._handlePaste(data));
            this.navigation.on('cut', (data) => this._handleCut(data));
            this.navigation.on('deleteSelection', (data) => this._handleDeleteSelection(data));
            this.navigation.on('clearAndEdit', (data) => this._handleClearAndEdit(data));
            this.navigation.on('toggleFormat', (data) => this._handleToggleFormat(data));
            this.navigation.on('openFind', () => this._handleOpenFind());
            this.navigation.on('openFindReplace', () => this._handleOpenFindReplace());
            this.navigation.on('moved', (cell) => this._handleCellMoved(cell));
            this.navigation.on('editModeChanged', (data) => this._handleEditModeChanged(data));
        }

        loadData(records, fields) {
            this.model.clearAll();

            const fieldList = fields || Object.keys(this._config.fieldDefs || {});
            for (let c = 0; c < fieldList.length; c++) {
                this.model.setCellRaw(c, 0, fieldList[c]);
                this.model.setCellFormat(c, 0, 'bold', true);
                this.model.setCellFormat(c, 0, 'bgColor', '#f3f4f6');
            }

            for (let r = 0; r < records.length; r++) {
                const record = records[r];
                for (let c = 0; c < fieldList.length; c++) {
                    const field = fieldList[c];
                    const value = record[field];
                    if (value !== null && value !== undefined) {
                        this.model.setCellRaw(c, r + 1, String(value));
                    }
                }
            }
        }

        loadFromJSON(data) {
            if (data.cells) {
                for (const [key, cellData] of Object.entries(data.cells)) {
                    const parts = key.split(':');
                    if (parts.length === 3) {
                        const sheetId = parts[0];
                        const col = parseInt(parts[1], 10);
                        const row = parseInt(parts[2], 10);
                        if (sheetId === this.model.activeSheetId) {
                            const cell = window.SpreadsheetCell.fromJSON(cellData);
                            this.model.setCellRaw(col, row, cell.raw);
                            if (cell.format) {
                                this.model.setCellFormats(col, row, cell.format);
                            }
                        }
                    }
                }
            }

            if (data.sheets) {
                this.sheetManager.importJSON(data);
            }

            if (data.colWidths) {
                for (const [col, width] of Object.entries(data.colWidths)) {
                    this.model.setColWidth(parseInt(col, 10), width);
                }
            }

            if (data.rowHeights) {
                for (const [row, height] of Object.entries(data.rowHeights)) {
                    this.model.setRowHeight(parseInt(row, 10), height);
                }
            }
        }

        saveToJSON() {
            return this.model.toJSON();
        }

        async save() {
            const data = this.saveToJSON();
            try {
                await this.document.save(data);
                return true;
            } catch (e) {
                console.error('Save error:', e);
                return false;
            }
        }

        async load(documentId) {
            try {
                const data = await this.document.load(documentId);
                if (data) {
                    this.loadFromJSON(data);
                }
                return true;
            } catch (e) {
                console.error('Load error:', e);
                return false;
            }
        }

        getCellDisplay(col, row) {
            return this.model.getCellFormattedValue(col, row);
        }

        getCellRaw(col, row) {
            return this.model.getCellRaw(col, row);
        }

        setCellRaw(col, row, value) {
            this.model.setCellRaw(col, row, value);
        }

        getCellFormat(col, row) {
            return this.model.getCellFormat(col, row);
        }

        setCellFormat(col, row, key, value) {
            this.model.setCellFormat(col, row, key, value);
        }

        getCellError(col, row) {
            return this.model.getCellError(col, row);
        }

        _handleCopy(data) {
            const sel = data.selection || this.model.selection;
            if (!sel) return;

            const textData = [];
            for (let r = sel.startRow; r <= sel.endRow; r++) {
                const row = [];
                for (let c = sel.startCol; c <= sel.endCol; c++) {
                    row.push(this.getCellDisplay(c, r));
                }
                textData.push(row.join('\t'));
            }
            const text = textData.join('\n');

            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).catch(() => {});
            }
        }

        _handlePaste(data) {
            if (navigator.clipboard) {
                navigator.clipboard.readText().then(text => {
                    this._pasteText(text, data.cell);
                }).catch(() => {});
            }
        }

        _pasteText(text, startCell) {
            if (!text || !startCell) return;
            const lines = text.split('\n');
            for (let r = 0; r < lines.length; r++) {
                const cols = lines[r].split('\t');
                for (let c = 0; c < cols.length; c++) {
                    this.model.setCellRaw(
                        startCell.col + c,
                        startCell.row + r,
                        cols[c]
                    );
                }
            }
        }

        _handleCut(data) {
            this._handleCopy(data);
            const sel = data.selection || this.model.selection;
            if (!sel) return;

            for (let r = sel.startRow; r <= sel.endRow; r++) {
                for (let c = sel.startCol; c <= sel.endCol; c++) {
                    this.model.deleteCell(c, r);
                }
            }
        }

        _handleDeleteSelection(data) {
            const sel = data.selection || this.model.selection;
            if (!sel) return;

            for (let r = sel.startRow; r <= sel.endRow; r++) {
                for (let c = sel.startCol; c <= sel.endCol; c++) {
                    this.model.deleteCell(c, r);
                }
            }
        }

        _handleClearAndEdit(data) {
            if (data.cell) {
                this.model.deleteCell(data.cell.col, data.cell.row);
            }
        }

        _handleToggleFormat(data) {
            const sel = this.model.selection;
            if (!sel) return;

            const format = data.format;
            const cell = this.model.getCell(sel.startCol, sel.startRow);
            const currentValue = cell?.format?.[format] || false;

            for (let r = sel.startRow; r <= sel.endRow; r++) {
                for (let c = sel.startCol; c <= sel.endCol; c++) {
                    this.model.setCellFormat(c, r, format, !currentValue);
                }
            }
        }

        _handleOpenFind() {
            this.findReplace._find();
        }

        _handleOpenFindReplace() {
            this.findReplace._find();
        }

        _handleCellMoved(cell) {
            if (this.collaboration && this.collaboration.isConnected) {
                this.collaboration.sendCursorPosition(cell.col, cell.row);
            }
        }

        _handleEditModeChanged(data) {
            // OWL component handles this via event
        }

        undo() {
            return this.model.undo();
        }

        redo() {
            return this.model.redo();
        }

        sortColumn(col, direction) {
            this.model.sortColumn(col, direction);
        }

        insertCol(col) {
            this.model.insertCol(col);
        }

        deleteCol(col) {
            this.model.deleteCol(col);
        }

        insertRow(row) {
            this.model.insertRow(row);
        }

        deleteRow(row) {
            this.model.deleteRow(row);
        }

        setColWidth(col, width) {
            this.model.setColWidth(col, width);
        }

        setRowHeight(row, height) {
            this.model.setRowHeight(row, height);
        }

        mergeCells(rangeStr) {
            this.model.setMergedCells(rangeStr, true);
        }

        unmergeCells(rangeStr) {
            this.model.setMergedCells(rangeStr, false);
        }

        setFrozenPane(col, row) {
            this.model.setFrozenPane(col, row);
        }

        addChart(config) {
            const plugin = this.plugins.get('chart');
            if (plugin) return plugin.addChart(config);
            return null;
        }

        updateChart(id, updates) {
            const plugin = this.plugins.get('chart');
            if (plugin) plugin.updateChart(id, updates);
        }

        removeChart(id) {
            const plugin = this.plugins.get('chart');
            if (plugin) plugin.removeChart(id);
        }

        getCharts() {
            const plugin = this.plugins.get('chart');
            return plugin ? plugin.getAllCharts() : [];
        }

        enableAutoFilter() {
            const plugin = this.plugins.get('filter');
            if (plugin) plugin.enableAutoFilter();
        }

        disableAutoFilter() {
            const plugin = this.plugins.get('filter');
            if (plugin) plugin.disableAutoFilter();
        }

        addConditionalFormat(config) {
            return this.conditionalFormatting.addRule(config);
        }

        addDataValidation(config) {
            return this.dataValidation.addValidation(config);
        }

        exportCSV(filename) {
            return this.exporter.exportToCSV(filename);
        }

        exportXLSX(filename) {
            return this.exporter.exportToXLSX(filename);
        }

        exportJSON(filename) {
            return this.exporter.exportToJSON(filename);
        }

        connectCollaboration() {
            if (this.collaboration) {
                this.collaboration.connect();
            }
        }

        disconnectCollaboration() {
            if (this.collaboration) {
                this.collaboration.disconnect();
            }
        }

        destroy() {
            if (this.navigation) this.navigation.destroy();
            if (this.collaboration) this.collaboration.disconnect();
            if (this.plugins) this.plugins.destroyAll();
        }
    }

    window.SpreadsheetEngine = SpreadsheetEngine;
})();
