/**
 * Spreadsheet Document - JSON blob storage for spreadsheet state
 * Follows Odoo spreadsheet.document pattern (ir_attachment based)
 */
(function() {
    'use strict';

    class SpreadsheetDocument {
        constructor(config = {}) {
            this._rpc = config.rpc || window.AdvSoftRPC || window.rpc;
            this._model = config.model || 'spreadsheet.spreadsheet_data';
            this._currentId = null;
            this._currentName = '';
            this._autoSave = config.autoSave !== false;
            this._autoSaveDelay = config.autoSaveDelay || 3000;
            this._autoSaveTimer = null;
            this._lastSavedData = null;
            this._isDirty = false;
            this._listeners = new Set();
        }

        get currentId() { return this._currentId; }
        get currentName() { return this._currentName; }
        get isDirty() { return this._isDirty; }

        async create(name, data) {
            const payload = {
                name: name,
                spreadsheet_data: JSON.stringify(data),
                raw_data: data,
            };

            try {
                const result = await this._rpc.create(this._model, payload);
                this._currentId = result.id;
                this._currentName = name;
                this._lastSavedData = JSON.stringify(data);
                this._isDirty = false;
                this._emit('created', { id: result.id, name });
                return result;
            } catch (e) {
                console.error('SpreadsheetDocument create error:', e);
                throw e;
            }
        }

        async save(data) {
            const jsonStr = JSON.stringify(data);
            if (jsonStr === this._lastSavedData) {
                return;
            }

            const payload = {
                spreadsheet_data: jsonStr,
                raw_data: data,
            };

            try {
                if (this._currentId) {
                    await this._rpc.write(this._model, this._currentId, payload);
                } else {
                    const result = await this._rpc.create(this._model, {
                        name: this._currentName || 'Untitled Spreadsheet',
                        ...payload,
                    });
                    this._currentId = result.id;
                }

                this._lastSavedData = jsonStr;
                this._isDirty = false;
                this._emit('saved', { id: this._currentId, name: this._currentName });
            } catch (e) {
                console.error('SpreadsheetDocument save error:', e);
                throw e;
            }
        }

        async load(id) {
            try {
                const record = await this._rpc.read(this._model, id);
                if (!record) {
                    throw new Error('Spreadsheet not found');
                }

                this._currentId = record.id;
                this._currentName = record.name || '';

                let data;
                if (record.spreadsheet_data) {
                    data = typeof record.spreadsheet_data === 'string'
                        ? JSON.parse(record.spreadsheet_data)
                        : record.spreadsheet_data;
                } else if (record.raw_data) {
                    data = record.raw_data;
                } else {
                    data = {};
                }

                this._lastSavedData = JSON.stringify(data);
                this._isDirty = false;
                this._emit('loaded', { id: record.id, name: record.name, data });
                return data;
            } catch (e) {
                console.error('SpreadsheetDocument load error:', e);
                throw e;
            }
        }

        async list(domain = [], limit = 50) {
            try {
                const result = await this._rpc.searchRead(this._model, domain, {
                    fields: ['id', 'name', 'create_date', 'write_date'],
                    limit,
                    order: 'write_date desc',
                });
                return result.records || [];
            } catch (e) {
                console.error('SpreadsheetDocument list error:', e);
                return [];
            }
        }

        async remove(id) {
            try {
                await this._rpc.unlink(this._model, id);
                if (this._currentId === id) {
                    this._currentId = null;
                    this._currentName = '';
                    this._lastSavedData = null;
                }
                this._emit('removed', { id });
            } catch (e) {
                console.error('SpreadsheetDocument remove error:', e);
                throw e;
            }
        }

        async duplicate(id, newName) {
            try {
                const source = await this._rpc.read(this._model, id);
                const data = typeof source.spreadsheet_data === 'string'
                    ? JSON.parse(source.spreadsheet_data)
                    : source.spreadsheet_data;

                return await this.create(newName || `${source.name} (Copy)`, data);
            } catch (e) {
                console.error('SpreadsheetDocument duplicate error:', e);
                throw e;
            }
        }

        markDirty() {
            this._isDirty = true;
            this._emit('dirtyChanged', { isDirty: true });
            if (this._autoSave) {
                this._scheduleAutoSave();
            }
        }

        _scheduleAutoSave() {
            if (this._autoSaveTimer) {
                clearTimeout(this._autoSaveTimer);
            }
            this._autoSaveTimer = setTimeout(() => {
                this._emit('autoSaveRequest', { id: this._currentId });
            }, this._autoSaveDelay);
        }

        cancelAutoSave() {
            if (this._autoSaveTimer) {
                clearTimeout(this._autoSaveTimer);
                this._autoSaveTimer = null;
            }
        }

        on(event, callback) {
            this._listeners.add({ event, callback });
            return () => {
                this._listeners.delete({ event, callback });
            };
        }

        _emit(event, data) {
            for (const listener of this._listeners) {
                if (listener.event === event) {
                    try {
                        listener.callback(data);
                    } catch (e) {
                        console.error(`Document event ${event} error:`, e);
                    }
                }
            }
        }

        exportToJSON(data) {
            return {
                version: '1.0',
                timestamp: new Date().toISOString(),
                documentId: this._currentId,
                documentName: this._currentName,
                spreadsheet: data,
            };
        }

        importFromJSON(jsonStr) {
            try {
                const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
                if (parsed.spreadsheet) {
                    return parsed.spreadsheet;
                }
                return parsed;
            } catch (e) {
                console.error('Import JSON error:', e);
                return null;
            }
        }

        exportToFile(data, filename) {
            const json = this.exportToJSON(data);
            const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `${this._currentName || 'spreadsheet'}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        importFromFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = this.importFromJSON(e.target.result);
                        resolve(data);
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.onerror = reject;
                reader.readAsText(file);
            });
        }
    }

    class SpreadsheetAutoSave {
        constructor(document, model, config = {}) {
            this._document = document;
            this._model = model;
            this._interval = config.interval || 30000;
            this._enabled = config.enabled !== false;
            this._timer = null;
            this._lastSave = null;
        }

        start() {
            if (!this._enabled) return;
            this._timer = setInterval(() => this._save(), this._interval);
        }

        stop() {
            if (this._timer) {
                clearInterval(this._timer);
                this._timer = null;
            }
        }

        async _save() {
            try {
                const data = this._model.toJSON();
                await this._document.save(data);
                this._lastSave = new Date();
            } catch (e) {
                console.error('Auto-save error:', e);
            }
        }

        async saveNow() {
            await this._save();
        }
    }

    window.SpreadsheetDocument = SpreadsheetDocument;
    window.SpreadsheetAutoSave = SpreadsheetAutoSave;
})();
