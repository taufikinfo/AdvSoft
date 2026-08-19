// ══════════════════════════════════════════════════════════
//  Many2one Autocomplete & Search More Dialog
//  Odoo-style: input → dropdown → "Search More..." → modal
//
//  Full widget options support:
//    no_create       — hide all create options
//    no_quick_create — hide inline "Create" in dropdown
//    no_create_edit  — hide "Create and edit..." popup
//    no_open         — hide external link icon
//
//  Features:
//    ✓ Autocomplete with debounced name_search
//    ✓ Keyboard navigation (↑↓ Enter Escape)
//    ✓ "Quick Create" inline option
//    ✓ "Create and Edit..." popup placeholder
//    ✓ "Search More..." full dialog with pagination
//    ✓ Domain filtering support
//    ✓ Clear button for optional fields
// ══════════════════════════════════════════════════════════
(function () {
const RPC = window.LarasoftRPC;

function esc(v) { return v == null ? '' : String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/**
 * M2OAutocomplete – manages a Many2one autocomplete interaction.
 * Can be used standalone (imperative) or integrated with FormView.
 */
class M2OAutocomplete {
    constructor({ input, relation, fieldLabel, fieldName, relOptions, onSelect, onClear, options }) {
        this.input = input;
        this.relation = relation;
        this.fieldLabel = fieldLabel || '';
        this.fieldName = fieldName || '';
        this.relOptions = relOptions || [];
        this.onSelect = onSelect;
        this.onClear = onClear || (() => {});

        // Odoo M2O widget options
        this.opts = options || {};
        this.noCreate = this.opts.no_create || false;
        this.noQuickCreate = this.opts.no_quick_create || false;
        this.noCreateEdit = this.opts.no_create_edit || false;
        this.domain = this.opts.domain || null;

        this._dropdown = null;
        this._debounce = null;
        this._activeIndex = -1;
        this._items = [];

        this._onInput = this._handleInput.bind(this);
        this._onFocus = this._handleFocus.bind(this);
        this._onBlur = this._handleBlur.bind(this);
        this._onKeydown = this._handleKeydown.bind(this);
        this._onDocClick = this._handleDocClick.bind(this);

        input.addEventListener('input', this._onInput);
        input.addEventListener('focus', this._onFocus);
        input.addEventListener('blur', this._onBlur);
        input.addEventListener('keydown', this._onKeydown);
    }

    destroy() {
        this.input.removeEventListener('input', this._onInput);
        this.input.removeEventListener('focus', this._onFocus);
        this.input.removeEventListener('blur', this._onBlur);
        this.input.removeEventListener('keydown', this._onKeydown);
        document.removeEventListener('click', this._onDocClick, true);
        this._closeDropdown();
    }

    /** Update preloaded options (e.g. after parent model loads) */
    setRelOptions(opts) {
        this.relOptions = opts || [];
    }

    _handleFocus() {
        // When clicking an already filled input, show default options instead of searching for the current value.
        // This prevents redundant RPC calls for already cached or loaded data.
        this.input.select();
        this._showDropdown('');
    }

    _handleBlur() {
        // Delay to allow click on dropdown items
        setTimeout(() => {
            if (!this._dropdown) return;
            // If input was cleared and no option selected, restore or clear
            if (!this.input.value && this.input.dataset.curId) {
                // User cleared the field manually
                this.input.dataset.curId = '';
                this.onClear();
            }
            this._closeDropdown();
        }, 220);
    }

    _handleDocClick(ev) {
        if (this._dropdown && !this._dropdown.contains(ev.target) && ev.target !== this.input) {
            this._closeDropdown();
        }
    }

    _handleInput() {
        clearTimeout(this._debounce);
        this._debounce = setTimeout(() => {
            const query = this.input.value;
            // Prevent redundant searches if the query hasn't actually changed
            if (this._lastQuery === query && this._dropdown) return;
            this._lastQuery = query;
            this._showDropdown(query);
        }, 180);
    }

    _handleKeydown(ev) {
        if (ev.key === 'Enter') {
            ev.preventDefault(); // Never submit the form when typing in M2O
        }
        if (!this._dropdown) {
            if (ev.key === 'ArrowDown') {
                ev.preventDefault();
                ev.stopPropagation();
                this._showDropdown(this.input.value);
            }
            return;
        }
        const items = this._dropdown.querySelectorAll('.ls-m2o-dd-item, .ls-m2o-dd-search-more');
        if (ev.key === 'ArrowDown') {
            ev.preventDefault();
            this._activeIndex = Math.min(this._activeIndex + 1, items.length - 1);
            this._highlightItem(items);
        } else if (ev.key === 'ArrowUp') {
            ev.preventDefault();
            this._activeIndex = Math.max(this._activeIndex - 1, 0);
            this._highlightItem(items);
        } else if (ev.key === 'Enter') {
            if (this._activeIndex >= 0 && items[this._activeIndex]) {
                const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
                items[this._activeIndex].dispatchEvent(event);
            }
        } else if (ev.key === 'Escape') {
            this._closeDropdown();
            this.input.blur();
        } else if (ev.key === 'Tab') {
            // Select first if single match
            if (items.length === 1) {
                const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
                items[0].dispatchEvent(event);
            }
            this._closeDropdown();
        }
    }

    _highlightItem(items) {
        items.forEach((el, i) => {
            el.classList.toggle('highlighted', i === this._activeIndex);
            if (i === this._activeIndex) el.scrollIntoView({ block: 'nearest' });
        });
    }

    async _showDropdown(query) {
        this._closeDropdown();
        this._activeIndex = -1;

        let results;
        if (query && query.length > 0) {
            try {
                results = await RPC.nameSearch(this.relation, query, 8);
            } catch { results = []; }
        } else {
            results = this.relOptions.slice(0, 8);
        }

        const dd = document.createElement('div');
        dd.className = 'ls-m2o-dropdown';

        // Matched results
        results.forEach((opt, i) => {
            const item = document.createElement('div');
            item.className = 'ls-m2o-dd-item';
            // Highlight matched text
            if (query) {
                const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                item.innerHTML = opt.name.replace(regex, '<mark style="background:#fef3c7;padding:0">$1</mark>');
            } else {
                item.textContent = opt.name;
            }
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this._selectOption(opt);
            });
            dd.appendChild(item);
        });

        // Separator before actions (if results exist and actions will follow)
        const hasActions = !this.noCreate || true; // always show search more
        if (results.length > 0 && hasActions) {
            const sep = document.createElement('div');
            sep.className = 'ls-m2o-dd-separator';
            dd.appendChild(sep);
        }

        // "Quick Create" — Create "query" inline
        if (query && query.length > 0 && !this.noCreate && !this.noQuickCreate) {
            const qc = document.createElement('div');
            qc.className = 'ls-m2o-dd-item ls-m2o-dd-action';
            qc.innerHTML = `<span class="ls-m2o-dd-action-icon">+</span> Create "<em>${esc(query)}</em>"`;
            qc.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this._quickCreate(query);
            });
            dd.appendChild(qc);
        }

        // "Create and Edit..." — Open popup form
        if (!this.noCreate && !this.noCreateEdit) {
            const ce = document.createElement('div');
            ce.className = 'ls-m2o-dd-item ls-m2o-dd-action';
            ce.innerHTML = `<span class="ls-m2o-dd-action-icon">⊕</span> Create and edit...`;
            ce.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this._createAndEdit(query);
            });
            dd.appendChild(ce);
        }

        // "Search More..." button
        const searchMore = document.createElement('div');
        searchMore.className = 'ls-m2o-dd-search-more';
        searchMore.innerHTML = `<span>🔍</span> Search More...`;
        searchMore.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this._closeDropdown();
            this._openSearchDialog(query);
        });
        dd.appendChild(searchMore);

        // Position dropdown
        const rect = this.input.getBoundingClientRect();
        dd.style.position = 'fixed';
        dd.style.top = rect.bottom + 2 + 'px';
        dd.style.left = rect.left + 'px';
        dd.style.width = Math.max(rect.width + 40, 260) + 'px';
        dd.style.zIndex = '9999';
        document.body.appendChild(dd);
        this._dropdown = dd;

        document.addEventListener('click', this._onDocClick, true);

        // Automatically highlight the first option for keyboard navigation
        const items = dd.querySelectorAll('.ls-m2o-dd-item, .ls-m2o-dd-search-more');
        if (items.length > 0) {
            this._activeIndex = 0;
            this._highlightItem(items);
        }
    }

    _closeDropdown() {
        if (this._dropdown) {
            this._dropdown.remove();
            this._dropdown = null;
        }
        document.removeEventListener('click', this._onDocClick, true);
    }

    _selectOption(opt) {
        this._closeDropdown();
        this.input.value = opt.name;
        this.input.dataset.curId = opt.id;
        this.onSelect(opt);
    }

    async _quickCreate(name) {
        this._closeDropdown();
        try {
            // Create a new record with just the name
            const result = await RPC.quickCreate(this.relation, name);
            if (result && result.id) {
                const opt = { id: result.id, name: result.name || name };
                this.input.value = opt.name;
                this.input.dataset.curId = opt.id;
                this.onSelect(opt);
                // Add to rel options cache
                this.relOptions.unshift(opt);
            }
        } catch (e) {
            console.warn('Quick create failed:', e);
            // Fallback: show a simple prompt
            this._createAndEdit(name);
        }
    }

    _createAndEdit(initialName) {
        this._closeDropdown();
        // Open a creation dialog (simplified version)
        const dialog = new M2OCreateDialog({
            relation: this.relation,
            fieldLabel: this.fieldLabel,
            initialName: initialName || '',
            onCreated: (opt) => {
                this.input.value = opt.name;
                this.input.dataset.curId = opt.id;
                this.onSelect(opt);
                this.relOptions.unshift(opt);
            },
        });
        dialog.open();
    }

    _openSearchDialog(initialQuery) {
        const dialog = new M2OSearchDialog({
            relation: this.relation,
            fieldLabel: this.fieldLabel,
            initialQuery: initialQuery || '',
            noCreate: this.noCreate,
            onSelect: (opt) => {
                this.input.value = opt.name;
                this.input.dataset.curId = opt.id;
                this.onSelect(opt);
            },
        });
        dialog.open();
    }
}

