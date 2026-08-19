/**
 * List Plugin - ODOO.LIST() formula, linked lists within cells
 * Follows Odoo o-spreadsheet list plugin pattern
 */
(function() {
    'use strict';

    class ListPlugin extends window.SpreadsheetCorePlugin {
        constructor(config) {
            super(config);
            this._lists = new Map();
            this._listData = new Map();
        }

        _onSetup() {
            window.SpreadsheetFormulaFunctions['ODOO.LIST'] = (args, eval_) => {
                return this._evalOdooList(args, eval_);
            };
            window.SpreadsheetFormulaFunctions['ODOO.LIST_HEADER'] = (args, eval_) => {
                return this._evalOdooListHeader(args, eval_);
            };
            window.SpreadsheetFormulaFunctions['LIST'] = (args, eval_) => {
                return this._evalList(args, eval_);
            };
        }

        addList(config) {
            const id = config.id || 'list_' + Date.now();
            const list = {
                id,
                model: config.model || '',
                domain: config.domain || [],
                fields: config.fields || [],
                orderBy: config.orderBy || '',
                limit: config.limit || 100,
            };

            this._lists.set(id, list);
            return list;
        }

        updateList(id, updates) {
            const list = this._lists.get(id);
            if (!list) return;
            Object.assign(list, updates);
        }

        removeList(id) {
            this._lists.delete(id);
            this._listData.delete(id);
        }

        getList(id) {
            return this._lists.get(id) || null;
        }

        async loadListData(listId) {
            const list = this._lists.get(listId);
            if (!list || !list.model) return null;

            try {
                const rpc = window.LaravelRPC || window.rpc;
                const opts = {
                    fields: list.fields,
                    limit: list.limit,
                };
                if (list.orderBy) opts.order = list.orderBy;

                const result = await rpc.searchRead(list.model, list.domain, opts);
                this._listData.set(listId, result.records || []);
                return result.records;
            } catch (e) {
                console.error('List data load error:', e);
                return null;
            }
        }

        getListData(listId) {
            return this._listData.get(listId) || [];
        }

        _evalOdooList(args, eval_) {
            if (args.length < 3) return { value: null, error: '#VALUE!' };

            const listIdArg = eval_._evalNode(args[0]);
            if (listIdArg.error) return listIdArg;
            const listId = String(listIdArg.value);

            const indexArg = eval_._evalNode(args[1]);
            if (indexArg.error) return indexArg;
            const index = Number(indexArg.value);

            const fieldArg = eval_._evalNode(args[2]);
            if (fieldArg.error) return fieldArg;
            const field = String(fieldArg.value);

            const records = this._listData.get(listId) || [];
            if (index >= 0 && index < records.length) {
                return { value: records[index][field] || null, error: null };
            }
            return { value: null, error: '#N/A' };
        }

        _evalOdooListHeader(args, eval_) {
            if (args.length < 2) return { value: null, error: '#VALUE!' };

            const listIdArg = eval_._evalNode(args[0]);
            if (listIdArg.error) return listIdArg;
            const listId = String(listIdArg.value);

            const fieldArg = eval_._evalNode(args[1]);
            if (fieldArg.error) return fieldArg;
            const field = String(fieldArg.value);

            const list = this._lists.get(listId);
            if (!list) return { value: null, error: '#N/A' };

            const fieldDefs = this.model._config.field_defs || {};
            const fieldDef = fieldDefs[field];
            if (fieldDef) {
                return { value: fieldDef.string || field, error: null };
            }
            return { value: field, error: null };
        }

        _evalList(args, eval_) {
            if (args.length < 2) return { value: null, error: '#VALUE!' };

            const dataArg = eval_._evalNode(args[0]);
            if (dataArg.error) return dataArg;
            const indexArg = eval_._evalNode(args[1]);
            if (indexArg.error) return indexArg;

            const data = Array.isArray(dataArg.value) ? dataArg.value : [dataArg.value];
            const index = Number(indexArg.value);

            if (index >= 0 && index < data.length) {
                return { value: data[index], error: null };
            }
            return { value: null, error: '#N/A' };
        }

        exportJSON() {
            return {
                lists: [...this._lists.entries()],
            };
        }

        importJSON(data) {
            if (data.lists) {
                for (const [id, list] of data.lists) {
                    this._lists.set(id, list);
                }
            }
        }
    }

    window.SpreadsheetListPlugin = ListPlugin;
})();
