/**
 * Find & Replace - Full dialog with regex support
 */
(function() {
    'use strict';

    class FindReplace {
        constructor(model) {
            this._model = model;
            this._searchText = '';
            this._replaceText = '';
            this._matchCase = false;
            this._matchEntireCell = false;
            this._useRegex = false;
            this._searchInFormulas = false;
            this._searchInHeaders = false;
            this._direction = 'all';
            this._matches = [];
            this._currentMatchIndex = -1;
        }

        get searchText() { return this._searchText; }
        set searchText(val) { this._searchText = val; this._find(); }

        get replaceText() { return this._replaceText; }
        set replaceText(val) { this._replaceText = val; }

        get matchCase() { return this._matchCase; }
        set matchCase(val) { this._matchCase = val; this._find(); }

        get matchEntireCell() { return this._matchEntireCell; }
        set matchEntireCell(val) { this._matchEntireCell = val; this._find(); }

        get useRegex() { return this._useRegex; }
        set useRegex(val) { this._useRegex = val; this._find(); }

        get searchInFormulas() { return this._searchInFormulas; }
        set searchInFormulas(val) { this._searchInFormulas = val; this._find(); }

        get matches() { return [...this._matches]; }
        get matchCount() { return this._matches.length; }
        get currentMatchIndex() { return this._currentMatchIndex; }
        get currentMatch() {
            return this._currentMatchIndex >= 0 && this._currentMatchIndex < this._matches.length
                ? this._matches[this._currentMatchIndex]
                : null;
        }

        _find() {
            this._matches = [];
            this._currentMatchIndex = -1;

            if (!this._searchText) return;

            const pattern = this._buildPattern();
            if (!pattern) return;

            for (let r = 0; r < this._model.rowCount; r++) {
                for (let c = 0; c < this._model.colCount; c++) {
                    const cell = this._model.getCell(c, r);
                    if (!cell) continue;

                    let searchText = '';
                    if (this._searchInFormulas) {
                        searchText = cell.raw || '';
                    } else {
                        searchText = String(cell.value || cell.raw || '');
                    }

                    if (this._matchInText(searchText, pattern)) {
                        this._matches.push({
                            col: c,
                            row: r,
                            cellRef: window.SpreadsheetRange.cellRef(c, r),
                            value: searchText,
                            inFormula: this._searchInFormulas && cell.raw !== String(cell.value),
                        });
                    }
                }
            }

            if (this._matches.length > 0) {
                this._currentMatchIndex = 0;
            }
        }

        _buildPattern() {
            const text = this._searchText;
            const flags = this._matchCase ? 'g' : 'gi';

            try {
                if (this._useRegex) {
                    return new RegExp(text, flags);
                }
                const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return new RegExp(escaped, flags);
            } catch (e) {
                return null;
            }
        }

        _matchInText(text, pattern) {
            const testText = this._matchCase ? text : text.toLowerCase();
            const testPattern = this._matchCase ? pattern : new RegExp(pattern.source, 'gi');

            if (this._matchEntireCell) {
                return testPattern.test(testText) && testText.length === this._searchText.length;
            }
            return testPattern.test(testText);
        }

        findNext() {
            if (this._matches.length === 0) return null;
            this._currentMatchIndex = (this._currentMatchIndex + 1) % this._matches.length;
            return this.currentMatch;
        }

        findPrevious() {
            if (this._matches.length === 0) return null;
            this._currentMatchIndex = (this._currentMatchIndex - 1 + this._matches.length) % this._matches.length;
            return this.currentMatch;
        }

        replaceCurrent() {
            const match = this.currentMatch;
            if (!match) return false;

            const cell = this._model.getCell(match.col, match.row);
            if (!cell) return false;

            const oldRaw = cell.raw;
            const pattern = this._buildPattern();
            if (!pattern) return false;

            const newRaw = oldRaw.replace(pattern, this._replaceText);
            this._model.setCellRaw(match.col, match.row, newRaw);

            this._find();
            return true;
        }

        replaceAll() {
            if (this._matches.length === 0) return 0;

            const pattern = this._buildPattern();
            if (!pattern) return 0;

            let replaced = 0;
            for (const match of [...this._matches]) {
                const cell = this._model.getCell(match.col, match.row);
                if (!cell) continue;

                const oldRaw = cell.raw;
                const newRaw = oldRaw.replace(pattern, this._replaceText);
                if (newRaw !== oldRaw) {
                    this._model.setCellRaw(match.col, match.row, newRaw);
                    replaced++;
                }
            }

            this._find();
            return replaced;
        }

        reset() {
            this._searchText = '';
            this._replaceText = '';
            this._matchCase = false;
            this._matchEntireCell = false;
            this._useRegex = false;
            this._searchInFormulas = false;
            this._matches = [];
            this._currentMatchIndex = -1;
        }

        getMatchHighlight(col, row) {
            for (let i = 0; i < this._matches.length; i++) {
                const m = this._matches[i];
                if (m.col === col && m.row === row) {
                    return {
                        isMatch: true,
                        isCurrent: i === this._currentMatchIndex,
                        index: i,
                        total: this._matches.length,
                    };
                }
            }
            return null;
        }
    }

    window.SpreadsheetFindReplace = FindReplace;
})();