/**
 * M2OCreateDialog — "Create and Edit..." popup for Many2one.
 * Shows the target model's fields for creating a new record.
 */
class M2OCreateDialog {
    constructor({ relation, fieldLabel, initialName, onCreated }) {
        this.relation = relation;
        this.fieldLabel = fieldLabel;
        this.initialName = initialName;
        this.onCreated = onCreated;
        this.overlay = null;
        this.fieldDefs = {};
        this.editableFields = [];
    }

    async open() {
        try {
            this.fieldDefs = await RPC.fieldsGet(this.relation);
        } catch { this.fieldDefs = {}; }

        // Determine editable fields (skip relational, binary, computed)
        this.editableFields = [];
        for (const [fname, fdef] of Object.entries(this.fieldDefs)) {
            if (fname === 'id') continue;
            if (fdef.readonly) continue;
            if (['one2many', 'many2many', 'binary', 'html'].includes(fdef.type)) continue;
            if (fdef.store === false) continue;
            this.editableFields.push({ name: fname, ...fdef });
        }
        // Show at most 8 fields, name first
        this.editableFields.sort((a, b) => {
            if (a.name === 'name') return -1;
            if (b.name === 'name') return 1;
            if (a.required && !b.required) return -1;
            if (!a.required && b.required) return 1;
            return 0;
        });
        this.editableFields = this.editableFields.slice(0, 8);

        this.overlay = document.createElement('div');
        this.overlay.className = 'ls-m2o-dialog-overlay';
        this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
        document.body.appendChild(this.overlay);
        this._render();
    }

