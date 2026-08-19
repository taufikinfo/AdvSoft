import"./owl-icons-CaNO8TZD.js";import"./owl-widgets-BSj60x_T.js";import"./owl-form-DQyHHCfJ.js";import"./owl-spreadsheet-Ct4o8fCg.js";(function(){let e=owl.xml;window.ACCOUNTING_REPORT_TPL=e`
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
                    <t t-foreach="state.data.rows" t-as="row" t-key="row.account_id">
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
                        <td class="ls-col-num"><strong t-esc="fmt(state.data.totals.total_debit)"/></td>
                        <td class="ls-col-num"><strong t-esc="fmt(state.data.totals.total_credit)"/></td>
                        <td class="ls-col-num"><strong t-esc="fmt(state.data.totals.balance)"/></td>
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
            <t t-foreach="state.data.accounts" t-as="acct" t-key="acct.account_id">
                <div class="ls-gl-account-section">
                    <div class="ls-gl-account-header" t-on-click="() => this.toggleGLSection(acct.account_id)">
                        <span class="ls-gl-code" t-esc="acct.code"/>
                        <span class="ls-gl-name" t-esc="acct.account_name"/>
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
                            <t t-foreach="acct.lines" t-as="line" t-key="line.line_id">
                                <tr>
                                    <td t-esc="line.date"/>
                                    <td class="ls-gl-move-link" t-esc="line.move_name"/>
                                    <td t-esc="line.label || line.ref || ''"/>
                                    <td t-esc="line.partner_name || '—'"/>
                                    <td class="ls-col-num" t-esc="line.debit ? fmt(line.debit) : ''"/>
                                    <td class="ls-col-num" t-esc="line.credit ? fmt(line.credit) : ''"/>
                                    <td class="ls-col-num" t-esc="fmt(line.running_balance)"/>
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
                <p class="ls-report-period" t-esc="'Per tanggal: ' + state.data.as_of"/>
            </div>
            <div class="ls-bs-grid">
                <t t-foreach="Object.entries(state.data.sections)" t-as="entry" t-key="entry[0]">
                    <div class="ls-bs-section">
                        <h3 class="ls-bs-section-title" t-esc="entry[1].label"/>
                        <table class="ls-report-table">
                            <tbody>
                                <t t-foreach="entry[1].accounts" t-as="acct" t-key="acct.code">
                                    <tr>
                                        <td class="ls-col-code" t-esc="acct.code"/>
                                        <td class="ls-col-name" t-esc="acct.name"/>
                                        <td class="ls-col-num" t-esc="fmt(acct.balance)"/>
                                    </tr>
                                </t>
                            </tbody>
                            <tfoot>
                                <tr class="ls-report-total-row">
                                    <td colspan="2"><strong t-esc="'Total ' + entry[1].label"/></td>
                                    <td class="ls-col-num"><strong t-esc="fmt(entry[1].total)"/></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </t>
            </div>
            <div class="ls-bs-check" t-att-class="Math.abs(state.data.check) &lt; 0.01 ? 'ls-balanced' : 'ls-unbalanced'">
                <t t-if="Math.abs(state.data.check) &lt; 0.01">
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
            <t t-foreach="Object.entries(state.data.sections)" t-as="entry" t-key="entry[0]">
                <div class="ls-is-section">
                    <h3 class="ls-is-section-title" t-esc="entry[1].label"/>
                    <table class="ls-report-table">
                        <tbody>
                            <t t-foreach="entry[1].accounts" t-as="acct" t-key="acct.code">
                                <tr>
                                    <td class="ls-col-code" t-esc="acct.code"/>
                                    <td class="ls-col-name" t-esc="acct.name"/>
                                    <td class="ls-col-num" t-esc="fmt(acct.balance)"/>
                                </tr>
                            </t>
                        </tbody>
                        <tfoot>
                            <tr class="ls-report-subtotal">
                                <td colspan="2"><strong t-esc="'Total ' + entry[1].label"/></td>
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
</div>`})(),(function(){let{xml:e}=owl;window.TEMPLATES.MenuEditor=e`
<div class="ls-menu-editor">
    <!-- Header Bar -->
    <div class="ls-me-header">
        <div class="ls-me-header-left">
            <h2 class="ls-me-title">
                <t t-out="window.lucideIcon('layout-list', 20)"/>
                Menu Items
            </h2>
            <span class="ls-me-stats" t-if="state.stats">
                <span class="ls-badge ls-badge-info"><t t-esc="state.stats.total"/> items</span>
                <span class="ls-badge ls-badge-success"><t t-esc="state.stats.active"/> active</span>
                <span class="ls-badge ls-badge-muted"><t t-esc="state.stats.root"/> root</span>
            </span>
        </div>
        <div class="ls-me-header-right">
            <div class="ls-me-search">
                <t t-out="window.lucideIcon('search', 14)"/>
                <input type="text" placeholder="Search menu items..."
                       t-model="state.searchQuery"
                       t-on-input="onSearch" />
            </div>
            <button class="ls-btn ls-btn-ghost" t-on-click="toggleInactiveFilter"
                    t-att-class="{'active': state.showInactive}">
                <t t-out="window.lucideIcon(state.showInactive ? 'eye' : 'eye-off', 14)"/>
                <t t-esc="state.showInactive ? 'Hide Inactive' : 'Show Inactive'"/>
            </button>
            <button class="ls-btn ls-btn-ghost" t-on-click="expandAll">
                <t t-out="window.lucideIcon('chevrons-down', 14)"/>
                Expand All
            </button>
            <button class="ls-btn ls-btn-ghost" t-on-click="collapseAll">
                <t t-out="window.lucideIcon('chevrons-up', 14)"/>
                Collapse All
            </button>
            <button class="ls-btn ls-btn-primary" t-on-click="openCreateDialog">
                <t t-out="window.lucideIcon('plus', 14)"/>
                New Menu Item
            </button>
        </div>
    </div>

    <!-- Loading State -->
    <div class="ls-me-loading" t-if="state.loading">
        <div class="ls-spinner"></div>
        <span>Loading menu tree...</span>
    </div>

    <!-- Tree View -->
    <div class="ls-me-tree-container" t-if="!state.loading">
        <div class="ls-me-tree-header">
            <div class="ls-me-th" style="flex:0 0 40px"></div>
            <div class="ls-me-th" style="flex:0 0 24px"></div>
            <div class="ls-me-th ls-me-th-name" style="flex:1">Menu Name</div>
            <div class="ls-me-th" style="flex:0 0 180px">Action / Model</div>
            <div class="ls-me-th" style="flex:0 0 60px;text-align:center">Seq</div>
            <div class="ls-me-th" style="flex:0 0 50px;text-align:center">Icon</div>
            <div class="ls-me-th" style="flex:0 0 60px;text-align:center">Active</div>
            <div class="ls-me-th" style="flex:0 0 100px;text-align:center">Actions</div>
        </div>
        <div class="ls-me-tree-body">
            <t t-if="flatRows.length === 0">
                <div class="ls-me-empty">
                    <t t-out="window.lucideIcon('layout-list', 40)"/>
                    <p>No menu items found.</p>
                    <button class="ls-btn ls-btn-primary" t-on-click="openCreateDialog">
                        <t t-out="window.lucideIcon('plus', 14)"/>
                        Create First Menu Item
                    </button>
                </div>
            </t>
            <t t-foreach="flatRows" t-as="row" t-key="row.item.id">
                <div t-att-class="'ls-me-row' + (row.item.active === false ? ' inactive' : '') + (state.dragOverId === row.item.id ? ' drag-over' : '')"
                     t-att-data-id="row.item.id"
                     draggable="true"
                     t-on-dragstart="(ev) => this.onDragStart(ev, row.item)"
                     t-on-dragover.prevent="(ev) => this.onDragOver(ev, row.item)"
                     t-on-dragleave="(ev) => this.onDragLeave(ev)"
                     t-on-drop="(ev) => this.onDrop(ev, row.item)">
                    <!-- Expand toggle -->
                    <div class="ls-me-cell ls-me-toggle" t-att-style="'flex:0 0 40px;padding-left:' + (row.depth * 24) + 'px'">
                        <span t-if="row.item.children and row.item.children.length"
                              t-on-click.stop="() => this.toggleExpand(row.item.id)" class="ls-me-expand-btn">
                            <t t-out="window.lucideIcon(state.expanded[row.item.id] ? 'chevron-down' : 'chevron-right', 14)"/>
                        </span>
                        <span t-else="" class="ls-me-leaf-dot">·</span>
                    </div>
                    <!-- Drag handle -->
                    <div class="ls-me-cell ls-me-drag-handle" style="flex:0 0 24px" title="Drag to reorder">
                        <t t-out="window.lucideIcon('grip-vertical', 14)"/>
                    </div>
                    <!-- Name -->
                    <div class="ls-me-cell ls-me-cell-name" style="flex:1"
                         t-on-click="() => this.openEditDialog(row.item)">
                        <span class="ls-me-item-icon" t-if="row.item.icon">
                            <t t-out="window.lucideIcon(row.item.icon, 14)"/>
                        </span>
                        <span class="ls-me-item-name" t-esc="row.item.name"/>
                        <span class="ls-me-root-badge" t-if="row.depth === 0 and !row.item.parent_id">APP</span>
                    </div>
                    <!-- Action/Model -->
                    <div class="ls-me-cell ls-me-cell-action" style="flex:0 0 180px">
                        <t t-if="row.item.action">
                            <span class="ls-me-action-chip action">
                                <t t-out="window.lucideIcon('zap', 10)"/>
                                <t t-esc="row.item.action.res_model"/>
                            </span>
                        </t>
                        <t t-elif="row.item.model">
                            <span class="ls-me-action-chip model">
                                <t t-out="window.lucideIcon('database', 10)"/>
                                <t t-esc="row.item.model"/>
                            </span>
                        </t>
                        <t t-elif="row.item.security_view">
                            <span class="ls-me-action-chip security">
                                <t t-out="window.lucideIcon('shield', 10)"/>
                                <t t-esc="row.item.security_view"/>
                            </span>
                        </t>
                        <t t-else="">
                            <span class="ls-me-action-chip container">
                                <t t-out="window.lucideIcon('folder', 10)"/>
                                container
                            </span>
                        </t>
                    </div>
                    <!-- Sequence -->
                    <div class="ls-me-cell" style="flex:0 0 60px;text-align:center;color:#6b7280;font-size:12px">
                        <t t-esc="row.item.sequence"/>
                    </div>
                    <!-- Icon preview -->
                    <div class="ls-me-cell" style="flex:0 0 50px;text-align:center">
                        <span t-if="row.item.web_icon_color" class="ls-me-icon-dot" t-att-style="'background:' + row.item.web_icon_color"></span>
                        <span t-elif="row.item.icon" style="opacity:0.5">
                            <t t-out="window.lucideIcon(row.item.icon, 14)"/>
                        </span>
                    </div>
                    <!-- Active toggle -->
                    <div class="ls-me-cell" style="flex:0 0 60px;text-align:center">
                        <label class="ls-toggle ls-toggle-sm">
                            <input type="checkbox" t-att-checked="row.item.active !== false"
                                   t-on-change="() => this.toggleItemActive(row.item)" />
                            <span class="ls-toggle-slider"></span>
                        </label>
                    </div>
                    <!-- Actions -->
                    <div class="ls-me-cell ls-me-cell-actions" style="flex:0 0 100px;text-align:center">
                        <button class="ls-btn-icon" title="Edit" t-on-click.stop="() => this.openEditDialog(row.item)">
                            <t t-out="window.lucideIcon('edit-3', 13)"/>
                        </button>
                        <button class="ls-btn-icon" title="Add child" t-on-click.stop="() => this.openCreateChild(row.item)">
                            <t t-out="window.lucideIcon('plus', 13)"/>
                        </button>
                        <button class="ls-btn-icon ls-btn-icon-danger" title="Delete" t-on-click.stop="() => this.deleteItem(row.item)">
                            <t t-out="window.lucideIcon('trash-2', 13)"/>
                        </button>
                    </div>
                </div>
            </t>
        </div>
    </div>

    <!-- Edit / Create Dialog -->
    <t t-if="state.dialogOpen">
        <div class="ls-modal-backdrop" t-on-click.self="closeDialog">
            <div class="ls-me-dialog" t-on-click.stop="">
                <div class="ls-me-dialog-header">
                    <h3>
                        <t t-out="window.lucideIcon(state.dialogMode === 'create' ? 'plus-circle' : 'edit-3', 18)"/>
                        <t t-esc="state.dialogMode === 'create' ? 'Create Menu Item' : 'Edit Menu Item'"/>
                    </h3>
                    <button class="ls-modal-close" t-on-click="closeDialog">✕</button>
                </div>
                <div class="ls-me-dialog-body">
                    <!-- Basic Info -->
                    <div class="ls-me-form-section">
                        <h4>Basic Information</h4>
                        <div class="ls-me-form-grid">
                            <div class="ls-me-field">
                                <label>Menu Name <span class="required">*</span></label>
                                <input type="text" t-model="state.editForm.name" placeholder="e.g. Projects" />
                            </div>
                            <div class="ls-me-field">
                                <label>Parent Menu</label>
                                <select t-model="state.editForm.parent_id">
                                    <option value="">— Root Menu (Top Level) —</option>
                                    <t t-foreach="flatMenuList" t-as="opt" t-key="opt.id">
                                        <option t-att-value="'' + opt.id"
                                                t-esc="opt.path"/>
                                    </t>
                                </select>
                            </div>
                            <div class="ls-me-field">
                                <label>Sequence</label>
                                <input type="number" t-model="state.editForm.sequence" min="0" step="10" />
                            </div>
                            <div class="ls-me-field">
                                <label>Active</label>
                                <label class="ls-toggle">
                                    <input type="checkbox" t-model="state.editForm.active" />
                                    <span class="ls-toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Action Binding -->
                    <div class="ls-me-form-section">
                        <h4>Action Binding</h4>
                        <div class="ls-me-binding-tabs">
                            <button t-att-class="'ls-me-binding-tab' + (state.bindingMode === 'action' ? ' active' : '')"
                                    t-on-click="() => this.state.bindingMode = 'action'">
                                <t t-out="window.lucideIcon('zap', 14)"/>
                                Existing Action
                            </button>
                            <button t-att-class="'ls-me-binding-tab' + (state.bindingMode === 'model' ? ' active' : '')"
                                    t-on-click="() => this.state.bindingMode = 'model'">
                                <t t-out="window.lucideIcon('database', 14)"/>
                                Direct Model
                            </button>
                            <button t-att-class="'ls-me-binding-tab' + (state.bindingMode === 'security' ? ' active' : '')"
                                    t-on-click="() => this.state.bindingMode = 'security'">
                                <t t-out="window.lucideIcon('shield', 14)"/>
                                Security View
                            </button>
                            <button t-att-class="'ls-me-binding-tab' + (state.bindingMode === 'none' ? ' active' : '')"
                                    t-on-click="() => this.state.bindingMode = 'none'">
                                <t t-out="window.lucideIcon('folder', 14)"/>
                                Container Only
                            </button>
                        </div>

                        <!-- Action mode -->
                        <div class="ls-me-form-grid" t-if="state.bindingMode === 'action'">
                            <div class="ls-me-field ls-me-field-full">
                                <label>Select Action</label>
                                <select t-model="state.editForm.action_id">
                                    <option value="">— No Action —</option>
                                    <t t-foreach="state.availableActions" t-as="act" t-key="act.id">
                                        <option t-att-value="'' + act.id">
                                            <t t-esc="act.name"/> (<t t-esc="act.res_model"/>)
                                        </option>
                                    </t>
                                </select>
                            </div>
                            <div class="ls-me-field ls-me-field-full">
                                <div class="ls-me-inline-create">
                                    <span>Or create new action:</span>
                                    <button class="ls-btn ls-btn-sm" t-on-click="openActionCreate">
                                        <t t-out="window.lucideIcon('plus', 12)"/>
                                        Quick Create Action
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Model mode -->
                        <div class="ls-me-form-grid" t-if="state.bindingMode === 'model'">
                            <div class="ls-me-field">
                                <label>Model</label>
                                <select t-model="state.editForm.model">
                                    <option value="">— Select Model —</option>
                                    <t t-foreach="state.availableModels" t-as="m" t-key="m.value">
                                        <option t-att-value="m.value" t-esc="m.label + ' (' + m.value + ')'"/>
                                    </t>
                                </select>
                            </div>
                            <div class="ls-me-field">
                                <label>Default View</label>
                                <select t-model="state.editForm.view_type">
                                    <option value="list">List</option>
                                    <option value="kanban">Kanban</option>
                                    <option value="form">Form</option>
                                    <option value="calendar">Calendar</option>
                                    <option value="graph">Graph</option>
                                    <option value="pivot">Pivot</option>
                                </select>
                            </div>
                        </div>

                        <!-- Security view mode -->
                        <div class="ls-me-form-grid" t-if="state.bindingMode === 'security'">
                            <div class="ls-me-field ls-me-field-full">
                                <label>Security View Name</label>
                                <input type="text" t-model="state.editForm.security_view"
                                       placeholder="e.g. security_overview" />
                            </div>
                        </div>
                    </div>

                    <!-- Appearance -->
                    <div class="ls-me-form-section">
                        <h4>Appearance</h4>
                        <div class="ls-me-form-grid">
                            <div class="ls-me-field">
                                <label>Icon (Lucide name)</label>
                                <div class="ls-me-icon-field">
                                    <input type="text" t-model="state.editForm.icon"
                                           placeholder="e.g. folder, check-square" />
                                    <span class="ls-me-icon-preview" t-if="state.editForm.icon">
                                        <t t-out="window.lucideIcon(state.editForm.icon || 'box', 18)"/>
                                    </span>
                                </div>
                            </div>
                            <div class="ls-me-field">
                                <label>App Icon (for switcher)</label>
                                <input type="text" t-model="state.editForm.web_icon"
                                       placeholder="Same as icon if empty" />
                            </div>
                            <div class="ls-me-field">
                                <label>Icon Background Color</label>
                                <div class="ls-me-color-field">
                                    <input type="color" t-model="state.editForm.web_icon_color"
                                           t-att-value="state.editForm.web_icon_color || '#7C3AED'" />
                                    <input type="text" t-model="state.editForm.web_icon_color"
                                           placeholder="#7C3AED" style="flex:1" />
                                </div>
                            </div>
                            <div class="ls-me-field">
                                <label>Access Groups</label>
                                <input type="text" t-model="state.editForm.groups"
                                       placeholder="e.g. admin,manager" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="ls-me-dialog-footer">
                    <button class="ls-btn" t-on-click="closeDialog">Cancel</button>
                    <button class="ls-btn ls-btn-primary" t-on-click="saveDialog" t-att-disabled="state.saving">
                        <t t-if="state.saving">
                            <span class="ls-spinner-sm"></span> Saving...
                        </t>
                        <t t-else="">
                            <t t-out="window.lucideIcon('check', 14)"/>
                            <t t-esc="state.dialogMode === 'create' ? 'Create' : 'Save Changes'"/>
                        </t>
                    </button>
                </div>
            </div>
        </div>
    </t>

    <!-- Quick Action Create Dialog -->
    <t t-if="state.actionDialogOpen">
        <div class="ls-modal-backdrop" t-on-click.self="closeActionDialog">
            <div class="ls-me-dialog ls-me-dialog-sm" t-on-click.stop="">
                <div class="ls-me-dialog-header">
                    <h3>
                        <t t-out="window.lucideIcon('zap', 18)"/>
                        Quick Create Action
                    </h3>
                    <button class="ls-modal-close" t-on-click="closeActionDialog">✕</button>
                </div>
                <div class="ls-me-dialog-body">
                    <div class="ls-me-form-grid">
                        <div class="ls-me-field ls-me-field-full">
                            <label>Action Name <span class="required">*</span></label>
                            <input type="text" t-model="state.actionForm.name" placeholder="e.g. Projects" />
                        </div>
                        <div class="ls-me-field">
                            <label>Target Model <span class="required">*</span></label>
                            <select t-model="state.actionForm.res_model">
                                <option value="">— Select Model —</option>
                                <t t-foreach="state.availableModels" t-as="m" t-key="m.value">
                                    <option t-att-value="m.value" t-esc="m.label + ' (' + m.value + ')'"/>
                                </t>
                            </select>
                        </div>
                        <div class="ls-me-field">
                            <label>View Modes</label>
                            <input type="text" t-model="state.actionForm.view_mode" placeholder="list,form" />
                        </div>
                    </div>
                </div>
                <div class="ls-me-dialog-footer">
                    <button class="ls-btn" t-on-click="closeActionDialog">Cancel</button>
                    <button class="ls-btn ls-btn-primary" t-on-click="createActionInline" t-att-disabled="state.savingAction">
                        <t t-if="state.savingAction">
                            <span class="ls-spinner-sm"></span> Creating...
                        </t>
                        <t t-else="">
                            <t t-out="window.lucideIcon('check', 14)"/>
                            Create Action
                        </t>
                    </button>
                </div>
            </div>
        </div>
    </t>

    <!-- Notification Toast -->
    <div class="ls-me-toast" t-if="state.toast" t-att-class="'ls-me-toast ' + (state.toastType || 'info')">
        <t t-out="window.lucideIcon(state.toastType === 'error' ? 'alert-circle' : 'check-circle', 16)"/>
        <span t-esc="state.toast"/>
    </div>
</div>
`})(),(function(){let{xml:e}=owl;window.TEMPLATES.securityOverview=e`
<div class="ls-sec-page">
    <div class="ls-sec-header">
        <h1>Security Overview</h1>
        <p class="ls-sec-subtitle">Dashboard and diagnostics for the Larasoft security engine.</p>
    </div>

    <div t-if="state.loading" class="ls-sec-loading">
        <t t-out="window.lucideIcon('loader', 24)"/> Loading overview...
    </div>

    <div t-else="" style="padding: 1rem;">
        <div class="ls-dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div class="ls-stat-card" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; text-align: center;">
                <div style="font-size: 2rem; font-weight: bold; color: #2563eb;" t-esc="state.data.counts.users"/>
                <div style="color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.5rem;">Users</div>
            </div>
            <div class="ls-stat-card" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; text-align: center;">
                <div style="font-size: 2rem; font-weight: bold; color: #059669;" t-esc="state.data.counts.groups"/>
                <div style="color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.5rem;">Groups</div>
            </div>
            <div class="ls-stat-card" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; text-align: center;">
                <div style="font-size: 2rem; font-weight: bold; color: #7c3aed;" t-esc="state.data.counts.models"/>
                <div style="color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.5rem;">Models</div>
            </div>
            <div class="ls-stat-card" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; text-align: center;">
                <div style="font-size: 2rem; font-weight: bold; color: #dc2626;" t-esc="state.data.counts.acl_rules"/>
                <div style="color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.5rem;">ACL Rules</div>
            </div>
            <div class="ls-stat-card" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; text-align: center;">
                <div style="font-size: 2rem; font-weight: bold; color: #d97706;" t-esc="state.data.counts.record_rules"/>
                <div style="color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.5rem;">Record Rules</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr; gap: 2rem;">
            <div class="ls-panel" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px;">
                <div style="padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Top Permissioned Users</div>
                <table class="ls-sec-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Groups</th>
                            <th>Admin</th>
                        </tr>
                    </thead>
                    <tbody>
                        <t t-foreach="state.data.top_users" t-as="u" t-key="u.id">
                            <tr>
                                <td><strong t-esc="u.name || u.login"/></td>
                                <td t-esc="u.email || ''"/>
                                <td><span class="ls-badge" t-esc="u.group_count + ' groups'"/></td>
                                <td><span t-if="u.is_admin" class="ls-badge ls-badge-w">Admin</span></td>
                            </tr>
                        </t>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
`,window.TEMPLATES.accessRights=e`
<div class="ls-sec-page">
    <div class="ls-sec-header">
        <h1>Access Rights</h1>
        <p class="ls-sec-subtitle">Configure per-model CRUD permissions for each group. Click a cell to toggle.</p>
        <div class="ls-sec-toolbar">
            <input type="text" class="ls-input" placeholder="Search model or group..." t-model="state.filter"/>
            <select class="ls-input" t-model="state.selectedModule">
                <option value="all">All modules</option>
                <t t-foreach="modules" t-as="m" t-key="m">
                    <option t-att-value="m" t-esc="m"/>
                </t>
            </select>
            <button class="ls-btn ls-btn-secondary" t-on-click="syncModels">
                <t t-out="window.lucideIcon('refresh-cw', 14)"/>
                Sync Models
            </button>
        </div>
    </div>

    <div t-if="state.loading" class="ls-sec-loading">
        <t t-out="window.lucideIcon('loader', 24)"/>
        Loading access matrix...
    </div>

    <div t-else="" class="ls-matrix-wrapper">
        <table class="ls-matrix">
            <thead>
                <tr>
                    <th class="ls-matrix-corner">Model \\ Group</th>
                    <t t-foreach="filteredGroups" t-as="g" t-key="g.id">
                        <th class="ls-matrix-colhead" t-att-title="g.category_name || ''">
                            <div class="ls-matrix-colhead-name" t-esc="g.name"/>
                            <div t-if="g.category_name" class="ls-matrix-colhead-cat" t-esc="g.category_name"/>
                            <div t-if="g.share" class="ls-matrix-colhead-tag">portal</div>
                        </th>
                    </t>
                </tr>
            </thead>
            <tbody>
                <t t-foreach="filteredModels" t-as="m" t-key="m.id">
                    <tr class="ls-matrix-row">
                        <td class="ls-matrix-rowhead">
                            <div class="ls-matrix-rowhead-name" t-esc="m.model"/>
                            <div class="ls-matrix-rowhead-meta">
                                <span t-esc="m.module || 'larasoft'"/>
                                <span> · </span>
                                <span t-esc="m.group_count"/> rules
                            </div>
                        </td>
                        <t t-foreach="filteredGroups" t-as="g" t-key="g.id">
                            <td class="ls-matrix-cell">
                                <t t-set="cell" t-value="getCell(m.id, g.id)"/>
                                <div class="ls-matrix-cell-row">
                                    <t t-foreach="['r','w','c','u']" t-as="perm" t-key="perm">
                                        <button t-att-class="'ls-perm-btn' + (cell &amp;&amp; cell[perm] ? ' ls-perm-on' : '') + (isSaving(m.id, g.id, perm) ? ' ls-perm-saving' : '')"
                                                t-att-title="({'r':'Read','w':'Write','c':'Create','u':'Delete'})[perm]"
                                                t-att-disabled="isSaving(m.id, g.id, perm)"
                                                t-on-click="() => this.toggleCell(m.id, g.id, perm, cell ? cell[perm] : false)">
                                            <t t-esc="({'r':'R','w':'W','c':'C','u':'D'})[perm]"/>
                                        </button>
                                    </t>
                                </div>
                            </td>
                        </t>
                    </tr>
                </t>
            </tbody>
        </table>
        <div t-if="filteredModels.length === 0" class="ls-sec-empty">No models match your filter.</div>
    </div>

    <div class="ls-legend">
        <span class="ls-legend-label">Permissions:</span>
        <span><b>R</b> Read</span>
        <span><b>W</b> Write (includes Read)</span>
        <span><b>C</b> Create</span>
        <span><b>D</b> Delete (unlink)</span>
    </div>
</div>
`,window.TEMPLATES.recordRules=e`
<div class="ls-sec-page">
    <div class="ls-sec-header">
        <h1>Record Rules</h1>
        <p class="ls-sec-subtitle">Row-level access (record filtering). Each rule restricts which records a user can see or modify.</p>
    </div>

    <!-- LIST MODE -->
    <div t-if="state.mode === 'list'">
        <div class="ls-sec-toolbar">
            <input type="text" class="ls-input" placeholder="Search rules..." t-model="state.search"/>
            <button class="ls-btn ls-btn-primary" t-on-click="newRecord">
                <t t-out="window.lucideIcon('plus', 14)"/>
                New Rule
            </button>
        </div>

        <div t-if="state.loading" class="ls-sec-loading">Loading rules...</div>

        <table t-else="" class="ls-sec-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Model</th>
                    <th>Domain</th>
                    <th>Perms</th>
                    <th>Active</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <t t-foreach="filteredRecords" t-as="r" t-key="r.id">
                    <tr>
                        <td><strong t-esc="r.name || '(unnamed)'"/></td>
                        <td>
                            <t t-if="r.model_id" t-esc="r.model_id[1]"/>
                            <t t-else="" t-esc="'?'"/>
                        </td>
                        <td><code class="ls-code" t-esc="(r.domain_force || '').substring(0, 50) + ((r.domain_force || '').length > 50 ? '...' : '')"/></td>
                        <td>
                            <span t-if="r.perm_read"   class="ls-badge ls-badge-r">R</span>
                            <span t-if="r.perm_write"  class="ls-badge ls-badge-w">W</span>
                            <span t-if="r.perm_create" class="ls-badge ls-badge-c">C</span>
                            <span t-if="r.perm_unlink" class="ls-badge ls-badge-u">D</span>
                            <span t-if="r.global"      class="ls-badge ls-badge-global">global</span>
                        </td>
                        <td>
                            <span t-att-class="r.active ? 'ls-dot ls-dot-on' : 'ls-dot ls-dot-off'"/>
                            <span t-esc="r.active ? 'Active' : 'Inactive'"/>
                        </td>
                        <td class="ls-actions">
                            <button class="ls-btn-icon" t-on-click="() => this.editRecord(r)" title="Edit"><t t-out="window.lucideIcon('pencil', 14)"/></button>
                            <button class="ls-btn-icon ls-btn-danger" t-on-click="() => this.deleteRecord(r)" title="Delete"><t t-out="window.lucideIcon('trash-2', 14)"/></button>
                        </td>
                    </tr>
                </t>
            </tbody>
        </table>
        <div t-if="filteredRecords.length === 0 &amp;&amp; !state.loading" class="ls-sec-empty">
            No record rules. Click <strong>New Rule</strong> to add one.
        </div>
    </div>

    <!-- FORM MODE -->
    <div t-if="state.mode === 'form'">
        <form class="ls-card-form" t-on-submit.prevent="save">
            <div class="ls-form-bar">
                <button type="button" class="ls-btn" t-on-click="backToList">
                    <t t-out="window.lucideIcon('arrow-left', 14)"/> Back
                </button>
                <h2 t-esc="state.current.id ? 'Edit Rule' : 'New Rule'"/>
                <div style="flex:1"></div>
                <button type="submit" class="ls-btn ls-btn-primary" t-att-disabled="state.saving">
                    <t t-if="state.saving" t-out="window.lucideIcon('loader', 14)"/>
                    <t t-else="" t-out="window.lucideIcon('check', 14)"/>
                    Save
                </button>
            </div>

            <div t-if="state.error" class="ls-alert-error" t-esc="state.error"/>

            <div class="ls-form-grid">
                <div class="ls-form-field">
                    <label>Name <span class="req">*</span></label>
                    <input type="text" class="ls-input" t-model="state.current.name" required="required" maxlength="120"/>
                </div>
                <div class="ls-form-field">
                    <label>Model <span class="req">*</span></label>
                    <select class="ls-input" t-model="state.current.model_id" required="required">
                        <option t-att-value="false">— Select —</option>
                        <t t-foreach="state.models" t-as="m" t-key="m.id">
                            <option t-att-value="m.id" t-esc="m.name + ' (' + (m.id) + ')'"/>
                        </t>
                    </select>
                </div>
            </div>

            <div class="ls-form-field">
                <label>Permissions</label>
                <div class="ls-perm-toggles">
                    <label><input type="checkbox" t-model="state.current.perm_read"/> Read</label>
                    <label><input type="checkbox" t-model="state.current.perm_write"/> Write</label>
                    <label><input type="checkbox" t-model="state.current.perm_create"/> Create</label>
                    <label><input type="checkbox" t-model="state.current.perm_unlink"/> Delete</label>
                    <label><input type="checkbox" t-model="state.current.global"/> Global (apply to all users)</label>
                    <label><input type="checkbox" t-model="state.current.active"/> Active</label>
                </div>
            </div>

            <div class="ls-form-field">
                <label>Domain <span class="req">*</span></label>
                <textarea class="ls-input ls-input-mono" t-model="state.current.domain_force" rows="3" required="required"
                          placeholder="[('user_id','=',__user_id__),('company_id','=',__company_id__)]"></textarea>
                <div class="ls-form-help">
                    Odoo domain syntax. Use placeholders:
                    <code class="ls-code-inline" t-on-click="() => this.insertPlaceholder(' __user_id__')">__user_id__</code>
                    <code class="ls-code-inline" t-on-click="() => this.insertPlaceholder(' __uid__')">__uid__</code>
                    <code class="ls-code-inline" t-on-click="() => this.insertPlaceholder(' __company_id__')">__company_id__</code>
                    <code class="ls-code-inline" t-on-click="() => this.insertPlaceholder(' __date__')">__date__</code>
                </div>
                <div class="ls-form-templates">
                    <span>Templates:</span>
                    <button type="button" class="ls-btn-link" t-on-click="() => this.insertTemplate('[(\'user_id\',\'=\',__user_id__)]')">Own records</button>
                    <button type="button" class="ls-btn-link" t-on-click="() => this.insertTemplate('[(\'company_id\',\'=\',__company_id__)]')">Own company</button>
                    <button type="button" class="ls-btn-link" t-on-click="() => this.insertTemplate('[]')">No filter</button>
                </div>
            </div>

            <div class="ls-form-field">
                <label>Groups (when not Global)</label>
                <div class="ls-checkbox-grid">
                    <t t-foreach="state.groups" t-as="g" t-key="g.id">
                        <label class="ls-checkbox-item">
                            <input type="checkbox"
                                   t-att-checked="state.current.groups.includes(g.id) ? 'checked' : null"
                                   t-on-change="() => this.toggleGroupInForm(g.id)"/>
                            <span t-esc="g.name"/>
                        </label>
                    </t>
                </div>
            </div>
        </form>
    </div>
</div>
`,window.TEMPLATES.groupsView=e`
<div class="ls-sec-page">
    <div class="ls-sec-header">
        <h1>Groups</h1>
        <p class="ls-sec-subtitle">Security groups with implied-group hierarchy. Members of a group automatically inherit implied groups.</p>
    </div>

    <div t-if="state.mode === 'list'">
        <div class="ls-sec-toolbar">
            <input type="text" class="ls-input" placeholder="Search groups..." t-model="state.search"/>
            <button class="ls-btn ls-btn-primary" t-on-click="newRecord">
                <t t-out="window.lucideIcon('plus', 14)"/>
                New Group
            </button>
        </div>

        <div t-if="state.loading" class="ls-sec-loading">Loading groups...</div>

        <table t-else="" class="ls-sec-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <t t-foreach="filteredRecords" t-as="r" t-key="r.id">
                    <tr>
                        <td><strong t-esc="r.name"/></td>
                        <td>
                            <t t-if="r.category_id" t-esc="r.category_id[1]"/>
                            <t t-else="" t-esc="'—'"/>
                        </td>
                        <td t-esc="r.description || ''"/>
                        <td>
                            <span t-if="r.share" class="ls-badge ls-badge-portal">portal</span>
                            <span t-else="" class="ls-badge">internal</span>
                        </td>
                        <td class="ls-actions">
                            <button class="ls-btn-icon" t-on-click="() => this.editRecord(r)" title="Edit"><t t-out="window.lucideIcon('pencil', 14)"/></button>
                            <button class="ls-btn-icon ls-btn-danger" t-on-click="() => this.deleteRecord(r)" title="Delete"><t t-out="window.lucideIcon('trash-2', 14)"/></button>
                        </td>
                    </tr>
                </t>
            </tbody>
        </table>
    </div>

    <div t-if="state.mode === 'form'">
        <form class="ls-card-form" t-on-submit.prevent="save">
            <div class="ls-form-bar">
                <button type="button" class="ls-btn" t-on-click="backToList">
                    <t t-out="window.lucideIcon('arrow-left', 14)"/> Back
                </button>
                <h2 t-esc="state.current.id ? 'Edit Group' : 'New Group'"/>
                <div style="flex:1"></div>
                <button type="submit" class="ls-btn ls-btn-primary" t-att-disabled="state.saving">Save</button>
            </div>

            <div t-if="state.error" class="ls-alert-error" t-esc="state.error"/>

            <div class="ls-form-grid">
                <div class="ls-form-field">
                    <label>Name <span class="req">*</span></label>
                    <input type="text" class="ls-input" t-model="state.current.name" required="required" maxlength="80"/>
                </div>
                <div class="ls-form-field">
                    <label>Category</label>
                    <select class="ls-input" t-model="state.current.category_id">
                        <option t-att-value="false">— None —</option>
                        <t t-foreach="state.categories" t-as="c" t-key="c.id">
                            <option t-att-value="c.id" t-esc="c.name"/>
                        </t>
                    </select>
                </div>
            </div>

            <div class="ls-form-field">
                <label>Description</label>
                <input type="text" class="ls-input" t-model="state.current.description" maxlength="200"/>
            </div>

            <div class="ls-form-field">
                <label>Options</label>
                <label class="ls-checkbox-item">
                    <input type="checkbox" t-model="state.current.share"/>
                    Portal / Public group (for external users)
                </label>
            </div>

            <div class="ls-form-field">
                <label>Implied Groups (members of this group automatically belong to these)</label>
                <div class="ls-checkbox-grid">
                    <t t-foreach="state.groups" t-as="g" t-key="g.id">
                        <t t-if="!state.current.id || g.id !== state.current.id">
                            <label class="ls-checkbox-item">
                                <input type="checkbox"
                                       t-att-checked="state.current.implied_ids.includes(g.id) ? 'checked' : null"
                                       t-on-change="() => this.toggleImplied(g.id)"/>
                                <span t-esc="g.name"/>
                            </label>
                        </t>
                    </t>
                </div>
            </div>

            <div t-if="state.current.id &amp;&amp; state.groupUsers" class="ls-group-users">
                <h3>Members (<t t-esc="state.groupUsers.users.length"/>)</h3>
                <div class="ls-member-grid">
                    <t t-foreach="state.groupUsers.users" t-as="u" t-key="u.id">
                        <div class="ls-member-chip">
                            <span class="ls-avatar-mini" t-esc="(u.name || u.login).charAt(0).toUpperCase()"/>
                            <div>
                                <div t-esc="u.name || u.login"/>
                                <div class="ls-member-meta">
                                    <span t-esc="u.login"/>
                                    <span t-if="u.via === 'implied'" class="ls-via-tag">via inheritance</span>
                                </div>
                            </div>
                        </div>
                    </t>
                </div>
                <p t-if="state.groupUsers.users.length === 0" class="ls-empty-inline">No members yet.</p>
            </div>
        </form>
    </div>
</div>
`,window.TEMPLATES.usersView=e`
<div class="ls-sec-page">
    <div class="ls-sec-header">
        <h1>Users</h1>
        <p class="ls-sec-subtitle">Manage user accounts, group memberships, and reset passwords.</p>
    </div>

    <div t-if="state.mode === 'list'">
        <div class="ls-sec-toolbar">
            <input type="text" class="ls-input" placeholder="Search users..." t-model="state.search"/>
            <button class="ls-btn ls-btn-primary" t-on-click="newRecord">
                <t t-out="window.lucideIcon('plus', 14)"/>
                New User
            </button>
        </div>

        <div t-if="state.loading" class="ls-sec-loading">Loading users...</div>

        <table t-else="" class="ls-sec-table">
            <thead>
                <tr>
                    <th></th>
                    <th>Login</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <t t-foreach="filteredRecords" t-as="r" t-key="r.id">
                    <tr>
                        <td>
                            <div class="ls-avatar-mini" t-esc="(r.name || r.login || '?').charAt(0).toUpperCase()"/>
                        </td>
                        <td><strong t-esc="r.login"/></td>
                        <td t-esc="r.name || ''"/>
                        <td t-esc="r.email || ''"/>
                        <td>
                            <t t-if="r.company_id" t-esc="r.company_id[1]"/>
                            <t t-else="" t-esc="'—'"/>
                        </td>
                        <td>
                            <span t-att-class="r.active ? 'ls-dot ls-dot-on' : 'ls-dot ls-dot-off'"/>
                            <span t-esc="r.active ? 'Active' : 'Inactive'"/>
                        </td>
                        <td class="ls-actions">
                            <button class="ls-btn-icon" t-on-click="() => this.editRecord(r)" title="Edit"><t t-out="window.lucideIcon('pencil', 14)"/></button>
                            <button class="ls-btn-icon ls-btn-danger" t-on-click="() => this.deleteRecord(r)" title="Delete"><t t-out="window.lucideIcon('trash-2', 14)"/></button>
                        </td>
                    </tr>
                </t>
            </tbody>
        </table>
    </div>

    <div t-if="state.mode === 'form'">
        <form class="ls-card-form" t-on-submit.prevent="save">
            <div class="ls-form-bar">
                <button type="button" class="ls-btn" t-on-click="backToList">
                    <t t-out="window.lucideIcon('arrow-left', 14)"/> Back
                </button>
                <h2 t-esc="state.current.id ? 'Edit User: ' + state.current.login : 'New User'"/>
                <div style="flex:1"></div>
                <button t-if="state.current.id" type="button" class="ls-btn ls-btn-warning" t-on-click="openPasswordReset">
                    <t t-out="window.lucideIcon('key', 14)"/> Reset Password
                </button>
                <button type="submit" class="ls-btn ls-btn-primary" t-att-disabled="state.saving">Save</button>
            </div>

            <div t-if="state.error" class="ls-alert-error" t-esc="state.error"/>

            <!-- PASSWORD RESET PANEL -->
            <div t-if="state.showPasswordReset" class="ls-password-panel">
                <h3>Reset Password</h3>
                <p class="ls-help">Set a new password for this user. The user will need to use it on their next login.</p>
                <div class="ls-form-grid">
                    <div class="ls-form-field">
                        <label>New Password</label>
                        <input type="password" class="ls-input" t-model="state.passwordForm.password" minlength="6"/>
                    </div>
                    <div class="ls-form-field">
                        <label>Confirm</label>
                        <input type="password" class="ls-input" t-model="state.passwordForm.password_confirmation" minlength="6"/>
                    </div>
                </div>
                <div style="display:flex;gap:8px;">
                    <button type="button" class="ls-btn ls-btn-primary" t-on-click="submitPasswordReset">Set Password</button>
                    <button type="button" class="ls-btn" t-on-click="() => state.showPasswordReset = false">Cancel</button>
                </div>
                <div t-if="state.passwordMessage" t-esc="state.passwordMessage"
                     t-att-class="state.passwordMessage.indexOf('successfully') >= 0 || state.passwordMessage.indexOf('success') >= 0 ? 'ls-alert-success' : 'ls-alert-error'"/>
            </div>

            <div class="ls-form-grid">
                <div class="ls-form-field">
                    <label>Login <span class="req">*</span></label>
                    <input type="text" class="ls-input" t-model="state.current.login" required="required" maxlength="64"
                           t-att-disabled="state.current.id ? 'disabled' : null"/>
                </div>
                <div class="ls-form-field">
                    <label>Name</label>
                    <input type="text" class="ls-input" t-model="state.current.name" maxlength="120"/>
                </div>
            </div>

            <div class="ls-form-grid">
                <div class="ls-form-field">
                    <label>Email</label>
                    <input type="email" class="ls-input" t-model="state.current.email" maxlength="160"/>
                </div>
                <div class="ls-form-field">
                    <label>Company</label>
                    <select class="ls-input" t-model="state.current.company_id">
                        <option t-att-value="false">— None —</option>
                        <t t-foreach="state.companies" t-as="c" t-key="c.id">
                            <option t-att-value="c.id" t-esc="c.name"/>
                        </t>
                    </select>
                </div>
            </div>

            <div class="ls-form-field" t-if="!state.current.id">
                <label>Password <span class="req">*</span></label>
                <input type="password" class="ls-input" t-model="state.current.password" minlength="6" maxlength="128"/>
                <p class="ls-help">User can change this from their profile after first login.</p>
            </div>

            <div class="ls-form-field">
                <label>Options</label>
                <div class="ls-perm-toggles">
                    <label><input type="checkbox" t-model="state.current.active"/> Active</label>
                    <label><input type="checkbox" t-model="state.current.share"/> Portal user (limited access)</label>
                </div>
            </div>

            <div class="ls-form-field">
                <label>Signature</label>
                <textarea class="ls-input" t-model="state.current.signature" rows="3" maxlength="2000"
                          placeholder="Email signature..."></textarea>
            </div>

            <div class="ls-form-field">
                <label>Security Groups</label>
                <div class="ls-checkbox-grid">
                    <t t-foreach="state.groups" t-as="g" t-key="g.id">
                        <label class="ls-checkbox-item">
                            <input type="checkbox"
                                   t-att-checked="state.current.group_ids.includes(g.id) ? 'checked' : null"
                                   t-on-change="() => this.toggleGroupInForm(g.id)"/>
                            <span t-esc="g.name"/>
                        </label>
                    </t>
                </div>
                <p class="ls-help">Members of a group automatically inherit its implied groups.</p>
            </div>
        </form>
    </div>
</div>
`})(),(function(){let{xml:e}=owl;window.TEMPLATES.ViewBuilder=e`
<div class="ls-view-builder">
  <!-- Tab Bar -->
  <div class="ls-vb-tabs">
    <button t-foreach="builderTabs" t-as="tab" t-key="tab.id"
            t-att-class="'ls-vb-tab' + (state.activeTab === tab.id ? ' active' : '')"
            t-on-click="() => this.switchTab(tab.id)">
      <t t-out="window.lucideIcon(tab.icon, 15)"/>
      <t t-esc="tab.label"/>
    </button>
  </div>

  <!-- Model Selector -->
  <div class="ls-vb-toolbar">
    <label>Model:</label>
    <select t-model="state.selectedModel" t-on-change="onModelChange">
      <option value="">— Select Model —</option>
      <t t-foreach="state.models" t-as="m" t-key="m.name">
        <option t-att-value="m.name" t-esc="m.description + ' (' + m.name + ')'"/>
      </t>
    </select>
    <div class="ls-vb-toolbar-actions">
      <button class="ls-vb-btn" t-on-click="undo" title="Undo (Ctrl+Z)">
        <t t-out="window.lucideIcon('undo-2', 14)"/>
      </button>
      <button class="ls-vb-btn" t-on-click="redo" title="Redo (Ctrl+Y)">
        <t t-out="window.lucideIcon('redo-2', 14)"/>
      </button>
      <button class="ls-vb-btn" t-on-click="viewXml">
        <t t-out="window.lucideIcon('code', 14)"/> View XML
      </button>
      <button class="ls-vb-btn" t-on-click="exportToCode">
        <t t-out="window.lucideIcon('file-code', 14)"/> Export PHP
      </button>
      <button class="ls-vb-btn" t-on-click="resetView">
        <t t-out="window.lucideIcon('rotate-ccw', 14)"/> Reset
      </button>
      <button class="ls-vb-btn ls-vb-btn-success" t-on-click="saveView" t-att-disabled="!state.selectedModel">
        <t t-out="window.lucideIcon('save', 14)"/> Save View
      </button>
    </div>
  </div>

  <!-- Empty state -->
  <div class="ls-vb-empty" t-if="!state.selectedModel">
    <t t-out="window.lucideIcon('layout-template', 48)"/>
    <p>Select a model to start building views</p>
  </div>

  <!-- Builder Body -->
  <div class="ls-vb-body" t-if="state.selectedModel">
    <!-- Left: Field Palette -->
    <div class="ls-vb-palette">
      <div class="ls-vb-palette-section" t-if="state.activeTab === 'list'">
        <div class="ls-vb-palette-title">Column Components</div>
        <div class="ls-vb-palette-item" t-foreach="listComponents" t-as="c" t-key="c.id"
             draggable="true" t-on-dragstart="(ev) => this.onPaletteDrag(ev, c)">
          <t t-out="window.lucideIcon(c.icon, 14)"/>
          <span t-esc="c.label"/>
          <span class="ls-vb-fi-type" t-esc="c.type"/>
        </div>
      </div>
      <div class="ls-vb-palette-section" t-if="state.activeTab === 'form'">
        <div class="ls-vb-palette-title">Layout Components</div>
        <div class="ls-vb-palette-item" t-foreach="formComponents" t-as="c" t-key="c.id"
             draggable="true" t-on-dragstart="(ev) => this.onPaletteDrag(ev, c)"
             t-on-dragend="(ev) => this.onPaletteDragEnd(ev)"
             t-on-click="() => this.addFormComponent(c.type)">
          <t t-out="window.lucideIcon(c.icon, 14)"/>
          <span t-esc="c.label"/>
        </div>
      </div>
      <div class="ls-vb-palette-section" t-if="state.activeTab === 'form'">
        <div class="ls-vb-palette-title">Form Settings</div>
        <div class="ls-vb-prop">
          <label>Form Label</label>
          <input type="text" t-model="state.arch.string" placeholder="Form title"></input>
        </div>
        <div class="ls-vb-prop">
          <label>Title Field (oe_title)</label>
          <select t-model="state.arch.title">
            <option value="">none</option>
            <t t-foreach="stringFields" t-as="sf" t-key="sf.name">
              <option t-att-value="sf.name" t-esc="sf.string"></option>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Statusbar Field</label>
          <select t-model="state.arch.statusbar">
            <option value="">none</option>
            <t t-foreach="availableFields" t-as="sbf" t-key="sbf.name">
              <option t-if="sbf.type === 'selection'" t-att-value="sbf.name" t-esc="sbf.string"></option>
            </t>
          </select>
        </div>
      </div>

      <!-- Model Fields -->
      <div class="ls-vb-palette-section">
        <div class="ls-vb-palette-title">Model Fields</div>
        <div class="ls-vb-field-search">
          <t t-out="window.lucideIcon('search', 13)"/>
          <input type="text" t-model="state.fieldSearch" placeholder="Search fields..." class="ls-vb-field-search-input"/>
        </div>
        <div class="ls-vb-field-list">
          <div class="ls-vb-palette-item" t-foreach="availableFields" t-as="f" t-key="f.name"
               draggable="true"
               t-on-dragstart="(ev) => this.onFieldPaletteDrag(ev, f.name)"
               t-on-dragend="(ev) => this.onFieldPaletteDragEnd(ev)"
               t-on-click="() => this.addField(f.name)"
               t-att-title="f.help || ''">
            <t t-out="window.lucideIcon(this.fieldIcon(f.type), 14)"/>
            <span t-esc="f.string"/>
            <span class="ls-vb-fi-type" t-esc="f.type"/>
          </div>
        </div>
        <div class="ls-vb-field-count" t-esc="availableFields.length + ' fields'"/>
      </div>

      <!-- Tree Attributes (List tab only) -->
      <div class="ls-vb-palette-section" t-if="state.activeTab === 'list'">
        <div class="ls-vb-palette-title">Tree Attributes</div>
        <div class="ls-vb-prop">
          <label>editable</label>
          <select t-model="state.arch.editable">
            <option value="">disabled</option>
            <option value="top">top</option>
            <option value="bottom">bottom</option>
          </select>
        </div>
        <div class="ls-vb-prop-row">
          <label>multi_edit</label>
          <label class="ls-vb-toggle">
            <input type="checkbox" t-model="state.arch.multi_edit"/>
            <span class="ls-vb-toggle-slider"></span>
          </label>
        </div>
        <div class="ls-vb-prop">
          <label>limit</label>
          <input type="number" t-model="state.arch.limit" min="10" step="10"/>
        </div>
      </div>
    </div>

    <!-- Center: Preview -->
    <div class="ls-vb-center">
      <!-- LIST BUILDER -->
      <t t-if="state.activeTab === 'list'">
        <div class="ls-vb-preview">
          <div class="ls-vb-preview-header">
            <t t-out="window.lucideIcon('table', 14)"/>
            Preview — <t t-esc="state.selectedModel"/>
          </div>
          <table class="ls-vb-table">
            <thead><tr>
              <th class="ls-vb-drag-col"></th>
              <t t-foreach="state.arch.fields or []" t-as="fn" t-key="fn">
                <th t-att-class="state.selectedField === fn ? 'ls-vb-col-selected' : ''"
                    t-on-click="() => this.selectField(fn)"
                    style="cursor:pointer">
                  <t t-esc="fieldLabel(fn)"/>
                </th>
              </t>
            </tr></thead>
            <tbody>
              <t t-foreach="[1,2,3,4]" t-as="row" t-key="row">
                <tr>
                  <td class="ls-vb-drag-col"><t t-out="window.lucideIcon('grip-vertical', 12)"/></td>
                  <t t-foreach="state.arch.fields or []" t-as="fn" t-key="fn">
                    <td t-att-class="state.selectedField === fn ? 'ls-vb-col-selected' : ''"
                        t-on-click="() => this.selectField(fn)">
                      <t t-out="sampleValue(fn, row)"/>
                    </td>
                  </t>
                </tr>
              </t>
            </tbody>
          </table>
        </div>
      </t>

      <!-- FORM BUILDER -->
      <t t-if="state.activeTab === 'form'">
        <div class="ls-vb-preview">
          <div class="ls-vb-preview-header">
            <t t-out="window.lucideIcon('file-text', 14)"/>
            Form Preview — <t t-esc="state.selectedModel"/>
          </div>
          <div class="ls-vb-form-preview">
            <t t-if="state.arch.statusbar">
              <div style="padding:8px 16px;background:#f3f4f6;border-bottom:1px solid #e5e7eb;display:flex;gap:8px;align-items:center">
                <span class="ls-vb-sample-badge">New</span>
                <span class="ls-vb-sample-badge" style="background:#dbeafe;color:#1e40af">In Progress</span>
                <span class="ls-vb-sample-badge" style="background:#d1fae5;color:#047857">Done</span>
              </div>
            </t>
            <div t-if="state.arch.stat_buttons and state.arch.stat_buttons.length" style="display:flex; justify-content:flex-end; padding:8px; border-bottom:1px solid #e5e7eb;">
              <t t-foreach="state.arch.stat_buttons" t-as="sb" t-key="sb_index">
                <button class="ls-vb-btn-ghost" style="padding:4px 8px; font-size:12px; display:flex; gap:4px; align-items:center; border:1px solid #d1d5db; border-radius:4px; margin-left:4px;" title="Remove Stat Button" t-on-click.stop="() => this.removeStatButton(sb_index)">
                  <t t-out="window.lucideIcon('bar-chart-2', 14)"></t> Stat
                  <t t-out="window.lucideIcon('trash-2', 12)"></t>
                </button>
              </t>
            </div>
            <div class="ls-vb-form-layout ls-vb-drop-zone"
                 t-on-dragover.prevent="(ev) => this.onDragOver(ev)"
                 t-on-dragleave="(ev) => this.onDragLeave(ev)"
                 t-on-drop="(ev) => this.onDropFormLayout(ev)">
              <t t-foreach="state.arch.groups or []" t-as="grp" t-key="grp_index">
                <div class="ls-vb-form-group-wrapper">
                  <div class="ls-vb-form-group-toolbar">
                     <input type="text" class="ls-vb-group-label-input"
                            t-att-value="grp.string || ''" placeholder="Group label"
                            t-on-change="(ev) => this.setGroupString(grp_index, ev.target.value)"
                            t-on-click.stop="() => {}"></input>
                     <select class="ls-vb-col-count-select" t-on-change="(ev) => this.setGroupColumns(grp_index, ev.target.value)"
                             t-on-click.stop="() => {}">
                       <option value="1" t-att-selected="(grp.columns || []).length === 1">1 col</option>
                       <option value="2" t-att-selected="(grp.columns || []).length === 2">2 col</option>
                       <option value="3" t-att-selected="(grp.columns || []).length === 3">3 col</option>
                       <option value="4" t-att-selected="(grp.columns || []).length === 4">4 col</option>
                     </select>
                     <button class="ls-vb-btn-ghost ls-vb-toolbar-icon" title="Move Up" t-on-click.stop="() => this.moveGroup(grp_index, -1)"><t t-out="window.lucideIcon('arrow-up', 12)"></t></button>
                     <button class="ls-vb-btn-ghost ls-vb-toolbar-icon" title="Move Down" t-on-click.stop="() => this.moveGroup(grp_index, 1)"><t t-out="window.lucideIcon('arrow-down', 12)"></t></button>
                     <button class="ls-vb-btn-ghost ls-vb-toolbar-icon" style="color:#ef4444" title="Remove Group" t-on-click.stop="() => this.removeGroup(grp_index)"><t t-out="window.lucideIcon('trash-2', 12)"></t></button>
                  </div>
                  <div class="ls-vb-form-group" t-att-style="'grid-template-columns: repeat(' + ((grp.columns || []).length || 2) + ', 1fr); margin-bottom:0'">
                  <t t-foreach="grp.columns or []" t-as="col" t-key="col_index">
                    <div class="ls-vb-form-col">
                      <t t-foreach="col" t-as="fld" t-key="fld_index">
                        <div class="ls-vb-field-drop-zone"
                             t-on-dragover.prevent="(ev) => this.onDragOver(ev)"
                             t-on-dragleave="(ev) => this.onDragLeave(ev)"
                             t-on-drop="(ev) => this.onDropFormCol(ev, grp_index, col_index, fld_index)"></div>
                        <div class="ls-vb-form-field"
                             draggable="true"
                             t-on-dragstart="(ev) => this.onFormFieldDrag(ev, typeof fld === 'string' ? fld : fld.name, grp_index, col_index, fld_index)"
                             t-on-dragend="(ev) => this.onFormFieldDragEnd(ev)"
                             t-att-class="state.selectedField === (typeof fld === 'string' ? fld : fld.name) ? 'selected' : ''"
                             t-on-click.stop="() => this.selectField(typeof fld === 'string' ? fld : fld.name)">
                          <span class="ls-vb-form-field-label">
                            <t t-out="window.lucideIcon(this.fieldIcon(this.fieldType(typeof fld === 'string' ? fld : fld.name)), 12)"/>
                            <t t-esc="fieldLabel(typeof fld === 'string' ? fld : fld.name)"/>
                          </span>
                          <div class="ls-vb-form-field-value"
                               t-out="sampleValue(typeof fld === 'string' ? fld : fld.name, 1)"></div>
                        </div>
                      </t>
                      <div class="ls-vb-field-drop-tail"
                           t-on-dragover.prevent="(ev) => this.onDragOver(ev)"
                           t-on-dragleave="(ev) => this.onDragLeave(ev)"
                           t-on-drop="(ev) => this.onDropFormCol(ev, grp_index, col_index, null)">+ Drop field here</div>
                    </div>
                  </t>
                  </div>
                </div>
              </t>
              <div t-if="!state.arch.groups or state.arch.groups.length === 0" style="padding:40px 20px; text-align:center; color:#9ca3af; border:2px dashed #e5e7eb; border-radius:8px;">
                Drop a Group Layout Component here
              </div>
            </div>
            <t t-if="state.arch.tabs and state.arch.tabs.length">
              <div class="ls-vb-form-tabs">
                <div class="ls-vb-form-tab-bar">
                  <t t-foreach="state.arch.tabs" t-as="tab" t-key="tab_index">
                    <button class="ls-vb-form-tab-btn"
                            t-att-class="(state.formActiveTab === tab.name ? 'active ' : '') + (state.selectedTab === tab_index ? 'ls-vb-col-selected' : '')"
                            t-on-click.stop="() => this.selectTab(tab_index)"
                            t-esc="tab.label"></button>
                  </t>
                </div>
                <div class="ls-vb-form-tab-content ls-vb-drop-zone"
                     t-on-dragover.prevent="(ev) => this.onDragOver(ev)"
                     t-on-dragleave="(ev) => this.onDragLeave(ev)"
                     t-on-drop="(ev) => this.onDropFormTabLayout(ev)">
                  <t t-foreach="state.arch.tabs.filter(t => t.name === state.formActiveTab)" t-as="activeTab" t-key="activeTab.name">

                    <!-- Tab Type: one2many (inline tree preview) -->
                    <t t-if="activeTab.type === 'one2many'">
                      <div style="padding:12px">
                        <div style="font-size:12px; color:#6b7280; margin-bottom:8px; display:flex; align-items:center; gap:6px">
                          <t t-out="window.lucideIcon('git-branch', 14)"></t>
                          <span>One2Many: </span>
                          <strong t-esc="fieldLabel(activeTab.field) || '(select field)'"></strong>
                        </div>
                        <t t-if="activeTab.tree_fields and activeTab.tree_fields.length">
                          <table class="ls-vb-table" style="font-size:12px">
                            <thead><tr>
                              <t t-foreach="activeTab.tree_fields" t-as="tf" t-key="tf">
                                <th style="padding:4px 8px; font-size:11px">
                                  <t t-esc="tf"></t>
                                  <button class="ls-vb-btn-ghost" style="padding:0 2px; margin-left:4px; color:#ef4444; cursor:pointer; font-size:10px;"
                                          t-on-click.stop="() => this.removeTabTreeField(state.selectedTab, tf_index)">x</button>
                                </th>
                              </t>
                            </tr></thead>
                            <tbody>
                              <t t-foreach="[1,2,3]" t-as="r" t-key="r">
                                <tr>
                                  <t t-foreach="activeTab.tree_fields" t-as="tf2" t-key="tf2">
                                    <td style="padding:4px 8px; font-size:11px; color:#6b7280" t-esc="tf2"></td>
                                  </t>
                                </tr>
                              </t>
                            </tbody>
                          </table>
                        </t>
                        <div t-if="!activeTab.tree_fields or activeTab.tree_fields.length === 0"
                             style="padding:20px; text-align:center; color:#9ca3af; font-size:12px; border:1px dashed #d1d5db; border-radius:6px;">
                          Configure tree fields in the Tab Properties panel →
                        </div>
                      </div>
                    </t>

                    <!-- Tab Type: field (single field) -->
                    <t t-if="activeTab.type === 'field'">
                      <div style="padding:20px">
                        <div style="font-size:12px; color:#6b7280; margin-bottom:8px; display:flex; align-items:center; gap:6px">
                          <t t-out="window.lucideIcon('box', 14)"></t>
                          <span>Single Field: </span>
                          <strong t-esc="fieldLabel(activeTab.field) || '(select field)'"></strong>
                        </div>
                        <div t-if="activeTab.field" class="ls-vb-form-field" style="max-width:400px; cursor:default;">
                          <span class="ls-vb-form-field-label" t-esc="fieldLabel(activeTab.field)"></span>
                          <div class="ls-vb-form-field-value" t-out="sampleValue(activeTab.field, 1)"></div>
                        </div>
                        <div t-if="!activeTab.field"
                             style="padding:20px; text-align:center; color:#9ca3af; font-size:12px; border:1px dashed #d1d5db; border-radius:6px;">
                          Select a field in the Tab Properties panel →
                        </div>
                      </div>
                    </t>

                    <!-- Tab Type: layout (default - groups with fields) -->
                    <t t-if="!activeTab.type or activeTab.type === 'layout'">
                    <t t-foreach="activeTab.groups or []" t-as="grp" t-key="grp_index">
                      <div class="ls-vb-form-group-wrapper" style="position:relative; margin-bottom:16px;">
                        <div class="ls-vb-form-group-toolbar" style="position:absolute; top:-10px; right:10px; background:#fff; border:1px solid #d1d5db; border-radius:4px; padding:2px; display:flex; gap:4px; z-index:10; box-shadow:0 1px 2px rgba(0,0,0,0.05)">
                           <button class="ls-vb-btn-ghost" style="padding:2px; cursor:pointer;" title="Move Up" t-on-click.stop="() => this.moveTabGroup(activeTab.name, grp_index, -1)"><t t-out="window.lucideIcon('arrow-up', 12)"></t></button>
                           <button class="ls-vb-btn-ghost" style="padding:2px; cursor:pointer;" title="Move Down" t-on-click.stop="() => this.moveTabGroup(activeTab.name, grp_index, 1)"><t t-out="window.lucideIcon('arrow-down', 12)"></t></button>
                           <button class="ls-vb-btn-ghost" style="padding:2px; cursor:pointer; color:#ef4444" title="Remove Group" t-on-click.stop="() => this.removeTabGroup(activeTab.name, grp_index)"><t t-out="window.lucideIcon('trash-2', 12)"></t></button>
                        </div>
                        <div class="ls-vb-form-group" style="margin-bottom:0">
                          <t t-foreach="grp.columns or []" t-as="col" t-key="col_index">
                            <div class="ls-vb-form-col" style="position:relative; min-height:40px;">
                              <t t-foreach="col" t-as="fld" t-key="fld_index">
                                <div class="ls-vb-field-drop-zone ls-vb-drop-zone" style="height:6px; margin:-3px 0; z-index:5; position:relative; opacity:0; transition:opacity 0.2s; background:#6366f1; border-radius:2px;"
                                     t-on-dragover.prevent="(ev) => this.onDragOver(ev)"
                                     t-on-dragleave="(ev) => this.onDragLeave(ev)"
                                     t-on-drop="(ev) => this.onDropFormTabCol(ev, activeTab.name, grp_index, col_index, fld_index)"></div>
                                <div class="ls-vb-form-field"
                                     draggable="true"
                                     t-on-dragstart="(ev) => this.onFormFieldDragTab(ev, activeTab.name, typeof fld === 'string' ? fld : fld.name, grp_index, col_index, fld_index)"
                                     t-att-class="state.selectedField === (typeof fld === 'string' ? fld : fld.name) ? 'selected' : ''"
                                     t-on-click.stop="() => this.selectField(typeof fld === 'string' ? fld : fld.name)">
                                  <span class="ls-vb-form-field-label"
                                        t-esc="fieldLabel(typeof fld === 'string' ? fld : fld.name)"></span>
                                  <div class="ls-vb-form-field-value"
                                       t-out="sampleValue(typeof fld === 'string' ? fld : fld.name, 1)"></div>
                                </div>
                              </t>
                              <div class="ls-vb-field-drop-zone ls-vb-drop-zone" style="height:20px; margin-top:4px; border:2px dashed transparent; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#9ca3af; font-size:11px;"
                                   t-on-dragover.prevent="(ev) => this.onDragOver(ev)"
                                   t-on-dragleave="(ev) => this.onDragLeave(ev)"
                                   t-on-drop="(ev) => this.onDropFormTabCol(ev, activeTab.name, grp_index, col_index, null)">Drop fields here</div>
                            </div>
                          </t>
                        </div>
                      </div>
                    </t>
                    <div t-if="!activeTab.groups or activeTab.groups.length === 0" style="padding:40px 20px; text-align:center; color:#9ca3af; border:2px dashed #e5e7eb; border-radius:8px;">
                      Drop a Group or Fields here
                    </div>
                    </t>

                  </t>
                </div>
              </div>
            </t>
            <t t-if="state.arch.chatter">
              <div style="margin-top:20px; padding:16px; border-top:1px solid #e5e7eb; background:#f9fafb; position:relative;">
                <h4 style="margin:0 0 10px 0; font-size:14px; color:#374151;">Chatter</h4>
                <div style="font-size:12px; color:#6b7280;">Send messages, log notes, and schedule activities</div>
                <button class="ls-vb-btn-ghost" title="Remove Chatter" style="position:absolute; top:16px; right:16px; padding:2px; cursor:pointer; color:#ef4444" t-on-click.stop="() => this.state.arch.chatter = false">
                   <t t-out="window.lucideIcon('trash-2', 12)"></t>
                </button>
              </div>
            </t>
          </div>
        </div>
      </t>

      <!-- KANBAN BUILDER -->
      <t t-if="state.activeTab === 'kanban'">
        <div class="ls-vb-preview">
          <div class="ls-vb-preview-header">
            <t t-out="window.lucideIcon('columns', 14)"/>
            Kanban Preview — <t t-esc="state.selectedModel"/>
          </div>
          <div class="ls-vb-kanban-preview">
            <t t-foreach="['New','In Progress','Done']" t-as="stage" t-key="stage">
              <div class="ls-vb-kanban-col">
                <div class="ls-vb-kanban-col-header">
                  <t t-esc="stage"/>
                  <span class="ls-vb-kanban-col-count">2</span>
                </div>
                <div class="ls-vb-kanban-cards">
                  <t t-foreach="[1,2]" t-as="c" t-key="c">
                    <div class="ls-vb-kanban-card">
                      <div class="ls-vb-kanban-card-title" t-esc="'Record ' + (stage_index * 2 + c)"/>
                      <t t-foreach="state.arch.card_fields or []" t-as="cf" t-key="cf">
                        <div class="ls-vb-kanban-card-field">
                          <span style="color:#9ca3af" t-esc="fieldLabel(cf) + ': '"/>
                          <t t-out="sampleValue(cf, c)"/>
                        </div>
                      </t>
                    </div>
                  </t>
                </div>
              </div>
            </t>
          </div>
        </div>
      </t>

      <!-- CALENDAR BUILDER -->
      <t t-if="state.activeTab === 'calendar'">
        <div class="ls-vb-preview">
          <div class="ls-vb-preview-header">
            <t t-out="window.lucideIcon('calendar', 14)"/>
            Calendar Preview — <t t-esc="state.selectedModel"/>
          </div>
          <div class="ls-vb-calendar-preview">
            <div class="ls-vb-mini-cal">
              <t t-foreach="['Mon','Tue','Wed','Thu','Fri','Sat','Sun']" t-as="d" t-key="d">
                <div class="ls-vb-mini-cal-head" t-esc="d"/>
              </t>
              <t t-foreach="calendarDays" t-as="day" t-key="day.num + '_' + day.month">
                <div t-att-class="'ls-vb-mini-cal-day' + (day.today ? ' today' : '') + (day.event ? ' has-event' : '') + (day.otherMonth ? ' other-month' : '')">
                  <t t-esc="day.num"/>
                </div>
              </t>
            </div>
          </div>
        </div>
      </t>

      <!-- PIVOT BUILDER -->
      <t t-if="state.activeTab === 'pivot'">
        <div class="ls-vb-preview">
          <div class="ls-vb-preview-header">
            <t t-out="window.lucideIcon('grid-3x3', 14)"/>
            Pivot Preview — <t t-esc="state.selectedModel"/>
          </div>
          <div class="ls-vb-pivot-preview">
            <table class="ls-vb-pivot-table">
              <thead><tr>
                <th></th>
                <t t-foreach="state.arch.col_groupby or ['Total']" t-as="cg" t-key="cg">
                  <th t-esc="fieldLabel(cg) || cg"/>
                </t>
                <th>Total</th>
              </tr></thead>
              <tbody>
                <t t-foreach="state.arch.row_groupby or ['Total']" t-as="rg" t-key="rg">
                  <tr>
                    <td class="label" t-esc="fieldLabel(rg) || rg"/>
                    <t t-foreach="state.arch.col_groupby or ['Total']" t-as="cg2" t-key="cg2">
                      <td t-esc="Math.floor(Math.random()*1000)"/>
                    </t>
                    <td style="font-weight:600" t-esc="Math.floor(Math.random()*5000)"/>
                  </tr>
                </t>
                <tr class="total">
                  <td class="label">Total</td>
                  <t t-foreach="state.arch.col_groupby or ['Total']" t-as="cg3" t-key="cg3">
                    <td t-esc="Math.floor(Math.random()*3000)"/>
                  </t>
                  <td t-esc="Math.floor(Math.random()*10000)"/>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </t>

      <t t-if="state.activeTab === 'spreadsheet'">
        <div class="ls-vb-preview">
          <div class="ls-vb-preview-header">
            <t t-out="window.lucideIcon('file-spreadsheet', 14)"/>
            Spreadsheet Preview — <t t-esc="state.selectedModel"/>
          </div>
          <div class="ls-vb-spreadsheet-preview">
            <table class="ls-vb-spreadsheet-table">
              <thead><tr>
                <th class="ls-vb-sp-rownum">#</th>
                <t t-foreach="state.arch.fields or []" t-as="f" t-key="f">
                  <th t-esc="getFieldLabel(f) || f"/>
                </t>
              </tr></thead>
              <tbody>
                <t t-foreach="[1,2,3,4,5]" t-as="row" t-key="row">
                  <tr>
                    <td class="ls-vb-sp-rownum" t-esc="row"/>
                    <t t-foreach="state.arch.fields or []" t-as="f2" t-key="f2 + row">
                      <td class="ls-vb-sp-cell">—</td>
                    </t>
                  </tr>
                </t>
                <tr class="ls-vb-sp-total">
                  <td class="ls-vb-sp-rownum" style="font-weight:600">Σ</td>
                  <t t-foreach="state.arch.fields or []" t-as="f3" t-key="'tot_' + f3">
                    <td class="ls-vb-sp-cell" t-esc="state.arch.aggregation || 'sum'"/>
                  </t>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </t>

      <!-- XML Code Block -->
      <div class="ls-vb-xml" t-if="state.showXml">
        <div class="ls-vb-xml-header">
          <span>XML Architecture</span>
          <button class="ls-vb-btn-ghost" style="color:#a5b4fc" t-on-click="copyXml">
            <t t-out="window.lucideIcon('copy', 12)"/> Copy
          </button>
        </div>
        <pre t-esc="state.xmlPreview"/>
      </div>

      <!-- Attribute Reference Cards -->
      <div class="ls-vb-attr-cards" t-if="state.activeTab === 'list'">
        <t t-foreach="listAttrCards" t-as="card" t-key="card.name">
          <div class="ls-vb-attr-card">
            <h5 t-esc="card.name"/>
            <span class="ls-vb-attr-type" t-esc="card.type"/>
            <p t-esc="card.desc"/>
          </div>
        </t>
      </div>
    </div>

    <!-- Right: Properties Panel -->
    <div class="ls-vb-props" t-if="state.selectedField or state.selectedTab != null">
      <div class="ls-vb-props-section" t-if="state.selectedField">
        <div class="ls-vb-props-title">Field Properties</div>
        <div class="ls-vb-prop">
          <label>Field Name</label>
          <input type="text" t-att-value="state.selectedField" readonly="true"></input>
        </div>
        <div class="ls-vb-prop">
          <label>Label</label>
          <input type="text" t-att-value="fieldLabel(state.selectedField)" readonly="true"></input>
        </div>
        <div class="ls-vb-prop">
          <label>Type</label>
          <input type="text" t-att-value="fieldType(state.selectedField)" readonly="true"></input>
        </div>
      </div>

      <div class="ls-vb-props-section" t-if="state.activeTab === 'form' and state.selectedField">
        <div class="ls-vb-props-title">Form Field Config</div>
        <div class="ls-vb-prop">
          <label>Widget</label>
          <select t-on-change="(ev) => this.setFormFieldConfig(state.selectedField, 'widget', ev.target.value)">
            <t t-foreach="widgetOptions" t-as="wo" t-key="wo[0]">
              <option t-att-value="wo[0]" t-att-selected="getFormFieldConfig(state.selectedField, 'widget') === wo[0]" t-esc="wo[1]"></option>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Placeholder</label>
          <input type="text" t-att-value="getFormFieldConfig(state.selectedField, 'placeholder')" placeholder="e.g. Enter value..."
                 t-on-change="(ev) => this.setFormFieldConfig(state.selectedField, 'placeholder', ev.target.value)"></input>
        </div>
        <div class="ls-vb-prop-row">
          <label>Required</label>
          <label class="ls-vb-toggle">
            <input type="checkbox" t-att-checked="getFormFieldConfig(state.selectedField, 'required')"
                   t-on-change="(ev) => this.setFormFieldConfig(state.selectedField, 'required', ev.target.checked)"></input>
            <span class="ls-vb-toggle-slider"></span>
          </label>
        </div>
        <div class="ls-vb-prop-row">
          <label>Readonly</label>
          <label class="ls-vb-toggle">
            <input type="checkbox" t-att-checked="getFormFieldConfig(state.selectedField, 'readonly')"
                   t-on-change="(ev) => this.setFormFieldConfig(state.selectedField, 'readonly', ev.target.checked)"></input>
            <span class="ls-vb-toggle-slider"></span>
          </label>
        </div>
        <div class="ls-vb-prop-row">
          <label>Invisible</label>
          <label class="ls-vb-toggle">
            <input type="checkbox" t-att-checked="getFormFieldConfig(state.selectedField, 'invisible')"
                   t-on-change="(ev) => this.setFormFieldConfig(state.selectedField, 'invisible', ev.target.checked)"></input>
            <span class="ls-vb-toggle-slider"></span>
          </label>
        </div>
        <div class="ls-vb-prop-row">
          <label>No Label</label>
          <label class="ls-vb-toggle">
            <input type="checkbox" t-att-checked="getFormFieldConfig(state.selectedField, 'nolabel')"
                   t-on-change="(ev) => this.setFormFieldConfig(state.selectedField, 'nolabel', ev.target.checked)"></input>
            <span class="ls-vb-toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="ls-vb-props-section" t-if="state.activeTab === 'list' and state.selectedField">
        <div class="ls-vb-props-title">Column Config</div>
        <div class="ls-vb-prop">
          <label>Widget Override</label>
          <select t-on-change="(ev) => this.setColumnConfig(state.selectedField, 'widget', ev.target.value)">
            <option value="">default</option>
            <option value="badge">badge</option>
            <option value="float_time">float_time</option>
            <option value="progressbar">progressbar</option>
            <option value="remaining_days">remaining_days</option>
            <option value="monetary">monetary</option>
            <option value="many2one_avatar">many2one_avatar</option>
            <option value="priority">priority</option>
            <option value="handle">handle</option>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Optional</label>
          <select t-on-change="(ev) => this.setColumnConfig(state.selectedField, 'optional', ev.target.value)">
            <option value="">none</option>
            <option value="show">show</option>
            <option value="hide">hide</option>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Aggregation</label>
          <select t-on-change="(ev) => this.setColumnConfig(state.selectedField, '_agg', ev.target.value)">
            <option value="">none</option>
            <option value="sum">sum</option>
            <option value="avg">avg</option>
            <option value="max">max</option>
            <option value="min">min</option>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Width</label>
          <input type="text" placeholder="e.g. 120px"
                 t-on-change="(ev) => this.setColumnConfig(state.selectedField, 'width', ev.target.value)"></input>
        </div>
      </div>

      <div class="ls-vb-props-section" t-if="state.selectedTab != null and state.arch.tabs and state.arch.tabs[state.selectedTab]">
        <div class="ls-vb-props-title">Tab Properties</div>
        <div class="ls-vb-prop">
           <label>Label</label>
           <input type="text" t-model="state.arch.tabs[state.selectedTab].label"></input>
        </div>
        <div class="ls-vb-prop">
           <label>Name</label>
           <input type="text" t-model="state.arch.tabs[state.selectedTab].name" disabled="1"></input>
        </div>
        <div class="ls-vb-prop">
           <label>Tab Type</label>
           <select t-on-change="(ev) => this.setTabType(state.selectedTab, ev.target.value)">
             <option value="layout" t-att-selected="!state.arch.tabs[state.selectedTab].type or state.arch.tabs[state.selectedTab].type === 'layout'">Layout (Groups)</option>
             <option value="one2many" t-att-selected="state.arch.tabs[state.selectedTab].type === 'one2many'">One2Many Field</option>
             <option value="field" t-att-selected="state.arch.tabs[state.selectedTab].type === 'field'">Single Field</option>
           </select>
        </div>

        <!-- One2Many config -->
        <t t-if="state.arch.tabs[state.selectedTab].type === 'one2many'">
          <div class="ls-vb-prop">
            <label>One2Many Field</label>
            <select t-on-change="(ev) => this.setTabField(state.selectedTab, ev.target.value)">
              <option value="">— Select —</option>
              <t t-foreach="o2mFields" t-as="of" t-key="of.name">
                <option t-att-value="of.name" t-att-selected="state.arch.tabs[state.selectedTab].field === of.name" t-esc="of.string + ' (' + of.name + ')'"></option>
              </t>
            </select>
          </div>
          <div class="ls-vb-prop">
            <label>Editable</label>
            <select t-model="state.arch.tabs[state.selectedTab].editable">
              <option value="bottom">bottom</option>
              <option value="top">top</option>
            </select>
          </div>
          <div class="ls-vb-prop">
            <label>Tree Columns</label>
            <div style="margin-top:4px">
              <t t-foreach="state.arch.tabs[state.selectedTab].tree_fields or []" t-as="tf" t-key="tf">
                <div style="display:flex; align-items:center; gap:4px; padding:2px 0;">
                  <span style="flex:1; font-size:11px; padding:2px 6px; background:#f3f4f6; border-radius:3px;" t-esc="tf"></span>
                  <button class="ls-vb-btn-ghost" style="padding:2px; color:#ef4444; cursor:pointer;" t-on-click.stop="() => this.removeTabTreeField(state.selectedTab, tf_index)">
                    <t t-out="window.lucideIcon('x', 10)"></t>
                  </button>
                </div>
              </t>
            </div>
            <select style="margin-top:6px; font-size:11px;" t-on-change="(ev) => { this.addTabTreeField(state.selectedTab, ev.target.value); ev.target.value = ''; }">
              <option value="">+ Add column...</option>
              <t t-foreach="getTabChildFields(state.selectedTab)" t-as="cf" t-key="cf.name">
                <option t-att-value="cf.name" t-esc="cf.string + ' (' + cf.type + ')'"></option>
              </t>
              <t t-if="getTabChildFields(state.selectedTab).length === 0">
                <t t-foreach="availableFields" t-as="af" t-key="af.name">
                  <option t-att-value="af.name" t-esc="af.string + ' (' + af.type + ')'"></option>
                </t>
              </t>
            </select>
          </div>
        </t>

        <!-- Single field config -->
        <t t-if="state.arch.tabs[state.selectedTab].type === 'field'">
          <div class="ls-vb-prop">
            <label>Field</label>
            <select t-on-change="(ev) => this.setTabField(state.selectedTab, ev.target.value)">
              <option value="">— Select —</option>
              <t t-foreach="availableFields" t-as="af2" t-key="af2.name">
                <option t-att-value="af2.name" t-att-selected="state.arch.tabs[state.selectedTab].field === af2.name" t-esc="af2.string + ' (' + af2.type + ')'"></option>
              </t>
            </select>
          </div>
        </t>

        <div style="display:flex; gap:8px; margin-top:12px">
          <button class="ls-vb-btn ls-vb-btn-sm" style="flex:1" t-on-click="() => this.moveTab(state.selectedTab, -1)"><t t-out="window.lucideIcon('arrow-left', 12)"></t> Left</button>
          <button class="ls-vb-btn ls-vb-btn-sm" style="flex:1" t-on-click="() => this.moveTab(state.selectedTab, 1)">Right <t t-out="window.lucideIcon('arrow-right', 12)"></t></button>
        </div>
        <div style="margin-top:12px">
          <button class="ls-vb-btn ls-vb-btn-danger ls-vb-btn-sm" style="width: 100%" t-on-click="() => this.removeTab(state.selectedTab)">
            <t t-out="window.lucideIcon('trash-2', 12)"></t> Remove Tab
          </button>
        </div>
      </div>

      <div style="margin-top:16px; border-top: 1px solid #e5e7eb; padding-top: 16px;" t-if="(state.activeTab === 'list' or state.activeTab === 'form') and state.selectedField">
        <button class="ls-vb-btn ls-vb-btn-danger ls-vb-btn-sm" style="width: 100%" t-on-click="removeSelectedField">
          <t t-out="window.lucideIcon('trash-2', 12)"></t> Remove <t t-esc="state.activeTab === 'list' ? 'Column' : 'Field'"></t>
        </button>
      </div>

      <!-- Kanban/Calendar/Pivot field config -->
      <div class="ls-vb-props-section" t-if="state.activeTab === 'kanban'">
        <div class="ls-vb-props-title">Kanban Config</div>
        <div class="ls-vb-prop">
          <label>Group By</label>
          <select t-model="state.arch.default_group_by">
            <option value="">none</option>
            <t t-foreach="groupableFields" t-as="gf" t-key="gf.name">
              <option t-att-value="gf.name" t-esc="gf.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Card Title</label>
          <select t-model="state.arch.card_title">
            <t t-foreach="stringFields" t-as="sf" t-key="sf.name">
              <option t-att-value="sf.name" t-esc="sf.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Card Image</label>
          <select t-model="state.arch.card_image">
            <option value="">none</option>
            <t t-foreach="binaryFields" t-as="bf" t-key="bf.name">
              <option t-att-value="bf.name" t-esc="bf.string"/>
            </t>
            <t t-foreach="stringFields" t-as="sf2" t-key="'img_'+sf2.name">
              <option t-att-value="sf2.name" t-esc="sf2.string + ' (URL)'"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Card Tags</label>
          <select t-model="state.arch.card_tags">
            <option value="">none</option>
            <t t-foreach="m2mFields" t-as="mf" t-key="mf.name">
              <option t-att-value="mf.name" t-esc="mf.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Color Field</label>
          <select t-model="state.arch.color_field">
            <option value="">none</option>
            <t t-foreach="colorFields" t-as="cf" t-key="cf.name">
              <option t-att-value="cf.name" t-esc="cf.string"/>
            </t>
            <t t-foreach="selectionFields" t-as="selF" t-key="'sel_'+selF.name">
              <option t-att-value="selF.name" t-esc="selF.string + ' (selection)'"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Card Footer</label>
          <div class="ls-vb-field-list">
            <t t-foreach="state.arch.card_footer || []" t-as="cf2" t-key="'cf_'+cf2">
              <div class="ls-vb-field-chip">
                <span t-esc="getFieldLabel(cf2)"/>
                <button class="ls-vb-chip-x" t-on-click="() => this.removeFromArchArray('card_footer', cf2)">&#215;</button>
              </div>
            </t>
          </div>
          <select t-on-change="(ev) => { this.addToArchArray('card_footer', ev.target.value); ev.target.value = ''; }">
            <option value="">+ Add footer field</option>
            <t t-foreach="allFields" t-as="aff" t-key="'cff_'+aff.name">
              <option t-att-value="aff.name" t-esc="aff.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop-row">
          <label>Quick Create</label>
          <label class="ls-vb-toggle">
            <input type="checkbox" t-model="state.arch.quick_create"/>
            <span class="ls-vb-toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="ls-vb-props-section" t-if="state.activeTab === 'calendar'">
        <div class="ls-vb-props-title">Calendar Config</div>
        <div class="ls-vb-prop">
          <label>Date Start</label>
          <select t-model="state.arch.date_start">
            <t t-foreach="dateFields" t-as="df" t-key="df.name">
              <option t-att-value="df.name" t-esc="df.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Date Stop</label>
          <select t-model="state.arch.date_stop">
            <option value="">none</option>
            <t t-foreach="dateFields" t-as="df2" t-key="df2.name">
              <option t-att-value="df2.name" t-esc="df2.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Duration Field</label>
          <select t-model="state.arch.date_delay">
            <option value="">none</option>
            <t t-foreach="numericFields" t-as="nf" t-key="'delay_'+nf.name">
              <option t-att-value="nf.name" t-esc="nf.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Color Field</label>
          <select t-model="state.arch.color">
            <option value="">none</option>
            <t t-foreach="groupableFields" t-as="cf" t-key="cf.name">
              <option t-att-value="cf.name" t-esc="cf.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Default Mode</label>
          <select t-model="state.arch.mode">
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="day">Day</option>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Event Display Fields</label>
          <div class="ls-vb-field-list">
            <t t-foreach="state.arch.event_display_fields || []" t-as="ef" t-key="'ef_'+ef">
              <div class="ls-vb-field-chip">
                <span t-esc="getFieldLabel(ef)"/>
                <button class="ls-vb-chip-x" t-on-click="() => this.removeFromArchArray('event_display_fields', ef)">&#215;</button>
              </div>
            </t>
          </div>
          <select t-on-change="(ev) => { this.addToArchArray('event_display_fields', ev.target.value); ev.target.value = ''; }">
            <option value="">+ Add display field</option>
            <t t-foreach="allFields" t-as="aff" t-key="'ef_'+aff.name">
              <option t-att-value="aff.name" t-esc="aff.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Quick Create Name Field</label>
          <select t-model="state.arch.create_name_field">
            <option value="">default (name)</option>
            <t t-foreach="stringFields" t-as="sf" t-key="'cn_'+sf.name">
              <option t-att-value="sf.name" t-esc="sf.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop-row">
          <label>Quick Create</label>
          <label class="ls-vb-toggle">
            <input type="checkbox" t-model="state.arch.quick_create"/>
            <span class="ls-vb-toggle-slider"></span>
          </label>
        </div>
        <div class="ls-vb-prop-row">
          <label>Show Legend</label>
          <label class="ls-vb-toggle">
            <input type="checkbox" t-model="state.arch.color_legend"/>
            <span class="ls-vb-toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="ls-vb-props-section" t-if="state.activeTab === 'pivot'">
        <div class="ls-vb-props-title">Pivot Config</div>
        <div class="ls-vb-prop">
          <label>Row Group By</label>
          <select t-on-change="(ev) => this.addToArchArray('row_groupby', ev.target.value)">
            <option value="">+ Add row dimension</option>
            <t t-foreach="groupableFields" t-as="rf" t-key="rf.name">
              <option t-att-value="rf.name" t-esc="rf.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Col Group By</label>
          <select t-on-change="(ev) => this.addToArchArray('col_groupby', ev.target.value)">
            <option value="">+ Add col dimension</option>
            <t t-foreach="groupableFields" t-as="cf2" t-key="cf2.name">
              <option t-att-value="cf2.name" t-esc="cf2.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Measures</label>
          <select t-on-change="(ev) => this.addToArchArray('measures', ev.target.value)">
            <option value="">+ Add measure</option>
            <t t-foreach="numericFields" t-as="nf" t-key="nf.name">
              <option t-att-value="nf.name" t-esc="nf.string"/>
            </t>
          </select>
        </div>
      </div>

      <div class="ls-vb-props-section" t-if="state.activeTab === 'spreadsheet'">
        <div class="ls-vb-props-title">Spreadsheet Config</div>
        <div class="ls-vb-prop">
          <label>Fields</label>
          <select t-on-change="(ev) => this.addToArchArray('fields', ev.target.value)">
            <option value="">+ Add field</option>
            <t t-foreach="allFields" t-as="sf" t-key="sf.name">
              <option t-att-value="sf.name" t-esc="sf.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-arch-array" t-if="state.arch.fields and state.arch.fields.length">
          <t t-foreach="state.arch.fields" t-as="sf2" t-key="'sp_' + sf2 + '_' + sf2_index">
            <span class="ls-vb-arch-tag">
              <t t-esc="fieldLabel(sf2) || sf2"/>
              <button class="ls-vb-tag-remove" t-on-click="() => this.removeFromArchArray('fields', sf2_index)">×</button>
            </span>
          </t>
        </div>
        <div class="ls-vb-prop">
          <label>Column Width (px)</label>
          <input type="number" class="ls-vb-input" t-att-value="state.arch.column_width || 120"
                 t-on-change="(ev) => this.state.arch.column_width = parseInt(ev.target.value) || 120"/>
        </div>
        <div class="ls-vb-prop">
          <label>Row Height (px)</label>
          <input type="number" class="ls-vb-input" t-att-value="state.arch.row_height || 28"
                 t-on-change="(ev) => this.state.arch.row_height = parseInt(ev.target.value) || 28"/>
        </div>
        <div class="ls-vb-prop">
          <label>Row Limit</label>
          <input type="number" class="ls-vb-input" t-att-value="state.arch.limit || 1000"
                 t-on-change="(ev) => this.state.arch.limit = parseInt(ev.target.value) || 1000"/>
        </div>
        <div class="ls-vb-prop">
          <label>Aggregation</label>
          <select t-model="state.arch.aggregation">
            <option value="sum">Sum</option>
            <option value="avg">Average</option>
            <option value="count">Count</option>
            <option value="min">Min</option>
            <option value="max">Max</option>
            <option value="none">None</option>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label class="ls-vb-toggle">
            <input type="checkbox" t-att-checked="state.arch.readonly"
                   t-on-change="(ev) => this.state.arch.readonly = ev.target.checked"/>
            <span>Read-only</span>
          </label>
        </div>
      </div>
    </div>
  </div>

  <!-- Export Code Modal -->
  <div class="ls-vb-modal-overlay" t-if="state.showCode" t-on-click.self="() => this.state.showCode = false">
    <div class="ls-vb-modal">
      <div class="ls-vb-modal-header">
        <span>Export PHP Code — <t t-esc="state.activeTab"/> view</span>
        <button class="ls-vb-btn-ghost" t-on-click="() => this.state.showCode = false">✕</button>
      </div>
      <div class="ls-vb-modal-body">
        <pre class="ls-vb-code-block"><code t-esc="state.codePreview"/></pre>
      </div>
      <div class="ls-vb-modal-footer">
        <button class="ls-vb-btn" t-on-click="copyCode">
          <t t-out="window.lucideIcon('clipboard-copy', 14)"/> Copy to Clipboard
        </button>
        <button class="ls-vb-btn" t-on-click="() => this.state.showCode = false">Close</button>
      </div>
    </div>
  </div>

  <!-- Toast -->
  <div class="ls-vb-toast" t-if="state.toast" t-att-class="'ls-vb-toast ' + (state.toastType || '')">
    <t t-out="window.lucideIcon(state.toastType === 'error' ? 'alert-circle' : 'check-circle', 14)"/>
    <t t-esc="state.toast"/>
  </div>
</div>
`})(),(function(){let{xml:e}=owl;window.MY_CUSTOM_PAGE_TPL=e`
<div class="ls-custom-page">

    <!-- ── Page Header ── -->
    <div class="ls-custom-page-header">
        <div class="ls-custom-page-title">
            <span class="ls-custom-page-icon">
                <t t-out="window.lucideIcon('star', 22)"/>
            </span>
            <div>
                <h1>My Custom Page</h1>
                <p class="ls-custom-page-subtitle">Halaman kustom terintegrasi dengan data dari server</p>
            </div>
        </div>
        <div class="ls-custom-page-actions">
            <button class="ls-btn ls-btn-outline ls-btn-sm" t-on-click="fetchData"
                    t-att-disabled="state.loading"
                    style="display:flex;align-items:center;gap:6px;">
                <t t-out="window.lucideIcon('refresh-cw', 14)"/>
                Muat Ulang
            </button>
            <button class="ls-btn ls-btn-primary ls-btn-sm" t-on-click="openCreateModal"
                    style="display:flex;align-items:center;gap:6px;">
                <t t-out="window.lucideIcon('plus', 14)"/>
                Tambah Item
            </button>
        </div>
    </div>

    <!-- ── Stats Cards ── -->
    <div class="ls-custom-stats" t-if="state.stats">
        <div class="ls-custom-stat-card">
            <div class="ls-custom-stat-icon ls-custom-stat-icon-purple">
                <t t-out="window.lucideIcon('layers', 20)"/>
            </div>
            <div class="ls-custom-stat-body">
                <span class="ls-custom-stat-label">Total Item</span>
                <span class="ls-custom-stat-value" t-esc="state.stats.total"/>
            </div>
        </div>
        <div class="ls-custom-stat-card">
            <div class="ls-custom-stat-icon ls-custom-stat-icon-green">
                <t t-out="window.lucideIcon('check-circle', 20)"/>
            </div>
            <div class="ls-custom-stat-body">
                <span class="ls-custom-stat-label">Aktif</span>
                <span class="ls-custom-stat-value" t-esc="state.stats.active"/>
            </div>
        </div>
        <div class="ls-custom-stat-card">
            <div class="ls-custom-stat-icon ls-custom-stat-icon-yellow">
                <t t-out="window.lucideIcon('clock', 20)"/>
            </div>
            <div class="ls-custom-stat-body">
                <span class="ls-custom-stat-label">Tertunda</span>
                <span class="ls-custom-stat-value" t-esc="state.stats.pending"/>
            </div>
        </div>
        <div class="ls-custom-stat-card">
            <div class="ls-custom-stat-icon ls-custom-stat-icon-red">
                <t t-out="window.lucideIcon('x-circle', 20)"/>
            </div>
            <div class="ls-custom-stat-body">
                <span class="ls-custom-stat-label">Nonaktif</span>
                <span class="ls-custom-stat-value" t-esc="state.stats.inactive"/>
            </div>
        </div>
    </div>

    <!-- ── Search Bar ── -->
    <div class="ls-custom-toolbar">
        <div class="ls-custom-search">
            <span class="ls-custom-search-icon">
                <t t-out="window.lucideIcon('search', 15)"/>
            </span>
            <input type="text" class="ls-custom-search-input"
                   placeholder="Cari nama atau deskripsi..."
                   t-model="state.searchQuery"
                   t-on-input="onSearch"/>
        </div>
        <div class="ls-custom-filter-group">
            <select class="ls-custom-select" t-model="state.filterStatus" t-on-change="onFilter">
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="pending">Tertunda</option>
                <option value="inactive">Nonaktif</option>
            </select>
        </div>
    </div>

    <!-- ── Loading ── -->
    <div class="ls-custom-loading" t-if="state.loading">
        <div class="ls-report-spinner"></div>
        <span>Memuat data...</span>
    </div>

    <!-- ── Error ── -->
    <div class="ls-custom-error" t-if="state.error and !state.loading">
        <t t-out="window.lucideIcon('alert-triangle', 20)"/>
        <span t-esc="state.error"/>
        <button class="ls-btn ls-btn-sm ls-btn-outline" t-on-click="fetchData">Coba Lagi</button>
    </div>

    <!-- ── Table ── -->
    <div class="ls-custom-table-wrap" t-if="!state.loading and !state.error">
        <table class="ls-custom-table" t-if="filteredItems.length">
            <thead>
                <tr>
                    <th style="width:40px;">#</th>
                    <th t-on-click="() => this.sortBy('name')" style="cursor:pointer;">
                        Nama
                        <t t-if="state.sortField === 'name'">
                            <t t-out="window.lucideIcon(state.sortDir === 'asc' ? 'chevron-up' : 'chevron-down', 12)"/>
                        </t>
                    </th>
                    <th>Deskripsi</th>
                    <th t-on-click="() => this.sortBy('status')" style="cursor:pointer;">
                        Status
                        <t t-if="state.sortField === 'status'">
                            <t t-out="window.lucideIcon(state.sortDir === 'asc' ? 'chevron-up' : 'chevron-down', 12)"/>
                        </t>
                    </th>
                    <th t-on-click="() => this.sortBy('created_at')" style="cursor:pointer;">
                        Dibuat
                        <t t-if="state.sortField === 'created_at'">
                            <t t-out="window.lucideIcon(state.sortDir === 'asc' ? 'chevron-up' : 'chevron-down', 12)"/>
                        </t>
                    </th>
                    <th style="width:100px;text-align:center;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                <t t-foreach="filteredItems" t-as="item" t-key="item.id">
                    <tr class="ls-custom-row" t-on-click="() => this.openDetail(item)">
                        <td class="ls-custom-row-index" t-esc="item_index + 1"/>
                        <td>
                            <div class="ls-custom-name-cell">
                                <span class="ls-custom-avatar" t-att-style="'background:' + item.color">
                                    <t t-esc="item.name.charAt(0).toUpperCase()"/>
                                </span>
                                <span t-esc="item.name"/>
                            </div>
                        </td>
                        <td class="ls-custom-desc" t-esc="item.description || '—'"/>
                        <td>
                            <span t-att-class="'ls-custom-badge ls-badge-' + item.status" t-esc="statusLabel(item.status)"/>
                        </td>
                        <td class="ls-custom-date" t-esc="formatDate(item.created_at)"/>
                        <td t-on-click.stop="() => {}">
                            <div class="ls-custom-row-actions">
                                <button class="ls-custom-icon-btn" title="Edit"
                                        t-on-click="() => this.openEdit(item)">
                                    <t t-out="window.lucideIcon('pencil', 14)"/>
                                </button>
                                <button class="ls-custom-icon-btn ls-icon-btn-danger" title="Hapus"
                                        t-on-click="() => this.confirmDelete(item)">
                                    <t t-out="window.lucideIcon('trash-2', 14)"/>
                                </button>
                            </div>
                        </td>
                    </tr>
                </t>
            </tbody>
        </table>

        <!-- Empty state -->
        <div class="ls-custom-empty" t-if="!filteredItems.length">
            <t t-out="window.lucideIcon('inbox', 40)"/>
            <p t-if="state.searchQuery or state.filterStatus">
                Tidak ada item yang cocok dengan filter.
                <button class="ls-btn ls-btn-link" t-on-click="clearFilters">Hapus Filter</button>
            </p>
            <p t-else="">Belum ada data. Klik <strong>Tambah Item</strong> untuk memulai.</p>
        </div>
    </div>

    <!-- ── Modal: Create / Edit ── -->
    <div class="ls-custom-modal-backdrop" t-if="state.modal.open" t-on-click="closeModal">
        <div class="ls-custom-modal" t-on-click.stop="() => {}">
            <div class="ls-custom-modal-header">
                <h3 t-esc="state.modal.mode === 'create' ? 'Tambah Item Baru' : 'Edit Item'"/>
                <button class="ls-custom-modal-close" t-on-click="closeModal">
                    <t t-out="window.lucideIcon('x', 16)"/>
                </button>
            </div>
            <div class="ls-custom-modal-body">
                <div class="ls-custom-form-group">
                    <label>Nama <span class="ls-custom-required">*</span></label>
                    <input type="text" class="ls-custom-input" t-model="state.modal.form.name"
                           placeholder="Masukkan nama..."/>                </div>
                <div class="ls-custom-form-group">
                    <label>Deskripsi</label>
                    <textarea class="ls-custom-input" rows="3" t-model="state.modal.form.description"
                              placeholder="Deskripsi opsional..."/>
                </div>
                <div class="ls-custom-form-group">
                    <label>Status</label>
                    <select class="ls-custom-select ls-custom-input" t-model="state.modal.form.status">
                        <option value="active">Aktif</option>
                        <option value="pending">Tertunda</option>
                        <option value="inactive">Nonaktif</option>
                    </select>
                </div>
                <div class="ls-custom-form-error" t-if="state.modal.error">
                    <t t-out="window.lucideIcon('alert-circle', 14)"/>
                    <span t-esc="state.modal.error"/>
                </div>
            </div>
            <div class="ls-custom-modal-footer">
                <button class="ls-btn ls-btn-outline" t-on-click="closeModal">Batal</button>
                <button class="ls-btn ls-btn-primary" t-on-click="saveModal"
                        t-att-disabled="state.modal.saving">
                    <t t-if="state.modal.saving">
                        <span class="ls-custom-spin"><t t-out="window.lucideIcon('loader', 14)"/></span>
                        Menyimpan...
                    </t>
                    <t t-else="">
                        <t t-out="window.lucideIcon('save', 14)"/>
                        Simpan
                    </t>
                </button>
            </div>
        </div>
    </div>

    <!-- ── Modal: Detail ── -->
    <div class="ls-custom-modal-backdrop" t-if="state.detail.open" t-on-click="closeDetail">
        <div class="ls-custom-modal" t-on-click.stop="() => {}">
            <div class="ls-custom-modal-header">
                <h3>Detail Item</h3>
                <button class="ls-custom-modal-close" t-on-click="closeDetail">
                    <t t-out="window.lucideIcon('x', 16)"/>
                </button>
            </div>
            <div class="ls-custom-modal-body" t-if="state.detail.item">
                <div class="ls-custom-detail-avatar"
                     t-att-style="'background:' + state.detail.item.color">
                    <t t-esc="state.detail.item.name.charAt(0).toUpperCase()"/>
                </div>
                <dl class="ls-custom-detail-list">
                    <dt>ID</dt><dd t-esc="state.detail.item.id"/>
                    <dt>Nama</dt><dd t-esc="state.detail.item.name"/>
                    <dt>Deskripsi</dt><dd t-esc="state.detail.item.description || '—'"/>
                    <dt>Status</dt>
                    <dd>
                        <span t-att-class="'ls-custom-badge ls-badge-' + state.detail.item.status"
                              t-esc="statusLabel(state.detail.item.status)"/>
                    </dd>
                    <dt>Dibuat</dt><dd t-esc="formatDate(state.detail.item.created_at)"/>
                    <dt>Diperbarui</dt><dd t-esc="formatDate(state.detail.item.updated_at)"/>
                </dl>
            </div>
            <div class="ls-custom-modal-footer">
                <button class="ls-btn ls-btn-outline" t-on-click="closeDetail">Tutup</button>
                <button class="ls-btn ls-btn-primary" t-on-click="() => { this.closeDetail(); this.openEdit(state.detail.item); }">
                    <t t-out="window.lucideIcon('pencil', 14)"/> Edit
                </button>
            </div>
        </div>
    </div>

    <!-- ── Modal: Konfirmasi Hapus ── -->
    <div class="ls-custom-modal-backdrop" t-if="state.deleteConfirm.open" t-on-click="cancelDelete">
        <div class="ls-custom-modal ls-custom-modal-sm" t-on-click.stop="() => {}">
            <div class="ls-custom-modal-header ls-custom-modal-header-danger">
                <h3 style="display:flex;align-items:center;gap:8px;">
                    <t t-out="window.lucideIcon('trash-2', 16)"/> Hapus Item
                </h3>
                <button class="ls-custom-modal-close" t-on-click="cancelDelete">
                    <t t-out="window.lucideIcon('x', 16)"/>
                </button>
            </div>
            <div class="ls-custom-modal-body">
                <p>Apakah Anda yakin ingin menghapus
                    <strong t-esc="state.deleteConfirm.item ? state.deleteConfirm.item.name : ''"/>?
                </p>
                <p style="color:var(--ls-text-muted, #6c757d);font-size:12px;">Tindakan ini tidak dapat dibatalkan.</p>            </div>
            <div class="ls-custom-modal-footer">
                <button class="ls-btn ls-btn-outline" t-on-click="cancelDelete">Batal</button>
                <button class="ls-btn ls-btn-danger" t-on-click="deleteItem"
                        t-att-disabled="state.deleteConfirm.deleting">
                    <t t-if="state.deleteConfirm.deleting">Menghapus...</t>
                    <t t-else="">Hapus</t>
                </button>
            </div>
        </div>
    </div>

</div>
`})(),(function(){let{Component:e,useState:t,useRef:n,onMounted:r}=owl;class i extends e{static template=window.ACCOUNTING_REPORT_TPL;setup(){let e=new Date,i=new Date(e.getFullYear(),e.getMonth(),1);this.state=t({activeReport:`trial_balance`,dateFrom:i.toISOString().slice(0,10),dateTo:e.toISOString().slice(0,10),targetMove:`posted`,loading:!1,data:null,glCollapsed:{}}),this.reportRef=n(`reportContent`),r(()=>{this.loadReport()})}fmt(e){return e==null||e===``?`0,00`:(Number(e)||0).toLocaleString(`id-ID`,{minimumFractionDigits:2,maximumFractionDigits:2})}switchReport(e){this.state.activeReport=e,this.state.data=null,this.loadReport()}toggleGLSection(e){this.state.glCollapsed[e]=!this.state.glCollapsed[e]}async loadReport(){let e={trial_balance:`/api/accounting/trial-balance`,general_ledger:`/api/accounting/general-ledger`,balance_sheet:`/api/accounting/balance-sheet`,income_statement:`/api/accounting/income-statement`}[this.state.activeReport];if(e){this.state.loading=!0,this.state.data=null;try{let t=document.querySelector(`meta[name="csrf-token"]`)?.content||window.__CSRF_TOKEN__,n=await fetch(e,{method:`POST`,headers:{"Content-Type":`application/json`,"X-CSRF-TOKEN":t,Accept:`application/json`},body:JSON.stringify({date_from:this.state.dateFrom,date_to:this.state.dateTo,target_move:this.state.targetMove})});if(!n.ok)throw Error(`HTTP ${n.status}`);this.state.data=await n.json()}catch(e){console.error(`Report load error:`,e),this.state.data=null}finally{this.state.loading=!1}}}printReport(){let e=this.reportRef?.el;if(!e)return;let t=window.open(``,`_blank`);t.document.write(`<!DOCTYPE html>
<html><head>
<title>${this.state.data?.title||`Laporan Keuangan`}</title>
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
</head><body>${e.innerHTML}</body></html>`),t.document.close(),setTimeout(()=>{t.print()},300)}}window.AccountingReports=i})(),(function(){let{Component:e,useState:t,onWillStart:n,onMounted:r}=owl,i=window.LarasoftRPC;class a extends e{static template=window.TEMPLATES.MenuEditor;static props={};setup(){this.state=t({loading:!0,saving:!1,savingAction:!1,tree:[],stats:null,expanded:{},searchQuery:``,showInactive:!1,dialogOpen:!1,dialogMode:`create`,editForm:this._emptyForm(),editingId:null,actionDialogOpen:!1,actionForm:{name:``,res_model:``,view_mode:`list,form`},bindingMode:`none`,availableModels:[],availableActions:[],dragItem:null,dragOverId:null,toast:null,toastType:`info`}),n(async()=>{await this.loadTree(),await this.loadReferenceData()})}async loadTree(){this.state.loading=!0;try{let e=await i.get(`/api/menu-editor/tree`);this.state.tree=e.tree||[],this.state.stats=e.stats||{};for(let e of this.state.tree)this.state.expanded[e.id]=!0}catch(e){this.showToast(`Failed to load menu tree: `+e.message,`error`)}this.state.loading=!1}async loadReferenceData(){try{let[e,t]=await Promise.all([i.get(`/api/menu-editor/available-models`),i.get(`/api/menu-editor/available-actions`)]);this.state.availableModels=e||[],this.state.availableActions=t||[]}catch(e){console.warn(`Failed to load reference data:`,e)}}get filteredTree(){let e=this.state.tree;return this.state.showInactive||(e=this._filterActive(e)),this.state.searchQuery&&(e=this._filterBySearch(e,this.state.searchQuery.toLowerCase())),e}get flatRows(){let e=[],t=(n,r)=>{for(let i of n)e.push({item:i,depth:r}),i.children&&i.children.length&&this.state.expanded[i.id]&&t(i.children,r+1)};return t(this.filteredTree,0),e}get flatMenuList(){let e=[],t=(n,r=``)=>{for(let i of n){let n=r?`${r} / ${i.name}`:i.name;e.push({id:i.id,path:n,name:i.name}),i.children&&i.children.length&&t(i.children,n)}};return t(this.state.tree),e}toggleExpand(e){this.state.expanded[e]=!this.state.expanded[e]}expandAll(){let e=t=>{for(let n of t)this.state.expanded[n.id]=!0,n.children&&e(n.children)};e(this.state.tree)}collapseAll(){this.state.expanded={}}toggleInactiveFilter(){this.state.showInactive=!this.state.showInactive}onSearch(){this.state.searchQuery&&this.expandAll()}openCreateDialog(){this.state.editForm=this._emptyForm(),this.state.editingId=null,this.state.dialogMode=`create`,this.state.bindingMode=`none`,this.state.dialogOpen=!0}openCreateChild(e){this.state.editForm=this._emptyForm(),this.state.editForm.parent_id=String(e.id),this.state.editingId=null,this.state.dialogMode=`create`,this.state.bindingMode=`none`,this.state.dialogOpen=!0}openEditDialog(e){this.state.editForm={name:e.name||``,parent_id:e.parent_id?String(e.parent_id):``,sequence:e.sequence||10,active:e.active!==!1,action_id:e.action_id?String(e.action_id):``,model:e.model||``,view_type:e.view_type||e.view||`list`,icon:e.icon||``,web_icon:e.web_icon||``,web_icon_color:e.web_icon_color||`#7C3AED`,groups:e.groups||``,security_view:e.security_view||``},this.state.editingId=e.id,this.state.dialogMode=`edit`,e.action_id||e.action?this.state.bindingMode=`action`:e.model?this.state.bindingMode=`model`:e.security_view?this.state.bindingMode=`security`:this.state.bindingMode=`none`,this.state.dialogOpen=!0}async saveDialog(){if(!this.state.editForm.name.trim()){this.showToast(`Menu name is required`,`error`);return}this.state.saving=!0;let e={name:this.state.editForm.name,parent_id:this.state.editForm.parent_id?parseInt(this.state.editForm.parent_id):null,sequence:parseInt(this.state.editForm.sequence)||10,active:this.state.editForm.active,icon:this.state.editForm.icon||null,web_icon:this.state.editForm.web_icon||null,web_icon_color:this.state.editForm.web_icon_color||null,groups:this.state.editForm.groups||null,action_id:null,model:null,view_type:null,security_view:null};this.state.bindingMode===`action`?e.action_id=this.state.editForm.action_id?parseInt(this.state.editForm.action_id):null:this.state.bindingMode===`model`?(e.model=this.state.editForm.model||null,e.view_type=this.state.editForm.view_type||`list`):this.state.bindingMode===`security`&&(e.security_view=this.state.editForm.security_view||null);try{if(this.state.dialogMode===`create`)await i.call(`/api/menu-editor/create`,e),this.showToast(`Menu item created successfully`,`success`);else{let t=i.csrf,n=await fetch(`/api/menu-editor/update/${this.state.editingId}`,{method:`PUT`,headers:{"Content-Type":`application/json`,"X-CSRF-TOKEN":t,Accept:`application/json`},body:JSON.stringify(e)});if(!n.ok){let e=await n.json().catch(()=>({}));throw Error(e.error||`Update failed`)}this.showToast(`Menu item updated successfully`,`success`)}this.closeDialog(),await this.loadTree()}catch(e){this.showToast(`Save failed: `+e.message,`error`)}this.state.saving=!1}async deleteItem(e){let t=this._countChildren(e),n=t>0?`Delete "${e.name}" and its ${t} child item(s)?`:`Delete "${e.name}"?`;if(confirm(n))try{let t=i.csrf;if(!(await fetch(`/api/menu-editor/delete/${e.id}`,{method:`DELETE`,headers:{"Content-Type":`application/json`,"X-CSRF-TOKEN":t,Accept:`application/json`}})).ok)throw Error(`Delete failed`);this.showToast(`"${e.name}" deleted`,`success`),await this.loadTree()}catch(e){this.showToast(`Delete failed: `+e.message,`error`)}}async toggleItemActive(e){try{await i.call(`/api/menu-editor/toggle-active`,{id:e.id}),e.active=!e.active,this.showToast(`"${e.name}" ${e.active?`activated`:`deactivated`}`,`info`)}catch(e){this.showToast(`Toggle failed: `+e.message,`error`)}}onDragStart(e,t){this.state.dragItem=t,e.dataTransfer.effectAllowed=`move`,e.dataTransfer.setData(`text/plain`,String(t.id)),e.target.classList.add(`dragging`)}onDragOver(e,t){e.preventDefault(),e.dataTransfer.dropEffect=`move`,this.state.dragItem&&t.id!==this.state.dragItem.id&&(this.state.dragOverId=t.id)}onDragLeave(e){this.state.dragOverId=null}async onDrop(e,t){e.preventDefault(),this.state.dragOverId=null,document.querySelectorAll(`.dragging`).forEach(e=>e.classList.remove(`dragging`));let n=this.state.dragItem;if(this.state.dragItem=null,!(!n||n.id===t.id))try{await i.call(`/api/menu-editor/move`,{menu_id:n.id,parent_id:t.parent_id||null,sequence:(t.sequence||10)+5}),this.showToast(`Moved "${n.name}"`,`info`),await this.loadTree()}catch(e){this.showToast(`Move failed: `+e.message,`error`)}}openActionCreate(){this.state.actionForm={name:``,res_model:``,view_mode:`list,form`},this.state.actionDialogOpen=!0}closeActionDialog(){this.state.actionDialogOpen=!1}async createActionInline(){if(!this.state.actionForm.name||!this.state.actionForm.res_model){this.showToast(`Action name and model are required`,`error`);return}this.state.savingAction=!0;try{let e=await i.call(`/api/menu-editor/create-action`,this.state.actionForm);this.state.availableActions.push(e.action),this.state.editForm.action_id=String(e.action.id),this.showToast(`Action created: `+e.action.name,`success`),this.closeActionDialog()}catch(e){this.showToast(`Create action failed: `+e.message,`error`)}this.state.savingAction=!1}closeDialog(){this.state.dialogOpen=!1,this.state.editingId=null}_emptyForm(){return{name:``,parent_id:``,sequence:10,active:!0,action_id:``,model:``,view_type:`list`,icon:``,web_icon:``,web_icon_color:`#7C3AED`,groups:``,security_view:``}}_filterActive(e){return e.filter(e=>e.active!==!1).map(e=>({...e,children:e.children?this._filterActive(e.children):[]}))}_filterBySearch(e,t){let n=[];for(let r of e){let e=(r.name||``).toLowerCase().includes(t),i=(r.model||``).toLowerCase().includes(t),a=(r.action?.res_model||``).toLowerCase().includes(t),o=r.children?this._filterBySearch(r.children,t):[];(e||i||a||o.length>0)&&n.push({...r,children:o})}return n}_countChildren(e){let t=0;if(e.children){t=e.children.length;for(let n of e.children)t+=this._countChildren(n)}return t}showToast(e,t=`info`){this.state.toast=e,this.state.toastType=t,clearTimeout(this._toastTimer),this._toastTimer=setTimeout(()=>{this.state.toast=null},3500)}}window.MenuEditorView=a})(),(function(){let{Component:e,useState:t,useRef:n,onWillStart:r,onMounted:i}=owl,a=window.LarasoftRPC;window.LarasoftIcons;let o=[{key:`r`,label:`Read`,short:`R`,color:`#059669`},{key:`w`,label:`Write`,short:`W`,color:`#2563eb`},{key:`c`,label:`Create`,short:`C`,color:`#7c3aed`},{key:`u`,label:`Delete`,short:`D`,color:`#dc2626`}];class s extends e{static template=window.TEMPLATES.securityOverview;static props={};setup(){this.state=t({loading:!0,data:null}),i(()=>this.load())}async load(){this.state.loading=!0;try{let e=await a.get(`/api/security/overview`);this.state.data=e}catch(e){console.error(`Load overview failed`,e)}this.state.loading=!1}}window.SecurityOverview=s;class c extends e{static template=window.TEMPLATES.accessRights;static props={};setup(){this.state=t({loading:!0,groups:[],models:[],cells:{},filter:``,selectedModule:`all`,saving:{},showCreate:!1,newModel:{model:``,name:``}}),i(()=>this.load())}get modules(){let e=new Set(this.state.models.map(e=>e.module||`larasoft`));return Array.from(e).sort()}get filteredModels(){let e=this.state.filter.toLowerCase(),t=this.state.selectedModule;return this.state.models.filter(n=>t!==`all`&&(n.module||`larasoft`)!==t?!1:e?n.model.toLowerCase().includes(e)||(n.name||``).toLowerCase().includes(e):!0)}get filteredGroups(){let e=this.state.filter.toLowerCase();return e?this.state.groups.filter(t=>t.name.toLowerCase().includes(e)):this.state.groups}getCell(e,t){return this.state.cells[e+`:`+t]||null}isSaving(e,t,n){return!!this.state.saving[e+`:`+t+`:`+n]}async load(){this.state.loading=!0;try{let e=await a.get(`/api/security/acl/matrix`);this.state.groups=e.groups,this.state.models=e.models,this.state.cells=e.cells}catch(e){console.error(`Load matrix failed`,e),alert(`Failed to load ACL matrix: `+e.message)}this.state.loading=!1}async toggleCell(e,t,n,r){let i=e+`:`+t+`:`+n;this.state.saving[i]=!0;try{let i=await a.call(`/api/security/acl/toggle`,{model_id:e,group_id:t,perm:n,value:!r}),o=e+`:`+t,s=this.state.cells[o]||{r:!1,w:!1,c:!1,u:!1,group_id:t};this.state.cells[o]={...s,...i.cell,acl_id:i.acl_id,group_id:t}}catch(e){alert(`Toggle failed: `+e.message)}this.state.saving[i]=!1}async syncModels(){if(confirm(`Re-discover all Odoo model definitions and register them in ir.model?`))try{let e=await a.call(`/api/security/sync-models`,{});alert(`Synced: discovered=${e.discovered}, in db=${e.in_database}`),await this.load()}catch(e){alert(`Sync failed: `+e.message)}}permColor(e){return(o.find(t=>t.key===e)||{}).color||`#6b7280`}}window.AccessRights=c;class l extends e{static template=window.TEMPLATES.recordRules;static props={};setup(){this.state=t({mode:`list`,records:[],loading:!0,search:``,current:null,models:[],groups:[],error:``,saving:!1}),i(()=>this.load())}async load(){this.state.loading=!0;try{let[e,t,n]=await Promise.all([a.searchRead(`ir.rule`,[],{order:`id asc`,limit:200}),a.nameSearch(`ir.model`,``,200),a.nameSearch(`res.groups`,``,200)]);this.state.records=e.records||[],this.state.models=t.results||t,this.state.groups=n.results||n}catch(e){alert(`Load failed: `+e.message)}this.state.loading=!1}get filteredRecords(){let e=this.state.search.toLowerCase();return e?this.state.records.filter(t=>(t.name||``).toLowerCase().includes(e)||t.model_id&&String(t.model_id[1]||``).toLowerCase().includes(e)):this.state.records}newRecord(){this.state.current={name:``,model_id:!1,domain_force:`[]`,global:!1,groups:[],perm_read:!0,perm_write:!1,perm_create:!1,perm_unlink:!1,active:!0},this.state.mode=`form`,this.state.error=``}editRecord(e){this.state.current={id:e.id,name:e.name||``,model_id:e.model_id?e.model_id[0]:!1,domain_force:e.domain_force||`[]`,global:!!e.global,groups:Array.isArray(e.groups)?e.groups.map(e=>e&&typeof e==`object`&&!Array.isArray(e)?e.id:Array.isArray(e)?e[0]:e):[],perm_read:!!e.perm_read,perm_write:!!e.perm_write,perm_create:!!e.perm_create,perm_unlink:!!e.perm_unlink,active:e.active===void 0?!0:!!e.active},this.state.mode=`form`,this.state.error=``}backToList(){this.state.mode=`list`,this.state.current=null}async save(){let e=this.state.current;if(!e.name.trim()){this.state.error=`Name is required.`;return}if(!e.model_id){this.state.error=`Model is required.`;return}if(!e.domain_force.trim()){this.state.error=`Domain is required.`;return}this.state.saving=!0,this.state.error=``;try{let t={name:e.name,model_id:e.model_id,domain_force:e.domain_force,global:e.global,groups:[[6,0,e.groups]],perm_read:e.perm_read,perm_write:e.perm_write,perm_create:e.perm_create,perm_unlink:e.perm_unlink,active:e.active};e.id?await a.write(`ir.rule`,[e.id],t):await a.create(`ir.rule`,t),await this.load(),this.backToList()}catch(e){this.state.error=e.message||String(e)}this.state.saving=!1}async deleteRecord(e){if(confirm(`Delete rule "${e.name}"?`))try{await a.unlink(`ir.rule`,[e.id]),await this.load()}catch(e){alert(`Delete failed: `+e.message)}}toggleGroupInForm(e){let t=this.state.current.groups.indexOf(e);t>=0?this.state.current.groups.splice(t,1):this.state.current.groups.push(e)}insertPlaceholder(e){this.state.current.domain_force+=e}insertTemplate(e){this.state.current.domain_force=e}}window.RecordRules=l;class u extends e{static template=window.TEMPLATES.groupsView;static props={};setup(){this.state=t({mode:`list`,records:[],loading:!0,search:``,current:null,categories:[],groups:[],error:``,saving:!1,groupUsers:null}),i(()=>this.load())}async load(){this.state.loading=!0;try{let[e,t,n]=await Promise.all([a.searchRead(`res.groups`,[],{order:`name asc`,limit:200}),a.searchRead(`res.groups.category`,[],{order:`name asc`,limit:100}),a.nameSearch(`res.groups`,``,200)]);this.state.records=e.records||[],this.state.categories=t.records||[],this.state.groups=n.results||n}catch(e){alert(`Load failed: `+e.message)}this.state.loading=!1}get filteredRecords(){let e=this.state.search.toLowerCase();return e?this.state.records.filter(t=>(t.name||``).toLowerCase().includes(e)||(t.description||``).toLowerCase().includes(e)):this.state.records}newRecord(){this.state.current={name:``,description:``,category_id:!1,share:!1,implied_ids:[]},this.state.mode=`form`,this.state.error=``,this.state.groupUsers=null}editRecord(e){this.state.current={id:e.id,name:e.name||``,description:e.description||``,category_id:e.category_id?Array.isArray(e.category_id)?e.category_id[0]:typeof e.category_id==`object`?e.category_id.id:e.category_id:!1,share:!!e.share,implied_ids:Array.isArray(e.implied_ids)?e.implied_ids.map(e=>e&&typeof e==`object`&&!Array.isArray(e)?e.id:Array.isArray(e)?e[0]:e):[]},this.state.mode=`form`,this.state.error=``,this.loadGroupUsers(e.id)}async loadGroupUsers(e){try{let t=await a.get(`/api/security/groups/`+e+`/users`);this.state.groupUsers=t}catch{this.state.groupUsers=null}}backToList(){this.state.mode=`list`,this.state.current=null,this.state.groupUsers=null}async save(){let e=this.state.current;if(!e.name.trim()){this.state.error=`Name is required.`;return}this.state.saving=!0,this.state.error=``;try{let t={name:e.name,description:e.description,category_id:e.category_id||!1,share:e.share,implied_ids:[[6,0,e.implied_ids]]};e.id?await a.write(`res.groups`,[e.id],t):e.id=(await a.create(`res.groups`,t)).id,await this.load(),this.state.mode=`form`,this.loadGroupUsers(e.id)}catch(e){this.state.error=e.message||String(e)}this.state.saving=!1}async deleteRecord(e){if(confirm(`Delete group "${e.name}"?\nUsers in this group will lose its permissions.`))try{await a.unlink(`res.groups`,[e.id]),await this.load()}catch(e){alert(`Delete failed: `+e.message)}}toggleImplied(e){let t=this.state.current.implied_ids.indexOf(e);t>=0?this.state.current.implied_ids.splice(t,1):this.state.current.implied_ids.push(e)}}window.GroupsView=u;class d extends e{static template=window.TEMPLATES.usersView;static props={};setup(){this.state=t({mode:`list`,records:[],loading:!0,search:``,current:null,groups:[],companies:[],error:``,saving:!1,showPasswordReset:!1,passwordForm:{password:``,password_confirmation:``},passwordMessage:``}),i(()=>this.load())}async load(){this.state.loading=!0;try{let[e,t,n]=await Promise.all([a.searchRead(`res.users`,[],{order:`login asc`,limit:200}),a.nameSearch(`res.groups`,``,200),a.nameSearch(`res.company`,``,50)]);this.state.records=e.records||[],this.state.groups=t.results||t,this.state.companies=n.results||n}catch(e){alert(`Load failed: `+e.message)}this.state.loading=!1}get filteredRecords(){let e=this.state.search.toLowerCase();return e?this.state.records.filter(t=>(t.login||``).toLowerCase().includes(e)||(t.name||``).toLowerCase().includes(e)||(t.email||``).toLowerCase().includes(e)):this.state.records}newRecord(){this.state.current={login:``,name:``,email:``,company_id:!1,active:!0,share:!1,signature:``,group_ids:[],password:``},this.state.mode=`form`,this.state.error=``,this.state.showPasswordReset=!1}editRecord(e){this.state.current={id:e.id,login:e.login,name:e.name||``,email:e.email||``,company_id:e.company_id?Array.isArray(e.company_id)?e.company_id[0]:typeof e.company_id==`object`?e.company_id.id:e.company_id:!1,active:e.active===void 0?!0:!!e.active,share:!!e.share,signature:e.signature||``,group_ids:Array.isArray(e.groups_id)?e.groups_id.map(e=>e&&typeof e==`object`&&!Array.isArray(e)?e.id:Array.isArray(e)?e[0]:e):[],password:``},this.state.mode=`form`,this.state.error=``,this.state.showPasswordReset=!1}backToList(){this.state.mode=`list`,this.state.current=null,this.state.showPasswordReset=!1}async save(){let e=this.state.current;if(!e.login.trim()){this.state.error=`Login is required.`;return}if(!e.id&&!e.password){this.state.error=`Password is required for new users.`;return}this.state.saving=!0,this.state.error=``;try{let t={login:e.login,name:e.name,email:e.email,company_id:e.company_id||!1,active:e.active,share:e.share,signature:e.signature,groups_id:[[6,0,e.group_ids]]};e.id?await a.write(`res.users`,[e.id],t):(t.password=e.password,e.id=(await a.create(`res.users`,t)).id),await a.call(`/api/security/users/`+e.id+`/groups`,{group_ids:e.group_ids}),await this.load()}catch(e){this.state.error=e.message||String(e)}this.state.saving=!1}async deleteRecord(e){if(confirm(`Delete user "${e.login}"?`))try{await a.unlink(`res.users`,[e.id]),await this.load()}catch(e){alert(`Delete failed: `+e.message)}}toggleGroupInForm(e){let t=this.state.current.group_ids.indexOf(e);t>=0?this.state.current.group_ids.splice(t,1):this.state.current.group_ids.push(e)}openPasswordReset(){this.state.showPasswordReset=!0,this.state.passwordForm={password:``,password_confirmation:``},this.state.passwordMessage=``}async submitPasswordReset(){let e=this.state.passwordForm;if(e.password.length<6){this.state.passwordMessage=`Password must be at least 6 characters.`;return}if(e.password!==e.password_confirmation){this.state.passwordMessage=`Passwords do not match.`;return}try{await a.call(`/api/security/users/`+this.state.current.id+`/password`,{password:e.password,password_confirmation:e.password_confirmation}),this.state.passwordMessage=`Password reset successfully.`,this.state.passwordForm={password:``,password_confirmation:``}}catch(e){this.state.passwordMessage=`Error: `+e.message}}}window.UsersView=d})(),(function(){let{Component:e,useState:t,onMounted:n,markup:r}=owl,i=window.LarasoftRPC;class a extends e{static template=window.TEMPLATES.ViewBuilder;static props={};setup(){this._undoStack=[],this._redoStack=[],this.state=t({activeTab:`list`,models:[],selectedModel:``,fields:{},arch:{},selectedField:null,selectedGroup:null,showXml:!1,xmlPreview:``,formActiveTab:``,toast:``,toastType:``,loading:!1,fieldSearch:``,showCode:!1,codePreview:``}),n(()=>this.loadModels())}get builderTabs(){return[{id:`list`,label:`List builder`,icon:`table`},{id:`form`,label:`Form builder`,icon:`file-text`},{id:`kanban`,label:`Kanban builder`,icon:`columns`},{id:`calendar`,label:`Calendar builder`,icon:`calendar`},{id:`pivot`,label:`Pivot builder`,icon:`grid-3x3`},{id:`spreadsheet`,label:`Spreadsheet builder`,icon:`file-spreadsheet`}]}get listComponents(){return[{id:`handle`,label:`Handle (drag)`,icon:`grip-vertical`,type:`handle`},{id:`char`,label:`Char / text`,icon:`type`,type:`char`},{id:`many2one`,label:`Many2one`,icon:`link`,type:`many2one`},{id:`date`,label:`Date`,icon:`calendar`,type:`date`},{id:`monetary`,label:`Monetary`,icon:`dollar-sign`,type:`monetary`},{id:`selection`,label:`Selection badge`,icon:`list`,type:`selection`},{id:`boolean`,label:`Boolean toggle`,icon:`toggle-left`,type:`boolean`},{id:`button`,label:`Button`,icon:`square`,type:`button`}]}get formComponents(){return[{id:`group`,label:`Group (2-col)`,icon:`columns`,type:`group`},{id:`tab`,label:`Notebook Tab`,icon:`book-open`,type:`tab`},{id:`separator`,label:`Separator`,icon:`minus`,type:`separator`},{id:`statusbar`,label:`Statusbar`,icon:`git-branch`,type:`statusbar`},{id:`chatter`,label:`Chatter`,icon:`message-circle`,type:`chatter`},{id:`stat_button`,label:`Stat Button`,icon:`bar-chart-2`,type:`stat_button`}]}get listAttrCards(){return[{name:`optional`,type:`"show"/"hide"`,desc:`Column can be hidden/shown by user via gear icon.`},{name:`column_invisible`,type:`domain`,desc:`Hide column based on parent context expression.`},{name:`sum / avg / max / min`,type:`string label`,desc:`Show aggregation in footer. String = label text.`},{name:`decoration-danger/warning`,type:`domain expr`,desc:`Color rows based on field condition expression.`},{name:`width`,type:`string "80px"`,desc:`Override column width manually (px or ratio).`},{name:`nolabel`,type:`bool "1"`,desc:`Hide column header label. Useful for handle/button.`}]}get availableFields(){let e=this.state.fields,t=Object.values(e).filter(e=>!e.invisible),n=(this.state.fieldSearch||``).trim().toLowerCase();return n&&(t=t.filter(e=>(e.string||``).toLowerCase().includes(n)||(e.name||``).toLowerCase().includes(n)||(e.type||``).toLowerCase().includes(n))),t.sort((e,t)=>(e.string||``).localeCompare(t.string||``))}get groupableFields(){return Object.values(this.state.fields).filter(e=>e.groupable)}get numericFields(){return Object.values(this.state.fields).filter(e=>e.is_numeric)}get dateFields(){return Object.values(this.state.fields).filter(e=>e.is_temporal)}get stringFields(){return Object.values(this.state.fields).filter(e=>e.is_string||e.type===`char`)}get m2mFields(){return Object.values(this.state.fields).filter(e=>e.type===`many2many`)}get o2mFields(){return Object.values(this.state.fields).filter(e=>e.type===`one2many`)}get binaryFields(){return Object.values(this.state.fields).filter(e=>e.type===`binary`||e.type===`image`)}get colorFields(){return Object.values(this.state.fields).filter(e=>e.widget===`color_picker`||e.name===`color`)}get selectionFields(){return Object.values(this.state.fields).filter(e=>e.type===`selection`)}get allFields(){return Object.values(this.state.fields)}getFieldLabel(e){let t=this.state.fields[e];return t?t.string||t.name:e}removeFromArchArray(e,t){this.state.arch[e]&&(this.state.arch[e]=this.state.arch[e].filter(e=>e!==t),this.state.arch={...this.state.arch})}get calendarDays(){let e=[],t=new Date,n=new Date(t.getFullYear(),t.getMonth(),1),r=(n.getDay()+6)%7;for(let i=0;i<35;i++){let a=new Date(n);a.setDate(1-r+i),e.push({num:a.getDate(),month:a.getMonth(),today:a.toDateString()===t.toDateString(),otherMonth:a.getMonth()!==t.getMonth(),event:[5,12,18,23,27].includes(a.getDate())&&a.getMonth()===t.getMonth()})}return e}async loadModels(){try{let e=await(await fetch(`/api/view-builder/models`)).json();this.state.models=e}catch(e){console.error(`Failed to load models`,e)}}async onModelChange(){let e=this.state.selectedModel;if(!e){this.state.fields={};return}try{this.state.loading=!0;let t=await i.call(`/api/view-builder/fields`,{model:e});this.state.fields=t.fields||{},await this.loadCurrentView()}catch{this.showToast(`Failed to load model fields`,`error`)}finally{this.state.loading=!1}}async loadCurrentView(){try{let e=await i.call(`/api/view-builder/load-view`,{model:this.state.selectedModel,type:this.state.activeTab});e.arch&&Object.keys(e.arch).length?(this.state.arch={...e.arch},e.arch.tabs&&e.arch.tabs.length&&(this.state.formActiveTab=e.arch.tabs[0].name||``)):this.initDefaultArch()}catch{this.initDefaultArch()}}initDefaultArch(){let e=Object.keys(this.state.fields).slice(0,6),t=this.state.activeTab;if(t===`list`)this.state.arch={fields:e,column_config:{},decoration:{},limit:80};else if(t===`form`){let t=Math.ceil(e.length/2);this.state.arch={string:this.state.selectedModel,groups:[{columns:[e.slice(0,t),e.slice(t)]}],tabs:[],statusbar:``,header_buttons:[],field_config:{}}}else if(t===`kanban`){let t=this.groupableFields[0];this.state.arch={default_group_by:t?.name||``,quick_create:!0,card_title:Object.keys(this.state.fields)[0]||`name`,card_fields:e.slice(1,4),card_tags:``,card_image:``,color_field:``,card_footer:[`priority`]}}else if(t===`calendar`){let t=this.dateFields[0];this.state.arch={date_start:t?.name||``,date_stop:``,color:``,mode:`month`,event_display_fields:e.slice(0,2),quick_create:!0,create_name_field:``,date_delay:``,color_legend:!0}}else if(t===`pivot`){let e=this.groupableFields.slice(0,2).map(e=>e.name),t=this.numericFields.slice(0,2).map(e=>e.name);this.state.arch={row_groupby:e.slice(0,1),col_groupby:e.slice(1,2),measures:t}}else t===`spreadsheet`&&(this.state.arch={fields:e,column_width:120,row_height:28,limit:1e3,aggregation:`sum`,readonly:!1})}addField(e){let t=this.state.activeTab;if(t===`list`)this.state.arch.fields||(this.state.arch.fields=[]),this.state.arch.fields.includes(e)||(this.state.arch.fields=[...this.state.arch.fields,e]);else if(t===`kanban`)this.state.arch.card_fields||(this.state.arch.card_fields=[]),this.state.arch.card_fields.includes(e)||(this.state.arch.card_fields=[...this.state.arch.card_fields,e]);else if(t===`spreadsheet`)this.state.arch.fields||(this.state.arch.fields=[]),this.state.arch.fields.includes(e)||(this.state.arch.fields=[...this.state.arch.fields,e]);else if(t===`calendar`)this.state.arch.event_display_fields||(this.state.arch.event_display_fields=[]),this.state.arch.event_display_fields.includes(e)||(this.state.arch.event_display_fields=[...this.state.arch.event_display_fields,e]);else if(t===`form`){this.removeSelectedFieldByName(e);let t=this.state.formActiveTab?(this.state.arch.tabs||[]).find(e=>e.name===this.state.formActiveTab):null;if(t&&(!t.type||t.type===`layout`)){(!t.groups||!t.groups.length)&&(t.groups=[{columns:[[],[]]}]);let n=t.groups[0];n.columns&&n.columns.length&&(n.columns[0]=[...n.columns[0],e])}else{(!this.state.arch.groups||!this.state.arch.groups.length)&&(this.state.arch.groups=[{columns:[[],[]]}]);let t=this.state.arch.groups[0];t.columns&&t.columns.length&&(t.columns[0]=[...t.columns[0],e])}this.state.arch={...this.state.arch}}this.selectField(e)}addFormComponent(e){if(this._pushUndo(),e===`group`){let e=this.state.formActiveTab?(this.state.arch.tabs||[]).find(e=>e.name===this.state.formActiveTab):null;e&&(!e.type||e.type===`layout`)?(e.groups=e.groups||[],e.groups.push({columns:[[],[]]})):(this.state.arch.groups=this.state.arch.groups||[],this.state.arch.groups.push({columns:[[],[]]}))}else if(e===`tab`){this.state.arch.tabs=this.state.arch.tabs||[];let e={name:`tab_`+Date.now(),label:`New Tab`};this.state.arch.tabs.push(e),this.state.arch.tabs.length===1&&(this.state.formActiveTab=e.name)}else e===`separator`?(this.state.arch.groups=this.state.arch.groups||[],this.state.arch.groups.push({columns:[[`separator_`+Date.now()],[]]})):e===`statusbar`?this.state.arch.statusbar=this.state.arch.statusbar||`1`:e===`chatter`?this.state.arch.chatter=!0:e===`stat_button`&&(this.state.arch.stat_buttons=this.state.arch.stat_buttons||[],this.state.arch.stat_buttons.push({name:`stat_`+Date.now()}));this.state.arch={...this.state.arch}}selectField(e){this.state.selectedField=e,this.state.selectedTab=null,this.state.selectedGroup=null}removeSelectedField(){let e=this.state.selectedField;if(e){if(this.state.activeTab===`list`&&this.state.arch.fields&&(this.state.arch.fields=this.state.arch.fields.filter(t=>t!==e),this.state.arch.column_config&&delete this.state.arch.column_config[e]),this.state.activeTab===`spreadsheet`&&this.state.arch.fields&&(this.state.arch.fields=this.state.arch.fields.filter(t=>t!==e)),this.state.activeTab===`kanban`&&this.state.arch.card_fields&&(this.state.arch.card_fields=this.state.arch.card_fields.filter(t=>t!==e)),this.state.activeTab===`form`){let t=!1;if(this.state.arch.groups)for(let n=0;n<this.state.arch.groups.length;n++){let r=this.state.arch.groups[n];for(let n=0;n<(r.columns||[]).length;n++){let i=r.columns[n],a=i.findIndex(t=>(typeof t==`string`?t:t.name)===e);a!==-1&&(i.splice(a,1),t=!0)}}if(this.state.arch.tabs)for(let n=0;n<this.state.arch.tabs.length;n++){let r=this.state.arch.tabs[n];if(r.groups)for(let n=0;n<r.groups.length;n++){let i=r.groups[n];for(let n=0;n<(i.columns||[]).length;n++){let r=i.columns[n],a=r.findIndex(t=>(typeof t==`string`?t:t.name)===e);a!==-1&&(r.splice(a,1),t=!0)}}}t&&(this.state.arch={...this.state.arch})}this.state.selectedField=null}}setColumnConfig(e,t,n){this.state.arch.column_config||(this.state.arch.column_config={}),this.state.arch.column_config[e]||(this.state.arch.column_config[e]={}),t===`_agg`?(delete this.state.arch.column_config[e].sum,delete this.state.arch.column_config[e].avg,delete this.state.arch.column_config[e].max,delete this.state.arch.column_config[e].min,n&&(this.state.arch.column_config[e][n]=`Total`)):n?this.state.arch.column_config[e][t]=n:delete this.state.arch.column_config[e][t],this.state.arch={...this.state.arch}}addToArchArray(e,t){t&&(this.state.arch[e]||(this.state.arch[e]=[]),this.state.arch[e].includes(t)||(this.state.arch[e]=[...this.state.arch[e],t]))}_pushUndo(){this._undoStack.push(JSON.stringify(this.state.arch)),this._undoStack.length>50&&this._undoStack.shift(),this._redoStack=[]}undo(){this._undoStack.length&&(this._redoStack.push(JSON.stringify(this.state.arch)),this.state.arch=JSON.parse(this._undoStack.pop()))}redo(){this._redoStack.length&&(this._undoStack.push(JSON.stringify(this.state.arch)),this.state.arch=JSON.parse(this._redoStack.pop()))}onPaletteDrag(e,t){e.dataTransfer.setData(`text/plain`,JSON.stringify(t)),e.dataTransfer.effectAllowed=`copy`,e.currentTarget.classList.add(`ls-vb-dragging`)}onPaletteDragEnd(e){e.currentTarget.classList.remove(`ls-vb-dragging`)}onFieldPaletteDrag(e,t){e.dataTransfer.setData(`text/plain`,JSON.stringify({type:`field`,name:t})),e.dataTransfer.effectAllowed=`copy`,e.currentTarget.classList.add(`ls-vb-dragging`)}onFieldPaletteDragEnd(e){e.currentTarget.classList.remove(`ls-vb-dragging`)}onDragOver(e){e.preventDefault(),e.dataTransfer.dropEffect=`copy`;let t=e.currentTarget;t&&t.classList&&t.classList.add(`drag-over`)}onDragLeave(e){let t=e.currentTarget;t&&t.classList&&t.classList.remove(`drag-over`)}onFormFieldDrag(e,t,n,r,i){e.dataTransfer.setData(`text/plain`,JSON.stringify({type:`move_field`,name:t,grpIdx:n,colIdx:r,fldIdx:i})),e.dataTransfer.effectAllowed=`move`,e.currentTarget.classList.add(`ls-vb-dragging`)}onFormFieldDragEnd(e){e.currentTarget.classList.remove(`ls-vb-dragging`)}onFormFieldDragTab(e,t,n,r,i,a){e.dataTransfer.setData(`text/plain`,JSON.stringify({type:`move_field_tab`,name:n,tabName:t,grpIdx:r,colIdx:i,fldIdx:a})),e.dataTransfer.effectAllowed=`move`,e.currentTarget.classList.add(`ls-vb-dragging`)}onDropFormCol(e,t,n,r=null){e.preventDefault(),e.stopPropagation(),this.onDragLeave(e);let i=e.dataTransfer.getData(`text/plain`);if(i)try{let e=JSON.parse(i);if(e.type===`move_field`){this._pushUndo(),this._removeFieldAt(e.grpIdx,e.colIdx,e.fldIdx);let i=r;t===e.grpIdx&&n===e.colIdx&&i!==null&&e.fldIdx<i&&i--,this._insertFieldAt(e.name,t,n,i),this.state.arch={...this.state.arch},this.selectField(e.name);return}let a=e.name;a&&(this._pushUndo(),this.addFieldToFormCol(a,t,n,r))}catch{}}onDropFormTabCol(e,t,n,r,i=null){e.preventDefault(),e.stopPropagation(),this.onDragLeave(e);let a=e.dataTransfer.getData(`text/plain`);if(a)try{let e=JSON.parse(a),o=e.name||(e.type===`field`?e.name:null);o&&this.addFieldToFormTabCol(o,t,n,r,i)}catch{}}onDropFormLayout(e){e.preventDefault(),e.stopPropagation(),this.onDragLeave(e);let t=e.dataTransfer.getData(`text/plain`);if(t)try{let e=JSON.parse(t);if(e.type===`group`)this.state.arch.groups=this.state.arch.groups||[],this.state.arch.groups.push({columns:[[],[]]}),this.state.arch={...this.state.arch};else if(e.type===`tab`){this.state.arch.tabs=this.state.arch.tabs||[];let e=`new_tab_`+Date.now();this.state.arch.tabs.push({name:e,label:`New Tab`}),this.state.arch.tabs.length===1&&(this.state.formActiveTab=e),this.state.arch={...this.state.arch},this.state.arch.tabs.length===1&&(this.state.formActiveTab=this.state.arch.tabs[0].name)}else e.type===`statusbar`?(this.state.arch.statusbar=`1`,this.state.arch={...this.state.arch}):e.type===`chatter`?(this.state.arch.chatter=`1`,this.state.arch={...this.state.arch}):e.type===`stat_button`?(this.state.arch.stat_buttons=this.state.arch.stat_buttons||[],this.state.arch.stat_buttons.push({name:`stat_`+Date.now()}),this.state.arch={...this.state.arch}):e.type===`separator`?(this.state.arch.groups=this.state.arch.groups||[],this.state.arch.groups.push({columns:[[`separator_`+Date.now()],[]]}),this.state.arch={...this.state.arch}):(e.type===`field`||e.name&&!e.id)&&(this.state.arch.groups=this.state.arch.groups||[],this.state.arch.groups.push({columns:[[e.name],[]]}),this.removeSelectedFieldByName(e.name),this.selectField(e.name),this.state.arch={...this.state.arch})}catch{}}removeStatButton(e){this.state.arch.stat_buttons&&(this.state.arch.stat_buttons.splice(e,1),this.state.arch={...this.state.arch})}onDropFormTabLayout(e){if(e.preventDefault(),e.stopPropagation(),this.onDragLeave(e),!this.state.formActiveTab)return;let t=this.state.arch.tabs.find(e=>e.name===this.state.formActiveTab);if(!t)return;let n=e.dataTransfer.getData(`text/plain`);if(n)try{let e=JSON.parse(n);if(e.type===`group`)t.groups=t.groups||[],t.groups.push({columns:[[],[]]}),this.state.arch={...this.state.arch};else if(e.type===`field`||e.name&&!e.id)t.groups=t.groups||[],t.groups.push({columns:[[e.name],[]]}),this.removeSelectedFieldByName(e.name),this.selectField(e.name),this.state.arch={...this.state.arch};else if(e.type===`tab`){this.state.arch.tabs=this.state.arch.tabs||[];let e=`new_tab_`+Date.now();this.state.arch.tabs.push({name:e,label:`New Tab`}),this.state.formActiveTab=e,this.state.arch={...this.state.arch}}}catch{}}_removeFieldAt(e,t,n){if(this.state.arch.groups&&this.state.arch.groups[e]){let r=this.state.arch.groups[e].columns?.[t];r&&n>=0&&n<r.length&&r.splice(n,1)}}_insertFieldAt(e,t,n,r){if(this.state.arch.groups&&this.state.arch.groups[t]){let i=this.state.arch.groups[t].columns?.[n];i&&(r!==null&&r>=0?i.splice(r,0,e):i.push(e))}}addFieldToFormCol(e,t,n,r=null){if(this.removeSelectedFieldByName(e),this.state.arch.groups&&this.state.arch.groups[t]){let i=this.state.arch.groups[t];i.columns&&i.columns[n]&&(r!==null&&r>=0?i.columns[n].splice(r,0,e):i.columns[n].push(e),this.state.arch={...this.state.arch})}this.selectField(e)}addFieldToFormTabCol(e,t,n,r,i=null){if(this.removeSelectedFieldByName(e),this.state.arch.tabs){let a=this.state.arch.tabs.find(e=>e.name===t);if(a&&a.groups&&a.groups[n]){let t=a.groups[n];t.columns&&t.columns[r]&&(i!==null&&i>=0?t.columns[r].splice(i,0,e):t.columns[r].push(e),this.state.arch={...this.state.arch})}}this.selectField(e)}removeSelectedFieldByName(e){if(this.state.activeTab===`form`){if(this.state.arch.groups)for(let t=0;t<this.state.arch.groups.length;t++){let n=this.state.arch.groups[t];for(let t=0;t<(n.columns||[]).length;t++){let r=n.columns[t],i=r.findIndex(t=>(typeof t==`string`?t:t.name)===e);i!==-1&&r.splice(i,1)}}if(this.state.arch.tabs)for(let t=0;t<this.state.arch.tabs.length;t++){let n=this.state.arch.tabs[t];if(n.groups)for(let t=0;t<n.groups.length;t++){let r=n.groups[t];for(let t=0;t<(r.columns||[]).length;t++){let n=r.columns[t],i=n.findIndex(t=>(typeof t==`string`?t:t.name)===e);i!==-1&&n.splice(i,1)}}}}}selectTab(e){this.state.selectedTab=e,this.state.selectedField=null,this.state.selectedGroup=null,this.state.arch.tabs[e]&&(this.state.formActiveTab=this.state.arch.tabs[e].name)}selectGroup(e){this.state.selectedGroup=e,this.state.selectedField=null,this.state.selectedTab=null}moveTab(e,t){if(!this.state.arch.tabs)return;let n=e+t;if(n<0||n>=this.state.arch.tabs.length)return;let r=this.state.arch.tabs,i=r[e];r[e]=r[n],r[n]=i,this.state.selectedTab=n,this.state.arch={...this.state.arch}}removeTab(e){this.state.arch.tabs&&(this.state.arch.tabs.splice(e,1),this.state.selectedTab=null,this.state.arch={...this.state.arch})}setGroupColumns(e,t){t=parseInt(t)||2,this._pushUndo();let n=this.state.arch.groups?.[e];if(!n)return;let r=n.columns||[];for(;r.length<t;)r.push([]);for(;r.length>t;){let e=r.pop();e.length&&r.length>0&&r[r.length-1].push(...e)}n.columns=r,this.state.arch={...this.state.arch}}moveGroup(e,t){if(!this.state.arch.groups)return;let n=e+t;if(n<0||n>=this.state.arch.groups.length)return;this._pushUndo();let r=this.state.arch.groups,i=r[e];r[e]=r[n],r[n]=i,this.state.arch={...this.state.arch}}removeGroup(e){this.state.arch.groups&&confirm(`Remove this group and all its fields?`)&&(this.state.arch.groups.splice(e,1),this.state.arch={...this.state.arch})}moveTabGroup(e,t,n){let r=(this.state.arch.tabs||[]).find(t=>t.name===e);if(!r||!r.groups)return;let i=t+n;if(i<0||i>=r.groups.length)return;let a=r.groups[t];r.groups[t]=r.groups[i],r.groups[i]=a,this.state.arch={...this.state.arch}}removeTabGroup(e,t){let n=(this.state.arch.tabs||[]).find(t=>t.name===e);!n||!n.groups||confirm(`Remove this group and all its fields?`)&&(n.groups.splice(t,1),this.state.arch={...this.state.arch})}setTabType(e,t){let n=this.state.arch.tabs[e];n&&(n.type=t,t===`one2many`?(n.field=n.field||``,n.editable=n.editable||`bottom`,n.tree_fields=n.tree_fields||[],delete n.groups):t===`field`?(n.field=n.field||``,delete n.groups,delete n.tree_fields,delete n.editable):(n.groups=n.groups||[],delete n.field,delete n.tree_fields,delete n.editable,delete n.type),this.state.arch={...this.state.arch})}setTabField(e,t){let n=this.state.arch.tabs[e];if(n){if(n.field=t,n.type===`one2many`&&(!n.tree_fields||n.tree_fields.length===0)){let e=this.state.fields[t];e&&e.relation_fields&&(n.tree_fields=Object.keys(e.relation_fields).slice(0,5))}this.state.arch={...this.state.arch}}}addTabTreeField(e,t){let n=this.state.arch.tabs[e];!n||!t||(n.tree_fields||=[],n.tree_fields.includes(t)||(n.tree_fields.push(t),this.state.arch={...this.state.arch}))}removeTabTreeField(e,t){let n=this.state.arch.tabs[e];!n||!n.tree_fields||(n.tree_fields.splice(t,1),this.state.arch={...this.state.arch})}getTabChildFields(e){let t=this.state.arch.tabs?.[e];if(!t||!t.field)return[];let n=this.state.fields[t.field];return!n||!n.relation_fields?[]:Object.entries(n.relation_fields).map(([e,t])=>({name:e,string:t.string||e,type:t.type||`char`}))}get widgetOptions(){return this.state.selectedField&&{char:[[``,`Default`],[`email`,`Email`],[`phone`,`Phone`],[`url`,`URL`],[`image`,`Image`],[`color`,`Color Picker`]],text:[[``,`Default`],[`html`,`Rich Text (HTML)`]],integer:[[``,`Default`],[`progressbar`,`Progress Bar`],[`handle`,`Drag Handle`]],float:[[``,`Default`],[`float_time`,`Duration (H:M)`],[`progressbar`,`Progress Bar`],[`percentage`,`Percentage`]],monetary:[[``,`Default (Monetary)`]],boolean:[[``,`Default (Checkbox)`],[`toggle`,`Toggle Switch`]],date:[[``,`Default`],[`remaining_days`,`Remaining Days`]],datetime:[[``,`Default`],[`remaining_days`,`Remaining Days`]],selection:[[``,`Default`],[`badge`,`Badge`],[`radio`,`Radio`],[`priority`,`Priority Stars`],[`statusbar`,`Status Bar`]],many2one:[[``,`Default`],[`many2one_avatar`,`Avatar`]],one2many:[[``,`Default (Inline List)`]],many2many:[[``,`Default`],[`many2many_tags`,`Tags`],[`many2many_checkboxes`,`Checkboxes`]],html:[[``,`Default (HTML)`]]}[this.fieldType(this.state.selectedField)]||[[``,`Default`]]}setFormFieldConfig(e,t,n){this.state.arch.field_config||(this.state.arch.field_config={}),this.state.arch.field_config[e]||(this.state.arch.field_config[e]={}),n===``||n===!1||n==null?(delete this.state.arch.field_config[e][t],Object.keys(this.state.arch.field_config[e]).length===0&&delete this.state.arch.field_config[e]):this.state.arch.field_config[e][t]=n,this.state.arch={...this.state.arch}}getFormFieldConfig(e,t){return this.state.arch?.field_config?.[e]?.[t]??``}setGroupString(e,t){this.state.arch.groups&&this.state.arch.groups[e]&&(this.state.arch.groups[e].string=t||null,this.state.arch={...this.state.arch})}fieldLabel(e){return e&&e.startsWith(`separator_`)?`Separator`:this.state.fields[e]?.string||e}fieldType(e){return e&&e.startsWith(`separator_`)?`separator`:this.state.fields[e]?.type||`char`}fieldIcon(e){return{char:`type`,text:`align-left`,integer:`hash`,float:`hash`,monetary:`dollar-sign`,boolean:`toggle-left`,date:`calendar`,datetime:`clock`,selection:`list`,many2one:`link`,one2many:`git-branch`,many2many:`tags`,html:`code`,separator:`minus`}[e]||`box`}sampleValue(e,t){if(e&&e.startsWith(`separator_`))return r(`<hr style="margin: 4px 0; padding: 0; border: 0; border-top: 2px dashed #d1d5db;"/>`);let n=this.state.fields[e];if(!n)return e;let i=n.type,a={char:[`Laptop Pro 15`,`Monitor 4K 27"`,`Keyboard Mech`,`Mouse Wireless`],text:[`Description...`,`Notes here...`,`Details...`,`Content...`],integer:[42,128,7,365],float:[24.5,9.75,3.25,1.05],monetary:[`Rp 24.000.000`,`Rp 9.000.000`,`Rp 3.750.000`,`Rp 1.050.000`],boolean:[!0,!1,!0,!1],date:[`2026-06-01`,`2026-06-15`,`2026-07-01`,`2026-07-30`],datetime:[`2026-06-01 08:00`,`2026-06-15 14:30`,`2026-07-01 09:00`,`2026-07-30 16:00`],selection:[`New`,`In Progress`,`Done`,`Cancelled`],many2one:[`Project Alpha`,`Beta Corp`,`Gamma Inc`,`Delta LLC`],many2many:[`Tag A, Tag B`,`Tag C`,`Tag A, Tag D`,`Tag B, Tag C`]},o=a[i]||a.char,s=o[((t||1)-1)%o.length];return i===`monetary`?s:i===`many2one`?r(`<span class="ls-vb-sample-m2o">${s}</span>`):i===`selection`?r(`<span class="ls-vb-sample-badge">${s}</span>`):i===`boolean`?r(`<span class="ls-vb-sample-check ${s?`checked`:``}"></span>`):i===`many2many`?r(`<span class="ls-vb-sample-tags">${s.split(`,`).map(e=>`<span class="ls-vb-sample-tag">${e.trim()}</span>`).join(``)}</span>`):String(s)}async switchTab(e){this.state.activeTab=e,this.state.selectedField=null,this.state.showXml=!1,this.state.selectedModel&&await this.loadCurrentView()}onPaletteDrag(e,t){e.dataTransfer.setData(`text/plain`,JSON.stringify(t))}async viewXml(){try{let e=await i.call(`/api/view-builder/preview-xml`,{type:this.state.activeTab,arch:this.state.arch});this.state.xmlPreview=e.xml||``,this.state.showXml=!this.state.showXml||this.state.xmlPreview}catch{this.showToast(`Failed to generate XML`,`error`)}}copyXml(){navigator.clipboard.writeText(this.state.xmlPreview),this.showToast(`XML copied to clipboard`,`success`)}async resetView(){this.initDefaultArch(),this.state.selectedField=null,this.state.showXml=!1,this.showToast(`View reset to defaults`,`success`)}async saveView(){if(this.state.selectedModel)try{await i.call(`/api/view-builder/save-view`,{model:this.state.selectedModel,type:this.state.activeTab,arch:this.state.arch}),this.showToast(`View saved successfully!`,`success`)}catch(e){this.showToast(`Failed to save view: `+e.message,`error`)}}async exportToCode(){if(this.state.selectedModel)try{let e=await i.call(`/api/view-builder/export-code`,{model:this.state.selectedModel,type:this.state.activeTab,arch:this.state.arch});this.state.codePreview=e.code||`// No code generated`,this.state.showCode=!0}catch(e){this.showToast(`Failed to export code: `+e.message,`error`)}}copyCode(){navigator.clipboard&&this.state.codePreview&&navigator.clipboard.writeText(this.state.codePreview).then(()=>{this.showToast(`Code copied to clipboard!`,`success`)})}showToast(e,t=``){this.state.toast=e,this.state.toastType=t,setTimeout(()=>{this.state.toast=``},3e3)}}window.ViewBuilderView=a})(),(function(){let{Component:e,useState:t,onMounted:n}=owl,r=window.LarasoftRPC,i=[`#7c3aed`,`#0d9488`,`#dc2626`,`#d97706`,`#2563eb`,`#db2777`,`#059669`,`#7c3aed`];function a(e=``){let t=0;for(let n=0;n<e.length;n++)t=e.charCodeAt(n)+((t<<5)-t);return i[Math.abs(t)%i.length]}class o extends e{static template=window.MY_CUSTOM_PAGE_TPL;setup(){this.state=t({items:[],stats:null,loading:!1,error:null,searchQuery:``,filterStatus:``,sortField:`created_at`,sortDir:`desc`,modal:{open:!1,mode:`create`,editId:null,form:{name:``,description:``,status:`active`},saving:!1,error:null},detail:{open:!1,item:null},deleteConfirm:{open:!1,item:null,deleting:!1}}),n(()=>this.fetchData())}async fetchData(){this.state.loading=!0,this.state.error=null;try{let e=await r.call(`/api/custom-page/items`,{}),t=(e.items||[]).map(e=>({...e,color:a(e.name)}));this.state.items=t,this.state.stats=e.stats||this._computeStats(t)}catch(e){this.state.error=e.message||`Gagal memuat data dari server.`}finally{this.state.loading=!1}}_computeStats(e){return{total:e.length,active:e.filter(e=>e.status===`active`).length,pending:e.filter(e=>e.status===`pending`).length,inactive:e.filter(e=>e.status===`inactive`).length}}get filteredItems(){let e=this.state.items;if(this.state.searchQuery){let t=this.state.searchQuery.toLowerCase();e=e.filter(e=>e.name.toLowerCase().includes(t)||(e.description||``).toLowerCase().includes(t))}this.state.filterStatus&&(e=e.filter(e=>e.status===this.state.filterStatus));let t=this.state.sortField,n=this.state.sortDir===`asc`?1:-1;return e=[...e].sort((e,r)=>{let i=e[t]||``,a=r[t]||``;return i<a?-n:i>a?n:0}),e}onSearch(){}onFilter(){}clearFilters(){this.state.searchQuery=``,this.state.filterStatus=``}sortBy(e){this.state.sortField===e?this.state.sortDir=this.state.sortDir===`asc`?`desc`:`asc`:(this.state.sortField=e,this.state.sortDir=`asc`)}openCreateModal(){this.state.modal={open:!0,mode:`create`,editId:null,form:{name:``,description:``,status:`active`},saving:!1,error:null}}openEdit(e){this.state.modal={open:!0,mode:`edit`,editId:e.id,form:{name:e.name,description:e.description||``,status:e.status},saving:!1,error:null}}async saveModal(){let e=this.state.modal.form;if(!e.name.trim()){this.state.modal.error=`Nama tidak boleh kosong.`;return}this.state.modal.saving=!0,this.state.modal.error=null;try{this.state.modal.mode===`create`?await r.call(`/api/custom-page/items/create`,e):await r.call(`/api/custom-page/items/update`,{id:this.state.modal.editId,...e}),this.closeModal(),await this.fetchData()}catch(e){this.state.modal.error=e.message||`Gagal menyimpan data.`}finally{this.state.modal.saving=!1}}closeModal(){this.state.modal.open=!1}openDetail(e){this.state.detail={open:!0,item:e}}closeDetail(){this.state.detail.open=!1}confirmDelete(e){this.state.deleteConfirm={open:!0,item:e,deleting:!1}}cancelDelete(){this.state.deleteConfirm.open=!1}async deleteItem(){this.state.deleteConfirm.deleting=!0;try{await r.call(`/api/custom-page/items/delete`,{id:this.state.deleteConfirm.item.id}),this.state.deleteConfirm.open=!1,await this.fetchData()}catch(e){console.error(`Delete error:`,e),this.state.deleteConfirm.deleting=!1}}statusLabel(e){return{active:`Aktif`,pending:`Tertunda`,inactive:`Nonaktif`}[e]||e}formatDate(e){if(!e)return`—`;let t=new Date(e);return isNaN(t)?e:t.toLocaleDateString(`id-ID`,{day:`2-digit`,month:`short`,year:`numeric`})}}window.LarasoftPageRegistry=window.LarasoftPageRegistry||{},window.LarasoftPageRegistry.my_custom_page=o})(),(function(){let e=document.querySelector(`meta[name="csrf-token"]`)?.content||window.__CSRF_TOKEN__||``;async function t(t,n={}){let r=await fetch(t,{method:`POST`,headers:{"Content-Type":`application/json`,"X-CSRF-TOKEN":e,Accept:`application/json`},body:JSON.stringify(n)});if(!r.ok){let e=await r.json().catch(()=>({error:r.statusText})),t=Error(e.error||e.message||`RPC Error`);throw t.serverError=e,t}return r.json()}async function n(t){return(await fetch(t,{headers:{Accept:`application/json`,"X-CSRF-TOKEN":e}})).json()}window.LarasoftRPC=window.LarasoftRPC||{},Object.assign(window.LarasoftRPC,{csrf:e,async login(e,n){let r=await t(`/api/auth/login`,{login:e,password:n});return r.success&&(window.LarasoftUser=r.user),r},async logout(){let e=await t(`/api/auth/logout`,{});return window.LarasoftUser={uid:null},e},async me(){let e=await n(`/api/auth/me`);return window.LarasoftUser=e.user||{},e},async loadMenu(){return n(`/api/auth/menu`)},call:t,get:e=>n(e),searchRead(e,n=[],r={}){return t(`/api/orm/search_read`,{model:e,domain:n,order:r.order,limit:r.limit,offset:r.offset,group_by:r.group_by})},read(e,n){return t(`/api/orm/read`,{model:e,id:n})},create(e,n){return t(`/api/orm/create`,{model:e,values:n})},write(e,n,r){return t(`/api/orm/write`,{model:e,ids:n,values:r})},unlink(e,n){return t(`/api/orm/unlink`,{model:e,ids:n})},defaultGet(e){return t(`/api/orm/default_get`,{model:e})},fieldsGet(e){return t(`/api/orm/fields_get`,{model:e})},getView(e,n){return t(`/api/orm/get_view`,{model:e,view_type:n})},readGroup(e,n=[],r=[],i=[]){return t(`/api/orm/read_group`,{model:e,domain:n,group_by:r,measures:i})},onchange(e,n,r){return t(`/api/orm/onchange`,{model:e,field:n,values:r})},call_button(e,n,r){return t(`/api/orm/call_button`,{model:e,id:n,method:r})},nameSearch(e,n=``,r=20){return t(`/api/orm/name_search`,{model:e,query:n,limit:r})},quickCreate(e,n){return t(`/api/orm/quick_create`,{model:e,name:n})},createChild(e,n,r,i=null){return t(`/api/orm/create_child`,{parent_model:e,field:n,values:r,context:i})},async updateChild(t,n,r,i=null){let a=await fetch(`/api/orm/update_child/${n}`,{method:`PUT`,headers:{"Content-Type":`application/json`,"X-CSRF-TOKEN":e,Accept:`application/json`},body:JSON.stringify({child_model:t,values:r,write_date:i})});if(!a.ok){let e=await a.json().catch(()=>({error:a.statusText}));throw Error(e.error||`Update failed`)}return a.json()},async deleteChild(t,n){let r=await fetch(`/api/orm/delete_child/${n}`,{method:`DELETE`,headers:{"Content-Type":`application/json`,"X-CSRF-TOKEN":e,Accept:`application/json`},body:JSON.stringify({child_model:t})});if(!r.ok){let e=await r.json().catch(()=>({error:r.statusText}));throw Error(e.error||`Delete failed`)}return r.json()},onchangeO2m(e,n,r,i={}){return t(`/api/orm/onchange_o2m`,{child_model:e,changed_field:n,values:r,context:i})},loadO2m(e,n,r,i={}){return t(`/api/orm/load_o2m`,{parent_model:e,field:n,parent_id:r,domain:i.domain||[],offset:i.offset||0,limit:i.limit||80,order:i.order||null})},loadO2mGrouped(e,n,r,i={}){return t(`/api/orm/load_o2m_grouped`,{parent_model:e,field:n,parent_id:r,group_by:i.group_by,aggregate_fields:i.aggregate_fields||[],domain:i.domain||[],load_records:i.load_records!==!1,limit:i.limit||40})},bulkCreateChild(e,n,r){return t(`/api/orm/bulk_create_child`,{parent_model:e,field:n,records:r})},bulkDeleteChild(e,n){return t(`/api/orm/bulk_delete_child`,{child_model:e,ids:n})},bulkWriteChild(e,n,r){return t(`/api/orm/bulk_write_child`,{child_model:e,ids:n,values:r})},reorderO2m(e,n,r){return t(`/api/orm/reorder_o2m`,{child_model:e,sequence_field:n,ordered_ids:r})},callButtonO2m(e,n,r){return t(`/api/orm/call_button_o2m`,{child_model:e,id:n,method:r})},printO2m(e,n,r){return t(`/api/orm/print_o2m`,{parent_model:e,field:n,parent_id:r})},defaultGet(e,n=null){return t(`/api/orm/default_get`,{model:e,fields:n})},modelInfo(e){return t(`/api/orm/model_info`,{model:e})},loadMenus(){return n(`/api/orm/load_menus`)},loadAction(e){return t(`/api/orm/load_action`,{action_id:e})},getFilters(e){return n(`/api/filters?model=${e}`)},saveFilter(e){return t(`/api/filters`,e)},async updateProfile(e){let n=await t(`/profile`,{...e,_ajax:1});return n.success&&(window.LarasoftUser=n.user),n},async changePassword(e,n,r){return t(`/profile/password`,{current_password:e,password:n,password_confirmation:r,_ajax:1})}})})(),(function(){let e=`larasoft_layout`,t=[{id:`purple`,label:`Purple`,color:`#714B67`},{id:`blue`,label:`Blue`,color:`#3B82F6`},{id:`indigo`,label:`Indigo`,color:`#6366F1`},{id:`green`,label:`Green`,color:`#059669`},{id:`teal`,label:`Teal`,color:`#0D9488`},{id:`red`,label:`Red`,color:`#DC2626`},{id:`amber`,label:`Amber`,color:`#D97706`},{id:`slate`,label:`Slate`,color:`#475569`}],n={theme:`light`,brandColor:`purple`,density:`default`,settingsOpen:!1,mobileMenuOpen:!1};function r(){try{let t=localStorage.getItem(e);return t?{...n,...JSON.parse(t)}:{...n}}catch{return{...n}}}function i(t){try{localStorage.setItem(e,JSON.stringify({theme:t.theme,brandColor:t.brandColor,density:t.density}))}catch{}}function a(){let e=window.innerWidth;return e<=768?`mobile`:e<=1024?`tablet`:`desktop`}function o(e){document.documentElement.setAttribute(`data-theme`,e)}function s(e){let n=t.find(t=>t.id===e)||t[0],r=document.documentElement;r.style.setProperty(`--ls-primary`,n.color),r.style.setProperty(`--ls-navbar-bg`,n.color),r.style.setProperty(`--ls-primary-light`,l(n.color,20)),r.style.setProperty(`--ls-primary-dark`,l(n.color,-15))}function c(e){document.documentElement.setAttribute(`data-density`,e)}function l(e,t){e=e.replace(`#`,``);let n=parseInt(e.substr(0,2),16),r=parseInt(e.substr(2,2),16),i=parseInt(e.substr(4,2),16);return n=Math.min(255,Math.max(0,n+Math.round(n*t/100))),r=Math.min(255,Math.max(0,r+Math.round(r*t/100))),i=Math.min(255,Math.max(0,i+Math.round(i*t/100))),`#`+[n,r,i].map(e=>e.toString(16).padStart(2,`0`)).join(``)}class u{constructor(){this.prefs=r(),this.device=a(),this._listeners=[],o(this.prefs.theme),s(this.prefs.brandColor),c(this.prefs.density);let e;window.addEventListener(`resize`,()=>{clearTimeout(e),e=setTimeout(()=>{let e=a();e!==this.device&&(this.device=e,this._notify())},150)}),window.matchMedia&&window.matchMedia(`(prefers-color-scheme: dark)`).addEventListener(`change`,()=>{this.prefs.theme===`auto`&&this._notify()})}get theme(){return this.prefs.theme}get brandColor(){return this.prefs.brandColor}get density(){return this.prefs.density}get isMobile(){return this.device===`mobile`}get isTablet(){return this.device===`tablet`}get isDesktop(){return this.device===`desktop`}get settingsOpen(){return this.prefs.settingsOpen}get mobileMenuOpen(){return this.prefs.mobileMenuOpen}get brandColors(){return t}get effectiveTheme(){return this.prefs.theme===`auto`?window.matchMedia&&window.matchMedia(`(prefers-color-scheme: dark)`).matches?`dark`:`light`:this.prefs.theme}setTheme(e){this.prefs.theme=e,o(e),i(this.prefs),this._notify()}setBrandColor(e){this.prefs.brandColor=e,s(e),i(this.prefs),this._notify()}setDensity(e){this.prefs.density=e,c(e),i(this.prefs),this._notify()}toggleSettings(){this.prefs.settingsOpen=!this.prefs.settingsOpen,this.prefs.settingsOpen&&(this.prefs.mobileMenuOpen=!1),this._notify()}closeSettings(){this.prefs.settingsOpen=!1,this._notify()}toggleMobileMenu(){this.prefs.mobileMenuOpen=!this.prefs.mobileMenuOpen,this.prefs.mobileMenuOpen&&(this.prefs.settingsOpen=!1),this._notify()}closeMobileMenu(){this.prefs.mobileMenuOpen=!1,this._notify()}onChange(e){return this._listeners.push(e),()=>{this._listeners=this._listeners.filter(t=>t!==e)}}_notify(){for(let e of this._listeners)try{e(this)}catch(e){console.error(`[LayoutService]`,e)}}toState(){return{theme:this.prefs.theme,effectiveTheme:this.effectiveTheme,brandColor:this.prefs.brandColor,density:this.prefs.density,device:this.device,isMobile:this.isMobile,isTablet:this.isTablet,isDesktop:this.isDesktop,settingsOpen:this.prefs.settingsOpen,mobileMenuOpen:this.prefs.mobileMenuOpen,brandColors:t}}}window.LarasoftLayout=new u})(),(function(){let{xml:e}=owl;window.TEMPLATES={},window.listHelpers={renderListCell:(e,t)=>window.FieldWidgets?window.FieldWidgets.renderList(e,t):String(t??``),getFieldLabel:(e,t,n)=>{if(e?.columns){let n=e.columns.find(e=>e.name===t);if(n?.string)return n.string}return(e?.field_defs||{})[t]?.string||(n||{})[t]?.string||t.replace(/_/g,` `).replace(/\bid\b/g,``).trim().replace(/^\w/,e=>e.toUpperCase())||t}},window.TEMPLATES.App=e`
<div class="ls-app">
    <div class="ls-control-panel">
        <div class="ls-cp-top">
            <div class="ls-breadcrumb">
                <span class="ls-breadcrumb-item" t-esc="props.actionTitle || 'Records'"/>
            </div>
            
            <div class="ls-searchbar-row">
                <div class="ls-searchbar" t-on-click="focusSearch" t-ref="searchbar">
                    <span class="ls-searchbar-icon"><t t-out="icons.search"/></span>
                    <t t-foreach="state.facets" t-as="facet" t-key="facet.id">
                        <span t-att-class="'ls-facet ls-facet-' + facet.type + (facet.negated ? ' ls-facet-negated' : '')">
                            <span class="ls-facet-label" t-esc="facet.label"/>
                            <t t-if="facet.type === 'filter' or facet.type === 'search'">
                                <button class="ls-facet-negate" t-on-click.stop="() => this.toggleFacetNegate(facet.id)"
                                        t-att-title="facet.negated ? 'Remove negation' : 'Exclude this filter'">!</button>
                            </t>
                            <span class="ls-facet-value" t-esc="facet.display"/>
                            <button class="ls-facet-close" t-on-click.stop="() => this.removeFacet(facet.id)">✕</button>
                        </span>
                    </t>
                    <input class="ls-search-input" t-ref="searchInput" placeholder="Search..."
                        t-on-keydown="onSearchKeydown" t-on-input="onSearchInput" t-on-focus="onSearchFocus"/>

                    <t t-if="state.showAutocomplete and state.searchQuery.length > 0">
                        <div class="ls-autocomplete">
                            <div class="ls-autocomplete-section">
                                <div class="ls-autocomplete-title">Search for: <b t-esc="state.searchQuery"/></div>
                                <div class="ls-autocomplete-item" t-on-click="applyTextSearch">in <b>All Fields</b></div>
                            </div>
                            <t t-foreach="autocompleteFields" t-as="af" t-key="af.field">
                                <div class="ls-autocomplete-section">
                                    <div class="ls-autocomplete-title" t-esc="af.label"/>
                                    <div class="ls-autocomplete-item" t-on-click="() => this.applyFieldSearch(af.field, af.operator)">
                                        <b t-esc="state.searchQuery"/>
                                    </div>
                                </div>
                            </t>
                        </div>
                    </t>

                    <t t-if="state.showSearchPanel">
                        <div class="ls-search-dropdown" t-on-click.stop="">
                            <div class="ls-search-section">
                                <div class="ls-search-section-title filters-title">
                                    <t t-out="icons.filter"/> Filters
                                </div>
                                <t t-foreach="filterItems" t-as="fi" t-key="fi.id">
                                    <div t-att-class="'ls-search-item' + (isFilterActive(fi.id) ? ' active' : '')"
                                         t-on-click="() => this.toggleFilter(fi)">
                                        <span class="ls-search-item-check"/>
                                        <span t-esc="fi.label"/>
                                    </div>
                                </t>
                                <div class="ls-search-separator"/>
                                <div class="ls-search-item" t-on-click="toggleCustomFilter" style="color:var(--ls-primary);font-weight:500;">
                                    Custom Filter...
                                </div>
                                <t t-if="state.showCustomFilter">
                                    <div class="ls-custom-filter-row">
                                        <select t-ref="cfField">
                                            <t t-foreach="customFilterFields" t-as="cf" t-key="cf.field">
                                                <option t-att-value="cf.field" t-esc="cf.label"/>
                                            </t>
                                        </select>
                                        <select t-ref="cfOp">
                                            <option value="ilike">contains</option>
                                            <option value="=">is equal to</option>
                                            <option value="!=">is not equal to</option>
                                            <option value="gt">greater than</option>
                                            <option value="lt">less than</option>
                                            <option value="is_set">is set</option>
                                            <option value="is_not_set">is not set</option>
                                        </select>
                                        <input t-ref="cfVal" placeholder="Value"/>
                                        <button class="ls-btn ls-btn-sm ls-btn-primary" t-on-click="applyCustomFilter">Apply</button>
                                    </div>
                                </t>
                            </div>

                            <div class="ls-search-section">
                                <div class="ls-search-section-title groupby-title">
                                    <t t-out="icons.group"/> Group By
                                </div>
                                <t t-foreach="groupByItems" t-as="gi" t-key="gi.field">
                                    <div t-att-class="'ls-search-item' + (isGroupByActive(gi.field) ? ' active' : '')"
                                         t-on-click="() => this.toggleGroupBy(gi.field)">
                                        <span class="ls-search-item-check"/>
                                        <span t-esc="gi.label"/>
                                    </div>
                                </t>
                            </div>

                            <div class="ls-search-section">
                                <div class="ls-search-section-title favorites-title">
                                    <t t-out="icons.star"/> Favorites
                                </div>
                                <t t-foreach="state.savedFilters" t-as="sf" t-key="sf.id">
                                    <div class="ls-search-item" t-on-click="() => this.applySavedFilter(sf)" style="justify-content:space-between;">
                                        <span t-esc="sf.name"/>
                                        <button class="ls-btn-link" style="font-size:11px;color:var(--ls-danger);padding:0;"
                                                t-on-click.stop="() => this.deleteSavedFilter(sf.id)">✕</button>
                                    </div>
                                </t>
                                <div class="ls-search-separator"/>
                                <div class="ls-search-item" t-on-click="toggleSaveFav" style="color:var(--ls-primary);font-weight:500;">
                                    Save current search
                                </div>
                                <t t-if="state.showSaveFav">
                                    <div class="ls-save-fav">
                                        <input type="text" t-ref="favName" placeholder="Filter name..."/>
                                        <label><input type="checkbox" t-ref="favDefault"/> Use by default</label>
                                        <label><input type="checkbox" t-ref="favShared"/> Share with all users</label>
                                        <div class="ls-save-fav-actions">
                                            <button class="ls-btn ls-btn-sm ls-btn-primary" t-on-click="saveFavorite">Save</button>
                                        </div>
                                    </div>
                                </t>
                            </div>
                        </div>
                    </t>
                </div>
                <button class="ls-search-panel-toggle" t-on-click.stop="toggleSearchPanel">
                    <t t-out="icons.chevDown"/>
                </button>
            </div>
        </div>

        <div class="ls-cp-bottom">
            <div class="ls-cp-action-buttons">
                <t t-if="listEditable">
                    <button class="ls-btn ls-btn-primary" t-on-click="onNewInline">New</button>
                </t>
                <t t-else="">
                    <button class="ls-btn ls-btn-primary" t-on-click="onNewTask">New</button>
                </t>
                <div class="ls-print-menu" style="position:relative; display:inline-block;" t-if="state.printActions and state.printActions.length > 0">
                    <button class="ls-btn" t-on-click="togglePrintMenu" title="Print Reports">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px; vertical-align:middle;">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg> Print
                        <span class="ls-submenu-caret" style="margin-left:4px;">▾</span>
                    </button>
                    <div class="ls-submenu-dropdown" t-if="state.showPrintMenu" style="position:absolute; top:100%; left:0; z-index:1000; display:flex; flex-direction:column; min-width:180px; text-align:left;">
                        <t t-foreach="state.printActions" t-as="action" t-key="action.id">
                            <div class="ls-submenu-dropdown-item" t-on-click="() => this.printReport(action.id)">
                                <span t-esc="action.name"/>
                            </div>
                        </t>
                    </div>
                </div>

                <!-- Header buttons (multi-record actions) — shown when records selected -->
                <t t-if="state.selectedIds.length > 0 and headerButtons.length > 0">
                    <t t-foreach="headerButtons" t-as="hb" t-key="hb.name">
                        <button t-att-class="'ls-btn ' + (hb.class || 'ls-btn-secondary')"
                                t-on-click="() => this.onHeaderButton(hb)">
                            <t t-if="hb.icon" t-out="window.lucideIcon ? window.lucideIcon(hb.icon, 14) : ''"/>
                            <span t-esc="hb.string"/>
                        </button>
                    </t>
                </t>
            </div>
            <div class="ls-cp-pager-switchers">
                <div class="ls-pager" t-if="!state.groupBy">
                    <span t-esc="pagerText"/>
                    <div class="ls-pager-nav">
                        <button t-on-click="prevPage" t-att-disabled="state.offset === 0">‹</button>
                        <button t-on-click="nextPage" t-att-disabled="state.offset + state.limit >= state.totalCount">›</button>
                    </div>
                </div>

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

        <!-- Multi-edit banner -->
        <t t-if="multiEditActive">
            <div class="ls-multi-edit-banner">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <span>Multi-Edit: <b t-esc="state.selectedIds.length"/> records selected — changes will apply to all</span>
                <button class="ls-btn ls-btn-sm" t-on-click="clearSelection">Cancel</button>
            </div>
        </t>
    </div>

    <div class="ls-list-content-area">
        <!-- SearchPanel Sidebar (optional left sidebar) -->
        <t t-if="searchPanelSections.length > 0 and state.showSearchPanel !== 'closed'">
            <div class="ls-search-panel-sidebar">
                <t t-foreach="searchPanelSections" t-as="section" t-key="section.field">
                    <div class="ls-sp-section">
                        <div class="ls-sp-section-header">
                            <span t-esc="section.label"/>
                        </div>
                        <!-- Category type (radio - Many2one) -->
                        <t t-if="section.select === 'one' or section.type === 'many2one'">
                            <div t-att-class="'ls-sp-item' + (!state.searchPanelValues[section.field] ? ' active' : '')"
                                 t-on-click="() => this.setSearchPanelCategory(section.field, null)">
                                <span class="ls-sp-item-label">All</span>
                                <span class="ls-sp-item-count" t-if="section._totalCount" t-esc="section._totalCount"/>
                            </div>
                            <t t-foreach="section._values || []" t-as="val" t-key="val.id">
                                <div t-att-class="'ls-sp-item' + (state.searchPanelValues[section.field] == val.id ? ' active' : '')"
                                     t-on-click="() => this.setSearchPanelCategory(section.field, val.id)">
                                    <span class="ls-sp-item-label" t-esc="val.name"/>
                                    <span class="ls-sp-item-count" t-if="val.__count !== undefined" t-esc="val.__count"/>
                                </div>
                            </t>
                        </t>
                        <!-- Filter type (checkbox - Many2many) -->
                        <t t-if="section.select === 'multi' or section.type === 'many2many' or section.type === 'selection'">
                            <t t-foreach="section._values || []" t-as="val" t-key="val.id">
                                <label class="ls-sp-filter-item">
                                    <input type="checkbox"
                                           t-att-checked="(state.searchPanelFilters[section.field] || []).includes(val.id)"
                                           t-on-change="() => this.toggleSearchPanelFilter(section.field, val.id)"/>
                                    <span t-esc="val.name"/>
                                    <span class="ls-sp-item-count" t-if="val.__count !== undefined" t-esc="val.__count"/>
                                </label>
                            </t>
                        </t>
                    </div>
                </t>
            </div>
        </t>

        <div class="ls-list-main">
        <div class="ls-list-wrapper" t-ref="listWrapper">
        <t t-if="state.loading">
            <div class="ls-loading"><div class="ls-spinner"/> Loading...</div>
        </t>
        <t t-elif="state.records.length === 0 and !state.groupBy and !state.editingNew">
            <div class="ls-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                <div class="ls-empty-title">No records found</div>
                <div class="ls-empty-sub">Try adjusting your search or filters</div>
            </div>
        </t>
        <t t-else="">
            <table class="ls-list-table">
                <thead>
                    <tr>
                        <th class="col-checkbox"><div class="ls-checkbox" t-att-class="{'checked': allSelected}" t-on-click="toggleSelectAll"/></th>
                        <t t-foreach="visibleColumns" t-as="col" t-key="col.name">
                            <th t-att-class="col.sortable ? 'sortable' : ''"
                                t-att-style="(state.colWidths and state.colWidths[col.name] ? 'width:' + state.colWidths[col.name] + 'px;' : (col.width ? 'width:' + col.width + ';' : '')) + 'position:relative;'"
                                t-on-click="() => col.sortable ? this.setOrder(col.name) : null">
                                <span t-esc="col.string"/>
                                <span class="sort-icon" t-if="state.orderBy.startsWith(col.name)" t-esc="state.orderBy.endsWith('asc') ? '▲' : '▼'"/>
                                <div class="ls-resize-handle" t-on-click.stop="" t-on-mousedown.stop="(ev) => this.onResizeStart(ev, col.name)"></div>
                            </th>
                        </t>
                        <th class="col-optional" t-if="optionalColumns.length > 0" style="width:40px; text-align:center; padding: 0;">
                            <div class="ls-optional-toggle" style="position:relative; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
                                <button style="background:none; border:none; cursor:pointer; color:inherit; display:flex; align-items:center; justify-content:center; padding: 4px;" t-on-click.stop="toggleOptionalMenu" title="Optional Columns">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 3v18M3 12h18"/>
                                    </svg>
                                </button>
                                <div class="ls-optional-dropdown" t-if="state.showOptionalMenu" style="right: 0; left: auto; top: 100%; text-align: left; font-weight: normal; color: var(--ls-text);">
                                    <div class="ls-optional-title">Optional Columns</div>
                                    <t t-foreach="optionalColumns" t-as="oc" t-key="oc.name">
                                        <label class="ls-optional-item">
                                            <input type="checkbox" t-att-checked="isColumnVisible(oc.name)"
                                                   t-on-change="() => this.toggleColumn(oc.name)"/>
                                            <span t-esc="oc.string"/>
                                        </label>
                                    </t>
                                </div>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Multi-edit row (shown at top when multi-editing) -->
                    <t t-if="state.editingId === '__multi__'">
                        <tr class="ls-inline-edit-row ls-multi-edit-row">
                            <td><div class="ls-checkbox checked"/></td>
                            <t t-foreach="visibleColumns" t-as="col" t-key="'multi_' + col.name">
                                <td t-out="renderInlineEditCell(col, state.editingValues)"/>
                            </t>
                            <td t-if="optionalColumns.length > 0"></td>
                        </tr>
                    </t>

                    <!-- Inline new row at TOP -->
                    <t t-if="state.editingNew and listEditablePosition === 'top'">
                        <tr class="ls-inline-edit-row ls-new-row">
                            <td><div class="ls-checkbox"/></td>
                            <t t-foreach="visibleColumns" t-as="col" t-key="'new_' + col.name">
                                <td t-out="renderInlineEditCell(col, state.editingNewValues)"/>
                            </t>
                            <td t-if="optionalColumns.length > 0"></td>
                        </tr>
                    </t>

                    <!-- Multi-level Group-by nested tree mode -->
                    <t t-if="state.groupBy and state.groupNodes.length > 0">
                        <t t-foreach="flatGroupNodes" t-as="node" t-key="node.key">
                            <!-- Group header row -->
                            <tr t-att-class="'ls-group-header ls-group-depth-' + node.depth"
                                t-on-click="() => this.toggleGroup(node.key)">
                                <td/>
                                <td t-att-colspan="visibleColumns.length + (optionalColumns.length > 0 ? 1 : 0)">
                                    <div class="ls-group-header-content" t-att-style="'padding-left:' + (node.depth * 20) + 'px'">
                                        <span t-att-class="'ls-group-toggle' + (node.expanded ? '' : ' collapsed')">
                                            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/></svg>
                                        </span>
                                        <span class="ls-group-name" t-esc="node.group.name"/>
                                        <span class="ls-group-badge" t-esc="node.group.__count"/>
                                        <!-- Aggregation measures -->
                                        <t t-if="node.group.__aggregates and Object.keys(node.group.__aggregates).length > 0">
                                            <span class="ls-group-aggregates">
                                                <t t-foreach="Object.entries(node.group.__aggregates)" t-as="agg" t-key="agg[0]">
                                                    <span class="ls-group-agg-item">
                                                        <span class="ls-group-agg-label" t-esc="getAggregateLabel(agg[0]) + ': '"/>
                                                        <span class="ls-group-agg-value" t-esc="formatGroupAggregate(agg[0], agg[1])"/>
                                                    </span>
                                                </t>
                                            </span>
                                        </t>
                                    </div>
                                </td>
                            </tr>
                            <!-- Leaf records (only when deepest level expanded) -->
                            <t t-if="node.expanded and isLeafGroup(node.key)">
                                <t t-foreach="getGroupRecords(node.key)" t-as="rec" t-key="rec.id">
                                    <tr t-att-class="getRowClasses(rec)"
                                        t-on-click="() => this.onRowClick(rec)" style="cursor:pointer;">
                                        <td>
                                            <div class="ls-group-record-indent" t-att-style="'padding-left:' + ((node.depth + 1) * 20) + 'px'">
                                                <div t-att-class="'ls-checkbox' + (isSelected(rec.id) ? ' checked' : '')" t-on-click.stop="() => this.toggleSelect(rec.id)"/>
                                            </div>
                                        </td>
                                        <t t-foreach="visibleColumns" t-as="col" t-key="col.name + '_' + rec.id">
                                            <td t-out="renderCellContent(rec, col)"/>
                                        </t>
                                        <td t-if="optionalColumns.length > 0"></td>
                                    </tr>
                                </t>
                            </t>
                        </t>
                    </t>

                    <!-- Normal (non-grouped) mode -->
                    <t t-else="">
                        <t t-foreach="state.records" t-as="rec" t-key="rec.id">
                            <tr t-att-class="getRowClasses(rec)"
                                t-on-click="() => this.onRowClick(rec)" style="cursor:pointer;"
                                t-on-dblclick="() => this.onRowDblClick(rec)">
                                <td><div t-att-class="'ls-checkbox' + (isSelected(rec.id) ? ' checked' : '')" t-on-click.stop="() => this.toggleSelect(rec.id)"/></td>
                                <t t-foreach="visibleColumns" t-as="col" t-key="col.name + '_' + rec.id">
                                    <t t-if="state.editingId === rec.id">
                                        <td t-out="renderInlineEditCell(col, state.editingValues, rec.id)"/>
                                    </t>
                                    <t t-else="">
                                        <td t-out="renderCellContent(rec, col)"/>
                                    </t>
                                </t>
                                <td t-if="optionalColumns.length > 0"></td>
                            </tr>
                        </t>
                    </t>

                    <!-- Inline new row at BOTTOM -->
                    <t t-if="state.editingNew and listEditablePosition === 'bottom'">
                        <tr class="ls-inline-edit-row ls-new-row">
                            <td><div class="ls-checkbox"/></td>
                            <t t-foreach="visibleColumns" t-as="col" t-key="'new_' + col.name">
                                <td t-out="renderInlineEditCell(col, state.editingNewValues)"/>
                            </t>
                            <td t-if="optionalColumns.length > 0"></td>
                        </tr>
                    </t>
                </tbody>
            </table>
        </t>
    </div>

    <!-- Footer with aggregation -->
    <div class="ls-footer">
        <span t-esc="state.totalCount + ' record(s)'"/>
        <div class="ls-footer-agg" t-if="Object.keys(state.aggregates).length > 0">
            <t t-foreach="aggregateColumns" t-as="ac" t-key="ac.name">
                <div class="ls-footer-agg-item">
                    <span class="ls-footer-agg-label" t-esc="ac.aggregation_label + ':'"/>
                    <span class="ls-footer-agg-value" t-esc="formatAggregate(ac)"/>
                </div>
            </t>
        </div>
    </div>
    </div><!-- /ls-list-main (right panel) -->
    </div><!-- /ls-list-content-area -->

    <!-- Inline edit save bar -->
    <t t-if="state.editingNew or state.editingId">
        <div class="ls-inline-edit-bar">
            <span t-if="state.editingNew">Adding new record...</span>
            <span t-elif="state.editingId">Editing record...</span>
            <button class="ls-btn ls-btn-primary ls-btn-sm" t-on-click="saveInlineEdit">Save</button>
            <button class="ls-btn ls-btn-sm" t-on-click="cancelInlineEdit">Discard</button>
        </div>
    </t>

    <!-- Selection bar with header actions -->
    <t t-if="state.selectedIds.length > 0 and !state.editingNew and !state.editingId">
        <div class="ls-selection-bar">
            <span t-esc="state.selectedIds.length + ' selected'"/>
            <t t-foreach="headerButtons" t-as="hb" t-key="'sel_' + hb.name">
                <button class="ls-btn" t-on-click="() => this.onHeaderButton(hb)">
                    <t t-if="hb.icon" t-out="window.lucideIcon ? window.lucideIcon(hb.icon, 14) : ''"/>
                    <span t-esc="hb.string"/>
                </button>
            </t>
            <button class="ls-btn" t-on-click="deleteSelected">Delete</button>
            <button class="ls-btn" t-on-click="clearSelection">Deselect</button>
        </div>
    </t>
</div>
`})(),(function(){let{xml:e}=owl;window.TEMPLATES.AppSwitcher=e`
<div class="ls-app-switcher">
    <div class="ls-app-switcher-header">
        <h2>Applications</h2>
    </div>
    <div class="ls-app-grid">
        <t t-foreach="props.apps" t-as="app" t-key="app.id">
            <div class="ls-app-card" t-on-click="() => this.onAppClick(app)">
                <div class="ls-app-card-icon" t-att-style="'color:' + (app.web_icon_color || '#7C3AED')">
                    <t t-out="window.lucideIcon(app.web_icon || app.icon || 'box', 34)"/>
                </div>
                <div class="ls-app-card-name" t-esc="app.name"/>
            </div>
        </t>
    </div>
</div>
`,window.TEMPLATES.NavBar=e`
<nav t-att-class="'ls-navbar' + (props.isHome ? ' ls-navbar-transparent' : '')">
    <button class="ls-hamburger" t-on-click="() => window.LarasoftLayout.toggleMobileMenu()">
        <t t-out="window.lucideIcon('menu', 20)"/>
    </button>
    <div class="ls-navbar-brand" t-on-click="props.onHome" style="cursor:pointer;">
        <t t-out="window.lucideIcon('box', 22)"/>
        Larasoft
    </div>
    <div class="ls-navbar-menu">
        <t t-foreach="props.apps" t-as="app" t-key="app.id">
            <a href="#" t-att-class="'ls-nav-app' + (props.activeAppId === app.id ? ' active' : '')"
               t-on-click.prevent="() => this.onAppClick(app)"
               t-esc="app.name"/>
        </t>
    </div>
    <div class="ls-navbar-right">
        <button class="ls-theme-toggle" t-on-click="toggleTheme" title="Toggle Theme">
            <t t-out="window.lucideIcon(effectiveTheme === 'dark' ? 'sun' : 'moon', 16)"/>
        </button>
        <button class="ls-theme-toggle" t-on-click="toggleSettings" title="Settings">
            <t t-out="window.lucideIcon('settings', 16)"/>
        </button>
        <t t-set="u" t-value="window.LarasoftUser || {}"/>
        <div class="ls-user-chip" t-if="u.uid" title="Logged in as" style="display:flex;align-items:center;gap:8px;padding:4px 10px 4px 4px;border-radius:24px;background:rgba(255,255,255,0.08);">
            <a href="/profile" title="My Profile" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:inherit;flex:1;min-width:0;">
                <div class="ls-avatar" style="width:28px;height:28px;display:grid;place-items:center;background:rgba(255,255,255,0.15);border-radius:50%;font-weight:600;font-size:12px;flex-shrink:0;">
                    <t t-esc="(u.name || u.login || '?').charAt(0).toUpperCase()"/>
                </div>
                <div style="display:flex;flex-direction:column;line-height:1.15;min-width:0;">
                    <span style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;" t-esc="u.name || u.login"/>
                    <span style="font-size:10px;opacity:0.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;" t-esc="u.company || ''"/>
                </div>
            </a>
            <a href="/logout" title="Logout" style="margin-left:4px;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.06);text-decoration:none;color:inherit;flex-shrink:0;" t-out="window.lucideIcon('log-out', 14)"/>
        </div>
    </div>
</nav>
`,window.TEMPLATES.SubMenu=e`
<div class="ls-submenu-bar" t-if="props.items and props.items.length">
    <t t-foreach="props.items" t-as="item" t-key="item.id">
        <div t-att-class="'ls-submenu-item' + (props.activeMenuId === item.id ? ' active' : '')"
             style="position:relative;">
            <t t-if="item.children and item.children.length">
                <span class="ls-submenu-label" t-on-click="(ev) => this.toggleDropdown(item.id, ev)" style="cursor:pointer;">
                    <t t-out="window.lucideIcon(item.icon || 'chevron-right', 14)"/>
                    <span t-esc="item.name"/>
                    <span class="ls-submenu-caret">▾</span>
                </span>
                <div class="ls-submenu-dropdown" t-if="state.openDropdown === item.id">
                    <t t-foreach="item.children" t-as="child" t-key="child.id">
                        <div t-att-class="'ls-submenu-dropdown-item' + (props.activeMenuId === child.id ? ' active' : '')"
                             t-on-click="() => this.onMenuClick(child)">
                            <t t-out="window.lucideIcon(child.icon || 'chevron-right', 14)"/>
                            <span t-esc="child.name"/>
                        </div>
                    </t>
                </div>
            </t>
            <t t-else="">
                <span class="ls-submenu-label" t-on-click="() => this.onMenuClick(item)" style="cursor:pointer;">
                    <t t-out="window.lucideIcon(item.icon || 'chevron-right', 14)"/>
                    <span t-esc="item.name"/>
                </span>
            </t>
        </div>
    </t>
</div>
`,window.TEMPLATES.Breadcrumb=e`
<div class="ls-breadcrumb" t-if="props.items and props.items.length">
    <t t-foreach="props.items" t-as="bc" t-key="bc.id">
        <t t-if="!bc_last">
            <span class="ls-breadcrumb-item ls-breadcrumb-link" t-on-click="() => this.onBcClick(bc)" t-esc="bc.name"/>
            <span class="ls-breadcrumb-sep">/</span>
        </t>
        <t t-else="">
            <span class="ls-breadcrumb-item" t-esc="bc.name"/>
        </t>
    </t>
</div>
`,window.TEMPLATES.Root=e`
<div class="ls-webclient">
    <t t-if="!state.clientError">
        <NavBar apps="state.apps" activeAppId="state.activeAppId"
                onAppClick.bind="onAppClick" onHome.bind="goHome"
                isHome="state.currentView === 'home'"/>

    <t t-if="state.currentView === 'home'">
        <AppSwitcher apps="state.apps" onAppClick.bind="onAppClick"/>
    </t>

    <t t-if="state.currentView !== 'home'">
        <SubMenu items="currentSubMenus" activeMenuId="state.activeMenuId"
                 onMenuClick.bind="onMenuClick"/>
    </t>

    <t t-if="state.currentView === 'action'">
        <div class="ls-action-manager">
            <t t-if="state.actionView === 'list'">
                <ListView
                    t-key="state.currentModel + '_' + (state.currentAction ? state.currentAction.id : '')"
                    onOpenRecord.bind="openRecord"
                    model="state.currentModel"
                    stages="state.stages"
                    projects="state.projects"
                    tags="state.tags"
                    searchViewDef="state.searchViewDef"
                    listViewDef="state.listViewDef"
                    actionTitle="state.actionTitle"
                    actionDomain="state.actionDomain"
                    actionContext="state.actionContext"
                    viewModes="availableViewModes"
                    activeViewType="state.actionView"
                    onSwitchView.bind="switchView"/>
            </t>
            <t t-if="state.actionView === 'form'">
                <FormView
                    t-key="state.currentModel + '_' + state.formRecordId"
                    recordId="state.formRecordId"
                    recordIndex="state.formIndex"
                    totalRecords="state.formTotal"
                    model="state.currentModel"
                    stages="state.stages"
                    projects="state.projects"
                    tags="state.tags"
                    formViewDef="state.formViewDef"
                    actionTitle="state.actionTitle"
                    actionContext="state.actionContext"
                    onBack.bind="backToList"
                    onNavigate.bind="navigateRecord"
                    onSaved.bind="recordSaved"/>
            </t>
            <t t-if="state.actionView === 'kanban'">
                <KanbanView
                    t-key="'kanban_' + state.currentModel + '_' + (state.currentAction ? state.currentAction.id : '')"
                    model="state.currentModel"
                    kanbanViewDef="state.kanbanViewDef"
                    actionTitle="state.actionTitle"
                    actionDomain="state.actionDomain"
                    actionContext="state.actionContext"
                    onOpenRecord.bind="openRecord"
                    viewModes="availableViewModes"
                    activeViewType="state.actionView"
                    onSwitchView.bind="switchView"/>
            </t>
            <t t-if="state.actionView === 'calendar'">
                <CalendarView
                    t-key="'cal_' + state.currentModel + '_' + (state.currentAction ? state.currentAction.id : '')"
                    model="state.currentModel"
                    calendarViewDef="state.calendarViewDef"
                    actionTitle="state.actionTitle"
                    actionDomain="state.actionDomain"
                    actionContext="state.actionContext"
                    onOpenRecord.bind="openRecord"
                    viewModes="availableViewModes"
                    activeViewType="state.actionView"
                    onSwitchView.bind="switchView"/>
            </t>
            <t t-if="state.actionView === 'graph'">
                <GraphView
                    t-key="'graph_' + state.currentModel + '_' + (state.currentAction ? state.currentAction.id : '')"
                    model="state.currentModel"
                    graphViewDef="state.graphViewDef"
                    actionTitle="state.actionTitle"
                    actionDomain="state.actionDomain"
                    actionContext="state.actionContext"
                    viewModes="availableViewModes"
                    activeViewType="state.actionView"
                    onSwitchView.bind="switchView"/>
            </t>
            <t t-if="state.actionView === 'pivot'">
                <PivotView
                    t-key="'pivot_' + state.currentModel + '_' + (state.currentAction ? state.currentAction.id : '')"
                    model="state.currentModel"
                    pivotViewDef="state.pivotViewDef"
                    actionTitle="state.actionTitle"
                    actionDomain="state.actionDomain"
                    actionContext="state.actionContext"
                    viewModes="availableViewModes"
                    activeViewType="state.actionView"
                    onSwitchView.bind="switchView"/>
            </t>
            <t t-if="state.actionView === 'spreadsheet'">
                <SpreadsheetView
                    t-key="'spreadsheet_' + state.currentModel + '_' + (state.currentAction ? state.currentAction.id : '')"
                    model="state.currentModel"
                    spreadsheetViewDef="state.spreadsheetViewDef"
                    actionTitle="state.actionTitle"
                    actionDomain="state.actionDomain"
                    actionContext="state.actionContext"
                    viewModes="availableViewModes"
                    activeViewType="state.actionView"
                    onSwitchView.bind="switchView"/>
            </t>
        </div>
    </t>

    <!-- Dynamic Custom SPA Pages -->
    <t t-if="isCustomView">
        <t t-component="customComponent"/>
    </t>
    
    <!-- Mobile Overlay Menu -->
    <div t-att-class="'ls-mobile-menu-overlay' + (state.layout.mobileMenuOpen ? ' open' : '')" t-on-click="() => window.LarasoftLayout.closeMobileMenu()">
        <div class="ls-mobile-menu-panel" t-on-click.stop="() => {}">
            <div class="ls-mobile-menu-header">
                <h3>Menu</h3>
                <button class="ls-mobile-menu-close" t-on-click="() => window.LarasoftLayout.closeMobileMenu()">
                    <t t-out="window.lucideIcon('x', 18)"/>
                </button>
            </div>
            <div class="ls-mobile-menu-apps">
                <t t-foreach="state.apps" t-as="app" t-key="app.id">
                    <div t-att-class="'ls-mobile-menu-app' + (state.activeAppId === app.id ? ' active' : '')"
                         t-on-click="() => { this.onAppClick(app); window.LarasoftLayout.closeMobileMenu(); }">
                        <div class="ls-mobile-menu-app-icon" t-att-style="'background:' + (app.web_icon_color || '#7C3AED')">
                            <t t-out="window.lucideIcon(app.web_icon || app.icon || 'box', 18)"/>
                        </div>
                        <t t-esc="app.name"/>
                    </div>
                </t>
            </div>
        </div>
    </div>

    <!-- Settings Panel -->
    <div t-att-class="'ls-settings-panel' + (state.layout.settingsOpen ? ' open' : '')">
        <div class="ls-settings-header">
            <h3>Settings</h3>
            <button class="ls-mobile-menu-close" t-on-click="() => this.closeSettings()">
                <t t-out="window.lucideIcon('x', 16)"/>
            </button>
        </div>

        <div class="ls-settings-section">
            <div class="ls-settings-section-title">Theme</div>
            <div class="ls-theme-cards">
                <div t-att-class="'ls-theme-card' + (state.layout.theme === 'light' ? ' active' : '')" t-on-click="() => this.setTheme('light')">
                    <div class="ls-theme-card-preview light"></div>
                    Light
                </div>
                <div t-att-class="'ls-theme-card' + (state.layout.theme === 'dark' ? ' active' : '')" t-on-click="() => this.setTheme('dark')">
                    <div class="ls-theme-card-preview dark"></div>
                    Dark
                </div>
                <div t-att-class="'ls-theme-card' + (state.layout.theme === 'auto' ? ' active' : '')" t-on-click="() => this.setTheme('auto')">
                    <div class="ls-theme-card-preview auto"></div>
                    Auto
                </div>
            </div>
        </div>

        <div class="ls-settings-section">
            <div class="ls-settings-section-title">Brand Color</div>
            <div class="ls-brand-colors">
                <t t-foreach="state.layout.brandColors" t-as="bc" t-key="bc.id">
                    <div t-att-class="'ls-brand-swatch' + (state.layout.brandColor === bc.id ? ' active' : '')"
                         t-att-style="'background:' + bc.color" t-att-title="bc.label"
                         t-on-click="() => window.LarasoftLayout.setBrandColor(bc.id)"></div>
                </t>
            </div>
        </div>

        <div class="ls-settings-section">
            <div class="ls-settings-section-title">Density</div>
            <div class="ls-density-options">
                <div t-att-class="'ls-density-btn' + (state.layout.density === 'compact' ? ' active' : '')" t-on-click="() => window.LarasoftLayout.setDensity('compact')">Compact</div>
                <div t-att-class="'ls-density-btn' + (state.layout.density === 'default' ? ' active' : '')" t-on-click="() => window.LarasoftLayout.setDensity('default')">Default</div>
                <div t-att-class="'ls-density-btn' + (state.layout.density === 'comfortable' ? ' active' : '')" t-on-click="() => window.LarasoftLayout.setDensity('comfortable')">Comfort</div>
            </div>
        </div>

        <div class="ls-settings-section">
            <div class="ls-settings-section-title">Device</div>
            <div style="font-size:12px; color:var(--ls-text-secondary); display:flex; gap:6px; align-items:center;">
                <t t-out="window.lucideIcon(state.layout.isMobile ? 'smartphone' : (state.layout.isTablet ? 'tablet' : 'monitor'), 16)"/>
                <t t-esc="state.layout.device"/>
                <span style="opacity:0.5;">(<t t-esc="window.innerWidth"/>px)</span>
            </div>
        </div>
    </div>

    </t>

    <!-- Global Error Dialog -->
    <t t-if="state.clientError">
        <div class="ls-modal-backdrop" style="display:flex; justify-content:center; align-items:center; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); z-index:9999;">
            <div class="ls-modal-dialog" style="background:var(--ls-bg); border-radius:8px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); max-width: 600px; width: 100%; animation: slideDown 0.2s ease-out; display:flex; flex-direction:column; overflow:hidden;">
                <div class="ls-modal-header" style="background: #fee2e2; color: #991b1b; border-bottom: 1px solid #f87171; padding: 16px; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="display:flex; align-items:center; gap:8px; margin:0; font-size:1.125rem;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        <t t-if="state.clientError.serverError">Server Error</t>
                        <t t-else="">Larasoft Client Error</t>
                    </h3>
                    <button class="ls-modal-close" t-on-click="clearError" style="color: #991b1b; background:none; border:none; font-size:1.25rem; cursor:pointer; padding:0; line-height:1;">✕</button>
                </div>
                <div class="ls-modal-body" style="padding: 16px; max-height: 70vh; overflow-y: auto;">
                    <p style="font-weight:600; margin:0 0 8px 0;">
                        <t t-if="state.clientError.serverError">The server encountered an internal error and was unable to complete your request.</t>
                        <t t-else="">An unexpected error occurred in the frontend interface.</t>
                    </p>
                    <p t-if="state.clientError.message" style="color:#b91c1c; font-family:monospace; margin:0 0 12px 0; font-size:13px; word-break:break-all;" t-esc="state.clientError.message"></p>

                    <!-- Frontend Stack Trace -->
                    <details style="background:var(--ls-bg-muted); border-radius:6px; border:1px solid var(--ls-border); padding:12px;" t-if="!state.clientError.serverError and (state.clientError.stack || state.clientError.cause)">
                        <summary style="font-size:12px; font-weight:600; cursor:pointer; color:var(--ls-text-secondary); user-select:none;">View Stack Trace</summary>
                        <pre style="margin:8px 0 0 0; font-size:11px; color:var(--ls-text); white-space:pre-wrap; word-break:break-all; max-height:250px; overflow-y:auto; font-family:monospace;" t-esc="state.clientError.stack + (state.clientError.cause ? '\n\nCaused by:\n' + (state.clientError.cause.stack || state.clientError.cause.message || state.clientError.cause) : '')"></pre>
                    </details>
                    
                    <!-- Backend Server Stack Trace -->
                    <details style="background:var(--ls-bg-muted); border-radius:6px; border:1px solid var(--ls-border); padding:12px;" t-if="state.clientError.serverError and state.clientError.serverError.trace">
                        <summary style="font-size:12px; font-weight:600; cursor:pointer; color:var(--ls-text-secondary); user-select:none;">View Server Traceback (<t t-esc="state.clientError.serverError.exception"/>)</summary>
                        <div style="margin-top:12px; font-family:monospace; font-size:11px; color:var(--ls-text); overflow-y:auto; max-height:400px; padding-right:8px;">
                            <div style="font-weight:bold; color:#b91c1c; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid var(--ls-border);">
                                <div>File: <t t-esc="state.clientError.serverError.file"/></div>
                                <div>Line: <t t-esc="state.clientError.serverError.line"/></div>
                            </div>
                            <t t-foreach="state.clientError.serverError.trace" t-as="tr" t-key="tr_index">
                                <div style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px dashed rgba(150,150,150,0.2);">
                                    <div style="margin-bottom:4px;">
                                        <span style="color:#0284c7; font-weight:bold;" t-if="tr.class" t-esc="tr.class + (tr.type || '::')"></span>
                                        <span style="color:#059669; font-weight:bold;" t-esc="tr.function + '()'"></span>
                                    </div>
                                    <div style="color:#6b7280; font-size:10px; margin-left:8px;" t-if="tr.file">
                                        ↳ <t t-esc="tr.file"/>:<t t-esc="tr.line"/>
                                    </div>
                                </div>
                            </t>
                        </div>
                    </details>
                </div>
                <div class="ls-modal-footer" style="padding: 12px 16px; background:var(--ls-bg-soft); border-top:1px solid var(--ls-border); display:flex; justify-content:flex-end; gap:8px;">
                    <button class="ls-btn" t-on-click="reloadPage" style="padding:8px 16px; background:var(--ls-bg); border:1px solid var(--ls-border); border-radius:6px; cursor:pointer; font-weight:500; color:var(--ls-text);">Reload Page</button>
                    <button class="ls-btn ls-btn-primary" t-on-click="clearError" style="padding:8px 16px; background:var(--ls-primary); color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:500;">Dismiss</button>
                </div>
            </div>
        </div>
    </t>
</div>
`})(),(function(){let e=window.LarasoftRPC;function t(e){return e==null?``:String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}class n{constructor({input:e,relation:t,fieldLabel:n,fieldName:r,relOptions:i,onSelect:a,onClear:o,options:s}){this.input=e,this.relation=t,this.fieldLabel=n||``,this.fieldName=r||``,this.relOptions=i||[],this.onSelect=a,this.onClear=o||(()=>{}),this.opts=s||{},this.noCreate=this.opts.no_create||!1,this.noQuickCreate=this.opts.no_quick_create||!1,this.noCreateEdit=this.opts.no_create_edit||!1,this.domain=this.opts.domain||null,this._dropdown=null,this._debounce=null,this._activeIndex=-1,this._items=[],this._onInput=this._handleInput.bind(this),this._onFocus=this._handleFocus.bind(this),this._onBlur=this._handleBlur.bind(this),this._onKeydown=this._handleKeydown.bind(this),this._onDocClick=this._handleDocClick.bind(this),e.addEventListener(`input`,this._onInput),e.addEventListener(`focus`,this._onFocus),e.addEventListener(`blur`,this._onBlur),e.addEventListener(`keydown`,this._onKeydown)}destroy(){this.input.removeEventListener(`input`,this._onInput),this.input.removeEventListener(`focus`,this._onFocus),this.input.removeEventListener(`blur`,this._onBlur),this.input.removeEventListener(`keydown`,this._onKeydown),document.removeEventListener(`click`,this._onDocClick,!0),this._closeDropdown()}setRelOptions(e){this.relOptions=e||[]}_handleFocus(){this.input.select(),this._showDropdown(``)}_handleBlur(){setTimeout(()=>{this._dropdown&&(!this.input.value&&this.input.dataset.curId&&(this.input.dataset.curId=``,this.onClear()),this._closeDropdown())},220)}_handleDocClick(e){this._dropdown&&!this._dropdown.contains(e.target)&&e.target!==this.input&&this._closeDropdown()}_handleInput(){clearTimeout(this._debounce),this._debounce=setTimeout(()=>{let e=this.input.value;this._lastQuery===e&&this._dropdown||(this._lastQuery=e,this._showDropdown(e))},180)}_handleKeydown(e){if(e.key===`Enter`&&e.preventDefault(),!this._dropdown){e.key===`ArrowDown`&&(e.preventDefault(),e.stopPropagation(),this._showDropdown(this.input.value));return}let t=this._dropdown.querySelectorAll(`.ls-m2o-dd-item, .ls-m2o-dd-search-more`);if(e.key===`ArrowDown`)e.preventDefault(),this._activeIndex=Math.min(this._activeIndex+1,t.length-1),this._highlightItem(t);else if(e.key===`ArrowUp`)e.preventDefault(),this._activeIndex=Math.max(this._activeIndex-1,0),this._highlightItem(t);else if(e.key===`Enter`){if(this._activeIndex>=0&&t[this._activeIndex]){let e=new MouseEvent(`mousedown`,{bubbles:!0,cancelable:!0});t[this._activeIndex].dispatchEvent(e)}}else if(e.key===`Escape`)this._closeDropdown(),this.input.blur();else if(e.key===`Tab`){if(t.length===1){let e=new MouseEvent(`mousedown`,{bubbles:!0,cancelable:!0});t[0].dispatchEvent(e)}this._closeDropdown()}}_highlightItem(e){e.forEach((e,t)=>{e.classList.toggle(`highlighted`,t===this._activeIndex),t===this._activeIndex&&e.scrollIntoView({block:`nearest`})})}async _showDropdown(n){this._closeDropdown(),this._activeIndex=-1;let r;if(n&&n.length>0)try{r=await e.nameSearch(this.relation,n,8)}catch{r=[]}else r=this.relOptions.slice(0,8);let i=document.createElement(`div`);i.className=`ls-m2o-dropdown`,r.forEach((e,t)=>{let r=document.createElement(`div`);if(r.className=`ls-m2o-dd-item`,n){let t=RegExp(`(${n.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)})`,`gi`);r.innerHTML=e.name.replace(t,`<mark style="background:#fef3c7;padding:0">$1</mark>`)}else r.textContent=e.name;r.addEventListener(`mousedown`,t=>{t.preventDefault(),this._selectOption(e)}),i.appendChild(r)});let a=!this.noCreate||!0;if(r.length>0&&a){let e=document.createElement(`div`);e.className=`ls-m2o-dd-separator`,i.appendChild(e)}if(n&&n.length>0&&!this.noCreate&&!this.noQuickCreate){let e=document.createElement(`div`);e.className=`ls-m2o-dd-item ls-m2o-dd-action`,e.innerHTML=`<span class="ls-m2o-dd-action-icon">+</span> Create "<em>${t(n)}</em>"`,e.addEventListener(`mousedown`,e=>{e.preventDefault(),this._quickCreate(n)}),i.appendChild(e)}if(!this.noCreate&&!this.noCreateEdit){let e=document.createElement(`div`);e.className=`ls-m2o-dd-item ls-m2o-dd-action`,e.innerHTML=`<span class="ls-m2o-dd-action-icon">⊕</span> Create and edit...`,e.addEventListener(`mousedown`,e=>{e.preventDefault(),this._createAndEdit(n)}),i.appendChild(e)}let o=document.createElement(`div`);o.className=`ls-m2o-dd-search-more`,o.innerHTML=`<span>🔍</span> Search More...`,o.addEventListener(`mousedown`,e=>{e.preventDefault(),this._closeDropdown(),this._openSearchDialog(n)}),i.appendChild(o);let s=this.input.getBoundingClientRect();i.style.position=`fixed`,i.style.top=s.bottom+2+`px`,i.style.left=s.left+`px`,i.style.width=Math.max(s.width+40,260)+`px`,i.style.zIndex=`9999`,document.body.appendChild(i),this._dropdown=i,document.addEventListener(`click`,this._onDocClick,!0);let c=i.querySelectorAll(`.ls-m2o-dd-item, .ls-m2o-dd-search-more`);c.length>0&&(this._activeIndex=0,this._highlightItem(c))}_closeDropdown(){this._dropdown&&=(this._dropdown.remove(),null),document.removeEventListener(`click`,this._onDocClick,!0)}_selectOption(e){this._closeDropdown(),this.input.value=e.name,this.input.dataset.curId=e.id,this.onSelect(e)}async _quickCreate(t){this._closeDropdown();try{let n=await e.quickCreate(this.relation,t);if(n&&n.id){let e={id:n.id,name:n.name||t};this.input.value=e.name,this.input.dataset.curId=e.id,this.onSelect(e),this.relOptions.unshift(e)}}catch(e){console.warn(`Quick create failed:`,e),this._createAndEdit(t)}}_createAndEdit(e){this._closeDropdown(),new r({relation:this.relation,fieldLabel:this.fieldLabel,initialName:e||``,onCreated:e=>{this.input.value=e.name,this.input.dataset.curId=e.id,this.onSelect(e),this.relOptions.unshift(e)}}).open()}_openSearchDialog(e){new i({relation:this.relation,fieldLabel:this.fieldLabel,initialQuery:e||``,noCreate:this.noCreate,onSelect:e=>{this.input.value=e.name,this.input.dataset.curId=e.id,this.onSelect(e)}}).open()}}class r{constructor({relation:e,fieldLabel:t,initialName:n,onCreated:r}){this.relation=e,this.fieldLabel=t,this.initialName=n,this.onCreated=r,this.overlay=null,this.fieldDefs={},this.editableFields=[]}async open(){try{this.fieldDefs=await e.fieldsGet(this.relation)}catch{this.fieldDefs={}}this.editableFields=[];for(let[e,t]of Object.entries(this.fieldDefs))e!==`id`&&(t.readonly||[`one2many`,`many2many`,`binary`,`html`].includes(t.type)||t.store!==!1&&this.editableFields.push({name:e,...t}));this.editableFields.sort((e,t)=>e.name===`name`?-1:t.name===`name`?1:e.required&&!t.required?-1:!e.required&&t.required?1:0),this.editableFields=this.editableFields.slice(0,8),this.overlay=document.createElement(`div`),this.overlay.className=`ls-m2o-dialog-overlay`,this.overlay.addEventListener(`click`,e=>{e.target===this.overlay&&this.close()}),document.body.appendChild(this.overlay),this._render()}close(){this.overlay&&=(this.overlay.remove(),null)}_render(){let e=document.createElement(`div`);e.className=`ls-m2o-dialog ls-m2o-create-dialog`,e.style.maxWidth=`520px`;let n=``;for(let e of this.editableFields){let r=e.name===`name`?this.initialName:e.default||``,i=e.required?`<span style="color:#ef4444">*</span>`:``,a;e.type===`selection`&&e.selection?(a=`<select class="ls-field-input ls-create-field" data-fname="${e.name}">`,(Array.isArray(e.selection)?e.selection:Object.entries(e.selection)).forEach(e=>{let n=Array.isArray(e)?e[0]:e.value??e[0],i=Array.isArray(e)?e[1]:e.label??e[1];a+=`<option value="${t(n)}" ${n==r?`selected`:``}>${t(i)}</option>`}),a+=`</select>`):a=e.type===`boolean`?`<input type="checkbox" class="ls-create-field" data-fname="${e.name}" ${r?`checked`:``}/>`:e.type===`integer`?`<input type="number" step="1" class="ls-field-input ls-create-field" data-fname="${e.name}" value="${r||0}"/>`:e.type===`float`||e.type===`monetary`?`<input type="number" step="0.01" class="ls-field-input ls-create-field" data-fname="${e.name}" value="${r||0}"/>`:e.type===`date`?`<input type="date" class="ls-field-input ls-create-field" data-fname="${e.name}" value="${r||``}"/>`:e.type===`text`?`<textarea class="ls-field-input ls-create-field" data-fname="${e.name}" rows="2">${t(r)}</textarea>`:e.type===`many2one`?`<input type="text" class="ls-field-input ls-create-field" data-fname="${e.name}" data-type="many2one" data-relation="${t(e.relation||``)}" value="" placeholder="Search..."/>`:`<input type="text" class="ls-field-input ls-create-field" data-fname="${e.name}" value="${t(r)}" placeholder="${t(e.string||``)}..."/>`,n+=`<div class="ls-create-row">
                <label class="ls-create-label">${t(e.string||e.name)} ${i}</label>
                <div class="ls-create-value">${a}</div>
            </div>`}e.innerHTML=`
            <div class="ls-m2o-dialog-header">
                <h3>Create: ${t(this.fieldLabel)}</h3>
                <button class="ls-m2o-dialog-close" title="Close">✕</button>
            </div>
            <div class="ls-m2o-create-body">${n}</div>
            <div class="ls-m2o-dialog-footer" style="gap:8px;justify-content:flex-end;">
                <button class="ls-m2o-dialog-btn-close">Discard</button>
                <button class="ls-m2o-create-save" style="background:var(--ls-primary,#714b67);color:#fff;border:none;padding:6px 18px;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer;">Save</button>
            </div>`,e.querySelector(`.ls-m2o-dialog-close`).addEventListener(`click`,()=>this.close()),e.querySelector(`.ls-m2o-dialog-btn-close`).addEventListener(`click`,()=>this.close()),e.querySelector(`.ls-m2o-create-save`).addEventListener(`click`,()=>this._save()),this.dialog=e,this.overlay.appendChild(e),setTimeout(()=>{let t=e.querySelector(`[data-fname="name"]`);t&&t.focus()},50)}async _save(){let t={};this.dialog.querySelectorAll(`.ls-create-field`).forEach(e=>{let n=e.dataset.fname;e.type===`checkbox`?t[n]=e.checked:e.type===`number`?t[n]=parseFloat(e.value)||0:t[n]=e.value});for(let e of this.editableFields)if(e.required&&!t[e.name]){let t=this.dialog.querySelector(`[data-fname="${e.name}"]`);t&&(t.style.borderColor=`#ef4444`,t.focus());return}try{let n=await e.create(this.relation,t);if(n&&n.id){let e=t.name||t.display_name||`#${n.id}`;this.onCreated({id:n.id,name:e}),this.close()}}catch(e){console.error(`Create failed:`,e),alert(`Failed to create record: `+(e.message||`Unknown error`))}}}class i{constructor({relation:e,fieldLabel:t,initialQuery:n,onSelect:r,noCreate:i}){this.relation=e,this.fieldLabel=t,this.initialQuery=n,this.onSelect=r,this.noCreate=i||!1,this.overlay=null,this.records=[],this.totalCount=0,this.offset=0,this.limit=80,this.query=n,this.fieldDefs={},this.displayFields=[]}async open(){try{this.fieldDefs=await e.fieldsGet(this.relation)}catch{this.fieldDefs={}}this.displayFields=this._getDisplayFields(),this.overlay=document.createElement(`div`),this.overlay.className=`ls-m2o-dialog-overlay`,this.overlay.addEventListener(`click`,e=>{e.target===this.overlay&&this.close()}),document.body.appendChild(this.overlay),this._render(),await this._loadRecords()}close(){this.overlay&&=(this.overlay.remove(),null)}_getDisplayFields(){let e=[],t=this.fieldDefs;for(let[n,r]of Object.entries(t))r.type===`one2many`||r.type===`many2many`||r.type===`binary`||r.type===`html`||n!==`id`&&e.push({name:n,label:r.string||n,type:r.type});return e.slice(0,6)}_render(){let e=document.createElement(`div`);e.className=`ls-m2o-dialog`,e.innerHTML=`
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
                ${this.noCreate?``:`<button class="ls-m2o-dialog-btn-create" style="margin-right:auto;padding:6px 14px;border:1px solid var(--ls-border);border-radius:4px;background:transparent;font-size:13px;cursor:pointer;font-family:var(--ls-font)">+ Create</button>`}
                <button class="ls-m2o-dialog-btn-close">Close</button>
            </div>
        `,e.querySelector(`.ls-m2o-dialog-close`).addEventListener(`click`,()=>this.close()),e.querySelector(`.ls-m2o-dialog-btn-close`).addEventListener(`click`,()=>this.close());let t=e.querySelector(`.ls-m2o-dialog-btn-create`);t&&t.addEventListener(`click`,()=>{this.close(),new r({relation:this.relation,fieldLabel:this.fieldLabel,initialName:this.query||``,onCreated:e=>{this.onSelect(e)}}).open()});let n=e.querySelector(`.ls-m2o-dialog-search-input`),i=null;n.addEventListener(`input`,()=>{clearTimeout(i),i=setTimeout(()=>{this.query=n.value,this.offset=0,this._loadRecords()},300)}),e.querySelector(`.ls-m2o-pager-prev`).addEventListener(`click`,()=>{this.offset>0&&(this.offset=Math.max(0,this.offset-this.limit),this._loadRecords())}),e.querySelector(`.ls-m2o-pager-next`).addEventListener(`click`,()=>{this.offset+this.limit<this.totalCount&&(this.offset+=this.limit,this._loadRecords())});let a=e.querySelector(`thead tr`);this.displayFields.forEach(e=>{let t=document.createElement(`th`);t.textContent=e.label,a.appendChild(t)}),this.dialog=e,this.overlay.appendChild(e),setTimeout(()=>n.focus(),50)}async _loadRecords(){let t=this.dialog.querySelector(`tbody`);t.innerHTML=`<tr><td colspan="99" style="text-align:center;padding:20px;color:#9ca3af;">Loading...</td></tr>`;try{let t=await e.searchRead(this.relation,this.query?[[this._getRecName(),`like`,this.query]]:[],{limit:this.limit,offset:this.offset,order:this._getRecName()+` asc`});this.records=t.records||[],this.totalCount=t.length||0}catch{this.records=[],this.totalCount=0}this._renderRows(),this._updatePager()}_getRecName(){for(let[e,t]of Object.entries(this.fieldDefs))if(e===`name`)return`name`;return this.displayFields[0]?.name||`name`}_renderRows(){let e=this.dialog.querySelector(`tbody`);if(e.innerHTML=``,this.records.length===0){e.innerHTML=`<tr><td colspan="99" style="text-align:center;padding:30px;color:#9ca3af;">No records found</td></tr>`;return}this.records.forEach(t=>{let n=document.createElement(`tr`);n.className=`ls-m2o-dialog-row`,n.addEventListener(`click`,()=>{let e=this._getRecName();this.onSelect({id:t.id,name:t[e]||t.name||`#${t.id}`}),this.close()}),this.displayFields.forEach(e=>{let r=document.createElement(`td`),i=t[e.name];Array.isArray(i)?i=i[1]||``:i===!0?i=`✓`:i===!1||i==null?i=``:typeof i==`object`&&(i=JSON.stringify(i)),r.textContent=String(i),r.title=String(i),n.appendChild(r)}),e.appendChild(n)})}_updatePager(){let e=this.dialog.querySelector(`.ls-m2o-pager-info`),t=this.dialog.querySelector(`.ls-m2o-pager-prev`),n=this.dialog.querySelector(`.ls-m2o-pager-next`);this.totalCount===0?e.textContent=`0 / 0`:e.textContent=`${this.offset+1}-${Math.min(this.offset+this.records.length,this.totalCount)} / ${this.totalCount}`,t.disabled=this.offset<=0,n.disabled=this.offset+this.limit>=this.totalCount}_esc(e){return e==null?``:String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}}window.M2OAutocomplete=n,window.M2OSearchDialog=i,window.M2OCreateDialog=r})(),(function(){owl.markup;class e{constructor(){this.el=null,this.rules=[],this.rawDomain=`[]`,this.model=``,this.onSave=null,this.mode=`visual`,this.operators=[{val:`=`,label:`=`},{val:`!=`,label:`!=`},{val:`>`,label:`>`},{val:`>=`,label:`>=`},{val:`<`,label:`<`},{val:`<=`,label:`<=`},{val:`ilike`,label:`contains`},{val:`not ilike`,label:`does not contain`},{val:`in`,label:`in`},{val:`not in`,label:`not in`}]}open(e){this.rawDomain=e.domain||`[]`,this.model=e.model||``,this.onSave=e.onSave,this.mode=`visual`,this.rules=this.parseDomainTokens(this.rawDomain),this.rawDomain.trim()!==`[]`&&this.rules.length===0&&!this.rawDomain.includes(`(`)&&(this.mode=`raw`),this.render(),document.body.appendChild(this.el),requestAnimationFrame(()=>{this.el.style.opacity=`1`,this.el.querySelector(`.ls-domain-dialog-content`).style.transform=`translateY(0) scale(1)`})}close(){this.el&&(this.el.style.opacity=`0`,this.el.querySelector(`.ls-domain-dialog-content`).style.transform=`translateY(20px) scale(0.95)`,setTimeout(()=>{this.el&&=(this.el.remove(),null)},300))}parseDomainTokens(e){let t=[],n=/\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*(.*?)\s*\)/g,r;for(;(r=n.exec(e))!==null;){let e=r[1],n=r[2],i=r[3],a=i;(i.startsWith(`'`)&&i.endsWith(`'`)||i.startsWith(`"`)&&i.endsWith(`"`))&&(a=i.substring(1,i.length-1)),t.push({id:Date.now()+Math.random(),field:e,op:n,val:a})}return t}serializeDomain(){return this.mode===`raw`?this.el.querySelector(`.ls-domain-raw-input`).value:this.rules.length===0?`[]`:`[${this.rules.map(e=>{let t=e.val.replace(/'/g,`\\'`);if(e.op===`in`||e.op===`not in`){let t=e.val.startsWith(`[`)?e.val:`[${e.val}]`;return`('${e.field}', '${e.op}', ${t})`}return e.val===`True`||e.val===`False`?`('${e.field}', '${e.op}', ${e.val})`:`('${e.field}', '${e.op}', '${t}')`}).join(`, `)}]`}render(){this.el&&this.el.remove(),this.el=document.createElement(`div`),this.el.className=`ls-domain-dialog-overlay`,this.el.style.cssText=`
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px);
                display: flex; align-items: center; justify-content: center;
                z-index: 10000; opacity: 0; transition: opacity 0.3s ease;
            `;let e=document.createElement(`div`);e.className=`ls-domain-dialog-content`,e.style.cssText=`
                background: #fff; width: 600px; max-width: 90vw; border-radius: 12px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                transform: translateY(20px) scale(0.95); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                display: flex; flex-direction: column; overflow: hidden;
            `,e.innerHTML=`
                <div style="padding: 16px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #0f172a;">Domain Builder ${this.model?`(${this.model})`:``}</h3>
                    <div style="display: flex; gap: 12px;">
                        <button class="ls-btn ls-btn-sm ls-toggle-mode">${this.mode===`visual`?`Raw Code`:`Visual`}</button>
                        <button class="ls-close-btn" style="background: none; border: none; cursor: pointer; font-size: 18px; color: #64748b;">✕</button>
                    </div>
                </div>
                <div style="padding: 24px; min-height: 200px; max-height: 60vh; overflow-y: auto;" class="ls-domain-body">
                    <!-- Body injected here -->
                </div>
                <div style="padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; background: #f8fafc;">
                    <button class="ls-btn ls-btn-secondary ls-cancel-btn">Cancel</button>
                    <button class="ls-btn ls-btn-primary ls-save-btn">Apply Domain</button>
                </div>
            `,this.el.appendChild(e),e.querySelector(`.ls-close-btn`).addEventListener(`click`,()=>this.close()),e.querySelector(`.ls-cancel-btn`).addEventListener(`click`,()=>this.close()),e.querySelector(`.ls-toggle-mode`).addEventListener(`click`,()=>{if(this.mode===`visual`)this.rawDomain=this.serializeDomain(),this.mode=`raw`;else{this.rawDomain=e.querySelector(`.ls-domain-raw-input`).value;let t=this.parseDomainTokens(this.rawDomain);if(t.length>0||this.rawDomain.trim()===`[]`)this.rules=t,this.mode=`visual`;else{alert(`Domain is too complex to parse visually. Staying in raw mode.`);return}}this.renderBody(e.querySelector(`.ls-domain-body`)),e.querySelector(`.ls-toggle-mode`).innerText=this.mode===`visual`?`Raw Code`:`Visual`}),e.querySelector(`.ls-save-btn`).addEventListener(`click`,()=>{let e=this.serializeDomain();this.onSave&&this.onSave(e),this.close()}),this.renderBody(e.querySelector(`.ls-domain-body`))}renderBody(e){if(e.innerHTML=``,this.mode===`raw`){e.innerHTML=`
                    <div style="margin-bottom: 8px; font-size: 12px; color: #64748b;">Enter domain as a Python list of tuples. Example: [('active', '=', True)]</div>
                    <textarea class="ls-field-textarea ls-domain-raw-input ls-code-font" rows="8" style="font-family: monospace; font-size: 13px; background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 6px;">${this.rawDomain}</textarea>
                `;return}if(this.rules.length===0)e.innerHTML=`<div style="text-align: center; color: #94a3b8; padding: 40px 0; font-style: italic;">No rules defined. Match all records.</div>`;else{let t=document.createElement(`div`);t.style.cssText=`display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;`,this.rules.forEach((e,n)=>{let r=document.createElement(`div`);r.style.cssText=`display: flex; gap: 8px; align-items: center;`;let i=this.operators.map(t=>`<option value="${t.val}" ${e.op===t.val?`selected`:``}>${t.label}</option>`).join(``);r.innerHTML=`
                        <input type="text" class="ls-field-input" value="${e.field}" placeholder="field_name" style="flex: 2; min-width: 0;" data-idx="${n}" data-key="field"/>
                        <select class="ls-field-select" style="flex: 1.5; min-width: 0;" data-idx="${n}" data-key="op">${i}</select>
                        <input type="text" class="ls-field-input" value="${e.val}" placeholder="value" style="flex: 3; min-width: 0;" data-idx="${n}" data-key="val"/>
                        <button class="ls-btn-icon ls-del-rule" data-idx="${n}" style="color: #ef4444;" title="Delete rule">✕</button>
                    `,t.appendChild(r)}),e.appendChild(t),e.querySelectorAll(`input, select`).forEach(e=>{e.addEventListener(`change`,e=>{let t=e.target.getAttribute(`data-idx`),n=e.target.getAttribute(`data-key`);this.rules[t][n]=e.target.value})}),e.querySelectorAll(`.ls-del-rule`).forEach(t=>{t.addEventListener(`click`,t=>{let n=parseInt(t.target.getAttribute(`data-idx`));this.rules.splice(n,1),this.renderBody(e)})})}let t=document.createElement(`button`);t.className=`ls-btn ls-btn-secondary`,t.innerHTML=`+ Add Rule`,t.addEventListener(`click`,()=>{this.rules.push({id:Date.now(),field:``,op:`=`,val:``}),this.renderBody(e)}),e.appendChild(t)}}window.DomainBuilderDialog=new e})(),(function(){let{Component:e,useState:t,useRef:n,onMounted:r,onWillStart:i}=owl,a=window.LarasoftRPC,o=window.LarasoftIcons,s=0;class c extends e{static template=window.TEMPLATES.App;static props={onOpenRecord:{type:Function,optional:!0},stages:{type:Array,optional:!0},projects:{type:Array,optional:!0},tags:{type:Array,optional:!0},model:{type:String,optional:!0},searchViewDef:{type:Object,optional:!0},listViewDef:{type:Object,optional:!0},actionTitle:{type:String,optional:!0},viewModes:{type:Array,optional:!0},activeViewType:{type:String,optional:!0},onSwitchView:{type:Function,optional:!0},actionDomain:{type:Array,optional:!0},actionContext:{type:Object,optional:!0}};setup(){this.icons=o,this.state=t({records:[],groups:[],groupRecords:{},collapsedGroups:{},groupNodes:[],totalCount:0,loading:!0,offset:0,limit:80,orderBy:`id desc`,domain:[],groupBy:null,facets:[],searchQuery:``,showSearchPanel:!1,showAutocomplete:!1,showCustomFilter:!1,showSaveFav:!1,selectedIds:[],fields:{},projects:[],stages:[],tags:[],savedFilters:[],hiddenColumns:{},showOptionalMenu:!1,aggregates:{},editingValues:{},editingNew:!1,editingNewValues:{},printActions:[],showPrintMenu:!1,listEditablePosition:this.props.listViewDef&&this.props.listViewDef.editable===`bottom`?`bottom`:`top`,searchPanelValues:{},searchPanelFilters:{},searchPanelData:{},colWidths:{}}),this.searchInputRef=n(`searchInput`),this.searchbarRef=n(`searchbar`),this.cfFieldRef=n(`cfField`),this.cfOpRef=n(`cfOp`),this.cfValRef=n(`cfVal`),this.favNameRef=n(`favName`),this.favDefaultRef=n(`favDefault`),this.favSharedRef=n(`favShared`),this._onDocClick=e=>{let t=this.searchbarRef.el;t&&!t.contains(e.target)&&(this.state.showSearchPanel=!1,this.state.showAutocomplete=!1),e.target.closest(`.ls-optional-toggle`)||(this.state.showOptionalMenu=!1),e.target.closest(`.ls-print-menu`)||(this.state.showPrintMenu=!1)},this._model=this.props.model||`task`,i(async()=>{await this._fetchPrintActions();let[e,t]=await Promise.all([a.fieldsGet(this._model),a.get(`/api/filters?model=`+this._model)]);this.state.fields=e,this.state.projects=this.props.projects||[],this.state.stages=this.props.stages||[],this.state.tags=this.props.tags||[],this.state.savedFilters=t;let n=this.props.listViewDef;n?.limit&&(this.state.limit=n.limit),n?.default_order&&(this.state.orderBy=n.default_order),n?.columns&&n.columns.forEach(e=>{e.optional===`hide`&&(this.state.hiddenColumns[e.name]=!0)})}),r(()=>{document.addEventListener(`click`,this._onDocClick),this._loadSearchPanelData(),this.loadRecords()})}onResizeStart(e,t){e.preventDefault(),e.stopPropagation();let n=e.target.closest(`th`);if(!n)return;let r=e.clientX,i=n.getBoundingClientRect().width;e.target.classList.add(`active`);let a=e=>{let t=Math.max(50,i+(e.clientX-r));n.style.width=t+`px`},o=n=>{e.target.classList.remove(`active`),document.removeEventListener(`mousemove`,a),document.removeEventListener(`mouseup`,o);let s=Math.max(50,i+(n.clientX-r));this.state.colWidths[t]=s};document.addEventListener(`mousemove`,a),document.addEventListener(`mouseup`,o)}get searchPanelSections(){return(this.props.searchViewDef?.searchpanel||[]).map(e=>({...e,_values:this.state.searchPanelData[e.field]||[],_totalCount:(this.state.searchPanelData[e.field]||[]).reduce((e,t)=>e+(t.__count||0),0)}))}async _loadSearchPanelData(){let e=this.props.searchViewDef?.searchpanel||[];if(e.length===0)return;let t={},n=e.map(async e=>{let n=this.state.fields[e.field];if(n&&([`many2one`,`selection`].includes(e.type)||[`many2one`,`selection`].includes(n.type)))try{let r=(await a.searchRead(this._model,[],{group_by:e.field})).groups||[];if(n.type===`selection`||e.type===`selection`){let i=n.selection||[],a={};r.forEach(t=>{let n=t[e.field]===void 0?t.id:t[e.field];a[n]=t.__count||0}),t[e.field]=i.map(e=>{let t=Array.isArray(e)?e[0]:e.value??e[0];return{id:t,name:Array.isArray(e)?e[1]:e.label??e[1],__count:a[t]||0}})}else{let i=n.relation;if(!i)return;if(r.map(t=>{let n=t[e.field];return n===void 0?t.id:n}).filter(e=>e!=null&&e!==!1).length>0){let n=await a.nameSearch(i,``,200),o={};n.forEach(e=>{o[e.id]=e.name}),t[e.field]=r.filter(t=>{let n=t[e.field]===void 0?t.id:t[e.field];return n!=null&&n!==!1}).map(t=>{let n=t[e.field]===void 0?t.id:t[e.field];return{id:n,name:o[n]||t.name||`#${n}`,__count:t.__count||0}})}else t[e.field]=[]}}catch(n){console.warn(`SearchPanel load error:`,n),t[e.field]=[]}});await Promise.all(n),this.state.searchPanelData=t}setSearchPanelCategory(e,t){t===null?delete this.state.searchPanelValues[e]:this.state.searchPanelValues[e]=t,this.state.offset=0,this.loadRecords()}toggleSearchPanelFilter(e,t){let n=this.state.searchPanelFilters[e]||[],r=n.indexOf(t);r>=0?n.splice(r,1):n.push(t),this.state.searchPanelFilters[e]=[...n],this.state.offset=0,this.loadRecords()}get listEditable(){return this.props.listViewDef?.editable||null}get listEditablePosition(){return this.listEditable}get multiEditEnabled(){return this.props.listViewDef?.multi_edit||!1}get multiEditActive(){return this.multiEditEnabled&&this.state.selectedIds.length>1&&this.state.editingId}get headerButtons(){return this.props.listViewDef?.header_buttons||[]}get decorationRules(){return this.props.listViewDef?.decoration||{}}get allColumns(){let e=this.props.listViewDef;return e?.columns?e.columns:(e?.fields||Object.keys(this.state.fields).slice(0,8)).map(e=>({name:e,string:this.state.fields[e]?.string||e,type:this.state.fields[e]?.type||`char`,widget:this.state.fields[e]?.widget||null,sortable:this.state.fields[e]?.sortable||!1}))}get visibleColumns(){return this.allColumns.filter(e=>!this.state.hiddenColumns[e.name]&&!e.column_invisible)}get optionalColumns(){return this.allColumns.filter(e=>e.optional===`show`||e.optional===`hide`)}get aggregateColumns(){return this.visibleColumns.filter(e=>e.aggregation)}isColumnVisible(e){return!this.state.hiddenColumns[e]}toggleColumn(e){this.state.hiddenColumns[e]?delete this.state.hiddenColumns[e]:this.state.hiddenColumns[e]=!0}toggleOptionalMenu(){this.state.showOptionalMenu=!this.state.showOptionalMenu}getRowClasses(e){let t=[];this.isSelected(e.id)&&t.push(`selected`);for(let[n,r]of Object.entries(this.decorationRules))this._evalDecoration(r,e)&&t.push(`ls-`+n);return t.join(` `)}_evalDecoration(e,t){try{let n=e.replace(/ and /g,` && `).replace(/ or /g,` || `).replace(/!=/g,`!==`).replace(/([^!><])={1}(?!=)/g,`$1===`).replace(/False/g,`false`).replace(/True/g,`true`),r=Object.keys(t),i=r.map(e=>t[e]);return Function(...r,`return !!(${n});`)(...i)}catch{return!1}}renderCellContent(e,t){let n={...this.state.fields[t.name]||{}};return t.widget&&(n.widget=t.widget),window.listHelpers.renderListCell(n,e[t.name])}_resolveEditType(e){let t=this.state.fields[e.name]||{},n=e.widget||t.widget,r=t.type||`char`;return n===`badge`||n===`statusbar`||n===`state_selection`||n===`badges`?r===`many2one`?`many2one`:`selection`:n===`progressbar`||n===`percentage`||n===`percentage_pie`||n===`float_time`?`number`:n===`remaining_days`||n===`daterange`?`date`:n===`boolean_favorite`||n===`boolean_toggle`||n===`boolean_button`?`boolean`:n===`priority`?`selection`:n===`monetary`?`number`:n===`many2one_avatar`||n===`many2one_avatar_user`||n===`many2onebutton`?`many2one`:n===`email`||n===`url`||n===`phone`||n===`copy_clipboard`?`char`:n===`many2many_tags`||n===`many2many_checkboxes`?`many2many`:n===`color_picker`?`color`:r}renderInlineEditCell(e,t,n){let r=this.state.fields[e.name]||{},i=t[e.name]??``,a=this._resolveEditType(e),o=e.name,s=e=>e==null?``:String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`),c=`oninput="this.dataset.dirty='1'" onchange="this.dataset.dirty='1'"`,l=``;if(a===`many2one`){let e=this.state._relOptions?.[o]||[],t=Array.isArray(i)?i[0]:typeof i==`object`&&i?i.id:i;l=`<select class="ls-inline-input" data-field="${o}" data-inline="1" ${c}>`,l+=`<option value="">—</option>`,e.forEach(e=>{l+=`<option value="${e.id}" ${t==e.id?`selected`:``}>${s(e.name||e.display_name||e.id)}</option>`}),l+=`</select>`}else if(a===`selection`){let e=r.selection||[],t=Array.isArray(i)?i[0]:i;l=`<select class="ls-inline-input" data-field="${o}" data-inline="1" ${c}>`,l+=`<option value="">—</option>`,e.forEach(e=>{let n=Array.isArray(e)?e[0]:e.value??e[0],r=Array.isArray(e)?e[1]:e.label??e[1];l+=`<option value="${s(n)}" ${t==n?`selected`:``}>${s(r)}</option>`}),l+=`</select>`}else l=a===`boolean`?`<input type="checkbox" class="ls-inline-input" data-field="${o}" data-inline="1" ${i?`checked`:``} ${c}/>`:a===`date`?`<input type="date" class="ls-inline-input" data-field="${o}" data-inline="1" value="${s(typeof i==`string`?i.substring(0,10):``)}" ${c}/>`:a===`datetime`?`<input type="datetime-local" class="ls-inline-input" data-field="${o}" data-inline="1" value="${s(typeof i==`string`?i.replace(` `,`T`).substring(0,16):``)}" ${c}/>`:a===`number`?`<input type="number" class="ls-inline-input" data-field="${o}" data-inline="1" step="any" value="${typeof i==`number`?i:parseFloat(i)||0}" ${c}/>`:a===`integer`?`<input type="number" class="ls-inline-input" data-field="${o}" data-inline="1" step="1" value="${parseInt(i)||0}" ${c}/>`:a===`float`||a===`monetary`?`<input type="number" class="ls-inline-input" data-field="${o}" data-inline="1" step="0.01" value="${parseFloat(i)||0}" ${c}/>`:a===`many2many`?`<span class="ls-inline-readonly" data-field="${o}" data-inline="1" data-dirty="0">${s(Array.isArray(i)?i.map(e=>e.name||``).join(`, `):``)||`(tags)`}</span>`:a===`color`?`<input type="color" class="ls-inline-input" data-field="${o}" data-inline="1" value="${s(i||`#7c3aed`)}" ${c}/>`:a===`text`||a===`html`?`<input type="text" class="ls-inline-input" data-field="${o}" data-inline="1" value="${s(i)}" placeholder="..." ${c}/>`:`<input type="text" class="ls-inline-input" data-field="${o}" data-inline="1" value="${s(i)}" ${c}/>`;return owl.markup(l)}isInlineEditing(e){return this.state.editingId===e}async _loadRelationOptions(){let e={},t=[];for(let n of this.visibleColumns){let r=this.state.fields[n.name];if(r&&(r.type===`many2one`||n.name.endsWith(`_id`))){let i=r.relation;if(!i)continue;t.push(a.nameSearch(i,``,100).then(t=>{e[n.name]=t.results||t||[]}).catch(()=>{e[n.name]=[]}))}}await Promise.all(t),this.state._relOptions=e}async onNewInline(){await this._loadRelationOptions();let e={};this.visibleColumns.forEach(t=>{e[t.name]=``}),this.state.editingNew=!0,this.state.editingNewValues=e}async onRowDblClick(e){if(this.listEditable){if(await this._loadRelationOptions(),this.multiEditEnabled&&this.state.selectedIds.length>1){this.state.editingId=`__multi__`,this.state.editingValues={};return}this.state.editingId=e.id,this.state.editingValues={...e}}}async saveInlineEdit(){let e=document.querySelector(`.ls-list-wrapper`);if(!e)return;let t=e.querySelectorAll(`[data-inline="1"]`),n=this.state.editingId===`__multi__`,r={},i={};t.forEach(e=>{let t=e.dataset.field,n=e.dataset.dirty===`1`;if(e.type===`checkbox`)r[t]=e.checked,n&&(i[t]=!0);else if(e.type===`number`){let a=e.value.trim();r[t]=a===``?null:parseFloat(a)||0,n&&(i[t]=!0)}else r[t]=e.value,n&&(i[t]=!0)});let o=new Set;for(let e of this.visibleColumns){let t=this.state.fields[e.name];t&&(t.type===`many2one`||e.name.endsWith(`_id`))&&o.add(e.name)}try{if(this.state.editingNew){this.state.projects[0]?.id&&(r.project_id=r.project_id||this.state.projects[0].id),this.state.stages[0]?.id&&(r.stage_id=r.stage_id||this.state.stages[0].id);for(let e of o)r[e]||delete r[e];await a.create(this._model,r)}else if(n){let e={};for(let[t,n]of Object.entries(r))i[t]&&(n===``||n===null||n===0&&o.has(t)||(e[t]=n));Object.keys(e).length>0?await a.call(`/api/orm/write`,{model:this._model,ids:this.state.selectedIds,values:e}):console.info(`Multi-edit: no fields were changed.`)}else if(this.state.editingId){for(let e of o)(!r[e]||r[e]===0)&&delete r[e];await a.call(`/api/orm/write`,{model:this._model,ids:[this.state.editingId],values:r})}}catch(e){alert(`Error: `+(e.message||e))}this.cancelInlineEdit(),this.loadRecords()}cancelInlineEdit(){this.state.editingNew=!1,this.state.editingNewValues={},this.state.editingId=null,this.state.editingValues={}}async loadAggregates(){let e=this.aggregateColumns.map(e=>({field:e.name,type:e.aggregation}));if(e.length===0){this.state.aggregates={};return}try{let t=await a.call(`/api/orm/aggregate`,{model:this._model,domain:this.buildDomain(),measures:e});this.state.aggregates=t.aggregates||{}}catch{this.state.aggregates={}}}formatAggregate(e){let t=this.state.aggregates[e.name];if(!t)return`—`;let n=t.value;if(e.widget===`float_time`){let e=Math.floor(n);return`${e}:${String(Math.round((n-e)*60)).padStart(2,`0`)}`}return typeof n==`number`?e.widget===`monetary`?new Intl.NumberFormat(`id-ID`,{style:`currency`,currency:window.LarasoftUser?.company_currency||`IDR`,minimumFractionDigits:2,maximumFractionDigits:2}).format(n):e.widget===`integer`?new Intl.NumberFormat(`id-ID`,{maximumFractionDigits:0}).format(n):e.widget===`float`?new Intl.NumberFormat(`id-ID`,{minimumFractionDigits:2,maximumFractionDigits:2}).format(n):n.toFixed(2):String(n)}async onHeaderButton(e){if(this.state.selectedIds.length===0){alert(`Select records first.`);return}if(!(e.confirm&&!confirm(e.confirm)))try{await a.call(`/api/orm/call_button_multi`,{model:this._model,method:e.name,ids:this.state.selectedIds}),this.state.selectedIds=[],this.loadRecords()}catch(e){alert(`Error: `+(e.message||e))}}async _fetchPrintActions(){try{let e=await fetch(`/api/report/actions?model=`+this._model,{headers:{Accept:`application/json`}});e.ok&&(this.state.printActions=await e.json())}catch(e){console.error(`Failed to load print actions`,e)}}togglePrintMenu(){this.state.showPrintMenu=!this.state.showPrintMenu}printReport(e){let t=`/api/report/pdf/`+e;this.state.selectedIds&&this.state.selectedIds.length>0&&(t+=`?ids=`+this.state.selectedIds.join(`,`)),window.open(t,`_blank`),this.state.showPrintMenu=!1}async loadRecords(){this.state.loading=!0;try{let e=this.buildDomain();if(this.state.groupBy&&Array.isArray(this.state.groupBy)&&this.state.groupBy.length>0)await this._loadGroupTree(e);else if(this.state.groupBy&&typeof this.state.groupBy==`string`){let t=[this.state.groupBy];this.state.groupBy=t,await this._loadGroupTree(e)}else{let t=await a.searchRead(this._model,e,{order:this.state.orderBy,limit:this.state.limit,offset:this.state.offset});this.state.records=t.records||[],this.state.totalCount=t.length||0,this.state.groupNodes=[]}this.loadAggregates()}catch(e){throw console.error(`Load error:`,e),this.state.loading=!1,e}this.state.loading=!1}buildDomain(){let e=[];this.props.actionDomain&&Array.isArray(this.props.actionDomain)&&e.push(...this.props.actionDomain);for(let t of this.state.facets)t.domain&&(t.negated?t.domain.forEach(t=>{Array.isArray(t)&&t.length===3&&e.push([`!`,t])}):e.push(...t.domain));for(let[t,n]of Object.entries(this.state.searchPanelValues))n!=null&&e.push([t,`=`,n]);for(let[t,n]of Object.entries(this.state.searchPanelFilters))n&&n.length>0&&e.push([t,`in`,n]);return e}get pagerText(){return this.state.totalCount===0?`0`:`${this.state.offset+1}-${Math.min(this.state.offset+this.state.limit,this.state.totalCount)} / ${this.state.totalCount}`}prevPage(){this.state.offset=Math.max(0,this.state.offset-this.state.limit),this.loadRecords()}nextPage(){this.state.offset+=this.state.limit,this.loadRecords()}focusSearch(){this.searchInputRef.el?.focus()}onSearchFocus(){this.state.showAutocomplete=!0}onSearchInput(e){this.state.searchQuery=e.target.value,this.state.showAutocomplete=e.target.value.length>0,this.state.showSearchPanel=!1}onSearchKeydown(e){e.key===`Enter`&&this.state.searchQuery.trim()?this.applyTextSearch():e.key===`Backspace`&&!this.state.searchQuery&&this.state.facets.length>0?this.removeFacet(this.state.facets[this.state.facets.length-1].id):e.key===`Escape`&&(this.state.showAutocomplete=!1,this.state.showSearchPanel=!1)}applyTextSearch(){let e=this.state.searchQuery.trim();e&&(this.state.facets.push({id:++s,type:`search`,label:`Search`,display:e,domain:[[`__search__`,`ilike`,e]]}),this.state.searchQuery=``,this.searchInputRef.el&&(this.searchInputRef.el.value=``),this.state.showAutocomplete=!1,this.state.offset=0,this.loadRecords())}applyFieldSearch(e,t){let n=this.state.searchQuery.trim();if(!n)return;let r=this.state.fields[e];this.state.facets.push({id:++s,type:`filter`,label:r?.string||e,display:n,domain:[[e,t||`ilike`,n]]}),this.state.searchQuery=``,this.searchInputRef.el&&(this.searchInputRef.el.value=``),this.state.showAutocomplete=!1,this.state.offset=0,this.loadRecords()}get autocompleteFields(){let e=[];for(let[t,n]of Object.entries(this.state.fields))n.searchable&&(n.type===`char`||n.type===`text`?e.push({field:t,label:n.string,operator:`ilike`}):n.type===`integer`||n.type===`float`?e.push({field:t,label:n.string,operator:`=`}):n.type===`many2one`?e.push({field:t,label:n.string,operator:`ilike`}):n.type===`selection`&&e.push({field:t,label:n.string,operator:`=`}));return e.slice(0,8)}removeFacet(e){let t=this.state.facets.find(t=>t.id===e);this.state.facets=this.state.facets.filter(t=>t.id!==e),t?.type===`groupby`&&(this.state.groupBy=null,this.state.groupNodes=[]),this.state.offset=0,this.loadRecords()}toggleFacetNegate(e){let t=this.state.facets.find(t=>t.id===e);t&&(t.negated=!t.negated,this.state.offset=0,this.loadRecords())}toggleSearchPanel(){this.state.showSearchPanel=!this.state.showSearchPanel,this.state.showAutocomplete=!1}get filterItems(){let e=this.props.searchViewDef;if(!e?.filters?.length)return[];let t=new Date().toISOString().slice(0,10);return e.filters.map(e=>{let n=e.domain||[];if(e.domain_func===`getOverdueDomain`)n=[[`deadline`,`<`,t]];else if(e.domain_func===`getInProgressDomain`)n=[[`stage_id`,`=`,this.state.stages.find(e=>e.name===`In Progress`)?.id||2]];else if(e.domain_func===`getDoneDomain`)n=[[`stage_id`,`=`,this.state.stages.find(e=>e.name===`Done`)?.id||4]];else if(e.domain_func===`getThisMonthDomain`){let t=new Date().getFullYear(),r=new Date().getMonth(),i=new Date(t,r,1).toISOString().slice(0,10),a=new Date(t,r+1,0).toISOString().slice(0,10),o=e.date_field||`create_date`;n=[[o,`>=`,i],[o,`<=`,a]]}else if(e.domain_func===`getLastMonthDomain`){let t=new Date().getFullYear(),r=new Date().getMonth()-1,i=new Date(t,r,1).toISOString().slice(0,10),a=new Date(t,r+1,0).toISOString().slice(0,10),o=e.date_field||`create_date`;n=[[o,`>=`,i],[o,`<=`,a]]}return e.id===`overdue`&&n.length===0&&(n=[[`deadline`,`<`,t]]),{id:e.id,label:e.label,domain:n,separator:e.separator||!1}})}isFilterActive(e){return this.state.facets.some(t=>t.filterId===e)}toggleFilter(e){this.isFilterActive(e.id)?this.state.facets=this.state.facets.filter(t=>t.filterId!==e.id):this.state.facets.push({id:++s,filterId:e.id,type:`filter`,label:`Filter`,display:e.label,domain:e.domain}),this.state.offset=0,this.loadRecords()}get customFilterFields(){let e=this.props.searchViewDef?.custom_filter_fields||[];return e.length>0?e.map(e=>({field:e,label:this.state.fields[e]?.string||e})):Object.entries(this.state.fields).filter(([e,t])=>t.searchable).map(([e,t])=>({field:e,label:t.string}))}toggleCustomFilter(){this.state.showCustomFilter=!this.state.showCustomFilter}applyCustomFilter(){let e=this.cfFieldRef.el?.value,t=this.cfOpRef.el?.value;t===`gt`&&(t=`>`),t===`lt`&&(t=`<`);let n=this.cfValRef.el?.value||``,r=this.state.fields[e];(r?.type===`float`||r?.type===`integer`)&&(n=parseFloat(n)||0),this.state.facets.push({id:++s,type:`filter`,label:r?.string||e,display:`${t} ${n}`,domain:[[e,t,n]]}),this.state.showCustomFilter=!1,this.state.offset=0,this.loadRecords()}get groupByItems(){let e=this.props.searchViewDef;return e?.group_by?.length>0?e.group_by:Object.entries(this.state.fields).filter(([e,t])=>t.groupable).map(([e,t])=>({field:e,label:t.string}))}isGroupByActive(e){return Array.isArray(this.state.groupBy)&&this.state.groupBy.includes(e)}toggleGroupBy(e){let t=Array.isArray(this.state.groupBy)?[...this.state.groupBy]:[],n=t.indexOf(e);if(n>=0?t.splice(n,1):t.push(e),this.state.facets=this.state.facets.filter(e=>e.type!==`groupby`),t.length>0){let e=t.map(e=>this.groupByItems.find(t=>t.field===e)?.label||e);this.state.facets.push({id:++s,type:`groupby`,label:`Group By`,display:e.join(` ▸ `),domain:[]}),this.state.groupBy=t}else this.state.groupBy=null;this.state.groupNodes=[],this.state.groupRecords={},this.state.collapsedGroups={},this.loadRecords()}get flatGroupNodes(){return this.state.groupNodes||[]}async _loadGroupTree(e){let t=this.state.groupBy;if(!t||t.length===0)return;let n=t[0],r=await a.searchRead(this._model,e,{group_by:n,order:this.state.orderBy}),i=r.groups||[];this.state.totalCount=r.length||0;let o=i.map(t=>({key:`L0_${t.id}`,depth:0,group:t,expanded:!1,childrenLoaded:!1,children:[],records:[],parentDomain:e}));this.state.groupNodes=o,this.state.records=[]}async toggleGroup(e){let t=this.state.groupNodes,n=t.findIndex(t=>t.key===e);if(n<0)return;let r=t[n];if(r.expanded){r.expanded=!1;let e=r.depth,i=n+1;for(;i<t.length&&t[i].depth>e;)i++;t.splice(n+1,i-n-1),this.state.groupNodes=[...t];return}r.expanded=!0;let i=this.state.groupBy,o=r.depth+1,s=[...r.parentDomain||this.buildDomain(),...r.group.__domain];if(o<i.length){let r=i[o],c=((await a.searchRead(this._model,s,{group_by:r,order:this.state.orderBy})).groups||[]).map(t=>({key:`${e}_L${o}_${t.id}`,depth:o,group:t,expanded:!1,childrenLoaded:!1,children:[],records:[],parentDomain:s}));t.splice(n+1,0,...c)}else r.childrenLoaded||=(r.records=(await a.searchRead(this._model,s,{order:this.state.orderBy,limit:200})).records||[],!0);this.state.groupNodes=[...t]}getGroupRecords(e){return this.state.groupNodes.find(t=>t.key===e)?.records||[]}isGroupExpanded(e){return this.state.groupNodes.find(t=>t.key===e)?.expanded||!1}isLeafGroup(e){let t=this.state.groupNodes.find(t=>t.key===e);if(!t)return!1;let n=this.state.groupBy;return t.depth>=n.length-1}formatGroupAggregate(e,t){let n=this.state.fields[e];if(!n)return String(t);if(n.widget===`float_time`||e===`planned_hours`){let e=Math.floor(t),n=Math.round((t-e)*60);return`${e}:${String(n).padStart(2,`0`)}`}if(n.type===`monetary`||n.widget===`monetary`){let e=n.currency_symbol||n.currencySymbol||``;try{let n=Number(t).toLocaleString(`id-ID`,{minimumFractionDigits:2,maximumFractionDigits:2});return e?`${e} ${n}`:n}catch{return e?`${e} ${Number(t).toFixed(2)}`:Number(t).toFixed(2)}}return typeof t==`number`?t.toLocaleString():String(t)}getAggregateLabel(e){return this.state.fields[e]?.string||e.replace(/_/g,` `)}toggleSaveFav(){this.state.showSaveFav=!this.state.showSaveFav}async saveFavorite(){let e=this.favNameRef.el?.value?.trim();if(!e)return;let t={name:e,model_name:this._model,domain:this.buildDomain(),group_by:this.state.groupBy?[this.state.groupBy]:[],is_default:this.favDefaultRef.el?.checked||!1,is_shared:this.favSharedRef.el?.checked||!1},n=await a.call(`/api/filters`,t);this.state.savedFilters.push(n),this.state.showSaveFav=!1}applySavedFilter(e){this.state.facets=[],e.domain?.length>0&&this.state.facets.push({id:++s,type:`favorite`,label:`★`,display:e.name,domain:e.domain}),e.group_by?.length>0?(this.state.groupBy=e.group_by[0],this.state.facets.push({id:++s,type:`groupby`,label:`Group By`,display:e.group_by[0],domain:[]})):this.state.groupBy=null,this.state.showSearchPanel=!1,this.state.offset=0,this.loadRecords()}async deleteSavedFilter(e){await fetch(`/api/filters/${e}`,{method:`DELETE`,headers:{"X-CSRF-TOKEN":a.csrf,Accept:`application/json`}}),this.state.savedFilters=this.state.savedFilters.filter(t=>t.id!==e)}setOrder(e){this.state.orderBy=this.state.orderBy.startsWith(e)&&this.state.orderBy.endsWith(`asc`)?`${e} desc`:`${e} asc`,this.loadRecords()}get allSelected(){return this.state.records.length>0&&this.state.selectedIds.length===this.state.records.length}isSelected(e){return this.state.selectedIds.includes(e)}toggleSelect(e){let t=this.state.selectedIds.indexOf(e);t>=0?this.state.selectedIds.splice(t,1):this.state.selectedIds.push(e)}toggleSelectAll(){this.state.selectedIds=this.allSelected?[]:this.state.records.map(e=>e.id)}clearSelection(){this.state.selectedIds=[]}async deleteSelected(){if(confirm(`Delete ${this.state.selectedIds.length} record(s)?`))try{await a.unlink(this._model,this.state.selectedIds),this.state.selectedIds=[],this.loadRecords()}catch(e){alert(`Error: `+(e.message||e))}}async onNewTask(){if(this.props.onOpenRecord){this.props.onOpenRecord(null,1,1);return}let e=prompt(`Record name:`);if(!e)return;let t=await a.create(this._model,{name:e,project_id:this.state.projects[0]?.id||1,stage_id:this.state.stages[0]?.id||1});t.id&&this.props.onOpenRecord?this.props.onOpenRecord(t.id,1,1):this.loadRecords()}onRowClick(e){if(!this.listEditable&&this.props.onOpenRecord){let t=this.state.records.map(e=>e.id);this.props.onOpenRecord(e.id,t.indexOf(e.id)+1,this.state.totalCount)}}}window.ListView=c})(),(function(){let{Component:e,useState:t,onWillStart:n,onMounted:r,xml:i,useRef:a}=owl,o=window.LarasoftRPC;window.LarasoftIcons;function s(e){return e==null?``:String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}let c={0:`#ef4444`,1:`#f97316`,2:`#f59e0b`,3:`#10b981`,4:`#06b6d4`,5:`#3b82f6`,6:`#8b5cf6`,7:`#ec4899`,8:`#6366f1`,9:`#84cc16`,red:`#ef4444`,orange:`#f97316`,yellow:`#f59e0b`,green:`#10b981`,blue:`#3b82f6`,purple:`#8b5cf6`,pink:`#ec4899`,teal:`#06b6d4`,lime:`#84cc16`};function l(e){return e==null||e===!1?null:typeof e==`number`||/^\d+$/.test(String(e))?c[Number(e)]||c[Number(e)%10]:c[String(e).toLowerCase()]||null}class u extends e{static template=i`
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
    `;static props={model:{type:String},kanbanViewDef:{type:Object,optional:!0},searchViewDef:{type:Object,optional:!0},onOpenRecord:{type:Function,optional:!0},domain:{type:Array,optional:!0},actionDomain:{type:Array,optional:!0},actionContext:{type:Object,optional:!0},actionTitle:{type:String,optional:!0},viewModes:{type:Array,optional:!0},activeViewType:{type:String,optional:!0},onSwitchView:{type:Function,optional:!0}};setup(){this._model=this.props.model||`task`,this.icons=window.LarasoftIcons,this.state=t({loading:!0,columns:[],viewDef:this.props.kanbanViewDef||{},fields:{},quickCreateCol:null,dragRecordId:null,showAggregates:!0,hasAggregate:!1,contextMenu:{visible:!1,x:0,y:0,record:null}}),n(async()=>{let e=await o.fieldsGet(this._model);this.state.fields=e,await this.loadData(),this.state.hasAggregate=this.detectAggregates()}),r(()=>{document.addEventListener(`click`,this._closeCtxHandler=()=>this.closeContextMenu())}),owl.onWillUnmount(()=>{document.removeEventListener(`click`,this._closeCtxHandler)})}async loadData(){this.state.loading=!0;let e=this.state.viewDef,t=e.default_group_by,n=this.props.actionDomain||this.props.domain||[],r=e.fold_field||`fold`;if(t){let e=(await o.searchRead(this._model,n,{group_by:t,order:`id desc`})).groups||[],i=[];for(let t of e){let e=[...n,...t.__domain],a=await o.searchRead(this._model,e,{order:`id desc`,limit:200}),s=t.__count||0,c=!1;t.id&&t.__groupBy&&(c=this.getFoldableColumn(t,r)),i.push({id:t.id??`__none__`,name:t.name||`Undefined`,value:t.value,records:a.records||[],sequence:t.sequence||0,__count:s,__domain:t.__domain,__aggregates:t.__aggregates||{},folded:c,hasMore:s>200,offset:200})}this.state.columns=i.sort((e,t)=>e.sequence-t.sequence)}else{let e=await o.searchRead(this._model,n,{limit:200});this.state.columns=[{id:`__all__`,name:`All`,records:e.records||[],folded:!1,hasMore:(e.length||0)>200,offset:200,aggregates:{}}]}this.state.loading=!1}getFoldableColumn(e,t){return e.fold===!0||e.fold===1}async loadMore(e){let t=this.props.actionDomain||this.props.domain||[],n=this.state.viewDef.default_group_by,r=[...t];n&&e.__domain&&(r=[...t,...e.__domain]);let i=await o.searchRead(this._model,r,{order:`id desc`,limit:200,offset:e.offset});e.records=[...e.records,...i.records||[]],e.offset+=200,e.hasMore=e.records.length<e.__count}detectAggregates(){let e=this.state.viewDef;return!!(e.aggregates&&Object.keys(e.aggregates).length>0)}toggleAggregates(){this.state.showAggregates=!this.state.showAggregates}getAggregateDisplay(e){let t=this.state.viewDef.aggregates||{},n=[];for(let[r,i]of Object.entries(t))if(e.__aggregates&&e.__aggregates[r]!==void 0){let t=e.__aggregates[r],a=i.label||r,o=typeof t==`number`?t.toFixed(i.decimals||0):t;n.push({label:a,display:`${o} ${a}`})}return n}getCardFields(){return this.state.viewDef.card_fields||[]}getCardFooterFields(){return this.state.viewDef.card_footer||[`priority`,`assignee`]}isProgressField(e){let t=this.state.viewDef.progress_bar;return t&&t.field===e}isAvatarField(e){let t=this.state.fields[e];return t&&t.type===`many2one`}getCardImage(e){let t=this.state.viewDef.card_image;if(!t)return null;let n=e[t];if(!n)return null;let r=this.state.fields[t];if(r&&(r.type===`binary`||r.type===`image`)){if(typeof n==`string`&&n.startsWith(`data:`))return n;if(typeof n==`string`&&n.length>100)return`data:image/png;base64,`+n;if(typeof n==`string`&&(n.startsWith(`http`)||n.startsWith(`/`)))return n}return null}getCardTags(e){let t=this.state.viewDef.card_tags;return!t||!e[t]?[]:Array.isArray(e[t])?e[t]:[]}renderCardField(e,t){let n=this.state.fields[t];if(!n)return owl.markup(`<span>${s(e[t]??``)}</span>`);let r=e[t];if(n.type===`many2one`&&Array.isArray(r))return owl.markup(`<span class="ls-kanban-field-m2o">${s(r[1]||``)}</span>`);if(n.widget===`progressbar`||this.isProgressField(t))return owl.markup(``);if(n.type===`date`&&r){let e=Math.ceil((new Date(r)-new Date)/864e5),t=e<0?`overdue`:e<=3?`soon`:`ok`,n=e<0?`${Math.abs(e)}d overdue`:e===0?`Today`:`In ${e}d`;return owl.markup(`<span class="ls-kanban-date ls-date-${t}">${n}</span>`)}if(n.type===`float`||n.type===`integer`)return owl.markup(`<span class="ls-kanban-field-num">${Number(r||0).toFixed(+(n.type===`float`))}${t.includes(`hour`)?`h`:``}</span>`);if(n.type===`monetary`)return owl.markup(`<span class="ls-kanban-field-num">${Number(r||0).toLocaleString()}</span>`);if(n.type===`selection`&&n.selection){let e=n.selection.find(e=>e[0]===r);return owl.markup(`<span class="ls-kanban-field-selection">${s(e?e[1]:r)}</span>`)}return owl.markup(`<span>${s(r??``)}</span>`)}getCardColorStyle(e){let t=this.state.viewDef.color_field;if(!t)return``;let n=l(e[t]||e[t+`_color`]);return n?`border-left: 3px solid ${n};`:``}getCardStyle(e){return this.getCardColorStyle(e)}getCardClasses(e){let t=this.state.viewDef.decoration||{},n=[];for(let[r,i]of Object.entries(t))this.evaluateCondition(e,i)&&n.push(`ls-kanban-`+r);return n.join(` `)}evaluateCondition(e,t){if(!t||typeof t!=`string`)return!1;try{let n=t.match(/^(\w+)\s*(==|!=|>=|<=|>|<|in|not in)\s*(.+)$/);if(!n)return!1;let[,r,i,a]=n,o=e[r],s=a.trim();if(s.startsWith(`'`)&&s.endsWith(`'`)||s.startsWith(`"`)&&s.endsWith(`"`)?s=s.slice(1,-1):s===`true`||s===`1`?s=!0:s===`false`||s===`0`?s=!1:isNaN(s)||(s=Number(s)),i===`in`||i===`not in`){let e=a.match(/\[(.+)\]/);if(e){let t=e[1].split(`,`).map(e=>(e=e.trim(),e.startsWith(`'`)&&e.endsWith(`'`)||e.startsWith(`"`)&&e.endsWith(`"`)?e.slice(1,-1):e)).includes(String(o));return i===`in`?t:!t}}switch(i){case`==`:return o==s;case`!=`:return o!=s;case`>`:return Number(o)>Number(s);case`<`:return Number(o)<Number(s);case`>=`:return Number(o)>=Number(s);case`<=`:return Number(o)<=Number(s)}}catch{}return!1}getPriorityValue(e){return(this.state.viewDef.card_footer||[]).includes(`priority`)?Number(e.priority||0):0}getPriorityStars(e){let t=this.getPriorityValue(e);return Array.from({length:t},(e,t)=>t)}hasProgress(e){let t=this.state.viewDef.progress_bar;return t&&e[t.field]!==void 0}getProgressValue(e){let t=this.state.viewDef.progress_bar;return t?Math.min(Math.round(Number(e[t.field])||0),100):0}getProgressStyle(e){let t=this.getProgressValue(e),n=this.state.viewDef.progress_bar?.colors||{},r;return r=n.high&&t>=80?n.high:n.medium&&t>=40?n.medium:n.low?n.low:t>=100?`#10b981`:t>=50?`#f59e0b`:`#3b82f6`,`width:${t}%;background:${r}`}getAssigneeAvatar(e){let t=this.state.viewDef.card_footer||[];for(let n of t){let t=this.state.fields[n];if(t&&t.type===`many2one`&&Array.isArray(e[n]))return e[n][1]}return null}getAvatarStyle(e){let t=this.getAssigneeAvatar(e)||`?`,n=0;for(let e=0;e<t.length;e++)n=t.charCodeAt(e)+((n<<5)-n);return`background:hsl(${Math.abs(n)%360},60%,50%)`}toggleFold(e){e.folded=!e.folded}onDragStart(e,t){this.state.dragRecordId=t.id,e.dataTransfer.effectAllowed=`move`,e.dataTransfer.setData(`text/plain`,String(t.id)),e.target.classList.add(`dragging`)}onDragOver(e){e.preventDefault(),e.dataTransfer.dropEffect=`move`}async onDrop(e,t){e.preventDefault();let n=this.state.dragRecordId;if(!n)return;let r=null;for(let e of this.state.columns){let t=e.records.findIndex(e=>e.id===n);if(t>=0){r=e.records.splice(t,1)[0];break}}if(!r)return;let i=this.state.viewDef.default_group_by;if(i){let e=this.state.fields[i],a=t.value;e&&e.type===`many2one`&&(a=t.id),r[i]=e?.type===`many2one`?[t.id,t.name]:t.value,await o.write(this._model,[n],{[i]:a})}t.records.push(r),this.state.dragRecordId=null,document.querySelectorAll(`.dragging`).forEach(e=>e.classList.remove(`dragging`))}toggleQuickCreate(e){this.state.quickCreateCol=this.state.quickCreateCol===e?null:e}onQuickCreateKeydown(e,t){e.key===`Enter`&&this.submitQuickCreate(t),e.key===`Escape`&&(this.state.quickCreateCol=null)}async submitQuickCreate(e){let t=document.querySelector(`.ls-kanban-qc-input`),n=t?.value?.trim();if(!n)return;let r=this.state.viewDef.default_group_by,i={name:n};r&&(i[r]=this.state.fields[r]?.type===`many2one`?e.id:e.value);let a=this.state.fields;for(let[e,t]of Object.entries(a))t.required&&!i[e]&&t.default!==void 0&&(i[e]=t.default);try{let n=await o.create(this._model,i);n.record&&(e.records.unshift(n.record),e.__count=(e.__count||0)+1),t.value=``}catch(e){alert(`Error: `+e.message)}}onCardContextMenu(e,t){e.preventDefault(),e.stopPropagation(),this.state.contextMenu={visible:!0,x:e.clientX,y:e.clientY,record:t}}closeContextMenu(){this.state.contextMenu.visible&&(this.state.contextMenu={visible:!1,x:0,y:0,record:null})}onCtxOpen(){let e=this.state.contextMenu.record;this.closeContextMenu(),e&&this.onCardClick(e)}async onCtxDuplicate(){let e=this.state.contextMenu.record;if(this.closeContextMenu(),e)try{let t={name:(e.name||`Untitled`)+` (copy)`},n=this.state.viewDef.default_group_by;n&&e[n]&&(t[n]=e[n]);let r=await o.create(this._model,t);if(r.record){for(let t of this.state.columns)if(t.records.some(t=>t.id===e.id)){t.records.push(r.record);break}}}catch(e){alert(`Duplicate failed: `+e.message)}}async onCtxDelete(){let e=this.state.contextMenu.record;if(this.closeContextMenu(),e&&confirm(`Delete "`+(e.name||`this record`)+`"?`))try{await o.unlink(this._model,[e.id]);for(let t of this.state.columns){let n=t.records.findIndex(t=>t.id===e.id);if(n>=0){t.records.splice(n,1);break}}}catch(e){alert(`Delete failed: `+e.message)}}onCardClick(e){if(this.props.onOpenRecord){let t=this.state.columns.flatMap(e=>e.records),n=t.findIndex(t=>t.id===e.id)+1;this.props.onOpenRecord(e.id,n,t.length)}}}window.KanbanView=u})(),(function(){let{Component:e,useState:t,onWillStart:n,onMounted:r,onWillUnmount:i,xml:a,useRef:o}=owl,s=window.LarasoftRPC,c=[`Sun`,`Mon`,`Tue`,`Wed`,`Thu`,`Fri`,`Sat`],l=[`January`,`February`,`March`,`April`,`May`,`June`,`July`,`August`,`September`,`October`,`November`,`December`],u=Array.from({length:24},(e,t)=>t),d=[`#7c3aed`,`#2563eb`,`#059669`,`#d97706`,`#dc2626`,`#ec4899`,`#0891b2`,`#4f46e5`,`#0d9488`,`#b45309`],f={0:`#ef4444`,1:`#f97316`,2:`#f59e0b`,3:`#10b981`,4:`#06b6d4`,5:`#3b82f6`,6:`#8b5cf6`,7:`#ec4899`,8:`#6366f1`,9:`#84cc16`};function p(e){if(e==null||e===!1)return null;if(typeof e==`number`||/^\d+$/.test(String(e)))return f[Number(e)]||d[Number(e)%d.length];let t=0,n=String(e);for(let e=0;e<n.length;e++)t=n.charCodeAt(e)+((t<<5)-t);return d[Math.abs(t)%d.length]}function m(e){return e?e.toLocaleTimeString(`en-US`,{hour:`2-digit`,minute:`2-digit`,hour12:!1}):``}function h(e){return e?e.toISOString().slice(0,10):``}class g extends e{static template=a`
<div class="ls-calendar-view">
    <div class="ls-control-panel">
        <div class="ls-cp-top">
            <div class="ls-breadcrumb">
                <span class="ls-breadcrumb-item" t-esc="props.actionTitle || 'Records'"/>
            </div>
            <div class="ls-searchbar-row"></div>
        </div>
        <div class="ls-cp-bottom">
            <div class="ls-cp-action-buttons">
                <button class="ls-btn ls-btn-primary ls-btn-sm" t-on-click="onAddEvent">
                    + Add Event
                </button>
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
        <div class="ls-loading"><div class="ls-spinner"/> Loading Calendar...</div>
    </t>
    <t t-else="">
        <div class="ls-calendar-toolbar">
            <div class="ls-calendar-nav">
                <button class="ls-btn ls-btn-sm" t-on-click="goToday">Today</button>
                <button class="ls-btn ls-btn-sm ls-btn-icon" t-on-click="goPrev">&#8249;</button>
                <button class="ls-btn ls-btn-sm ls-btn-icon" t-on-click="goNext">&#8250;</button>
                <span class="ls-calendar-title" t-esc="calendarTitle"/>
            </div>
            <div class="ls-calendar-modes">
                <button t-att-class="'ls-btn ls-btn-sm' + (state.mode === 'day' ? ' active' : '')"
                        t-on-click="() => this.setMode('day')">Day</button>
                <button t-att-class="'ls-btn ls-btn-sm' + (state.mode === 'week' ? ' active' : '')"
                        t-on-click="() => this.setMode('week')">Week</button>
                <button t-att-class="'ls-btn ls-btn-sm' + (state.mode === 'month' ? ' active' : '')"
                        t-on-click="() => this.setMode('month')">Month</button>
            </div>
        </div>

        <div class="ls-calendar-body">
            <!-- Color Legend Sidebar -->
            <t t-if="Object.keys(state.colorMap).length > 1">
                <div class="ls-calendar-sidebar">
                    <div class="ls-calendar-legend-title">Legend</div>
                    <t t-foreach="Object.entries(state.colorMap)" t-as="entry" t-key="entry[0]">
                        <div class="ls-calendar-legend-item">
                            <span class="ls-calendar-legend-dot" t-att-style="'background:' + entry[1]"/>
                            <span class="ls-calendar-legend-label" t-esc="getColorLabel(entry[0])"/>
                        </div>
                    </t>
                </div>
            </t>

            <!-- MONTH VIEW -->
            <t t-if="state.mode === 'month'">
                <div class="ls-calendar-grid ls-calendar-month">
                    <div class="ls-calendar-weekday" t-foreach="['Sun','Mon','Tue','Wed','Thu','Fri','Sat']" t-as="d" t-key="d" t-esc="d"/>
                    <t t-foreach="monthCells" t-as="cell" t-key="cell.key">
                        <div t-att-class="'ls-calendar-cell' + (cell.isToday ? ' today' : '') + (cell.isOtherMonth ? ' other-month' : '')"
                             t-on-click="() => this.onCellClick(cell.date)"
                             t-on-mousedown="(ev) => this.onCellMouseDown(ev, cell.date)"
                             t-on-mouseover="(ev) => this.onCellMouseMove(ev, cell.date)"
                             t-on-mouseup="() => this.onCellMouseUp(cell.date)"
                             t-att-data-date="cell.date">
                            <div class="ls-calendar-day-num" t-esc="cell.day"/>
                            <div class="ls-calendar-events">
                                <t t-foreach="cell.events" t-as="ev" t-key="ev.id">
                                    <div class="ls-calendar-event"
                                         t-att-style="'background:' + ev._color + '18;color:' + ev._color + ';border-left:3px solid ' + ev._color"
                                         t-att-title="ev._tooltip"
                                         draggable="true"
                                         t-on-dragstart="(e) => this.onEventDragStart(e, ev)"
                                         t-on-click.stop="() => this.onEventClick(ev)"
                                         t-on-mouseenter="(e) => this.showTooltip(e, ev)"
                                         t-on-mouseleave="() => this.hideTooltip()">
                                        <t t-if="ev._isMultiDay">
                                            <span class="ls-cal-ev-multiday" t-esc="ev._title"/>
                                        </t>
                                        <t t-else="">
                                            <t t-esc="ev._title"/>
                                        </t>
                                    </div>
                                </t>
                                <t t-if="cell.events.length > 3">
                                    <div class="ls-calendar-more" t-esc="'+' + (cell.events.length - 3) + ' more'"/>
                                </t>
                            </div>
                        </div>
                    </t>
                </div>
            </t>

            <!-- WEEK VIEW (Time Grid) -->
            <t t-if="state.mode === 'week'">
                <div class="ls-calendar-week-timegrid">
                    <!-- All-day section -->
                    <div class="ls-cal-timegrid-header">
                        <div class="ls-cal-timegrid-gutter"/>
                        <t t-foreach="weekCells" t-as="cell" t-key="cell.key">
                            <div t-att-class="'ls-cal-timegrid-header-cell' + (cell.isToday ? ' today' : '')">
                                <div class="ls-cal-tg-dayname" t-esc="cell.dayName"/>
                                <div t-att-class="'ls-cal-tg-daynum' + (cell.isToday ? ' today' : '')" t-esc="cell.day"/>
                            </div>
                        </t>
                    </div>
                    <!-- All-day events row -->
                    <div class="ls-cal-timegrid-allday">
                        <div class="ls-cal-timegrid-gutter ls-cal-allday-label">All day</div>
                        <t t-foreach="weekCells" t-as="cell" t-key="'allday_'+cell.key">
                            <div class="ls-cal-timegrid-allday-cell"
                                 t-on-click="() => this.onCellClick(cell.date)">
                                <t t-foreach="cell.allDayEvents" t-as="ev" t-key="ev.id">
                                    <div class="ls-calendar-event ls-cal-ev-allday"
                                         t-att-style="'background:' + ev._color + ';color:#fff'"
                                         draggable="true"
                                         t-on-dragstart="(e) => this.onEventDragStart(e, ev)"
                                         t-on-click.stop="() => this.onEventClick(ev)"
                                         t-esc="ev._title"/>
                                </t>
                            </div>
                        </t>
                    </div>
                    <!-- Time grid -->
                    <div class="ls-cal-timegrid-scroll" t-ref="timeGridScroll">
                        <div class="ls-cal-timegrid-body">
                            <t t-foreach="HOURS" t-as="h" t-key="'hour_'+h">
                                <div class="ls-cal-timegrid-row">
                                    <div class="ls-cal-timegrid-gutter ls-cal-time-label" t-esc="fmtHour(h)"/>
                                    <t t-foreach="weekCells" t-as="cell" t-key="'hour_'+h+'_'+cell.key">
                                        <div t-att-class="'ls-cal-timegrid-cell' + (cell.isToday ? ' today' : '')"
                                             t-att-data-hour="h"
                                             t-att-data-date="cell.date"
                                             t-on-click="() => this.onTimeCellClick(cell.date, h)"
                                             t-on-mousedown="(ev) => this.onTimeCellMouseDown(ev, cell.date, h)"
                                             t-on-mouseover="(ev) => this.onTimeCellMouseMove(ev, cell.date, h)"
                                             t-on-mouseup="() => this.onTimeCellMouseUp(cell.date, h)">
                                            <t t-foreach="getEventsForHour(cell, h)" t-as="ev" t-key="ev.id">
                                                <div class="ls-cal-timegrid-event"
                                                     t-att-style="getTimeEventStyle(ev, h)"
                                                     t-att-title="ev._tooltip"
                                                     draggable="true"
                                                     t-on-dragstart="(e) => this.onEventDragStart(e, ev)"
                                                     t-on-click.stop="() => this.onEventClick(ev)">
                                                    <span class="ls-cal-tg-ev-time" t-esc="fmtTime(ev._date) + ' - ' + fmtTime(ev._dateEnd)"/>
                                                    <span class="ls-cal-tg-ev-title" t-esc="ev._title"/>
                                                </div>
                                            </t>
                                        </div>
                                    </t>
                                </div>
                            </t>
                            <!-- Current time indicator -->
                            <t t-if="state.showTimeIndicator">
                                <div class="ls-cal-timegrid-now" t-att-style="'top:' + state.timeIndicatorTop + 'px'">
                                    <span class="ls-cal-now-dot"/>
                                    <span class="ls-cal-now-line"/>
                                </div>
                            </t>
                        </div>
                    </div>
                </div>
            </t>

            <!-- DAY VIEW (Time Grid) -->
            <t t-if="state.mode === 'day'">
                <div class="ls-calendar-day-timegrid">
                    <div class="ls-cal-dayview-header" t-esc="dayTitle"/>
                    <!-- All-day section -->
                    <div class="ls-cal-dayview-allday">
                        <span class="ls-cal-allday-label">All day</span>
                        <div class="ls-cal-dayview-allday-events">
                            <t t-foreach="dayAllDayEvents" t-as="ev" t-key="ev.id">
                                <div class="ls-calendar-event ls-cal-ev-allday"
                                     t-att-style="'background:' + ev._color + ';color:#fff'"
                                     draggable="true"
                                     t-on-dragstart="(e) => this.onEventDragStart(e, ev)"
                                     t-on-click.stop="() => this.onEventClick(ev)"
                                     t-esc="ev._title"/>
                            </t>
                        </div>
                    </div>
                    <!-- Time grid -->
                    <div class="ls-cal-timegrid-scroll" t-ref="dayTimeGridScroll">
                        <div class="ls-cal-timegrid-body ls-cal-dayview-body">
                            <t t-foreach="HOURS" t-as="h" t-key="'dhour_'+h">
                                <div class="ls-cal-timegrid-row">
                                    <div class="ls-cal-timegrid-gutter ls-cal-time-label" t-esc="fmtHour(h)"/>
                                    <div t-att-class="'ls-cal-timegrid-cell ls-cal-dayview-cell' + (isCurrentHour(h) ? ' current-hour' : '')"
                                         t-att-data-hour="h"
                                         t-on-click="() => this.onTimeCellClick(state.currentDate.toISOString().slice(0,10), h)"
                                         t-on-mousedown="(ev) => this.onTimeCellMouseDown(ev, state.currentDate.toISOString().slice(0,10), h)"
                                         t-on-mouseover="(ev) => this.onTimeCellMouseMove(ev, state.currentDate.toISOString().slice(0,10), h)"
                                         t-on-mouseup="() => this.onTimeCellMouseUp(state.currentDate.toISOString().slice(0,10), h)">
                                        <t t-foreach="getDayEventsForHour(h)" t-as="ev" t-key="ev.id">
                                            <div class="ls-cal-timegrid-event"
                                                 t-att-style="getTimeEventStyle(ev, h)"
                                                 t-att-title="ev._tooltip"
                                                 draggable="true"
                                                 t-on-dragstart="(e) => this.onEventDragStart(e, ev)"
                                                 t-on-click.stop="() => this.onEventClick(ev)">
                                                <span class="ls-cal-tg-ev-time" t-esc="fmtTime(ev._date) + ' - ' + fmtTime(ev._dateEnd)"/>
                                                <span class="ls-cal-tg-ev-title" t-esc="ev._title"/>
                                                <t t-foreach="ev._displayFields" t-as="df" t-key="df.field">
                                                    <span class="ls-cal-tg-ev-detail" t-esc="df.value"/>
                                                </t>
                                            </div>
                                        </t>
                                    </div>
                                </div>
                            </t>
                            <t t-if="state.showTimeIndicator">
                                <div class="ls-cal-timegrid-now" t-att-style="'top:' + state.timeIndicatorTop + 'px'">
                                    <span class="ls-cal-now-dot"/>
                                    <span class="ls-cal-now-line"/>
                                </div>
                            </t>
                        </div>
                    </div>
                </div>
            </t>
        </div>

        <!-- Tooltip -->
        <t t-if="state.tooltip.visible">
            <div class="ls-calendar-tooltip"
                 t-att-style="'left:' + state.tooltip.x + 'px;top:' + state.tooltip.y + 'px'"
                 t-on-mouseenter="() => this.keepTooltip()"
                 t-on-mouseleave="() => this.hideTooltip()">
                <div class="ls-cal-tooltip-title" t-esc="state.tooltip.event._title"/>
                <div class="ls-cal-tooltip-time" t-esc="state.tooltip.event._tooltipTime"/>
                <t t-foreach="state.tooltip.event._displayFields" t-as="df" t-key="df.field">
                    <div class="ls-cal-tooltip-field">
                        <span class="ls-cal-tooltip-label" t-esc="df.label + ': '"/>
                        <span t-esc="df.value"/>
                    </div>
                </t>
            </div>
        </t>

        <!-- Quick Create Modal -->
        <t t-if="state.quickCreate.visible">
            <div class="ls-calendar-modal-overlay" t-on-click="() => this.closeQuickCreate()">
                <div class="ls-calendar-modal" t-on-click.stop="">
                    <div class="ls-cal-modal-header">New Event</div>
                    <div class="ls-cal-modal-body">
                        <div class="ls-cal-form-group">
                            <label>Title</label>
                            <input type="text" t-model="state.quickCreate.title" placeholder="Event title..." class="ls-cal-form-input"/>
                        </div>
                        <div class="ls-cal-form-row">
                            <div class="ls-cal-form-group">
                                <label>Start</label>
                                <input type="datetime-local" t-model="state.quickCreate.start" class="ls-cal-form-input"/>
                            </div>
                            <div class="ls-cal-form-group">
                                <label>End</label>
                                <input type="datetime-local" t-model="state.quickCreate.end" class="ls-cal-form-input"/>
                            </div>
                        </div>
                        <t t-if="state.quickCreate.allDayField">
                            <div class="ls-cal-form-group">
                                <label class="ls-cal-form-check">
                                    <input type="checkbox" t-model="state.quickCreate.allDay"/>
                                    All day
                                </label>
                            </div>
                        </t>
                    </div>
                    <div class="ls-cal-modal-footer">
                        <button class="ls-btn ls-btn-sm" t-on-click="() => this.closeQuickCreate()">Discard</button>
                        <button class="ls-btn ls-btn-primary ls-btn-sm" t-on-click="() => this.submitQuickCreate()">Save</button>
                    </div>
                </div>
            </div>
        </t>
    </t>
</div>
    `;static props={model:{type:String},calendarViewDef:{type:Object,optional:!0},onOpenRecord:{type:Function,optional:!0},domain:{type:Array,optional:!0},actionDomain:{type:Array,optional:!0},actionTitle:{type:String,optional:!0},viewModes:{type:Array,optional:!0},activeViewType:{type:String,optional:!0},onSwitchView:{type:Function,optional:!0}};setup(){this._model=this.props.model||`task`;let e=this.props.calendarViewDef||{};this._timeIndicatorInterval=null,this.HOURS=u,this.fmtTime=m,this.state=t({loading:!0,mode:e.mode||`month`,currentDate:new Date,events:[],viewDef:e,fields:{},colorMap:{},dragEvent:null,dragStartDate:null,dragEndDate:null,isDragging:!1,selectionStart:null,selectionEnd:null,isSelecting:!1,tooltip:{visible:!1,x:0,y:0,event:null},tooltipTimeout:null,quickCreate:{visible:!1,title:``,start:``,end:``,allDay:!1,allDayField:null},showTimeIndicator:!1,timeIndicatorTop:0}),n(async()=>{let e=await s.fieldsGet(this._model);this.state.fields=e,await this.loadEvents()}),r(()=>{this._timeIndicatorInterval=setInterval(()=>this.updateTimeIndicator(),6e4),this.updateTimeIndicator(),this._keyHandler=e=>{e.key===`Escape`&&(this.hideTooltip(),this.closeQuickCreate())},document.addEventListener(`keydown`,this._keyHandler)}),i(()=>{this._timeIndicatorInterval&&clearInterval(this._timeIndicatorInterval),document.removeEventListener(`keydown`,this._keyHandler)})}async loadEvents(){this.state.loading=!0;let e=this.state.viewDef,t=e.date_start||`deadline`,n=this.props.actionDomain||this.props.domain||[],r=this.getDateRange(),i=[...n,[t,`>=`,r.start],[t,`<=`,r.end]],a=(await s.searchRead(this._model,i,{limit:500})).records||[],o=e.color,c=e.event_display_fields||[`name`],l={};a.forEach(e=>{if(o){let t=Array.isArray(e[o])?e[o][0]:e[o];t&&!l[t]&&(l[t]=p(t))}}),this.state.events=a.map(n=>{let r=n[t],i=e.date_stop&&n[e.date_stop]?new Date(n[e.date_stop]):null,a=o?Array.isArray(n[o])?n[o][0]:n[o]:null,s=c.map(e=>{let t=this.state.fields[e],r=n[e];return Array.isArray(r)&&(r=r[1]),{field:e,label:t?.string||e,value:r??``}}),u=r?new Date(r):null,d=i&&u&&h(u)!==h(i);return{...n,_date:u,_dateEnd:i,_title:n[e.event_display_fields?.[0]||`name`]||`Untitled`,_color:l[a]||`#7c3aed`,_displayFields:s,_isMultiDay:d,_tooltip:_(n,s,u,i),_tooltipTime:v(u,i)}}).filter(e=>e._date),this.state.colorMap=l,this.state.loading=!1,this.updateTimeIndicator()}getDateRange(){let e=this.state.currentDate,t=this.state.mode,n,r;return t===`month`?(n=new Date(e.getFullYear(),e.getMonth(),1),n.setDate(n.getDate()-n.getDay()),r=new Date(e.getFullYear(),e.getMonth()+1,0),r.setDate(r.getDate()+(6-r.getDay()))):t===`week`?(n=new Date(e),n.setDate(e.getDate()-e.getDay()),r=new Date(n),r.setDate(n.getDate()+6)):(n=new Date(e),r=new Date(e)),{start:n.toISOString().slice(0,10),end:r.toISOString().slice(0,10)}}get calendarTitle(){let e=this.state.currentDate;if(this.state.mode===`month`)return`${l[e.getMonth()]} ${e.getFullYear()}`;if(this.state.mode===`week`){let e=this.getDateRange();return`${e.start} — ${e.end}`}return e.toLocaleDateString(`en-US`,{weekday:`long`,year:`numeric`,month:`long`,day:`numeric`})}get dayTitle(){return this.state.currentDate.toLocaleDateString(`en-US`,{weekday:`long`,year:`numeric`,month:`long`,day:`numeric`})}goToday(){this.state.currentDate=new Date,this.loadEvents()}goPrev(){let e=new Date(this.state.currentDate);this.state.mode===`month`?e.setMonth(e.getMonth()-1):this.state.mode===`week`?e.setDate(e.getDate()-7):e.setDate(e.getDate()-1),this.state.currentDate=e,this.loadEvents()}goNext(){let e=new Date(this.state.currentDate);this.state.mode===`month`?e.setMonth(e.getMonth()+1):this.state.mode===`week`?e.setDate(e.getDate()+7):e.setDate(e.getDate()+1),this.state.currentDate=e,this.loadEvents()}setMode(e){this.state.mode=e,this.loadEvents()}get monthCells(){let e=this.state.currentDate,t=new Date(e.getFullYear(),e.getMonth(),1),n=new Date(t);n.setDate(n.getDate()-n.getDay());let r=new Date;r.setHours(0,0,0,0);let i=[];for(let t=0;t<42;t++){let a=new Date(n);a.setDate(n.getDate()+t);let o=h(a);i.push({key:o,date:o,day:a.getDate(),isToday:a.getTime()===r.getTime(),isOtherMonth:a.getMonth()!==e.getMonth(),events:this.state.events.filter(e=>{let t=h(e._date);if(e._dateEnd){let n=h(e._dateEnd);return o>=t&&o<=n}return t===o})})}return i}get weekCells(){let e=this.state.currentDate,t=new Date(e);t.setDate(e.getDate()-e.getDay());let n=new Date;n.setHours(0,0,0,0);let r=[];for(let e=0;e<7;e++){let i=new Date(t);i.setDate(t.getDate()+e);let a=h(i),o=this.state.events.filter(e=>{let t=h(e._date);if(e._dateEnd){let n=h(e._dateEnd);return a>=t&&a<=n}return t===a});r.push({key:a,date:a,day:i.getDate(),dayName:c[i.getDay()],isToday:i.getTime()===n.getTime(),events:o,allDayEvents:o.filter(e=>e._isMultiDay||this.state.viewDef.all_day),timedEvents:o.filter(e=>!e._isMultiDay)})}return r}get dayEvents(){let e=h(this.state.currentDate);return this.state.events.filter(t=>{let n=h(t._date);if(t._dateEnd){let r=h(t._dateEnd);return e>=n&&e<=r}return n===e})}get dayAllDayEvents(){return this.dayEvents.filter(e=>e._isMultiDay||this.state.viewDef.all_day)}getEventsForHour(e,t){return e.timedEvents.filter(e=>e._date?e._date.getHours()===t:!1)}getDayEventsForHour(e){return this.dayEvents.filter(t=>t._date?t._date.getHours()===e:!1)}isCurrentHour(e){return this.state.mode===`day`&&new Date().getHours()===e}fmtHour(e){return e===0?`12 AM`:e<12?e+` AM`:e===12?`12 PM`:e-12+` PM`}getTimeEventStyle(e,t){let n=e._date?e._date.getMinutes():0,r=60;if(e._dateEnd&&e._date){let t=e._dateEnd-e._date;r=Math.max(30,t/36e5*60)}return`top:${n}px;height:${r}px;background:${e._color};color:#fff;border-left:3px solid ${e._color};`}updateTimeIndicator(){if(this.state.mode!==`week`&&this.state.mode!==`day`){this.state.showTimeIndicator=!1;return}let e=new Date,t=e.getHours()*60+e.getMinutes();this.state.showTimeIndicator=!0,this.state.timeIndicatorTop=t}getColorLabel(e){let t=this.state.viewDef.color;if(!t)return String(e);let n=this.state.fields[t];if(n&&n.type===`selection`){let t=n.selection.find(t=>String(t[0])===String(e));return t?t[1]:String(e)}return n&&n.type===`many2one`&&Array.isArray(e)?e[1]||String(e[0]):String(e)}showTooltip(e,t){this.state.tooltipTimeout&&clearTimeout(this.state.tooltipTimeout),this.state.tooltipTimeout=setTimeout(()=>{this.state.tooltip={visible:!0,x:Math.min(e.clientX+10,window.innerWidth-250),y:Math.min(e.clientY+10,window.innerHeight-150),event:t}},300)}keepTooltip(){this.state.tooltipTimeout&&clearTimeout(this.state.tooltipTimeout)}hideTooltip(){this.state.tooltipTimeout&&clearTimeout(this.state.tooltipTimeout),this.state.tooltip={visible:!1,x:0,y:0,event:null}}onEventDragStart(e,t){this.state.dragEvent=t,e.dataTransfer.effectAllowed=`move`,e.dataTransfer.setData(`text/plain`,String(t.id)),e.target.classList.add(`dragging`)}async onDropToDate(e,t=null){let n=this.state.dragEvent;if(!n)return;let r=this.state.viewDef,i=r.date_start,a=r.date_stop,o=new Date(n._date),c=new Date(e+`T00:00:00`);t!==null&&c.setHours(t,o.getMinutes()),t===null&&!r.all_day&&c.setHours(o.getHours(),o.getMinutes());let l={};if(l[i]=y(c,this.state.fields[i]),a&&n._dateEnd){let e=c-o;l[a]=y(new Date(n._dateEnd.getTime()+e),this.state.fields[a])}try{await s.write(this._model,[n.id],l),await this.loadEvents()}catch(e){alert(`Reschedule failed: `+e.message)}this.state.dragEvent=null,document.querySelectorAll(`.dragging`).forEach(e=>e.classList.remove(`dragging`))}onCellMouseDown(e,t){e.target.closest(`.ls-calendar-event`)||(this.state.isSelecting=!0,this.state.selectionStart=t,this.state.selectionEnd=t)}onCellMouseMove(e,t){this.state.isSelecting&&(this.state.selectionEnd=t)}onCellMouseUp(e){if(!this.state.isSelecting)return;this.state.isSelecting=!1;let t=this.state.selectionStart,n=e,[r,i]=t<n?[t,n]:[n,t];this.openQuickCreate(r,i),this.state.selectionStart=null,this.state.selectionEnd=null}onTimeCellMouseDown(e,t,n){e.target.closest(`.ls-cal-timegrid-event`)||(this.state.isSelecting=!0,this.state.selectionStart={date:t,hour:n},this.state.selectionEnd={date:t,hour:n})}onTimeCellMouseMove(e,t,n){this.state.isSelecting&&(this.state.selectionEnd={date:t,hour:n})}onTimeCellMouseUp(e,t){if(!this.state.isSelecting)return;this.state.isSelecting=!1;let n=this.state.selectionStart;if(!n)return;let r=n.date,i=n.hour,a=e,o=t+1;this.openQuickCreate(r,a,`${r}T${String(i).padStart(2,`0`)}:00`,`${a}T${String(o).padStart(2,`0`)}:00`),this.state.selectionStart=null,this.state.selectionEnd=null}onAddEvent(){let e=h(new Date);this.openQuickCreate(e,e)}onCellClick(e){this.state.mode===`month`&&(this.state.currentDate=new Date(e+`T00:00:00`),this.state.mode=`day`,this.loadEvents())}onTimeCellClick(e,t){}openQuickCreate(e,t,n=null,r=null){let i=this.state.viewDef.all_day?`all_day`:null,a=n||`${e}T09:00`,o=r||`${t}T10:00`;this.state.quickCreate={visible:!0,title:``,start:a,end:o,allDay:!1,allDayField:i}}closeQuickCreate(){this.state.quickCreate.visible=!1}async submitQuickCreate(){let e=this.state.quickCreate,t=this.state.viewDef,n=e.title.trim();if(!n)return;let r={},i=t.create_name_field||t.event_display_fields?.[0]||`name`;r[i]=n,t.date_start&&(r[t.date_start]=e.allDay?e.start.split(`T`)[0]:e.start),t.date_stop&&(r[t.date_stop]=e.allDay?e.end.split(`T`)[0]:e.end),t.all_day&&(r.all_day=e.allDay);for(let[e,t]of Object.entries(this.state.fields))t.required&&!r[e]&&t.default!==void 0&&(r[e]=t.default);try{await s.create(this._model,r),this.closeQuickCreate(),await this.loadEvents()}catch(e){alert(`Create failed: `+e.message)}}onEventClick(e){this.hideTooltip(),this.props.onOpenRecord&&this.props.onOpenRecord(e.id,1,this.state.events.length)}}function _(e,t,n,r){let i=t.map(e=>`${e.label}: ${e.value}`).join(`
`);return`${v(n,r)}\n${i}`}function v(e,t){if(!e)return``;let n={weekday:`short`,month:`short`,day:`numeric`,hour:`2-digit`,minute:`2-digit`},r=e.toLocaleDateString(`en-US`,n);return t&&(r+=` — `+t.toLocaleDateString(`en-US`,n)),r}function y(e,t){return e?t&&t.type===`date`?e.toISOString().slice(0,10):e.toISOString().slice(0,19).replace(`T`,` `):null}window.CalendarView=g})(),(function(){let{Component:e,useState:t,onWillStart:n,onMounted:r,onPatched:i,useRef:a,xml:o}=owl,s=window.LarasoftRPC,c=[`rgba(99, 102, 241, 0.8)`,`rgba(59, 130, 246, 0.8)`,`rgba(16, 185, 129, 0.8)`,`rgba(245, 158, 11, 0.8)`,`rgba(239, 68, 68, 0.8)`,`rgba(139, 92, 246, 0.8)`,`rgba(236, 72, 153, 0.8)`,`rgba(14, 165, 233, 0.8)`,`rgba(168, 85, 247, 0.8)`,`rgba(234, 179, 8, 0.8)`];class l extends e{static template=o`
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
    `;static props={model:{type:String},graphViewDef:{type:Object,optional:!0},domain:{type:Array,optional:!0},actionTitle:{type:String,optional:!0},viewModes:{type:Array,optional:!0},activeViewType:{type:String,optional:!0},onSwitchView:{type:Function,optional:!0}};setup(){this._model=this.props.model||`task`;let e=this.props.graphViewDef||{};this.chartRef=a(`chartCanvas`),this._chart=null,this.state=t({loading:!0,chartType:e.graph_type||`bar`,measure:e.measure||(e.measures||[])[0]||null,groupBy:(e.groupby||[])[0]||(e.dimensions||[])[0]||null,stacked:e.stacked||!1,data:[],total:0,average:0,viewDef:e,fields:{}}),n(async()=>{window.Chart||await this._loadChartJS();let e=await s.fieldsGet(this._model);this.state.fields=e,await this.loadData()}),r(()=>{this.renderChart()}),i(()=>{this.renderChart()})}async _loadChartJS(){return new Promise(e=>{if(window.Chart)return e();let t=document.createElement(`script`);t.src=`https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js`,t.onload=e,document.head.appendChild(t)})}async loadData(){this.state.loading=!0;let e=this.props.domain||[],t=this.state.measure,n=this.state.groupBy;if(!t||!n){this.state.data=[],this.state.loading=!1;return}try{let r=await s.readGroup(this._model,e,[n],[t]);this.state.data=r.groups||[],this.state.total=this.state.data.reduce((e,n)=>e+(n[t+`:sum`]||0),0),this.state.average=this.state.data.length>0?this.state.total/this.state.data.length:0}catch(e){console.error(`Graph load error:`,e),this.state.data=[]}this.state.loading=!1}renderChart(){if(!this.chartRef.el||this.state.loading||!window.Chart)return;this._chart&&this._chart.destroy();let e=this.chartRef.el.getContext(`2d`),t=this.state.data,n=this.state.measure,r=this.state.groupBy,i=t.map(e=>e[r+`_label`]||e[r]||`Unknown`),a=t.map(e=>e[n+`:sum`]||e.__count||0),o=this.state.fields[n]?.string||n,s=this.state.chartType===`pie`?`pie`:this.state.chartType;this._chart=new Chart(e,{type:s,data:{labels:i,datasets:[{label:o,data:a,backgroundColor:s===`pie`?c.slice(0,a.length):c[0],borderColor:s===`line`?c[0]:`transparent`,borderWidth:s===`line`?3:0,borderRadius:s===`bar`?6:0,fill:s===`line`?!1:void 0,tension:.3,pointRadius:s===`line`?5:0,pointBackgroundColor:c[0]}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:s===`pie`,position:`right`},tooltip:{backgroundColor:`rgba(0,0,0,0.8)`,cornerRadius:8,padding:12}},scales:s===`pie`?{}:{x:{stacked:this.state.stacked,grid:{display:!1}},y:{stacked:this.state.stacked,beginAtZero:!0,grid:{color:`rgba(0,0,0,0.06)`}}}}})}get availableMeasures(){let e=[];return e=this.state.viewDef.measures&&this.state.viewDef.measures.length>0?this.state.viewDef.measures.map(e=>({field:e,label:this.state.fields[e]?.string||e})):Object.entries(this.state.fields).filter(([e,t])=>[`integer`,`float`,`monetary`].includes(t.type)&&e!==`id`&&!e.endsWith(`_id`)).map(([e,t])=>({field:e,label:t.string||e})),e.sort((e,t)=>e.label.localeCompare(t.label))}get availableDimensions(){let e=[];return e=this.state.viewDef.dimensions&&this.state.viewDef.dimensions.length>0?this.state.viewDef.dimensions.map(e=>({field:e,label:this.state.fields[e]?.string||e})):Object.entries(this.state.fields).filter(([e,t])=>t.groupable||[`many2one`,`selection`,`boolean`,`date`,`datetime`].includes(t.type)).map(([e,t])=>({field:e,label:t.string||e})),e.sort((e,t)=>e.label.localeCompare(t.label))}setChartType(e){this.state.chartType=e,this.renderChart()}onMeasureChange(e){this.state.measure=e.target.value,this.loadData()}onDimensionChange(e){this.state.groupBy=e.target.value,this.loadData()}onStackedChange(e){this.state.stacked=e.target.checked,this.renderChart()}formatNumber(e){return Number(e||0).toLocaleString(`en-US`,{maximumFractionDigits:2})}}window.GraphView=l})(),(function(){let{Component:e,useState:t,onWillStart:n,xml:r}=owl,i=window.LarasoftRPC;class a{constructor(){this.activeMeasures=[],this.rowGroupBys=[],this.colGroupBys=[],this.rawGroups=[],this.rowHeaders=[],this.colHeaders=[],this.cellMap=new Map}async load(e,t,n,r,a){this.rowGroupBys=[...n],this.colGroupBys=[...r],this.activeMeasures=[...a],this.cellMap.clear();let o=[...this.rowGroupBys,...this.colGroupBys];if(o.length===0){let n=await i.searchRead(e,t,{limit:1});this.rawGroups=[{__count:n.length||0}]}else{let n=await i.readGroup(e,t,o,this.activeMeasures);this.rawGroups=n.groups||[]}this._buildRowHeaders(),this._buildColHeaders(),this._buildCellMap()}_buildRowHeaders(){if(this.rowHeaders=[],this.rowGroupBys.length===0){let e=this._sumAll();this.rowHeaders.push({label:`Total`,values:[],indent:0,isLeaf:!0,isTotal:!0,measurements:e});return}let e=new Map;for(let t of this.rawGroups)for(let n=0;n<this.rowGroupBys.length;n++){let r=this.rowGroupBys[n],i=t[r],a=[];for(let e=0;e<=n;e++)a.push(t[this.rowGroupBys[e]]);let o=a.join(`|`);e.has(o)||e.set(o,{label:t[r+`_label`]||String(i??`Undefined`),values:a,indent:n+1,isLeaf:n===this.rowGroupBys.length-1,isTotal:!1,measurements:{},_parentKey:n>0?a.slice(0,n).join(`|`):null})}let t=Array.from(e.values());this.rowHeaders=t}_buildColHeaders(){if(this.colHeaders=[],this.colGroupBys.length===0){this.colHeaders.push({label:`Total`,values:[],depth:0,isLeaf:!0});return}let e=new Map;for(let t of this.rawGroups)for(let n=0;n<this.colGroupBys.length;n++){let r=this.colGroupBys[n],i=t[r],a=[];for(let e=0;e<=n;e++)a.push(t[this.colGroupBys[e]]);let o=a.join(`|`);e.has(o)||e.set(o,{label:t[r+`_label`]||String(i??`Undefined`),values:a,depth:n,isLeaf:n===this.colGroupBys.length-1})}this.colHeaders=Array.from(e.values())}_buildCellMap(){this.cellMap.clear();for(let e of this.rawGroups){let t=this.rowGroupBys.map(t=>e[t]),n=this.colGroupBys.map(t=>e[t]),r=JSON.stringify(t)+`|`+JSON.stringify(n),i={};for(let t of this.activeMeasures)i[t]=e[t+`:sum`]??e[t+`:avg`]??e[t+`:count`]??0;i.__count=e.__count||0,this.cellMap.set(r,i)}}getCellValue(e,t,n){let r=JSON.stringify(e)+`|`+JSON.stringify(t),i=this.cellMap.get(r);return i?i[n]??i.__count??0:0}getRowTotal(e,t){let n=0;for(let r of this.rawGroups){let i=this.rowGroupBys.map(e=>r[e]);i.length===e.length&&i.every((t,n)=>t==e[n])&&(n+=r[t+`:sum`]??r[t+`:count`]??0)}return n}getColTotal(e,t){let n=0;for(let r of this.rawGroups){let i=this.colGroupBys.map(e=>r[e]);i.length===e.length&&i.every((t,n)=>t==e[n])&&(n+=r[t+`:sum`]??r[t+`:count`]??0)}return n}getGrandTotal(e){let t=0;for(let n of this.rawGroups)t+=n[e+`:sum`]??n[e+`:count`]??0;return t}_sumAll(){let e={};for(let t of this.activeMeasures){e[t]=0;for(let n of this.rawGroups)e[t]+=n[t+`:sum`]??n[t+`:count`]??0}return e.__count=this.rawGroups.reduce((e,t)=>e+(t.__count||0),0),e}getVisibleRows(e){if(this.rowGroupBys.length===0)return this.rowHeaders;let t=[],n={label:`Total`,values:[],indent:0,isLeaf:!0,isTotal:!0,measurements:this._sumAll()};t.push(n);for(let n of this.rowHeaders){let r=!1;if(n._parentKey){let t=n.values;for(let n=1;n<t.length;n++){let i=t.slice(0,n).join(`|`);if(!e.has(i)){r=!0;break}}}r||t.push(n)}return t}buildHeaderRows(){if(this.colGroupBys.length===0)return[[]];let e=this.colGroupBys.length,t=[],n=Math.max(1,this.activeMeasures.length);for(let r=0;r<e;r++){let e=[];for(let t of this.colHeaders){if(t.depth!==r)continue;let i=1;if(t.isLeaf)i=n;else{let e=t.values.slice(0,r+1).join(`|`),a=0;for(let t of this.colHeaders)t.isLeaf&&t.values.slice(0,r+1).join(`|`)===e&&a++;i=Math.max(a,1)*n}e.push({label:t.label,values:t.values,depth:t.depth,isLeaf:t.isLeaf,colspan:i})}t.push(e)}let r=[];for(let e of this.colHeaders)if(e.isLeaf)for(let t of this.activeMeasures)r.push({label:``,measure:t,values:e.values,depth:e.depth,isLeaf:!0,colspan:1});for(let e of this.activeMeasures)r.push({label:``,measure:e,isTotalColumn:!0,colspan:1});return r.length>0&&t.push(r),t}}class o extends e{static template=r`
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
    `;static props={model:{type:String},pivotViewDef:{type:Object,optional:!0},domain:{type:Array,optional:!0},actionTitle:{type:String,optional:!0},actionContext:{type:Object,optional:!0},viewModes:{type:Array,optional:!0},activeViewType:{type:String,optional:!0},onSwitchView:{type:Function,optional:!0}};setup(){this._model=this.props.model||`task`,this._pm=new a;let e=this.props.pivotViewDef||{},r=this.props.actionContext||{};this._domain=this.props.domain||[];let o=r.pivot_row_groupby||[],s=r.pivot_col_groupby||[],c=r.pivot_measures||[];this.state=t({loading:!0,rowGroupBys:o.length>0?[...o]:[...e.row_groupby||[]],colGroupBys:s.length>0?[...s]:[...e.col_groupby||[]],activeMeasures:c.length>0?[...c]:[...e.measures||[]],fields:{},expandedRows:new Set}),this._dimensions=[],this._measures=[],n(async()=>{let e=await i.fieldsGet(this._model);this.state.fields=e,this._computeDimensions(),await this.loadData()})}_computeDimensions(){let e=this.props.pivotViewDef||{},t=this.state.fields;e.dimensions&&e.dimensions.length>0?this._dimensions=e.dimensions.map(e=>({field:e,label:t[e]?.string||e})):this._dimensions=Object.entries(t).filter(([e,t])=>t.groupable||[`many2one`,`selection`,`boolean`,`date`,`datetime`].includes(t.type)).map(([e,t])=>({field:e,label:t.string||e}));let n={field:`__count`,label:`Count`},r=[];r=e.measures&&e.measures.length>0?e.measures.map(e=>({field:e,label:t[e]?.string||e})):Object.entries(t).filter(([e,t])=>[`integer`,`float`,`monetary`].includes(t.type)&&e!==`id`&&!e.endsWith(`_id`)).map(([e,t])=>({field:e,label:t.string||e})),this._measures=[n,...r].sort((e,t)=>e.label.localeCompare(t.label))}get availableDimensions(){return this._dimensions}get availableMeasures(){return this._measures}get hasData(){return!this.state.loading&&this._pm.rawGroups.length>0}get cornerLabel(){return this.state.rowGroupBys.length>0?this.getFieldLabel(this.state.rowGroupBys[0]):``}get headerRows(){return this._pm.buildHeaderRows()}get visibleRows(){return this._pm.getVisibleRows(this.state.expandedRows)}get visibleColLeafs(){return this._pm.colHeaders.filter(e=>e.isLeaf)}get grandTotal(){let e=this.state.activeMeasures[0]||`__count`;return this._pm.getGrandTotal(e)}getFieldLabel(e){if(e===`__count`)return`Count`;let t=e.includes(`:`)?e.split(`:`)[0]:e;return this.state.fields[t]?.string||t}formatGroupByLabel(e){if(e===`__count`)return`Count`;let t=e.split(`:`),n=t[0],r=t[1],i=this.state.fields[n]?.string||n;return r?i+` (`+({day:`Day`,week:`Week`,month:`Month`,quarter:`Quarter`,year:`Year`}[r]||r)+`)`:i}isGroupByUsed(e,t){return t.some(t=>t===e||t.startsWith(e+`:`))}_isDateField(e){let t=this.state.fields[e];return t&&(t.type===`date`||t.type===`datetime`)}formatValue(e){return e==null||e===0?`—`:Number(e).toLocaleString(`en-US`,{maximumFractionDigits:2})}async loadData(){this.state.loading=!0;try{await this._pm.load(this._model,this._domain,this.state.rowGroupBys,this.state.colGroupBys,this.state.activeMeasures)}catch(e){console.error(`Pivot load error:`,e)}this.state.loading=!1}onAddRowGroupBy(e){let t=e.target.value;if(!t||this.isGroupByUsed(t,this.state.rowGroupBys))return;let n=this._isDateField(t)?t+`:month`:t;this.state.rowGroupBys.push(n),e.target.value=``,this.loadData()}removeRowGroupBy(e){this.state.rowGroupBys.splice(e,1),this.loadData()}onAddColGroupBy(e){let t=e.target.value;if(!t||this.isGroupByUsed(t,this.state.colGroupBys))return;let n=this._isDateField(t)?t+`:month`:t;this.state.colGroupBys.push(n),e.target.value=``,this.loadData()}removeColGroupBy(e){this.state.colGroupBys.splice(e,1),this.loadData()}onAddMeasure(e){let t=e.target.value;!t||this.state.activeMeasures.includes(t)||(this.state.activeMeasures.push(t),e.target.value=``,this.loadData())}removeMeasure(e){this.state.activeMeasures.splice(e,1),this.loadData()}flipAxes(){let e=[...this.state.rowGroupBys];this.state.rowGroupBys=[...this.state.colGroupBys],this.state.colGroupBys=e,this.loadData()}expandAll(){for(let e of this._pm.rowHeaders)!e.isLeaf&&!e.isTotal&&this.state.expandedRows.add(e.values.join(`|`))}collapseAll(){this.state.expandedRows.clear()}toggleRowExpand(e){let t=e.values.join(`|`);this.state.expandedRows.has(t)?this.state.expandedRows.delete(t):this.state.expandedRows.add(t)}isRowExpanded(e){return this.state.expandedRows.has(e.values.join(`|`))}get renderMeasures(){return this.state.activeMeasures.length>0?this.state.activeMeasures:[`__count`]}getCellVal(e,t,n){return n=n||this.state.activeMeasures[0]||`__count`,this._pm.getCellValue(e.values,t.values,n)}getRowTotalVal(e,t){return t=t||this.state.activeMeasures[0]||`__count`,e.isTotal?this._pm.getGrandTotal(t):this._pm.getRowTotal(e.values,t)}getColTotalVal(e,t){return t=t||this.state.activeMeasures[0]||`__count`,this._pm.getColTotal(e.values,t)}getGrandTotalVal(e){return e=e||this.state.activeMeasures[0]||`__count`,this._pm.getGrandTotal(e)}onCellClick(e,t){let n=this.getCellVal(e,t);if(!n||n===0||!this.props.onSwitchView)return;let r=[...this._domain];for(let t=0;t<e.values.length;t++)e.values[t]!==void 0&&e.values[t]!==null&&r.push([this.state.rowGroupBys[t],`=`,e.values[t]]);for(let e=0;e<t.values.length;e++)t.values[e]!==void 0&&t.values[e]!==null&&r.push([this.state.colGroupBys[e],`=`,t.values[e]]);window.__pivotDrillDomain=r,this.props.onSwitchView(`list`)}exportCSV(){let e=this.visibleRows,t=this.visibleColLeafs,n=this.renderMeasures,r=`"`+this.cornerLabel+`"`;for(let e of t)for(let t of n)r+=`,"`+e.label+` (`+this.getFieldLabel(t)+`)"`;for(let e of n)r+=`,"Total (`+this.getFieldLabel(e)+`)"`;r+=`
`;for(let i of e){let e=`	`.repeat(i.indent);r+=`"`+e+i.label+`"`;for(let e of t)for(let t of n)r+=`,`+(this.getCellVal(i,e,t)||0);for(let e of n)r+=`,`+this.getRowTotalVal(i,e);r+=`
`}r+=`"Grand Total"`;for(let e of t)for(let t of n)r+=`,`+this.getColTotalVal(e,t);for(let e of n)r+=`,`+this.getGrandTotalVal(e);r+=`
`;let i=new Blob([`﻿`+r],{type:`text/csv;charset=utf-8;`}),a=URL.createObjectURL(i),o=document.createElement(`a`);o.href=a,o.download=`${this._model}_pivot_${new Date().toISOString().slice(0,10)}.csv`,o.click(),URL.revokeObjectURL(a)}}window.PivotView=o})(),(function(){let{Component:e,useState:t,onWillStart:n,onMounted:r,onError:i}=owl,a=window.LarasoftRPC,o={list:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,kanban:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,calendar:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,graph:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,pivot:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>`,spreadsheet:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`},s={list:`List`,kanban:`Kanban`,calendar:`Calendar`,graph:`Graph`,pivot:`Pivot`,form:`Form`,spreadsheet:`Spreadsheet`};window.LarasoftPageRegistry=Object.assign({security_overview:window.SecurityOverview,security_access:window.AccessRights,security_rules:window.RecordRules,security_groups:window.GroupsView,security_users:window.UsersView,menu_editor:window.MenuEditorView,view_builder:window.ViewBuilderView,accounting_reports:window.AccountingReports},window.LarasoftPageRegistry||{}),window.registerCustomPage=function(e,t){window.LarasoftPageRegistry[e]=t};class c extends e{static template=window.TEMPLATES.AppSwitcher;static props={apps:{type:Array},onAppClick:{type:Function}};onAppClick(e){this.props.onAppClick(e)}}class l extends e{static template=window.TEMPLATES.NavBar;static props={apps:{type:Array},activeAppId:{type:Number,optional:!0},onAppClick:{type:Function},onHome:{type:Function},isHome:{type:Boolean,optional:!0}};onAppClick(e){this.props.onAppClick(e)}toggleTheme(){window.LarasoftLayout&&window.LarasoftLayout.setTheme(window.LarasoftLayout.effectiveTheme===`dark`?`light`:`dark`)}toggleSettings(){window.LarasoftLayout&&window.LarasoftLayout.toggleSettings()}get effectiveTheme(){return window.LarasoftLayout?window.LarasoftLayout.effectiveTheme:`light`}}class u extends e{static template=window.TEMPLATES.SubMenu;static props={items:{type:Array,optional:!0},activeMenuId:{type:Number,optional:!0},onMenuClick:{type:Function}};setup(){this.state=t({openDropdown:null}),this._onDocClick=()=>{this.state.openDropdown=null},r(()=>document.addEventListener(`click`,this._onDocClick))}toggleDropdown(e,t){t&&t.stopPropagation(),this.state.openDropdown=this.state.openDropdown===e?null:e}onMenuClick(e){this.state.openDropdown=null,this.props.onMenuClick(e)}}class d extends e{static template=window.TEMPLATES.Root;static components={AppSwitcher:c,NavBar:l,SubMenu:u,ListView:window.ListView,FormView:window.FormView,KanbanView:window.KanbanView,CalendarView:window.CalendarView,GraphView:window.GraphView,PivotView:window.PivotView,SpreadsheetView:window.SpreadsheetView};get customComponent(){return window.LarasoftPageRegistry[this.state.currentView]||null}get isCustomView(){return!!window.LarasoftPageRegistry[this.state.currentView]}setup(){this.state=t({menus:[],apps:[],activeAppId:null,activeMenuId:null,currentView:`home`,actionView:`list`,currentModel:null,actionTitle:``,actionDomain:[],actionContext:{},currentAction:null,searchViewDef:{},listViewDef:{},formViewDef:{},kanbanViewDef:{},calendarViewDef:{},graphViewDef:{},pivotViewDef:{},spreadsheetViewDef:{},viewModes:[`list`,`form`],formRecordId:null,formIndex:1,formTotal:0,stages:[],projects:[],tags:[],breadcrumbs:[],hash:{},clientError:null,layout:window.LarasoftLayout?window.LarasoftLayout.toState():{theme:`light`,effectiveTheme:`light`,brandColor:`purple`,density:`default`,device:`desktop`,isMobile:!1,isTablet:!1,isDesktop:!0,settingsOpen:!1,mobileMenuOpen:!1,brandColors:[]}}),this._menuCache={},this._actionCache={},window.LarasoftLayout&&window.LarasoftLayout.onChange(()=>{Object.assign(this.state.layout,window.LarasoftLayout.toState())}),window.__navSecurity=e=>this.openCustomView(e),window.__doAction=e=>this._executeActionDict(e),i(e=>{console.error(`[Owl Error Boundary Caught]`,e);let t=e.cause||e;e.cause&&console.error(`[Owl Error Cause]`,e.cause),this.state.clientError={message:t.message||String(t),stack:t.stack||``,serverError:t.serverError||null}});let e=e=>{if(this.state.clientError)return;let t=e.error||e.reason;t&&(this.state.clientError={message:t.message||String(t),stack:t.stack||``,serverError:t.serverError||null})};window.addEventListener(`error`,e),window.addEventListener(`unhandledrejection`,e),n(async()=>{let e=await a.get(`/api/orm/load_menus`);this.state.menus=e,this.state.apps=e;let[t,n,r]=await Promise.all([a.nameSearch(`project`,``,100),a.nameSearch(`stage`,``,100),a.nameSearch(`project.tag`,``,100)]);this.state.projects=t,this.state.stages=n,this.state.tags=r,this._parseHash()})}openCustomView(e){if(!window.LarasoftPageRegistry[e]){console.warn(`Custom page not found in registry:`,e);return}this.state.currentView=e;for(let t of this.state.apps){if(t.security_view===e){this.state.activeAppId=t.id,this.state.activeMenuId=t.id;break}let n=this._findMenuBySecurityView(t.children||[],e);if(n){this.state.activeAppId=t.id,this.state.activeMenuId=n.id;break}}this._updateHash({view:e})}_findMenuBySecurityView(e,t){for(let n of e){if(n.security_view===t)return n;if(n.children){let e=this._findMenuBySecurityView(n.children,t);if(e)return e}}return null}clearError(){this.state.clientError=null}reloadPage(){window.location.reload()}setTheme(e){window.LarasoftLayout&&window.LarasoftLayout.setTheme(e)}closeSettings(){window.LarasoftLayout&&window.LarasoftLayout.closeSettings()}get availableViewModes(){return this.state.viewModes.filter(e=>e!==`form`).map(e=>({type:e,label:s[e]||e,icon:owl.markup(o[e]||o.list)}))}switchView(e){e!==this.state.actionView&&(this.state.actionView=e,this._updateHash({action:this.state.currentAction?.id,model:this.state.currentModel,view_type:e}))}onAppClick(e){if(this.state.activeAppId=e.id,e.action_id&&e.action)this._executeAction(e.action,e.id);else if(e.security_view)this.onMenuClick(e);else if(e.model)this.onMenuClick(e);else if(e.children&&e.children.length>0){let t=this._findFirstAction(e.children);t&&this.onMenuClick(t)}}onMenuClick(e){if(e.security_view){this.openCustomView(e.security_view);return}if(e.action_id&&e.action){this._executeAction(e.action,e.id);return}if(e.model){let t=e.view||`list`;this._executeActionDict({type:`ir.actions.act_window`,res_model:e.model,name:e.name||e.model,view_mode:t+`,form`}),this.state.activeMenuId=e.id}}goHome(){this.state.currentView=`home`,this.state.activeAppId=null,this.state.activeMenuId=null,this.state.currentAction=null,this._updateHash({})}get currentSubMenus(){return this.state.apps.find(e=>e.id===this.state.activeAppId)?.children||[]}async _executeAction(e,t){this.state.activeMenuId=t,this.state.currentAction=e,this.state.currentModel=e.res_model,this.state.actionTitle=e.name;try{this.state.actionDomain=e.domain?typeof e.domain==`string`?JSON.parse(e.domain):e.domain:[]}catch{this.state.actionDomain=[]}try{this.state.actionContext=e.context?typeof e.context==`string`?JSON.parse(e.context):e.context:{}}catch{this.state.actionContext={}}let n=e.view_mode?e.view_mode.split(`,`).map(e=>e.trim()):[`list`,`form`];this.state.viewModes=n,this.state.actionView=n[0]===`form`?`list`:n[0],this.state.currentView=`action`;let r=this._actionCache[e.id];if(r)this._applyViewDefs(r.views||{});else try{let t=await a.call(`/api/orm/load_action`,{action_id:e.id});this._actionCache[e.id]=t,this._applyViewDefs(t.views||{})}catch(e){console.error(`Failed to load action:`,e),this._applyViewDefs({})}this._updateHash({action:e.id,model:e.res_model})}_applyViewDefs(e){this.state.searchViewDef=e.search||{},this.state.listViewDef=e.list||{},this.state.formViewDef=e.form||{},this.state.kanbanViewDef=e.kanban||{},this.state.calendarViewDef=e.calendar||{},this.state.graphViewDef=e.graph||{},this.state.pivotViewDef=e.pivot||{},this.state.spreadsheetViewDef=e.spreadsheet||{}}async _executeActionDict(e){if(e.type!==`ir.actions.act_window`)return;this.state.currentAction=e,this.state.currentModel=e.res_model,this.state.actionTitle=e.name;try{this.state.actionDomain=e.domain?typeof e.domain==`string`?JSON.parse(e.domain):e.domain:[]}catch{this.state.actionDomain=[]}try{this.state.actionContext=e.context?typeof e.context==`string`?JSON.parse(e.context):e.context:{}}catch{this.state.actionContext={}}e.res_id&&(this.state.formRecordId=e.res_id);let t=e.view_mode?e.view_mode.split(`,`).map(e=>e.trim()):[`list`];this.state.viewModes=t,this.state.actionView=t[0].trim(),this.state.currentView=`action`;try{let t=[`search`,`list`,`form`,`kanban`,`calendar`,`graph`,`pivot`,`spreadsheet`],n=t.map(t=>a.call(`/api/orm/get_view`,{model:e.res_model,view_type:t}).catch(()=>({}))),r=await Promise.all(n),i={};t.forEach((e,t)=>{i[e]=r[t]}),this._applyViewDefs(i)}catch(e){console.error(`Failed to load dynamic views:`,e)}let n={model:e.res_model,view_type:this.state.actionView};e.res_id&&(n.id=e.res_id),this._updateHash(n)}_findFirstAction(e){for(let t of e){if(t.action_id&&t.action||t.security_view||t.model)return t;if(t.children&&t.children.length>0){let e=this._findFirstAction(t.children);if(e)return e}}return null}openRecord(e,t,n){this.state.formRecordId=e,this.state.formIndex=t,this.state.formTotal=n,this.state.actionView=`form`,this._updateHash({action:this.state.currentAction?.id,model:this.state.currentModel,id:e,view_type:`form`})}backToList(){let e=this.state.viewModes.find(e=>e!==`form`)||`list`;this.state.actionView=e,this._updateHash({action:this.state.currentAction?.id,model:this.state.currentModel})}recordSaved(e){e&&e.id&&(this.state.formRecordId=e.id,this._updateHash({id:e.id}))}navigateRecord(e){let t=this.state.formIndex+e;t<1||t>this.state.formTotal||(this.state.formIndex=t,this._fetchRecordAtIndex(t))}async _fetchRecordAtIndex(e){let t=await a.searchRead(this.state.currentModel,[],{order:`id desc`,limit:1,offset:e-1});t.records&&t.records.length>0&&(this.state.formRecordId=t.records[0].id,this.state.actionView=``,await new Promise(e=>setTimeout(e,10)),this.state.actionView=`form`)}_parseHash(){let e=window.location.hash.slice(1);if(!e)return;let t={};if(e.split(`&`).forEach(e=>{let[n,r]=e.split(`=`);n&&(t[n]=r)}),t.view&&window.LarasoftPageRegistry[t.view]){this.openCustomView(t.view);return}if(t.action){let e=parseInt(t.action);for(let t of this.state.apps){if(t.action_id===e){this.onAppClick(t);return}let n=this._findMenuByActionId(t.children||[],e);if(n){this.state.activeAppId=t.id,this.onMenuClick(n);return}}}}_findMenuByActionId(e,t){for(let n of e){if(n.action_id===t)return n;if(n.children){let e=this._findMenuByActionId(n.children,t);if(e)return e}}return null}_updateHash(e){let t=Object.entries(e).map(([e,t])=>`${e}=${t}`).join(`&`);history.replaceState(null,``,`#`+t)}}document.addEventListener(`DOMContentLoaded`,()=>{let e={env:{_t:e=>e,services:{rpc:window.LarasoftRPC}},dev:!1,warnIfMutatingProps:!0,templates:window.TEMPLATES};try{new owl.App(d,e).mount(document.getElementById(`app`))}catch(e){console.error(`[CRITICAL] Gagal me-mount Larasoft WebClient:`,e),document.getElementById(`app`).innerHTML=`
                <div style="padding: 20px; color: red; font-family: sans-serif;">
                    <h3>Critical System Error</h3>
                    <p>WebClient gagal dimuat. Periksa konsol browser untuk detail error.</p>
                </div>
            `}})})();