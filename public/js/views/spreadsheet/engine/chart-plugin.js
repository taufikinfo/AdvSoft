/**
 * Chart Plugin - Bar, Line, Pie, Doughnut, KPI Card, Gauge
 * Follows Odoo advsoft-spreadsheet chart plugin pattern
 */
(function() {
    'use strict';

    const ChartType = Object.freeze({
        BAR: 'bar',
        LINE: 'line',
        PIE: 'pie',
        DOUGHNUT: 'doughnut',
        KPI: 'kpi',
        GAUGE: 'gauge',
        SPARKLINE: 'sparkline',
    });

    const DEFAULT_CHART_COLORS = [
        '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
        '#ec4899', '#f43f5e', '#ef4444', '#f97316',
        '#f59e0b', '#eab308', '#84cc16', '#22c55e',
        '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    ];

    class ChartPlugin extends window.SpreadsheetUIPlugin {
        constructor(config) {
            super(config);
            this._charts = new Map();
            this._floatingCharts = new Map();
            this._canvasCache = new Map();
        }

        _onSetup() {
            this.model.on('chartAdded', (data) => this._renderChart(data.chart));
            this.model.on('chartUpdated', (data) => this._renderChart(data.chart));
            this.model.on('chartRemoved', (data) => this._removeChart(data.id));
            this.model.on('stateChanged', () => this._renderAllCharts());
        }

        _onDestroy() {
            this._canvasCache.clear();
        }

        addChart(config) {
            const id = config.id || 'chart_' + Date.now();
            const chart = {
                id,
                type: config.type || ChartType.BAR,
                title: config.title || 'Chart',
                x: config.x || 20,
                y: config.y || 20,
                width: config.width || 480,
                height: config.height || 300,
                labelCol: config.labelCol ?? 0,
                dataCols: config.dataCols || [1],
                series: config.series || [],
                colors: config.colors || [...DEFAULT_CHART_COLORS],
                showLegend: config.showLegend !== false,
                stacked: config.stacked || false,
                horizontal: config.horizontal || false,
                showGridLines: config.showGridLines !== false,
                showValues: config.showValues || false,
                decimals: config.decimals ?? 2,
                titleFontSize: config.titleFontSize || 14,
                animationDuration: config.animationDuration || 300,
            };

            this._charts.set(id, chart);
            this.model.addChart(chart);
            return chart;
        }

        updateChart(id, updates) {
            const chart = this._charts.get(id);
            if (!chart) return;
            Object.assign(chart, updates);
            this.model.updateChart(id, updates);
        }

        removeChart(id) {
            this._charts.delete(id);
            this.model.removeChart(id);
            this._removeCanvas(id);
        }

        getChart(id) {
            return this._charts.get(id) || null;
        }

        getAllCharts() {
            return [...this._charts.values()];
        }

        _renderChart(chart) {
            this._charts.set(chart.id, chart);
            setTimeout(() => {
                const canvas = document.getElementById(chart.id);
                if (canvas) {
                    this._drawChart(canvas, chart);
                }
            }, 50);
        }

        _removeChart(id) {
            this._charts.delete(id);
            this._removeCanvas(id);
        }

        _removeCanvas(id) {
            const canvas = document.getElementById(id);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        _renderAllCharts() {
            for (const [id, chart] of this._charts) {
                const canvas = document.getElementById(id);
                if (canvas) {
                    this._drawChart(canvas, chart);
                }
            }
        }

        _drawChart(canvas, chart) {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, rect.width, rect.height);

            const data = this._getChartData(chart);
            if (!data || data.labels.length === 0) {
                ctx.fillStyle = '#9ca3af';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('No data available', rect.width / 2, rect.height / 2);
                return;
            }

            switch (chart.type) {
                case ChartType.BAR:
                    this._drawBarChart(ctx, rect, chart, data);
                    break;
                case ChartType.LINE:
                    this._drawLineChart(ctx, rect, chart, data);
                    break;
                case ChartType.PIE:
                    this._drawPieChart(ctx, rect, chart, data);
                    break;
                case ChartType.DOUGHNUT:
                    this._drawDoughnutChart(ctx, rect, chart, data);
                    break;
                case ChartType.KPI:
                    this._drawKPI(ctx, rect, chart, data);
                    break;
                case ChartType.GAUGE:
                    this._drawGauge(ctx, rect, chart, data);
                    break;
                case ChartType.SPARKLINE:
                    this._drawSparkline(ctx, rect, chart, data);
                    break;
            }
        }

        _getChartData(chart) {
            const labels = [];
            const datasets = [];

            for (let r = 1; r < this.model.rowCount; r++) {
                const label = this.model.getCellRaw(chart.labelCol, r);
                if (label === '' || label === null || label === undefined) continue;
                labels.push(String(label));
            }

            for (const colIdx of chart.dataCols) {
                const values = [];
                for (let r = 1; r < this.model.rowCount; r++) {
                    const val = this.model.getCellValue(colIdx, r);
                    values.push(typeof val === 'number' ? val : 0);
                }
                datasets.push({
                    label: this.model.getCellRaw(colIdx, 0) || `Series ${datasets.length + 1}`,
                    data: values,
                    color: chart.colors[datasets.length % chart.colors.length],
                });
            }

            return { labels, datasets };
        }

        _drawBarChart(ctx, rect, chart, data) {
            const padding = { top: 40, right: 20, bottom: 60, left: 60 };
            const chartW = rect.width - padding.left - padding.right;
            const chartH = rect.height - padding.top - padding.bottom;

            this._drawTitle(ctx, chart.title, rect.width);
            this._drawAxes(ctx, padding, chartW, chartH);

            const allValues = data.datasets.flatMap(d => d.data);
            const maxVal = Math.max(...allValues, 1);
            const barGroupWidth = chartW / data.labels.length;
            const barWidth = Math.min(barGroupWidth * 0.7 / data.datasets.length, 40);

            for (let di = 0; di < data.datasets.length; di++) {
                const dataset = data.datasets[di];
                for (let i = 0; i < data.labels.length; i++) {
                    const val = dataset.data[i] || 0;
                    const barH = (val / maxVal) * chartH;
                    const x = padding.left + i * barGroupWidth + (barGroupWidth - barWidth * data.datasets.length) / 2 + di * barWidth;
                    const y = padding.top + chartH - barH;

                    ctx.fillStyle = dataset.color;
                    this._roundedRect(ctx, x, y, barWidth - 2, barH, 3);
                    ctx.fill();

                    if (chart.showValues) {
                        ctx.fillStyle = '#374151';
                        ctx.font = '10px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(val.toFixed(chart.decimals), x + barWidth / 2, y - 4);
                    }
                }
            }

            this._drawXLabels(ctx, data.labels, padding, chartW, barGroupWidth);
            if (chart.showLegend) this._drawLegend(ctx, data.datasets, rect);
        }

        _drawLineChart(ctx, rect, chart, data) {
            const padding = { top: 40, right: 20, bottom: 60, left: 60 };
            const chartW = rect.width - padding.left - padding.right;
            const chartH = rect.height - padding.top - padding.bottom;

            this._drawTitle(ctx, chart.title, rect.width);
            this._drawAxes(ctx, padding, chartW, chartH);

            const allValues = data.datasets.flatMap(d => d.data);
            const maxVal = Math.max(...allValues, 1);
            const stepX = chartW / (data.labels.length - 1 || 1);

            for (const dataset of data.datasets) {
                ctx.beginPath();
                ctx.strokeStyle = dataset.color;
                ctx.lineWidth = 2;

                for (let i = 0; i < dataset.data.length; i++) {
                    const x = padding.left + i * stepX;
                    const y = padding.top + chartH - (dataset.data[i] / maxVal) * chartH;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();

                for (let i = 0; i < dataset.data.length; i++) {
                    const x = padding.left + i * stepX;
                    const y = padding.top + chartH - (dataset.data[i] / maxVal) * chartH;
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                    ctx.fillStyle = dataset.color;
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }

            this._drawXLabels(ctx, data.labels, padding, chartW, stepX);
            if (chart.showLegend) this._drawLegend(ctx, data.datasets, rect);
        }

        _drawPieChart(ctx, rect, chart, data) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2 + 10;
            const radius = Math.min(rect.width, rect.height) / 2 - 50;

            this._drawTitle(ctx, chart.title, rect.width);

            const total = data.datasets[0]?.data.reduce((a, b) => a + b, 0) || 1;
            let startAngle = -Math.PI / 2;

            for (let i = 0; i < data.labels.length; i++) {
                const val = data.datasets[0]?.data[i] || 0;
                const sliceAngle = (val / total) * Math.PI * 2;

                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
                ctx.closePath();
                ctx.fillStyle = chart.colors[i % chart.colors.length];
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                const midAngle = startAngle + sliceAngle / 2;
                const labelR = radius * 0.65;
                const lx = centerX + Math.cos(midAngle) * labelR;
                const ly = centerY + Math.sin(midAngle) * labelR;

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const pct = ((val / total) * 100).toFixed(1);
                if (pct > 5) ctx.fillText(`${pct}%`, lx, ly);

                startAngle += sliceAngle;
            }

            if (chart.showLegend) this._drawLegend(ctx, data.datasets, rect);
        }

        _drawDoughnutChart(ctx, rect, chart, data) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2 + 10;
            const outerR = Math.min(rect.width, rect.height) / 2 - 50;
            const innerR = outerR * 0.5;

            this._drawTitle(ctx, chart.title, rect.width);

            const total = data.datasets[0]?.data.reduce((a, b) => a + b, 0) || 1;
            let startAngle = -Math.PI / 2;

            for (let i = 0; i < data.labels.length; i++) {
                const val = data.datasets[0]?.data[i] || 0;
                const sliceAngle = (val / total) * Math.PI * 2;

                ctx.beginPath();
                ctx.arc(centerX, centerY, outerR, startAngle, startAngle + sliceAngle);
                ctx.arc(centerX, centerY, innerR, startAngle + sliceAngle, startAngle, true);
                ctx.closePath();
                ctx.fillStyle = chart.colors[i % chart.colors.length];
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                startAngle += sliceAngle;
            }

            ctx.fillStyle = '#374151';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(total.toLocaleString(), centerX, centerY);

            if (chart.showLegend) this._drawLegend(ctx, data.datasets, rect);
        }

        _drawKPI(ctx, rect, chart, data) {
            this._drawTitle(ctx, chart.title, rect.width);

            const value = data.datasets[0]?.data[0] || 0;
            const prevValue = data.datasets[0]?.data[1] || value;
            const change = prevValue ? ((value - prevValue) / prevValue) * 100 : 0;

            ctx.font = 'bold 48px Arial';
            ctx.fillStyle = '#1f2937';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this._formatNumber(value), rect.width / 2, rect.height / 2 - 10);

            ctx.font = '16px Arial';
            ctx.fillStyle = change >= 0 ? '#10b981' : '#ef4444';
            const arrow = change >= 0 ? '▲' : '▼';
            ctx.fillText(`${arrow} ${Math.abs(change).toFixed(1)}%`, rect.width / 2, rect.height / 2 + 30);
        }

        _drawGauge(ctx, rect, chart, data) {
            const centerX = rect.width / 2;
            const centerY = rect.height * 0.65;
            const radius = Math.min(rect.width, rect.height) * 0.4;

            this._drawTitle(ctx, chart.title, rect.width);

            const value = data.datasets[0]?.data[0] || 0;
            const maxVal = chart.maxValue || 100;
            const pct = Math.min(value / maxVal, 1);

            const startAngle = Math.PI;
            const endAngle = 2 * Math.PI;
            const arcAngle = startAngle + pct * Math.PI;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 20;
            ctx.lineCap = 'round';
            ctx.stroke();

            const gradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
            gradient.addColorStop(0, '#ef4444');
            gradient.addColorStop(0.5, '#f59e0b');
            gradient.addColorStop(1, '#10b981');

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, arcAngle);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 20;
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.font = 'bold 28px Arial';
            ctx.fillStyle = '#1f2937';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${(pct * 100).toFixed(0)}%`, centerX, centerY);
        }

        _drawSparkline(ctx, rect, chart, data) {
            this._drawTitle(ctx, chart.title, rect.width);

            const values = data.datasets[0]?.data || [];
            if (values.length === 0) return;

            const padding = { top: 30, right: 10, bottom: 20, left: 10 };
            const w = rect.width - padding.left - padding.right;
            const h = rect.height - padding.top - padding.bottom;

            const min = Math.min(...values);
            const max = Math.max(...values);
            const range = max - min || 1;

            const points = values.map((v, i) => ({
                x: padding.left + (i / (values.length - 1)) * w,
                y: padding.top + h - ((v - min) / range) * h,
            }));

            const color = chart.colors[0] || '#6366f1';

            const gradient = ctx.createLinearGradient(0, padding.top, 0, rect.height - padding.bottom);
            gradient.addColorStop(0, color + '40');
            gradient.addColorStop(1, color + '05');

            ctx.beginPath();
            ctx.moveTo(points[0].x, rect.height - padding.bottom);
            for (const p of points) ctx.lineTo(p.x, p.y);
            ctx.lineTo(points[points.length - 1].x, rect.height - padding.bottom);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            for (let i = 0; i < points.length; i++) {
                if (i === 0) ctx.moveTo(points[i].x, points[i].y);
                else ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();

            const last = points[points.length - 1];
            ctx.beginPath();
            ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }

        _drawTitle(ctx, title, width) {
            if (!title) return;
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#1f2937';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(title, width / 2, 8);
        }

        _drawAxes(ctx, padding, chartW, chartH) {
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(padding.left, padding.top);
            ctx.lineTo(padding.left, padding.top + chartH);
            ctx.lineTo(padding.left + chartW, padding.top + chartH);
            ctx.stroke();
        }

        _drawXLabels(ctx, labels, padding, chartW, step) {
            ctx.fillStyle = '#6b7280';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            for (let i = 0; i < labels.length; i++) {
                const x = padding.left + i * step + step / 2;
                const label = String(labels[i]).substring(0, 10);
                ctx.fillText(label, x, padding.top + chartH + 8);
            }
        }

        _drawLegend(ctx, datasets, rect) {
            const startX = 10;
            const startY = rect.height - 20;
            ctx.font = '10px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            let x = startX;
            for (const ds of datasets) {
                ctx.fillStyle = ds.color;
                ctx.fillRect(x, startY - 5, 10, 10);
                x += 14;
                ctx.fillStyle = '#374151';
                ctx.fillText(ds.label, x, startY);
                x += ctx.measureText(ds.label).width + 16;
            }
        }

        _roundedRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }

        _formatNumber(num) {
            if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + 'B';
            if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + 'M';
            if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
            return num.toLocaleString();
        }

        exportJSON() {
            return {
                charts: [...this._charts.entries()],
            };
        }

        importJSON(data) {
            if (data.charts) {
                for (const [id, chart] of data.charts) {
                    this._charts.set(id, chart);
                }
            }
        }
    }

    window.SpreadsheetChartType = ChartType;
    window.SpreadsheetChartPlugin = ChartPlugin;
    window.DEFAULT_CHART_COLORS = DEFAULT_CHART_COLORS;
})();
