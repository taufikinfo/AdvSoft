/**
 * Data Validation - Dropdown lists, custom formulas, error messages
 * Follows Odoo o-spreadsheet data validation pattern
 */
(function() {
    'use strict';

    const ValidationType = Object.freeze({
        LIST: 'list',
        LIST_FROM_RANGE: 'listFromRange',
        NUMBER: 'number',
        TEXT: 'text',
        DATE: 'date',
        CUSTOM: 'custom',
    });

    const NumberOperator = Object.freeze({
        BETWEEN: 'between',
        NOT_BETWEEN: 'notBetween',
        EQUAL: 'equal',
        NOT_EQUAL: 'notEqual',
        GREATER_THAN: 'greaterThan',
        LESS_THAN: 'lessThan',
        GREATER_OR_EQUAL: 'greaterOrEqual',
        LESS_OR_EQUAL: 'lessOrEqual',
    });

    const TextOperator = Object.freeze({
        CONTAINS: 'contains',
        NOT_CONTAINS: 'notContains',
        EQUALS: 'equals',
        NOT_EQUALS: 'notEquals',
        STARTS_WITH: 'startsWith',
        ENDS_WITH: 'endsWith',
    });

    const DateOperator = Object.freeze({
        EQUAL: 'equal',
        BEFORE: 'before',
        AFTER: 'after',
        BETWEEN: 'between',
    });

    class DataValidation {
        constructor(config = {}) {
            this.id = config.id || 'dv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            this.ranges = config.ranges || [];
            this.type = config.type || ValidationType.LIST;
            this.allowBlank = config.allowBlank !== false;
            this.showErrorMessage = config.showErrorMessage !== false;
            this.errorTitle = config.errorTitle || 'Invalid';
            this.errorMessage = config.errorMessage || 'The value you entered is not valid.';
            this.showInputMessage = config.showInputMessage !== false;
            this.inputTitle = config.inputTitle || '';
            this.inputMessage = config.inputMessage || '';
            this.rule = this._createRule(config);
        }

        _createRule(config) {
            switch (this.type) {
                case ValidationType.LIST:
                    return {
                        values: config.values || [],
                        displayValues: config.displayValues || config.values || [],
                        ignoreBlank: config.ignoreBlank !== false,
                        inCellDropdown: config.inCellDropdown !== false,
                    };
                case ValidationType.LIST_FROM_RANGE:
                    return {
                        range: config.range || '',
                        sheetId: config.sheetId || null,
                    };
                case ValidationType.NUMBER:
                    return {
                        operator: config.operator || NumberOperator.BETWEEN,
                        value1: config.value1 ?? 0,
                        value2: config.value2 ?? 100,
                        allowDecimal: config.allowDecimal !== false,
                    };
                case ValidationType.TEXT:
                    return {
                        operator: config.operator || TextOperator.CONTAINS,
                        value: config.value || '',
                    };
                case ValidationType.DATE:
                    return {
                        operator: config.operator || DateOperator.BETWEEN,
                        value1: config.value1 || '',
                        value2: config.value2 || '',
                    };
                case ValidationType.CUSTOM:
                    return {
                        formula: config.formula || '',
                    };
                default:
                    return {};
            }
        }

        validate(value, evaluator) {
            if (!this.allowBlank && (value === null || value === undefined || value === '')) {
                return { valid: false, message: 'This field is required.' };
            }

            if (this.allowBlank && (value === null || value === undefined || value === '')) {
                return { valid: true };
            }

            switch (this.type) {
                case ValidationType.LIST:
                    return this._validateList(value);
                case ValidationType.LIST_FROM_RANGE:
                    return this._validateListFromRange(value, evaluator);
                case ValidationType.NUMBER:
                    return this._validateNumber(value);
                case ValidationType.TEXT:
                    return this._validateText(value);
                case ValidationType.DATE:
                    return this._validateDate(value);
                case ValidationType.CUSTOM:
                    return this._validateCustom(value, evaluator);
                default:
                    return { valid: true };
            }
        }

        _validateList(value) {
            const rule = this.rule;
            const strVal = String(value);
            const validValues = rule.displayValues.length > 0 ? rule.displayValues : rule.values;
            const isValid = validValues.some(v => String(v) === strVal);

            return {
                valid: isValid,
                message: isValid ? '' : `Please select a value from the list: ${validValues.join(', ')}`,
            };
        }

        _validateListFromRange(value, evaluator) {
            if (!evaluator) return { valid: true };

            const rule = this.rule;
            const cells = window.SpreadsheetRange.expandRange(rule.range);
            const validValues = cells.map(ref => {
                const result = evaluator.evaluateCell(ref);
                return String(result.value ?? '');
            });

            const strVal = String(value);
            const isValid = validValues.includes(strVal);

            return {
                valid: isValid,
                message: isValid ? '' : `Please select a valid value from the list.`,
            };
        }

        _validateNumber(value) {
            const num = Number(value);
            if (isNaN(num)) {
                return { valid: false, message: 'Please enter a valid number.' };
            }

            const rule = this.rule;
            const v1 = Number(rule.value1);
            const v2 = Number(rule.value2);

            switch (rule.operator) {
                case NumberOperator.BETWEEN:
                    return { valid: num >= v1 && num <= v2, message: `Please enter a value between ${v1} and ${v2}.` };
                case NumberOperator.NOT_BETWEEN:
                    return { valid: num < v1 || num > v2, message: `Please enter a value not between ${v1} and ${v2}.` };
                case NumberOperator.EQUAL:
                    return { valid: num === v1, message: `Please enter a value equal to ${v1}.` };
                case NumberOperator.NOT_EQUAL:
                    return { valid: num !== v1, message: `Please enter a value not equal to ${v1}.` };
                case NumberOperator.GREATER_THAN:
                    return { valid: num > v1, message: `Please enter a value greater than ${v1}.` };
                case NumberOperator.LESS_THAN:
                    return { valid: num < v1, message: `Please enter a value less than ${v1}.` };
                case NumberOperator.GREATER_OR_EQUAL:
                    return { valid: num >= v1, message: `Please enter a value greater than or equal to ${v1}.` };
                case NumberOperator.LESS_OR_EQUAL:
                    return { valid: num <= v1, message: `Please enter a value less than or equal to ${v1}.` };
                default:
                    return { valid: true };
            }
        }

        _validateText(value) {
            const strVal = String(value).toLowerCase();
            const rule = this.rule;
            const compareVal = String(rule.value).toLowerCase();

            switch (rule.operator) {
                case TextOperator.CONTAINS:
                    return { valid: strVal.includes(compareVal), message: `Text must contain "${rule.value}".` };
                case TextOperator.NOT_CONTAINS:
                    return { valid: !strVal.includes(compareVal), message: `Text must not contain "${rule.value}".` };
                case TextOperator.EQUALS:
                    return { valid: strVal === compareVal, message: `Text must be "${rule.value}".` };
                case TextOperator.NOT_EQUALS:
                    return { valid: strVal !== compareVal, message: `Text must not be "${rule.value}".` };
                case TextOperator.STARTS_WITH:
                    return { valid: strVal.startsWith(compareVal), message: `Text must start with "${rule.value}".` };
                case TextOperator.ENDS_WITH:
                    return { valid: strVal.endsWith(compareVal), message: `Text must end with "${rule.value}".` };
                default:
                    return { valid: true };
            }
        }

        _validateDate(value) {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return { valid: false, message: 'Please enter a valid date.' };
            }

            const rule = this.rule;
            const d1 = new Date(rule.value1);
            const d2 = rule.value2 ? new Date(rule.value2) : null;

            switch (rule.operator) {
                case DateOperator.EQUAL:
                    return { valid: date.toDateString() === d1.toDateString(), message: `Please enter ${d1.toLocaleDateString()}.` };
                case DateOperator.BEFORE:
                    return { valid: date < d1, message: `Please enter a date before ${d1.toLocaleDateString()}.` };
                case DateOperator.AFTER:
                    return { valid: date > d1, message: `Please enter a date after ${d1.toLocaleDateString()}.` };
                case DateOperator.BETWEEN:
                    if (!d2) return { valid: true };
                    return { valid: date >= d1 && date <= d2, message: `Please enter a date between ${d1.toLocaleDateString()} and ${d2.toLocaleDateString()}.` };
                default:
                    return { valid: true };
            }
        }

        _validateCustom(value, evaluator) {
            if (!evaluator) return { valid: true };

            const rule = this.rule;
            if (!rule.formula) return { valid: true };

            try {
                const result = evaluator.evaluate(rule.formula);
                return {
                    valid: Boolean(result.value),
                    message: result.error || 'The value does not meet the validation criteria.',
                };
            } catch (e) {
                return { valid: false, message: 'Invalid validation formula.' };
            }
        }

        getListValues() {
            if (this.type === ValidationType.LIST) {
                return this.rule.displayValues || this.rule.values || [];
            }
            return [];
        }

        toJSON() {
            return {
                id: this.id,
                ranges: this.ranges,
                type: this.type,
                allowBlank: this.allowBlank,
                showErrorMessage: this.showErrorMessage,
                errorTitle: this.errorTitle,
                errorMessage: this.errorMessage,
                showInputMessage: this.showInputMessage,
                inputTitle: this.inputTitle,
                inputMessage: this.inputMessage,
                rule: this.rule,
            };
        }

        static fromJSON(json) {
            return new DataValidation(json);
        }
    }

    class DataValidationManager {
        constructor(model) {
            this._model = model;
            this._validations = new Map();
        }

        addValidation(config) {
            const dv = new DataValidation(config);
            this._validations.set(dv.id, dv);
            return dv;
        }

        updateValidation(id, updates) {
            const dv = this._validations.get(id);
            if (!dv) return null;
            Object.assign(dv, updates);
            if (updates.rule) {
                dv.rule = { ...dv.rule, ...updates.rule };
            }
            return dv;
        }

        removeValidation(id) {
            return this._validations.delete(id);
        }

        getValidation(id) {
            return this._validations.get(id) || null;
        }

        getValidationsForCell(col, row) {
            const cellKey = `${col}:${row}`;
            const validations = [];
            for (const [, dv] of this._validations) {
                for (const range of dv.ranges) {
                    const parsed = window.SpreadsheetRange.parseRange(range);
                    if (parsed && col >= parsed.startCol && col <= parsed.endCol &&
                        row >= parsed.startRow && row <= parsed.endRow) {
                        validations.push(dv);
                    }
                }
            }
            return validations;
        }

        validateCell(col, row, value, evaluator) {
            const validations = this.getValidationsForCell(col, row);
            for (const dv of validations) {
                const result = dv.validate(value, evaluator);
                if (!result.valid) {
                    return result;
                }
            }
            return { valid: true };
        }

        getDropdownValues(col, row) {
            const validations = this.getValidationsForCell(col, row);
            for (const dv of validations) {
                if (dv.type === ValidationType.LIST) {
                    return dv.getListValues();
                }
            }
            return [];
        }

        exportJSON() {
            return [...this._validations.entries()].map(([id, dv]) => [id, dv.toJSON()]);
        }

        importJSON(data) {
            this._validations.clear();
            if (Array.isArray(data)) {
                for (const [id, dvData] of data) {
                    this._validations.set(id, DataValidation.fromJSON(dvData));
                }
            }
        }
    }

    window.SpreadsheetValidationType = ValidationType;
    window.SpreadsheetNumberOperator = NumberOperator;
    window.SpreadsheetTextOperator = TextOperator;
    window.SpreadsheetDateOperator = DateOperator;
    window.SpreadsheetDataValidation = DataValidation;
    window.SpreadsheetDataValidationManager = DataValidationManager;
})();
