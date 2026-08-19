// ══════════════════════════════════════════════════════════════
//  InlineTree — Cell Editors Registry
//  Strategy pattern: register render/edit/commit per widget type
// ══════════════════════════════════════════════════════════════
(function () {
const { markup } = owl;

function esc(v) {
    return v == null ? '' : String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Format a number with thousand separators and fixed decimals */
function formatNumber(val, decimals = 2, locale = 'id-ID') {
    const n = Number(val || 0);
    try {
        return n.toLocaleString(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    } catch (e) {
        return n.toFixed(decimals);
    }
}

function resolveM2oDisplay(val) {
    if (Array.isArray(val)) return val[1] ? String(val[1]) : '';
    if (val === false || val == null) return '';
    return String(val);
}

const CellEditors = {
    registry: new Map(),

    register(name, editor) {
        this.registry.set(name, editor);
    },

    get(name, type) {
        return this.registry.get(name) || this.registry.get(type) || this.registry.get('char');
    },

    render(col, line) {
        const editor = this.get(col.widget, col.type);
        return editor.render ? editor.render(col, line[col.name], line, col) : '';
    },

    edit(col, line, state) {
        const editor = this.get(col.widget, col.type);
        const val = line[col.name];
        const lineId = line.id || line.__temp_id;
        return editor.edit ? editor.edit(col, val, lineId, line, state) : '';
    },
};

// ── Char / default ─────────────────────────
CellEditors.register('char', {
    render(col, val) {
        return markup(`<span>${esc(val ?? '')}</span>`);
    },
    edit(col, val, lineId) {
        return markup(`<input type="text" class="ls-it-input" data-line-id="${lineId}" data-field="${col.name}" value="${esc(val ?? '')}" placeholder="${esc(col.label)}..."/>`);
    },
});

// ── Text (multiline) ───────────────────────
CellEditors.register('text', {
    render(col, val) {
        const txt = esc(val || '');
        return markup(`<span title="${txt}">${txt}</span>`);
    },
    edit(col, val, lineId) {
        return markup(`<textarea class="ls-it-input ls-it-textarea" data-line-id="${lineId}" data-field="${col.name}" rows="1">${esc(val || '')}</textarea>`);
    },
});

// ── Integer / Float / Monetary ─────────────
CellEditors.register('integer', {
    render(col, val) {
        const n = Number(val || 0);
        return markup(`<span style="font-variant-numeric:tabular-nums;white-space:nowrap">${esc(formatNumber(n, 0))}</span>`);
    },
    edit(col, val, lineId) {
        return markup(`<input type="text" inputmode="numeric" class="ls-it-input ls-it-number" data-line-id="${lineId}" data-field="${col.name}" value="${val ?? 0}"/>`);
    },
});
CellEditors.register('float', {
    render(col, val) {
        const n = Number(val || 0);
        const d = col.digits ? col.digits[1] : 2;
        return markup(`<span style="font-variant-numeric:tabular-nums;white-space:nowrap">${esc(formatNumber(n, d))}</span>`);
    },
    edit(col, val, lineId) {
        return markup(`<input type="text" inputmode="numeric" class="ls-it-input ls-it-number" data-line-id="${lineId}" data-field="${col.name}" value="${val ?? 0}"/>`);
    },
});
CellEditors.register('monetary', {
    render(col, val) {
        const n = Number(val || 0);
        const d = col.digits ? col.digits[1] : 2;
        const symbol = col.currency_symbol ? `<span style="color:#6b7280;margin-right:2px">${esc(col.currency_symbol)}</span>` : '';
        return markup(`<span style="font-variant-numeric:tabular-nums;white-space:nowrap">${symbol}${esc(formatNumber(n, d))}</span>`);
    },
    edit(col, val, lineId) {
        return markup(`<input type="text" inputmode="numeric" class="ls-it-input ls-it-number" data-line-id="${lineId}" data-field="${col.name}" value="${val ?? 0}"/>`);
    },
});
CellEditors.register('float_time', {
    render(col, val) {
        return markup(`<span style="font-variant-numeric:tabular-nums">${esc(val || 0)}h</span>`);
    },
    edit(col, val, lineId) {
        return markup(`<input type="text" inputmode="numeric" class="ls-it-input ls-it-number" data-line-id="${lineId}" data-field="${col.name}" value="${val ?? 0}" style="text-align:right"/>`);
    },
});
CellEditors.register('percentage', {
    render(col, val) {
        return markup(`<span style="font-variant-numeric:tabular-nums">${esc(val || 0)}%</span>`);
    },
    edit(col, val, lineId) {
        return markup(`<input type="text" inputmode="numeric" class="ls-it-input ls-it-number" data-line-id="${lineId}" data-field="${col.name}" value="${val ?? 0}" style="text-align:right"/>`);
    },
});

// ── Date / Datetime ────────────────────────
CellEditors.register('date', {
    render(col, val) {
        return markup(`<span style="color:#4b5563">${esc(val || '')}</span>`);
    },
    edit(col, val, lineId) {
        return markup(`<input type="date" class="ls-it-input" data-line-id="${lineId}" data-field="${col.name}" value="${esc(val || '')}"/>`);
    },
});
CellEditors.register('datetime', {
    render(col, val) {
        return markup(`<span style="color:#4b5563">${esc(val || '')}</span>`);
    },
    edit(col, val, lineId) {
        return markup(`<input type="datetime-local" class="ls-it-input" data-line-id="${lineId}" data-field="${col.name}" value="${esc((val || '').replace(' ', 'T'))}"/>`);
    },
});
CellEditors.register('remaining_days', {
    render(col, val) {
        if (!val) return markup('<span>—</span>');
        const target = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = Math.round((target - today) / 86400000);
        if (diff === 0) return markup('<span style="color:#3b82f6">Today</span>');
        if (diff > 0) return markup(`<span style="color:#10b981">In ${diff}d</span>`);
        return markup(`<span style="color:#ef4444">${Math.abs(diff)}d overdue</span>`);
    },
    edit(col, val, lineId) {
        return markup(`<input type="date" class="ls-it-input" data-line-id="${lineId}" data-field="${col.name}" value="${esc(val || '')}"/>`);
    },
});

// ── Boolean ────────────────────────────────
CellEditors.register('boolean', {
    render(col, val) {
        return markup(val ? '<span style="color:#10b981">✓</span>' : '<span style="color:#d1d5db">—</span>');
    },
    edit(col, val, lineId) {
        return markup(`<input type="checkbox" class="ls-it-checkbox" data-line-id="${lineId}" data-field="${col.name}" ${val ? 'checked' : ''}/>`);
    },
});
CellEditors.register('boolean_toggle', {
    render(col, val) {
        const on = val ? 'on' : '';
        return markup(`<span class="ls-toggle-widget ${on}"><span class="ls-toggle-slider"></span></span>`);
    },
    edit(col, val, lineId) {
        const on = val ? 'on' : '';
        return markup(`<label class="ls-toggle-widget ${on}" data-line-id="${lineId}" data-field="${col.name}"><input type="checkbox" ${val ? 'checked' : ''}/><span class="ls-toggle-slider"></span></label>`);
    },
});
CellEditors.register('boolean_favorite', {
    render(col, val) {
        return markup(`<span style="color:${val ? '#f59e0b' : '#d1d5db'}">${val ? '★' : '☆'}</span>`);
    },
    edit(col, val, lineId) {
        return markup(`<button class="ls-it-fav-btn" data-line-id="${lineId}" data-field="${col.name}" type="button" style="color:${val ? '#f59e0b' : '#d1d5db'}">${val ? '★' : '☆'}</button>`);
    },
});

// ── Selection ──────────────────────────────
CellEditors.register('selection', {
    render(col, val) {
        const item = (col.selection || []).find(s => s[0] == val);
        return markup(`<span>${esc(item ? item[1] : (val || ''))}</span>`);
    },
    edit(col, val, lineId) {
        let html = `<select class="ls-it-input ls-it-select" data-line-id="${lineId}" data-field="${col.name}">`;
        (col.selection || []).forEach(([v, l]) => {
            html += `<option value="${esc(v)}" ${val == v ? 'selected' : ''}>${esc(l)}</option>`;
        });
        html += '</select>';
        return markup(html);
    },
});
CellEditors.register('badge', {
    render(col, val) {
        const item = (col.selection || []).find(s => s[0] == val);
        const color = (col.options || {}).color || '#714b67';
        return markup(`<span class="ls-badge-widget" style="background:${color}22;color:${color}">${esc(item ? item[1] : (val || ''))}</span>`);
    },
    edit(col, val, lineId) {
        let html = `<select class="ls-it-input ls-it-select" data-line-id="${lineId}" data-field="${col.name}">`;
        (col.selection || []).forEach(([v, l]) => {
            html += `<option value="${esc(v)}" ${val == v ? 'selected' : ''}>${esc(l)}</option>`;
        });
        html += '</select>';
        return markup(html);
    },
});
CellEditors.register('priority', {
    render(col, val) {
        let html = '';
        const n = parseInt(val || 0);
        for (let i = 1; i <= 3; i++) {
            html += `<span class="ls-priority-star ${i <= n ? 'filled' : ''}">★</span>`;
        }
        return markup(`<span class="ls-priority-widget">${html}</span>`);
    },
    edit(col, val, lineId) {
        return markup(`<select class="ls-it-input ls-it-select" data-line-id="${lineId}" data-field="${col.name}">${[0,1,2,3].map(n => `<option value="${n}" ${val==n?'selected':''}>${'★'.repeat(n)||'—'}</option>`).join('')}</select>`);
    },
});

// ── Many2one ───────────────────────────────
CellEditors.register('many2one', {
    render(col, val) {
        const name = resolveM2oDisplay(val);
        return markup(`<span>${esc(name) || '<span style="color:#9ca3af">—</span>'}</span>`);
    },
    edit(col, val, lineId) {
        const curId = Array.isArray(val) ? val[0] : val;
        const curName = Array.isArray(val) ? val[1] : '';
        const relation = col.relation || '';
        const opts = col.options || {};
        return markup(`<div class="ls-m2o-widget ls-it-m2o-widget" data-field="${col.name}" data-relation="${esc(relation)}" data-no-create="${opts.no_create ? '1' : ''}" data-no-create-edit="${opts.no_create_edit ? '1' : ''}">
            <input type="text" class="ls-it-input ls-m2o-autocomplete" data-line-id="${lineId}" data-field="${col.name}" data-type="many2one" data-relation="${esc(relation)}" data-cur-id="${curId || ''}" value="${esc(curName)}" placeholder="${esc(col.label || 'Search...')}" autocomplete="off"/>
        </div>`);
    },
});
CellEditors.register('many2one_avatar', {
    render(col, val) {
        const name = resolveM2oDisplay(val);
        const initial = name ? name[0].toUpperCase() : '?';
        return markup(`<span class="ls-m2o-avatar-widget"><span class="ls-avatar-initial">${esc(initial)}</span> ${esc(name)}</span>`);
    },
    edit(col, val, lineId) {
        return CellEditors.registry.get('many2one').edit(col, val, lineId);
    },
});
CellEditors.register('many2onebutton', {
    render(col, val) {
        const name = resolveM2oDisplay(val);
        return markup(`<button class="ls-it-m2o-btn" type="button">${esc(name) || '—'}</button>`);
    },
    edit(col, val, lineId) {
        return CellEditors.registry.get('many2one').edit(col, val, lineId);
    },
});

// ── Many2many tags ─────────────────────────
CellEditors.register('many2many_tags', {
    render(col, val) {
        const items = Array.isArray(val) ? val : [];
        if (!items.length) return markup('<span style="color:#9ca3af">—</span>');
        let html = '<div class="ls-m2m-widget ls-it-m2m-widget">';
        items.forEach(t => {
            const name = t.name || t[1] || t;
            const color = t.color || '#714b67';
            html += `<span class="ls-m2m-tag" style="background:${color}22;color:${color}" title="${esc(name)}">${esc(name)}</span>`;
        });
        html += '</div>';
        return markup(html);
    },
    edit(col, val, lineId) {
        const items = Array.isArray(val) ? val : [];
        let html = `<div class="ls-m2m-widget ls-it-m2m-widget" data-line-id="${lineId}" data-field="${col.name}" data-type="many2many">`;
        items.forEach(t => {
            const name = t.name || t[1] || t;
            const id = t.id || t[0];
            html += `<span class="ls-m2m-tag" data-id="${id}">${esc(name)} <span class="ls-m2m-tag-remove" data-id="${id}">×</span></span>`;
        });
        html += `<input type="text" class="ls-m2m-input" placeholder="Add..."/></div>`;
        return markup(html);
    },
});

// ── Progressbar ────────────────────────────
CellEditors.register('progressbar', {
    render(col, val) {
        const n = Math.max(0, Math.min(100, Number(val || 0)));
        const cls = n >= 100 ? 'high' : n >= 50 ? 'mid' : 'low';
        return markup(`<div class="ls-progress-widget"><div class="ls-progress-track"><div class="ls-progress-bar ${cls}" style="width:${n}%"></div></div><span class="ls-progress-label">${n}%</span></div>`);
    },
    edit(col, val, lineId) {
        return markup(`<input type="range" min="0" max="100" class="ls-it-input" data-line-id="${lineId}" data-field="${col.name}" value="${val ?? 0}"/>`);
    },
});

// ── Handle (drag) ──────────────────────────
CellEditors.register('handle', {
    render(col, val) {
        return markup(`<span class="ls-it-drag-handle" title="Drag to reorder">☰</span>`);
    },
    edit(col, val, lineId) {
        return markup(`<span class="ls-it-drag-handle" title="Drag to reorder">☰</span>`);
    },
});

// ── Color / Kanban Color Picker ────────────
CellEditors.register('color', {
    render(col, val) {
        const c = parseInt(val || 0);
        const palette = ['#714b67', '#a35d7a', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#34495e', '#1abc9c', '#7f8c8d', '#ecf0f1'];
        return markup(`<span class="ls-color-dot" style="background:${palette[c] || palette[0]}" title="Color ${c}"></span>`);
    },
    edit(col, val, lineId) {
        const palette = ['#714b67', '#a35d7a', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#34495e', '#1abc9c', '#7f8c8d', '#ecf0f1'];
        let html = `<div class="ls-color-picker" data-line-id="${lineId}" data-field="${col.name}">`;
        palette.forEach((c, i) => {
            const sel = i == val ? ' selected' : '';
            html += `<span class="ls-color-swatch${sel}" data-val="${i}" style="background:${c}" title="Color ${i}"></span>`;
        });
        html += '</div>';
        return markup(html);
    },
});

// ── Image ──────────────────────────────────
CellEditors.register('image', {
    render(col, val) {
        if (!val) return markup('<span style="color:#9ca3af">—</span>');
        return markup(`<img src="${esc(val)}" style="width:32px;height:32px;object-fit:cover;border-radius:4px"/>`);
    },
    edit(col, val, lineId) {
        return markup(`<input type="file" accept="image/*" class="ls-it-input" data-line-id="${lineId}" data-field="${col.name}" data-type="image" style="font-size:11px"/>`);
    },
});

// ── Image URL ──────────────────────────────
CellEditors.register('image_url', {
    render(col, val) {
        if (!val) return markup('<span style="color:#9ca3af">—</span>');
        return markup(`<img src="${esc(val)}" style="width:32px;height:32px;object-fit:cover;border-radius:4px"/>`);
    },
    edit(col, val, lineId) {
        return CellEditors.registry.get('char').edit(col, val, lineId);
    },
});

// ── Email / URL / Phone ────────────────────
CellEditors.register('email', {
    render(col, val) {
        return val ? markup(`<a href="mailto:${esc(val)}">${esc(val)}</a>`) : markup('<span>—</span>');
    },
    edit(col, val, lineId) {
        return markup(`<input type="email" class="ls-it-input" data-line-id="${lineId}" data-field="${col.name}" value="${esc(val || '')}"/>`);
    },
});
CellEditors.register('url', {
    render(col, val) {
        return val ? markup(`<a href="${esc(val)}" target="_blank">${esc(val)}</a>`) : markup('<span>—</span>');
    },
    edit(col, val, lineId) {
        return markup(`<input type="url" class="ls-it-input" data-line-id="${lineId}" data-field="${col.name}" value="${esc(val || '')}"/>`);
    },
});
CellEditors.register('phone', {
    render(col, val) {
        return val ? markup(`<a href="tel:${esc(val)}">${esc(val)}</a>`) : markup('<span>—</span>');
    },
    edit(col, val, lineId) {
        return markup(`<input type="tel" class="ls-it-input" data-line-id="${lineId}" data-field="${col.name}" value="${esc(val || '')}"/>`);
    },
});

// ── Status with color ──────────────────────
CellEditors.register('status_with_color', {
    render(col, val) {
        const item = (col.selection || []).find(s => s[0] == val);
        const color = item?.[2] || '#714b67';
        return markup(`<span class="ls-status-with-color" style="display:inline-flex;align-items:center;gap:4px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color}"></span>${esc(item ? item[1] : (val || ''))}</span>`);
    },
    edit(col, val, lineId) {
        return CellEditors.registry.get('selection').edit(col, val, lineId);
    },
});

// ── Copy clipboard char ────────────────────
CellEditors.register('copy_clipboard', {
    render(col, val) {
        return markup(`<span class="ls-copy-clipboard"><span>${esc(val || '')}</span> <button class="ls-copy-btn" type="button" data-copy="${esc(val || '')}">📋</button></span>`);
    },
    edit(col, val, lineId) {
        return CellEditors.registry.get('char').edit(col, val, lineId);
    },
});

// ── Reference (dynamic FK) ────────────────
CellEditors.register('reference', {
    render(col, val) {
        if (!val) return markup('<span>—</span>');
        if (Array.isArray(val)) return markup(`<span>${esc(val[1] || '')}</span>`);
        return markup(`<span>${esc(val)}</span>`);
    },
    edit(col, val, lineId) {
        let html = `<div class="ls-reference-widget" data-line-id="${lineId}" data-field="${col.name}">`;
        html += `<select class="ls-it-input" data-ref="model" style="width:auto"><option value="">—</option>`;
        (col.reference_selection || col.options?.reference_selection || []).forEach(([m, l]) => {
            html += `<option value="${esc(m)}">${esc(l)}</option>`;
        });
        html += `</select><input type="text" class="ls-it-input" data-ref="id" placeholder="ID"/>`;
        html += '</div>';
        return markup(html);
    },
});

// ── JSON ───────────────────────────────────
CellEditors.register('json', {
    render(col, val) {
        return markup(`<code style="font-size:11px">${esc(val ? JSON.stringify(val) : '')}</code>`);
    },
    edit(col, val, lineId) {
        return markup(`<textarea class="ls-it-input ls-it-textarea" data-line-id="${lineId}" data-field="${col.name}" rows="3">${esc(val ? JSON.stringify(val, null, 2) : '')}</textarea>`);
    },
});

// ── Char with emojis ───────────────────────
CellEditors.register('char_emojis', {
    render(col, val) {
        return markup(`<span>${esc(val || '')}</span>`);
    },
    edit(col, val, lineId) {
        return CellEditors.registry.get('char').edit(col, val, lineId);
    },
});

// ── Integer badge ──────────────────────────
CellEditors.register('integer_badge', {
    render(col, val) {
        return markup(`<span class="ls-badge-widget" style="background:#714b6722;color:#714b67">${esc(val || 0)}</span>`);
    },
    edit(col, val, lineId) {
        return CellEditors.registry.get('integer').edit(col, val, lineId);
    },
});

// ── Float factor ───────────────────────────
CellEditors.register('float_factor', {
    render(col, val) {
        const factor = col.options?.factor || 1;
        return markup(`<span>${esc((Number(val || 0) * factor).toFixed(2))}</span>`);
    },
    edit(col, val, lineId) {
        return CellEditors.registry.get('float').edit(col, val, lineId);
    },
});

window.CellEditors = CellEditors;
})();
