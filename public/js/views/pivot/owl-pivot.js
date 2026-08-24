// ══════════════════════════════════════════════════════════════════
//  PivotView — Odoo-style interactive cross-table
//  Features: multi-level row/col groupBy, multiple measures,
//  expandable/collapsible tree, drill-down, context config, export
// ══════════════════════════════════════════════════════════════════
(function () {
const { Component, useState, onWillStart, xml } = owl;
const RPC = window.AdvSoftRPC;

function esc(v) { return v == null ? '' : String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ════════════════════════════════════════════════════════════════
//  PivotModel — data management, tree structures, table generation
// ════════════════════════════════════════════════════════════════
class PivotModel {
    constructor() {
        this.activeMeasures = [];
        this.rowGroupBys = [];
        this.colGroupBys = [];
        this.rawGroups = [];        // Raw grouped data from server
        this.rowHeaders = [];       // Flat list of row headers with indent
        this.colHeaders = [];       // Flat list of col headers
        this.cellMap = new Map();   // key: "rowVals|colVals" -> measurements
    }

    async load(model, domain, rowGroupBys, colGroupBys, activeMeasures) {
        this.rowGroupBys = [...rowGroupBys];
        this.colGroupBys = [...colGroupBys];
        this.activeMeasures = [...activeMeasures];
        this.cellMap.clear();

        const allGroupBy = [...this.rowGroupBys, ...this.colGroupBys];

        if (allGroupBy.length === 0) {
            // No grouping: just get count
            const res = await RPC.searchRead(model, domain, { limit: 1 });
            this.rawGroups = [{ __count: res.length || 0 }];
        } else {
            const res = await RPC.readGroup(model, domain, allGroupBy, this.activeMeasures);
            this.rawGroups = res.groups || [];
        }

        this._buildRowHeaders();
        this._buildColHeaders();
        this._buildCellMap();
    }

    // Build flat row headers from raw grouped data
    _buildRowHeaders() {
        this.rowHeaders = [];
        if (this.rowGroupBys.length === 0) {
            // Single total row
            const totalMeasurements = this._sumAll();
            this.rowHeaders.push({
                label: 'Total',
                values: [],
                indent: 0,
                isLeaf: true,
                isTotal: true,
                measurements: totalMeasurements,
            });
            return;
        }

        const seen = new Map(); // key -> { label, values, indent, isLeaf, measurements }
        for (const row of this.rawGroups) {
            for (let lvl = 0; lvl < this.rowGroupBys.length; lvl++) {
                const field = this.rowGroupBys[lvl];
                const val = row[field];
                const keyParts = [];
                for (let i = 0; i <= lvl; i++) {
                    keyParts.push(row[this.rowGroupBys[i]]);
                }
                const key = keyParts.join('|');

                if (!seen.has(key)) {
                    seen.set(key, {
                        label: row[field + '_label'] || String(val ?? 'Undefined'),
                        values: keyParts,
                        indent: lvl + 1,
                        isLeaf: lvl === this.rowGroupBys.length - 1,
                        isTotal: false,
                        measurements: {},
                        _parentKey: lvl > 0 ? keyParts.slice(0, lvl).join('|') : null,
                    });
                }
            }
        }

        // Sort headers by their values order
        const sorted = Array.from(seen.values());
        this.rowHeaders = sorted;
    }

    // Build flat col headers from raw grouped data
    _buildColHeaders() {
        this.colHeaders = [];
        if (this.colGroupBys.length === 0) {
            this.colHeaders.push({ label: 'Total', values: [], depth: 0, isLeaf: true });
            return;
        }

        const seen = new Map();
        for (const row of this.rawGroups) {
            for (let lvl = 0; lvl < this.colGroupBys.length; lvl++) {
                const field = this.colGroupBys[lvl];
                const val = row[field];
                const keyParts = [];
                for (let i = 0; i <= lvl; i++) {
                    keyParts.push(row[this.colGroupBys[i]]);
                }
                const key = keyParts.join('|');

                if (!seen.has(key)) {
                    seen.set(key, {
                        label: row[field + '_label'] || String(val ?? 'Undefined'),
                        values: keyParts,
                        depth: lvl,
                        isLeaf: lvl === this.colGroupBys.length - 1,
                    });
                }
            }
        }

        this.colHeaders = Array.from(seen.values());
    }

    // Build cell map: rowValues|colValues -> measurements
    _buildCellMap() {
        this.cellMap.clear();
        for (const row of this.rawGroups) {
            const rowVals = this.rowGroupBys.map(f => row[f]);
            const colVals = this.colGroupBys.map(f => row[f]);
            const key = JSON.stringify(rowVals) + '|' + JSON.stringify(colVals);

            const measurements = {};
            for (const m of this.activeMeasures) {
                measurements[m] = row[m + ':sum'] ?? row[m + ':avg'] ?? row[m + ':count'] ?? 0;
            }
            measurements['__count'] = row['__count'] || 0;

            this.cellMap.set(key, measurements);
        }
    }

    // Get cell value for a specific row/col intersection
    getCellValue(rowValues, colValues, measure) {
        const key = JSON.stringify(rowValues) + '|' + JSON.stringify(colValues);
        const m = this.cellMap.get(key);
        if (!m) return 0;
        return m[measure] ?? m['__count'] ?? 0;
    }

    // Get row total (sum across all columns for a measure)
    getRowTotal(rowValues, measure) {
        let total = 0;

        // Direct iteration approach
        for (const row of this.rawGroups) {
            const rv = this.rowGroupBys.map(f => row[f]);
            const match = rv.length === rowValues.length && rv.every((v, i) => v == rowValues[i]);
            if (match) {
                total += row[measure + ':sum'] ?? row[measure + ':count'] ?? 0;
            }
        }
        return total;
    }

    // Get column total (sum across all rows for a measure)
    getColTotal(colValues, measure) {
        let total = 0;
        for (const row of this.rawGroups) {
            const cv = this.colGroupBys.map(f => row[f]);
            const match = cv.length === colValues.length && cv.every((v, i) => v == colValues[i]);
            if (match) {
                total += row[measure + ':sum'] ?? row[measure + ':count'] ?? 0;
            }
        }
        return total;
    }

    // Get grand total
    getGrandTotal(measure) {
        let total = 0;
        for (const row of this.rawGroups) {
            total += row[measure + ':sum'] ?? row[measure + ':count'] ?? 0;
        }
        return total;
    }

    _sumAll() {
        const result = {};
        for (const m of this.activeMeasures) {
            result[m] = 0;
            for (const row of this.rawGroups) {
                result[m] += row[m + ':sum'] ?? row[m + ':count'] ?? 0;
            }
        }
        result['__count'] = this.rawGroups.reduce((s, r) => s + (r['__count'] || 0), 0);
        return result;
    }

    // Get visible rows (respecting expand/collapse state)
    getVisibleRows(expandedRows) {
        if (this.rowGroupBys.length === 0) {
            return this.rowHeaders; // Just the total row
        }

        const visible = [];
        const totalRow = {
            label: 'Total',
            values: [],
            indent: 0,
            isLeaf: true,
            isTotal: true,
            measurements: this._sumAll(),
        };
        visible.push(totalRow);

        for (const rh of this.rowHeaders) {
            // Check if parent is collapsed
            let parentCollapsed = false;
            if (rh._parentKey) {
                // Check if any ancestor is not expanded
                const parts = rh.values;
                for (let i = 1; i < parts.length; i++) {
                    const parentKey = parts.slice(0, i).join('|');
                    if (!expandedRows.has(parentKey)) {
                        parentCollapsed = true;
                        break;
                    }
                }
            }
            if (parentCollapsed) continue;
            visible.push(rh);
        }

        return visible;
    }

    buildHeaderRows() {
        if (this.colGroupBys.length === 0) {
            return [[]]; // No column groupBy
        }

        const maxDepth = this.colGroupBys.length;
        const rows = [];
        const numM = Math.max(1, this.activeMeasures.length);

        for (let lvl = 0; lvl < maxDepth; lvl++) {
            const headerRow = [];

            for (const ch of this.colHeaders) {
                if (ch.depth !== lvl) continue;

                // Calculate colspan
                let colspan = 1;
                if (ch.isLeaf) {
                    colspan = numM;
                } else {
                    // Count leaf descendants
                    const prefix = ch.values.slice(0, lvl + 1).join('|');
                    let count = 0;
                    for (const leaf of this.colHeaders) {
                        if (leaf.isLeaf && leaf.values.slice(0, lvl + 1).join('|') === prefix) count++;
                    }
                    colspan = Math.max(count, 1) * numM;
                }

                headerRow.push({
                    label: ch.label,
                    values: ch.values,
                    depth: ch.depth,
                    isLeaf: ch.isLeaf,
                    colspan: colspan,
                });
            }

            rows.push(headerRow);
        }

        // Add measure row at the bottom
        const measureRow = [];
        for (const ch of this.colHeaders) {
            if (!ch.isLeaf) continue;
            for (const m of this.activeMeasures) {
                measureRow.push({
                    label: '',
                    measure: m,
                    values: ch.values,
                    depth: ch.depth,
                    isLeaf: true,
                    colspan: 1,
                });
            }
        }
        
        for (const m of this.activeMeasures) {
            measureRow.push({
                label: '',
                measure: m,
                isTotalColumn: true,
                colspan: 1,
            });
        }
        if (measureRow.length > 0) rows.push(measureRow);

        return rows;
    }
}

// ════════════════════════════════════════════════════════════════
//  PivotView — OWL Component
// ════════════════════════════════════════════════════════════════
class PivotView extends Component {
    static template = xml`
<div class="ls-pivot-view">
    <div class="ls-control-panel">
        <div class="ls-cp-top">
            <div class="ls-breadcrumb">
                <span class="ls-breadcrumb-item" t-esc="props.actionTitle || 'Records'"/>
            </div>
            <div class="ls-searchbar-row"></div>
        </div>
        <div class="ls-cp-bottom">
            <div class="ls-cp-action-buttons"></div>
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

    <!-- Toolbar: Row/Col/Measures config -->
    <div class="ls-pivot-toolbar">
        <div class="ls-pivot-config">
            <div class="ls-pivot-axis-group">
                <label class="ls-pivot-label">Rows:</label>
                <div class="ls-pivot-tag-list">
                    <t t-foreach="state.rowGroupBys" t-as="rb" t-key="'rb_' + rb + '_' + state.rowGroupBys.indexOf(rb)">
                        <span class="ls-pivot-tag">
                            <t t-esc="formatGroupByLabel(rb)"/>
                            <button class="ls-pivot-tag-remove" t-on-click="() => this.removeRowGroupBy(state.rowGroupBys.indexOf(rb))">×</button>
                        </span>
                    </t>
                    <select class="ls-pivot-select-sm" t-on-change="onAddRowGroupBy">
                        <option value="">+ Add Row</option>
                        <t t-foreach="availableDimensions" t-as="d" t-key="'ad_' + d.field">
                            <option t-if="!isGroupByUsed(d.field, state.rowGroupBys)" t-att-value="d.field" t-esc="d.label"/>
                        </t>
                    </select>
                </div>
            </div>
            <div class="ls-pivot-axis-group">
                <label class="ls-pivot-label">Columns:</label>
                <div class="ls-pivot-tag-list">
                    <t t-foreach="state.colGroupBys" t-as="cb" t-key="'cb_' + cb + '_' + state.colGroupBys.indexOf(cb)">
                        <span class="ls-pivot-tag">
                            <t t-esc="formatGroupByLabel(cb)"/>
                            <button class="ls-pivot-tag-remove" t-on-click="() => this.removeColGroupBy(state.colGroupBys.indexOf(cb))">×</button>
                        </span>
                    </t>
                    <select class="ls-pivot-select-sm" t-on-change="onAddColGroupBy">
                        <option value="">+ Add Column</option>
                        <t t-foreach="availableDimensions" t-as="d" t-key="'acd_' + d.field">
                            <option t-if="!isGroupByUsed(d.field, state.colGroupBys)" t-att-value="d.field" t-esc="d.label"/>
                        </t>
                    </select>
                </div>
            </div>
            <div class="ls-pivot-axis-group">
                <label class="ls-pivot-label">Measures:</label>
                <div class="ls-pivot-tag-list">
                    <t t-foreach="state.activeMeasures" t-as="am" t-key="'am_' + am + '_' + state.activeMeasures.indexOf(am)">
                        <span class="ls-pivot-tag ls-pivot-tag-measure">
                            <t t-esc="getFieldLabel(am)"/>
                            <button class="ls-pivot-tag-remove" t-on-click="() => this.removeMeasure(state.activeMeasures.indexOf(am))">×</button>
                        </span>
                    </t>
                    <select class="ls-pivot-select-sm" t-on-change="onAddMeasure">
                        <option value="">+ Add Measure</option>
                        <t t-foreach="availableMeasures" t-as="m" t-key="'meas_' + m.field">
                            <option t-if="!state.activeMeasures.includes(m.field)" t-att-value="m.field" t-esc="m.label"/>
                        </t>
                    </select>
                </div>
            </div>
        </div>
        <div class="ls-pivot-actions">
            <button class="ls-btn ls-btn-sm" t-on-click="flipAxes" title="Flip Rows/Columns">⇄ Flip</button>
            <button class="ls-btn ls-btn-sm" t-on-click="expandAll" title="Expand All">⊞ Expand</button>
            <button class="ls-btn ls-btn-sm" t-on-click="collapseAll" title="Collapse All">⊟ Collapse</button>
            <button class="ls-btn ls-btn-sm ls-btn-primary" t-on-click="exportCSV" title="Export CSV">📥 Export</button>
        </div>
    </div>

    <t t-if="state.loading">
        <div class="ls-loading"><div class="ls-spinner"/> Loading Pivot...</div>
    </t>
    <t t-elif="!hasData">
        <div class="ls-empty-state">
            <div class="ls-empty-text">No data. Configure rows, columns, and measures above.</div>
        </div>
    </t>
    <t t-else="">
        <div class="ls-pivot-scroll">
            <table class="ls-pivot-table">
                <thead>
                    <t t-foreach="headerRows" t-as="hRow" t-key="'hr_' + hRow_index">
                        <tr class="ls-pivot-header-row">
                            <t t-if="hRow_index === 0">
                                <th class="ls-pivot-corner" t-att-rowspan="headerRows.length > 1 ? headerRows.length - 1 : 1">
                                    <t t-esc="cornerLabel"/>
                                </th>
                            </t>
                            <t t-foreach="hRow" t-as="hCell" t-key="'hc_' + hRow_index + '_' + hCell_index">
                                <th t-att-class="'ls-pivot-col-header' + (hCell.isLeaf ? ' ls-pivot-col-header-leaf' : '') + (hCell.isTotalColumn ? ' ls-pivot-total-header' : '')"
                                    t-att-colspan="hCell.colspan || 1">
                                    <t t-if="hCell.measure">
                                        <span class="ls-pivot-measure-label" t-esc="getFieldLabel(hCell.measure)"/>
                                    </t>
                                    <t t-else="">
                                        <span t-esc="hCell.label"/>
                                    </t>
                                </th>
                            </t>
                            <t t-if="hRow_index === 0">
                                <th class="ls-pivot-total-header" t-att-colspan="renderMeasures.length" t-att-rowspan="headerRows.length > 1 ? headerRows.length - 1 : 1">Total</th>
                            </t>
                        </tr>
                    </t>
                    <t t-if="headerRows.length === 0 || (headerRows.length === 1 &amp;&amp; headerRows[0].length === 0)">
                        <tr class="ls-pivot-header-row">
                            <th class="ls-pivot-corner"/>
                            <t t-foreach="renderMeasures" t-as="am" t-key="'hm_' + am_index">
                                <th class="ls-pivot-col-header ls-pivot-col-header-leaf">
                                    <span class="ls-pivot-measure-label" t-esc="getFieldLabel(am)"/>
                                </th>
                            </t>
                            <th class="ls-pivot-total-header" t-att-colspan="renderMeasures.length">Total</th>
                        </tr>
                    </t>
                </thead>
                <tbody>
                    <t t-foreach="visibleRows" t-as="row" t-key="'row_' + row_index">
                        <tr t-att-class="'ls-pivot-row' + (row.isTotal ? ' ls-pivot-total-row' : '')">
                            <td t-att-class="'ls-pivot-row-header' + (row.isLeaf ? ' ls-pivot-row-leaf' : '')"
                                t-att-style="'padding-left:' + (12 + row.indent * 20) + 'px'">
                                <t t-if="!row.isLeaf &amp;&amp; row.indent &lt; state.rowGroupBys.length">
                                    <button class="ls-pivot-expand-btn"
                                            t-on-click="() => this.toggleRowExpand(row)">
                                        <t t-if="isRowExpanded(row)">▼</t>
                                        <t t-else="">▶</t>
                                    </button>
                                </t>
                                <t t-else="">
                                    <span class="ls-pivot-expand-spacer"/>
                                </t>
                                <span class="ls-pivot-row-label" t-esc="row.label"/>
                            </td>
                            <t t-foreach="visibleColLeafs" t-as="ch" t-key="'cell_' + row_index + '_' + ch_index">
                                <t t-foreach="renderMeasures" t-as="m" t-key="'dm_' + row_index + '_' + ch_index + '_' + m_index">
                                    <td class="ls-pivot-cell"
                                        t-on-click="() => this.onCellClick(row, ch)"
                                        t-att-title="'Click to view records'">
                                        <t t-esc="formatValue(getCellVal(row, ch, m))"/>
                                    </td>
                                </t>
                            </t>
                            <t t-foreach="renderMeasures" t-as="m" t-key="'rtm_' + row_index + '_' + m_index">
                                <td class="ls-pivot-cell ls-pivot-total-cell" t-esc="formatValue(getRowTotalVal(row, m))"/>
                            </t>
                        </tr>
                    </t>
                    <tr class="ls-pivot-grand-total">
                        <td class="ls-pivot-row-header"><strong>Grand Total</strong></td>
                        <t t-foreach="visibleColLeafs" t-as="ch" t-key="'gt_' + ch_index">
                            <t t-foreach="renderMeasures" t-as="m" t-key="'gtm_' + ch_index + '_' + m_index">
                                <td class="ls-pivot-cell ls-pivot-total-cell" t-esc="formatValue(getColTotalVal(ch, m))"/>
                            </t>
                        </t>
                        <t t-foreach="renderMeasures" t-as="m" t-key="'gtrtm_' + m_index">
                            <td class="ls-pivot-cell ls-pivot-grand-cell" t-esc="formatValue(getGrandTotalVal(m))"/>
                        </t>
                    </tr>
                </tbody>
            </table>
        </div>
    </t>
</div>
    `;

    static props = {
        model: { type: String },
        pivotViewDef: { type: Object, optional: true },
        domain: { type: Array, optional: true },
        actionTitle: { type: String, optional: true },
        actionContext: { type: Object, optional: true },
        viewModes: { type: Array, optional: true },
        activeViewType: { type: String, optional: true },
        onSwitchView: { type: Function, optional: true },
    };

    setup() {
        this._model = this.props.model || 'task';
        this._pm = new PivotModel();
        const vd = this.props.pivotViewDef || {};
        const ctx = this.props.actionContext || {};
        // Support both 'domain' and 'actionDomain' prop names
        this._domain = this.props.domain || [];

        // Context-driven config (Odoo pattern)
        const ctxRow = ctx.pivot_row_groupby || [];
        const ctxCol = ctx.pivot_col_groupby || [];
        const ctxMeasures = ctx.pivot_measures || [];

        this.state = useState({
            loading: true,
            rowGroupBys: ctxRow.length > 0 ? [...ctxRow] : [...(vd.row_groupby || [])],
            colGroupBys: ctxCol.length > 0 ? [...ctxCol] : [...(vd.col_groupby || [])],
            activeMeasures: ctxMeasures.length > 0 ? [...ctxMeasures] : [...(vd.measures || [])],
            fields: {},
            expandedRows: new Set(),
        });

        this._dimensions = [];
        this._measures = [];

        onWillStart(async () => {
            const fields = await RPC.fieldsGet(this._model);
            this.state.fields = fields;
            this._computeDimensions();
            await this.loadData();
        });
    }

    _computeDimensions() {
        const vd = this.props.pivotViewDef || {};
        const fields = this.state.fields;

        if (vd.dimensions && vd.dimensions.length > 0) {
            this._dimensions = vd.dimensions.map(d => ({ field: d, label: fields[d]?.string || d }));
        } else {
            this._dimensions = Object.entries(fields)
                .filter(([k, v]) => v.groupable || ['many2one', 'selection', 'boolean', 'date', 'datetime'].includes(v.type))
                .map(([k, v]) => ({ field: k, label: v.string || k }));
        }

        const countMe = { field: '__count', label: 'Count' };
        let userMe = [];
        if (vd.measures && vd.measures.length > 0) {
            userMe = vd.measures.map(m => ({ field: m, label: fields[m]?.string || m }));
        } else {
            userMe = Object.entries(fields)
                .filter(([k, v]) => ['integer', 'float', 'monetary'].includes(v.type) && k !== 'id' && !k.endsWith('_id'))
                .map(([k, v]) => ({ field: k, label: v.string || k }));
        }
        this._measures = [countMe, ...userMe].sort((a, b) => a.label.localeCompare(b.label));
    }

    get availableDimensions() { return this._dimensions; }
    get availableMeasures() { return this._measures; }

    get hasData() {
        return !this.state.loading && this._pm.rawGroups.length > 0;
    }

    get cornerLabel() {
        return this.state.rowGroupBys.length > 0 ? this.getFieldLabel(this.state.rowGroupBys[0]) : '';
    }

    get headerRows() {
        return this._pm.buildHeaderRows();
    }

    get visibleRows() {
        return this._pm.getVisibleRows(this.state.expandedRows);
    }

    get visibleColLeafs() {
        return this._pm.colHeaders.filter(ch => ch.isLeaf);
    }

    get grandTotal() {
        const m = this.state.activeMeasures[0] || '__count';
        return this._pm.getGrandTotal(m);
    }

    getFieldLabel(f) {
        if (f === '__count') return 'Count';
        // Handle field:interval format for date fields
        const fieldName = f.includes(':') ? f.split(':')[0] : f;
        return this.state.fields[fieldName]?.string || fieldName;
    }

    formatGroupByLabel(gb) {
        if (gb === '__count') return 'Count';
        const parts = gb.split(':');
        const fieldName = parts[0];
        const interval = parts[1];
        const label = this.state.fields[fieldName]?.string || fieldName;
        if (interval) {
            const intervalLabels = { day: 'Day', week: 'Week', month: 'Month', quarter: 'Quarter', year: 'Year' };
            return label + ' (' + (intervalLabels[interval] || interval) + ')';
        }
        return label;
    }

    isGroupByUsed(field, groupByList) {
        return groupByList.some(gb => gb === field || gb.startsWith(field + ':'));
    }

    _isDateField(fieldName) {
        const f = this.state.fields[fieldName];
        return f && (f.type === 'date' || f.type === 'datetime');
    }

    formatValue(v) {
        if (v === null || v === undefined || v === 0) return '—';
        return Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
    }

    async loadData() {
        this.state.loading = true;
        try {
            await this._pm.load(
                this._model,
                this._domain,
                this.state.rowGroupBys,
                this.state.colGroupBys,
                this.state.activeMeasures
            );
        } catch (e) {
            console.error('Pivot load error:', e);
        }
        this.state.loading = false;
    }

    // ── Row groupBy management ──
    onAddRowGroupBy(ev) {
        const val = ev.target.value;
        if (!val || this.isGroupByUsed(val, this.state.rowGroupBys)) return;
        // For date fields, add with default month interval
        const gbValue = this._isDateField(val) ? val + ':month' : val;
        this.state.rowGroupBys.push(gbValue);
        ev.target.value = '';
        this.loadData();
    }

    removeRowGroupBy(idx) {
        this.state.rowGroupBys.splice(idx, 1);
        this.loadData();
    }

    onAddColGroupBy(ev) {
        const val = ev.target.value;
        if (!val || this.isGroupByUsed(val, this.state.colGroupBys)) return;
        // For date fields, add with default month interval
        const gbValue = this._isDateField(val) ? val + ':month' : val;
        this.state.colGroupBys.push(gbValue);
        ev.target.value = '';
        this.loadData();
    }

    removeColGroupBy(idx) {
        this.state.colGroupBys.splice(idx, 1);
        this.loadData();
    }

    onAddMeasure(ev) {
        const val = ev.target.value;
        if (!val || this.state.activeMeasures.includes(val)) return;
        this.state.activeMeasures.push(val);
        ev.target.value = '';
        this.loadData();
    }

    removeMeasure(idx) {
        this.state.activeMeasures.splice(idx, 1);
        this.loadData();
    }

    // ── Actions ──
    flipAxes() {
        const tmp = [...this.state.rowGroupBys];
        this.state.rowGroupBys = [...this.state.colGroupBys];
        this.state.colGroupBys = tmp;
        this.loadData();
    }

    expandAll() {
        for (const rh of this._pm.rowHeaders) {
            if (!rh.isLeaf && !rh.isTotal) {
                this.state.expandedRows.add(rh.values.join('|'));
            }
        }
    }

    collapseAll() {
        this.state.expandedRows.clear();
    }

    toggleRowExpand(row) {
        const key = row.values.join('|');
        if (this.state.expandedRows.has(key)) {
            this.state.expandedRows.delete(key);
        } else {
            this.state.expandedRows.add(key);
        }
    }

    isRowExpanded(row) {
        return this.state.expandedRows.has(row.values.join('|'));
    }

    get renderMeasures() {
        return this.state.activeMeasures.length > 0 ? this.state.activeMeasures : ['__count'];
    }

    // ── Cell data access ──
    getCellVal(row, colLeaf, m) {
        m = m || this.state.activeMeasures[0] || '__count';
        return this._pm.getCellValue(row.values, colLeaf.values, m);
    }

    getRowTotalVal(row, m) {
        m = m || this.state.activeMeasures[0] || '__count';
        if (row.isTotal) return this._pm.getGrandTotal(m);
        return this._pm.getRowTotal(row.values, m);
    }

    getColTotalVal(colLeaf, m) {
        m = m || this.state.activeMeasures[0] || '__count';
        return this._pm.getColTotal(colLeaf.values, m);
    }

    getGrandTotalVal(m) {
        m = m || this.state.activeMeasures[0] || '__count';
        return this._pm.getGrandTotal(m);
    }

    // ── Drill-down ──
    onCellClick(row, colLeaf) {
        const val = this.getCellVal(row, colLeaf);
        if (!val || val === 0) return;
        if (!this.props.onSwitchView) return;

        const domain = [...this._domain];
        for (let i = 0; i < row.values.length; i++) {
            if (row.values[i] !== undefined && row.values[i] !== null) {
                domain.push([this.state.rowGroupBys[i], '=', row.values[i]]);
            }
        }
        for (let i = 0; i < colLeaf.values.length; i++) {
            if (colLeaf.values[i] !== undefined && colLeaf.values[i] !== null) {
                domain.push([this.state.colGroupBys[i], '=', colLeaf.values[i]]);
            }
        }
        window.__pivotDrillDomain = domain;
        this.props.onSwitchView('list');
    }

    // ── Export ──
    exportCSV() {
        const rows = this.visibleRows;
        const colLeafs = this.visibleColLeafs;
        const measures = this.renderMeasures;

        let csv = '"' + this.cornerLabel + '"';
        
        // Col header row
        for (const ch of colLeafs) {
            for (const m of measures) {
                csv += ',"' + ch.label + ' (' + this.getFieldLabel(m) + ')"';
            }
        }
        for (const m of measures) {
            csv += ',"Total (' + this.getFieldLabel(m) + ')"';
        }
        csv += '\n';

        for (const row of rows) {
            const indent = '\t'.repeat(row.indent);
            csv += '"' + indent + row.label + '"';
            for (const ch of colLeafs) {
                for (const m of measures) {
                    csv += ',' + (this.getCellVal(row, ch, m) || 0);
                }
            }
            for (const m of measures) {
                csv += ',' + this.getRowTotalVal(row, m);
            }
            csv += '\n';
        }

        csv += '"Grand Total"';
        for (const ch of colLeafs) {
            for (const m of measures) {
                csv += ',' + this.getColTotalVal(ch, m);
            }
        }
        for (const m of measures) {
            csv += ',' + this.getGrandTotalVal(m);
        }
        csv += '\n';

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this._model}_pivot_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }
}

window.PivotView = PivotView;
})();
