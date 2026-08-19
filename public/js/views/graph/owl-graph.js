// ══════════════════════════════════════════════════════════════════
//  GraphView — Odoo-style chart visualization (bar, line, pie)
//  Uses Chart.js CDN for rendering
// ══════════════════════════════════════════════════════════════════
(function () {
const { Component, useState, onWillStart, onMounted, onPatched, useRef, xml } = owl;
const RPC = window.LarasoftRPC;

function esc(v) { return v == null ? '' : String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const CHART_COLORS = [
    'rgba(99, 102, 241, 0.8)',   // indigo
    'rgba(59, 130, 246, 0.8)',   // blue
    'rgba(16, 185, 129, 0.8)',   // emerald
    'rgba(245, 158, 11, 0.8)',   // amber
    'rgba(239, 68, 68, 0.8)',    // red
    'rgba(139, 92, 246, 0.8)',   // violet
    'rgba(236, 72, 153, 0.8)',   // pink
    'rgba(14, 165, 233, 0.8)',   // sky
    'rgba(168, 85, 247, 0.8)',   // purple
    'rgba(234, 179, 8, 0.8)',    // yellow
];

class GraphView extends Component {
    static template = xml`
<div class="ls-graph-view">
    <div class="ls-control-panel">
        <div class="ls-cp-top">
            <div class="ls-breadcrumb">
                <span class="ls-breadcrumb-item" t-esc="props.actionTitle || 'Records'"/>
            </div>
            <div class="ls-searchbar-row"></div>
        </div>
        <div class="ls-cp-bottom">
            <div class="ls-cp-action-buttons">
                <!-- actions can go here -->
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
    <div class="ls-graph-toolbar">
        <div class="ls-graph-type-switcher">
            <button t-att-class="'ls-btn ls-btn-sm' + (state.chartType === 'bar' ? ' active' : '')"
                    t-on-click="() => this.setChartType('bar')">
                <span class="ls-graph-icon">📊</span> Bar
            </button>
            <button t-att-class="'ls-btn ls-btn-sm' + (state.chartType === 'line' ? ' active' : '')"
                    t-on-click="() => this.setChartType('line')">
                <span class="ls-graph-icon">📈</span> Line
            </button>
            <button t-att-class="'ls-btn ls-btn-sm' + (state.chartType === 'pie' ? ' active' : '')"
                    t-on-click="() => this.setChartType('pie')">
                <span class="ls-graph-icon">🥧</span> Pie
            </button>
        </div>
        <div class="ls-graph-config">
            <label class="ls-graph-label">Measure:</label>
            <select class="ls-graph-select" t-on-change="onMeasureChange">
                <t t-foreach="availableMeasures" t-as="m" t-key="m.field">
                    <option t-att-value="m.field" t-att-selected="state.measure === m.field" t-esc="m.label"/>
                </t>
            </select>
            <label class="ls-graph-label" style="margin-left:12px;">Group By:</label>
            <select class="ls-graph-select" t-on-change="onDimensionChange">
                <t t-foreach="availableDimensions" t-as="d" t-key="d.field">
                    <option t-att-value="d.field" t-att-selected="state.groupBy === d.field" t-esc="d.label"/>
                </t>
            </select>
            <label class="ls-graph-label" style="margin-left:12px;">
                <input type="checkbox" t-att-checked="state.stacked" t-on-change="onStackedChange"/> Stacked
            </label>
        </div>
    </div>
    <div class="ls-graph-container">
        <t t-if="state.loading">
            <div class="ls-loading"><div class="ls-spinner"/> Loading Chart...</div>
        </t>
        <t t-else="">
            <canvas t-ref="chartCanvas" style="width:100%;max-height:500px;"/>
        </t>
    </div>
    <div class="ls-graph-summary" t-if="!state.loading">
        <div class="ls-graph-stat">
            <span class="ls-graph-stat-label">Total:</span>
            <span class="ls-graph-stat-value" t-esc="formatNumber(state.total)"/>
        </div>
        <div class="ls-graph-stat">
            <span class="ls-graph-stat-label">Groups:</span>
            <span class="ls-graph-stat-value" t-esc="state.data.length"/>
        </div>
        <div class="ls-graph-stat">
            <span class="ls-graph-stat-label">Average:</span>
            <span class="ls-graph-stat-value" t-esc="formatNumber(state.average)"/>
        </div>
    </div>
</div>
    `;

    static props = {
        model: { type: String },
        graphViewDef: { type: Object, optional: true },
        domain: { type: Array, optional: true },
        actionTitle: { type: String, optional: true },
        viewModes: { type: Array, optional: true },
        activeViewType: { type: String, optional: true },
        onSwitchView: { type: Function, optional: true },
    };

    setup() {
        this._model = this.props.model || 'task';
        const vd = this.props.graphViewDef || {};
        this.chartRef = useRef('chartCanvas');
        this._chart = null;

        this.state = useState({
            loading: true,
            chartType: vd.graph_type || 'bar',
            measure: vd.measure || (vd.measures || [])[0] || null,
            groupBy: (vd.groupby || [])[0] || (vd.dimensions || [])[0] || null,
            stacked: vd.stacked || false,
            data: [],
            total: 0,
            average: 0,
            viewDef: vd,
            fields: {},
        });

        onWillStart(async () => {
            // Load Chart.js if not already loaded
            if (!window.Chart) {
                await this._loadChartJS();
            }
            const fields = await RPC.fieldsGet(this._model);
            this.state.fields = fields;
            await this.loadData();
        });

        onMounted(() => { this.renderChart(); });
        onPatched(() => { this.renderChart(); });
    }

    async _loadChartJS() {
        return new Promise((resolve) => {
            if (window.Chart) return resolve();
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    async loadData() {
        this.state.loading = true;
        const domain = this.props.domain || [];
        const measure = this.state.measure;
        const groupBy = this.state.groupBy;

        if (!measure || !groupBy) {
            this.state.data = [];
            this.state.loading = false;
            return;
        }

        try {
            const res = await RPC.readGroup(this._model, domain, [groupBy], [measure]);
            this.state.data = res.groups || [];
            this.state.total = this.state.data.reduce((s, d) => s + (d[measure + ':sum'] || 0), 0);
            this.state.average = this.state.data.length > 0 ? this.state.total / this.state.data.length : 0;
        } catch (e) {
            console.error('Graph load error:', e);
            this.state.data = [];
        }
        this.state.loading = false;
    }

    renderChart() {
        if (!this.chartRef.el || this.state.loading || !window.Chart) return;
        if (this._chart) this._chart.destroy();

        const ctx = this.chartRef.el.getContext('2d');
        const data = this.state.data;
        const measure = this.state.measure;
        const groupBy = this.state.groupBy;

        const labels = data.map(d => d[groupBy + '_label'] || d[groupBy] || 'Unknown');
        const values = data.map(d => d[measure + ':sum'] || d.__count || 0);

        const fDef = this.state.fields[measure];
        const measureLabel = fDef?.string || measure;

        const chartType = this.state.chartType === 'pie' ? 'pie' : this.state.chartType;

        this._chart = new Chart(ctx, {
            type: chartType,
            data: {
                labels,
                datasets: [{
                    label: measureLabel,
                    data: values,
                    backgroundColor: chartType === 'pie' ? CHART_COLORS.slice(0, values.length) : CHART_COLORS[0],
                    borderColor: chartType === 'line' ? CHART_COLORS[0] : 'transparent',
                    borderWidth: chartType === 'line' ? 3 : 0,
                    borderRadius: chartType === 'bar' ? 6 : 0,
                    fill: chartType === 'line' ? false : undefined,
                    tension: 0.3,
                    pointRadius: chartType === 'line' ? 5 : 0,
                    pointBackgroundColor: CHART_COLORS[0],
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: chartType === 'pie', position: 'right' },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        cornerRadius: 8,
                        padding: 12,
                    },
                },
                scales: chartType === 'pie' ? {} : {
                    x: {
                        stacked: this.state.stacked,
                        grid: { display: false },
                    },
                    y: {
                        stacked: this.state.stacked,
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.06)' },
                    },
                },
            },
        });
    }

    // ── Toolbar actions ─────────────────────────────
    get availableMeasures() {
        let measures = [];
        if (this.state.viewDef.measures && this.state.viewDef.measures.length > 0) {
            measures = this.state.viewDef.measures.map(m => ({
                field: m,
                label: this.state.fields[m]?.string || m,
            }));
        } else {
            // Auto-detect numeric fields if not explicitly defined
            measures = Object.entries(this.state.fields)
                .filter(([k, v]) => ['integer', 'float', 'monetary'].includes(v.type) && k !== 'id' && !k.endsWith('_id'))
                .map(([k, v]) => ({ field: k, label: v.string || k }));
        }
        return measures.sort((a, b) => a.label.localeCompare(b.label));
    }

    get availableDimensions() {
        let dims = [];
        if (this.state.viewDef.dimensions && this.state.viewDef.dimensions.length > 0) {
            dims = this.state.viewDef.dimensions.map(d => ({
                field: d,
                label: this.state.fields[d]?.string || d,
            }));
        } else {
            // Auto-detect groupable fields (categorical data)
            dims = Object.entries(this.state.fields)
                .filter(([k, v]) => v.groupable || ['many2one', 'selection', 'boolean', 'date', 'datetime'].includes(v.type))
                .map(([k, v]) => ({ field: k, label: v.string || k }));
        }
        return dims.sort((a, b) => a.label.localeCompare(b.label));
    }

    setChartType(type) {
        this.state.chartType = type;
        this.renderChart();
    }

    onMeasureChange(ev) {
        this.state.measure = ev.target.value;
        this.loadData();
    }

    onDimensionChange(ev) {
        this.state.groupBy = ev.target.value;
        this.loadData();
    }

    onStackedChange(ev) {
        this.state.stacked = ev.target.checked;
        this.renderChart();
    }

    formatNumber(n) {
        return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
}

window.GraphView = GraphView;
})();
