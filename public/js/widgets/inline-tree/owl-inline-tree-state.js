// ══════════════════════════════════════════════════════════════
//  InlineTree — Reactive State Hook
//  Centralized state for tree: lines, selection, undo, dirty flags
//  + Section Grouping state (groups, isFolded, groupBy)
// ══════════════════════════════════════════════════════════════
(function () {
const { useState } = owl;

function useInlineTreeState(props, env) {
    const state = useState({
        lines: props.lines || [],
        selection: [],
        editingIds: [],
        primaryEditingId: null,
        showSelect: false,
        readOnly: false,
        optionalHidden: new Set(),
        columnWidths: {},
        columnOrder: [],
        undoStack: [],
        redoStack: [],
        pendingOnchange: new Map(),
        rowStatus: {},
        loading: false,
        loadingMore: false,
        hasMoreLines: null,     // null = unknown, true/false set by loadMore
        rowLoading: {},         // { [lineId]: true } - row-level loading
        rowErrors: {},          // { [lineId]: 'field: msg' } - validation errors
        sortBy: null,           // { field: 'name', dir: 'asc'|'desc' }
        scrolled: false,        // true once user scrolls the table (for sticky shadow)
        showOptionalPopover: false,

        // ── Section Grouping State ──────────────────
        groupBy: null,            // string field name or null (flat mode)
        groups: [],               // array of group objects { id, name, value, __count, __aggregates, records, isFolded }
        groupLoading: {},         // { [groupId]: true } - group-level loading
        activeGroupBy: null,      // currently active group-by field (runtime override)
        groupByOptions: [],       // available group-by fields from tabDef
    });

    function commitEdit(lineId, field, value) {
        const line = state.lines.find(l => (l.id || l.__temp_id) === lineId);
        if (!line) {
            // Also search in grouped records
            if (state.groupBy && state.groups.length) {
                for (const g of state.groups) {
                    const gLine = (g.records || []).find(l => (l.id || l.__temp_id) === lineId);
                    if (gLine) {
                        pushUndo(lineId);
                        gLine[field] = value;
                        state.rowStatus[lineId] = 'dirty';
                        return;
                    }
                }
            }
            return;
        }
        pushUndo(lineId);
        line[field] = value;
        state.rowStatus[lineId] = 'dirty';
    }

    function pushUndo(lineId) {
        const line = _findLine(lineId);
        if (!line) return;
        state.undoStack.push({ lineId, snapshot: { ...line } });
        if (state.undoStack.length > 50) state.undoStack.shift();
        state.redoStack = [];
    }

    /** Find a line across flat lines and grouped records */
    function _findLine(lineId) {
        let line = state.lines.find(l => (l.id || l.__temp_id) === lineId);
        if (line) return line;
        if (state.groupBy && state.groups.length) {
            for (const g of state.groups) {
                line = (g.records || []).find(l => (l.id || l.__temp_id) === lineId);
                if (line) return line;
            }
        }
        return null;
    }

    function undo() {
        const u = state.undoStack.pop();
        if (!u) return;
        const line = _findLine(u.lineId);
        if (!line) return;
        state.redoStack.push({ lineId: u.lineId, snapshot: { ...line } });
        Object.assign(line, u.snapshot);
        state.rowStatus[u.lineId] = 'dirty';
    }

    function redo() {
        const r = state.redoStack.pop();
        if (!r) return;
        const line = _findLine(r.lineId);
        if (!line) return;
        state.undoStack.push({ lineId: r.lineId, snapshot: { ...line } });
        Object.assign(line, r.snapshot);
        state.rowStatus[r.lineId] = 'dirty';
    }

    function isSelected(line) {
        return state.selection.includes(line.id || line.__temp_id);
    }

    function toggleSelect(line) {
        const id = line.id || line.__temp_id;
        const idx = state.selection.indexOf(id);
        if (idx >= 0) state.selection.splice(idx, 1);
        else state.selection.push(id);
    }

    function selectAll() {
        if (state.groupBy && state.groups.length) {
            // Select all records from all expanded groups
            const allIds = [];
            for (const g of state.groups) {
                if (!g.isFolded) {
                    for (const r of (g.records || [])) {
                        allIds.push(r.id || r.__temp_id);
                    }
                }
            }
            state.selection = allIds;
        } else {
            state.selection = state.lines.map(l => l.id || l.__temp_id);
        }
    }

    function clearSelection() {
        state.selection = [];
    }

    function enterEdit(lineId, multiEdit) {
        if (multiEdit) {
            if (!state.editingIds.includes(lineId)) state.editingIds.push(lineId);
        } else {
            state.editingIds = [lineId];
        }
        state.primaryEditingId = lineId;
    }

    function exitEdit(lineId) {
        const idx = state.editingIds.indexOf(lineId);
        if (idx >= 0) state.editingIds.splice(idx, 1);
        if (state.primaryEditingId === lineId) state.primaryEditingId = null;
    }

    function exitAllEdits() {
        state.editingIds = [];
        state.primaryEditingId = null;
    }

    function markSaved(lineId) {
        state.rowStatus[lineId] = 'saved';
        setTimeout(() => {
            if (state.rowStatus[lineId] === 'saved') delete state.rowStatus[lineId];
        }, 1500);
    }

    function markError(lineId, message) {
        state.rowStatus[lineId] = 'error';
        console.error(`InlineTree row ${lineId} error:`, message);
    }

    /**
     * Toggle sort on a column field.
     * - First click: asc
     * - Second click (same field): desc
     * - Third click (same field): clear sort
     * Sorts state.lines in-place (client-side, for already-loaded data).
     * For server-side sort, caller should reload via loadO2m.
     */
    function toggleSort(field) {
        const current = state.sortBy;
        let newDir = 'asc';
        if (current && current.field === field) {
            if (current.dir === 'asc') newDir = 'desc';
            else {
                // Third click: clear
                state.sortBy = null;
                return;
            }
        }
        state.sortBy = { field, dir: newDir };
        // Client-side sort (works for already-loaded lines)
        _sortLines(field, newDir);
    }

    function _sortLines(field, dir) {
        state.lines = [...state.lines].sort((a, b) => {
            let av = a[field], bv = b[field];
            // M2O: [id, name] → compare by name
            if (Array.isArray(av)) av = av[1] ?? av[0];
            if (Array.isArray(bv)) bv = bv[1] ?? bv[0];
            if (av == null) av = '';
            if (bv == null) bv = '';
            // Numeric comparison
            const an = Number(av), bn = Number(bv);
            if (!isNaN(an) && !isNaN(bn)) {
                return dir === 'asc' ? an - bn : bn - an;
            }
            // String comparison
            const as = String(av).toLowerCase(), bs = String(bv).toLowerCase();
            if (as < bs) return dir === 'asc' ? -1 : 1;
            if (as > bs) return dir === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // ── Section Grouping Methods ──────────────────────

    /**
     * Set group-by field and initialize groups.
     * @param {string|null} fieldName - The field to group by, or null to disable.
     * @param {Array} groups - Pre-loaded group data from server.
     */
    function setGroupBy(fieldName, groups = []) {
        state.groupBy = fieldName;
        state.groups = groups.map(g => ({
            ...g,
            isFolded: g.isFolded ?? false,
            records: g.records || [],
            _loaded: !!(g.records && g.records.length),
        }));
        state.activeGroupBy = fieldName;
    }

    /**
     * Toggle fold/unfold state of a group.
     * @param {*} groupId - The group identifier (value of the group_by field).
     */
    function toggleGroupFold(groupId) {
        const group = state.groups.find(g => g.id === groupId || g.value === groupId);
        if (!group) return;
        group.isFolded = !group.isFolded;
    }

    /**
     * Set records for a specific group (after lazy-loading).
     * @param {*} groupId
     * @param {Array} records
     */
    function setGroupRecords(groupId, records) {
        const group = state.groups.find(g => g.id === groupId || g.value === groupId);
        if (!group) return;
        group.records = records;
        group._loaded = true;
    }

    /**
     * Add a record to a specific group.
     */
    function addToGroup(groupId, record) {
        const group = state.groups.find(g => g.id === groupId || g.value === groupId);
        if (!group) return;
        group.records.push(record);
        group.__count = (group.__count || 0) + 1;
    }

    /**
     * Remove a record from its group.
     */
    function removeFromGroup(groupId, lineId) {
        const group = state.groups.find(g => g.id === groupId || g.value === groupId);
        if (!group) return;
        group.records = group.records.filter(r => (r.id || r.__temp_id) !== lineId);
        group.__count = Math.max(0, (group.__count || 0) - 1);
    }

    /**
     * Find which group a line belongs to.
     */
    function findGroupForLine(lineId) {
        for (const g of state.groups) {
            if ((g.records || []).find(r => (r.id || r.__temp_id) === lineId)) {
                return g;
            }
        }
        return null;
    }

    /**
     * Get all visible lines (expanded groups only) for aggregate calculations.
     */
    function getAllVisibleLines() {
        if (!state.groupBy || !state.groups.length) {
            return state.lines;
        }
        const all = [];
        for (const g of state.groups) {
            if (!g.isFolded) {
                all.push(...(g.records || []));
            }
        }
        return all;
    }

    /**
     * Compute per-group aggregate for a field.
     */
    function computeGroupAggregate(group, fieldName, type = 'sum') {
        const records = group.records || [];
        if (!records.length) {
            // Use server-side aggregates if available
            if (group.__aggregates && group.__aggregates[fieldName]) {
                return group.__aggregates[fieldName][type] || 0;
            }
            return 0;
        }
        const vals = records.map(r => {
            let v = r[fieldName];
            if (Array.isArray(v)) v = v[0];
            return parseFloat(v) || 0;
        });
        switch (type) {
            case 'sum': return vals.reduce((a, b) => a + b, 0);
            case 'avg': return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            case 'max': return Math.max(0, ...vals);
            case 'min': return vals.length ? Math.min(...vals) : 0;
            case 'count': return vals.length;
            default: return 0;
        }
    }

    return Object.assign(state, {
        commitEdit, pushUndo, undo, redo,
        isSelected, toggleSelect, selectAll, clearSelection,
        enterEdit, exitEdit, exitAllEdits, markSaved, markError,
        toggleSort,
        // Group methods
        setGroupBy, toggleGroupFold, setGroupRecords,
        addToGroup, removeFromGroup, findGroupForLine,
        getAllVisibleLines, computeGroupAggregate, _findLine,
    });
}

window.useInlineTreeState = useInlineTreeState;
})();
