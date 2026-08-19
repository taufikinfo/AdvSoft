// ══════════════════════════════════════════════════════════════
//  InlineTree — Bulk Actions
//  Selection + bulk delete/duplicate/archive
// ══════════════════════════════════════════════════════════════
(function () {
const RPC = window.LarasoftRPC;

async function bulkDelete(childModel, lineIds) {
    if (!lineIds || !lineIds.length) return { success: true, deleted: 0 };
    const result = await RPC.call('/api/orm/bulk_delete_child', {
        child_model: childModel,
        ids: lineIds,
    });
    return { success: true, deleted: lineIds.length, result };
}

async function bulkDuplicate(parentModel, fieldName, inverseField, parentId, sourceLines) {
    if (!sourceLines || !sourceLines.length) return [];
    const payloads = sourceLines.map(line => {
        const cp = { ...line };
        delete cp.id;
        delete cp.__temp_id;
        if (inverseField) cp[inverseField] = parentId;
        return cp;
    });
    const result = await RPC.call('/api/orm/bulk_create_child', {
        parent_model: parentModel,
        field: fieldName,
        records: payloads,
    });
    return Array.isArray(result) ? result : (result.records || []);
}

async function bulkArchive(childModel, lineIds, archiveValue) {
    const result = await RPC.call('/api/orm/bulk_write_child', {
        child_model: childModel,
        ids: lineIds,
        values: { active: archiveValue },
    });
    return result;
}

function selectRange(state, fromId, toId) {
    const lines = state.lines;
    const fromIdx = lines.findIndex(l => (l.id || l.__temp_id) === fromId);
    const toIdx = lines.findIndex(l => (l.id || l.__temp_id) === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
    for (let i = start; i <= end; i++) {
        const id = lines[i].id || lines[i].__temp_id;
        if (!state.selection.includes(id)) state.selection.push(id);
    }
}

function exportCsv(columns, lines) {
    const header = columns.map(c => '"' + c.label.replace(/"/g, '""') + '"').join(',');
    const rows = lines.map(line => {
        return columns.map(col => {
            let v = line[col.name];
            if (Array.isArray(v)) v = v[1] || v[0];
            if (v == null) v = '';
            return '"' + String(v).replace(/"/g, '""') + '"';
        }).join(',');
    });
    return header + '\n' + rows.join('\n');
}

window.InlineTreeBulk = {
    bulkDelete,
    bulkDuplicate,
    bulkArchive,
    selectRange,
    exportCsv,
};
})();