    close() {
        if (this.overlay) { this.overlay.remove(); this.overlay = null; }
    }

    _render() {
        const dialog = document.createElement('div');
        dialog.className = 'ls-m2o-dialog ls-m2o-create-dialog';
        dialog.style.maxWidth = '520px';

        let fieldsHtml = '';
        for (const f of this.editableFields) {
            const defaultVal = f.name === 'name' ? this.initialName : (f.default || '');
            const req = f.required ? '<span style="color:#ef4444">*</span>' : '';
            let inputHtml;

            if (f.type === 'selection' && f.selection) {
                inputHtml = `<select class="ls-field-input ls-create-field" data-fname="${f.name}">`;
                const sel = Array.isArray(f.selection) ? f.selection : Object.entries(f.selection);
                sel.forEach(item => {
                    const v = Array.isArray(item) ? item[0] : (item.value ?? item[0]);
                    const l = Array.isArray(item) ? item[1] : (item.label ?? item[1]);
                    inputHtml += `<option value="${esc(v)}" ${v == defaultVal ? 'selected' : ''}>${esc(l)}</option>`;
                });
                inputHtml += '</select>';
            } else if (f.type === 'boolean') {
                inputHtml = `<input type="checkbox" class="ls-create-field" data-fname="${f.name}" ${defaultVal ? 'checked' : ''}/>`;
            } else if (f.type === 'integer') {
                inputHtml = `<input type="number" step="1" class="ls-field-input ls-create-field" data-fname="${f.name}" value="${defaultVal || 0}"/>`;
            } else if (f.type === 'float' || f.type === 'monetary') {
                inputHtml = `<input type="number" step="0.01" class="ls-field-input ls-create-field" data-fname="${f.name}" value="${defaultVal || 0}"/>`;
            } else if (f.type === 'date') {
                inputHtml = `<input type="date" class="ls-field-input ls-create-field" data-fname="${f.name}" value="${defaultVal || ''}"/>`;
            } else if (f.type === 'text') {
                inputHtml = `<textarea class="ls-field-input ls-create-field" data-fname="${f.name}" rows="2">${esc(defaultVal)}</textarea>`;
            } else if (f.type === 'many2one') {
                inputHtml = `<input type="text" class="ls-field-input ls-create-field" data-fname="${f.name}" data-type="many2one" data-relation="${esc(f.relation || '')}" value="" placeholder="Search..."/>`;
            } else {
                inputHtml = `<input type="text" class="ls-field-input ls-create-field" data-fname="${f.name}" value="${esc(defaultVal)}" placeholder="${esc(f.string || '')}..."/>`;
            }

            fieldsHtml += `<div class="ls-create-row">
                <label class="ls-create-label">${esc(f.string || f.name)} ${req}</label>
                <div class="ls-create-value">${inputHtml}</div>
            </div>`;
        }

        dialog.innerHTML = `
            <div class="ls-m2o-dialog-header">
                <h3>Create: ${esc(this.fieldLabel)}</h3>
                <button class="ls-m2o-dialog-close" title="Close">✕</button>
            </div>
            <div class="ls-m2o-create-body">${fieldsHtml}</div>
            <div class="ls-m2o-dialog-footer" style="gap:8px;justify-content:flex-end;">
                <button class="ls-m2o-dialog-btn-close">Discard</button>
                <button class="ls-m2o-create-save" style="background:var(--ls-primary,#714b67);color:#fff;border:none;padding:6px 18px;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer;">Save</button>
            </div>`;

        dialog.querySelector('.ls-m2o-dialog-close').addEventListener('click', () => this.close());
        dialog.querySelector('.ls-m2o-dialog-btn-close').addEventListener('click', () => this.close());
        dialog.querySelector('.ls-m2o-create-save').addEventListener('click', () => this._save());

        this.dialog = dialog;
        this.overlay.appendChild(dialog);

        // Focus name field
        setTimeout(() => {
            const nameInput = dialog.querySelector('[data-fname="name"]');
            if (nameInput) nameInput.focus();
        }, 50);
    }

