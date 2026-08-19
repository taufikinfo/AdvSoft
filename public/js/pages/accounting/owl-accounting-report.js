// ══════════════════════════════════════════════════════════════
//  AccountingReports — Owl Component
//  Financial reporting dashboard for the Accounting module.
// ══════════════════════════════════════════════════════════════
(function () {
const { Component, useState, useRef, onMounted } = owl;

class AccountingReports extends Component {
    static template = window.ACCOUNTING_REPORT_TPL;

    setup() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

        this.state = useState({
            activeReport: 'trial_balance',
            dateFrom: firstDay.toISOString().slice(0, 10),
            dateTo: today.toISOString().slice(0, 10),
            targetMove: 'posted',
            loading: false,
            data: null,
            glCollapsed: {},
        });

        this.reportRef = useRef('reportContent');

        onMounted(() => {
            this.loadReport();
        });
    }

    // ── Number formatter (Indonesian locale) ──
    fmt(value) {
        if (value == null || value === '') return '0,00';
        const n = Number(value) || 0;
        return n.toLocaleString('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    // ── Switch report type ──
    switchReport(type) {
        this.state.activeReport = type;
        this.state.data = null;
        this.loadReport();
    }

    // ── Toggle GL account section ──
    toggleGLSection(accountId) {
        this.state.glCollapsed[accountId] = !this.state.glCollapsed[accountId];
    }

    // ── Load report data from API ──
    async loadReport() {
        const endpoints = {
            trial_balance: '/api/accounting/trial-balance',
            general_ledger: '/api/accounting/general-ledger',
            balance_sheet: '/api/accounting/balance-sheet',
            income_statement: '/api/accounting/income-statement',
        };

        const url = endpoints[this.state.activeReport];
        if (!url) return;

        this.state.loading = true;
        this.state.data = null;

        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.content || window.__CSRF_TOKEN__;
            const resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    date_from: this.state.dateFrom,
                    date_to: this.state.dateTo,
                    target_move: this.state.targetMove,
                }),
            });

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            this.state.data = await resp.json();
        } catch (e) {
            console.error('Report load error:', e);
            this.state.data = null;
        } finally {
            this.state.loading = false;
        }
    }

    // ── Print report ──
    printReport() {
        const content = this.reportRef?.el;
        if (!content) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`<!DOCTYPE html>
<html><head>
<title>${this.state.data?.title || 'Laporan Keuangan'}</title>
<style>
    body { font-family: 'Inter', sans-serif; padding: 20px; color: #1a1a2e; }
    h2 { margin: 0 0 4px; font-size: 18px; }
    p { margin: 0 0 16px; color: #64748b; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
    th { background: #f1f5f9; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; font-weight: 600; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
    .ls-col-num { text-align: right; font-variant-numeric: tabular-nums; }
    .ls-report-total-row { background: #f8fafc; font-weight: 700; border-top: 2px solid #94a3b8; }
    .ls-report-subtotal { background: #f8fafc; }
    .ls-negative { color: #dc2626; }
    .ls-bs-section, .ls-is-section { margin-bottom: 20px; }
    .ls-bs-section-title, .ls-is-section-title { font-size: 14px; font-weight: 700; color: #1e293b; margin: 12px 0 6px; padding: 4px 0; border-bottom: 1px solid #e2e8f0; }
    .ls-is-summary { margin-top: 20px; border-top: 2px solid #1e293b; padding-top: 12px; }
    .ls-is-summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .ls-is-net-income { font-size: 16px; border-top: 2px solid #1e293b; margin-top: 8px; padding-top: 8px; }
    .ls-profit strong { color: #16a34a; }
    .ls-loss strong { color: #dc2626; }
    .ls-gl-account-header { font-weight: 700; background: #f1f5f9; padding: 8px; margin: 12px 0 4px; border-radius: 4px; }
    .ls-balanced { color: #16a34a; padding: 12px; text-align: center; }
    .ls-unbalanced { color: #dc2626; padding: 12px; text-align: center; }
    @media print { body { padding: 0; } }
</style>
</head><body>${content.innerHTML}</body></html>`);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 300);
    }
}

window.AccountingReports = AccountingReports;
})();
