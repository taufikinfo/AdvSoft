/**
 * SpreadsheetModel - Core model with reactive state
 * Follows Odoo o-spreadsheet model pattern
 */
(function() {
    'use strict';

    class SpreadsheetModel {
        constructor(config = {}) {
            this._config = {
                defaultColWidth: 100,
                defaultRowHeight: 28,
                maxRows: 10000,
                maxCols: 702,
                maxUndo: 100,
                ...config,
            };

            this._sheets = [{ id: 'sheet1', name: 'Sheet1' }];
            this._activeSheetId = 'sheet1';

            this._cells = new Map();
            this._cellFormats = new Map();
            this._colWidths = new Map();
            this._rowHeights = new Map();
            this._mergedCells = new Map();
            this._conditionalFormats = new Map();
            this._dataValidations = new Map();
            this._charts = new Map();
            this._columnSortStates = new Map();
            this._hiddenCols = new Set();
            this._hiddenRows = new Set();
            this._frozenCols = 0;
            this._frozenRows = 0;

            this._colCount = 26;
            this._rowCount = 100;

            this._history = new window.SpreadsheetCommandHistory(this._config.maxUndo);
            this._namedRanges = new window.NamedRangeStore();
            this._selection = null;
            this._activeCell = null;

            this._listeners = new Map();
            this._formulaEval = new window.SpreadsheetFormulaEvaluator(
                (ref) => this._getCellForEval(ref),
                this._namedRanges
            );
        }

        get history() { return this._history; }
        get namedRanges() { return this._namedRanges; }
        get sheets() { return [...this._sheets]; }
        get activeSheetId() { return this._activeSheetId; }
        get colCount() { return this._colCount; }
        get rowCount() { return this._rowCount; }
        get selection() { return this._selection; }
        get activeCell() { return this._activeCell; }
        get frozenCols() { return this._frozenCols; }
        get frozenRows() { return this._frozenRows; }

        _getCellKey(col, row, sheetId = null) {
            const sheet = sheetId || this._activeSheetId;
            return `${sheet}:${col}:${row}`;
        }

        _parseCellKey(key) {
            const parts = key.split(':');
            return {
                sheetId: parts[0],
                col: parseInt(parts[1], 10),
                row: parseInt(parts[2], 10),
            };
        }

        getCell(col, row, sheetId = null) {
            const key = this._getCellKey(col, row, sheetId);
            return this._cells.get(key) || null;
        }

        getCellFormat(col, row, sheetId = null) {
            const key = this._getCellKey(col, row, sheetId);
            return this._cellFormats.get(key) || { ...window.DEFAULT_CELL_FORMAT };
        }

        getCellRaw(col, row, sheetId = null) {
            const cell = this.getCell(col, row, sheetId);
            return cell ? cell.raw : '';
        }

        getCellValue(col, row, sheetId = null) {
            const cell = this.getCell(col, row, sheetId);
            if (!cell) return null;

            if (cell.type === window.SpreadsheetCellType.FORMULA) {
                const result = this._formulaEval.evaluate(cell.formula);
                cell.evaluate(result.value, result.error);
                return cell.value;
            }

            return cell.value;
        }

        getCellFormattedValue(col, row, sheetId = null) {
            const cell = this.getCell(col, row, sheetId);
            if (!cell) return '';

            if (cell.type === window.SpreadsheetCellType.FORMULA) {
                const result = this._formulaEval.evaluate(cell.formula);
                cell.evaluate(result.value, result.error);
            }

            return cell.formattedValue;
        }

        getCellError(col, row, sheetId = null) {
            const cell = this.getCell(col, row, sheetId);
            if (!cell) return null;
            if (cell.type === window.SpreadsheetCellType.FORMULA) {
                const result = this._formulaEval.evaluate(cell.formula);
                cell.evaluate(result.value, result.error);
            }
            return cell.error;
        }

        setCellRaw(col, row, raw, sheetId = null) {
            const key = this._getCellKey(col, row, sheetId);
            const oldCell = this._cells.get(key);
            const oldRaw = oldCell ? oldCell.raw : '';

            if (oldRaw === raw) return;

            const cell = new window.SpreadsheetCell(raw, this.getCellFormat(col, row, sheetId));
            this._cells.set(key, cell);

            this._history.push(new window.SpreadsheetCommand(
                window.SpreadsheetCommandType.CELL_EDIT,
                {
                    col, row, sheetId: sheetId || this._activeSheetId,
                    oldRaw, newRaw: raw,
                    oldFormat: oldCell ? oldCell.format : null,
                    newFormat: cell.format,
                },
                `Edit ${window.SpreadsheetRange.cellRef(col, row)}`
            ));

            this._propagateDependencies(col, row, sheetId);
            this._emit('cellChanged', { col, row, sheetId });
        }

        setCellFormat(col, row, formatKey, formatValue, sheetId = null) {
            const key = this._getCellKey(col, row, sheetId);
            const cell = this._cells.get(key) || new window.SpreadsheetCell('', {});
            const oldFormat = { ...cell.format };
            cell.setFormat(formatKey, formatValue);
            this._cellFormats.set(key, { ...cell.format });

            this._history.push(new window.SpreadsheetCommand(
                window.SpreadsheetCommandType.CELL_FORMAT,
                {
                    col, row, sheetId: sheetId || this._activeSheetId,
                    oldFormat, newFormat: { ...cell.format },
                    formatKey, formatValue,
                },
                `Format ${window.SpreadsheetRange.cellRef(col, row)}`
            ));

            this._emit('cellFormatChanged', { col, row, sheetId, formatKey, formatValue });
        }

        setCellFormats(col, row, formats, sheetId = null) {
            const key = this._getCellKey(col, row, sheetId);
            const cell = this._cells.get(key) || new window.SpreadsheetCell('', {});
            const oldFormat = { ...cell.format };
            cell.setFormats(formats);
            this._cellFormats.set(key, { ...cell.format });

            this._history.push(new window.SpreadsheetCommand(
                window.SpreadsheetCommandType.CELL_FORMAT,
                {
                    col, row, sheetId: sheetId || this._activeSheetId,
                    oldFormat, newFormat: { ...cell.format },
                    formatKey: 'multiple', formatValue: formats,
                },
                `Format ${window.SpreadsheetRange.cellRef(col, row)}`
            ));

            this._emit('cellFormatChanged', { col, row, sheetId });
        }

        deleteCell(col, row, sheetId = null) {
            const key = this._getCellKey(col, row, sheetId);
            const oldCell = this._cells.get(key);
            if (!oldCell) return;

            const oldRaw = oldCell.raw;
            const oldFormat = { ...oldCell.format };
            this._cells.delete(key);
            this._cellFormats.delete(key);

            this._history.push(new window.SpreadsheetCommand(
                window.SpreadsheetCommandType.CELL_DELETE,
                {
                    col, row, sheetId: sheetId || this._activeSheetId,
                    oldRaw, oldFormat,
                },
                `Delete ${window.SpreadsheetRange.cellRef(col, row)}`
            ));

            this._propagateDependencies(col, row, sheetId);
            this._emit('cellDeleted', { col, row, sheetId });
        }

        setSelection(zone) {
            this._selection = zone;
            this._activeCell = zone ? zone.anchor : null;
            this._emit('selectionChanged', { zone });
        }

        setActiveCell(col, row) {
            this._activeCell = { col, row };
            this._selection = window.SelectionZone.fromSingleCell(
                window.SpreadsheetRange.cellRef(col, row)
            );
            this._emit('activeCellChanged', { col, row });
        }

        setColWidth(col, width) {
            const oldWidth = this._colWidths.get(col) || this._config.defaultColWidth;
            this._colWidths.set(col, Math.max(30, width));

            this._history.push(new window.SpreadsheetCommand(
                window.SpreadsheetCommandType.COL_RESIZE,
                { col, oldWidth, newWidth: width },
                `Resize column ${window.SpreadsheetRange.colToLetter(col)}`
            ));

            this._emit('colWidthChanged', { col, width });
        }

        getColWidth(col) {
            return this._colWidths.get(col) || this._config.defaultColWidth;
        }

        setRowHeight(row, height) {
            const oldHeight = this._rowHeights.get(row) || this._config.defaultRowHeight;
            this._rowHeights.set(row, Math.max(18, height));

            this._history.push(new window.SpreadsheetCommand(
                window.SpreadsheetCommandType.ROW_RESIZE,
                { row, oldHeight, newHeight: height },
                `Resize row ${row + 1}`
            ));

            this._emit('rowHeightChanged', { row, height });
        }

        getRowHeight(row) {
            return this._rowHeights.get(row) || this._config.defaultRowHeight;
        }

        insertCol(col, count = 1) {
            for (let i = 0; i < count; i++) {
                this._shiftCellsRight(col);
            }

            this._history.push(new window.SpreadsheetCommand(
                window.SpreadsheetCommandType.COL_INSERT,
                { col, count },
                `Insert ${count} column(s) at ${window.SpreadsheetRange.colToLetter(col)}`
            ));

            this._colCount += count;
            this._emit('colInserted', { col, count });
        }

        deleteCol(col, count = 1) {
            for (let i = 0; i < count; i++) {
                this._shiftCellsLeft(col);
            }

            this._history.push(new window.SpreadsheetCommand(
                window.SpreadsheetCommandType.COL_DELETE,
                { col, count },
                `Delete ${count} column(s) at ${window.SpreadsheetRange.colToLetter(col)}`
            ));

            this._colCount = Math.max(1, this._colCount - count);
            this._emit('colDeleted', { col, count });
        }

        insertRow(row, count = 1) {
            for (let i = 0; i < count; i++) {
                this._shiftCellsDown(row);
            }

            this._history.push(new window.SpreadsheetCommand(
                window.SpreadsheetCommandType.ROW_INSERT,
                { row, count },
                `Insert ${count} row(s) at ${row + 1}`
            ));

            this._rowCount += count;
            this._emit('rowInserted', { row, count });
        }

        deleteRow(row, count = 1) {
            for (let i = 0; i < count; i++) {
                this._shiftCellsUp(row);
            }

            this._history.push(new window.SpreadsheetCommand(
                window.SpreadsheetCommandType.ROW_DELETE,
                { row, count },
                `Delete ${count} row(s) at ${row + 1}`
            ));

            this._rowCount = Math.max(1, this._rowCount - count);
            this._emit('rowDeleted', { row, count });
        }

        _shiftCellsRight(fromCol) {
            for (let r = this._rowCount - 1; r >= 0; r--) {
                for (let c = this._colCount - 1; c >= fromCol; c--) {
                    const oldKey = this._getCellKey(c, r);
                    const newKey = this._getCellKey(c + 1, r);
                    if (this._cells.has(oldKey)) {
                        this._cells.set(newKey, this._cells.get(oldKey));
                        this._cells.delete(oldKey);
                    }
                    if (this._cellFormats.has(oldKey)) {
                        this._cellFormats.set(newKey, this._cellFormats.get(oldKey));
                        this._cellFormats.delete(oldKey);
                    }
                }
            }
        }

        _shiftCellsLeft(fromCol) {
            for (let r = 0; r < this._rowCount; r++) {
                for (let c = fromCol; c < this._colCount; c++) {
                    const oldKey = this._getCellKey(c, r);
                    const newKey = this._getCellKey(c - 1, r);
                    if (this._cells.has(oldKey)) {
                        this._cells.set(newKey, this._cells.get(oldKey));
                        this._cells.delete(oldKey);
                    }
                    if (this._cellFormats.has(oldKey)) {
                        this._cellFormats.set(newKey, this._cellFormats.get(oldKey));
                        this._cellFormats.delete(oldKey);
                    }
                }
            }
        }

        _shiftCellsDown(fromRow) {
            for (let c = this._colCount - 1; c >= 0; c--) {
                for (let r = this._rowCount - 1; r >= fromRow; r--) {
                    const oldKey = this._getCellKey(c, r);
                    const newKey = this._getCellKey(c, r + 1);
                    if (this._cells.has(oldKey)) {
                        this._cells.set(newKey, this._cells.get(oldKey));
                        this._cells.delete(oldKey);
                    }
                    if (this._cellFormats.has(oldKey)) {
                        this._cellFormats.set(newKey, this._cellFormats.get(oldKey));
                        this._cellFormats.delete(oldKey);
                    }
                }
            }
        }

        _shiftCellsUp(fromRow) {
            for (let c = 0; c < this._colCount; c++) {
                for (let r = fromRow; r < this._rowCount; r++) {
                    const oldKey = this._getCellKey(c, r);
                    const newKey = this._getCellKey(c, r - 1);
                    if (this._cells.has(oldKey)) {
                        this._cells.set(newKey, this._cells.get(oldKey));
                        this._cells.delete(oldKey);
                    }
                    if (this._cellFormats.has(oldKey)) {
                        this._cellFormats.set(newKey, this._cellFormats.get(oldKey));
                        this._cellFormats.delete(oldKey);
                    }
                }
            }
        }

        setFrozenPane(col, row) {
            this._frozenCols = col;
            this._frozenRows = row;
            this._emit('freezeChanged', { col, row });
        }

        sortColumn(col, direction = 'asc') {
            const rows = [];
            for (let r = 0; r < this._rowCount; r++) {
                const cellData = {};
                for (let c = 0; c < this._colCount; c++) {
                    const key = this._getCellKey(c, r);
                    cellData[c] = {
                        cell: this._cells.get(key),
                        format: this._cellFormats.get(key),
                    };
                }
                rows.push({ row: r, data: cellData, sortValue: this.getCellValue(col, r) });
            }

            rows.sort((a, b) => {
                const va = a.sortValue;
                const vb = b.sortValue;
                if (va === null || va === undefined) return 1;
                if (vb === null || vb === undefined) return -1;
                if (typeof va === 'number' && typeof vb === 'number') {
                    return direction === 'asc' ? va - vb : vb - va;
                }
                const cmp = String(va).localeCompare(String(vb));
                return direction === 'asc' ? cmp : -cmp;
            });

            for (let r = 0; r < rows.length; r++) {
                const srcRow = rows[r].row;
                if (srcRow === r) continue;
                for (let c = 0; c < this._colCount; c++) {
                    const srcKey = this._getCellKey(c, srcRow);
                    const dstKey = this._getCellKey(c, r);
                    if (rows[r].data[c].cell) {
                        this._cells.set(dstKey, rows[r].data[c].cell);
                    } else {
                        this._cells.delete(dstKey);
                    }
                    if (rows[r].data[c].format) {
                        this._cellFormats.set(dstKey, rows[r].data[c].format);
                    } else {
                        this._cellFormats.delete(dstKey);
                    }
                }
            }

            this._columnSortStates.set(col, direction);
            this._history.push(new window.SpreadsheetCommand(
                window.SpreadsheetCommandType.SORT,
                { col, direction },
                `Sort column ${window.SpreadsheetRange.colToLetter(col)} ${direction}`
            ));

            this._emit('sorted', { col, direction });
        }

        setMergedCells(rangeStr, merge = true) {
            const parsed = window.SpreadsheetRange.parseRange(rangeStr);
            if (!parsed) return;

            if (merge) {
                this._mergedCells.set(rangeStr, parsed);
            } else {
                for (const [key, val] of this._mergedCells) {
                    if (val.startCol === parsed.startCol && val.startRow === parsed.startRow &&
                        val.endCol === parsed.endCol && val.endRow === parsed.endRow) {
                        this._mergedCells.delete(key);
                        break;
                    }
                }
            }
            this._emit('mergeChanged', { rangeStr, merge });
        }

        addChart(chartConfig) {
            const id = chartConfig.id || 'chart_' + Date.now();
            const chart = { id, ...chartConfig };
            this._charts.set(id, chart);

            this._history.push(new window.SpreadsheetCommand(
                window.SpreadsheetCommandType.CHART_ADD,
                { chart },
                `Add chart: ${chart.title}`
            ));

            this._emit('chartAdded', { chart });
            return chart;
        }

        updateChart(id, updates) {
            const chart = this._charts.get(id);
            if (!chart) return;
            const oldChart = { ...chart };
            Object.assign(chart, updates);

            this._history.push(new window.SpreadsheetCommand(
                window.SpreadsheetCommandType.CHART_UPDATE,
                { id, oldChart, newChart: { ...chart } },
                `Update chart: ${chart.title}`
            ));

            this._emit('chartUpdated', { chart });
        }

        removeChart(id) {
            const chart = this._charts.get(id);
            if (!chart) return;
            this._charts.delete(id);

            this._history.push(new window.SpreadsheetCommand(
                window.SpreadsheetCommandType.CHART_DELETE,
                { chart },
                `Remove chart: ${chart.title}`
            ));

            this._emit('chartRemoved', { id });
        }

        getCharts() {
            return [...this._charts.values()];
        }

        addSheet(name = null) {
            const id = 'sheet' + (this._sheets.length + 1);
            const sheetName = name || `Sheet${this._sheets.length + 1}`;
            this._sheets.push({ id, name: sheetName });

            this._history.push(new window.SpreadsheetCommand(
                window.SpreadsheetCommandType.SHEET_ADD,
                { id, name: sheetName },
                `Add sheet: ${sheetName}`
            ));

            this._emit('sheetAdded', { id, name: sheetName });
            return { id, name: sheetName };
        }

        renameSheet(id, newName) {
            const sheet = this._sheets.find(s => s.id === id);
            if (!sheet) return;
            const oldName = sheet.name;
            sheet.name = newName;

            this._history.push(new window.SpreadsheetCommand(
                window.SpreadsheetCommandType.SHEET_RENAME,
                { id, oldName, newName },
                `Rename sheet: ${oldName} → ${newName}`
            ));

            this._emit('sheetRenamed', { id, oldName, newName });
        }

        deleteSheet(id) {
            if (this._sheets.length <= 1) return;
            const idx = this._sheets.findIndex(s => s.id === id);
            if (idx < 0) return;
            const sheet = this._sheets.splice(idx, 1)[0];

            for (const [key] of this._cells) {
                if (key.startsWith(id + ':')) this._cells.delete(key);
            }
            for (const [key] of this._cellFormats) {
                if (key.startsWith(id + ':')) this._cellFormats.delete(key);
            }

            if (this._activeSheetId === id) {
                this._activeSheetId = this._sheets[0].id;
            }

            this._history.push(new window.SpreadsheetCommand(
                window.SpreadsheetCommandType.SHEET_DELETE,
                { sheet },
                `Delete sheet: ${sheet.name}`
            ));

            this._emit('sheetDeleted', { id, sheet });
        }

        setActiveSheet(id) {
            if (this._sheets.find(s => s.id === id)) {
                const oldId = this._activeSheetId;
                this._activeSheetId = id;
                this._formulaEval.clearCache();

                this._history.push(new window.SpreadsheetCommand(
                    window.SpreadsheetCommandType.SHEET_ACTIVATE,
                    { oldId, newId: id },
                    `Switch to ${this._sheets.find(s => s.id === id)?.name}`
                ));

                this._emit('sheetActivated', { id });
            }
        }

        undo() {
            const cmd = this._history.undo();
            if (!cmd) return null;
            this._applyUndo(cmd);
            return cmd;
        }

        redo() {
            const cmd = this._history.redo();
            if (!cmd) return null;
            this._applyRedo(cmd);
            return cmd;
        }

        _applyUndo(cmd) {
            const p = cmd.payload;
            switch (cmd.type) {
                case window.SpreadsheetCommandType.CELL_EDIT:
                    if (p.oldRaw) {
                        const cell = new window.SpreadsheetCell(p.oldRaw, p.oldFormat || {});
                        this._cells.set(this._getCellKey(p.col, p.row, p.sheetId), cell);
                    } else {
                        this._cells.delete(this._getCellKey(p.col, p.row, p.sheetId));
                    }
                    this._formulaEval.clearCache();
                    break;
                case window.SpreadsheetCommandType.CELL_FORMAT:
                    const fKey = this._getCellKey(p.col, p.row, p.sheetId);
                    const fCell = this._cells.get(fKey);
                    if (fCell) {
                        fCell.setFormats(p.oldFormat);
                        this._cellFormats.set(fKey, { ...p.oldFormat });
                    }
                    break;
                case window.SpreadsheetCommandType.CELL_DELETE:
                    const dCell = new window.SpreadsheetCell(p.oldRaw, p.oldFormat || {});
                    this._cells.set(this._getCellKey(p.col, p.row, p.sheetId), dCell);
                    this._formulaEval.clearCache();
                    break;
                case window.SpreadsheetCommandType.COL_RESIZE:
                    if (p.oldWidth) this._colWidths.set(p.col, p.oldWidth);
                    break;
                case window.SpreadsheetCommandType.ROW_RESIZE:
                    if (p.oldHeight) this._rowHeights.set(p.row, p.oldHeight);
                    break;
                case 'batch':
                    if (p.commands) {
                        for (let i = p.commands.length - 1; i >= 0; i--) {
                            this._applyUndo(p.commands[i]);
                        }
                    }
                    break;
            }
            this._emit('stateChanged', { reason: 'undo' });
        }

        _applyRedo(cmd) {
            const p = cmd.payload;
            switch (cmd.type) {
                case window.SpreadsheetCommandType.CELL_EDIT:
                    const cell = new window.SpreadsheetCell(p.newRaw, p.newFormat || {});
                    this._cells.set(this._getCellKey(p.col, p.row, p.sheetId), cell);
                    this._formulaEval.clearCache();
                    break;
                case window.SpreadsheetCommandType.CELL_FORMAT:
                    const fKey = this._getCellKey(p.col, p.row, p.sheetId);
                    const fCell = this._cells.get(fKey);
                    if (fCell) {
                        fCell.setFormats(p.newFormat);
                        this._cellFormats.set(fKey, { ...p.newFormat });
                    }
                    break;
                case window.SpreadsheetCommandType.CELL_DELETE:
                    this._cells.delete(this._getCellKey(p.col, p.row, p.sheetId));
                    this._formulaEval.clearCache();
                    break;
                case window.SpreadsheetCommandType.COL_RESIZE:
                    this._colWidths.set(p.col, p.newWidth);
                    break;
                case window.SpreadsheetCommandType.ROW_RESIZE:
                    this._rowHeights.set(p.row, p.newHeight);
                    break;
                case 'batch':
                    if (p.commands) {
                        for (const sub of p.commands) {
                            this._applyRedo(sub);
                        }
                    }
                    break;
            }
            this._emit('stateChanged', { reason: 'redo' });
        }

        _getCellForEval(ref) {
            const pos = window.SpreadsheetRange.parseCellRef(ref);
            if (!pos) return null;
            return this.getCell(pos.col, pos.row);
        }

        _propagateDependencies(col, row, sheetId) {
            this._formulaEval.clearCache();
        }

        on(event, callback) {
            if (!this._listeners.has(event)) {
                this._listeners.set(event, new Set());
            }
            this._listeners.get(event).add(callback);
            return () => this._listeners.get(event)?.delete(callback);
        }

        off(event, callback) {
            this._listeners.get(event)?.delete(callback);
        }

        _emit(event, data) {
            const listeners = this._listeners.get(event);
            if (listeners) {
                for (const cb of listeners) {
                    try { cb(data); } catch (e) { console.error(`Event ${event} error:`, e); }
                }
            }
        }

        toJSON() {
            const data = {
                sheets: this._sheets,
                activeSheetId: this._activeSheetId,
                cells: {},
                colWidths: {},
                rowHeights: {},
                mergedCells: [...this._mergedCells.entries()],
                charts: [...this._charts.entries()],
                frozenCols: this._frozenCols,
                frozenRows: this._frozenRows,
                namedRanges: this._namedRanges.getAll().map(nr => ({
                    name: nr.name, range: nr.range, sheetId: nr.sheetId,
                })),
            };

            for (const [key, cell] of this._cells) {
                data.cells[key] = cell.toJSON();
            }

            for (const [col, width] of this._colWidths) {
                data.colWidths[col] = width;
            }

            for (const [row, height] of this._rowHeights) {
                data.rowHeights[row] = height;
            }

            return data;
        }

        fromJSON(data) {
            this._sheets = data.sheets || [{ id: 'sheet1', name: 'Sheet1' }];
            this._activeSheetId = data.activeSheetId || 'sheet1';
            this._cells.clear();
            this._cellFormats.clear();
            this._colWidths.clear();
            this._rowHeights.clear();
            this._mergedCells.clear();
            this._charts.clear();
            this._frozenCols = data.frozenCols || 0;
            this._frozenRows = data.frozenRows || 0;

            if (data.cells) {
                for (const [key, cellData] of Object.entries(data.cells)) {
                    const cell = window.SpreadsheetCell.fromJSON(cellData);
                    this._cells.set(key, cell);
                }
            }

            if (data.colWidths) {
                for (const [col, width] of Object.entries(data.colWidths)) {
                    this._colWidths.set(parseInt(col, 10), width);
                }
            }

            if (data.rowHeights) {
                for (const [row, height] of Object.entries(data.rowHeights)) {
                    this._rowHeights.set(parseInt(row, 10), height);
                }
            }

            if (data.mergedCells) {
                for (const [rangeStr, parsed] of data.mergedCells) {
                    this._mergedCells.set(rangeStr, parsed);
                }
            }

            if (data.charts) {
                for (const [id, chart] of data.charts) {
                    this._charts.set(id, chart);
                }
            }

            if (data.namedRanges) {
                for (const nr of data.namedRanges) {
                    this._namedRanges.add(nr.name, nr.range, nr.sheetId);
                }
            }

            this._formulaEval.clearCache();
            this._emit('dataLoaded', {});
        }

        clearAll() {
            this._cells.clear();
            this._cellFormats.clear();
            this._mergedCells.clear();
            this._charts.clear();
            this._colWidths.clear();
            this._rowHeights.clear();
            this._hiddenCols.clear();
            this._hiddenRows.clear();
            this._columnSortStates.clear();
            this._frozenCols = 0;
            this._frozenRows = 0;
            this._formulaEval.clearCache();
            this._history.clear();
            this._emit('dataCleared', {});
        }
    }

    window.SpreadsheetModel = SpreadsheetModel;
})();
