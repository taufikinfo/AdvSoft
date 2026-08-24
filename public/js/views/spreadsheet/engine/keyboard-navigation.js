/**
 * Keyboard Navigation - Full arrow keys, Tab, Ctrl+Enter, multi-select
 * Follows Odoo advsoft-spreadsheet keyboard navigation pattern
 */
(function() {
    'use strict';

    const NavigationKey = Object.freeze({
        ARROW_UP: 'ArrowUp',
        ARROW_DOWN: 'ArrowDown',
        ARROW_LEFT: 'ArrowLeft',
        ARROW_RIGHT: 'ArrowRight',
        TAB: 'Tab',
        SHIFT_TAB: 'ShiftTab',
        ENTER: 'Enter',
        SHIFT_ENTER: 'ShiftEnter',
        CTRL_ENTER: 'ControlEnter',
        SPACE: ' ',
        PAGE_UP: 'PageUp',
        PAGE_DOWN: 'PageDown',
        HOME: 'Home',
        CTRL_HOME: 'ControlHome',
        END: 'End',
        CTRL_END: 'ControlEnd',
    });

    const SelectionMode = Object.freeze({
        SINGLE: 'single',
        RANGE: 'range',
        COLUMN: 'column',
        ROW: 'row',
        ALL: 'all',
    });

    class KeyboardNavigation {
        constructor(model, config = {}) {
            this._model = model;
            this._selection = null;
            this._activeCell = { col: 0, row: 0 };
            this._selectionMode = SelectionMode.SINGLE;
            this._isSelecting = false;
            this._anchorCell = null;
            this._listeners = new Map();
            this._enabled = true;
            this._editMode = false;
            this._moveStack = [];
            this._lastMoveTime = 0;
        }

        get activeCell() { return this._activeCell; }
        get selection() { return this._selection; }
        get selectionMode() { return this._selectionMode; }
        get isSelecting() { return this._isSelecting; }
        get enabled() { return this._enabled; }
        set enabled(val) { this._enabled = val; }

        setup() {
            this._boundKeyDown = (e) => this._handleKeyDown(e);
            this._boundKeyUp = (e) => this._handleKeyUp(e);
            document.addEventListener('keydown', this._boundKeyDown);
            document.addEventListener('keyup', this._boundKeyUp);
        }

        destroy() {
            if (this._boundKeyDown) {
                document.removeEventListener('keydown', this._boundKeyDown);
                this._boundKeyDown = null;
            }
            if (this._boundKeyUp) {
                document.removeEventListener('keyup', this._boundKeyUp);
                this._boundKeyUp = null;
            }
        }

        _handleKeyDown(e) {
            if (!this._enabled) return;
            if (this._isInputFocused()) return;

            const key = this._getKey(e);
            const handlers = this._getHandlers();
            const handler = handlers[key];

            if (handler) {
                e.preventDefault();
                e.stopPropagation();
                handler(e);
            }
        }

        _handleKeyUp(e) {
            if (e.key === 'Shift') {
                this._isSelecting = false;
            }
        }

        _getKey(e) {
            const shift = e.shiftKey;
            const ctrl = e.ctrlKey || e.metaKey;

            if (e.key === 'Tab') return shift ? 'ShiftTab' : 'Tab';
            if (e.key === 'Enter') {
                if (ctrl) return 'ControlEnter';
                return shift ? 'ShiftEnter' : 'Enter';
            }
            if (ctrl) {
                switch (e.key) {
                    case 'ArrowUp': return 'ControlArrowUp';
                    case 'ArrowDown': return 'ControlArrowDown';
                    case 'ArrowLeft': return 'ControlArrowLeft';
                    case 'ArrowRight': return 'ControlArrowRight';
                    case 'Home': return 'ControlHome';
                    case 'End': return 'ControlEnd';
                    case 'a': return 'ControlA';
                    case 'z': return 'ControlZ';
                    case 'y': return 'ControlY';
                    case 'c': return 'ControlC';
                    case 'v': return 'ControlV';
                    case 'x': return 'ControlX';
                    case 'f': return 'ControlF';
                    case 'h': return 'ControlH';
                    case 'b': return 'ControlB';
                    case 'i': return 'ControlI';
                    case 'u': return 'ControlU';
                    default: return null;
                }
            }
            return e.key;
        }

        _getHandlers() {
            return {
                ArrowUp: () => this._moveUp(),
                ArrowDown: () => this._moveDown(),
                ArrowLeft: () => this._moveLeft(),
                ArrowRight: () => this._moveRight(),
                Tab: () => this._moveRight(true),
                ShiftTab: () => this._moveLeft(true),
                Enter: () => this._moveDown(true),
                ShiftEnter: () => this._moveUp(true),
                ControlEnter: () => this._enterEditMode(),
                ' ': () => this._toggleSelection(),
                PageUp: () => this._pageUp(),
                PageDown: () => this._pageDown(),
                Home: () => this._goHome(),
                ControlHome: () => this._goToStart(),
                End: () => this._goEnd(),
                ControlEnd: () => this._goToEnd(),
                ControlArrowUp: () => this._jumpUp(),
                ControlArrowDown: () => this._jumpDown(),
                ControlArrowLeft: () => this._jumpLeft(),
                ControlArrowRight: () => this._jumpRight(),
                ControlA: () => this._selectAll(),
                ControlZ: () => this._undo(),
                ControlY: () => this._redo(),
                ControlC: () => this._copy(),
                ControlV: () => this._paste(),
                ControlX: () => this._cut(),
                ControlF: () => this._find(),
                ControlH: () => this._findReplace(),
                ControlB: () => this._toggleBold(),
                ControlI: () => this._toggleItalic(),
                ControlU: () => this._toggleUnderline(),
                Delete: () => this._deleteSelection(),
                Backspace: () => this._clearAndEdit(),
                F2: () => this._enterEditMode(),
                Escape: () => this._escape(),
            };
        }

        _isInputFocused() {
            const active = document.activeElement;
            return active && (
                active.tagName === 'INPUT' ||
                active.tagName === 'TEXTAREA' ||
                active.isContentEditable ||
                active.classList.contains('ls-ss-cell-editor') ||
                active.classList.contains('ls-ss-formula-input')
            );
        }

        setEditMode(editing) {
            this._editMode = editing;
        }

        moveUp(shiftKey = false) {
            this._move(-1, 0, shiftKey);
        }

        moveDown(shiftKey = false) {
            this._move(1, 0, shiftKey);
        }

        moveLeft(shiftKey = false) {
            this._move(0, -1, shiftKey);
        }

        moveRight(shiftKey = false) {
            this._move(0, 1, shiftKey);
        }

        _moveUp(shiftKey = false) {
            this._move(-1, 0, shiftKey);
        }

        _moveDown(shiftKey = false) {
            this._move(1, 0, shiftKey);
        }

        _moveLeft(shiftKey = false) {
            this._move(0, -1, shiftKey);
        }

        _moveRight(shiftKey = false) {
            this._move(0, 1, shiftKey);
        }

        _move(rowDelta, colDelta, extend = false) {
            const newCol = Math.max(0, Math.min(this._model.colCount - 1, this._activeCell.col + colDelta));
            const newRow = Math.max(0, Math.min(this._model.rowCount - 1, this._activeCell.row + rowDelta));

            if (newCol === this._activeCell.col && newRow === this._activeCell.row) return;

            if (extend) {
                this._extendSelection(newCol, newRow);
            } else {
                this._anchorCell = { col: newCol, row: newRow };
                this._selection = window.SelectionZone.fromSingleCell(
                    window.SpreadsheetRange.cellRef(newCol, newRow)
                );
            }

            this._activeCell = { col: newCol, row: newRow };
            this._emit('moved', this._activeCell);
        }

        _extendSelection(col, row) {
            if (!this._anchorCell) {
                this._anchorCell = { ...this._activeCell };
            }
            this._selection = new window.SelectionZone(
                this._anchorCell.col,
                this._anchorCell.row,
                col,
                row
            );
            this._selectionMode = SelectionMode.RANGE;
            this._isSelecting = true;
        }

        _pageUp() {
            const pageSize = Math.max(1, Math.floor(this._getViewportHeight() / this._model.getRowHeight(0)));
            this._move(-pageSize, 0, false);
        }

        _pageDown() {
            const pageSize = Math.max(1, Math.floor(this._getViewportHeight() / this._model.getRowHeight(0)));
            this._move(pageSize, 0, false);
        }

        _getViewportHeight() {
            const container = document.querySelector('.ls-ss-container');
            return container ? container.clientHeight : 600;
        }

        _goHome() {
            this._activeCell = { col: 0, row: this._activeCell.row };
            this._anchorCell = { ...this._activeCell };
            this._selection = window.SelectionZone.fromSingleCell(
                window.SpreadsheetRange.cellRef(0, this._activeCell.row)
            );
            this._emit('moved', this._activeCell);
        }

        _goEnd() {
            const lastCol = this._findLastUsedColInRow(this._activeCell.row);
            this._activeCell = { col: lastCol, row: this._activeCell.row };
            this._anchorCell = { ...this._activeCell };
            this._selection = window.SelectionZone.fromSingleCell(
                window.SpreadsheetRange.cellRef(lastCol, this._activeCell.row)
            );
            this._emit('moved', this._activeCell);
        }

        _goToStart() {
            this._activeCell = { col: 0, row: 0 };
            this._anchorCell = { ...this._activeCell };
            this._selection = window.SelectionZone.fromSingleCell('A1');
            this._emit('moved', this._activeCell);
        }

        _goToEnd() {
            const lastRow = this._findLastUsedRow();
            const lastCol = this._findLastUsedColInRow(lastRow);
            this._activeCell = { col: lastCol, row: lastRow };
            this._anchorCell = { ...this._activeCell };
            this._selection = window.SelectionZone.fromSingleCell(
                window.SpreadsheetRange.cellRef(lastCol, lastRow)
            );
            this._emit('moved', this._activeCell);
        }

        _jumpUp() {
            let row = this._activeCell.row - 1;
            while (row >= 0 && !this._hasContent(this._activeCell.col, row)) {
                row--;
            }
            if (row >= 0) {
                this._activeCell = { col: this._activeCell.col, row };
                this._anchorCell = { ...this._activeCell };
                this._selection = window.SelectionZone.fromSingleCell(
                    window.SpreadsheetRange.cellRef(this._activeCell.col, row)
                );
                this._emit('moved', this._activeCell);
            }
        }

        _jumpDown() {
            let row = this._activeCell.row + 1;
            while (row < this._model.rowCount && !this._hasContent(this._activeCell.col, row)) {
                row++;
            }
            if (row < this._model.rowCount) {
                this._activeCell = { col: this._activeCell.col, row };
                this._anchorCell = { ...this._activeCell };
                this._selection = window.SelectionZone.fromSingleCell(
                    window.SpreadsheetRange.cellRef(this._activeCell.col, row)
                );
                this._emit('moved', this._activeCell);
            }
        }

        _jumpLeft() {
            let col = this._activeCell.col - 1;
            while (col >= 0 && !this._hasContent(col, this._activeCell.row)) {
                col--;
            }
            if (col >= 0) {
                this._activeCell = { col, row: this._activeCell.row };
                this._anchorCell = { ...this._activeCell };
                this._selection = window.SelectionZone.fromSingleCell(
                    window.SpreadsheetRange.cellRef(col, this._activeCell.row)
                );
                this._emit('moved', this._activeCell);
            }
        }

        _jumpRight() {
            let col = this._activeCell.col + 1;
            while (col < this._model.colCount && !this._hasContent(col, this._activeCell.row)) {
                col++;
            }
            if (col < this._model.colCount) {
                this._activeCell = { col, row: this._activeCell.row };
                this._anchorCell = { ...this._activeCell };
                this._selection = window.SelectionZone.fromSingleCell(
                    window.SpreadsheetRange.cellRef(col, this._activeCell.row)
                );
                this._emit('moved', this._activeCell);
            }
        }

        _hasContent(col, row) {
            const cell = this._model.getCell(col, row);
            return cell && cell.raw !== '' && cell.raw !== null && cell.raw !== undefined;
        }

        _findLastUsedColInRow(row) {
            for (let c = this._model.colCount - 1; c >= 0; c--) {
                if (this._hasContent(c, row)) return c;
            }
            return 0;
        }

        _findLastUsedRow() {
            for (let r = this._model.rowCount - 1; r >= 0; r--) {
                for (let c = 0; c < this._model.colCount; c++) {
                    if (this._hasContent(c, r)) return r;
                }
            }
            return 0;
        }

        _selectAll() {
            this._selection = new window.SelectionZone(
                0, 0,
                this._model.colCount - 1,
                this._model.rowCount - 1
            );
            this._selectionMode = SelectionMode.ALL;
            this._emit('selectionChanged', { selection: this._selection });
        }

        _toggleSelection() {
            if (this._selectionMode === SelectionMode.RANGE) {
                this._selectionMode = SelectionMode.SINGLE;
            } else {
                this._selectionMode = SelectionMode.RANGE;
            }
        }

        _enterEditMode() {
            this._editMode = true;
            this._emit('editModeChanged', { editing: true, cell: this._activeCell });
        }

        _escape() {
            if (this._editMode) {
                this._editMode = false;
                this._emit('editModeChanged', { editing: false });
            } else if (this._selectionMode !== SelectionMode.SINGLE) {
                this._selectionMode = SelectionMode.SINGLE;
                this._selection = window.SelectionZone.fromSingleCell(
                    window.SpreadsheetRange.cellRef(this._activeCell.col, this._activeCell.row)
                );
                this._emit('selectionChanged', { selection: this._selection });
            }
        }

        _undo() {
            this._model.undo();
            this._emit('stateChanged', { reason: 'undo' });
        }

        _redo() {
            this._model.redo();
            this._emit('stateChanged', { reason: 'redo' });
        }

        _copy() {
            this._emit('copy', { selection: this._selection });
        }

        _paste() {
            this._emit('paste', { cell: this._activeCell });
        }

        _cut() {
            this._emit('cut', { selection: this._selection });
        }

        _deleteSelection() {
            this._emit('deleteSelection', { selection: this._selection });
        }

        _clearAndEdit() {
            this._emit('clearAndEdit', { cell: this._activeCell });
        }

        _find() {
            this._emit('openFind');
        }

        _findReplace() {
            this._emit('openFindReplace');
        }

        _toggleBold() {
            this._emit('toggleFormat', { format: 'bold' });
        }

        _toggleItalic() {
            this._emit('toggleFormat', { format: 'italic' });
        }

        _toggleUnderline() {
            this._emit('toggleFormat', { format: 'underline' });
        }

        setActiveCell(col, row) {
            this._activeCell = { col, row };
            this._anchorCell = { col, row };
            this._selection = window.SelectionZone.fromSingleCell(
                window.SpreadsheetRange.cellRef(col, row)
            );
            this._emit('activeCellChanged', this._activeCell);
        }

        moveToCell(col, row) {
            this._activeCell = {
                col: Math.max(0, Math.min(this._model.colCount - 1, col)),
                row: Math.max(0, Math.min(this._model.rowCount - 1, row)),
            };
            this._anchorCell = { ...this._activeCell };
            this._selection = window.SelectionZone.fromSingleCell(
                window.SpreadsheetRange.cellRef(this._activeCell.col, this._activeCell.row)
            );
            this._emit('moved', this._activeCell);
        }

        on(event, callback) {
            if (!this._listeners.has(event)) {
                this._listeners.set(event, new Set());
            }
            this._listeners.get(event).add(callback);
            return () => this._listeners.get(event)?.delete(callback);
        }

        _emit(event, data) {
            const listeners = this._listeners.get(event);
            if (listeners) {
                for (const cb of listeners) {
                    try { cb(data); } catch (e) { console.error(`Navigation event ${event} error:`, e); }
                }
            }
        }
    }

    window.SpreadsheetSelectionMode = SelectionMode;
    window.SpreadsheetKeyboardNavigation = KeyboardNavigation;
})();
