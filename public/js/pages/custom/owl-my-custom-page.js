// ══════════════════════════════════════════════════════════════
//  MyCustomPage — Owl Component
//  Halaman kustom terintegrasi dengan backend Adiantisoft.
//  Fitur: CRUD items, stats, search/filter, sorting, modals.
// ══════════════════════════════════════════════════════════════
(function () {
    const { Component, useState, onMounted } = owl;
    const RPC = window.LarasoftRPC;

    // Warna avatar berdasarkan nama (deterministik)
    const AVATAR_COLORS = [
        '#7c3aed', '#0d9488', '#dc2626', '#d97706',
        '#2563eb', '#db2777', '#059669', '#7c3aed',
    ];

    function avatarColor(name = '') {
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
    }

    class MyCustomPage extends Component {
        static template = window.MY_CUSTOM_PAGE_TPL;

        setup() {
            this.state = useState({
                // Data utama
                items: [],
                stats: null,
                loading: false,
                error: null,

                // Search & filter
                searchQuery: '',
                filterStatus: '',
                sortField: 'created_at',
                sortDir: 'desc',

                // Modal buat/edit
                modal: {
                    open: false,
                    mode: 'create', // 'create' | 'edit'
                    editId: null,
                    form: { name: '', description: '', status: 'active' },
                    saving: false,
                    error: null,
                },

                // Modal detail
                detail: {
                    open: false,
                    item: null,
                },

                // Konfirmasi hapus
                deleteConfirm: {
                    open: false,
                    item: null,
                    deleting: false,
                },
            });

            onMounted(() => this.fetchData());
        }

        // ── Data Layer ──────────────────────────────────

        async fetchData() {
            this.state.loading = true;
            this.state.error = null;

            try {
                const res = await RPC.call('/api/custom-page/items', {});
                const items = (res.items || []).map(item => ({
                    ...item,
                    color: avatarColor(item.name),
                }));
                this.state.items = items;
                this.state.stats = res.stats || this._computeStats(items);
            } catch (e) {
                this.state.error = e.message || 'Gagal memuat data dari server.';
            } finally {
                this.state.loading = false;
            }
        }

        _computeStats(items) {
            return {
                total:    items.length,
                active:   items.filter(i => i.status === 'active').length,
                pending:  items.filter(i => i.status === 'pending').length,
                inactive: items.filter(i => i.status === 'inactive').length,
            };
        }

        // ── Computed: filtered + sorted items ──────────

        get filteredItems() {
            let list = this.state.items;

            // Search
            if (this.state.searchQuery) {
                const q = this.state.searchQuery.toLowerCase();
                list = list.filter(i =>
                    i.name.toLowerCase().includes(q) ||
                    (i.description || '').toLowerCase().includes(q)
                );
            }

            // Filter status
            if (this.state.filterStatus) {
                list = list.filter(i => i.status === this.state.filterStatus);
            }

            // Sort
            const field = this.state.sortField;
            const dir = this.state.sortDir === 'asc' ? 1 : -1;
            list = [...list].sort((a, b) => {
                const va = a[field] || '';
                const vb = b[field] || '';
                return va < vb ? -dir : va > vb ? dir : 0;
            });

            return list;
        }

        // ── Search / Filter / Sort ──────────────────────

        onSearch() {
            // Reaktif via t-model, tidak perlu action tambahan
        }

        onFilter() {
            // Reaktif via t-model
        }

        clearFilters() {
            this.state.searchQuery = '';
            this.state.filterStatus = '';
        }

        sortBy(field) {
            if (this.state.sortField === field) {
                this.state.sortDir = this.state.sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                this.state.sortField = field;
                this.state.sortDir = 'asc';
            }
        }

        // ── Modal: Create ────────────────────────────────

        openCreateModal() {
            this.state.modal = {
                open: true,
                mode: 'create',
                editId: null,
                form: { name: '', description: '', status: 'active' },
                saving: false,
                error: null,
            };
        }

        // ── Modal: Edit ──────────────────────────────────

        openEdit(item) {
            this.state.modal = {
                open: true,
                mode: 'edit',
                editId: item.id,
                form: { name: item.name, description: item.description || '', status: item.status },
                saving: false,
                error: null,
            };
        }

        // ── Modal: Save ──────────────────────────────────

        async saveModal() {
            const form = this.state.modal.form;

            if (!form.name.trim()) {
                this.state.modal.error = 'Nama tidak boleh kosong.';
                return;
            }

            this.state.modal.saving = true;
            this.state.modal.error = null;

            try {
                if (this.state.modal.mode === 'create') {
                    await RPC.call('/api/custom-page/items/create', form);
                } else {
                    await RPC.call('/api/custom-page/items/update', {
                        id: this.state.modal.editId,
                        ...form,
                    });
                }
                this.closeModal();
                await this.fetchData();
            } catch (e) {
                this.state.modal.error = e.message || 'Gagal menyimpan data.';
            } finally {
                this.state.modal.saving = false;
            }
        }

        closeModal() {
            this.state.modal.open = false;
        }

        // ── Detail view ──────────────────────────────────

        openDetail(item) {
            this.state.detail = { open: true, item };
        }

        closeDetail() {
            this.state.detail.open = false;
        }

        // ── Delete ────────────────────────────────────────

        confirmDelete(item) {
            this.state.deleteConfirm = { open: true, item, deleting: false };
        }

        cancelDelete() {
            this.state.deleteConfirm.open = false;
        }

        async deleteItem() {
            this.state.deleteConfirm.deleting = true;
            try {
                await RPC.call('/api/custom-page/items/delete', {
                    id: this.state.deleteConfirm.item.id,
                });
                this.state.deleteConfirm.open = false;
                await this.fetchData();
            } catch (e) {
                console.error('Delete error:', e);
                this.state.deleteConfirm.deleting = false;
            }
        }

        // ── Formatters ────────────────────────────────────

        statusLabel(status) {
            return { active: 'Aktif', pending: 'Tertunda', inactive: 'Nonaktif' }[status] || status;
        }

        formatDate(dateStr) {
            if (!dateStr) return '—';
            const d = new Date(dateStr);
            if (isNaN(d)) return dateStr;
            return d.toLocaleDateString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric',
            });
        }
    }

    // Daftarkan ke LarasoftPageRegistry
    window.LarasoftPageRegistry = window.LarasoftPageRegistry || {};
    window.LarasoftPageRegistry['my_custom_page'] = MyCustomPage;
})();
