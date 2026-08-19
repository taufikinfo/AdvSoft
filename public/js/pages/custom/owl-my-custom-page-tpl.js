// ══════════════════════════════════════════════════════════════
//  MyCustomPage — Owl Template
//  Contoh halaman kustom terintegrasi dengan backend Laravel.
// ══════════════════════════════════════════════════════════════
(function () {
    const { xml } = owl;

    window.MY_CUSTOM_PAGE_TPL = xml`
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
`;
})();
