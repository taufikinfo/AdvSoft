// ══════════════════════════════════════════════════════════════
//  InlineTreeWidget — OWL Orchestrator
//  Full parity Odoo 17 <list> in form <notebook> <page>
// ══════════════════════════════════════════════════════════════
(function () {
const { Component, xml, useState, onMounted, onPatched, onWillUnmount, useRef } = owl;
const RPC = window.AdvSoftRPC;

class InlineTreeWidget extends Component {
    static template = xml`
<div class="ls-inline-tree" t-att-data-field="props.tabDef.field" t-ref="root">
    <!-- ── Header ── -->
    <div class="ls-it-header" t-if="props.tabDef.string">
        <span class="ls-it-title" t-esc="props.tabDef.string"/>
        <t t-if="state.selection.length > 0">
            <div class="ls-it-bulk-bar">
                <span t-esc="state.selection.length + ' selected'"/>
                <button t-if="hasBulk('delete')" class="ls-it-bulk-danger" t-on-click="bulkDelete">Delete</button>
                <button t-if="hasBulk('duplicate')" t-on-click="bulkDuplicate">Duplicate</button>
                <button t-if="hasBulk('export')" t-on-click="bulkExport">Export CSV</button>
                <button t-on-click="clearSelection">✕ Clear</button>
            </div>
        </t>
        <t t-if="optionalColumns().length">
            <div class="ls-it-optional-toggle">
                <button class="ls-btn ls-btn-sm" t-on-click="toggleOptionalPopover">⚙ Columns</button>
                <div class="ls-it-optional-popover" t-if="state.showOptionalPopover">
                    <t t-foreach="optionalColumns()" t-as="col" t-key="col.name">
                        <label>
                            <input type="checkbox"
                                   t-att-checked="!isColumnHidden(col.name)"
                                   t-on-change="(ev) => this.toggleOptionalColumn(col.name, ev)"/>
                            <span t-esc="col.label"/>
                        </label>
                    </t>
                </div>
            </div>
        </t>
        <t t-if="groupByOptions.length">
            <div class="ls-it-groupby-toggle">
                <select class="ls-it-groupby-select" t-on-change="onGroupByChange">
                    <option value="">— No grouping —</option>
                    <t t-foreach="groupByOptions" t-as="opt" t-key="opt.name">
                        <option t-att-value="opt.name" t-att-selected="state.groupBy === opt.name" t-esc="'Group by: ' + opt.label"/>
                    </t>
                </select>
            </div>
        </t>
    </div>

    <!-- ── Table ── -->
    <div class="ls-it-table-wrap" t-ref="tableWrap">
        <table t-att-class="'ls-it-table' + (props.tabDef.sticky_first ? ' ls-it-sticky-first' : '')">
            <thead class="ls-it-thead">
                <tr>
                    <th class="ls-it-th-check" t-if="state.showSelect &amp;&amp; !props.tabDef.read_only">
                        <input type="checkbox"
                               t-att-checked="state.selection.length === displayLines.length &amp;&amp; displayLines.length > 0"
                               t-on-change="toggleSelectAll"/>
                    </th>
                    <th class="ls-it-th-handle" t-if="hasSequence &amp;&amp; !props.tabDef.read_only" style="width:30px"></th>
                    <t t-foreach="visibleColumns" t-as="col" t-key="col.name">
                        <th t-att-class="thClass(col)"
                            t-att-style="col.width ? 'width:' + col.width : ''"
                            t-att-data-type="col.type"
                            t-on-click="() => this.onSortColumn(col)">
                            <span t-esc="col.label"/>
                            <span t-if="col.required" class="ls-it-th-required">*</span>
                            <span t-if="col.sortable &amp;&amp; state.sortBy &amp;&amp; state.sortBy.field === col.name"
                                  class="ls-it-sort-icon">
                                <t t-if="state.sortBy.dir === 'asc'">▲</t>
                                <t t-else="">▼</t>
                            </span>
                            <span t-if="col.sortable &amp;&amp; (!state.sortBy || state.sortBy.field !== col.name)"
                                  class="ls-it-sort-icon ls-it-sort-inactive">⇅</span>
                            <span class="ls-it-th-resize" t-on-mousedown.stop="(ev) => this.startResize(col, ev)"></span>
                        </th>
                    </t>
                    <th class="ls-it-th-status" t-if="!props.tabDef.read_only" style="width:18px"></th>
                    <t t-if="rowButtons.length">
                        <th t-foreach="rowButtons" t-as="btn" t-key="btn.name" class="ls-it-th-rowbtn">
                            <span t-esc="btn.string || btn.name"/>
                        </th>
                    </t>
                    <th class="ls-it-th-actions" t-if="canDelete &amp;&amp; !props.tabDef.read_only" style="width:42px"></th>
                </tr>
            </thead>
            <tbody>
                <!-- ═══ GROUPED MODE ═══ -->
                <t t-if="isGrouped">
                    <t t-foreach="state.groups" t-as="group" t-key="'g_' + group.id">
                        <!-- Group Header Row -->
                        <tr t-att-class="'o_group_header' + (group.isFolded ? ' o_group_folded' : ' o_group_open')"
                            t-on-click="() => this.onGroupHeaderClick(group)">
                            <td t-att-colspan="totalColspan" class="o_group_header_cell">
                                <div class="o_group_header_inner">
                                    <span class="o_group_toggle">
                                        <t t-if="group.isFolded">►</t>
                                        <t t-else="">▼</t>
                                    </span>
                                    <span class="o_group_name" t-esc="group.name || 'Undefined'"/>
                                    <span class="o_group_count" t-esc="group.__count + ' item' + (group.__count !== 1 ? 's' : '')"/>
                                    <t t-foreach="groupAggregateColumns" t-as="ac" t-key="'ga_' + ac.name">
                                        <span class="o_group_aggregate">
                                            <span class="o_group_agg_value" t-esc="formatGroupAggregate(group, ac)"/>
                                        </span>
                                    </t>
                                </div>
                            </td>
                        </tr>
                        <!-- Group Data Rows (when expanded) -->
                        <t t-if="!group.isFolded">
                            <t t-if="state.groupLoading[group.id || group.value]">
                                <tr class="o_group_loading_row">
                                    <td t-att-colspan="totalColspan" class="ls-it-empty">
                                        <span class="ls-it-spinner"></span> Loading...
                                    </td>
                                </tr>
                            </t>
                            <t t-else="">
                                <t t-foreach="group.records || []" t-as="line" t-key="line.id || line.__temp_id">
                                    <InlineTreeRow
                                        line="line"
                                        index="line_index"
                                        columns="visibleColumns"
                                        state="state"
                                        canDelete="canDelete &amp;&amp; !props.tabDef.read_only"
                                        hasSequence="hasSequence &amp;&amp; !props.tabDef.read_only"
                                        rowButtons="rowButtons"
                                        decorators="props.tabDef.decoration || {}"
                                        onLineUpdate="(l, f, v) => this.onLineUpdate(l, f, v)"
                                        onLineDelete="(l) => this.deleteLine(l)"
                                        onRowClick="(l, ev) => this.onRowClick(l, ev)"
                                        onRowContext="(l, ev) => this.onRowContext(l, ev)"
                                        onDragStart="(l, i, ev) => this.onDragStart(l, i, ev)"
                                        onDragEnd="(l, i, ev) => this.onDragEnd(l, i, ev)"
                                        onCellClick="(l, c, ev) => this.onCellClick(l, c, ev)"
                                        onButtonClick="(l, btn, ev) => this.onRowButtonClick(l, btn, ev)"
                                        onTabOut="(l, i) => this.onTabOutRow(l, i)"
                                        onTabIn="(l, i) => this.onTabInRow(l, i)"/>
                                </t>
                                <!-- Folded hint for groups with more records than loaded -->
                                <t t-if="group.__count > (group.records || []).length">
                                    <tr class="o_group_more_row" t-on-click="() => this.loadMoreInGroup(group)">
                                        <td t-att-colspan="totalColspan" class="o_group_more_cell">
                                            ... <t t-esc="group.__count - (group.records || []).length"/> more rows
                                        </td>
                                    </tr>
                                </t>
                                <!-- Group Aggregate Footer -->
                                <t t-if="groupAggregateColumns.length &amp;&amp; (group.records || []).length">
                                    <tr class="o_group_footer">
                                        <td t-if="state.showSelect &amp;&amp; !props.tabDef.read_only"></td>
                                        <td t-if="hasSequence &amp;&amp; !props.tabDef.read_only"></td>
                                        <t t-foreach="visibleColumns" t-as="col" t-key="'gf_' + col.name">
                                            <td t-att-class="'o_group_footer_cell' + (['float','integer','monetary'].includes(col.type) ? ' ls-it-num' : '')">
                                                <t t-if="col.aggregation">
                                                    <span class="o_group_agg_label" t-esc="'∑'"/>
                                                    <span class="o_group_agg_val" t-esc="computeGroupFooterAgg(group, col)"/>
                                                </t>
                                            </td>
                                        </t>
                                        <td t-if="!props.tabDef.read_only"></td>
                                        <t t-if="rowButtons.length"><td t-foreach="rowButtons" t-as="btn" t-key="'gfb_'+btn.name"/></t>
                                        <td t-if="canDelete &amp;&amp; !props.tabDef.read_only"></td>
                                    </tr>
                                </t>
                            </t>
                        </t>
                    </t>
                </t>

                <!-- ═══ FLAT MODE (no grouping) ═══ -->
                <t t-if="!isGrouped">
                    <t t-foreach="displayLines" t-as="line" t-key="line.id || line.__temp_id">
                        <InlineTreeRow
                            line="line"
                            index="line_index"
                            columns="visibleColumns"
                            state="state"
                            canDelete="canDelete &amp;&amp; !props.tabDef.read_only"
                            hasSequence="hasSequence &amp;&amp; !props.tabDef.read_only"
                            rowButtons="rowButtons"
                            decorators="props.tabDef.decoration || {}"
                            onLineUpdate="(l, f, v) => this.onLineUpdate(l, f, v)"
                            onLineDelete="(l) => this.deleteLine(l)"
                            onRowClick="(l, ev) => this.onRowClick(l, ev)"
                            onRowContext="(l, ev) => this.onRowContext(l, ev)"
                            onDragStart="(l, i, ev) => this.onDragStart(l, i, ev)"
                            onDragEnd="(l, i, ev) => this.onDragEnd(l, i, ev)"
                            onCellClick="(l, c, ev) => this.onCellClick(l, c, ev)"
                            onButtonClick="(l, btn, ev) => this.onRowButtonClick(l, btn, ev)"
                            onTabOut="(l, i) => this.onTabOutRow(l, i)"
                            onTabIn="(l, i) => this.onTabInRow(l, i)"/>
                    </t>
                    <tr t-if="displayLines.length === 0">
                        <td t-att-colspan="totalColspan" class="ls-it-empty">
                            No records yet.
                        </td>
                    </tr>
                </t>
            </tbody>
            <tfoot class="ls-it-tfoot" t-if="hasAggregates">
                <tr class="ls-it-footer">
                    <td t-if="state.showSelect"></td>
                    <td t-if="hasSequence"></td>
                    <t t-foreach="visibleColumns" t-as="col" t-key="'foot_' + col.name">
                        <td class="ls-it-td-agg" t-att-data-field="col.name">
                            <t t-if="col.aggregation">
                                <span class="ls-it-agg-label" t-esc="col.aggregation.label"/>
                                <span class="ls-it-agg-value" t-esc="computeAggregate(col)"/>
                            </t>
                        </td>
                    </t>
                    <td t-if="!props.tabDef.read_only" class="ls-it-td-status"/>
                    <t t-if="rowButtons.length">
                        <td t-foreach="rowButtons" t-as="btn" t-key="'foot_' + btn.name" class="ls-it-td-rowbtn"/>
                    </t>
                    <td t-if="canDelete &amp;&amp; !props.tabDef.read_only" class="ls-it-td-actions"/>
                </tr>
            </tfoot>
        </table>
    </div>

    <!-- ── Add line + info ── -->
    <div class="ls-it-controls" t-if="!state.readOnly">
        <div style="display:flex; gap:8px; align-items:center;">
            <button class="ls-it-add-line" t-if="canCreate" t-on-click="addLine">
                <span class="ls-it-add-icon">+</span> Add a line
            </button>
            <button class="ls-it-add-line" t-if="props.tabDef.add_from_list &amp;&amp; !isMany2Many" t-on-click="openAddFromList">
                <span class="ls-it-add-icon">⊕</span> Add from list
            </button>
        </div>
        <div class="ls-it-info">
            <span class="ls-it-count" t-esc="state.lines.length + ' record(s)'"/>
            <t t-if="hasMore()">
                <span class="ls-it-pager">
                    <button t-on-click="loadMore" t-att-disabled="state.loadingMore">
                        <t t-if="state.loadingMore">
                            <span class="ls-it-spinner"></span>Loading...
                        </t>
                        <t t-else="">Load more</t>
                    </button>
                </span>
            </t>
        </div>
    </div>

    <!-- ── Sum footer ── -->
    <div class="ls-it-sum-footer" t-if="props.tabDef.sum_field">
        <span class="ls-it-sum-label" t-esc="props.tabDef.sum_label || 'Total'"/>:
        <span class="ls-it-sum-value" t-esc="computeSumField()"/>
    </div>

    <!-- ── Add-from-list picker dialog ── -->
    <t t-if="state.showPicker">
        <AddFromListDialog
            picker="state.showPicker"
            onClose="() => this.state.showPicker = null"
            onConfirm="(records) => this.onPickerConfirm(records)"/>
    </t>

    <!-- ── Form View Dialog ── -->
    <t t-if="state.showFormDialog">
        <FormViewDialog
            model="state.showFormDialog.model"
            resId="state.showFormDialog.resId"
            title="state.showFormDialog.title"
            onClose="() => this.state.showFormDialog = null"
            onSaved="(rec) => this.onDialogSaved(rec)"/>
    </t>
</div>`;

    static get components() { 
        return { 
            InlineTreeRow: window.InlineTreeRow, 
            AddFromListDialog: window.AddFromListDialog, 
            FormViewDialog: window.FormViewDialog 
        }; 
    }

    static props = {
        tabDef: { type: Object },
        lines: { type: Array },
        parentRecord: { type: Object },
        parentModel: { type: String },
        relOptions: { type: Object, optional: true },
        onLineAdd: { type: Function },
        onLineUpdate: { type: Function },
        onLineDelete: { type: Function },
        onLineBatchUpdate: { type: Function, optional: true },
        onLinesReorder: { type: Function, optional: true },
        onBulkAction: { type: Function, optional: true },
    };

    setup() {
        this._tab = this.props.tabDef;
        this._childDefs = this._tab.child_field_defs || {};
        this._relOptionsCache = {};
        this._editing = useState({
            id: null,
            mode: this._tab.editable === false ? 'none' : 'single',
        });

        this.state = window.useInlineTreeState(this.props);
        // ── Dynamic read_only evaluation (Gap 6 fix) ──
        // Evaluate tab-level readonly_when expression against parent state
        const isDynamicReadOnly = window.InlineTreeAttrs?.evaluateTabReadonly
            ? window.InlineTreeAttrs.evaluateTabReadonly(this._tab, this.props.parentRecord)
            : false;
        const isReadOnly = !!this._tab.read_only || isDynamicReadOnly;
        this.state.showSelect = !isReadOnly;
        this.state.readOnly = isReadOnly;
        this.onchangeHook = window.useInlineTreeOnchange(this.state, this.props);

        this.dragController = null;
        this.tableRef = useRef('tableWrap');

        // ── Section Grouping Init ──
        this._defaultGroupBy = this._tab.default_group_by || null;
        this._groupByOptions = this._buildGroupByOptions();
        if (this._defaultGroupBy) {
            this.state.groupBy = this._defaultGroupBy;
            this.state.activeGroupBy = this._defaultGroupBy;
        }

        onMounted(() => {
            this._bindInputs();
            this._setupDrag();
            
            // Auto-load groups if default_group_by is set and parent has id
            if (this._defaultGroupBy && this.props.parentRecord?.id) {
                this._loadGroupedData(this._defaultGroupBy);
            }
            
            this._onLineSaved = (ev) => {
                if (ev.detail && ev.detail.lineId) {
                    if (this.state.rowStatus[ev.detail.lineId] === 'dirty') {
                        this.state.rowStatus[ev.detail.lineId] = 'saved';
                        setTimeout(() => {
                            if (this.state.rowStatus[ev.detail.lineId] === 'saved') {
                                delete this.state.rowStatus[ev.detail.lineId];
                            }
                        }, 1500);
                    }
                }
            };
            window.addEventListener('ls-o2m-saved', this._onLineSaved);
        });
        
        onWillUnmount(() => {
            if (this._onLineSaved) {
                window.removeEventListener('ls-o2m-saved', this._onLineSaved);
            }
        });
        onPatched(() => {
            this._bindInputs();
            // Rebuild drag only if sequence_field is set and controller was lost
            if (this._tab.sequence_field && !this.dragController) {
                this._setupDrag();
            }
            // ── Re-evaluate dynamic readonly on each patch (Gap 6) ──
            // This is crucial: when navigating between records (e.g. draft → posted),
            // the parentRecord changes but setup() doesn't re-run.
            if (window.InlineTreeAttrs?.evaluateTabReadonly) {
                const isDynRO = window.InlineTreeAttrs.evaluateTabReadonly(
                    this._tab, this.props.parentRecord
                );
                const newRO = !!this._tab.read_only || isDynRO;
                if (this.state.readOnly !== newRO) {
                    this.state.readOnly = newRO;
                    this.state.showSelect = !newRO;
                    // If now readonly, exit any edit mode
                    if (newRO && this.state.editingId) {
                        this.state.exitEdit();
                    }
                }
            }
        });
    }

    /** Build list of fields that can be used for group-by */
    _buildGroupByOptions() {
        const defs = this._childDefs;
        const options = [];
        for (const [fname, fdef] of Object.entries(defs)) {
            if (fdef.type === 'many2one' || fdef.type === 'selection') {
                options.push({ name: fname, label: fdef.string || fname, type: fdef.type });
            }
        }
        // Always include default_group_by if set even if not m2o/selection
        if (this._defaultGroupBy && !options.find(o => o.name === this._defaultGroupBy)) {
            const fdef = defs[this._defaultGroupBy];
            if (fdef) {
                options.unshift({ name: this._defaultGroupBy, label: fdef.string || this._defaultGroupBy, type: fdef.type });
            }
        }
        return options;
    }

    get visibleColumns() {
        return window.InlineTreeColumns.resolve(this._tab, this.props.parentRecord || {});
    }

    get hasSequence() {
        return !!this._tab.sequence_field;
    }

    get isMany2Many() {
        return this._tab.type === 'many2many' || this._tab.widget === 'many2many' || (!this._tab.child_model && this._tab.relation && !this._tab.inverse_field);
    }

    get canCreate() {
        return this._tab.create !== false && !this.state.readOnly;
    }

    get canDelete() {
        return this._tab.delete !== false && !this.state.readOnly;
    }

    get hasAggregates() {
        return this.visibleColumns.some(c => c.aggregation);
    }

    get totalColspan() {
        let c = this.visibleColumns.length;
        if (this.state.showSelect) c++;
        if (this.hasSequence) c++;
        if (!this._tab.read_only) c++;
        if (this.canDelete && !this._tab.read_only) c++;
        if (this.rowButtons.length) c += this.rowButtons.length;
        return c;
    }

    /** Whether the tree is currently in grouped mode */
    get isGrouped() {
        return !!this.state.groupBy && this.state.groups.length > 0;
    }

    /** Available group-by options for the dropdown */
    get groupByOptions() {
        return this._groupByOptions || [];
    }

    /** Columns that have aggregation config (for group header/footer) */
    get groupAggregateColumns() {
        return this.visibleColumns.filter(c => c.aggregation);
    }

    get displayLines() {
        // `limit` is the initial page size queried from backend.
        // Once user clicks "Load more", state.lines holds more than limit;
        // in that case show everything loaded (no client-side slicing).
        return this.state.lines;
    }

    get rowButtons() {
        return this._tab.buttons || [];
    }

    optionalColumns() {
        return this.visibleColumns.filter(c => c.optional);
    }

    isColumnHidden(name) {
        return window.InlineTreeColumns.loadUserHidden(this._tab.field).has(name);
    }

    toggleOptionalColumn(name, ev) {
        const hidden = window.InlineTreeColumns.loadUserHidden(this._tab.field);
        if (ev.target.checked) hidden.delete(name); else hidden.add(name);
        window.InlineTreeColumns.saveUserHidden(this._tab.field, hidden);
    }

    toggleOptionalPopover() {
        this.state.showOptionalPopover = !this.state.showOptionalPopover;
    }

    hasBulk(action) {
        if (action === 'delete') return this.canDelete;
        if (action === 'duplicate') return this.canCreate;
        if (action === 'export') return true;
        return false;
    }

    hasMore() {
        // `hasMoreLines` is set by loadMore from server `length`; otherwise heuristic.
        if (this.state.hasMoreLines != null) return !!this.state.hasMoreLines;
        const limit = this._tab.limit || 0;
        return limit > 0 && this.state.lines.length >= limit && this.state.lines.length % limit === 0;
    }

    async loadMore() {
        if (this.state.loadingMore) return;
        this.state.loadingMore = true;
        const offset = this.state.lines.length;
        const pageSize = this._tab.limit || 80;
        try {
            const res = await RPC.loadO2m(this.props.parentModel, this._tab.field, this.props.parentRecord?.id, {
                offset,
                limit: pageSize,
            });
            const records = res.records || [];
            // Dedup by id (server returns canonical id; __temp_id rows are local-only)
            const existing = new Set(this.state.lines.map(l => l.id).filter(Boolean));
            const fresh = records.filter(r => !existing.has(r.id));
            const newLines = fresh.map(r => ({ ...r, __loaded: true }));
            this.state.lines.push(...newLines);
            // Track whether more pages remain (server returns total `length` in res)
            const total = res.length ?? null;
            if (total != null) {
                this.state.hasMoreLines = this.state.lines.length < total;
            } else {
                this.state.hasMoreLines = records.length >= pageSize;
            }
        } catch (e) {
            console.warn('loadMore failed', e);
        } finally {
            this.state.loadingMore = false;
        }
    }

    // ── Cell interactions ──────────────────────
    /**
     * Build <th> class string for a column.
     * Includes sort indicators and required marker.
     */
    thClass(col) {
        const parts = ['ls-it-th'];
        if (col.required) parts.push('ls-it-required');
        if (col.sortable) parts.push('ls-it-th-sortable');
        if (this.state.sortBy && this.state.sortBy.field === col.name) {
            parts.push(this.state.sortBy.dir === 'asc' ? 'ls-it-sorted-asc' : 'ls-it-sorted-desc');
        }
        return parts.join(' ');
    }

    /**
     * Handle column header click → toggle sort (client-side).
     * If a `default_order` is configured on the tabDef, performs server-side
     * reload via loadO2m after updating sortBy.
     */
    async onSortColumn(col) {
        if (!col || !col.sortable) return;
        this.state.toggleSort(col.name);
        // If lines are fully loaded (no server paging), sort is already applied
        // client-side by toggleSort. For paginated grids, reload from server.
        const limit = this._tab.limit || 0;
        const total = this.state.hasMoreLines != null
            ? this.state.lines.length + (this.state.hasMoreLines ? 1 : 0)
            : null;
        const serverSide = limit > 0 && (total == null || total > this.state.lines.length);
        if (serverSide && this.props.parentRecord?.id) {
            const order = this.state.sortBy
                ? `${this.state.sortBy.field} ${this.state.sortBy.dir}`
                : null;
            await this._reloadLines(order);
        }
    }

    /**
     * Reload all O2M lines from server (used after sort or filter change).
     */
    async _reloadLines(order = null) {
        this.state.loading = true;
        try {
            const res = await RPC.loadO2m(
                this.props.parentModel,
                this._tab.field,
                this.props.parentRecord.id,
                {
                    offset: 0,
                    limit: this._tab.limit || 80,
                    order,
                }
            );
            this.state.lines = (res.records || []);
            const total = res.length ?? null;
            if (total != null) {
                this.state.hasMoreLines = this.state.lines.length < total;
            }
        } catch (e) {
            console.warn('_reloadLines failed', e);
        } finally {
            this.state.loading = false;
        }
    }

    /**
     * Called by InlineTreeRow when Tab goes past the last editable cell.
     * Move edit focus to the next row, or add a new line if at the bottom.
     */
    onTabOutRow(line, idx) {
        this.state.exitEdit(line.id || line.__temp_id);
        const nextIdx = idx + 1;
        if (nextIdx < this.state.lines.length) {
            const nextLine = this.state.lines[nextIdx];
            const nextId = nextLine.id || nextLine.__temp_id;
            this.state.enterEdit(nextId, false);
            setTimeout(() => {
                this._bindInputs();
                const tableEl = this.tableRef.el?.querySelector('table');
                if (tableEl) {
                    const row = tableEl.querySelector(`tr.ls-it-row[data-id="${nextId}"]`);
                    if (row) {
                        const firstInput = row.querySelector('input:not([type="checkbox"]), select, textarea');
                        if (firstInput) firstInput.focus();
                    }
                }
            }, 0);
        } else if (this._tab.editable && this.canCreate && this._tab.editable !== false) {
            // At the last row: Tab-out creates a new line (AdvSoft behaviour)
            this.addLine();
        }
    }

    /**
     * Called by InlineTreeRow when Shift+Tab goes before the first editable cell.
     * Move edit focus to the previous row.
     */
    onTabInRow(line, idx) {
        this.state.exitEdit(line.id || line.__temp_id);
        const prevIdx = idx - 1;
        if (prevIdx >= 0) {
            const prevLine = this.state.lines[prevIdx];
            const prevId = prevLine.id || prevLine.__temp_id;
            this.state.enterEdit(prevId, false);
            setTimeout(() => {
                this._bindInputs();
                const tableEl = this.tableRef.el?.querySelector('table');
                if (tableEl) {
                    const row = tableEl.querySelector(`tr.ls-it-row[data-id="${prevId}"]`);
                    if (row) {
                        const inputs = Array.from(row.querySelectorAll('input:not([type="checkbox"]), select, textarea'));
                        if (inputs.length) inputs[inputs.length - 1].focus();
                    }
                }
            }, 0);
        }
    }

    onCellClick(line, col, ev) {
        if (this.state.readOnly) return;
        if (col && col.readonly) return;
        const lineId = line.id || line.__temp_id;
        if (this.state.editingIds.includes(lineId)) return;
        if (this._tab.multi_edit) {
            this.state.enterEdit(lineId, true);
        } else {
            this.state.editingIds.forEach(id => this.state.exitEdit(id));
            this.state.enterEdit(lineId, false);
        }
        setTimeout(() => this._bindInputs(), 0);
    }

    onRowClick(line, ev) {
        if (ev.target.closest('input,select,textarea,button,a')) return;
        if (this._tab.open_record_on_click !== false && line.id) {
            if (!this._tab.editable && window.FormViewDialog) {
                // Open modal form view if not inline editable
                this.state.showFormDialog = {
                    model: (this._tab.child_model || this._tab.relation),
                    resId: line.id,
                    title: 'Open: ' + (this._tab.string || this._tab.child_model || this._tab.relation)
                };
            } else if (window.__doAction) {
                // Fallback to full navigation
                window.__doAction({
                    type: 'ir.actions.act_window',
                    res_model: (this._tab.child_model || this._tab.relation),
                    res_id: line.id,
                    view_mode: 'form',
                });
            }
        }
    }

    onRowContext(line, ev) {
        ev.preventDefault();
        if (this._tab.read_only) return;
        if (this._tab.context_menu === false) return;
        this.state.toggleSelect(line);
    }

    onRowButtonClick(line, btn, ev) {
        if (this.props.onBulkAction) {
            this.props.onBulkAction({ type: 'row_button', btn, line });
        }
        if (btn.method && (this._tab.child_model || this._tab.relation)) {
            RPC.callButtonO2m((this._tab.child_model || this._tab.relation), line.id, btn.method)
                .then(res => {
                    if (res.record && this.props.onLineUpdate) {
                        Object.keys(res.record).forEach(k => {
                            if (k !== 'id') line[k] = res.record[k];
                        });
                    }
                })
                .catch(e => console.warn('Row button error', e));
        }
    }

    onLineUpdate(lineId, field, value) {
        const line = this.state.lines.find(l => (l.id || l.__temp_id) === lineId);
        if (!line) return;

        // ── Client-side instant field reactions (Gap 4 fix) ──────
        // Apply debit/credit mutual exclusion and balance computation
        // BEFORE the server onchange debounce, for instant UI feedback.
        const exclusiveGroups = this._tab.exclusive_fields || [];
        for (const group of exclusiveGroups) {
            if (group.includes(field)) {
                const numVal = parseFloat(value) || 0;
                if (numVal > 0) {
                    for (const otherField of group) {
                        if (otherField !== field) {
                            line[otherField] = 0;
                            // Also notify parent form of the zeroed field
                            if (this.props.onLineUpdate) {
                                this.props.onLineUpdate(lineId, otherField, 0);
                            }
                        }
                    }
                }
            }
        }
        // Auto-compute balance (debit - credit) if balance field exists
        if ((field === 'debit' || field === 'credit') && this._childDefs['balance']) {
            const debit = field === 'debit' ? (parseFloat(value) || 0) : (parseFloat(line.debit) || 0);
            const credit = field === 'credit' ? (parseFloat(value) || 0) : (parseFloat(line.credit) || 0);
            line.balance = debit - credit;
        }

        this.state.commitEdit(lineId, field, value);
        this.onchangeHook.schedule(lineId, field);
        if (this.props.onLineUpdate) {
            this.props.onLineUpdate(lineId, field, value);
        }
    }

    async addLine() {
        if (this.isMany2Many) {
            this.openAddFromList();
            return;
        }

        if (!this.props.onLineAdd) return;

        if (!this._tab.editable && window.FormViewDialog) {
            // If tree is not inline editable, open the creation modal
            this.state.showFormDialog = {
                model: (this._tab.child_model || this._tab.relation),
                resId: false,
                title: 'Create: ' + (this._tab.string || this._tab.child_model || this._tab.relation)
            };
            return;
        }

        const today = new Date().toISOString().slice(0, 10);
        const inverseField = this._tab.inverse_field;
        const childDefs = this._childDefs;
        const defaults = {};
        if (inverseField) defaults[inverseField] = this.props.parentRecord?.id;

        // ── Server-side default_get (AdvSoft parity) ──────────
        // Try to fetch defaults from the child model's _default_get handler
        const childModel = (this._tab.child_model || this._tab.relation);
        if (childModel && RPC.defaultGet) {
            try {
                const serverDefaults = await RPC.defaultGet(childModel, this._tab.tree_fields);
                if (serverDefaults && typeof serverDefaults === 'object') {
                    Object.assign(defaults, serverDefaults);
                    // Re-assert inverse field (server defaults may not include it)
                    if (inverseField) defaults[inverseField] = this.props.parentRecord?.id;
                }
            } catch (e) {
                console.warn('default_get for child model failed, using client defaults:', e);
            }
        }

        // ── Client-side fallback for any remaining empty fields ──
        for (const fname of this._tab.tree_fields) {
            if (fname === inverseField) continue;
            if (defaults[fname] != null && defaults[fname] !== '') continue; // already has a server default
            const cdef = childDefs[fname];
            if (!cdef) continue;
            if (cdef.type === 'date' && !defaults[fname]) defaults[fname] = today;
            else if (['float', 'integer', 'monetary'].includes(cdef.type) && defaults[fname] == null) defaults[fname] = 0;
            else if (cdef.type === 'boolean' && defaults[fname] == null) defaults[fname] = false;
            else if (defaults[fname] == null) defaults[fname] = cdef.default ?? '';
        }

        // ── Propagate parent context fields to child ──────
        // Common AdvSoft pattern: inherit partner_id, date, currency from parent
        const propagateFields = this._tab.propagate_fields || [];
        const parentRec = this.props.parentRecord || {};
        for (const pf of propagateFields) {
            if (parentRec[pf] != null && defaults[pf] == null) {
                // For M2O fields, extract scalar id
                defaults[pf] = Array.isArray(parentRec[pf]) ? parentRec[pf][0] : parentRec[pf];
            }
        }

        // ── Auto-increment sequence (Gap 5 fix) ──────────
        const seqField = this._tab.sequence_field;
        if (seqField && !defaults[seqField]) {
            const maxSeq = this.state.lines.reduce((max, l) => {
                const s = Number(l[seqField]) || 0;
                return s > max ? s : max;
            }, 0);
            defaults[seqField] = maxSeq + 10;
        }

        const newLine = await this.props.onLineAdd(defaults);
        if (newLine) {
            const lineId = newLine.id || newLine.__temp_id;
            if (this._tab.editable === 'top') {
                // Prepend so new row visible at the top
                this.state.lines = [newLine, ...this.state.lines];
            } else {
                this.state.lines.push(newLine);
            }
            this.state.enterEdit(lineId, !!this._tab.multi_edit);
            setTimeout(() => {
                this._bindInputs();
                // Scroll the new row into view and focus first editable cell
                const tableEl = this.tableRef.el?.querySelector('table');
                if (tableEl) {
                    const row = tableEl.querySelector(`tr.ls-it-row[data-id="${lineId}"]`);
                    if (row) {
                        row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                        const firstInput = row.querySelector('input:not([type="checkbox"]), select, textarea');
                        if (firstInput) firstInput.focus();
                    }
                }
            }, 0);
        }
    }

    async deleteLine(line) {
        if (this.props.onLineDelete) {
            await this.props.onLineDelete(line.id || line.__temp_id);
        }
        this.state.lines = this.state.lines.filter(l => (l.id || l.__temp_id) !== (line.id || line.__temp_id));
    }

    // ── Drag & drop ─────────────────────────────
    _setupDrag() {
        if (this._tab.read_only) return;
        if (!this._tab.sequence_field) return;
        if (!this.tableRef.el) return;
        // Destroy previous controller to prevent duplicate listeners
        if (this.dragController) {
            this.dragController.destroy();
            this.dragController = null;
        }
        this.dragController = new window.InlineTreeDrag({
            tabField: this._tab.field,
            sequenceField: this._tab.sequence_field,
            onReorder: (fromIdx, toIdx) => this.handleReorder(fromIdx, toIdx),
        });
        this.dragController.attach(this.tableRef.el.querySelector('table'));
    }

    onDragStart(line, idx, ev) {
        if (!this.dragController) return;
    }

    onDragEnd(line, idx, ev) {
    }

    async handleReorder(fromIdx, toIdx) {
        if (fromIdx === toIdx) return;
        const lines = [...this.state.lines];
        const [moved] = lines.splice(fromIdx, 1);
        lines.splice(toIdx, 0, moved);
        this.state.lines = lines;
        if (this.props.onLinesReorder) {
            await this.props.onLinesReorder(fromIdx, toIdx, this._tab.sequence_field);
        } else if ((this._tab.child_model || this._tab.relation)) {
            try {
                await RPC.reorderO2m((this._tab.child_model || this._tab.relation), this._tab.sequence_field, lines.map(l => l.id));
            } catch (e) {
                console.warn('reorder_o2m failed', e);
            }
        }
    }

    // ── Bulk actions ────────────────────────────
    toggleSelectAll(ev) {
        if (ev.target.checked) this.state.selectAll();
        else this.state.clearSelection();
    }

    clearSelection() {
        this.state.clearSelection();
    }

    async bulkDelete() {
        if (!confirm(`Delete ${this.state.selection.length} record(s)?`)) return;
        const ids = this.state.selection.map(id => parseInt(id)).filter(Boolean);
        if ((this._tab.child_model || this._tab.relation)) {
            try {
                await RPC.bulkDeleteChild((this._tab.child_model || this._tab.relation), ids);
                this.state.lines = this.state.lines.filter(l => !ids.includes(l.id));
                this.clearSelection();
            } catch (e) {
                alert('Bulk delete failed: ' + e.message);
            }
        }
    }

    async bulkDuplicate() {
        if (!(this._tab.child_model || this._tab.relation)) return;
        const sources = this.state.lines.filter(l => this.state.selection.includes(l.id || l.__temp_id));
        try {
            const newRecords = await window.InlineTreeBulk.bulkDuplicate(
                this.props.parentModel, this._tab.field,
                this._tab.inverse_field, this.props.parentRecord?.id, sources
            );
            this.state.lines.push(...newRecords);
            this.clearSelection();
        } catch (e) {
            alert('Duplicate failed: ' + e.message);
        }
    }

    bulkExport() {
        const csv = window.InlineTreeBulk.exportCsv(this.visibleColumns, this.state.lines);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this._tab.field}_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ── Picker (Add from list) ─────────────────
    openAddFromList() {
        const cfg = this._tab.add_from_list;
        if (typeof cfg === 'object' && cfg) {
            this.state.showPicker = {
                model_label: this._tab.model_label || cfg.model || '',
                ...cfg,
            };
        } else {
            this.state.showPicker = {
                model: (this._tab.child_model || this._tab.relation),
                model_label: this._tab.model_label || this._tab.child_model || this._tab.relation || '',
                fields: ['name'],
                default_domain: [],
            };
        }
    }

    async onPickerConfirm(records) {
        if (!records || !records.length) {
            this.state.showPicker = null;
            return;
        }

        if (this._tab.type === 'many2many') {
            // Just link locally and let form save handle it
            if (this.props.onLineLink) {
                this.props.onLineLink(records);
                // Also update local state to reflect immediately
                const existingIds = new Set(this.state.lines.map(l => l.id));
                const newRecords = records.filter(r => !existingIds.has(r.id));
                this.state.lines.push(...newRecords);
            }
            this.state.showPicker = null;
            return;
        }

        const payloads = records.map(r => {
            const obj = { ...r };
            if (this._tab.inverse_field) obj[this._tab.inverse_field] = this.props.parentRecord?.id;
            return obj;
        });
        try {
            const newRecords = await RPC.bulkCreateChild(this.props.parentModel, this._tab.field, payloads);
            this.state.lines.push(...(newRecords.records || newRecords || []));
        } catch (e) {
            alert('Add from list failed: ' + e.message);
        }
        this.state.showPicker = null;
    }

    // ── Dialog form callback ───────────────────
    onDialogSaved(rec) {
        if (!rec || !rec.id) return;
        const existingIdx = this.state.lines.findIndex(l => l.id === rec.id);
        if (existingIdx >= 0) {
            this.state.lines[existingIdx] = { ...this.state.lines[existingIdx], ...rec };
        } else {
            this.state.lines.push(rec);
        }
        // Force refresh table
        this.state.dirty = true;
    }

    // ── Aggregations ────────────────────────────
    computeAggregate(col) {
        const vals = this.state.lines.map(l => {
            let v = l[col.name];
            if (Array.isArray(v)) v = v[0];
            return parseFloat(v) || 0;
        });
        if (vals.length === 0) return '0';
        let result;
        switch (col.aggregation.type) {
            case 'sum': result = vals.reduce((a, b) => a + b, 0); break;
            case 'avg': result = vals.reduce((a, b) => a + b, 0) / vals.length; break;
            case 'max': result = Math.max(...vals); break;
            case 'min': result = Math.min(...vals); break;
            default: result = 0;
        }
        const d = col.digits ? col.digits[1] : 2;
        // Format with thousand separators for accounting readability
        try {
            return result.toLocaleString('id-ID', {
                minimumFractionDigits: d,
                maximumFractionDigits: d,
            });
        } catch (e) {
            return result.toFixed(d);
        }
    }

    computeSumField() {
        const sumField = this._tab.sum_field;
        if (!sumField) return '0';
        const total = this.state.lines.reduce((s, l) => {
            let val = l[sumField];
            if (Array.isArray(val)) val = val[0];
            return s + (parseFloat(val) || 0);
        }, 0);
        const fdef = this._childDefs[sumField];
        if (fdef && (fdef.widget === 'float_time' || sumField.includes('hours'))) {
            return total.toFixed(1) + 'h';
        }
        return total.toFixed(2);
    }

    // ── Section Grouping Methods ────────────────────

    /** Load grouped data from server */
    async _loadGroupedData(groupByField) {
        if (!this.props.parentRecord?.id || !(this._tab.child_model || this._tab.relation)) return;
        this.state.loading = true;
        try {
            const aggFields = this._getAggregateFields();
            const res = await RPC.loadO2mGrouped(
                this.props.parentModel,
                this._tab.field,
                this.props.parentRecord.id,
                {
                    group_by: groupByField,
                    aggregate_fields: aggFields,
                    load_records: true,
                    limit: this._tab.group_limit || 10,
                }
            );
            if (res.groups) {
                this.state.setGroupBy(groupByField, res.groups);
            }
        } catch (e) {
            console.warn('_loadGroupedData failed', e);
            // Fallback: disable grouping
            this.state.groupBy = null;
            this.state.groups = [];
        } finally {
            this.state.loading = false;
        }
    }

    /** Get numeric field names for aggregation */
    _getAggregateFields() {
        const fields = [];
        for (const col of this.visibleColumns) {
            if (col.aggregation && ['float', 'integer', 'monetary'].includes(col.type)) {
                fields.push(col.name);
            }
        }
        return fields;
    }

    /** Handle group header click → toggle fold/unfold, lazy-load records */
    async onGroupHeaderClick(group) {
        const groupId = group.id ?? group.value;
        this.state.toggleGroupFold(groupId);

        // If expanding and records not loaded, fetch them
        if (!group.isFolded && (!group._loaded || !group.records?.length)) {
            this.state.groupLoading[groupId] = true;
            try {
                const res = await RPC.loadO2m(
                    this.props.parentModel,
                    this._tab.field,
                    this.props.parentRecord.id,
                    {
                        domain: group.__domain || [],
                        offset: 0,
                        limit: this._tab.group_limit || 10,
                    }
                );
                this.state.setGroupRecords(groupId, res.records || []);
            } catch (e) {
                console.warn('Failed to load group records', e);
            } finally {
                delete this.state.groupLoading[groupId];
            }
        }
    }

    /** Handle group-by dropdown change */
    async onGroupByChange(ev) {
        const field = ev.target.value;
        if (!field) {
            // Disable grouping → reload flat
            this.state.groupBy = null;
            this.state.groups = [];
            this.state.activeGroupBy = null;
            await this._reloadLines();
            return;
        }
        await this._loadGroupedData(field);
    }

    /** Load more records within a specific group */
    async loadMoreInGroup(group) {
        const groupId = group.id ?? group.value;
        const offset = (group.records || []).length;
        this.state.groupLoading[groupId] = true;
        try {
            const res = await RPC.loadO2m(
                this.props.parentModel,
                this._tab.field,
                this.props.parentRecord.id,
                {
                    domain: group.__domain || [],
                    offset,
                    limit: this._tab.group_limit || 10,
                }
            );
            const existing = new Set((group.records || []).map(r => r.id).filter(Boolean));
            const fresh = (res.records || []).filter(r => !existing.has(r.id));
            group.records.push(...fresh);
        } catch (e) {
            console.warn('loadMoreInGroup failed', e);
        } finally {
            delete this.state.groupLoading[groupId];
        }
    }

    /** Format aggregate value for group header display */
    formatGroupAggregate(group, col) {
        if (group.__aggregates && group.__aggregates[col.name]) {
            const val = group.__aggregates[col.name].sum ?? 0;
            const d = col.digits ? col.digits[1] : 2;
            return Number(val).toFixed(d);
        }
        // Compute client-side from records
        const val = this.state.computeGroupAggregate(group, col.name, col.aggregation?.type || 'sum');
        const d = col.digits ? col.digits[1] : 2;
        return Number(val).toFixed(d);
    }

    /** Compute aggregate for group footer row */
    computeGroupFooterAgg(group, col) {
        if (!col.aggregation) return '';
        const records = group.records || [];
        const vals = records.map(r => {
            let v = r[col.name];
            if (Array.isArray(v)) v = v[0];
            return parseFloat(v) || 0;
        });
        if (!vals.length) return '0';
        let result;
        switch (col.aggregation.type) {
            case 'sum': result = vals.reduce((a, b) => a + b, 0); break;
            case 'avg': result = vals.reduce((a, b) => a + b, 0) / vals.length; break;
            case 'max': result = Math.max(...vals); break;
            case 'min': result = Math.min(...vals); break;
            default: result = 0;
        }
        const d = col.digits ? col.digits[1] : 2;
        return result.toFixed(d);
    }

    /** Reload flat lines (when disabling grouping) */
    async _reloadLines() {
        if (!this.props.parentRecord?.id) return;
        this.state.loading = true;
        try {
            const res = await RPC.loadO2m(
                this.props.parentModel,
                this._tab.field,
                this.props.parentRecord.id,
                { limit: this._tab.limit || 80 }
            );
            this.state.lines = res.records || [];
        } catch (e) {
            console.warn('_reloadLines failed', e);
        } finally {
            this.state.loading = false;
        }
    }

    // ── DOM input binding ──────────────────────
    _bindInputs() {
        const el = this.tableRef.el;
        if (!el) return;
        // M2O autocomplete binding (delegated to M2OAutocomplete)
        el.querySelectorAll('.ls-m2o-autocomplete:not([data-m2o-bound])').forEach(input => {
            input.setAttribute('data-m2o-bound', '1');
            const lineIdStr = input.dataset.lineId;
            const lineId = lineIdStr.startsWith('new_') ? lineIdStr : parseInt(lineIdStr);
            const fieldName = input.dataset.field;
            const relation = input.dataset.relation;
            const widget = input.closest('.ls-it-m2o-widget');
            const col = this.visibleColumns.find(c => c.name === fieldName);
            const relOptions = this.props.relOptions?.[fieldName] || [];
            const opts = col?.options || {};
            if (window.M2OAutocomplete) {
                new window.M2OAutocomplete({
                    input,
                    relation,
                    fieldLabel: col?.label || fieldName,
                    fieldName,
                    relOptions,
                    options: {
                        no_create: widget?.dataset.noCreate === '1' || opts.no_create,
                        no_quick_create: opts.no_quick_create,
                        no_create_edit: widget?.dataset.noCreateEdit === '1' || opts.no_create_edit,
                    },
                    onSelect: (opt) => {
                        this.onLineUpdate(lineId, fieldName, [opt.id, opt.name]);
                    },
                    onClear: () => {
                        this.onLineUpdate(lineId, fieldName, null);
                    },
                });
            }
        });

        // Generic change event delegation (one-time)
        if (!el.__itBound) {
            el.__itBound = true;
            el.addEventListener('change', (ev) => {
                const target = ev.target;
                const lineIdStr = target.dataset.lineId;
                const field = target.dataset.field;
                if (!lineIdStr || !field) return;
                const lineId = lineIdStr.startsWith('new_') ? lineIdStr : parseInt(lineIdStr);
                let value;
                const col = this.visibleColumns.find(c => c.name === field);
                if (target.type === 'checkbox') {
                    value = target.checked;
                } else if (target.dataset.type === 'many2one') {
                    // M2OAutocomplete handles actual selection. If cleared manually, reset to null.
                    if (!target.value.trim()) {
                        value = null;
                    } else {
                        return; // Let M2OAutocomplete's onSelect handle it
                    }
                } else if (col && ['float', 'integer', 'monetary'].includes(col.type)) {
                    const cleanVal = (target.value || '').toString().replace(/,/g, '');
                    const parsed = col.type === 'integer' ? parseInt(cleanVal, 10) : parseFloat(cleanVal);
                    value = isNaN(parsed) ? 0 : parsed;
                } else {
                    value = target.value;
                }
                this.onLineUpdate(lineId, field, value);
            });

            // Focusout: exit edit mode
            el.addEventListener('focusout', (ev) => {
                setTimeout(() => {
                    const active = document.activeElement;
                    if (!active || !active.closest('.ls-it-row.editing') && !active.closest('.ls-m2o-dropdown') && !active.closest('.ls-it-controls')) {
                        // Exit edit mode if focus moved completely outside the editing row
                        this.state.exitAllEdits();
                    }
                }, 200);
            });
        }

        // Reset M2O bound flag when rows are re-rendered
        el.querySelectorAll('.ls-m2o-autocomplete').forEach(input => {
            if (input.closest('.ls-it-row:not([data-m2o-row-bound])')) {
                input.removeAttribute('data-m2o-bound');
            }
        });
    }

    // ── Column resize ───────────────────────────
    startResize(col, ev) {
        ev.preventDefault();
        ev.stopPropagation();
        const startX = ev.clientX;
        const thEl = ev.target.parentElement;
        const startWidth = thEl.offsetWidth;
        let finalWidth = startWidth;
        const move = (e) => {
            const newWidth = Math.max(40, startWidth + (e.clientX - startX));
            finalWidth = newWidth;
            // Live-update DOM only; mutating `col.width` is lost on re-render
            thEl.style.width = newWidth + 'px';
            thEl.style.minWidth = newWidth + 'px';
        };
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            document.body.style.cursor = '';
            // Persist user-chosen width so it survives re-render
            const widths = window.InlineTreeColumns.loadUserWidths(this._tab.field);
            widths[col.name] = finalWidth + 'px';
            window.InlineTreeColumns.saveUserWidths(this._tab.field, widths);
            // Update the in-memory col so subsequent reads match
            col.width = finalWidth + 'px';
        };
        document.body.style.cursor = 'col-resize';
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    }
}

window.InlineTreeWidget = InlineTreeWidget;
})();
