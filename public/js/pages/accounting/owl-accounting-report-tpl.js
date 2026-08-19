// ══════════════════════════════════════════════════════════════
//  AccountingReports — Owl Template
//  Provides 4 financial reports: Trial Balance, General Ledger,
//  Balance Sheet, and Income Statement.
// ══════════════════════════════════════════════════════════════
(function () {
const xml = owl.xml;

window.ACCOUNTING_REPORT_TPL = xml`
<div class="ls-report-container">
    <!-- ── Report Toolbar ── -->
    <div class="ls-report-toolbar">
        <div class="ls-report-tabs">
            <button t-att-class="'ls-report-tab ' + (state.activeReport === 'trial_balance' ? 'active' : '')"
                    t-on-click="() => this.switchReport('trial_balance')">
                <span class="ls-report-tab-icon"><t t-out="window.lucideIcon('scale', 16)"/></span> Neraca Saldo
            </button>
            <button t-att-class="'ls-report-tab ' + (state.activeReport === 'general_ledger' ? 'active' : '')"
                    t-on-click="() => this.switchReport('general_ledger')">
                <span class="ls-report-tab-icon"><t t-out="window.lucideIcon('book', 16)"/></span> Buku Besar
            </button>
            <button t-att-class="'ls-report-tab ' + (state.activeReport === 'balance_sheet' ? 'active' : '')"
                    t-on-click="() => this.switchReport('balance_sheet')">
                <span class="ls-report-tab-icon"><t t-out="window.lucideIcon('bar-chart-2', 16)"/></span> Neraca
            </button>
            <button t-att-class="'ls-report-tab ' + (state.activeReport === 'income_statement' ? 'active' : '')"
                    t-on-click="() => this.switchReport('income_statement')">
                <span class="ls-report-tab-icon"><t t-out="window.lucideIcon('trending-up', 16)"/></span> Laba/Rugi
            </button>
        </div>
        <div class="ls-report-actions">
            <button class="ls-btn ls-btn-sm ls-btn-outline" t-on-click="printReport" title="Print" style="display:flex;align-items:center;gap:6px;">
                <t t-out="window.lucideIcon('printer', 14)"/> Cetak
            </button>
        </div>
    </div>

    <!-- ── Filters ── -->
    <div class="ls-report-filters">
        <div class="ls-report-filter-group">
            <label>Dari</label>
            <input type="date" t-model="state.dateFrom" t-on-change="loadReport"/>
        </div>
        <div class="ls-report-filter-group">
            <label>Sampai</label>
            <input type="date" t-model="state.dateTo" t-on-change="loadReport"/>
        </div>
        <div class="ls-report-filter-group">
            <label>Entri</label>
            <select t-model="state.targetMove" t-on-change="loadReport">
                <option value="posted">Sudah Diposting</option>
                <option value="all">Semua Entri</option>
            </select>
        </div>
        <button class="ls-btn ls-btn-primary ls-btn-sm" t-on-click="loadReport" style="display:flex;align-items:center;gap:6px;">
            <t t-out="window.lucideIcon('refresh-cw', 14)"/> Muat Ulang
        </button>
    </div>

    <!-- ── Loading ── -->
    <div class="ls-report-loading" t-if="state.loading">
        <div class="ls-report-spinner"></div>
        <span>Memuat laporan...</span>
    </div>

    <!-- ── Report Content ── -->
    <div class="ls-report-content" t-if="!state.loading" t-ref="reportContent">
        <!-- TRIAL BALANCE -->
        <t t-if="state.activeReport === 'trial_balance' and state.data">
            <div class="ls-report-header">
                <h2 class="ls-report-title" t-esc="state.data.title"/>
                <p class="ls-report-period" t-esc="'Periode: ' + state.data.period"/>
            </div>
            <table class="ls-report-table">
                <thead>
                    <tr>
                        <th class="ls-col-code">Kode</th>
                        <th class="ls-col-name">Nama Akun</th>
                        <th class="ls-col-group">Grup</th>
                        <th class="ls-col-num">Debit</th>
                        <th class="ls-col-num">Kredit</th>
                        <th class="ls-col-num">Saldo</th>
                    </tr>
                </thead>
                <tbody>
                    <t t-foreach="state.data.rows || state.data.lines || []" t-as="row" t-key="row.account_id || row_index">
                        <tr>
                            <td class="ls-col-code" t-esc="row.code"/>
                            <td class="ls-col-name" t-esc="row.name"/>
                            <td class="ls-col-group" t-esc="row.group_name"/>
                            <td class="ls-col-num" t-esc="fmt(row.total_debit)"/>
                            <td class="ls-col-num" t-esc="fmt(row.total_credit)"/>
                            <td t-att-class="'ls-col-num ' + (row.balance &lt; 0 ? 'ls-negative' : '')"
                                t-esc="fmt(row.balance)"/>
                        </tr>
                    </t>
                </tbody>
                <tfoot>
                    <tr class="ls-report-total-row">
                        <td colspan="3"><strong>TOTAL</strong></td>
                        <td class="ls-col-num"><strong t-esc="fmt(state.data.totals ? state.data.totals.total_debit : (state.data.summary ? state.data.summary.total_debit : 0))"/></td>
                        <td class="ls-col-num"><strong t-esc="fmt(state.data.totals ? state.data.totals.total_credit : (state.data.summary ? state.data.summary.total_credit : 0))"/></td>
                        <td class="ls-col-num"><strong t-esc="fmt(state.data.totals ? state.data.totals.balance : 0)"/></td>
                    </tr>
                </tfoot>
            </table>
        </t>

        <!-- GENERAL LEDGER -->
        <t t-if="state.activeReport === 'general_ledger' and state.data">
            <div class="ls-report-header">
                <h2 class="ls-report-title" t-esc="state.data.title"/>
                <p class="ls-report-period" t-esc="'Periode: ' + state.data.period"/>
            </div>
            <t t-foreach="state.data.accounts || []" t-as="acct" t-key="acct.account_id || acct_index">
                <div class="ls-gl-account-section">
                    <div class="ls-gl-account-header" t-on-click="() => this.toggleGLSection(acct.account_id)">
                        <span class="ls-gl-code" t-esc="acct.code"/>
                        <span class="ls-gl-name" t-esc="acct.account_name || acct.name"/>
                        <span class="ls-gl-balance" t-esc="'Saldo: ' + fmt(acct.balance)"/>
                    </div>
                    <table class="ls-report-table ls-gl-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>No. Jurnal</th>
                                <th>Keterangan</th>
                                <th>Partner</th>
                                <th class="ls-col-num">Debit</th>
                                <th class="ls-col-num">Kredit</th>
                                <th class="ls-col-num">Saldo Berjalan</th>
                            </tr>
                        </thead>
                        <tbody>
                            <t t-foreach="acct.lines || []" t-as="line" t-key="line.line_id || line.id || line_index">
                                <tr>
                                    <td t-esc="line.date"/>
                                    <td class="ls-gl-move-link" t-esc="line.move_name"/>
                                    <td t-esc="line.label || line.ref || ''"/>
                                    <td t-esc="line.partner_name || '—'"/>
                                    <td class="ls-col-num" t-esc="line.debit ? fmt(line.debit) : ''"/>
                                    <td class="ls-col-num" t-esc="line.credit ? fmt(line.credit) : ''"/>
                                    <td class="ls-col-num" t-esc="fmt(line.running_balance || line.balance)"/>
                                </tr>
                            </t>
                        </tbody>
                        <tfoot>
                            <tr class="ls-report-subtotal">
                                <td colspan="4"><strong>Sub Total</strong></td>
                                <td class="ls-col-num"><strong t-esc="fmt(acct.total_debit)"/></td>
                                <td class="ls-col-num"><strong t-esc="fmt(acct.total_credit)"/></td>
                                <td class="ls-col-num"><strong t-esc="fmt(acct.balance)"/></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </t>
        </t>

        <!-- BALANCE SHEET -->
        <t t-if="state.activeReport === 'balance_sheet' and state.data">
            <div class="ls-report-header">
                <h2 class="ls-report-title" t-esc="state.data.title"/>
                <p class="ls-report-period" t-esc="'Per tanggal: ' + (state.data.as_of || state.data.period)"/>
            </div>
            <div class="ls-bs-grid">
                <t t-foreach="Object.entries(state.data.sections || {})" t-as="entry" t-key="entry[0]">
                    <div class="ls-bs-section">
                        <h3 class="ls-bs-section-title" t-esc="entry[1].label || entry[1].name"/>
                        <table class="ls-report-table">
                            <tbody>
                                <t t-foreach="entry[1].accounts || entry[1].lines || []" t-as="acct" t-key="acct.code || acct_index">
                                    <tr>
                                        <td class="ls-col-code" t-esc="acct.code"/>
                                        <td class="ls-col-name" t-esc="acct.name"/>
                                        <td class="ls-col-num" t-esc="fmt(acct.balance)"/>
                                    </tr>
                                </t>
                            </tbody>
                            <tfoot>
                                <tr class="ls-report-total-row">
                                    <td colspan="2"><strong t-esc="'Total ' + (entry[1].label || entry[1].name)"/></td>
                                    <td class="ls-col-num"><strong t-esc="fmt(entry[1].total)"/></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </t>
            </div>
            <div class="ls-bs-check" t-att-class="Math.abs(state.data.check || 0) &lt; 0.01 ? 'ls-balanced' : 'ls-unbalanced'">
                <t t-if="Math.abs(state.data.check || 0) &lt; 0.01">
                    <div style="display:flex;align-items:center;justify-content:center;gap:8px;">
                        <t t-out="window.lucideIcon('check-circle', 16)"/> Neraca Seimbang (Balanced)
                    </div>
                </t>
                <t t-else="">
                    <div style="display:flex;align-items:center;justify-content:center;gap:8px;">
                        <t t-out="window.lucideIcon('alert-triangle', 16)"/> Tidak Seimbang — Selisih: <strong t-esc="fmt(state.data.check)"/>
                    </div>
                </t>
            </div>
        </t>

        <!-- INCOME STATEMENT -->
        <t t-if="state.activeReport === 'income_statement' and state.data">
            <div class="ls-report-header">
                <h2 class="ls-report-title" t-esc="state.data.title"/>
                <p class="ls-report-period" t-esc="'Periode: ' + state.data.period"/>
            </div>
            <t t-foreach="Object.entries(state.data.sections || {})" t-as="entry" t-key="entry[0]">
                <div class="ls-is-section">
                    <h3 class="ls-is-section-title" t-esc="entry[1].label || entry[1].name"/>
                    <table class="ls-report-table">
                        <tbody>
                            <t t-foreach="entry[1].accounts || entry[1].lines || []" t-as="acct" t-key="acct.code || acct_index">
                                <tr>
                                    <td class="ls-col-code" t-esc="acct.code"/>
                                    <td class="ls-col-name" t-esc="acct.name"/>
                                    <td class="ls-col-num" t-esc="fmt(acct.balance)"/>
                                </tr>
                            </t>
                        </tbody>
                        <tfoot>
                            <tr class="ls-report-subtotal">
                                <td colspan="2"><strong t-esc="'Total ' + (entry[1].label || entry[1].name)"/></td>
                                <td class="ls-col-num"><strong t-esc="fmt(entry[1].total)"/></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </t>
            <!-- Summary -->
            <div class="ls-is-summary">
                <div class="ls-is-summary-row">
                    <span>Laba Kotor</span>
                    <strong t-esc="fmt(state.data.gross_profit)"/>
                </div>
                <div class="ls-is-summary-row">
                    <span>Laba Operasional</span>
                    <strong t-esc="fmt(state.data.operating_income)"/>
                </div>
                <div class="ls-is-summary-row ls-is-net-income"
                     t-att-class="state.data.net_income >= 0 ? 'ls-profit' : 'ls-loss'">
                    <span>LABA/(RUGI) BERSIH</span>
                    <strong t-esc="fmt(state.data.net_income)"/>
                </div>
            </div>
        </t>

        <!-- Empty state -->
        <div class="ls-report-empty" t-if="!state.data and !state.loading">
            <div class="ls-report-empty-icon"><t t-out="window.lucideIcon('bar-chart-2', 48)"/></div>
            <p>Pilih laporan dan klik "Muat Ulang" untuk menampilkan data</p>
        </div>
    </div>
</div>`;

})();
