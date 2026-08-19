/**
 * Filter Plugin - Auto-filters on columns, filter by value/date
 * Follows Odoo o-spreadsheet filter plugin pattern
 */
(function() {
    'use strict';

    const FilterType = Object.freeze({
        VALUE: 'value',
        DATE: 'date',
        TEXT: 'text',
        NUMBER: 'number',
    });

    class Filter {
        constructor(col, options = {}) {
            this.col = col;
            this.type = options.type || FilterType.VALUE;
            this.values = new Set(options.values || []);
            this.excludedValues = new Set(options.excludedValues || []);
            this.dateRange = options.dateRange || null;
            this.textFilter = options.textFilter || '';
            this.operator = options.operator || 'contains';
            this.active = false;
        }

        matches(value) {
            if (!this.active) return true;

            if (this.type === FilterType.TEXT) {
                return this._matchText(value);
            }

            if (this.type === FilterType.NUMBER) {
                return this._matchNumber(value);
            }

            if (this.type === FilterType.DATE) {
                return this._matchDate(value);
            }

            if (this.values.size === 0 && this.excludedValues.size === 0) return true;

            const strVal = String(value);
            if (this.excludedValues.has(strVal)) return false;
            if (this.values.size === 0) return true;
            return this.values.has(strVal);
        }

        _matchText(value) {
            const strVal = String(value || '').toLowerCase();
            const filter = this.textFilter.toLowerCase();

            switch (this.operator) {
                case 'contains': return strVal.includes(filter);
                case 'not_contains': return !strVal.includes(filter);
                case 'equals': return strVal === filter;
                case 'not_equals': return strVal !== filter;
                case 'starts_with': return strVal.startsWith(filter);
                case 'ends_with': return strVal.endsWith(filter);
                case 'empty': return strVal === '';
                case 'not_empty': return strVal !== '';
                default: return true;
            }
        }

        _matchNumber(value) {
            const num = Number(value);
            if (isNaN(num)) return false;

            if (this.operator === 'eq') return num === this._filterNum;
            if (this.operator === 'neq') return num !== this._filterNum;
            if (this.operator === 'gt') return num > this._filterNum;
            if (this.operator === 'lt') return num < this._filterNum;
            if (this.operator === 'gte') return num >= this._filterNum;
            if (this.operator === 'lte') return num <= this._filterNum;
            if (this.operator === 'between') return num >= this._filterMin && num <= this._filterMax;
            return true;
        }

        _matchDate(value) {
            if (!this.dateRange) return true;
            const d = new Date(value);
            if (isNaN(d.getTime())) return false;

            const { start, end } = this.dateRange;
            if (start && d < new Date(start)) return false;
            if (end && d > new Date(end)) return false;
            return true;
        }

        setValues(values) {
            this.values = new Set(values);
            this.active = this.values.size > 0;
        }

        addValue(value) {
            this.values.add(String(value));
            this.active = true;
        }

        removeValue(value) {
            this.values.delete(String(value));
            if (this.values.size === 0 && this.excludedValues.size === 0) {
                this.active = false;
            }
        }

        excludeValue(value) {
            this.excludedValues.add(String(value));
            this.active = true;
        }

        clear() {
            this.values.clear();
            this.excludedValues.clear();
            this.dateRange = null;
            this.textFilter = '';
            this.active = false;
        }

        toJSON() {
            return {
                col: this.col,
                type: this.type,
                values: [...this.values],
                excludedValues: [...this.excludedValues],
                dateRange: this.dateRange,
                textFilter: this.textFilter,
                operator: this.operator,
                active: this.active,
            };
        }

        static fromJSON(json) {
            return new Filter(json.col, {
                type: json.type,
                values: json.values,
                excludedValues: json.excludedValues,
                dateRange: json.dateRange,
                textFilter: json.textFilter,
                operator: json.operator,
            });
        }
    }

    class FilterPlugin extends window.SpreadsheetUIPlugin {
        constructor(config) {
            super(config);
            this._filters = new Map();
            this._visibleRows = new Map();
            this._autoFilterEnabled = false;
        }

        _onSetup() {
            this.model.on('stateChanged', () => {
                if (this._autoFilterEnabled) this._applyFilters();
            });
        }

        get autoFilterEnabled() { return this._autoFilterEnabled; }

        enableAutoFilter() {
            this._autoFilterEnabled = true;
            this._createDefaultFilters();
            this._applyFilters();
            this.model._emit('filterChanged', { enabled: true });
        }

        disableAutoFilter() {
            this._autoFilterEnabled = false;
            this._filters.clear();
            this._visibleRows.clear();
            this.model._emit('filterChanged', { enabled: false });
        }

        toggleAutoFilter() {
            if (this._autoFilterEnabled) {
                this.disableAutoFilter();
            } else {
                this.enableAutoFilter();
            }
        }

        _createDefaultFilters() {
            this._filters.clear();
            for (let c = 0; c < this.model.colCount; c++) {
                const uniqueValues = this._getUniqueValues(c);
                this._filters.set(c, new Filter(c, {
                    type: this._detectFilterType(uniqueValues),
                    values: uniqueValues.map(String),
                }));
            }
        }

        _getUniqueValues(col) {
            const values = new Set();
            for (let r = 1; r < this.model.rowCount; r++) {
                const val = this.model.getCellRaw(col, r);
                if (val !== null && val !== undefined && val !== '') {
                    values.add(val);
                }
            }
            return [...values];
        }

        _detectFilterType(values) {
            if (values.length === 0) return FilterType.VALUE;
            const sample = String(values[0]);
            if (/^\d{4}-\d{2}-\d{2}/.test(sample)) return FilterType.DATE;
            if (values.some(v => isNaN(Number(v)))) return FilterType.TEXT;
            return FilterType.NUMBER;
        }

        setFilter(col, filterConfig) {
            const existing = this._filters.get(col) || new Filter(col);
            if (filterConfig.values !== undefined) existing.setValues(filterConfig.values);
            if (filterConfig.textFilter !== undefined) existing.textFilter = filterConfig.textFilter;
            if (filterConfig.operator !== undefined) existing.operator = filterConfig.operator;
            if (filterConfig.dateRange !== undefined) existing.dateRange = filterConfig.dateRange;
            this._filters.set(col, existing);
            this._applyFilters();
        }

        getFilter(col) {
            return this._filters.get(col) || null;
        }

        clearFilter(col) {
            const filter = this._filters.get(col);
            if (filter) {
                filter.clear();
                this._applyFilters();
            }
        }

        clearAllFilters() {
            for (const [, filter] of this._filters) {
                filter.clear();
            }
            this._applyFilters();
        }

        _applyFilters() {
            this._visibleRows.clear();
            for (let r = 0; r < this.model.rowCount; r++) {
                let visible = true;
                for (const [col, filter] of this._filters) {
                    if (filter.active) {
                        const val = this.model.getCellRaw(col, r);
                        if (!filter.matches(val)) {
                            visible = false;
                            break;
                        }
                    }
                }
                if (visible) {
                    this._visibleRows.set(r, true);
                }
            }
            this.model._emit('filterApplied', { visibleRows: this.getVisibleRows() });
        }

        isRowVisible(row) {
            if (!this._autoFilterEnabled) return true;
            return this._visibleRows.has(row);
        }

        getVisibleRows() {
            if (!this._autoFilterEnabled) return [];
            return [...this._visibleRows.keys()];
        }

        getVisibleRowCount() {
            if (!this._autoFilterEnabled) return this.model.rowCount;
            return this._visibleRows.size;
        }

        getFilterValues(col) {
            const filter = this._filters.get(col);
            return filter ? [...filter.values] : [];
        }

        getUniqueFilterValues(col) {
            return this._getUniqueValues(col);
        }

        exportJSON() {
            return {
                autoFilterEnabled: this._autoFilterEnabled,
                filters: [...this._filters.entries()].map(([col, f]) => [col, f.toJSON()]),
            };
        }

        importJSON(data) {
            this._autoFilterEnabled = data.autoFilterEnabled || false;
            if (data.filters) {
                for (const [col, fData] of data.filters) {
                    this._filters.set(col, Filter.fromJSON(fData));
                }
            }
        }
    }

    window.SpreadsheetFilterType = FilterType;
    window.SpreadsheetFilter = Filter;
    window.SpreadsheetFilterPlugin = FilterPlugin;
})();
