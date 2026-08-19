/**
 * Range Parser - A1/R1C1 notation, named ranges, range expansion
 * Follows Odoo o-spreadsheet range model pattern
 */
(function() {
    'use strict';

    const COLUMN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    class SpreadsheetRange {
        static colToLetter(col) {
            let result = '';
            let c = col;
            while (c >= 0) {
                result = COLUMN_LETTERS[c % 26] + result;
                c = Math.floor(c / 26) - 1;
            }
            return result;
        }

        static letterToCol(letters) {
            let result = 0;
            for (let i = 0; i < letters.length; i++) {
                result = result * 26 + (letters.charCodeAt(i) - 64);
            }
            return result - 1;
        }

        static parseCellRef(ref) {
            const match = ref.match(/^([A-Z]+)(\d+)$/);
            if (!match) return null;
            return {
                col: this.letterToCol(match[1]),
                row: parseInt(match[2], 10) - 1,
            };
        }

        static cellRef(col, row) {
            return this.colToLetter(col) + (row + 1);
        }

        static parseRange(rangeStr) {
            const parts = rangeStr.split(':');
            if (parts.length !== 2) return null;

            const start = this.parseCellRef(parts[0].trim());
            const end = this.parseCellRef(parts[1].trim());

            if (!start || !end) return null;

            return {
                startCol: Math.min(start.col, end.col),
                startRow: Math.min(start.row, end.row),
                endCol: Math.max(start.col, end.col),
                endRow: Math.max(start.row, end.row),
            };
        }

        static expandRange(rangeStr) {
            const parsed = this.parseRange(rangeStr);
            if (!parsed) return [];

            const cells = [];
            for (let r = parsed.startRow; r <= parsed.endRow; r++) {
                for (let c = parsed.startCol; c <= parsed.endCol; c++) {
                    cells.push(this.cellRef(c, r));
                }
            }
            return cells;
        }

        static isRange(ref) {
            return /^[A-Z]+\d+:[A-Z]+\d+$/.test(ref.trim());
        }

        static isCellRef(ref) {
            return /^[A-Z]+\d+$/.test(ref.trim());
        }

        static parseMultiRange(rangeStr) {
            return rangeStr.split(',').map(r => r.trim()).filter(r => r);
        }

        static getRangeSize(rangeStr) {
            const parsed = this.parseRange(rangeStr);
            if (!parsed) return { cols: 0, rows: 0 };
            return {
                cols: parsed.endCol - parsed.startCol + 1,
                rows: parsed.endRow - parsed.startRow + 1,
            };
        }

        static shiftRange(rangeStr, colOffset, rowOffset) {
            const parsed = this.parseRange(rangeStr);
            if (!parsed) return rangeStr;

            const newStart = this.cellRef(
                parsed.startCol + colOffset,
                parsed.startRow + rowOffset
            );
            const newEnd = this.cellRef(
                parsed.endCol + colOffset,
                parsed.endRow + rowOffset
            );
            return `${newStart}:${newEnd}`;
        }

        static adjustFormulaRefs(formula, colOffset, rowOffset) {
            return formula.replace(/\b([A-Z]+)(\d+)\b/g, (match, col, row) => {
                const newCol = this.letterToCol(col) + colOffset;
                const newRow = parseInt(row, 10) - 1 + rowOffset;
                if (newCol < 0 || newRow < 0) return '#REF!';
                return this.cellRef(newCol, newRow);
            });
        }
    }

    class NamedRange {
        constructor(name, rangeStr, sheetId = null) {
            this.name = name.toUpperCase();
            this.range = rangeStr;
            this.sheetId = sheetId;
        }

        expand() {
            return SpreadsheetRange.expandRange(this.range);
        }
    }

    class NamedRangeStore {
        constructor() {
            this._ranges = new Map();
        }

        add(name, rangeStr, sheetId = null) {
            const named = new NamedRange(name, rangeStr, sheetId);
            this._ranges.set(named.name, named);
            return named;
        }

        get(name) {
            return this._ranges.get(name.toUpperCase()) || null;
        }

        remove(name) {
            return this._ranges.delete(name.toUpperCase());
        }

        has(name) {
            return this._ranges.has(name.toUpperCase());
        }

        getAll() {
            return [...this._ranges.values()];
        }

        resolve(ref) {
            if (this.has(ref)) {
                return this.get(ref).expand();
            }
            return null;
        }
    }

    class SelectionZone {
        constructor(startCol, startRow, endCol, endRow) {
            this.startCol = Math.min(startCol, endCol);
            this.startRow = Math.min(startRow, endRow);
            this.endCol = Math.max(startCol, endCol);
            this.endRow = Math.max(startRow, endRow);
        }

        get anchor() {
            return { col: this.startCol, row: this.startRow };
        }

        get head() {
            return { col: this.endCol, row: this.endRow };
        }

        get isSingle() {
            return this.startCol === this.endCol && this.startRow === this.endRow;
        }

        get width() {
            return this.endCol - this.startCol + 1;
        }

        get height() {
            return this.endRow - this.startRow + 1;
        }

        contains(col, row) {
            return col >= this.startCol && col <= this.endCol &&
                   row >= this.startRow && row <= this.endRow;
        }

        cellKeys() {
            const keys = [];
            for (let r = this.startRow; r <= this.endRow; r++) {
                for (let c = this.startCol; c <= this.endCol; c++) {
                    keys.push(`${c}_${r}`);
                }
            }
            return keys;
        }

        cellRefs() {
            const refs = [];
            for (let r = this.startRow; r <= this.endRow; r++) {
                for (let c = this.startCol; c <= this.endCol; c++) {
                    refs.push(SpreadsheetRange.cellRef(c, r));
                }
            }
            return refs;
        }

        static fromCellRefs(ref1, ref2) {
            const a = SpreadsheetRange.parseCellRef(ref1);
            const b = SpreadsheetRange.parseCellRef(ref2);
            if (!a || !b) return null;
            return new SelectionZone(a.col, a.row, b.col, b.row);
        }

        static fromSingleCell(ref) {
            const pos = SpreadsheetRange.parseCellRef(ref);
            if (!pos) return null;
            return new SelectionZone(pos.col, pos.row, pos.col, pos.row);
        }

        overlaps(other) {
            return !(this.endCol < other.startCol || this.startCol > other.endCol ||
                     this.endRow < other.startRow || this.startRow > other.endRow);
        }

        expandToInclude(col, row) {
            return new SelectionZone(
                Math.min(this.startCol, col),
                Math.min(this.startRow, row),
                Math.max(this.endCol, col),
                Math.max(this.endRow, row)
            );
        }

        toString() {
            if (this.isSingle) {
                return SpreadsheetRange.cellRef(this.startCol, this.startRow);
            }
            return `${SpreadsheetRange.cellRef(this.startCol, this.startRow)}:${SpreadsheetRange.cellRef(this.endCol, this.endRow)}`;
        }
    }

    window.SpreadsheetRange = SpreadsheetRange;
    window.NamedRange = NamedRange;
    window.NamedRangeStore = NamedRangeStore;
    window.SelectionZone = SelectionZone;
})();
