/**
 * Multi-Sheet - Per-sheet data isolation, cross-sheet formula refs
 */
(function() {
    'use strict';

    class SheetManager {
        constructor(model) {
            this._model = model;
            this._sheets = new Map();
            this._activeSheetId = null;
            this._sheetOrder = [];
        }

        get activeSheetId() { return this._activeSheetId; }
        get sheets() { return this._sheetOrder.map(id => this._sheets.get(id)).filter(Boolean); }

        addSheet(config = {}) {
            const id = config.id || 'sheet_' + Date.now();
            const sheet = {
                id,
                name: config.name || `Sheet${this._sheets.size + 1}`,
                cells: new Map(),
                cellFormats: new Map(),
                colWidths: new Map(),
                rowHeights: new Map(),
                mergedCells: new Map(),
                hiddenCols: new Set(),
                hiddenRows: new Set(),
                frozenCols: 0,
                frozenRows: 0,
                colCount: config.colCount || 26,
                rowCount: config.rowCount || 100,
                tabColor: config.tabColor || '',
                protection: config.protection || false,
                protectionPassword: config.protectionPassword || '',
            };

            this._sheets.set(id, sheet);
            this._sheetOrder.push(id);

            return sheet;
        }

        removeSheet(id) {
            if (this._sheets.size <= 1) return false;
            const idx = this._sheetOrder.indexOf(id);
            if (idx < 0) return false;

            this._sheets.delete(id);
            this._sheetOrder.splice(idx, 1);

            if (this._activeSheetId === id) {
                this._activeSheetId = this._sheetOrder[Math.min(idx, this._sheetOrder.length - 1)];
            }

            return true;
        }

        renameSheet(id, newName) {
            const sheet = this._sheets.get(id);
            if (!sheet) return false;
            sheet.name = newName;
            return true;
        }

        activateSheet(id) {
            if (!this._sheets.has(id)) return false;
            this._activeSheetId = id;
            return true;
        }

        getSheet(id) {
            return this._sheets.get(id) || null;
        }

        getActiveSheet() {
            return this._sheets.get(this._activeSheetId) || null;
        }

        duplicateSheet(id, newName) {
            const source = this._sheets.get(id);
            if (!source) return null;

            const newId = 'sheet_' + Date.now();
            const sheet = {
                ...source,
                id: newId,
                name: newName || `${source.name} (Copy)`,
                cells: new Map([...source.cells].map(([k, v]) => [k, v.clone ? v.clone() : { ...v }])),
                cellFormats: new Map([...source.cellFormats].map(([k, v]) => [k, { ...v }])),
                colWidths: new Map(source.colWidths),
                rowHeights: new Map(source.rowHeights),
                mergedCells: new Map(source.mergedCells),
                hiddenCols: new Set(source.hiddenCols),
                hiddenRows: new Set(source.hiddenRows),
            };

            this._sheets.set(newId, sheet);
            const idx = this._sheetOrder.indexOf(id);
            this._sheetOrder.splice(idx + 1, 0, newId);

            return sheet;
        }

        moveSheet(id, newIndex) {
            const idx = this._sheetOrder.indexOf(id);
            if (idx < 0) return false;
            this._sheetOrder.splice(idx, 1);
            this._sheetOrder.splice(newIndex, 0, id);
            return true;
        }

        setTabColor(id, color) {
            const sheet = this._sheets.get(id);
            if (sheet) sheet.tabColor = color;
        }

        getCellFromSheet(sheetId, col, row) {
            const sheet = this._sheets.get(sheetId);
            if (!sheet) return null;
            const key = `${col}:${row}`;
            return sheet.cells.get(key) || null;
        }

        setCellInSheet(sheetId, col, row, cell) {
            const sheet = this._sheets.get(sheetId);
            if (!sheet) return;
            const key = `${col}:${row}`;
            sheet.cells.set(key, cell);
        }

        getCellFormatFromSheet(sheetId, col, row) {
            const sheet = this._sheets.get(sheetId);
            if (!sheet) return null;
            const key = `${col}:${row}`;
            return sheet.cellFormats.get(key) || null;
        }

        setCellFormatInSheet(sheetId, col, row, format) {
            const sheet = this._sheets.get(sheetId);
            if (!sheet) return;
            const key = `${col}:${row}`;
            sheet.cellFormats.set(key, format);
        }

        resolveCrossSheetRef(ref) {
            const match = ref.match(/^([A-Za-z0-9_]+)!\s*([A-Z]+\d+)$/i);
            if (!match) return null;

            const sheetName = match[1];
            const cellRef = match[2];

            const sheet = this.sheets.find(s =>
                s.name.toLowerCase() === sheetName.toLowerCase() ||
                s.id.toLowerCase() === sheetName.toLowerCase()
            );

            if (!sheet) return null;

            const pos = window.SpreadsheetRange.parseCellRef(cellRef);
            if (!pos) return null;

            return {
                sheetId: sheet.id,
                col: pos.col,
                row: pos.row,
            };
        }

        expandCrossSheetRange(rangeStr) {
            const match = rangeStr.match(/^([A-Za-z0-9_]+)!\s*([A-Z]+\d+):([A-Z]+\d+)$/i);
            if (!match) return [];

            const sheetName = match[1];
            const startRef = match[2];
            const endRef = match[3];

            const sheet = this.sheets.find(s =>
                s.name.toLowerCase() === sheetName.toLowerCase() ||
                s.id.toLowerCase() === sheetName.toLowerCase()
            );

            if (!sheet) return [];

            const start = window.SpreadsheetRange.parseCellRef(startRef);
            const end = window.SpreadsheetRange.parseCellRef(endRef);
            if (!start || !end) return [];

            const cells = [];
            for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
                for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
                    cells.push({ sheetId: sheet.id, col: c, row: r });
                }
            }
            return cells;
        }

        getCellValuesAcrossSheets(cellRef) {
            const results = [];
            for (const sheet of this.sheets) {
                const pos = window.SpreadsheetRange.parseCellRef(cellRef);
                if (pos) {
                    const cell = this.getCellFromSheet(sheet.id, pos.col, pos.row);
                    if (cell) {
                        results.push({
                            sheetId: sheet.id,
                            sheetName: sheet.name,
                            value: cell.value || cell.raw,
                        });
                    }
                }
            }
            return results;
        }

        exportJSON() {
            const sheetsData = {};
            for (const [id, sheet] of this._sheets) {
                const cellsData = {};
                for (const [key, cell] of sheet.cells) {
                    cellsData[key] = cell.toJSON ? cell.toJSON() : cell;
                }
                sheetsData[id] = {
                    name: sheet.name,
                    cells: cellsData,
                    cellFormats: Object.fromEntries(sheet.cellFormats),
                    colWidths: Object.fromEntries(sheet.colWidths),
                    rowHeights: Object.fromEntries(sheet.rowHeights),
                    mergedCells: Object.fromEntries(sheet.mergedCells),
                    hiddenCols: [...sheet.hiddenCols],
                    hiddenRows: [...sheet.hiddenRows],
                    frozenCols: sheet.frozenCols,
                    frozenRows: sheet.frozenRows,
                    colCount: sheet.colCount,
                    rowCount: sheet.rowCount,
                    tabColor: sheet.tabColor,
                };
            }
            return {
                activeSheetId: this._activeSheetId,
                sheetOrder: this._sheetOrder,
                sheets: sheetsData,
            };
        }

        importJSON(data) {
            this._sheets.clear();
            this._sheetOrder = [];

            if (data.sheetOrder) {
                this._sheetOrder = [...data.sheetOrder];
            }

            if (data.sheets) {
                for (const [id, sheetData] of Object.entries(data.sheets)) {
                    const sheet = {
                        id,
                        name: sheetData.name || id,
                        cells: new Map(),
                        cellFormats: new Map(),
                        colWidths: new Map(),
                        rowHeights: new Map(),
                        mergedCells: new Map(),
                        hiddenCols: new Set(),
                        hiddenRows: new Set(),
                        frozenCols: sheetData.frozenCols || 0,
                        frozenRows: sheetData.frozenRows || 0,
                        colCount: sheetData.colCount || 26,
                        rowCount: sheetData.rowCount || 100,
                        tabColor: sheetData.tabColor || '',
                    };

                    if (sheetData.cells) {
                        for (const [key, cellData] of Object.entries(sheetData.cells)) {
                            const cell = window.SpreadsheetCell.fromJSON(cellData);
                            sheet.cells.set(key, cell);
                        }
                    }

                    if (sheetData.cellFormats) {
                        for (const [key, fmt] of Object.entries(sheetData.cellFormats)) {
                            sheet.cellFormats.set(key, fmt);
                        }
                    }

                    if (sheetData.colWidths) {
                        for (const [key, val] of Object.entries(sheetData.colWidths)) {
                            sheet.colWidths.set(parseInt(key), val);
                        }
                    }

                    if (sheetData.rowHeights) {
                        for (const [key, val] of Object.entries(sheetData.rowHeights)) {
                            sheet.rowHeights.set(parseInt(key), val);
                        }
                    }

                    if (sheetData.hiddenCols) {
                        sheet.hiddenCols = new Set(sheetData.hiddenCols);
                    }

                    if (sheetData.hiddenRows) {
                        sheet.hiddenRows = new Set(sheetData.hiddenRows);
                    }

                    this._sheets.set(id, sheet);
                    if (!this._sheetOrder.includes(id)) {
                        this._sheetOrder.push(id);
                    }
                }
            }

            this._activeSheetId = data.activeSheetId || this._sheetOrder[0] || 'sheet1';
        }

        toJSON() {
            return this.exportJSON();
        }

        fromJSON(data) {
            this.importJSON(data);
        }
    }

    window.SpreadsheetSheetManager = SheetManager;
})();
