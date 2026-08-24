// ══════════════════════════════════════════════════════════════
//  InlineTree — Onchange Pipeline (debounced)
//  Mirrors _triggerOnchange for O2M line-level onchange
// ══════════════════════════════════════════════════════════════
(function () {
const RPC = window.AdvSoftRPC;

function useInlineTreeOnchange(state, props) {
    const pending = new Map();
    const debounceMs = 250;
    // onchange_handlers may be an array or object; normalise to a Set
    const rawHandlers = (props.tabDef && props.tabDef.onchange_handlers) || [];
    const handlers = new Set(Array.isArray(rawHandlers) ? rawHandlers : Object.values(rawHandlers).flat());

    async function trigger(rowId, field) {
        const row = state.lines.find(l => (l.id || l.__temp_id) === rowId);
        if (!row) return;
        const childModel = props.tabDef && props.tabDef.child_model;
        if (!childModel) return;

        // Build context: include parent record id and any tab-level context
        const context = {
            ...(props.tabDef.context || {}),
            parent_id: props.parentRecord && props.parentRecord.id,
        };

        // Snapshot current row values, normalising M2O to scalar id
        const values = {};
        const childDefs = props.tabDef.child_field_defs || {};
        for (const [k, v] of Object.entries(row)) {
            if (k.startsWith('__')) continue;
            const fdef = childDefs[k];
            if (fdef && fdef.type === 'many2one') {
                values[k] = Array.isArray(v) ? (v[0] ?? null) : v;
            } else if (fdef && fdef.type === 'one2many') {
                // Skip nested O2M in snapshot
            } else {
                values[k] = v;
            }
        }

        try {
            const result = await RPC.call('/api/orm/onchange_o2m', {
                child_model: childModel,
                changed_field: field,
                values,
                context,
            });

            if (result && result.values) {
                const changed = (result.changed_fields || Object.keys(result.values))
                    .filter(f => f !== field);

                // Apply to local row immediately (UI reflects new values)
                for (const [k, v] of Object.entries(result.values)) {
                    const fdef = childDefs[k];
                    if (fdef && (fdef.type === 'many2one' || fdef.type === 'many2one_avatar' || fdef.type === 'many2onebutton') && v != null && !Array.isArray(v)) {
                        const cur = row[k];
                        if (Array.isArray(cur) && cur[0] == v) {
                            // Preserve [id, name] array if server returned scalar ID matching current
                            continue;
                        }
                    }
                    row[k] = v;
                }

                // Batch write all cascaded fields in a SINGLE RPC
                if (changed.length && props.onLineBatchUpdate) {
                    const batchValues = {};
                    changed.forEach(f => { batchValues[f] = row[f]; });
                    props.onLineBatchUpdate(rowId, batchValues);
                } else if (changed.length && props.onLineUpdate) {
                    changed.forEach(f => props.onLineUpdate(rowId, f, row[f], row[f]));
                }
            }

            if (result && result.warning) {
                if (window.AdvSoftToast) window.AdvSoftToast.warn(result.warning);
                else console.warn('[Onchange warning]', result.warning);
            }
        } catch (e) {
            console.warn('onchange_o2m failed:', e);
        }
    }

    function schedule(rowId, field) {
        // Only trigger if this field has a registered onchange handler
        if (handlers.size > 0 && !handlers.has(field)) return;
        const key = rowId + ':' + field;
        clearTimeout(pending.get(key)?.timer);
        const t = setTimeout(() => {
            pending.delete(key);
            trigger(rowId, field);
        }, debounceMs);
        pending.set(key, { field, timer: t });
    }

    /** Force-run onchange immediately (no debounce) — used on row blur */
    function flush(rowId, field) {
        const key = rowId + ':' + field;
        const entry = pending.get(key);
        if (entry) {
            clearTimeout(entry.timer);
            pending.delete(key);
            trigger(rowId, field);
        }
    }

    return { trigger, schedule, flush };
}

window.useInlineTreeOnchange = useInlineTreeOnchange;
})();
