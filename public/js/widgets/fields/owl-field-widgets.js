// ══════════════════════════════════════════════════════════
//  Field Widget Registry — AdvSoft-style configurable rendering
//  Each widget is a render function: (fieldDef, value, onChange, record) => HTML string
// ══════════════════════════════════════════════════════════
(function () {
const m = owl.markup;

const W = {};  // Widget registry

// ── Helper ───────────────────────────────────────────
function esc(v) { return v == null ? '' : String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// Render a required indicator (red *) before/after a label
function reqMark(f) { return f.required ? '<span class="ls-req-mark" style="color:#ef4444;margin-left:2px">*</span>' : ''; }

// Render help tooltip (? icon next to label)
function helpMark(f) {
    if (!f.help) return '';
    return `<span class="ls-help-mark" title="${esc(f.help)}" style="cursor:help;color:#9ca3af;margin-left:4px;font-size:11px;">?</span>`;
}

// ════════════════════════════════════════════════════
//  CHAR WIDGETS
// ════════════════════════════════════════════════════
W.char = (f) => `<input class="ls-field-input" data-field="${f.name}" value="${esc(f._val)}" placeholder="${esc(f.placeholder||'')}" ${f.required ? 'required aria-required="true"' : ''}/>`;

W.email = (f) => f._readonly
    ? `<a href="mailto:${esc(f._val)}" class="ls-field-link">${esc(f._val)}</a>`
    : `<input class="ls-field-input" type="email" data-field="${f.name}" value="${esc(f._val)}" placeholder="e.g. user@example.com"/>`;

W.url = (f) => f._readonly
    ? `<a href="${esc(f._val)}" target="_blank" class="ls-field-link">${esc(f._val)}</a>`
    : `<input class="ls-field-input" type="url" data-field="${f.name}" value="${esc(f._val)}" placeholder="https://..."/>`;

W.phone = (f) => f._readonly
    ? `<a href="tel:${esc(f._val)}" class="ls-field-link">📞 ${esc(f._val)}</a>`
    : `<input class="ls-field-input" type="tel" data-field="${f.name}" value="${esc(f._val)}" placeholder="+62..."/>`;

W.copy_clipboard = (f) => `<div class="ls-clipboard-widget">
    <input class="ls-field-input" data-field="${f.name}" value="${esc(f._val)}" readonly/>
    <button class="ls-btn-icon ls-copy-btn" data-copy="${esc(f._val)}" title="Copy">📋</button></div>`;

W.CopyClipboardChar = W.copy_clipboard;

W.password = (f) => f._readonly
    ? `<span class="ls-field-password-mask" style="letter-spacing:3px;color:var(--ls-muted,#6b7280);font-size:16px;">••••••••</span>`
    : `<div class="ls-field-password-wrap" style="position:relative;display:flex;align-items:center;width:100%;max-width:360px;">
        <input class="ls-field-input" type="password" data-field="${f.name}" value="${esc(f._val || '')}" placeholder="Leave blank to keep unchanged" autocomplete="new-password" style="padding-right:36px;width:100%;"/>
        <button type="button" class="ls-btn-icon ls-password-toggle" onclick="const inp=this.previousElementSibling; if(inp.type==='password'){inp.type='text';this.textContent='🙈';}else{inp.type='password';this.textContent='👁️';}" style="position:absolute;right:6px;background:none;border:none;cursor:pointer;padding:4px;font-size:14px;color:var(--ls-muted,#6b7280);" title="Toggle visibility">👁️</button>
       </div>`;

W.char_emojis = (f) => `<div class="ls-char-emojis-widget">
    <input class="ls-field-input" data-field="${f.name}" value="${esc(f._val)}" placeholder="${esc(f.placeholder||'')}"/>
    <button class="ls-emoji-btn" title="Emoji">😀</button></div>`;

// ════════════════════════════════════════════════════
//  TEXT / HTML WIDGETS
// ════════════════════════════════════════════════════
W.text = (f) => `<textarea class="ls-field-textarea" data-field="${f.name}" rows="4" placeholder="${esc(f.placeholder||'')}" ${f.required ? 'required aria-required="true"' : ''}>${esc(f._val)}</textarea>`;

// RTE-powered HTML widget: returns a mountable div that the form binder
// will later turn into a fully-configured AdvSoftRTE instance.
W.html = (f) => {
    // Build the config that will be passed to AdvSoftRTE
    const htmlCfg = f.html || {};
    const containerId = 'ls-rte-' + (f.name || 'field').replace(/[^a-z0-9_]/gi, '_');
    // We embed the config as a data attribute so the form binder can read it
    // after the DOM is inserted. The form binder will look for elements with
    // [data-rte] and call AdvSoftRTE.create().
    return `<div id="${containerId}" class="ls-html-widget-mount" data-field="${esc(f.name)}" data-rte="1" data-rte-model="${esc(f._model||'')}" data-rte-field="${esc(f.name)}" data-rte-config='${esc(JSON.stringify(htmlCfg))}' data-rte-value='${esc(JSON.stringify(f._val || ""))}'></div>`;
};

// ════════════════════════════════════════════════════
//  NUMERIC WIDGETS
// ════════════════════════════════════════════════════
W.integer = (f) => `<input class="ls-field-input" type="number" step="1" data-field="${f.name}" value="${f._val ?? 0}" ${f.required ? 'required aria-required="true"' : ''}/>`;

W.float = (f) => {
    const step = f.digits ? Math.pow(10, -(f.digits[1]||2)) : 0.01;
    return `<input class="ls-field-input" type="number" step="${step}" data-field="${f.name}" value="${f._val ?? 0}" ${f.required ? 'required aria-required="true"' : ''}/>`;
};

W.monetary = (f) => {
    const sym = f.currency_symbol || '$';
    const step = f.digits ? Math.pow(10, -(f.digits[1]||2)) : 0.01;
    return `<div class="ls-monetary-widget">
    <span class="ls-currency-symbol">${esc(sym)}</span>
    <input class="ls-field-input ls-monetary-input" type="number" step="${step}" data-field="${f.name}" value="${f._val ?? 0}"/>
</div>`;
};

W.percentage = (f) => `<div class="ls-percentage-widget">
    <input class="ls-field-input" type="number" step="1" min="0" max="100" style="width:80px" data-field="${f.name}" value="${f._val ?? 0}"/>
    <span class="ls-pct-sign">%</span></div>`;

W.progressbar = (f) => {
    const p = Number(f._val) || 0;
    const w = Math.min(p, 100);
    const bg = p >= 100 ? 'var(--ls-success,#10b981)' : p >= 50 ? 'var(--ls-warning,#f59e0b)' : 'var(--ls-info,#3b82f6)';
    return `<div class="ls-progressbar-widget">
        <input class="ls-field-input" type="number" step="5" min="0" max="100" style="width:70px" data-field="${f.name}" value="${p}"/>
        <span style="font-size:12px;color:#6b7280">%</span>
        <div class="ls-progress-bar" style="flex:1"><div class="ls-progress-track"><div class="ls-progress-fill" style="width:${w}%;background:${bg}"></div></div></div>
    </div>`;
};

W.float_time = (f) => {
    const v = Number(f._val) || 0;
    const h = Math.floor(v); const m = Math.round((v - h) * 60);
    return `<div class="ls-float-time-widget">
        <input class="ls-field-input" type="number" step="0.25" data-field="${f.name}" value="${v}" style="width:80px"/>
        <span class="ls-time-display">${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}</span></div>`;
};

W.handle = (f) => `<span class="ls-handle-widget" title="Drag to reorder">☰</span>
    <input type="hidden" data-field="${f.name}" value="${f._val ?? 10}"/>`;

// ════════════════════════════════════════════════════
//  BOOLEAN WIDGETS
// ════════════════════════════════════════════════════
W.boolean = (f) => `<input type="checkbox" class="ls-field-checkbox" data-field="${f.name}" ${f._val ? 'checked' : ''}/>`;

W.boolean_toggle = (f) => `<label class="ls-toggle-widget">
    <input type="checkbox" data-field="${f.name}" ${f._val ? 'checked' : ''}/>
    <span class="ls-toggle-slider"></span></label>`;

W.boolean_favorite = (f) => `<span class="ls-favorite-widget ${f._val ? 'active' : ''}" data-field="${f.name}" data-val="${f._val?1:0}">
    ${f._val ? '★' : '☆'}</span>`;

W.boolean_button = (f) => `<button class="ls-btn ls-boolean-btn ${f._val ? 'active' : ''}" data-field="${f.name}">
    ${f._val ? 'Active' : 'Inactive'}</button>`;

// ════════════════════════════════════════════════════
//  DATE / DATETIME WIDGETS
// ════════════════════════════════════════════════════
// date & datetime are OWL Components (FieldDate / FieldDatetime).
// These are fallback renderers for readonly display or when
// the OWL Component hasn't loaded yet.
W.date = (f) => `<input class="ls-field-input" type="date" data-field="${f.name}" value="${esc(f._val || '')}" ${f._readonly ? 'disabled' : ''}/>`;
W.datetime = (f) => {
    const val = f._val ? String(f._val).replace(' ', 'T') : '';
    return `<input class="ls-field-input" type="datetime-local" data-field="${f.name}" value="${esc(val)}" ${f._readonly ? 'disabled' : ''}/>`;
};

W.remaining_days = (f) => {
    const d = f._val;
    if (!d) return `<span class="ls-remaining-days ls-rd-none">No date</span>`;
    const diff = Math.ceil((new Date(d) - new Date()) / 86400000);
    const cls = diff < 0 ? 'ls-rd-overdue' : diff <= 3 ? 'ls-rd-soon' : 'ls-rd-ok';
    const label = diff < 0 ? `${Math.abs(diff)}d overdue` : diff === 0 ? 'Today' : `In ${diff}d`;
    return `<div class="ls-remaining-days-widget">
        <input class="ls-field-input" type="date" data-field="${f.name}" value="${esc(d)}" style="width:140px"/>
        <span class="ls-remaining-days ${cls}">${label}</span></div>`;
};

W.daterange = (f) => {
    const start = f._val && typeof f._val === 'object' ? f._val.start : (f._val || '');
    const end = f._val && typeof f._val === 'object' ? f._val.end : '';
    return `<div class="ls-daterange-widget">
        <input class="ls-field-input" type="date" data-field="${f.name}_start" value="${esc(start)}"/>
        <span class="ls-daterange-sep">→</span>
        <input class="ls-field-input" type="date" data-field="${f.name}_end" value="${esc(end)}"/>
    </div>`;
};

// ════════════════════════════════════════════════════
//  SELECTION WIDGETS
// ════════════════════════════════════════════════════
W.selection = (f) => {
    const sel = Array.isArray(f.selection) ? f.selection : Object.entries(f.selection || {});
    const userGroups = (window.AdvSoftUser?.groups) || [];
    let html = `<select class="ls-field-select" data-field="${f.name}" ${f.required ? 'required aria-required="true"' : ''}>`;
    if (!f.required) html += `<option value="">—</option>`;
    sel.forEach(item => {
        // Support legacy tuple and new dict format
        let v, l, groups = null;
        if (Array.isArray(item)) { v = item[0]; l = item[1]; groups = item[2] || null; }
        else { v = item.value; l = item.label; groups = item.groups || null; }
        // Filter by group: if item has groups, only show if user is in any of them
        if (groups && Array.isArray(groups) && groups.length > 0) {
            const hasGroup = groups.some(g => userGroups.includes(g));
            if (!hasGroup) return; // skip this option
        }
        html += `<option value="${esc(v)}" ${f._val==v?'selected':''}>${esc(l)}</option>`;
    });
    return html + '</select>';
};

W.radio = (f) => {
    const sel = Array.isArray(f.selection) ? f.selection : Object.entries(f.selection || {});
    const userGroups = (window.AdvSoftUser?.groups) || [];
    let html = '<div class="ls-radio-widget">';
    sel.forEach(item => {
        let v, l, groups = null;
        if (Array.isArray(item)) { v = item[0]; l = item[1]; groups = item[2] || null; }
        else { v = item.value; l = item.label; groups = item.groups || null; }
        if (groups && Array.isArray(groups) && groups.length > 0) {
            const hasGroup = groups.some(g => userGroups.includes(g));
            if (!hasGroup) return;
        }
        html += `<label class="ls-radio-item"><input type="radio" name="field_${f.name}" data-field="${f.name}" value="${esc(v)}" ${f._val==v?'checked':''} ${f.required ? 'required' : ''}/> <span>${esc(l)}</span></label>`;
    });
    return html + '</div>';
};

W.priority = (f) => {
    const max = (f.selection || []).length || 3;
    const val = Number(f._val) || 0;
    let html = '<div class="ls-priority-widget">';
    for (let i = 1; i <= max; i++) {
        html += `<span class="ls-priority-star ${val >= i ? 'filled' : ''}" data-field="${f.name}" data-level="${i}">★</span>`;
    }
    return html + '</div>';
};

W.badge = (f) => {
    const sel = Array.isArray(f.selection) ? f.selection : Object.entries(f.selection || {});
    const match = sel.find(s => (Array.isArray(s) ? s[0] : s.value) == f._val);
    const label = match ? (Array.isArray(match) ? match[1] : match.label) : (f._val || '');
    const colors = { draft: '#6b7280', confirmed: '#3b82f6', done: '#10b981', cancel: '#ef4444' };
    const bg = colors[f._val] || '#7c3aed';
    return `<span class="ls-badge-widget" style="background:${bg}15;color:${bg};border:1px solid ${bg}30">${esc(label)}</span>`;
};

W.statusbar = (f) => ''; // Rendered separately at form level

W.state_selection = (f) => {
    const sel = Array.isArray(f.selection) ? f.selection : Object.entries(f.selection || {});
    const match = sel.find(s => (Array.isArray(s) ? s[0] : s.value) == f._val);
    const currentLabel = match ? (Array.isArray(match) ? match[1] : match.label) : '';
    const icons = { draft: '⚪', confirmed: '🔵', done: '🟢', cancel: '🔴', available: '🟢', borrowed: '🟡' };
    return `<span class="ls-state-sel-widget">${icons[f._val] || '⚪'} ${esc(currentLabel)}</span>`;
};

W.badges = (f) => {
    const sel = Array.isArray(f.selection) ? f.selection : Object.entries(f.selection || {});
    let html = '<div class="ls-badges-widget">';
    sel.forEach(item => {
        const v = Array.isArray(item) ? item[0] : item.value;
        const l = Array.isArray(item) ? item[1] : item.label;
        html += `<span class="ls-badges-item ${f._val == v ? 'active' : ''}" data-field="${f.name}" data-value="${esc(v)}">${esc(l)}</span>`;
    });
    return html + '</div>';
};

W.percentage_pie = (f) => {
    const p = Math.min(Number(f._val) || 0, 100);
    const r = 18, cx = 22, cy = 22, c = 2 * Math.PI * r;
    const offset = c - (p / 100) * c;
    const color = p >= 100 ? '#10b981' : p >= 50 ? '#f59e0b' : '#3b82f6';
    return `<div class="ls-percentage-pie-widget">
        <svg viewBox="0 0 44 44" width="40" height="40">
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="4"/>
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="4"
                    stroke-dasharray="${c}" stroke-dashoffset="${offset}"
                    transform="rotate(-90 ${cx} ${cy})" stroke-linecap="round"/>
            <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
                  font-size="10" font-weight="600" fill="${color}">${p}%</text>
        </svg>
    </div>`;
};

// ════════════════════════════════════════════════════
//  MANY2ONE WIDGETS — AdvSoft-style autocomplete
//  Full: autocomplete dropdown → quick_create → create & edit → search more
//  Options: no_create, no_quick_create, no_create_edit, no_open
// ════════════════════════════════════════════════════
// many2one: Inline autocomplete input (AdvSoft-style).
// The input gets bound by FormView._bindM2OAutocompletes() to an
// M2OAutocomplete instance for Search, Quick Create, Create & Edit, Search More.
W._many2one_display = (f) => {
    const val = f._val;
    const name = Array.isArray(val) ? val[1] : (val || '');
    return `<div class="ls-m2o-widget" data-field="${f.name}" data-type="many2one">${esc(name) || '<span class="ls-empty-dash">—</span>'}</div>`;
};

W.many2one = (f) => {
    const val = f._val;
    const valId = Array.isArray(val) ? val[0] : '';
    const valName = Array.isArray(val) ? val[1] : (val || '');
    const relation = f.relation || '';
    const noCreate = f.options?.no_create ? '1' : '0';
    const noQuickCreate = f.options?.no_quick_create ? '1' : '0';
    const noCreateEdit = f.options?.no_create_edit ? '1' : '0';

    if (f._readonly) {
        return `<div class="ls-reference-widget" data-field="${f.name}">
            ${valId ? `<a href="#" class="ls-m2o-external-link" data-id="${valId}" data-field="${f.name}">${esc(valName || valId)}</a>` : '<span class="ls-empty-dash">—</span>'}
        </div>`;
    }

    return `<div class="ls-reference-widget ls-m2o-widget" data-field="${f.name}"
        data-relation="${esc(relation)}"
        data-no-create="${noCreate}" data-no-quick-create="${noQuickCreate}" data-no-create-edit="${noCreateEdit}">
        <div class="ls-m2o-input-group">
            <input type="text" class="ls-field-input ls-m2o-autocomplete"
                placeholder="${esc(f.placeholder || f.string || '')}"
                data-field="${f.name}" data-relation="${esc(relation)}"
                data-cur-id="${valId || ''}" value="${esc(valName)}" autocomplete="off"/>
            <button type="button" class="ls-m2o-dropdown-trigger" data-field="${f.name}" tabindex="-1">
                <span class="ls-m2o-chevron">▼</span>
            </button>
            ${valId ? `<button type="button" class="ls-m2o-clear" data-field="${f.name}">✕</button>` : ''}
            ${valId ? `<a href="#" class="ls-m2o-external-link ls-m2o-internal-link" tabindex="-1" data-id="${valId}" data-field="${f.name}">🔗</a>` : ''}
        </div>
    </div>`;
};

W.many2one_avatar = (f) => {
    const name = Array.isArray(f._val) ? f._val[1] : '';
    const initial = (name || '?')[0].toUpperCase();
    // Generate consistent color from name
    let hash = 0;
    for (let i = 0; i < (name||'').length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
    const hue = Math.abs(hash) % 360;
    const bg = `hsl(${hue}, 55%, 50%)`;
    return `<div class="ls-m2o-avatar-widget">
        <span class="ls-m2o-avatar" style="background:${bg}">${initial}</span>
        ${W._many2one_display(f)}</div>`;
};

W.many2one_avatar_user = W.many2one_avatar;

W.many2onebutton = (f) => {
    const label = Array.isArray(f._val) ? f._val[1] : (f._val || 'Select');
    return `<button class="ls-btn ls-btn-sm ls-m2o-btn" data-field="${f.name}">${esc(label)}</button>`;
};

// many2many_tags: Native Owl Component for inline autocomplete with tag pills
const { Component, onMounted, onWillUnmount, useRef, onPatched } = window.owl;

class Many2manyTagsWidget extends Component {
    static template = window.owl.xml`
        <div class="ls-m2m-widget" t-att-data-no-create="props.noCreate ? '1' : '0'">
            <t t-foreach="props.tags" t-as="t" t-key="t.id">
                <span class="ls-m2m-tag" t-att-style="'color:' + (t.color || '#7c3aed') + ';border-color:' + (t.color || '#7c3aed') + '40;background:' + (t.color || '#7c3aed') + '15'">
                    <span t-esc="t.name || t.display_name || t.id" />
                    <button t-if="!props.readonly" type="button" class="ls-m2m-tag-remove" t-on-click.stop="() => props.onRemove(t.id)">✕</button>
                </span>
            </t>
            <input t-if="!props.readonly" type="text" t-ref="input" class="ls-m2m-autocomplete-internal"
                placeholder="Add..." autocomplete="off"
                style="border:none;background:transparent;outline:none;font-size:13px;width:100px;min-width:60px;flex:1;" />
        </div>
    `;

    setup() {
        this.inputRef = useRef('input');
        
        onMounted(() => {
            if (this.inputRef.el) {
                this.ac = new window.M2OAutocomplete({
                    input: this.inputRef.el,
                    relation: this.props.relation,
                    fieldLabel: this.props.label,
                    fieldName: this.props.name,
                    relOptions: this.props.relOptions || [],
                    options: this.props.options || {},
                    onSelect: (opt) => {
                        this.props.onAdd(opt);
                        this.inputRef.el.value = '';
                        this.inputRef.el.focus();
                    },
                    onClear: () => {}
                });
            }
        });

        onWillUnmount(() => {
            if (this.ac) this.ac.destroy();
        });
        
        onPatched(() => {
            if (this.ac) {
                this.ac.setRelOptions(this.props.relOptions || []);
                // Ensure focus remains if input was previously focused
                if (document.activeElement === this.inputRef.el) {
                    this.inputRef.el.focus();
                }
            }
        });
    }
}
window.Many2manyTagsWidget = Many2manyTagsWidget;

// Legacy fallback just in case
W.many2many_tags = (f) => '<div class="ls-m2m-widget" data-field="' + f.name + '">Many2many Tags Component</div>';

W.many2many_checkboxes = (f) => {
    const selected = (f._val || []).map(t => t.id);
    const all = f._relOptions || [];
    let html = '<div class="ls-m2m-checkboxes-widget" data-field="' + f.name + '">';
    all.forEach(o => {
        html += `<label class="ls-checkbox-item"><input type="checkbox" data-m2m-id="${o.id}" ${selected.includes(o.id)?'checked':''}/> ${esc(o.name)}</label>`;
    });
    return html + '</div>';
};

W.many2many = (f) => `<div class="ls-m2m-list-widget" data-field="${f.name}"><div class="ls-o2m-placeholder">(Many2many List)</div></div>`;
W.one2many = (f) => `<div class="ls-o2m-widget" data-field="${f.name}"><div class="ls-o2m-placeholder">(One2many List)</div></div>`;
W.one2many_list = W.one2many;
W.many2many_kanban = (f) => `<div class="ls-m2m-kanban-widget" data-field="${f.name}"><div class="ls-o2m-placeholder">(Kanban View)</div></div>`;
W.many2many_binary = (f) => `<div class="ls-m2m-binary-widget"><input type="file" multiple class="ls-field-file" data-field="${f.name}"/></div>`;

// ════════════════════════════════════════════════════
//  BINARY WIDGETS
// ════════════════════════════════════════════════════
W.binary = (f) => `<div class="ls-binary-widget"><input type="file" class="ls-field-file" data-field="${f.name}"/>
    ${f._val ? '<span class="ls-file-indicator">📎 File attached</span>' : ''}</div>`;

W.image = (f) => {
    const size = f.options?.size || [90, 90];
    const maxSize = (f.options?.max_size || 10) * 1024 * 1024;
    const allowedTypes = f.options?.allowed_types || ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    const accept = allowedTypes.join(',');
    const src = f._val ? `data:image/png;base64,${f._val}` : '';
    
    return `<div class="ls-image-widget" data-max-size="${maxSize}" data-allowed-types="${accept}">
        <div class="ls-image-container" style="width:${size[0]}px; height:${size[1]}px;">
            ${src ? `<img src="${src}" width="${size[0]}" height="${size[1]}" class="ls-image-preview"/>` : `<div class="ls-image-placeholder" style="width:${size[0]}px; height:${size[1]}px; line-height:${size[1]}px;">📷</div>`}
            
            <div class="ls-image-actions">
                <button type="button" class="ls-image-action-btn" data-upload="${f.name}" title="Edit">✎</button>
                <button type="button" class="ls-image-action-btn ls-image-clear-btn" data-clear-image="${f.name}" title="Clear" style="display:${src ? 'flex' : 'none'}">🗑️</button>
            </div>
        </div>
        <input type="file" accept="${accept}" class="ls-field-file" data-field="${f.name}" data-validate="image" style="display:none"/>
        <div class="ls-image-error" style="display:none;color:var(--ls-widget-danger);font-size:11px;margin-top:4px;"></div>
    </div>`;
};

W.pdf_viewer = (f) => {
    return `<div class="ls-pdf-viewer" data-field="${f.name}">
        ${f._val ? `<iframe src="data:application/pdf;base64,${f._val}" width="100%" height="400px" style="border:1px solid #e5e7eb; border-radius:8px;"></iframe>` : '<div class="ls-pdf-placeholder">PDF Viewer (No file)</div>'}
        <input type="file" accept="application/pdf" class="ls-field-file" data-field="${f.name}" style="margin-top:8px;" />
    </div>`;
};

// ════════════════════════════════════════════════════
//  SPECIAL & COMPOSITE WIDGETS
// ════════════════════════════════════════════════════
W.color_picker = (f) => `<input type="color" class="ls-color-picker" data-field="${f.name}" value="${esc(f._val||'#7c3aed')}"/>`;

// Odoo integer color index (0-11 palette)
W.color = (f) => {
    const palette = ['#f06050','#f4a460','#f7cd1f','#6cc1ed','#814968','#eb7e7f','#2c8397','#475577','#d6145f','#30c381','#9365b8','#1abc9c'];
    const idx = Number(f._val) || 0;
    let html = '<div class="ls-color-index-widget" data-field="' + f.name + '">';
    palette.forEach((c, i) => {
        html += `<span class="ls-color-dot${i===idx?' active':''}" style="background:${c}" data-field="${f.name}" data-value="${i}" title="Color ${i}"></span>`;
    });
    return html + '</div>';
};

W.kanban_color_picker = W.color;

W.signature = (f) => `<div class="ls-signature-widget" data-field="${f.name}">
    ${f._val ? `<img src="data:image/png;base64,${f._val}" class="ls-signature-img"/>` : '<div class="ls-signature-pad"><canvas class="ls-sig-canvas" width="300" height="100"></canvas><span class="ls-sig-hint">Draw your signature</span></div>'}
    <div class="ls-sig-actions">
        ${!f._val ? `<button type="button" class="ls-btn ls-btn-primary ls-btn-sm ls-sig-accept">Accept</button>
                     <button type="button" class="ls-btn ls-btn-secondary ls-btn-sm ls-sig-clear-pad">Clear</button>` 
                  : `<button type="button" class="ls-btn ls-btn-secondary ls-btn-sm ls-sig-clear">Re-sign</button>`}
        <button type="button" class="ls-btn ls-btn-sm" data-upload="${f.name}">Upload</button>
        <input type="file" accept="image/*" class="ls-field-file" data-field="${f.name}" style="display:none"/>
    </div>
</div>`;

W.image_url = (f) => {
    return `<div class="ls-image-url-widget">
        ${f._val ? `<img src="${esc(f._val)}" class="ls-image-preview" style="max-height:150px;"/>` : '<div class="ls-image-placeholder">🔗 Image URL</div>'}
        <input type="url" class="ls-field-input" data-field="${f.name}" value="${esc(f._val||'')}" placeholder="https://..." style="margin-top:8px;" />
    </div>`;
};

// JSON field — structured data editor with syntax highlighting
W.json = (f) => {
    let pretty = '';
    try { pretty = typeof f._val === 'string' ? f._val : JSON.stringify(f._val, null, 2); } catch { pretty = String(f._val || '{}'); }
    return `<div class="ls-json-widget">
        <textarea class="ls-ace-widget" data-field="${f.name}" rows="6" placeholder='{"key": "value"}'>${esc(pretty)}</textarea>
    </div>`;
};

// Countdown / remaining time widget (live display)
W.countdown = (f) => {
    const d = f._val;
    if (!d) return `<span class="ls-countdown ls-rd-none">No date set</span>`;
    const now = new Date(), target = new Date(d);
    const diff = target - now;
    if (diff <= 0) return `<span class="ls-countdown ls-rd-overdue">Expired</span>`;
    const days = Math.floor(diff / 86400000), hrs = Math.floor((diff % 86400000) / 3600000), mins = Math.floor((diff % 3600000) / 60000);
    return `<div class="ls-countdown-widget">
        <input class="ls-field-input" type="datetime-local" data-field="${f.name}" value="${esc((d||'').replace(' ','T'))}" style="width:200px"/>
        <span class="ls-countdown ls-rd-ok">${days}d ${hrs}h ${mins}m</span>
    </div>`;
};

// Section & Note widget — for O2M inline separators
W.section_and_note = (f) => {
    const isSection = f._val && String(f._val).startsWith('[SECTION]');
    if (isSection) {
        return `<div class="ls-section-widget"><strong>${esc(String(f._val).replace('[SECTION]',''))}</strong></div>`;
    }
    return `<textarea class="ls-field-textarea ls-note-widget" data-field="${f.name}" rows="2" placeholder="Add a note...">${esc(f._val||'')}</textarea>`;
};

// Stat info widget (for stat buttons, read-only display)
W.stat_info = (f) => `<div class="ls-stat-info-widget">
    <span class="ls-stat-info-value">${esc(f._val ?? '0')}</span>
    <span class="ls-stat-info-label">${esc(f.string || f.name)}</span>
</div>`;

// Activity IDs widget placeholder
W.activity_ids = (f) => `<div class="ls-activity-widget" data-field="${f.name}">
    <span class="ls-activity-icon" title="Activities">📋</span>
    <span class="ls-activity-count">${Array.isArray(f._val) ? f._val.length : 0}</span>
</div>`;

// Monetary with separate currency field
W.monetary_field = (f) => {
    const sym = f.currency_symbol || f.options?.currency_field ? '' : '$';
    const step = f.digits ? Math.pow(10, -(f.digits[1]||2)) : 0.01;
    const currField = f.options?.currency_field || '';
    return `<div class="ls-monetary-widget ls-monetary-full">
        <span class="ls-currency-symbol">${esc(sym || '$')}</span>
        <input class="ls-field-input ls-monetary-input" type="number" step="${step}" data-field="${f.name}" value="${f._val ?? 0}"/>
        ${currField ? `<span class="ls-currency-field-hint" title="Currency: ${esc(currField)}">💱</span>` : ''}
    </div>`;
};

// Many2one with barcode scanner
W.many2one_barcode = (f) => {
    const opts = f._relOptions || [];
    const curId = Array.isArray(f._val) ? f._val[0] : f._val;
    let html = `<div class="ls-m2o-barcode-widget"><select class="ls-field-select" data-field="${f.name}" data-type="many2one">`;
    html += '<option value="">—</option>';
    opts.forEach(o => { html += `<option value="${o.id}" ${curId==o.id?'selected':''}>${esc(o.name)}</option>`; });
    html += '</select><button class="ls-btn-icon" title="Scan barcode">📷</button></div>';
    return html;
};

// Removed W.char_domain and W.domain (migrated to OWL Component FieldDomain)

// Selection as badge (clickable pills)
W.selection_badge = W.badges;

// Float with factor multiplier
W.float_factor = (f) => {
    const factor = f.options?.factor || 1;
    const display = (Number(f._val) || 0) * factor;
    return `<div class="ls-float-factor-widget">
        <input class="ls-field-input" type="number" step="0.01" data-field="${f.name}" value="${f._val ?? 0}" style="width:100px"/>
        <span class="ls-factor-display">= ${display.toFixed(2)} (×${factor})</span>
    </div>`;
};

// Float toggle (cycle through predefined values)
W.float_toggle = (f) => {
    const range = f.options?.range || [0, 0.5, 1];
    const val = Number(f._val) || 0;
    const idx = range.indexOf(val);
    const nextIdx = (idx + 1) % range.length;
    return `<button class="ls-btn ls-float-toggle" data-field="${f.name}" data-value="${range[nextIdx]}">${val}</button>`;
};

// Integer displayed as badge
W.integer_badge = (f) => {
    const v = Number(f._val) || 0;
    const bg = v > 0 ? '#3b82f6' : '#6b7280';
    return `<span class="ls-badge-widget" style="background:${bg}15;color:${bg};border:1px solid ${bg}30">${v}</span>`;
};

// Label selection (readonly display of selection value)
W.label_selection = (f) => {
    const sel = f.selection || [];
    const label = (sel.find(s => s[0] == f._val) || ['', f._val || ''])[1];
    return `<span class="ls-label-selection">${esc(label)}</span>`;
};

W.ace = (f) => `<textarea class="ls-ace-widget" style="font-family:monospace; background:#1e1e1e; color:#d4d4d4; width:100%; border-radius:6px; padding:10px; border:none; outline:none;" data-field="${f.name}" rows="6" placeholder="# Write code here...">${esc(f._val||'')}</textarea>`;

// ════════════════════════════════════════════════════
//  MISSING WIDGETS — percentage_pie, char_badge, char_image
// ════════════════════════════════════════════════════

// Percentage Pie — SVG circular progress indicator (AdvSoft style)
W.percentage_pie = (f) => {
    const pct = Math.min(100, Math.max(0, Number(f._val) || 0));
    const r = 18, circ = 2 * Math.PI * r, offset = circ * (1 - pct / 100);
    const color = pct >= 100 ? 'var(--ls-widget-success,#10b981)' : pct >= 50 ? 'var(--ls-widget-warning,#f59e0b)' : 'var(--ls-widget-info,#3b82f6)';
    return `<div class="ls-pct-pie-widget" title="${pct}%">
        <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="${r}" fill="none" stroke="var(--ls-border-light,#e5e7eb)" stroke-width="4"/>
            <circle cx="22" cy="22" r="${r}" fill="none" stroke="${color}" stroke-width="4"
                    stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
                    stroke-linecap="round" transform="rotate(-90 22 22)"
                    style="transition: stroke-dashoffset 0.5s ease"/>
            <text x="22" y="24" text-anchor="middle" font-size="10" font-weight="700" fill="var(--ls-text,#374151)">${pct}%</text>
        </svg>
    </div>`;
};

// Char Badge — rounded tag display for char field (Odoo badge widget)
W.char_badge = (f) => {
    const color = f.options?.badge_color || 'var(--ls-primary,#714b67)';
    return `<span class="ls-char-badge" style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;white-space:nowrap;background:${color}15;color:${color};border:1px solid ${color}30;">${esc(f._val || f.default || '')}</span>`;
};
W.badge_char = W.char_badge;

// Char Image — displays image from URL stored in char field
W.char_image = (f) => {
    const url = f._val || '';
    const size = f.options?.size || [120, 120];
    if (!url) return `<div class="ls-image-placeholder" style="width:${size[0]}px;height:${size[1]}px;border:2px dashed var(--ls-border,#d1d5db);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--ls-text-muted,#9ca3af);font-size:11px;">No image URL</div>`;
    return `<div class="ls-char-image-widget">
        <img src="${esc(url)}" alt="Image" style="max-width:${size[0]}px;max-height:${size[1]}px;object-fit:contain;border-radius:6px;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"/>
        <div class="ls-image-error" style="display:none;color:var(--ls-widget-danger);font-size:11px;">⚠ Invalid image URL</div>
    </div>`;
};

// ════════════════════════════════════════════════════
//  REFERENCE WIDGET — FK dinamis ke model apapun
// ════════════════════════════════════════════════════
W.reference = (f) => {
    const refSel = f.reference_selection || [];
    const val = f._val || '';
    let curModel = '', curId = '', curName = '';
    if (typeof val === 'string' && val.includes(',')) {
        [curModel, curId] = val.split(',');
    } else if (Array.isArray(val)) {
        curModel = val[0] || ''; 
        curId = val[1] || '';
        curName = val[2] || '';
    }
    let html = `<div class="ls-reference-widget" data-field="${f.name}" style="display:flex;gap:8px;align-items:center;">`;
    html += `<select class="ls-field-select ls-ref-model" style="flex:1;">`;
    html += `<option value="">— Model —</option>`;
    refSel.forEach(([m, l]) => { html += `<option value="${esc(m)}" ${curModel===m?'selected':''}>${esc(l)}</option>`; });
    html += `</select>`;
    html += `<div class="ls-ref-m2o-container" style="flex:1;">`;
    if (curModel) {
        const m2oFieldDef = {
            name: `${f.name}_ref_id`,
            relation: curModel,
            type: 'many2one',
            _val: curName ? [curId, curName] : [curId, curId ? `ID: ${curId}` : ''],
            options: f.options || {},
            _relOptions: []
        };
        html += W.many2one(m2oFieldDef);
    } else {
        html += `<input class="ls-field-input" type="text" disabled placeholder="Record ID" style="width:100%;"/>`;
    }
    html += `</div></div>`;
    return html;
};

// ════════════════════════════════════════════════════
//  RELATED FIELD — shortcut ke field lain (readonly)
// ════════════════════════════════════════════════════
W.related = (f) => {
    const relPath = f.related || f.relatedField || '';
    if (f._readonly !== false) {
        return `<div class="ls-related-widget">
            <span class="ls-related-value">${esc(f._val ?? '')}</span>
            <span class="ls-related-path" title="Related: ${esc(relPath)}">🔗</span>
        </div>`;
    }
    return W.char(f);
};

// ════════════════════════════════════════════════════
//  COMPUTED FIELD — @api.depends, store=True/False
// ════════════════════════════════════════════════════
W.computed = (f) => {
    const stored = f.store !== false;
    return `<div class="ls-computed-widget">
        <span class="ls-computed-value">${esc(f._val ?? '')}</span>
        ${!stored ? '<span class="ls-computed-badge" title="Computed on-the-fly (not stored)">⚡</span>' : ''}
    </div>`;
};

// ════════════════════════════════════════════════════
//  RESOLVE: pick the right widget for a field
//  widget="X" di view memilih widget
//  tanpa widget= maka pilih default otomatis
//
//  Resolution order:
//  1. resolveComponent(fDef) — OWL Components (many2one,
//     many2many_tags, date, datetime) take priority.
//  2. resolveWidget(fDef) — String renderers from W. registry
//     are used as fallback for readonly/list rendering, or
//     for composite widgets (many2one_avatar, reference).
// ════════════════════════════════════════════════════
function resolveWidget(fieldDef) {
    if (fieldDef.widget && W[fieldDef.widget]) return fieldDef.widget;
    // Default widget by type (Odoo auto-selection)
    const defaults = {
        char: 'char', text: 'text', html: 'html',
        integer: 'integer', float: 'float', monetary: 'monetary',
        boolean: 'boolean', date: 'date', datetime: 'datetime',
        selection: 'selection', binary: 'binary',
        many2one: 'many2one', many2many: 'many2many_tags',
        one2many: 'one2many', reference: 'reference',
        related: 'related', computed: 'computed',
    };
    return defaults[fieldDef.type] || 'char';
}

/**
 * Render a field using its widget.
 * @param {Object} fieldDef - Field definition from fields_get
 * @param {*} value - Current field value
 * @param {Object} extras - { relOptions, readonly }
 * @returns {string} HTML string (owl.markup)
 *
 * IMPORTANT: This is only called for fields that do NOT have
 * an OWL Component registered. The FormView checks
 * resolveComponent() first.
 */
function renderFieldWidget(fieldDef, value, extras = {}) {
    const f = { ...fieldDef, _val: value, _readonly: extras.readonly || fieldDef.readonly, _relOptions: extras.relOptions || [] };
    const widgetName = resolveWidget(fieldDef);
    const renderer = W[widgetName];
    if (!renderer) {
        // Graceful fallback: plain text display
        return owl.markup(`<span>${esc(value ?? '')}</span>`);
    }
    return owl.markup(renderer(f));
}

/**
 * Render a field value for list/tree view (read-only display).
 */
function renderListCell(fieldDef, value) {
    const type = fieldDef.type;
    const widget = fieldDef.widget;
    const name = fieldDef.name;

    let html = '';
    
    // Custom handling based on field name for the reference
    if (name === 'assignee' && value) {
        // Generate a consistent color based on name string
        let hash = 0;
        for (let i = 0; i < value.length; i++) { hash = value.charCodeAt(i) + ((hash << 5) - hash); }
        const h = Math.abs(hash) % 360;
        const color = `hsl(${h}, 70%, 40%)`;
        html = `<div style="display:flex;align-items:center;gap:6px;"><span style="color:${color};font-size:14px;">●</span> ${esc(value)}</div>`;
        return owl.markup(html);
    }
    
    if (name === 'planned_hours' || widget === 'float_time') {
        const v = Number(value) || 0;
        html = `<span style="color:#6b7280">${v}h</span>`;
        return owl.markup(html);
    }

    if (widget === 'progressbar' || widget === 'percentage') {
        const p = Number(value) || 0;
        const w = Math.min(p, 100);
        const bg = p >= 100 ? '#10b981' : p >= 50 ? '#f59e0b' : '#3b82f6';
        html = `<div style="display:flex;align-items:center;gap:12px;width:120px;">
            <div style="flex:1;height:6px;background:#e5e7eb;border-radius:4px;overflow:hidden;display:flex;">
                <div style="width:${w}%;background:${bg};border-radius:4px;"></div>
            </div>
            <span style="font-size:12px;color:#6b7280;width:35px;text-align:right;">${p}%</span>
        </div>`;
    }
    else if (widget === 'percentage_pie') {
        const p = Math.min(Number(value) || 0, 100);
        const r = 14, cx = 16, cy = 16, c = 2 * Math.PI * r;
        const offset = c - (p / 100) * c;
        const color = p >= 100 ? '#10b981' : p >= 50 ? '#f59e0b' : '#3b82f6';
        html = `<svg viewBox="0 0 32 32" width="28" height="28">
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="3"/>
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="3"
                    stroke-dasharray="${c}" stroke-dashoffset="${offset}"
                    transform="rotate(-90 ${cx} ${cy})" stroke-linecap="round"/>
            <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
                  font-size="7" font-weight="600" fill="${color}">${p}</text>
        </svg>`;
    }
    else if (widget === 'priority') {
        const v = Number(value) || 0;
        html = Array.from({length: 3}, (_, i) => `<span class="ls-priority-star ${v > i ? 'filled' : ''}">★</span>`).join('');
    }
    else if (widget === 'badge' || widget === 'badges' || widget === 'state_selection' || widget === 'statusbar') {
        let label = '';
        if (type === 'many2one' && Array.isArray(value)) label = value[1];
        else if (type === 'selection') {
            const selArray = Array.isArray(fieldDef.selection) ? fieldDef.selection : Object.entries(fieldDef.selection || {});
            const match = selArray.find(s => (Array.isArray(s) ? s[0] : s) == value);
            label = match ? (Array.isArray(match) ? match[1] : match) : (value || '');
        }
        else label = value;

        if (!label) return owl.markup('');

        const colors = {
            'Done': { bg: '#dcfce7', text: '#166534' }, 'done': { bg: '#dcfce7', text: '#166534' },
            'Review': { bg: '#f3e8ff', text: '#6b21a8' }, 'review': { bg: '#f3e8ff', text: '#6b21a8' },
            'New': { bg: '#e0f2fe', text: '#075985' },
            'In Progress': { bg: '#fef3c7', text: '#92400e' },
            'Draft': { bg: '#f3f4f6', text: '#374151' }, 'draft': { bg: '#f3f4f6', text: '#374151' },
            'Published': { bg: '#dcfce7', text: '#166534' }, 'published': { bg: '#dcfce7', text: '#166534' },
            'Cancelled': { bg: '#fef2f2', text: '#991b1b' }, 'cancel': { bg: '#fef2f2', text: '#991b1b' },
            'Confirmed': { bg: '#dbeafe', text: '#1e40af' }, 'confirmed': { bg: '#dbeafe', text: '#1e40af' },
        };
        const c = colors[label] || colors[String(value).toLowerCase()] || { bg: '#f3f4f6', text: '#374151' };
        html = `<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:500;background:${c.bg};color:${c.text};">${esc(label)}</span>`;
    }
    // Check boolean_favorite BEFORE generic boolean to avoid false-positive
    else if (widget === 'boolean_favorite') {
        html = value ? '<span style="color:#f59e0b;font-size:16px;">★</span>' : '<span style="color:#d1d5db;font-size:16px;">☆</span>';
    }
    else if (widget === 'boolean_toggle' || type === 'boolean') {
        html = value ? '<span style="color:#10b981;">✓</span>' : '<span style="color:#d1d5db;">—</span>';
    }
    else if (widget === 'many2many_tags') {
        const tagPalette = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#ec4899','#8b5cf6','#0891b2'];
        html = `<div style="display:flex;gap:4px;flex-wrap:wrap;">` + (value || []).map((t, i) => {
            const name = t.name || '';
            const base = t.color || tagPalette[i % tagPalette.length];
            return `<span style="padding:1px 8px;border-radius:10px;font-size:11px;font-weight:500;background:${base}15;color:${base};border:1px solid ${base}30;">${esc(name)}</span>`;
        }).join('') + `</div>`;
    }
    else if (widget === 'monetary') {
        const sym = fieldDef.currency_symbol || fieldDef.currencySymbol || '';
        const d = fieldDef.digits ? fieldDef.digits[1] : 2;
        const formatted = Number(value || 0).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
        html = `<span style="font-variant-numeric:tabular-nums;">${sym ? esc(sym) + ' ' : ''}${formatted}</span>`;
    }
    else if (widget === 'many2one_avatar' || widget === 'many2one_avatar_user') {
        const n = Array.isArray(value) ? value[1] : (value || '');
        if (!n) { html = '<span style="color:#d1d5db;">—</span>'; }
        else {
            let hash = 0; for (let i = 0; i < n.length; i++) { hash = n.charCodeAt(i) + ((hash << 5) - hash); }
            const h = Math.abs(hash) % 360;
            const bg = `hsl(${h}, 60%, 50%)`;
            html = `<div style="display:flex;align-items:center;gap:6px;"><span style="width:22px;height:22px;border-radius:50%;background:${bg};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;">${n[0].toUpperCase()}</span><span>${esc(n)}</span></div>`;
        }
    }
    else if (widget === 'email') html = value ? `<a href="mailto:${esc(value)}" style="color:var(--ls-primary);text-decoration:none;">${esc(value)}</a>` : '';
    else if (widget === 'url') html = value ? `<a href="${esc(value)}" target="_blank" style="color:var(--ls-primary);text-decoration:none;">${esc(value)}</a>` : '';
    else if (widget === 'phone') html = value ? `<a href="tel:${esc(value)}" style="color:var(--ls-primary);text-decoration:none;">${esc(value)}</a>` : '';
    else if (widget === 'image') html = value ? '<span>📷</span>' : '';
    else if (widget === 'color_picker') html = `<span class="ls-color-dot" style="background:${esc(value||'#ccc')};width:16px;height:16px;display:inline-block;border-radius:4px;"></span>`;
    else if (widget === 'color' || widget === 'kanban_color_picker') {
        const palette = ['#f06050','#f4a460','#f7cd1f','#6cc1ed','#814968','#eb7e7f','#2c8397','#475577','#d6145f','#30c381','#9365b8','#1abc9c'];
        const c = palette[Number(value) || 0] || '#ccc';
        html = `<span class="ls-color-dot" style="background:${c};width:18px;height:18px;display:inline-block;border-radius:50%;border:2px solid ${c}40;"></span>`;
    }
    else if (widget === 'countdown') {
        if (!value) { html = '<span class="ls-rd-none">—</span>'; }
        else {
            const diff = Math.ceil((new Date(value) - new Date()) / 86400000);
            const cls = diff < 0 ? 'ls-rd-overdue' : diff <= 3 ? 'ls-rd-soon' : 'ls-rd-ok';
            const label = diff < 0 ? `${Math.abs(diff)}d ago` : diff === 0 ? 'Today' : `In ${diff}d`;
            html = `<span class="ls-remaining-days ${cls}">${label}</span>`;
        }
    }
    else if (widget === 'json') {
        const preview = typeof value === 'object' ? JSON.stringify(value).substring(0, 40) : String(value||'').substring(0, 40);
        html = `<span class="ls-code-font" style="font-size:11px;color:#6b7280;">${esc(preview)}${(preview||'').length >= 40 ? '…' : ''}</span>`;
    }
    else if (widget === 'signature') html = value ? '<span title="Signed">✍️</span>' : '<span style="color:#d1d5db;">—</span>';
    else if (widget === 'integer_badge') {
        const v = Number(value) || 0;
        const bg = v > 0 ? '#3b82f6' : '#6b7280';
        html = `<span style="display:inline-block;padding:1px 8px;border-radius:10px;font-size:12px;background:${bg}15;color:${bg};border:1px solid ${bg}30;">${v}</span>`;
    }
    else if (widget === 'float_factor') {
        const factor = fieldDef.options?.factor || 1;
        html = `<span style="font-variant-numeric:tabular-nums;">${((Number(value)||0)*factor).toFixed(2)}</span>`;
    }
    else if (widget === 'float_toggle') html = `<span style="font-weight:600;">${Number(value)||0}</span>`;
    else if (widget === 'activity_ids') {
        const count = Array.isArray(value) ? value.length : 0;
        html = count > 0 ? `<span title="Activities">📋 ${count}</span>` : '';
    }
    else if (widget === 'remaining_days' && value) {
        const diff = Math.ceil((new Date(value) - new Date()) / 86400000);
        const cls = diff < 0 ? 'ls-rd-overdue' : diff <= 3 ? 'ls-rd-soon' : 'ls-rd-ok';
        const label = diff < 0 ? `${Math.abs(diff)}d overdue` : diff === 0 ? 'Today' : `In ${diff}d`;
        html = `<span class="ls-remaining-days ${cls}">${label}</span>`;
    }

    // Widget-specific list renderers for new widgets
    else if (widget === 'percentage_pie') {
        const pct = Math.min(100, Math.max(0, Number(value) || 0));
        const color = pct >= 100 ? 'var(--ls-widget-success,#10b981)' : pct >= 50 ? 'var(--ls-widget-warning,#f59e0b)' : 'var(--ls-widget-info,#3b82f6)';
        html = `<span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:24px;height:24px;border-radius:50%;background:conic-gradient(${color} ${pct*3.6}deg, #e5e7eb 0);display:inline-block;"></span><span style="font-weight:600;font-size:12px;">${pct}%</span></span>`;
    }
    else if (widget === 'char_badge' || widget === 'badge_char') {
        const bColor = fieldDef.options?.badge_color || 'var(--ls-primary,#714b67)';
        html = `<span style="padding:1px 8px;border-radius:10px;font-size:11px;font-weight:600;background:${bColor}15;color:${bColor};border:1px solid ${bColor}30;">${esc(value || fieldDef.default || '')}</span>`;
    }
    else if (widget === 'char_image') {
        html = value ? '<span style="font-size:14px;">🖼️</span>' : '<span style="color:#d1d5db;">—</span>';
    }
    else if (widget === 'handle') html = '<span style="color:#d1d5db;cursor:grab;">⋮⋮</span>';
    else if (widget === 'pdf_viewer') html = value ? '<span title="PDF attached">📄</span>' : '<span style="color:#d1d5db;">—</span>';
    else if (widget === 'badge' || widget === 'badges') {
        const sel = fieldDef.selection || [];
        const label = (sel.find(s => s[0] == value) || ['', value || ''])[1];
        const colorMap = { draft: '#6b7280', done: '#10b981', confirmed: '#3b82f6', cancelled: '#ef4444', pending: '#f59e0b' };
        const vk = String(value || '').toLowerCase();
        const bg = colorMap[vk] || '#6b7280';
        html = `<span style="display:inline-block;padding:1px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${bg}15;color:${bg};border:1px solid ${bg}30;">${esc(label)}</span>`;
    }
    else if (widget === 'daterange') {
        html = value ? `<span style="font-size:12px;">${esc(value)}</span>` : '<span style="color:#d1d5db;">—</span>';
    }
    else if (widget === 'ace') html = value ? '<span style="font-family:monospace;font-size:11px;color:#6b7280;">📝 code</span>' : '<span style="color:#d1d5db;">—</span>';
    else if (widget === 'section_and_note') {
        if (value && String(value).startsWith('[SECTION]')) {
            html = `<strong style="color:var(--ls-text);">${esc(String(value).replace('[SECTION]',''))}</strong>`;
        } else {
            html = value ? `<span style="color:var(--ls-text-muted);font-style:italic;">${esc(String(value).substring(0,60))}${String(value).length>60?'…':''}</span>` : '';
        }
    }

    // Default by type
    else if (type === 'many2one') {
        const n = Array.isArray(value) ? value[1] : (value || '');
        html = n ? esc(n) : '<span class="ls-empty-dash">—</span>';
    }
    else if (type === 'selection') {
        const sel = fieldDef.selection || [];
        html = esc((sel.find(s => s[0] == value) || ['', value || ''])[1]);
    }
    else if (type === 'boolean') {
        html = value ? '<span style="color:#10b981;">✓</span>' : '<span class="ls-empty-dash">—</span>';
    }
    else if (type === 'date') html = `<span class="ls-list-date">${esc(value || '')}</span>`;
    else if (type === 'datetime') {
        const v = value || '';
        html = v ? `<span class="ls-list-date">${esc(v.replace('T',' ').substring(0,16))}</span>` : '';
    }
    else if (type === 'float') {
        const d = fieldDef.digits ? fieldDef.digits[1] : 2;
        html = Number(value || 0).toFixed(d);
    }
    else if (type === 'integer') {
        html = `<span style="font-variant-numeric:tabular-nums;">${Number(value || 0)}</span>`;
    }
    else if (type === 'monetary') {
        const sym = fieldDef.currency_symbol || fieldDef.currencySymbol || '';
        const d = fieldDef.digits ? fieldDef.digits[1] : 2;
        const formatted = Number(value || 0).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
        html = `<span style="font-variant-numeric:tabular-nums;">${sym ? esc(sym) + ' ' : ''}${formatted}</span>`;
    }
    else if (type === 'reference') {
        if (typeof value === 'string' && value.includes(',')) {
            const [m, id] = value.split(',');
            html = `<span class="ls-ref-display">${esc(m)}:${esc(id)}</span>`;
        } else {
            html = esc(value ?? '');
        }
    }
    else if (type === 'related' || type === 'computed') {
        html = esc(value ?? '');
    }
    else if (type === 'html') html = value ? '<span class="ls-list-muted">(HTML content)</span>' : '';
    else if (type === 'binary') html = value ? '<span>📎</span>' : '<span class="ls-empty-dash">—</span>';
    else if (widget === 'password' || fieldDef.name === 'password') html = '<span class="ls-list-muted" style="letter-spacing:2px;">••••••••</span>';
    else html = `<span class="ls-list-char" style="font-weight:500;">${esc(value ?? '')}</span>`;

    return owl.markup(html);
}

/**
 * Register a custom widget (extends Component pattern).
 * Usage: FieldWidgets.register('my_widget', (f) => `<div>...</div>`);
 *
 * Custom widgets can also provide a list renderer:
 * FieldWidgets.registerList('my_widget', (fieldDef, value) => owl.markup(`<span>...</span>`));
 */
function registerWidget(name, formRenderer, listRenderer) {
    W[name] = formRenderer;
    if (listRenderer) {
        registerWidget._listRenderers = registerWidget._listRenderers || {};
        registerWidget._listRenderers[name] = listRenderer;
    }
}

// Export — public API for the widget system
window.FieldWidgets = {
    registry: W,
    components: {}, // For Phase 3 OWL Components
    resolve: resolveWidget,
    resolveComponent: (fDef) => {
        // Check explicit widget first, then fall back to type
        const key = fDef.widget || fDef.type || 'char';
        // Type → component mapping for OWL Components
        const typeMap = {
            many2many: 'many2many_tags',
        };
        const lookup = typeMap[key] || key;
        return window.FieldWidgets.components[lookup] || null;
    },
    render: renderFieldWidget,
    renderList: renderListCell,
    register: registerWidget,
    // Introspection: list all available widgets
    getAvailable: () => Object.keys(W),
};
})();
