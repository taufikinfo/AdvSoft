/**
 * Pivot Plugin - PIVOT() formula, inline pivot tables
 * Follows Odoo o-spreadsheet pivot plugin pattern
 */
(function() {
    'use strict';

    class PivotPlugin extends window.SpreadsheetCorePlugin {
        constructor(config) {
            super(config);
            this._pivots = new Map();
            this._data = new Map();
            this._aggregations = new Map();
        }

        _onSetup() {
            window.SpreadsheetFormulaFunctions['PIVOT'] = (args, eval_) => {
                return this._evalPivot(args, eval_);
            };
            window.SpreadsheetFormulaFunctions['PIVOT.VALUE'] = (args, eval_) => {
                return this._evalPivotValue(args, eval_);
            };
            window.SpreadsheetFormulaFunctions['PIVOT.HEADER'] = (args, eval_) => {
                return this._evalPivotHeader(args, eval_);
            };
        }

        addPivot(config) {
            const id = config.id || 'pivot_' + Date.now();
            const pivot = {
                id,
                model: config.model || '',
                domain: config.domain || [],
                groupBy: config.groupBy || [],
                measures: config.measures || [],
                colLimit: config.colLimit || 20,
                rowLimit: config.rowLimit || 100,
            };

            this._pivots.set(id, pivot);
            return pivot;
        }

        updatePivot(id, updates) {
            const pivot = this._pivots.get(id);
            if (!pivot) return;
            Object.assign(pivot, updates);
        }

        removePivot(id) {
            this._pivots.delete(id);
            this._data.delete(id);
            this._aggregations.delete(id);
        }

        getPivot(id) {
            return this._pivots.get(id) || null;
        }

        async loadPivotData(pivotId) {
            const pivot = this._pivots.get(pivotId);
            if (!pivot || !pivot.model) return null;

            try {
                const rpc = window.LarasoftRPC || window.rpc;
                const result = await rpc.searchRead(pivot.model, pivot.domain, {
                    fields: [...pivot.groupBy, ...pivot.measures.map(m => m.field)],
                    limit: pivot.rowLimit,
                });

                this._data.set(pivotId, result.records || []);
                this._computeAggregations(pivotId);
                return result.records;
            } catch (e) {
                console.error('Pivot data load error:', e);
                return null;
            }
        }

        _computeAggregations(pivotId) {
            const pivot = this._pivots.get(pivotId);
            const records = this._data.get(pivotId) || [];

            const groups = new Map();

            for (const record of records) {
                const groupKey = pivot.groupBy.map(g => record[g]).join('|');
                if (!groups.has(groupKey)) {
                    groups.set(groupKey, {
                        key: groupKey,
                        values: pivot.groupBy.map(g => record[g]),
                        records: [],
                    });
                }
                groups.get(groupKey).records.push(record);
            }

            const result = [];
            for (const [, group] of groups) {
                const agg = { ...group };
                for (const measure of pivot.measures) {
                    const field = measure.field;
                    const aggType = measure.aggregator || 'sum';
                    const values = group.records.map(r => Number(r[field]) || 0);

                    switch (aggType) {
                        case 'sum': agg[field] = values.reduce((a, b) => a + b, 0); break;
                        case 'avg': agg[field] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; break;
                        case 'count': agg[field] = group.records.length; break;
                        case 'min': agg[field] = Math.min(...values); break;
                        case 'max': agg[field] = Math.max(...values); break;
                        case 'count_distinct':
                            agg[field] = new Set(values).size;
                            break;
                        default: agg[field] = values.reduce((a, b) => a + b, 0);
                    }
                }
                result.push(agg);
            }

            this._aggregations.set(pivotId, result);
        }

        _evalPivot(args, eval_) {
            if (args.length < 2) return { value: null, error: '#VALUE!' };

            const pivotIdArg = eval_._evalNode(args[0]);
            if (pivotIdArg.error) return pivotIdArg;
            const pivotId = String(pivotIdArg.value);

            const fieldArg = eval_._evalNode(args[1]);
            if (fieldArg.error) return fieldArg;
            const field = String(fieldArg.value);

            const pivot = this._pivots.get(pivotId);
            if (!pivot) return { value: null, error: '#N/A' };

            const aggs = this._aggregations.get(pivotId) || [];

            if (args.length >= 3) {
                const groupVal = eval_._evalNode(args[2]);
                if (groupVal.error) return groupVal;
                const match = aggs.find(a => String(a.values[0]) === String(groupVal.value));
                if (match) return { value: match[field] || 0, error: null };
                return { value: 0, error: null };
            }

            const total = aggs.reduce((sum, a) => sum + (Number(a[field]) || 0), 0);
            return { value: total, error: null };
        }

        _evalPivotValue(args, eval_) {
            if (args.length < 3) return { value: null, error: '#VALUE!' };

            const pivotIdArg = eval_._evalNode(args[0]);
            if (pivotIdArg.error) return pivotIdArg;
            const pivotId = String(pivotIdArg.value);

            const colArg = eval_._evalNode(args[1]);
            if (colArg.error) return colArg;
            const col = String(colArg.value);

            const rowArg = eval_._evalNode(args[2]);
            if (rowArg.error) return rowArg;
            const row = String(rowArg.value);

            const aggs = this._aggregations.get(pivotId) || [];
            const match = aggs.find(a => a.values.includes(col) && a.values.includes(row));
            if (match) {
                const measure = args[4] ? String(eval_._evalNode(args[4]).value) : Object.keys(match).find(k => !['key', 'values', 'records'].includes(k));
                return { value: match[measure] || 0, error: null };
            }
            return { value: 0, error: null };
        }

        _evalPivotHeader(args, eval_) {
            if (args.length < 2) return { value: null, error: '#VALUE!' };

            const pivotIdArg = eval_._evalNode(args[0]);
            if (pivotIdArg.error) return pivotIdArg;
            const pivotId = String(pivotIdArg.value);

            const indexArg = eval_._evalNode(args[1]);
            if (indexArg.error) return indexArg;
            const index = Number(indexArg.value);

            const pivot = this._pivots.get(pivotId);
            if (!pivot) return { value: null, error: '#N/A' };

            const aggs = this._aggregations.get(pivotId) || [];
            if (index >= 0 && index < aggs.length) {
                const groupVal = args[2] ? String(eval_._evalNode(args[2]).value) : null;
                if (groupVal) {
                    const match = aggs.find(a => String(a.values[0]) === groupVal);
                    return { value: match ? match.values[index] : null, error: null };
                }
                return { value: aggs[index]?.values[0] || null, error: null };
            }
            return { value: null, error: '#N/A' };
        }

        exportJSON() {
            return {
                pivots: [...this._pivots.entries()],
            };
        }

        importJSON(data) {
            if (data.pivots) {
                for (const [id, pivot] of data.pivots) {
                    this._pivots.set(id, pivot);
                }
            }
        }
    }

    window.SpreadsheetPivotPlugin = PivotPlugin;
})();
