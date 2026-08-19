// ══════════════════════════════════════════════════════════════════
//  KanbanView — Odoo-style kanban board with drag-and-drop
//  Features: grouped columns, card template, quick_create, progress,
//  color_field, card_image, fold, decoration, aggregates, load more
// ══════════════════════════════════════════════════════════════════
(function () {
const { Component, useState, onWillStart, onMounted, xml, useRef } = owl;
const RPC = window.LarasoftRPC;
const icons = window.LarasoftIcons;

function esc(v) { return v == null ? '' : String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── Color palette for color_field / kanban_color widget ─────────
const KANBAN_COLORS = {
    0: '#ef4444', 1: '#f97316', 2: '#f59e0b', 3: '#10b981',
    4: '#06b6d4', 5: '#3b82f6', 6: '#8b5cf6', 7: '#ec4899',
    8: '#6366f1', 9: '#84cc16',
    red: '#ef4444', orange: '#f97316', yellow: '#f59e0b',
    green: '#10b981', blue: '#3b82f6', purple: '#8b5cf6',
    pink: '#ec4899', teal: '#06b6d4', lime: '#84cc16',
};

function getKanbanColor(val) {
    if (val == null || val === false) return null;
    if (typeof val === 'number' || /^\d+$/.test(String(val))) {
        return KANBAN_COLORS[Number(val)] || KANBAN_COLORS[Number(val) % 10];
    }
    return KANBAN_COLORS[String(val).toLowerCase()] || null;
}

class KanbanView extends Component {
    static template = xml`
<div class="ls-kanban-view">
    <div class="ls-control-panel">
        <div class="ls-cp-top">
            <div class="ls-breadcrumb">
                <span class="ls-breadcrumb-item" t-esc="props.actionTitle || 'Records'"/>
            </div>
            <div class="ls-searchbar-row"></div>
        </div>
        <div class="ls-cp-bottom">
            <div class="ls-cp-action-buttons">
                <t t-if="state.hasAggregate">
                    <button class="ls-btn ls-btn-sm" t-on-click="() => this.toggleAggregates()">
                        <t t-out="icons.get('bar-chart-2', 14)"/> Aggregates
                    </button>
                </t>
            </div>
            <div class="ls-cp-pager-switchers">
                <div class="ls-view-switcher" t-if="props.viewModes and props.viewModes.length > 1">
                    <t t-foreach="props.viewModes" t-as="vm" t-key="vm.type">
                        <button t-att-class="'ls-btn-icon' + (props.activeViewType === vm.type ? ' active' : '')"
                                t-on-click="() => props.onSwitchView(vm.type)"
                                t-att-title="vm.label">
                            <t t-out="vm.icon"/>
                        </button>
                    </t>
                </div>
            </div>
        </div>
    </div>
    <t t-if="state.loading">
        <div class="ls-loading"><div class="ls-spinner"/> Loading Kanban...</div>
    </t>
    <t t-else="">
        <div class="ls-kanban-board">
            <t t-foreach="state.columns" t-as="col" t-key="col.id">
                <div class="ls-kanban-column"
                     t-att-class="col.folded ? 'ls-kanban-column-folded' : ''"
                     t-att-data-column-id="col.id"
                     t-on-dragover="onDragOver"
                     t-on-drop="(ev) => this.onDrop(ev, col)">

                    <div class="ls-kanban-column-header">
                        <div class="ls-kanban-column-title">
                            <t t-if="col.folded">
                                <button class="ls-kanban-col-fold-btn" t-on-click="() => this.toggleFold(col)"
                                        title="Unfold">
                                    <t t-out="icons.get('chevron-right', 14)"/>
                                </button>
                            </t>
                            <t t-else="">
                                <button class="ls-kanban-col-fold-btn" t-on-click="() => this.toggleFold(col)"
                                        title="Fold">
                                    <t t-out="icons.get('chevron-down', 14)"/>
                                </button>
                            </t>
                            <span class="ls-kanban-col-name" t-esc="col.name"/>
                            <span class="ls-kanban-col-count" t-esc="col.records.length"/>
                            <t t-if="state.showAggregates and col.aggregates">
                                <span class="ls-kanban-col-aggregates">
                                    <t t-foreach="getAggregateDisplay(col)" t-as="agg" t-key="agg.label">
                                        <span class="ls-kanban-agg-item" t-esc="agg.display"/>
                                    </t>
                                </span>
                            </t>
                        </div>
                        <t t-if="!col.folded and state.viewDef.quick_create !== false">
                            <button class="ls-kanban-col-add" t-on-click="() => this.toggleQuickCreate(col.id)"
                                    title="Quick Create">+</button>
                        </t>
                    </div>

                    <t t-if="col.folded">
                        <div class="ls-kanban-column-collapsed">
                            <span class="ls-kanban-collapsed-count" t-esc="col.records.length"/>
                        </div>
                    </t>

                    <t t-if="!col.folded">
                        <t t-if="state.quickCreateCol === col.id">
                            <div class="ls-kanban-quick-create">
                                <input class="ls-kanban-qc-input" type="text"
                                       placeholder="Title..."
                                       t-on-keydown="(ev) => this.onQuickCreateKeydown(ev, col)"
                                       t-ref="'qcInput'"/>
                                <div class="ls-kanban-qc-actions">
                                    <button class="ls-btn ls-btn-primary ls-btn-sm" t-on-click="() => this.submitQuickCreate(col)">Add</button>
                                    <button class="ls-btn ls-btn-sm" t-on-click="() => this.state.quickCreateCol = null">Discard</button>
                                </div>
                            </div>
                        </t>

                        <div class="ls-kanban-cards">
                            <t t-foreach="col.records" t-as="rec" t-key="rec.id">
                                <div class="ls-kanban-card"
                                     t-att-class="getCardClasses(rec)"
                                     t-att-style="getCardStyle(rec)"
                                     draggable="true"
                                     t-att-data-record-id="rec.id"
                                     t-on-dragstart="(ev) => this.onDragStart(ev, rec)"
                                     t-on-click="() => this.onCardClick(rec)"
                                     t-on-contextmenu="(ev) => this.onCardContextMenu(ev, rec)">

                                    <t t-if="getCardImage(rec)">
                                        <div class="ls-kanban-card-cover">
                                            <img t-att-src="getCardImage(rec)" alt="" class="ls-kanban-card-img"/>
                                        </div>
                                    </t>

                                    <div class="ls-kanban-card-header">
                                        <span class="ls-kanban-card-title" t-esc="rec[state.viewDef.card_title || 'name'] || 'Untitled'"/>
                                        <t t-if="getPriorityValue(rec) > 0">
                                            <span class="ls-kanban-card-priority" t-att-data-level="getPriorityValue(rec)">
                                                <t t-foreach="getPriorityStars(rec)" t-as="s" t-key="s">&#9733;</t>
                                            </span>
                                        </t>
                                    </div>

                                    <div class="ls-kanban-card-body">
                                        <t t-foreach="getCardFields()" t-as="cf" t-key="cf">
                                            <t t-if="rec[cf] !== undefined and rec[cf] !== '' and rec[cf] !== false and rec[cf] !== 0">
                                                <div class="ls-kanban-card-field" t-out="renderCardField(rec, cf)"/>
                                            </t>
                                        </t>
                                    </div>

                                    <t t-if="getCardTags(rec).length > 0">
                                        <div class="ls-kanban-card-tags">
                                            <t t-foreach="getCardTags(rec)" t-as="tag" t-key="tag.id">
                                                <span class="ls-kanban-tag" t-att-style="'color:' + (tag.color || '#7c3aed') + ';background:' + (tag.color || '#7c3aed') + '15;border:1px solid ' + (tag.color || '#7c3aed') + '30'"
                                                      t-esc="tag.name"/>
                                            </t>
                                        </div>
                                    </t>

                                    <div class="ls-kanban-card-footer">
                                        <t t-foreach="getCardFooterFields()" t-as="ff" t-key="ff">
                                            <t t-if="isProgressField(ff)">
                                                <t t-if="hasProgress(rec)">
                                                    <div class="ls-kanban-progress">
                                                        <div class="ls-kanban-progress-track">
                                                            <div class="ls-kanban-progress-fill" t-att-style="getProgressStyle(rec)"/>
                                                        </div>
                                                        <span class="ls-kanban-progress-text" t-esc="getProgressValue(rec) + '%'"/>
                                                    </div>
                                                </t>
                                            </t>
                                            <t t-elif="isAvatarField(ff)">
                                                <t t-if="getAssigneeAvatar(rec)">
                                                    <div class="ls-kanban-avatar" t-att-style="getAvatarStyle(rec)" t-att-title="getAssigneeAvatar(rec)"
                                                         t-esc="getAssigneeAvatar(rec)[0].toUpperCase()"/>
                                                </t>
                                            </t>
                                            <t t-elif="ff === 'priority'">
                                                <!-- Priority already in header -->
                                            </t>
                                            <t t-else="">
                                                <t t-if="rec[ff] !== undefined and rec[ff] !== '' and rec[ff] !== false">
                                                    <div class="ls-kanban-card-footer-field" t-out="renderCardField(rec, ff)"/>
                                                </t>
                                            </t>
                                        </t>
                                    </div>
                                </div>
                            </t>

                            <t t-if="col.hasMore">
                                <button class="ls-kanban-load-more" t-on-click="() => this.loadMore(col)">
                                    Load more...
                                </button>
                            </t>
                        </div>
                    </t>
                </div>
            </t>
        </div>

        <!-- Context Menu -->
        <t t-if="state.contextMenu.visible">
            <div class="ls-kanban-context-menu"
                 t-att-style="'left:' + state.contextMenu.x + 'px;top:' + state.contextMenu.y + 'px'"
                 t-on-click="() => this.closeContextMenu()">
                <div class="ls-kanban-ctx-item" t-on-click="() => this.onCtxOpen()">
                    <t t-out="icons.get('external-link', 14)"/> Open
                </div>
                <div class="ls-kanban-ctx-item" t-on-click="() => this.onCtxDuplicate()">
                    <t t-out="icons.get('copy', 14)"/> Duplicate
                </div>
                <div class="ls-kanban-ctx-divider"/>
                <div class="ls-kanban-ctx-item ls-kanban-ctx-danger" t-on-click="() => this.onCtxDelete()">
                    <t t-out="icons.get('trash-2', 14)"/> Delete
                </div>
            </div>
        </t>
    </t>
</div>
    `;

    static props = {
        model: { type: String },
        kanbanViewDef: { type: Object, optional: true },
        searchViewDef: { type: Object, optional: true },
        onOpenRecord: { type: Function, optional: true },
        domain: { type: Array, optional: true },
        actionDomain: { type: Array, optional: true },
        actionContext: { type: Object, optional: true },
        actionTitle: { type: String, optional: true },
        viewModes: { type: Array, optional: true },
        activeViewType: { type: String, optional: true },
        onSwitchView: { type: Function, optional: true },
    };

    setup() {
        this._model = this.props.model || 'task';
        this.icons = window.LarasoftIcons;
        this.state = useState({
            loading: true,
            columns: [],
            viewDef: this.props.kanbanViewDef || {},
            fields: {},
            quickCreateCol: null,
            dragRecordId: null,
            showAggregates: true,
            hasAggregate: false,
            contextMenu: { visible: false, x: 0, y: 0, record: null },
        });

        onWillStart(async () => {
            const fields = await RPC.fieldsGet(this._model);
            this.state.fields = fields;
            await this.loadData();
            this.state.hasAggregate = this.detectAggregates();
        });

        onMounted(() => {
            document.addEventListener('click', this._closeCtxHandler = () => this.closeContextMenu());
        });

        owl.onWillUnmount(() => {
            document.removeEventListener('click', this._closeCtxHandler);
        });
    }

    // ══════════════════════════════════════════════════
    //  Data loading
    // ══════════════════════════════════════════════════

    async loadData() {
        this.state.loading = true;
        const vd = this.state.viewDef;
        const groupByField = vd.default_group_by;
        const domain = this.props.actionDomain || this.props.domain || [];
        const foldFieldNames = vd.fold_field || 'fold';

        if (!groupByField) {
            const res = await RPC.searchRead(this._model, domain, { limit: 200 });
            this.state.columns = [{
                id: '__all__', name: 'All', records: res.records || [],
                folded: false, hasMore: (res.length || 0) > 200, offset: 200,
                aggregates: {},
            }];
        } else {
            const gRes = await RPC.searchRead(this._model, domain, {
                group_by: groupByField, order: 'id desc',
            });
            const groups = gRes.groups || [];

            const columns = [];
            for (const g of groups) {
                const gDomain = [...domain, ...g.__domain];
                const r = await RPC.searchRead(this._model, gDomain, { order: 'id desc', limit: 200 });
                const totalCount = g.__count || 0;

                // Check fold state - for many2one groups, check if the related record has fold=true
                let isFolded = false;
                if (g.id && g.__groupBy) {
                    const foldable = this.getFoldableColumn(g, foldFieldNames);
                    isFolded = foldable;
                }

                columns.push({
                    id: g.id ?? '__none__',
                    name: g.name || 'Undefined',
                    value: g.value,
                    records: r.records || [],
                    sequence: g.sequence || 0,
                    __count: totalCount,
                    __domain: g.__domain,
                    __aggregates: g.__aggregates || {},
                    folded: isFolded,
                    hasMore: totalCount > 200,
                    offset: 200,
                });
            }
            this.state.columns = columns.sort((a, b) => a.sequence - b.sequence);
        }
        this.state.loading = false;
    }

    getFoldableColumn(group, foldFieldNames) {
        // Check if group's related record has fold=true
        // For many2one: the group data might include fold from the related model
        // Simple heuristic: if the column name matches a known folded pattern
        // In practice, fold is set on the Stage model and returned via read_group
        if (group.fold === true || group.fold === 1) return true;
        return false;
    }

    async loadMore(col) {
        const domain = this.props.actionDomain || this.props.domain || [];
        const groupByField = this.state.viewDef.default_group_by;
        let gDomain = [...domain];

        if (groupByField && col.__domain) {
            gDomain = [...domain, ...col.__domain];
        }

        const r = await RPC.searchRead(this._model, gDomain, {
            order: 'id desc', limit: 200, offset: col.offset,
        });

        col.records = [...col.records, ...(r.records || [])];
        col.offset += 200;
        col.hasMore = col.records.length < col.__count;
    }

    // ══════════════════════════════════════════════════
    //  Aggregates
    // ══════════════════════════════════════════════════

    detectAggregates() {
        const vd = this.state.viewDef;
        return !!(vd.aggregates && Object.keys(vd.aggregates).length > 0);
    }

    toggleAggregates() {
        this.state.showAggregates = !this.state.showAggregates;
    }

    getAggregateDisplay(col) {
        const vd = this.state.viewDef;
        const aggs = vd.aggregates || {};
        const result = [];
        for (const [field, config] of Object.entries(aggs)) {
            if (col.__aggregates && col.__aggregates[field] !== undefined) {
                const val = col.__aggregates[field];
                const label = config.label || field;
                const display = typeof val === 'number' ? val.toFixed(config.decimals || 0) : val;
                result.push({ label, display: `${display} ${label}` });
            }
        }
        return result;
    }

    // ══════════════════════════════════════════════════
    //  Card rendering
    // ══════════════════════════════════════════════════

    getCardFields() {
        return this.state.viewDef.card_fields || [];
    }

    getCardFooterFields() {
        return this.state.viewDef.card_footer || ['priority', 'assignee'];
    }

    isProgressField(fieldName) {
        const pb = this.state.viewDef.progress_bar;
        return pb && pb.field === fieldName;
    }

    isAvatarField(fieldName) {
        // An avatar field is a many2one in card_footer
        const fDef = this.state.fields[fieldName];
        return fDef && fDef.type === 'many2one';
    }

    getCardImage(rec) {
        const imgField = this.state.viewDef.card_image;
        if (!imgField) return null;
        const val = rec[imgField];
        if (!val) return null;
        // If it's a binary field, construct data URL
        const fDef = this.state.fields[imgField];
        if (fDef && (fDef.type === 'binary' || fDef.type === 'image')) {
            if (typeof val === 'string' && val.startsWith('data:')) return val;
            if (typeof val === 'string' && val.length > 100) {
                return 'data:image/png;base64,' + val;
            }
            // It might be a URL
            if (typeof val === 'string' && (val.startsWith('http') || val.startsWith('/'))) return val;
        }
        return null;
    }

    getCardTags(rec) {
        const tagField = this.state.viewDef.card_tags;
        if (!tagField || !rec[tagField]) return [];
        return Array.isArray(rec[tagField]) ? rec[tagField] : [];
    }

    renderCardField(rec, fieldName) {
        const fDef = this.state.fields[fieldName];
        if (!fDef) return owl.markup(`<span>${esc(rec[fieldName] ?? '')}</span>`);
        const value = rec[fieldName];

        if (fDef.type === 'many2one' && Array.isArray(value)) {
            return owl.markup(`<span class="ls-kanban-field-m2o">${esc(value[1] || '')}</span>`);
        }
        if (fDef.widget === 'progressbar' || this.isProgressField(fieldName)) {
            return owl.markup('');
        }
        if (fDef.type === 'date' && value) {
            const diff = Math.ceil((new Date(value) - new Date()) / 86400000);
            const cls = diff < 0 ? 'overdue' : diff <= 3 ? 'soon' : 'ok';
            const label = diff < 0 ? `${Math.abs(diff)}d overdue` : diff === 0 ? 'Today' : `In ${diff}d`;
            return owl.markup(`<span class="ls-kanban-date ls-date-${cls}">${label}</span>`);
        }
        if (fDef.type === 'float' || fDef.type === 'integer') {
            return owl.markup(`<span class="ls-kanban-field-num">${Number(value || 0).toFixed(fDef.type === 'float' ? 1 : 0)}${fieldName.includes('hour') ? 'h' : ''}</span>`);
        }
        if (fDef.type === 'monetary') {
            return owl.markup(`<span class="ls-kanban-field-num">${Number(value || 0).toLocaleString()}</span>`);
        }
        if (fDef.type === 'selection' && fDef.selection) {
            const label = fDef.selection.find(s => s[0] === value);
            return owl.markup(`<span class="ls-kanban-field-selection">${esc(label ? label[1] : value)}</span>`);
        }
        return owl.markup(`<span>${esc(value ?? '')}</span>`);
    }

    // ── Color field ──────────────────────────────────

    getCardColorStyle(rec) {
        const colorField = this.state.viewDef.color_field;
        if (!colorField) return '';
        const val = rec[colorField] || rec[colorField + '_color'];
        const color = getKanbanColor(val);
        if (!color) return '';
        return `border-left: 3px solid ${color};`;
    }

    getCardStyle(rec) {
        return this.getCardColorStyle(rec);
    }

    // ── Decoration (conditional card classes) ──────────

    getCardClasses(rec) {
        const decorations = this.state.viewDef.decoration || {};
        let classes = [];
        for (const [cls, condition] of Object.entries(decorations)) {
            if (this.evaluateCondition(rec, condition)) {
                classes.push('ls-kanban-' + cls);
            }
        }
        return classes.join(' ');
    }

    evaluateCondition(rec, condition) {
        // Simple condition evaluator: supports "field == 'value'", "field != 'value'",
        // "field in ['a','b']", "field > N", "field < N"
        if (!condition || typeof condition !== 'string') return false;
        try {
            // Handle simple comparisons
            const m = condition.match(/^(\w+)\s*(==|!=|>=|<=|>|<|in|not in)\s*(.+)$/);
            if (!m) return false;
            const [, field, op, rawVal] = m;
            const recVal = rec[field];
            let cmpVal = rawVal.trim();
            // Parse the comparison value
            if (cmpVal.startsWith("'") && cmpVal.endsWith("'")) {
                cmpVal = cmpVal.slice(1, -1);
            } else if (cmpVal.startsWith('"') && cmpVal.endsWith('"')) {
                cmpVal = cmpVal.slice(1, -1);
            } else if (cmpVal === 'true' || cmpVal === '1') {
                cmpVal = true;
            } else if (cmpVal === 'false' || cmpVal === '0') {
                cmpVal = false;
            } else if (!isNaN(cmpVal)) {
                cmpVal = Number(cmpVal);
            }
            // Handle 'in' operator
            if (op === 'in' || op === 'not in') {
                const inMatch = rawVal.match(/\[(.+)\]/);
                if (inMatch) {
                    const items = inMatch[1].split(',').map(s => {
                        s = s.trim();
                        if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
                            return s.slice(1, -1);
                        }
                        return s;
                    });
                    const result = items.includes(String(recVal));
                    return op === 'in' ? result : !result;
                }
            }
            switch (op) {
                case '==': return recVal == cmpVal;
                case '!=': return recVal != cmpVal;
                case '>':  return Number(recVal) > Number(cmpVal);
                case '<':  return Number(recVal) < Number(cmpVal);
                case '>=': return Number(recVal) >= Number(cmpVal);
                case '<=': return Number(recVal) <= Number(cmpVal);
            }
        } catch (e) { /* ignore */ }
        return false;
    }

    // ── Priority ─────────────────────────────────────

    getPriorityValue(rec) {
        const footer = this.state.viewDef.card_footer || [];
        if (footer.includes('priority')) return Number(rec.priority || 0);
        return 0;
    }

    getPriorityStars(rec) {
        const v = this.getPriorityValue(rec);
        return Array.from({ length: v }, (_, i) => i);
    }

    // ── Progress ─────────────────────────────────────

    hasProgress(rec) {
        const pb = this.state.viewDef.progress_bar;
        return pb && rec[pb.field] !== undefined;
    }

    getProgressValue(rec) {
        const pb = this.state.viewDef.progress_bar;
        return pb ? Math.min(Math.round(Number(rec[pb.field]) || 0), 100) : 0;
    }

    getProgressStyle(rec) {
        const p = this.getProgressValue(rec);
        const pb = this.state.viewDef.progress_bar;
        const colors = pb?.colors || {};
        let bg;
        if (colors.high && p >= 80) bg = colors.high;
        else if (colors.medium && p >= 40) bg = colors.medium;
        else if (colors.low) bg = colors.low;
        else bg = p >= 100 ? '#10b981' : p >= 50 ? '#f59e0b' : '#3b82f6';
        return `width:${p}%;background:${bg}`;
    }

    // ── Assignee avatar ──────────────────────────────

    getAssigneeAvatar(rec) {
        const footer = this.state.viewDef.card_footer || [];
        for (const f of footer) {
            const fDef = this.state.fields[f];
            if (fDef && fDef.type === 'many2one' && Array.isArray(rec[f])) return rec[f][1];
        }
        return null;
    }

    getAvatarStyle(rec) {
        const name = this.getAssigneeAvatar(rec) || '?';
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        const h = Math.abs(hash) % 360;
        return `background:hsl(${h},60%,50%)`;
    }

    // ══════════════════════════════════════════════════
    //  Column fold/unfold
    // ══════════════════════════════════════════════════

    toggleFold(col) {
        col.folded = !col.folded;
    }

    // ══════════════════════════════════════════════════
    //  Drag and Drop
    // ══════════════════════════════════════════════════

    onDragStart(ev, rec) {
        this.state.dragRecordId = rec.id;
        ev.dataTransfer.effectAllowed = 'move';
        ev.dataTransfer.setData('text/plain', String(rec.id));
        ev.target.classList.add('dragging');
    }

    onDragOver(ev) {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'move';
    }

    async onDrop(ev, targetCol) {
        ev.preventDefault();
        const recId = this.state.dragRecordId;
        if (!recId) return;

        // Remove from old column
        let movedRec = null;
        for (const col of this.state.columns) {
            const idx = col.records.findIndex(r => r.id === recId);
            if (idx >= 0) {
                movedRec = col.records.splice(idx, 1)[0];
                break;
            }
        }
        if (!movedRec) return;

        // Update the group-by field value
        const groupByField = this.state.viewDef.default_group_by;
        if (groupByField) {
            const fDef = this.state.fields[groupByField];
            let newValue = targetCol.value;
            if (fDef && fDef.type === 'many2one') {
                newValue = targetCol.id;
            }
            movedRec[groupByField] = fDef?.type === 'many2one'
                ? [targetCol.id, targetCol.name]
                : targetCol.value;

            await RPC.write(this._model, [recId], { [groupByField]: newValue });
        }
        targetCol.records.push(movedRec);
        this.state.dragRecordId = null;
        document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    }

    // ══════════════════════════════════════════════════
    //  Quick Create
    // ══════════════════════════════════════════════════

    toggleQuickCreate(colId) {
        this.state.quickCreateCol = this.state.quickCreateCol === colId ? null : colId;
    }

    onQuickCreateKeydown(ev, col) {
        if (ev.key === 'Enter') this.submitQuickCreate(col);
        if (ev.key === 'Escape') this.state.quickCreateCol = null;
    }

    async submitQuickCreate(col) {
        const input = document.querySelector('.ls-kanban-qc-input');
        const name = input?.value?.trim();
        if (!name) return;

        const groupByField = this.state.viewDef.default_group_by;
        const values = { name };
        if (groupByField) {
            const fDef = this.state.fields[groupByField];
            values[groupByField] = fDef?.type === 'many2one' ? col.id : col.value;
        }
        // Set required defaults
        const fDefs = this.state.fields;
        for (const [fn, fd] of Object.entries(fDefs)) {
            if (fd.required && !values[fn] && fd.default !== undefined) {
                values[fn] = fd.default;
            }
        }

        try {
            const res = await RPC.create(this._model, values);
            if (res.record) {
                col.records.unshift(res.record);
                col.__count = (col.__count || 0) + 1;
            }
            input.value = '';
        } catch (e) {
            alert('Error: ' + e.message);
        }
    }

    // ══════════════════════════════════════════════════
    //  Context Menu
    // ══════════════════════════════════════════════════

    onCardContextMenu(ev, rec) {
        ev.preventDefault();
        ev.stopPropagation();
        this.state.contextMenu = { visible: true, x: ev.clientX, y: ev.clientY, record: rec };
    }

    closeContextMenu() {
        if (this.state.contextMenu.visible) {
            this.state.contextMenu = { visible: false, x: 0, y: 0, record: null };
        }
    }

    onCtxOpen() {
        const rec = this.state.contextMenu.record;
        this.closeContextMenu();
        if (rec) this.onCardClick(rec);
    }

    async onCtxDuplicate() {
        const rec = this.state.contextMenu.record;
        this.closeContextMenu();
        if (!rec) return;
        try {
            const values = { name: (rec.name || 'Untitled') + ' (copy)' };
            const groupByField = this.state.viewDef.default_group_by;
            if (groupByField && rec[groupByField]) {
                values[groupByField] = rec[groupByField];
            }
            const res = await RPC.create(this._model, values);
            if (res.record) {
                // Add to the same column
                for (const col of this.state.columns) {
                    if (col.records.some(r => r.id === rec.id)) {
                        col.records.push(res.record);
                        break;
                    }
                }
            }
        } catch (e) {
            alert('Duplicate failed: ' + e.message);
        }
    }

    async onCtxDelete() {
        const rec = this.state.contextMenu.record;
        this.closeContextMenu();
        if (!rec) return;
        if (!confirm('Delete "' + (rec.name || 'this record') + '"?')) return;
        try {
            await RPC.unlink(this._model, [rec.id]);
            for (const col of this.state.columns) {
                const idx = col.records.findIndex(r => r.id === rec.id);
                if (idx >= 0) {
                    col.records.splice(idx, 1);
                    break;
                }
            }
        } catch (e) {
            alert('Delete failed: ' + e.message);
        }
    }

    // ══════════════════════════════════════════════════
    //  Card click
    // ══════════════════════════════════════════════════

    onCardClick(rec) {
        if (this.props.onOpenRecord) {
            const allRecords = this.state.columns.flatMap(c => c.records);
            const idx = allRecords.findIndex(r => r.id === rec.id) + 1;
            this.props.onOpenRecord(rec.id, idx, allRecords.length);
        }
    }
}

window.KanbanView = KanbanView;
})();
