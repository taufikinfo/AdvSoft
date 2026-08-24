// Owl App — Full Odoo <tree> ListView Architecture
(function () {
const { Component, useState, useRef, onMounted, onWillStart } = owl;
const RPC = window.AdvSoftRPC;
const icons = window.AdvSoftIcons;
let facetCounter = 0;

class ListView extends Component {
    static template = window.TEMPLATES.App;
    static props = {
        onOpenRecord: { type: Function, optional: true },
        stages: { type: Array, optional: true },
        projects: { type: Array, optional: true },
        tags: { type: Array, optional: true },
        model: { type: String, optional: true },
        searchViewDef: { type: Object, optional: true },
        listViewDef: { type: Object, optional: true },
        actionTitle: { type: String, optional: true },
        viewModes: { type: Array, optional: true },
        activeViewType: { type: String, optional: true },
        onSwitchView: { type: Function, optional: true },
        actionDomain: { type: Array, optional: true },
        actionContext: { type: Object, optional: true },
    };

    setup() {
        this.icons = icons;
        this.state = useState({
            records: [], groups: [], groupRecords: {}, collapsedGroups: {},
            groupNodes: [],
            totalCount: 0, loading: true, offset: 0, limit: 80,
            orderBy: 'id desc', domain: [], groupBy: null,
            facets: [], searchQuery: '', showSearchPanel: false,
            showAutocomplete: false, showCustomFilter: false,
            showSaveFav: false, selectedIds: [], fields: {},
            projects: [], stages: [], tags: [], savedFilters: [],
            // Odoo tree features
            hiddenColumns: {}, showOptionalMenu: false,
            aggregates: {},
            editingValues: {},
            editingNew: false,
            editingNewValues: {},
            printActions: [],
            showPrintMenu: false,
            // Inline creation positioning (top vs bottom)
            listEditablePosition: (this.props.listViewDef && this.props.listViewDef.editable === 'bottom') ? 'bottom' : 'top',
            searchPanelValues: {},   // category selections: { field: selectedId }
            searchPanelFilters: {},  // multi-select: { field: [id1, id2] }
            searchPanelData: {},     // cached values per section: { field: [{id, name, __count}] }
            // Column resizing
            colWidths: {},
        });

        this.searchInputRef = useRef('searchInput');
        this.searchbarRef = useRef('searchbar');
        this.cfFieldRef = useRef('cfField');
        this.cfOpRef = useRef('cfOp');
        this.cfValRef = useRef('cfVal');
        this.favNameRef = useRef('favName');
        this.favDefaultRef = useRef('favDefault');
        this.favSharedRef = useRef('favShared');

        this._onDocClick = (e) => {
            const sb = this.searchbarRef.el;
            if (sb && !sb.contains(e.target)) {
                this.state.showSearchPanel = false;
                this.state.showAutocomplete = false;
            }
            if (!e.target.closest('.ls-optional-toggle')) {
                this.state.showOptionalMenu = false;
            }
            if (!e.target.closest('.ls-print-menu')) {
                this.state.showPrintMenu = false;
            }
        };

        this._model = this.props.model || 'task';

        onWillStart(async () => {
            const [fields, filters, printActions] = await Promise.all([
                RPC.fieldsGet(this._model),
                RPC.getFilters(this._model),
                RPC.getReportActions(this._model),
            ]);
            this.state.fields = fields || {};
            this.state.savedFilters = filters || [];
            this.state.printActions = printActions || [];
            this.state.projects = this.props.projects || [];
            this.state.stages = this.props.stages || [];
            this.state.tags = this.props.tags || [];
            // Apply limit from view def
            const vd = this.props.listViewDef;
            if (vd?.limit) this.state.limit = vd.limit;
            if (vd?.default_order) this.state.orderBy = vd.default_order;
            // Initialize hidden columns from optional config
            if (vd?.columns) {
                vd.columns.forEach(c => {
                    if (c.optional === 'hide') this.state.hiddenColumns[c.name] = true;
                });
            }
        });

        onMounted(() => {
            document.addEventListener('click', this._onDocClick);
            this._loadSearchPanelData();
            this.loadRecords();
        });
    }

    // ══ COLUMN RESIZING ══════════════════════════════
    onResizeStart(ev, colName) {
        ev.preventDefault();
        ev.stopPropagation(); // Prevent sort
        const th = ev.target.closest('th');
        if (!th) return;
        const startX = ev.clientX;
        const startWidth = th.getBoundingClientRect().width;
        // Apply styling to show resizing state
        ev.target.classList.add('active');

        const onMouseMove = (e) => {
            const newWidth = Math.max(50, startWidth + (e.clientX - startX));
            // Apply width directly to DOM for smooth resizing without full re-render
            th.style.width = newWidth + 'px';
        };

        const onMouseUp = (e) => {
            ev.target.classList.remove('active');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            // Save final width to state
            const finalWidth = Math.max(50, startWidth + (e.clientX - startX));
            this.state.colWidths[colName] = finalWidth;
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    // ══ SEARCH PANEL (left sidebar) ═══════════════════
    get searchPanelSections() {
        const svd = this.props.searchViewDef;
        const sections = svd?.searchpanel || [];
        return sections.map(s => ({
            ...s,
            _values: this.state.searchPanelData[s.field] || [],
            _totalCount: (this.state.searchPanelData[s.field] || []).reduce((sum, v) => sum + (v.__count || 0), 0),
        }));
    }

    async _loadSearchPanelData() {
        const svd = this.props.searchViewDef;
        const sections = svd?.searchpanel || [];
        if (sections.length === 0) return;

        const data = {};
        const promises = sections.map(async (section) => {
            const fieldDef = this.state.fields[section.field];
            if (!fieldDef) return;

            if (['many2one', 'selection'].includes(section.type) || ['many2one', 'selection'].includes(fieldDef.type)) {
                try {
                    const groupRes = await RPC.searchRead(this._model, [], { group_by: section.field });
                    const groups = groupRes.groups || [];

                    if (fieldDef.type === 'selection' || section.type === 'selection') {
                        const sel = fieldDef.selection || [];
                        const countMap = {};
                        groups.forEach(g => {
                            const v = g[section.field] !== undefined ? g[section.field] : g.id;
                            countMap[v] = g.__count || 0;
                        });
                        data[section.field] = sel.map(item => {
                            const v = Array.isArray(item) ? item[0] : (item.value ?? item[0]);
                            const l = Array.isArray(item) ? item[1] : (item.label ?? item[1]);
                            return { id: v, name: l, __count: countMap[v] || 0 };
                        });
                    } else {
                        const relation = fieldDef.relation;
                        if (!relation) return;
                        const ids = groups.map(g => {
                            const v = g[section.field];
                            return v !== undefined ? v : g.id;
                        }).filter(v => v !== null && v !== undefined && v !== false);

                        if (ids.length > 0) {
                            const names = await RPC.nameSearch(relation, '', 200);
                            const nameMap = {};
                            names.forEach(n => { nameMap[n.id] = n.name; });
                            data[section.field] = groups.filter(g => {
                                const v = g[section.field] !== undefined ? g[section.field] : g.id;
                                return v !== null && v !== undefined && v !== false;
                            }).map(g => {
                                const v = g[section.field] !== undefined ? g[section.field] : g.id;
                                return {
                                    id: v,
                                    name: nameMap[v] || g.name || `#${v}`,
                                    __count: g.__count || 0,
                                };
                            });
                        } else {
                            data[section.field] = [];
                        }
                    }
                } catch(e) { console.warn('SearchPanel load error:', e); data[section.field] = []; }
            }
        });
        await Promise.all(promises);
        this.state.searchPanelData = data;
    }

    setSearchPanelCategory(field, value) {
        if (value === null) delete this.state.searchPanelValues[field];
        else this.state.searchPanelValues[field] = value;
        this.state.offset = 0;
        this.loadRecords();
    }

    toggleSearchPanelFilter(field, id) {
        const current = this.state.searchPanelFilters[field] || [];
        const idx = current.indexOf(id);
        if (idx >= 0) current.splice(idx, 1);
        else current.push(id);
        this.state.searchPanelFilters[field] = [...current];
        this.state.offset = 0;
        this.loadRecords();
    }

    // ══ LIST VIEW DEFINITION PROPERTIES ══════════════
    get listEditable() { return this.props.listViewDef?.editable || null; }
    get listEditablePosition() { return this.listEditable; }
    get multiEditEnabled() { return this.props.listViewDef?.multi_edit || false; }
    get multiEditActive() {
        return this.multiEditEnabled && this.state.selectedIds.length > 1 && this.state.editingId;
    }
    get headerButtons() { return this.props.listViewDef?.header_buttons || []; }
    get decorationRules() { return this.props.listViewDef?.decoration || {}; }

    // ══ COLUMNS (with optional show/hide) ════════════
    get allColumns() {
        const vd = this.props.listViewDef;
        if (vd?.columns) return vd.columns;
        const fieldNames = vd?.fields || Object.keys(this.state.fields).slice(0, 8);
        return fieldNames.map(f => ({
            name: f, string: this.state.fields[f]?.string || f,
            type: this.state.fields[f]?.type || 'char',
            widget: this.state.fields[f]?.widget || null,
            sortable: this.state.fields[f]?.sortable || false,
        }));
    }
    get visibleColumns() {
        return this.allColumns.filter(c => !this.state.hiddenColumns[c.name] && !c.column_invisible);
    }
    get optionalColumns() {
        return this.allColumns.filter(c => c.optional === 'show' || c.optional === 'hide');
    }
    get aggregateColumns() {
        return this.visibleColumns.filter(c => c.aggregation);
    }
    isColumnVisible(name) { return !this.state.hiddenColumns[name]; }
    toggleColumn(name) {
        if (this.state.hiddenColumns[name]) delete this.state.hiddenColumns[name];
        else this.state.hiddenColumns[name] = true;
    }
    toggleOptionalMenu() { this.state.showOptionalMenu = !this.state.showOptionalMenu; }

    // ══ DECORATION RULES (conditional row coloring) ══
    getRowClasses(rec) {
        const classes = [];
        if (this.isSelected(rec.id)) classes.push('selected');
        for (const [decClass, expr] of Object.entries(this.decorationRules)) {
            if (this._evalDecoration(expr, rec)) {
                classes.push('ls-' + decClass);
            }
        }
        return classes.join(' ');
    }
    _evalDecoration(expr, rec) {
        try {
            const parts = expr.replace(/ and /g, ' && ').replace(/ or /g, ' || ')
                .replace(/!=/g, '!==').replace(/([^!><])={1}(?!=)/g, '$1===')
                .replace(/False/g, 'false').replace(/True/g, 'true');
            const fields = Object.keys(rec);
            const vals = fields.map(f => rec[f]);
            const fn = new Function(...fields, `return !!(${parts});`);
            return fn(...vals);
        } catch { return false; }
    }

    // ══ CELL RENDERING ══════════════════════════════
    renderCellContent(rec, col) {
        const fieldDef = this.state.fields[col.name] || {};
        const merged = { ...fieldDef };
        if (col.widget) merged.widget = col.widget;
        return window.listHelpers.renderListCell(merged, rec[col.name]);
    }

    // ══ INLINE EDITING ══════════════════════════════
    /**
     * Resolve the actual editable input type from widget + field type.
     * Widgets like 'badge','statusbar' → selection; 'progressbar' → number; etc.
     */
    _resolveEditType(col) {
        const fieldDef = this.state.fields[col.name] || {};
        const widget = col.widget || fieldDef.widget;
        const baseType = fieldDef.type || 'char';

        // Widget → editable type mapping
        if (widget === 'badge' || widget === 'statusbar' || widget === 'state_selection' || widget === 'badges') {
            return baseType === 'many2one' ? 'many2one' : 'selection';
        }
        if (widget === 'progressbar' || widget === 'percentage' || widget === 'percentage_pie') return 'number';
        if (widget === 'float_time') return 'number';
        if (widget === 'remaining_days' || widget === 'daterange') return 'date';
        if (widget === 'boolean_favorite' || widget === 'boolean_toggle' || widget === 'boolean_button') return 'boolean';
        if (widget === 'priority') return 'selection';
        if (widget === 'monetary') return 'number';
        if (widget === 'many2one_avatar' || widget === 'many2one_avatar_user' || widget === 'many2onebutton') return 'many2one';
        if (widget === 'email' || widget === 'url' || widget === 'phone' || widget === 'copy_clipboard') return 'char';
        if (widget === 'many2many_tags' || widget === 'many2many_checkboxes') return 'many2many';
        if (widget === 'color_picker') return 'color';

        return baseType;
    }

    renderInlineEditCell(col, values, recId) {
        const fieldDef = this.state.fields[col.name] || {};
        const val = values[col.name] ?? '';
        const editType = this._resolveEditType(col);
        const name = col.name;
        const esc = v => v == null ? '' : String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        const dirty = `oninput="this.dataset.dirty='1'" onchange="this.dataset.dirty='1'"`;

        let html = '';

        if (editType === 'many2one') {
            // Render <select> with pre-loaded relation options
            const options = this.state._relOptions?.[name] || [];
            const curId = Array.isArray(val) ? val[0] : (typeof val === 'object' && val ? val.id : val);
            html = `<select class="ls-inline-input" data-field="${name}" data-inline="1" ${dirty}>`;
            html += `<option value="">—</option>`;
            options.forEach(o => {
                html += `<option value="${o.id}" ${curId == o.id ? 'selected' : ''}>${esc(o.name || o.display_name || o.id)}</option>`;
            });
            html += `</select>`;
        } else if (editType === 'selection') {
            const sel = fieldDef.selection || [];
            const curVal = Array.isArray(val) ? val[0] : val;
            html = `<select class="ls-inline-input" data-field="${name}" data-inline="1" ${dirty}>`;
            html += `<option value="">—</option>`;
            sel.forEach(item => { const v = Array.isArray(item) ? item[0] : (item.value ?? item[0]); const l = Array.isArray(item) ? item[1] : (item.label ?? item[1]); html += `<option value="${esc(v)}" ${curVal == v ? 'selected' : ''}>${esc(l)}</option>`; });
            html += `</select>`;
        } else if (editType === 'boolean') {
            html = `<input type="checkbox" class="ls-inline-input" data-field="${name}" data-inline="1" ${val ? 'checked' : ''} ${dirty}/>`;
        } else if (editType === 'date') {
            const dateVal = typeof val === 'string' ? val.substring(0, 10) : '';
            html = `<input type="date" class="ls-inline-input" data-field="${name}" data-inline="1" value="${esc(dateVal)}" ${dirty}/>`;
        } else if (editType === 'datetime') {
            const dtVal = typeof val === 'string' ? val.replace(' ', 'T').substring(0, 16) : '';
            html = `<input type="datetime-local" class="ls-inline-input" data-field="${name}" data-inline="1" value="${esc(dtVal)}" ${dirty}/>`;
        } else if (editType === 'number') {
            const numVal = typeof val === 'number' ? val : (parseFloat(val) || 0);
            html = `<input type="number" class="ls-inline-input" data-field="${name}" data-inline="1" step="any" value="${numVal}" ${dirty}/>`;
        } else if (editType === 'integer') {
            html = `<input type="number" class="ls-inline-input" data-field="${name}" data-inline="1" step="1" value="${parseInt(val) || 0}" ${dirty}/>`;
        } else if (editType === 'float' || editType === 'monetary') {
            html = `<input type="number" class="ls-inline-input" data-field="${name}" data-inline="1" step="0.01" value="${parseFloat(val) || 0}" ${dirty}/>`;
        } else if (editType === 'many2many') {
            // Many2many not editable inline — show read-only
            const tags = Array.isArray(val) ? val.map(t => t.name || '').join(', ') : '';
            html = `<span class="ls-inline-readonly" data-field="${name}" data-inline="1" data-dirty="0">${esc(tags) || '(tags)'}</span>`;
        } else if (editType === 'color') {
            html = `<input type="color" class="ls-inline-input" data-field="${name}" data-inline="1" value="${esc(val || '#7c3aed')}" ${dirty}/>`;
        } else if (editType === 'text' || editType === 'html') {
            html = `<input type="text" class="ls-inline-input" data-field="${name}" data-inline="1" value="${esc(val)}" placeholder="..." ${dirty}/>`;
        } else {
            // char and fallback
            html = `<input type="text" class="ls-inline-input" data-field="${name}" data-inline="1" value="${esc(val)}" ${dirty}/>`;
        }
        return owl.markup(html);
    }

    isInlineEditing(recId) { return this.state.editingId === recId; }

    /**
     * Pre-load relation options for all many2one columns.
     * Stores them in state._relOptions for use by renderInlineEditCell.
     */
    async _loadRelationOptions() {
        const relOpts = {};
        const promises = [];
        for (const col of this.visibleColumns) {
            const fd = this.state.fields[col.name];
            if (!fd) continue;
            if (fd.type === 'many2one' || col.name.endsWith('_id')) {
                const relation = fd.relation;
                if (!relation) continue;
                promises.push(
                    RPC.nameSearch(relation, '', 100).then(res => {
                        relOpts[col.name] = res.results || res || [];
                    }).catch(() => { relOpts[col.name] = []; })
                );
            }
        }
        await Promise.all(promises);
        this.state._relOptions = relOpts;
    }

    async onNewInline() {
        await this._loadRelationOptions();
        const defaults = {};
        this.visibleColumns.forEach(c => { defaults[c.name] = ''; });
        this.state.editingNew = true;
        this.state.editingNewValues = defaults;
    }

    async onRowDblClick(rec) {
        if (!this.listEditable) return;
        await this._loadRelationOptions();
        if (this.multiEditEnabled && this.state.selectedIds.length > 1) {
            this.state.editingId = '__multi__';
            this.state.editingValues = {};
            return;
        }
        this.state.editingId = rec.id;
        this.state.editingValues = { ...rec };
    }
    async saveInlineEdit() {
        const container = document.querySelector('.ls-list-wrapper');
        if (!container) return;
        const inputs = container.querySelectorAll('[data-inline="1"]');
        const isMulti = this.state.editingId === '__multi__';

        // Collect values, tracking which fields were actually touched
        const vals = {};
        const dirty = {};
        inputs.forEach(el => {
            const f = el.dataset.field;
            const wasDirty = el.dataset.dirty === '1';
            if (el.type === 'checkbox') { vals[f] = el.checked; if (wasDirty) dirty[f] = true; }
            else if (el.type === 'number') {
                const v = el.value.trim();
                vals[f] = v === '' ? null : (parseFloat(v) || 0);
                if (wasDirty) dirty[f] = true;
            }
            else { vals[f] = el.value; if (wasDirty) dirty[f] = true; }
        });

        // Determine relational (many2one) fields so we can skip empty ones
        const m2oFields = new Set();
        for (const col of this.visibleColumns) {
            const fd = this.state.fields[col.name];
            if (fd && (fd.type === 'many2one' || col.name.endsWith('_id'))) {
                m2oFields.add(col.name);
            }
        }

        try {
            if (this.state.editingNew) {
                // For new records, fill in defaults for required relational fields
                if (this.state.projects[0]?.id) vals.project_id = vals.project_id || this.state.projects[0].id;
                if (this.state.stages[0]?.id) vals.stage_id = vals.stage_id || this.state.stages[0].id;
                // Remove null/empty relational fields
                for (const f of m2oFields) { if (!vals[f]) delete vals[f]; }
                await RPC.create(this._model, vals);
            } else if (isMulti) {
                // Multi-edit: ONLY send fields the user actually modified
                const clean = {};
                for (const [k, v] of Object.entries(vals)) {
                    if (!dirty[k]) continue;           // skip untouched fields
                    if (v === '' || v === null) continue; // skip empty
                    if (v === 0 && m2oFields.has(k)) continue; // skip 0 for FK fields
                    clean[k] = v;
                }
                if (Object.keys(clean).length > 0) {
                    await RPC.call('/api/orm/write', { model: this._model, ids: this.state.selectedIds, values: clean });
                } else {
                    console.info('Multi-edit: no fields were changed.');
                }
            } else if (this.state.editingId) {
                // Single inline edit: remove empty relational fields
                for (const f of m2oFields) { if (!vals[f] || vals[f] === 0) delete vals[f]; }
                await RPC.call('/api/orm/write', { model: this._model, ids: [this.state.editingId], values: vals });
            }
        } catch(e) { alert('Error: ' + (e.message || e)); }
        this.cancelInlineEdit();
        this.loadRecords();
    }
    cancelInlineEdit() {
        this.state.editingNew = false; this.state.editingNewValues = {};
        this.state.editingId = null; this.state.editingValues = {};
    }

    // ══ AGGREGATION FOOTER ══════════════════════════
    async loadAggregates() {
        const measures = this.aggregateColumns.map(c => ({ field: c.name, type: c.aggregation }));
        if (measures.length === 0) { this.state.aggregates = {}; return; }
        try {
            const res = await RPC.call('/api/orm/aggregate', {
                model: this._model, domain: this.buildDomain(), measures,
            });
            this.state.aggregates = res.aggregates || {};
        } catch { this.state.aggregates = {}; }
    }
    formatAggregate(col) {
        const agg = this.state.aggregates[col.name];
        if (!agg) return '—';
        const v = agg.value;
        if (col.widget === 'float_time') { 
            const h = Math.floor(v); 
            return `${h}:${String(Math.round((v-h)*60)).padStart(2,'0')}`; 
        }
        if (typeof v !== 'number') return String(v);
        
        if (col.widget === 'monetary') {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: window.AdvSoftUser?.company_currency || 'IDR',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(v);
        }
        if (col.widget === 'integer') {
            return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(v);
        }
        if (col.widget === 'float') {
            return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
        }
        
        return v.toFixed(2);
    }

    // ══ HEADER BUTTONS ══════════════════════════════
    async onHeaderButton(hb) {
        if (this.state.selectedIds.length === 0) { alert('Select records first.'); return; }
        if (hb.confirm && !confirm(hb.confirm)) return;
        try {
            await RPC.call('/api/orm/call_button_multi', {
                model: this._model, method: hb.name, ids: this.state.selectedIds,
            });
            this.state.selectedIds = [];
            this.loadRecords();
        } catch(e) { alert('Error: ' + (e.message || e)); }
    }
    
    // ══ PRINT REPORT ════════════════════════════════
    async _fetchPrintActions() {
        try {
            this.state.printActions = await RPC.getReportActions(this._model) || [];
        } catch(e) { console.error("Failed to load print actions", e); }
    }

    togglePrintMenu() {
        this.state.showPrintMenu = !this.state.showPrintMenu;
    }

    printReport(reportId) {
        let url = '/api/report/pdf/' + reportId;
        if (this.state.selectedIds && this.state.selectedIds.length > 0) {
            url += '?ids=' + this.state.selectedIds.join(',');
        }
        window.open(url, '_blank');
        this.state.showPrintMenu = false;
    }

    // ══ DATA LOADING ════════════════════════════════
    async loadRecords() {
        this.state.loading = true;
        try {
            const domain = this.buildDomain();
            if (this.state.groupBy && Array.isArray(this.state.groupBy) && this.state.groupBy.length > 0) {
                await this._loadGroupTree(domain);
            } else if (this.state.groupBy && typeof this.state.groupBy === 'string') {
                // Legacy single groupBy fallback
                const gb = [this.state.groupBy];
                this.state.groupBy = gb;
                await this._loadGroupTree(domain);
            } else {
                const res = await RPC.searchRead(this._model, domain, { order: this.state.orderBy, limit: this.state.limit, offset: this.state.offset });
                this.state.records = res.records || [];
                this.state.totalCount = res.length || 0;
                this.state.groupNodes = [];
            }
            this.loadAggregates();
        } catch(e) {
            console.error('Load error:', e);
            this.state.loading = false;
            throw e; // Propagasi error agar ditangkap oleh Global Error Handler (WebClient)
        }
        this.state.loading = false;
    }
    buildDomain() {
        const domain = [];
        if (this.props.actionDomain && Array.isArray(this.props.actionDomain)) {
            domain.push(...this.props.actionDomain);
        }
        // 1. Facet domains (filters, search, group-by, favorites)
        for (const facet of this.state.facets) {
            if (facet.domain) {
                // Handle negated facets
                if (facet.negated) {
                    facet.domain.forEach(d => { if (Array.isArray(d) && d.length === 3) domain.push(['!', d]); });
                } else {
                    domain.push(...facet.domain);
                }
            }
        }
        // 2. SearchPanel category selections
        for (const [field, value] of Object.entries(this.state.searchPanelValues)) {
            if (value !== null && value !== undefined) domain.push([field, '=', value]);
        }
        // 3. SearchPanel filter selections (multi-select: in operator)
        for (const [field, ids] of Object.entries(this.state.searchPanelFilters)) {
            if (ids && ids.length > 0) domain.push([field, 'in', ids]);
        }
        return domain;
    }

    // ══ PAGER ═══════════════════════════════════════
    get pagerText() {
        if (this.state.totalCount === 0) return '0';
        return `${this.state.offset+1}-${Math.min(this.state.offset+this.state.limit, this.state.totalCount)} / ${this.state.totalCount}`;
    }
    prevPage() { this.state.offset = Math.max(0, this.state.offset - this.state.limit); this.loadRecords(); }
    nextPage() { this.state.offset += this.state.limit; this.loadRecords(); }

    // ══ SEARCH ══════════════════════════════════════
    focusSearch() { this.searchInputRef.el?.focus(); }
    onSearchFocus() { this.state.showAutocomplete = true; }
    onSearchInput(ev) { this.state.searchQuery = ev.target.value; this.state.showAutocomplete = ev.target.value.length > 0; this.state.showSearchPanel = false; }
    onSearchKeydown(ev) {
        if (ev.key === 'Enter' && this.state.searchQuery.trim()) this.applyTextSearch();
        else if (ev.key === 'Backspace' && !this.state.searchQuery && this.state.facets.length > 0) this.removeFacet(this.state.facets[this.state.facets.length-1].id);
        else if (ev.key === 'Escape') { this.state.showAutocomplete = false; this.state.showSearchPanel = false; }
    }
    applyTextSearch() {
        const q = this.state.searchQuery.trim(); if (!q) return;
        this.state.facets.push({ id: ++facetCounter, type: 'search', label: 'Search', display: q, domain: [['__search__', 'ilike', q]] });
        this.state.searchQuery = ''; if (this.searchInputRef.el) this.searchInputRef.el.value = '';
        this.state.showAutocomplete = false; this.state.offset = 0; this.loadRecords();
    }
    applyFieldSearch(field, operator) {
        const q = this.state.searchQuery.trim(); if (!q) return;
        const f = this.state.fields[field];
        this.state.facets.push({ id: ++facetCounter, type: 'filter', label: f?.string || field, display: q, domain: [[field, operator || 'ilike', q]] });
        this.state.searchQuery = ''; if (this.searchInputRef.el) this.searchInputRef.el.value = '';
        this.state.showAutocomplete = false; this.state.offset = 0; this.loadRecords();
    }
    get autocompleteFields() {
        const fields = [];
        for (const [k, f] of Object.entries(this.state.fields)) {
            if (!f.searchable) continue;
            if (f.type === 'char' || f.type === 'text') {
                fields.push({ field: k, label: f.string, operator: 'ilike' });
            } else if (f.type === 'integer' || f.type === 'float') {
                fields.push({ field: k, label: f.string, operator: '=' });
            } else if (f.type === 'many2one') {
                fields.push({ field: k, label: f.string, operator: 'ilike' });
            } else if (f.type === 'selection') {
                fields.push({ field: k, label: f.string, operator: '=' });
            }
        }
        return fields.slice(0, 8);
    }
    removeFacet(id) {
        const facet = this.state.facets.find(f => f.id === id);
        this.state.facets = this.state.facets.filter(f => f.id !== id);
        if (facet?.type === 'groupby') {
            this.state.groupBy = null;
            this.state.groupNodes = [];
        }
        this.state.offset = 0; this.loadRecords();
    }
    toggleFacetNegate(id) {
        const facet = this.state.facets.find(f => f.id === id);
        if (facet) { facet.negated = !facet.negated; this.state.offset = 0; this.loadRecords(); }
    }
    toggleSearchPanel() { this.state.showSearchPanel = !this.state.showSearchPanel; this.state.showAutocomplete = false; }

    // ══ FILTERS ═════════════════════════════════════
    get filterItems() {
        const svd = this.props.searchViewDef;
        if (!svd?.filters?.length) return [];
        const today = new Date().toISOString().slice(0, 10);
        return svd.filters.map(f => {
            let domain = f.domain || [];
            // Dynamic domain functions
            if (f.domain_func === 'getOverdueDomain') domain = [['deadline', '<', today]];
            else if (f.domain_func === 'getInProgressDomain') {
                const stg = this.state.stages.find(s => s.name === 'In Progress');
                domain = [['stage_id', '=', stg?.id || 2]];
            } else if (f.domain_func === 'getDoneDomain') {
                const stg = this.state.stages.find(s => s.name === 'Done');
                domain = [['stage_id', '=', stg?.id || 4]];
            } else if (f.domain_func === 'getThisMonthDomain') {
                const y = new Date().getFullYear(), m = new Date().getMonth();
                const start = new Date(y, m, 1).toISOString().slice(0, 10);
                const end = new Date(y, m + 1, 0).toISOString().slice(0, 10);
                const dateField = f.date_field || 'create_date';
                domain = [[dateField, '>=', start], [dateField, '<=', end]];
            } else if (f.domain_func === 'getLastMonthDomain') {
                const y = new Date().getFullYear(), m = new Date().getMonth() - 1;
                const start = new Date(y, m, 1).toISOString().slice(0, 10);
                const end = new Date(y, m + 1, 0).toISOString().slice(0, 10);
                const dateField = f.date_field || 'create_date';
                domain = [[dateField, '>=', start], [dateField, '<=', end]];
            }
            // Fallback for hardcoded domain lookup
            if (f.id === 'overdue' && domain.length === 0) domain = [['deadline', '<', today]];
            return { id: f.id, label: f.label, domain, separator: f.separator || false };
        });
    }
    isFilterActive(filterId) { return this.state.facets.some(f => f.filterId === filterId); }
    toggleFilter(fi) {
        if (this.isFilterActive(fi.id)) this.state.facets = this.state.facets.filter(f => f.filterId !== fi.id);
        else this.state.facets.push({ id: ++facetCounter, filterId: fi.id, type: 'filter', label: 'Filter', display: fi.label, domain: fi.domain });
        this.state.offset = 0; this.loadRecords();
    }
    get customFilterFields() {
        const svd = this.props.searchViewDef;
        const cfFields = svd?.custom_filter_fields || [];
        if (cfFields.length > 0) return cfFields.map(f => ({ field: f, label: this.state.fields[f]?.string || f }));
        return Object.entries(this.state.fields).filter(([k,f]) => f.searchable).map(([k,f]) => ({field:k, label:f.string}));
    }
    toggleCustomFilter() { this.state.showCustomFilter = !this.state.showCustomFilter; }
    applyCustomFilter() {
        const field = this.cfFieldRef.el?.value;
        let op = this.cfOpRef.el?.value;
        if (op === 'gt') op = '>'; if (op === 'lt') op = '<';
        let val = this.cfValRef.el?.value || '';
        const fMeta = this.state.fields[field];
        if (fMeta?.type === 'float' || fMeta?.type === 'integer') val = parseFloat(val) || 0;
        this.state.facets.push({ id: ++facetCounter, type: 'filter', label: fMeta?.string || field, display: `${op} ${val}`, domain: [[field, op, val]] });
        this.state.showCustomFilter = false; this.state.offset = 0; this.loadRecords();
    }

    // ══ GROUP BY (multi-level nested tree) ═════════════
    get groupByItems() {
        const svd = this.props.searchViewDef;
        if (svd?.group_by?.length > 0) return svd.group_by;
        return Object.entries(this.state.fields).filter(([k,f]) => f.groupable).map(([k,f]) => ({field:k, label:f.string}));
    }
    /** Check if a groupBy field is active */
    isGroupByActive(field) {
        return Array.isArray(this.state.groupBy) && this.state.groupBy.includes(field);
    }
    /** Toggle a groupBy field — adds to stack or removes (multi-level) */
    toggleGroupBy(field) {
        let gb = Array.isArray(this.state.groupBy) ? [...this.state.groupBy] : [];
        const idx = gb.indexOf(field);
        if (idx >= 0) {
            gb.splice(idx, 1); // Remove from stack
        } else {
            gb.push(field); // Add to stack (append = next level)
        }

        // Update facets
        this.state.facets = this.state.facets.filter(f => f.type !== 'groupby');
        if (gb.length > 0) {
            const labels = gb.map(f => {
                const gi = this.groupByItems.find(g => g.field === f);
                return gi?.label || f;
            });
            this.state.facets.push({
                id: ++facetCounter, type: 'groupby', label: 'Group By',
                display: labels.join(' ▸ '), domain: [],
            });
            this.state.groupBy = gb;
        } else {
            this.state.groupBy = null;
        }
        // Reset tree state
        this.state.groupNodes = [];
        this.state.groupRecords = {};
        this.state.collapsedGroups = {};
        this.loadRecords();
    }

    /**
     * Build a flat list of renderable group nodes from the tree.
     * Each node: { key, depth, group, expanded, childrenLoaded, records }
     */
    get flatGroupNodes() {
        return this.state.groupNodes || [];
    }

    /**
     * Load top-level groups when groupBy is active.
     * Called from loadRecords when groupBy is set.
     */
    async _loadGroupTree(domain) {
        const gb = this.state.groupBy;
        if (!gb || gb.length === 0) return;

        const firstField = gb[0];
        const gRes = await RPC.searchRead(this._model, domain, {
            group_by: firstField, order: this.state.orderBy,
        });
        const topGroups = gRes.groups || [];
        this.state.totalCount = gRes.length || 0;

        // Build flat node list for level 0
        const nodes = topGroups.map(g => ({
            key: `L0_${g.id}`,
            depth: 0,
            group: g,
            expanded: false,
            childrenLoaded: false,
            children: [],       // child node keys
            records: [],        // leaf records (only for deepest level)
            parentDomain: domain,
        }));

        this.state.groupNodes = nodes;
        this.state.records = []; // No flat records in grouped mode
    }

    /** Toggle expand/collapse a group node */
    async toggleGroup(nodeKey) {
        const nodes = this.state.groupNodes;
        const idx = nodes.findIndex(n => n.key === nodeKey);
        if (idx < 0) return;

        const node = nodes[idx];
        if (node.expanded) {
            // Collapse: remove all descendants
            node.expanded = false;
            const removeDepth = node.depth;
            let endIdx = idx + 1;
            while (endIdx < nodes.length && nodes[endIdx].depth > removeDepth) endIdx++;
            nodes.splice(idx + 1, endIdx - idx - 1);
            this.state.groupNodes = [...nodes];
            return;
        }

        // Expand
        node.expanded = true;

        const gb = this.state.groupBy;
        const nextLevel = node.depth + 1;
        // Combine: parent inherited domain + this node's own domain condition
        const combinedDomain = [...(node.parentDomain || this.buildDomain()), ...node.group.__domain];

        if (nextLevel < gb.length) {
            // Load next-level sub-groups
            const nextField = gb[nextLevel];
            const gRes = await RPC.searchRead(this._model, combinedDomain, {
                group_by: nextField, order: this.state.orderBy,
            });
            const childGroups = gRes.groups || [];
            const childNodes = childGroups.map(g => ({
                key: `${nodeKey}_L${nextLevel}_${g.id}`,
                depth: nextLevel,
                group: g,
                expanded: false,
                childrenLoaded: false,
                children: [],
                records: [],
                parentDomain: combinedDomain,
            }));
            nodes.splice(idx + 1, 0, ...childNodes);
        } else {
            // Deepest level: load actual records
            if (!node.childrenLoaded) {
                const r = await RPC.searchRead(this._model, combinedDomain, {
                    order: this.state.orderBy, limit: 200,
                });
                node.records = r.records || [];
                node.childrenLoaded = true;
            }
        }

        this.state.groupNodes = [...nodes];
    }

    /** Get the records for a leaf group node */
    getGroupRecords(nodeKey) {
        const node = this.state.groupNodes.find(n => n.key === nodeKey);
        return node?.records || [];
    }

    /** Check if a group node is expanded */
    isGroupExpanded(nodeKey) {
        const node = this.state.groupNodes.find(n => n.key === nodeKey);
        return node?.expanded || false;
    }

    /** Check if a node is a leaf (deepest level = show records) */
    isLeafGroup(nodeKey) {
        const node = this.state.groupNodes.find(n => n.key === nodeKey);
        if (!node) return false;
        const gb = this.state.groupBy;
        return node.depth >= gb.length - 1;
    }

    /** Format aggregate value for display in group header */
    formatGroupAggregate(field, value) {
        const fd = this.state.fields[field];
        if (!fd) return String(value);
        if (fd.widget === 'float_time' || field === 'planned_hours') {
            const h = Math.floor(value);
            const m = Math.round((value - h) * 60);
            return `${h}:${String(m).padStart(2, '0')}`;
        }
        if (fd.type === 'monetary' || fd.widget === 'monetary') {
            const sym = fd.currency_symbol || fd.currencySymbol || '';
            try {
                const formatted = Number(value).toLocaleString('id-ID', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
                return sym ? `${sym} ${formatted}` : formatted;
            } catch (e) {
                return sym ? `${sym} ${Number(value).toFixed(2)}` : Number(value).toFixed(2);
            }
        }
        return typeof value === 'number' ? value.toLocaleString() : String(value);
    }

    /** Get label for aggregate field */
    getAggregateLabel(field) {
        const fd = this.state.fields[field];
        return fd?.string || field.replace(/_/g, ' ');
    }

    // ══ FAVORITES ═══════════════════════════════════
    toggleSaveFav() { this.state.showSaveFav = !this.state.showSaveFav; }
    async saveFavorite() {
        const name = this.favNameRef.el?.value?.trim(); if (!name) return;
        const data = { name, model_name: this._model, domain: this.buildDomain(), group_by: this.state.groupBy ? [this.state.groupBy] : [], is_default: this.favDefaultRef.el?.checked || false, is_shared: this.favSharedRef.el?.checked || false };
        const filter = await RPC.call('/api/filters', data);
        this.state.savedFilters.push(filter); this.state.showSaveFav = false;
    }
    applySavedFilter(sf) {
        this.state.facets = [];
        if (sf.domain?.length > 0) this.state.facets.push({ id: ++facetCounter, type: 'favorite', label: '★', display: sf.name, domain: sf.domain });
        if (sf.group_by?.length > 0) { this.state.groupBy = sf.group_by[0]; this.state.facets.push({ id: ++facetCounter, type: 'groupby', label: 'Group By', display: sf.group_by[0], domain: [] }); }
        else this.state.groupBy = null;
        this.state.showSearchPanel = false; this.state.offset = 0; this.loadRecords();
    }
    async deleteSavedFilter(id) {
        await fetch(`/api/filters/${id}`, { method: 'DELETE', headers: { 'X-CSRF-TOKEN': RPC.csrf, 'Accept': 'application/json' } });
        this.state.savedFilters = this.state.savedFilters.filter(f => f.id !== id);
    }

    // ══ SORTING ═════════════════════════════════════
    setOrder(field) {
        this.state.orderBy = this.state.orderBy.startsWith(field) ? (this.state.orderBy.endsWith('asc') ? `${field} desc` : `${field} asc`) : `${field} asc`;
        this.loadRecords();
    }

    // ══ SELECTION ═══════════════════════════════════
    get allSelected() { return this.state.records.length > 0 && this.state.selectedIds.length === this.state.records.length; }
    isSelected(id) { return this.state.selectedIds.includes(id); }
    toggleSelect(id) { const i = this.state.selectedIds.indexOf(id); if (i >= 0) this.state.selectedIds.splice(i,1); else this.state.selectedIds.push(id); }
    toggleSelectAll() { this.state.selectedIds = this.allSelected ? [] : this.state.records.map(r => r.id); }
    clearSelection() { this.state.selectedIds = []; }
    async deleteSelected() {
        if (!confirm(`Delete ${this.state.selectedIds.length} record(s)?`)) return;
        try { await RPC.unlink(this._model, this.state.selectedIds); this.state.selectedIds = []; this.loadRecords(); }
        catch(e) { alert('Error: ' + (e.message || e)); }
    }

    // ══ NEW / ROW CLICK ═════════════════════════════
    async onNewTask() {
        if (this.props.onOpenRecord) { this.props.onOpenRecord(null, 1, 1); return; }
        const name = prompt('Record name:'); if (!name) return;
        const res = await RPC.create(this._model, { name, project_id: this.state.projects[0]?.id || 1, stage_id: this.state.stages[0]?.id || 1 });
        if (res.id && this.props.onOpenRecord) this.props.onOpenRecord(res.id, 1, 1);
        else this.loadRecords();
    }
    onRowClick(rec) {
        if (this.listEditable) return; // In editable mode, don't navigate on single click
        if (this.props.onOpenRecord) {
            const allIds = this.state.records.map(r => r.id);
            this.props.onOpenRecord(rec.id, allIds.indexOf(rec.id)+1, this.state.totalCount);
        }
    }
}

window.ListView = ListView;
})();
