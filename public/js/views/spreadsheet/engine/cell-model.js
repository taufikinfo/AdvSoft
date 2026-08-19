/**
 * Cell Model - Typed cells with format and style
 * Follows Odoo o-spreadsheet cell model pattern
 */
(function() {
    'use strict';

    const CellType = Object.freeze({
        EMPTY: 'empty',
        NUMBER: 'number',
        STRING: 'string',
        BOOLEAN: 'boolean',
        DATE: 'date',
        ERROR: 'error',
        FORMULA: 'formula',
    });

    const DEFAULT_CELL_FORMAT = Object.freeze({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        fontSize: 11,
        fontFamily: 'Arial',
        color: '#000000',
        bgColor: '',
        align: 'left',
        verticalAlign: 'middle',
        numberFormat: 'general',
        decimalPlaces: 2,
        currencySymbol: '$',
        dateFormat: 'YYYY-MM-DD',
        borderTop: false,
        borderBottom: false,
        borderLeft: false,
        borderRight: false,
        borderColor: '#000000',
        wrap: false,
    });

    class Cell {
        constructor(raw = '', format = {}) {
            this._raw = raw;
            this.format = { ...DEFAULT_CELL_FORMAT, ...format };
            this._type = CellType.EMPTY;
            this._value = null;
            this._error = null;
            this._formula = null;
            this._dependencies = [];
            this._dependentCells = new Set();
            this._evaluated = false;
            this._formattedValue = '';
            this._parse();
        }

        get raw() { return this._raw; }
        set raw(newRaw) {
            if (this._raw !== newRaw) {
                this._raw = newRaw;
                this._parse();
            }
        }

        get type() { return this._type; }
        get value() { return this._value; }
        get error() { return this._error; }
        get formula() { return this._formula; }
        get dependencies() { return [...this._dependencies]; }
        get dependentCells() { return new Set(this._dependentCells); }
        get evaluated() { return this._evaluated; }

        get formattedValue() {
            if (this._error) return this._error;
            if (this._value === null || this._value === undefined) return '';
            if (this._type === CellType.FORMULA && !this._evaluated) return '';
            return this._formatValue(this._value);
        }

        _parse() {
            const raw = String(this._raw).trim();
            this._error = null;
            this._formula = null;
            this._dependencies = [];
            this._evaluated = false;
            this._value = null;

            if (raw === '') {
                this._type = CellType.EMPTY;
                return;
            }

            if (raw.startsWith('=')) {
                this._type = CellType.FORMULA;
                this._formula = raw.substring(1);
                this._extractDependencies();
                return;
            }

            if (raw === 'TRUE' || raw === 'FALSE') {
                this._type = CellType.BOOLEAN;
                this._value = raw === 'TRUE';
                return;
            }

            const num = Number(raw);
            if (!isNaN(num) && raw !== '') {
                this._type = CellType.NUMBER;
                this._value = num;
                return;
            }

            if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
                this._type = CellType.DATE;
                this._value = raw;
                return;
            }

            this._type = CellType.STRING;
            this._value = raw;
        }

        _extractDependencies() {
            if (!this._formula) return;
            const refRegex = /\b([A-Z]+\d+)\b/g;
            const rangeRegex = /\b([A-Z]+\d+):([A-Z]+\d+)\b/g;
            const deps = new Set();

            let match;
            const fullFormula = this._formula;
            const ranges = [];
            while ((match = rangeRegex.exec(fullFormula)) !== null) {
                ranges.push(match[0]);
                const range = window.SpreadsheetRange?.expandRange(match[0]) || [];
                range.forEach(r => deps.add(r));
            }

            while ((match = refRegex.exec(fullFormula)) !== null) {
                if (!ranges.some(r => r.includes(match[1]))) {
                    deps.add(match[1]);
                }
            }

            this._dependencies = [...deps];
        }

        addDependentCell(cellKey) {
            this._dependentCells.add(cellKey);
        }

        removeDependentCell(cellKey) {
            this._dependentCells.delete(cellKey);
        }

        evaluate(value, error = null) {
            this._value = value;
            this._error = error;
            this._evaluated = true;
        }

        _formatValue(value) {
            if (value === null || value === undefined) return '';
            const fmt = this.format;

            if (typeof value === 'boolean') {
                return value ? 'TRUE' : 'FALSE';
            }

            if (fmt.numberFormat === 'general') {
                if (typeof value === 'number') {
                    return Number.isInteger(value) ? String(value) : value.toFixed(fmt.decimalPlaces);
                }
                return String(value);
            }

            if (fmt.numberFormat === 'number') {
                if (typeof value === 'number') {
                    return value.toLocaleString(undefined, {
                        minimumFractionDigits: fmt.decimalPlaces,
                        maximumFractionDigits: fmt.decimalPlaces,
                    });
                }
                return String(value);
            }

            if (fmt.numberFormat === 'currency') {
                if (typeof value === 'number') {
                    return fmt.currencySymbol + value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    });
                }
                return String(value);
            }

            if (fmt.numberFormat === 'percent') {
                if (typeof value === 'number') {
                    return (value * 100).toFixed(fmt.decimalPlaces) + '%';
                }
                return String(value);
            }

            if (fmt.numberFormat === 'date' && typeof value === 'string') {
                try {
                    const d = new Date(value);
                    if (!isNaN(d.getTime())) {
                        return d.toLocaleDateString();
                    }
                } catch (e) { /* ignore */ }
            }

            return String(value);
        }

        setFormat(key, value) {
            this.format[key] = value;
        }

        setFormats(formats) {
            Object.assign(this.format, formats);
        }

        clone() {
            const cell = new Cell(this._raw, { ...this.format });
            return cell;
        }

        toJSON() {
            return {
                raw: this._raw,
                format: { ...this.format },
            };
        }

        static fromJSON(json) {
            return new Cell(json.raw, json.format);
        }
    }

    class CellProxy {
        constructor(cell, cellKey, model) {
            this._cell = cell;
            this._cellKey = cellKey;
            this._model = model;
        }

        get raw() { return this._cell.raw; }
        set raw(val) { this._cell.raw = val; }
        get type() { return this._cell.type; }
        get value() { return this._cell.value; }
        get formattedValue() { return this._cell.formattedValue; }
        get error() { return this._cell.error; }
        get formula() { return this._cell.formula; }
        get dependencies() { return this._cell.dependencies; }
        get format() { return this._cell.format; }

        setFormat(key, value) {
            this._cell.setFormat(key, value);
            this._model._onCellFormatChanged(this._cellKey, key, value);
        }
    }

    window.SpreadsheetCell = Cell;
    window.SpreadsheetCellType = CellType;
    window.SpreadsheetCellProxy = CellProxy;
    window.DEFAULT_CELL_FORMAT = DEFAULT_CELL_FORMAT;
})();
