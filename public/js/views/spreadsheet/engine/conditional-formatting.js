/**
 * Conditional Formatting - Rule-based system (cell value, formula, color scale)
 * Follows Odoo o-spreadsheet conditional formatting pattern
 */
(function() {
    'use strict';

    const CFType = Object.freeze({
        CELL_VALUE: 'cellValue',
        FORMULA: 'formula',
        COLOR_SCALE: 'colorScale',
        DATA_BAR: 'dataBar',
        ICON_SET: 'iconSet',
    });

    const CFImpact = Object.freeze({
        TEXT_COLOR: 'textColor',
        BACKGROUND_COLOR: 'backgroundColor',
        BOLD: 'bold',
        ITALIC: 'italic',
        UNDERLINE: 'underline',
        STRIKETHROUGH: 'strikethrough',
    });

    const CFComparison = Object.freeze({
        EQUALS: 'equal',
        NOT_EQUALS: 'notEqual',
        GREATER_THAN: 'greaterThan',
        GREATER_OR_EQUAL: 'greaterOrEqual',
        LESS_THAN: 'lessThan',
        LESS_OR_EQUAL: 'lessOrEqual',
        BETWEEN: 'between',
        NOT_BETWEEN: 'notBetween',
        CONTAINS: 'contains',
        NOT_CONTAINS: 'notContains',
        STARTS_WITH: 'startsWith',
        ENDS_WITH: 'endsWith',
        IS_EMPTY: 'isEmpty',
        IS_NOT_EMPTY: 'isNotEmpty',
    });

    class ConditionalFormat {
        constructor(config = {}) {
            this.id = config.id || 'cf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            this.ranges = config.ranges || [];
            this.type = config.type || CFType.CELL_VALUE;
            this.priority = config.priority || 1;
            this.stopIfTrue = config.stopIfTrue || false;
            this.rule = this._createRule(config);
        }

        _createRule(config) {
            switch (this.type) {
                case CFType.CELL_VALUE:
                    return {
                        comparison: config.comparison || CFComparison.EQUALS,
                        value1: config.value1 ?? '',
                        value2: config.value2 ?? '',
                        format: config.format || {},
                    };
                case CFType.FORMULA:
                    return {
                        formula: config.formula || '',
                        format: config.format || {},
                    };
                case CFType.COLOR_SCALE:
                    return {
                        minimum: config.minimum || { type: 'min', color: '#f87171' },
                        midpoint: config.midpoint || null,
                        maximum: config.maximum || { type: 'max', color: '#4ade80' },
                    };
                case CFType.DATA_BAR:
                    return {
                        color: config.color || '#6366f1',
                        showValue: config.showValue !== false,
                        gradient: config.gradient !== false,
                    };
                case CFType.ICON_SET:
                    return {
                        icons: config.icons || [
                            { value: 0.67, icon: 'red' },
                            { value: 0.33, icon: 'yellow' },
                            { value: 0, icon: 'green' },
                        ],
                    };
                default:
                    return {};
            }
        }

        evaluate(cellValue, evaluator) {
            switch (this.type) {
                case CFType.CELL_VALUE:
                    return this._evalCellValue(cellValue);
                case CFType.FORMULA:
                    return this._evalFormula(cellValue, evaluator);
                case CFType.COLOR_SCALE:
                    return this._evalColorScale(cellValue);
                case CFType.DATA_BAR:
                    return this._evalDataBar(cellValue);
                case CFType.ICON_SET:
                    return this._evalIconSet(cellValue);
                default:
                    return null;
            }
        }

        _evalCellValue(value) {
            const rule = this.rule;
            const v1 = this._parseValue(rule.value1);
            const v2 = this._parseValue(rule.value2);
            const numVal = Number(value);
            const strVal = String(value).toLowerCase();

            switch (rule.comparison) {
                case CFComparison.EQUALS:
                    return this._compareValues(value, v1) === 0;
                case CFComparison.NOT_EQUALS:
                    return this._compareValues(value, v1) !== 0;
                case CFComparison.GREATER_THAN:
                    return numVal > Number(v1);
                case CFComparison.GREATER_OR_EQUAL:
                    return numVal >= Number(v1);
                case CFComparison.LESS_THAN:
                    return numVal < Number(v1);
                case CFComparison.LESS_OR_EQUAL:
                    return numVal <= Number(v1);
                case CFComparison.BETWEEN:
                    return numVal >= Number(v1) && numVal <= Number(v2);
                case CFComparison.NOT_BETWEEN:
                    return numVal < Number(v1) || numVal > Number(v2);
                case CFComparison.CONTAINS:
                    return strVal.includes(String(v1).toLowerCase());
                case CFComparison.NOT_CONTAINS:
                    return !strVal.includes(String(v1).toLowerCase());
                case CFComparison.STARTS_WITH:
                    return strVal.startsWith(String(v1).toLowerCase());
                case CFComparison.ENDS_WITH:
                    return strVal.endsWith(String(v1).toLowerCase());
                case CFComparison.IS_EMPTY:
                    return value === null || value === undefined || value === '';
                case CFComparison.IS_NOT_EMPTY:
                    return value !== null && value !== undefined && value !== '';
                default:
                    return false;
            }
        }

        _evalFormula(value, evaluator) {
            if (!evaluator || !this.rule.formula) return false;
            try {
                const result = evaluator.evaluate(this.rule.formula);
                return Boolean(result.value);
            } catch (e) {
                return false;
            }
        }

        _evalColorScale(value) {
            const numVal = Number(value);
            if (isNaN(numVal)) return null;

            const rule = this.rule;
            const min = this._getScaleValue(rule.minimum, numVal);
            const max = this._getScaleValue(rule.maximum, numVal);
            const mid = rule.midpoint ? this._getScaleValue(rule.midpoint, numVal) : null;

            if (numVal <= min.value) return { color: min.color };
            if (numVal >= max.value) return { color: max.color };
            if (mid && numVal === mid.value) return { color: mid.color };

            let ratio;
            if (mid && numVal < mid.value) {
                ratio = (numVal - min.value) / (mid.value - min.value);
                return { color: this._interpolateColor(min.color, mid.color, ratio) };
            } else if (mid && numVal > mid.value) {
                ratio = (numVal - mid.value) / (max.value - mid.value);
                return { color: this._interpolateColor(mid.color, max.color, ratio) };
            } else {
                ratio = (numVal - min.value) / (max.value - min.value);
                return { color: this._interpolateColor(min.color, max.color, ratio) };
            }
        }

        _evalDataBar(value) {
            const numVal = Number(value);
            if (isNaN(numVal)) return null;

            const rule = this.rule;
            const allValues = this._getAllValuesInRange();
            const min = Math.min(...allValues);
            const max = Math.max(...allValues);
            const range = max - min || 1;
            const pct = ((numVal - min) / range) * 100;

            return {
                type: 'dataBar',
                color: rule.color,
                percentage: Math.max(0, Math.min(100, pct)),
                showValue: rule.showValue,
                gradient: rule.gradient,
            };
        }

        _evalIconSet(value) {
            const numVal = Number(value);
            if (isNaN(numVal)) return null;

            const allValues = this._getAllValuesInRange();
            const min = Math.min(...allValues);
            const max = Math.max(...allValues);
            const range = max - min || 1;
            const normalizedValue = (numVal - min) / range;

            const rule = this.rule;
            for (const icon of rule.icons) {
                if (normalizedValue >= icon.value) {
                    return { type: 'iconSet', icon: icon.icon };
                }
            }
            return { type: 'iconSet', icon: rule.icons[rule.icons.length - 1].icon };
        }

        _parseValue(val) {
            if (typeof val === 'string' && val.startsWith('=')) {
                return val.substring(1);
            }
            return val;
        }

        _compareValues(a, b) {
            const na = Number(a);
            const nb = Number(b);
            if (!isNaN(na) && !isNaN(nb)) return na - nb;
            return String(a).localeCompare(String(b));
        }

        _getScaleValue(config, currentValue) {
            if (config.type === 'min') return { value: currentValue, color: config.color };
            if (config.type === 'max') return { value: currentValue, color: config.color };
            if (config.type === 'number') return { value: config.value, color: config.color };
            if (config.type === 'percent') return { value: currentValue * (config.value / 100), color: config.color };
            if (config.type === 'formula' && config.value) {
                return { value: Number(config.value) || 0, color: config.color };
            }
            return { value: currentValue, color: config.color };
        }

        _getAllValuesInRange() {
            return [];
        }

        _interpolateColor(color1, color2, ratio) {
            const c1 = this._hexToRgb(color1);
            const c2 = this._hexToRgb(color2);

            const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
            const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
            const b = Math.round(c1.b + (c2.b - c1.b) * ratio);

            return `rgb(${r}, ${g}, ${b})`;
        }

        _hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
            } : { r: 0, g: 0, b: 0 };
        }

        getFormat() {
            if (this.type === CFType.CELL_VALUE || this.type === CFType.FORMULA) {
                return this.rule.format || {};
            }
            if (this.type === CFType.COLOR_SCALE) {
                return null;
            }
            return null;
        }

        toJSON() {
            return {
                id: this.id,
                ranges: this.ranges,
                type: this.type,
                priority: this.priority,
                stopIfTrue: this.stopIfTrue,
                rule: this.rule,
            };
        }

        static fromJSON(json) {
            return new ConditionalFormat(json);
        }
    }

    class ConditionalFormattingManager {
        constructor(model) {
            this._model = model;
            this._rules = new Map();
        }

        addRule(config) {
            const cf = new ConditionalFormat(config);
            this._rules.set(cf.id, cf);
            return cf;
        }

        updateRule(id, updates) {
            const cf = this._rules.get(id);
            if (!cf) return null;
            Object.assign(cf, updates);
            if (updates.rule) {
                cf.rule = { ...cf.rule, ...updates.rule };
            }
            return cf;
        }

        removeRule(id) {
            return this._rules.delete(id);
        }

        getRule(id) {
            return this._rules.get(id) || null;
        }

        getRulesForCell(col, row) {
            const cellKey = `${col}:${row}`;
            const rules = [];
            for (const [, cf] of this._rules) {
                for (const range of cf.ranges) {
                    const parsed = window.SpreadsheetRange.parseRange(range);
                    if (parsed && col >= parsed.startCol && col <= parsed.endCol &&
                        row >= parsed.startRow && row <= parsed.endRow) {
                        rules.push(cf);
                    }
                }
            }
            rules.sort((a, b) => a.priority - b.priority);
            return rules;
        }

        applyToCell(col, row, cellValue, evaluator) {
            const rules = this.getRulesForCell(col, row);
            const appliedFormats = {};
            let colorScaleResult = null;
            let dataBarResult = null;
            let iconSetResult = null;

            for (const rule of rules) {
                if (rule.type === CFType.COLOR_SCALE) {
                    colorScaleResult = rule.evaluate(cellValue, evaluator);
                    continue;
                }
                if (rule.type === CFType.DATA_BAR) {
                    dataBarResult = rule.evaluate(cellValue, evaluator);
                    continue;
                }
                if (rule.type === CFType.ICON_SET) {
                    iconSetResult = rule.evaluate(cellValue, evaluator);
                    continue;
                }

                if (rule.evaluate(cellValue, evaluator)) {
                    const format = rule.getFormat();
                    if (format) {
                        Object.assign(appliedFormats, format);
                    }
                    if (rule.stopIfTrue) break;
                }
            }

            return {
                formats: appliedFormats,
                colorScale: colorScaleResult,
                dataBar: dataBarResult,
                iconSet: iconSetResult,
            };
        }

        exportJSON() {
            return [...this._rules.entries()].map(([id, cf]) => [id, cf.toJSON()]);
        }

        importJSON(data) {
            this._rules.clear();
            if (Array.isArray(data)) {
                for (const [id, cfData] of data) {
                    this._rules.set(id, ConditionalFormat.fromJSON(cfData));
                }
            }
        }
    }

    window.SpreadsheetCFType = CFType;
    window.SpreadsheetCFImpact = CFImpact;
    window.SpreadsheetCFComparison = CFComparison;
    window.SpreadsheetConditionalFormat = ConditionalFormat;
    window.SpreadsheetConditionalFormattingManager = ConditionalFormattingManager;
})();
