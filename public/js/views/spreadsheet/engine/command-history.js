/**
 * Command History - Granular undo/redo system
 * Follows Odoo o-spreadsheet command pattern
 */
(function() {
    'use strict';

    const CommandType = Object.freeze({
        CELL_EDIT: 'cell_edit',
        CELL_FORMAT: 'cell_format',
        CELL_DELETE: 'cell_delete',
        CELL_PASTE: 'cell_paste',
        COL_INSERT: 'col_insert',
        COL_DELETE: 'col_delete',
        COL_RESIZE: 'col_resize',
        ROW_INSERT: 'row_insert',
        ROW_DELETE: 'row_delete',
        ROW_RESIZE: 'row_resize',
        SHEET_ADD: 'sheet_add',
        SHEET_DELETE: 'sheet_delete',
        SHEET_RENAME: 'sheet_rename',
        SHEET_ACTIVATE: 'sheet_activate',
        SORT: 'sort',
        MERGE: 'merge',
        UNMERGE: 'unmerge',
        CHART_ADD: 'chart_add',
        CHART_DELETE: 'chart_delete',
        CHART_UPDATE: 'chart_update',
        FREEZE: 'freeze',
        CONDITIONAL_FORMAT: 'conditional_format',
        DATA_VALIDATION: 'data_validation',
        NAMED_RANGE: 'named_range',
    });

    class Command {
        constructor(type, payload, description = '') {
            this.type = type;
            this.payload = payload;
            this.description = description;
            this.timestamp = Date.now();
        }
    }

    class CommandHistory {
        constructor(maxSize = 100) {
            this._undoStack = [];
            this._redoStack = [];
            this._maxSize = maxSize;
            this._listeners = new Set();
            this._batchMode = false;
            this._batchCommands = [];
        }

        get canUndo() { return this._undoStack.length > 0; }
        get canRedo() { return this._redoStack.length > 0; }
        get undoDescription() { return this._undoStack.length > 0 ? this._undoStack[this._undoStack.length - 1].description : ''; }
        get redoDescription() { return this._redoStack.length > 0 ? this._redoStack[this._redoStack.length - 1].description : ''; }

        push(command) {
            if (this._batchMode) {
                this._batchCommands.push(command);
                return;
            }

            this._undoStack.push(command);
            this._redoStack = [];

            if (this._undoStack.length > this._maxSize) {
                this._undoStack.shift();
            }

            this._notify();
        }

        undo() {
            if (!this.canUndo) return null;
            const command = this._undoStack.pop();
            this._redoStack.push(command);
            this._notify();
            return command;
        }

        redo() {
            if (!this.canRedo) return null;
            const command = this._redoStack.pop();
            this._undoStack.push(command);
            this._notify();
            return command;
        }

        startBatch(description = '') {
            this._batchMode = true;
            this._batchCommands = [];
            this._batchDescription = description;
        }

        endBatch() {
            this._batchMode = false;
            if (this._batchCommands.length > 0) {
                const batch = new Command(
                    'batch',
                    {
                        commands: this._batchCommands,
                        description: this._batchDescription,
                    },
                    this._batchDescription
                );
                this._undoStack.push(batch);
                this._redoStack = [];
                this._batchCommands = [];
                this._notify();
            }
        }

        cancelBatch() {
            this._batchMode = false;
            this._batchCommands = [];
        }

        addListener(callback) {
            this._listeners.add(callback);
            return () => this._listeners.delete(callback);
        }

        removeListener(callback) {
            this._listeners.delete(callback);
        }

        _notify() {
            for (const listener of this._listeners) {
                try {
                    listener({
                        canUndo: this.canUndo,
                        canRedo: this.canRedo,
                        undoDescription: this.undoDescription,
                        redoDescription: this.redoDescription,
                    });
                } catch (e) {
                    console.error('History listener error:', e);
                }
            }
        }

        clear() {
            this._undoStack = [];
            this._redoStack = [];
            this._notify();
        }

        getStackInfo() {
            return {
                undoCount: this._undoStack.length,
                redoCount: this._redoStack.length,
                maxSize: this._maxSize,
                undoStack: this._undoStack.map(c => ({
                    type: c.type,
                    description: c.description,
                    timestamp: c.timestamp,
                })),
                redoStack: this._redoStack.map(c => ({
                    type: c.type,
                    description: c.description,
                    timestamp: c.timestamp,
                })),
            };
        }
    }

    window.SpreadsheetCommandType = CommandType;
    window.SpreadsheetCommand = Command;
    window.SpreadsheetCommandHistory = CommandHistory;
})();