    async _save() {
        const values = {};
        this.dialog.querySelectorAll('.ls-create-field').forEach(el => {
            const fname = el.dataset.fname;
            if (el.type === 'checkbox') { values[fname] = el.checked; }
            else if (el.type === 'number') { values[fname] = parseFloat(el.value) || 0; }
            else { values[fname] = el.value; }
        });

        // Validate required
        for (const f of this.editableFields) {
            if (f.required && !values[f.name]) {
                const el = this.dialog.querySelector(`[data-fname="${f.name}"]`);
                if (el) { el.style.borderColor = '#ef4444'; el.focus(); }
                return;
            }
        }

        try {
            const result = await RPC.create(this.relation, values);
            if (result && result.id) {
                const recName = values.name || values.display_name || `#${result.id}`;
                this.onCreated({ id: result.id, name: recName });
                this.close();
            }
        } catch (e) {
            console.error('Create failed:', e);
            alert('Failed to create record: ' + (e.message || 'Unknown error'));
        }
    }
}

/**
 * M2OSearchDialog – Odoo-style "Search: Model" modal.
 * Full search with paginated table, columns from model fields.
 */
class M2OSearchDialog {
    constructor({ relation, fieldLabel, initialQuery, onSelect, noCreate }) {
        this.relation = relation;
        this.fieldLabel = fieldLabel;
        this.initialQuery = initialQuery;
        this.onSelect = onSelect;
        this.noCreate = noCreate || false;
        this.overlay = null;
        this.records = [];
        this.totalCount = 0;
        this.offset = 0;
        this.limit = 80;
        this.query = initialQuery;
        this.fieldDefs = {};
        this.displayFields = [];
    }

    async open() {
        // Load field definitions for the related model
        try {
            this.fieldDefs = await RPC.fieldsGet(this.relation);
        } catch { this.fieldDefs = {}; }

        // Determine which fields to show as columns
        this.displayFields = this._getDisplayFields();

        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'ls-m2o-dialog-overlay';
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
        document.body.appendChild(this.overlay);

        // Render dialog
        this._render();
        await this._loadRecords();
    }

    close() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    _getDisplayFields() {
        const fields = [];
        const defs = this.fieldDefs;
        // Always show name first
        for (const [fname, fdef] of Object.entries(defs)) {
            if (fdef.type === 'one2many' || fdef.type === 'many2many') continue;
            if (fdef.type === 'binary' || fdef.type === 'html') continue;
            if (fname === 'id') continue;
            fields.push({ name: fname, label: fdef.string || fname, type: fdef.type });
        }
        // Limit to ~6 columns
        return fields.slice(0, 6);
    }

    _render() {
        const dialog = document.createElement('div');
        dialog.className = 'ls-m2o-dialog';
        dialog.innerHTML = `
            <div class="ls-m2o-dialog-header">
                <h3>Search: ${this._esc(this.fieldLabel)}</h3>
                <button class="ls-m2o-dialog-close" title="Close">✕</button>
            </div>
            <div class="ls-m2o-dialog-search">
                <div class="ls-m2o-dialog-search-box">
                    <span class="ls-m2o-search-icon">🔍</span>
                    <input type="text" class="ls-m2o-dialog-search-input" placeholder="Search..." value="${this._esc(this.query)}"/>
                </div>
                <div class="ls-m2o-dialog-pager">
                    <span class="ls-m2o-pager-info"></span>
                    <button class="ls-m2o-pager-prev" title="Previous" disabled>‹</button>
                    <button class="ls-m2o-pager-next" title="Next" disabled>›</button>
                </div>
            </div>
            <div class="ls-m2o-dialog-table-wrap">
                <table class="ls-m2o-dialog-table">
                    <thead><tr></tr></thead>
                    <tbody></tbody>
                </table>
            </div>
            <div class="ls-m2o-dialog-footer">
                ${!this.noCreate ? '<button class="ls-m2o-dialog-btn-create" style="margin-right:auto;padding:6px 14px;border:1px solid var(--ls-border);border-radius:4px;background:transparent;font-size:13px;cursor:pointer;font-family:var(--ls-font)">+ Create</button>' : ''}
                <button class="ls-m2o-dialog-btn-close">Close</button>
            </div>
        `;

        // Event listeners
        dialog.querySelector('.ls-m2o-dialog-close').addEventListener('click', () => this.close());
        dialog.querySelector('.ls-m2o-dialog-btn-close').addEventListener('click', () => this.close());

        const createBtn = dialog.querySelector('.ls-m2o-dialog-btn-create');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.close();
                const cd = new M2OCreateDialog({
                    relation: this.relation,
                    fieldLabel: this.fieldLabel,
                    initialName: this.query || '',
                    onCreated: (opt) => { this.onSelect(opt); },
                });
                cd.open();
            });
        }

        const searchInput = dialog.querySelector('.ls-m2o-dialog-search-input');
        let debounce = null;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                this.query = searchInput.value;
                this.offset = 0;
                this._loadRecords();
            }, 300);
        });

        dialog.querySelector('.ls-m2o-pager-prev').addEventListener('click', () => {
            if (this.offset > 0) {
                this.offset = Math.max(0, this.offset - this.limit);
                this._loadRecords();
            }
        });
        dialog.querySelector('.ls-m2o-pager-next').addEventListener('click', () => {
            if (this.offset + this.limit < this.totalCount) {
                this.offset += this.limit;
                this._loadRecords();
            }
        });

        // Render headers
        const thead = dialog.querySelector('thead tr');
        this.displayFields.forEach(f => {
            const th = document.createElement('th');
            th.textContent = f.label;
            thead.appendChild(th);
        });

        this.dialog = dialog;
        this.overlay.appendChild(dialog);

        // Auto-focus search
        setTimeout(() => searchInput.focus(), 50);
    }

    async _loadRecords() {
        const tbody = this.dialog.querySelector('tbody');
        tbody.innerHTML = '<tr><td colspan="99" style="text-align:center;padding:20px;color:#9ca3af;">Loading...</td></tr>';

        try {
            const result = await RPC.searchRead(this.relation, 
                this.query ? [[this._getRecName(), 'like', this.query]] : [],
                { limit: this.limit, offset: this.offset, order: this._getRecName() + ' asc' }
            );
            this.records = result.records || [];
            this.totalCount = result.length || 0;
        } catch {
            this.records = [];
            this.totalCount = 0;
        }

        this._renderRows();
        this._updatePager();
    }

    _getRecName() {
        // Find the first char field or default to 'name'
        for (const [fname, fdef] of Object.entries(this.fieldDefs)) {
            if (fname === 'name') return 'name';
        }
        return this.displayFields[0]?.name || 'name';
    }

    _renderRows() {
        const tbody = this.dialog.querySelector('tbody');
        tbody.innerHTML = '';

        if (this.records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="99" style="text-align:center;padding:30px;color:#9ca3af;">No records found</td></tr>';
            return;
        }

        this.records.forEach(rec => {
            const tr = document.createElement('tr');
            tr.className = 'ls-m2o-dialog-row';
            tr.addEventListener('click', () => {
                const recName = this._getRecName();
                this.onSelect({ id: rec.id, name: rec[recName] || rec.name || `#${rec.id}` });
                this.close();
            });

            this.displayFields.forEach(f => {
                const td = document.createElement('td');
                let val = rec[f.name];
                // Format value based on type
                if (Array.isArray(val)) val = val[1] || ''; // many2one
                else if (val === true) val = '✓';
                else if (val === false || val === null || val === undefined) val = '';
                else if (typeof val === 'object') val = JSON.stringify(val);
                td.textContent = String(val);
                td.title = String(val);
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });
    }

    _updatePager() {
        const info = this.dialog.querySelector('.ls-m2o-pager-info');
        const prevBtn = this.dialog.querySelector('.ls-m2o-pager-prev');
        const nextBtn = this.dialog.querySelector('.ls-m2o-pager-next');

        if (this.totalCount === 0) {
            info.textContent = '0 / 0';
        } else {
            const start = this.offset + 1;
            const end = Math.min(this.offset + this.records.length, this.totalCount);
            info.textContent = `${start}-${end} / ${this.totalCount}`;
        }

        prevBtn.disabled = this.offset <= 0;
        nextBtn.disabled = this.offset + this.limit >= this.totalCount;
    }

    _esc(v) { return v == null ? '' : String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
}

// Export globally
window.M2OAutocomplete = M2OAutocomplete;
window.M2OSearchDialog = M2OSearchDialog;
window.M2OCreateDialog = M2OCreateDialog;

})();
