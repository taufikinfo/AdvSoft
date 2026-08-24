// ══════════════════════════════════════════════════════════════
//  MenuEditorView — Odoo-style Menu Item Editor Component
//  Features: tree CRUD, drag-drop, action binding, search
// ══════════════════════════════════════════════════════════════
(function () {
const { Component, useState, onWillStart, onMounted } = owl;
const RPC = window.AdvSoftRPC;

class MenuEditorView extends Component {
    static template = window.TEMPLATES.MenuEditor;
    static props = {};

    setup() {
        this.state = useState({
            loading: true,
            saving: false,
            savingAction: false,
            tree: [],
            stats: null,
            expanded: {},
            searchQuery: '',
            showInactive: false,

            // Dialog state
            dialogOpen: false,
            dialogMode: 'create', // 'create' | 'edit'
            editForm: this._emptyForm(),
            editingId: null,

            // Action create dialog
            actionDialogOpen: false,
            actionForm: { name: '', res_model: '', view_mode: 'list,form' },

            // Binding mode: 'action' | 'model' | 'security' | 'none'
            bindingMode: 'none',

            // Reference data
            availableModels: [],
            availableActions: [],

            // Drag state
            dragItem: null,
            dragOverId: null,

            // Toast
            toast: null,
            toastType: 'info',
        });

        onWillStart(async () => {
            await this.loadTree();
            await this.loadReferenceData();
        });
    }

    // ════════════════════════════════════════════════
    //  Data Loading
    // ════════════════════════════════════════════════

    async loadTree() {
        this.state.loading = true;
        try {
            const data = await RPC.get('/api/menu-editor/tree');
            this.state.tree = data.tree || [];
            this.state.stats = data.stats || {};
            // Auto-expand root items
            for (const item of this.state.tree) {
                this.state.expanded[item.id] = true;
            }
        } catch (e) {
            this.showToast('Failed to load menu tree: ' + e.message, 'error');
        }
        this.state.loading = false;
    }

    async loadReferenceData() {
        try {
            const [models, actions] = await Promise.all([
                RPC.get('/api/menu-editor/available-models'),
                RPC.get('/api/menu-editor/available-actions'),
            ]);
            this.state.availableModels = models || [];
            this.state.availableActions = actions || [];
        } catch (e) {
            console.warn('Failed to load reference data:', e);
        }
    }

    // ════════════════════════════════════════════════
    //  Computed properties
    // ════════════════════════════════════════════════

    get filteredTree() {
        let tree = this.state.tree;
        if (!this.state.showInactive) {
            tree = this._filterActive(tree);
        }
        if (this.state.searchQuery) {
            tree = this._filterBySearch(tree, this.state.searchQuery.toLowerCase());
        }
        return tree;
    }

    /**
     * Flatten the hierarchical tree into a flat array of { item, depth }
     * for rendering. Only includes children that are expanded.
     */
    get flatRows() {
        const rows = [];
        const walk = (items, depth) => {
            for (const item of items) {
                rows.push({ item, depth });
                if (item.children && item.children.length && this.state.expanded[item.id]) {
                    walk(item.children, depth + 1);
                }
            }
        };
        walk(this.filteredTree, 0);
        return rows;
    }

    get flatMenuList() {
        const result = [];
        const flatten = (items, prefix = '') => {
            for (const item of items) {
                const path = prefix ? `${prefix} / ${item.name}` : item.name;
                result.push({ id: item.id, path, name: item.name });
                if (item.children && item.children.length) {
                    flatten(item.children, path);
                }
            }
        };
        flatten(this.state.tree);
        return result;
    }

    // ════════════════════════════════════════════════
    //  Tree Operations
    // ════════════════════════════════════════════════

    toggleExpand(id) {
        this.state.expanded[id] = !this.state.expanded[id];
    }

    expandAll() {
        const expand = (items) => {
            for (const item of items) {
                this.state.expanded[item.id] = true;
                if (item.children) expand(item.children);
            }
        };
        expand(this.state.tree);
    }

    collapseAll() {
        this.state.expanded = {};
    }

    toggleInactiveFilter() {
        this.state.showInactive = !this.state.showInactive;
    }

    onSearch() {
        // Debounced by OWL reactivity
        if (this.state.searchQuery) {
            this.expandAll();
        }
    }

    // ════════════════════════════════════════════════
    //  CRUD: Create
    // ════════════════════════════════════════════════

    openCreateDialog() {
        this.state.editForm = this._emptyForm();
        this.state.editingId = null;
        this.state.dialogMode = 'create';
        this.state.bindingMode = 'none';
        this.state.dialogOpen = true;
    }

    openCreateChild(parent) {
        this.state.editForm = this._emptyForm();
        this.state.editForm.parent_id = String(parent.id);
        this.state.editingId = null;
        this.state.dialogMode = 'create';
        this.state.bindingMode = 'none';
        this.state.dialogOpen = true;
    }

    // ════════════════════════════════════════════════
    //  CRUD: Edit
    // ════════════════════════════════════════════════

    openEditDialog(item) {
        this.state.editForm = {
            name: item.name || '',
            parent_id: item.parent_id ? String(item.parent_id) : '',
            sequence: item.sequence || 10,
            active: item.active !== false,
            action_id: item.action_id ? String(item.action_id) : '',
            model: item.model || '',
            view_type: item.view_type || item.view || 'list',
            icon: item.icon || '',
            web_icon: item.web_icon || '',
            web_icon_color: item.web_icon_color || '#7C3AED',
            groups: item.groups || '',
            security_view: item.security_view || '',
        };
        this.state.editingId = item.id;
        this.state.dialogMode = 'edit';

        // Determine binding mode
        if (item.action_id || item.action) {
            this.state.bindingMode = 'action';
        } else if (item.model) {
            this.state.bindingMode = 'model';
        } else if (item.security_view) {
            this.state.bindingMode = 'security';
        } else {
            this.state.bindingMode = 'none';
        }

        this.state.dialogOpen = true;
    }

    // ════════════════════════════════════════════════
    //  CRUD: Save
    // ════════════════════════════════════════════════

    async saveDialog() {
        if (!this.state.editForm.name.trim()) {
            this.showToast('Menu name is required', 'error');
            return;
        }

        this.state.saving = true;

        // Build payload based on binding mode
        const payload = {
            name: this.state.editForm.name,
            parent_id: this.state.editForm.parent_id ? parseInt(this.state.editForm.parent_id) : null,
            sequence: parseInt(this.state.editForm.sequence) || 10,
            active: this.state.editForm.active,
            icon: this.state.editForm.icon || null,
            web_icon: this.state.editForm.web_icon || null,
            web_icon_color: this.state.editForm.web_icon_color || null,
            groups: this.state.editForm.groups || null,
            action_id: null,
            model: null,
            view_type: null,
            security_view: null,
        };

        if (this.state.bindingMode === 'action') {
            payload.action_id = this.state.editForm.action_id ? parseInt(this.state.editForm.action_id) : null;
        } else if (this.state.bindingMode === 'model') {
            payload.model = this.state.editForm.model || null;
            payload.view_type = this.state.editForm.view_type || 'list';
        } else if (this.state.bindingMode === 'security') {
            payload.security_view = this.state.editForm.security_view || null;
        }

        try {
            if (this.state.dialogMode === 'create') {
                await RPC.call('/api/menu-editor/create', payload);
                this.showToast('Menu item created successfully', 'success');
            } else {
                const csrf = RPC.csrf;
                const res = await fetch(`/api/menu-editor/update/${this.state.editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Update failed');
                }
                this.showToast('Menu item updated successfully', 'success');
            }
            this.closeDialog();
            await this.loadTree();
        } catch (e) {
            this.showToast('Save failed: ' + e.message, 'error');
        }

        this.state.saving = false;
    }

    // ════════════════════════════════════════════════
    //  CRUD: Delete
    // ════════════════════════════════════════════════

    async deleteItem(item) {
        const childCount = this._countChildren(item);
        const msg = childCount > 0
            ? `Delete "${item.name}" and its ${childCount} child item(s)?`
            : `Delete "${item.name}"?`;
        if (!confirm(msg)) return;

        try {
            const csrf = RPC.csrf;
            const res = await fetch(`/api/menu-editor/delete/${item.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
            });
            if (!res.ok) throw new Error('Delete failed');
            this.showToast(`"${item.name}" deleted`, 'success');
            await this.loadTree();
        } catch (e) {
            this.showToast('Delete failed: ' + e.message, 'error');
        }
    }

    // ════════════════════════════════════════════════
    //  Active Toggle
    // ════════════════════════════════════════════════

    async toggleItemActive(item) {
        try {
            await RPC.call('/api/menu-editor/toggle-active', { id: item.id });
            item.active = !item.active;
            this.showToast(`"${item.name}" ${item.active ? 'activated' : 'deactivated'}`, 'info');
        } catch (e) {
            this.showToast('Toggle failed: ' + e.message, 'error');
        }
    }

    // ════════════════════════════════════════════════
    //  Drag & Drop Reordering
    // ════════════════════════════════════════════════

    onDragStart(ev, item) {
        this.state.dragItem = item;
        ev.dataTransfer.effectAllowed = 'move';
        ev.dataTransfer.setData('text/plain', String(item.id));
        // Add visual class
        ev.target.classList.add('dragging');
    }

    onDragOver(ev, overItem) {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'move';
        if (this.state.dragItem && overItem.id !== this.state.dragItem.id) {
            this.state.dragOverId = overItem.id;
        }
    }

    onDragLeave(ev) {
        this.state.dragOverId = null;
    }

    async onDrop(ev, dropTarget) {
        ev.preventDefault();
        this.state.dragOverId = null;
        document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));

        const dragItem = this.state.dragItem;
        this.state.dragItem = null;

        if (!dragItem || dragItem.id === dropTarget.id) return;

        // Move to same parent as drop target, positioned after it
        try {
            await RPC.call('/api/menu-editor/move', {
                menu_id: dragItem.id,
                parent_id: dropTarget.parent_id || null,
                sequence: (dropTarget.sequence || 10) + 5,
            });
            this.showToast(`Moved "${dragItem.name}"`, 'info');
            await this.loadTree();
        } catch (e) {
            this.showToast('Move failed: ' + e.message, 'error');
        }
    }

    // ════════════════════════════════════════════════
    //  Action Quick Create
    // ════════════════════════════════════════════════

    openActionCreate() {
        this.state.actionForm = { name: '', res_model: '', view_mode: 'list,form' };
        this.state.actionDialogOpen = true;
    }

    closeActionDialog() {
        this.state.actionDialogOpen = false;
    }

    async createActionInline() {
        if (!this.state.actionForm.name || !this.state.actionForm.res_model) {
            this.showToast('Action name and model are required', 'error');
            return;
        }

        this.state.savingAction = true;
        try {
            const result = await RPC.call('/api/menu-editor/create-action', this.state.actionForm);
            // Add to available actions
            this.state.availableActions.push(result.action);
            // Auto-select it
            this.state.editForm.action_id = String(result.action.id);
            this.showToast('Action created: ' + result.action.name, 'success');
            this.closeActionDialog();
        } catch (e) {
            this.showToast('Create action failed: ' + e.message, 'error');
        }
        this.state.savingAction = false;
    }

    // ════════════════════════════════════════════════
    //  Dialog helpers
    // ════════════════════════════════════════════════

    closeDialog() {
        this.state.dialogOpen = false;
        this.state.editingId = null;
    }

    _emptyForm() {
        return {
            name: '',
            parent_id: '',
            sequence: 10,
            active: true,
            action_id: '',
            model: '',
            view_type: 'list',
            icon: '',
            web_icon: '',
            web_icon_color: '#7C3AED',
            groups: '',
            security_view: '',
        };
    }

    // ════════════════════════════════════════════════
    //  Filtering helpers
    // ════════════════════════════════════════════════

    _filterActive(items) {
        return items.filter(item => item.active !== false).map(item => ({
            ...item,
            children: item.children ? this._filterActive(item.children) : [],
        }));
    }

    _filterBySearch(items, query) {
        const result = [];
        for (const item of items) {
            const nameMatch = (item.name || '').toLowerCase().includes(query);
            const modelMatch = (item.model || '').toLowerCase().includes(query);
            const actionMatch = (item.action?.res_model || '').toLowerCase().includes(query);
            const filteredChildren = item.children ? this._filterBySearch(item.children, query) : [];

            if (nameMatch || modelMatch || actionMatch || filteredChildren.length > 0) {
                result.push({ ...item, children: filteredChildren });
            }
        }
        return result;
    }

    _countChildren(item) {
        let count = 0;
        if (item.children) {
            count = item.children.length;
            for (const child of item.children) {
                count += this._countChildren(child);
            }
        }
        return count;
    }

    // ════════════════════════════════════════════════
    //  Toast notification
    // ════════════════════════════════════════════════

    showToast(message, type = 'info') {
        this.state.toast = message;
        this.state.toastType = type;
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            this.state.toast = null;
        }, 3500);
    }
}

// Export globally
window.MenuEditorView = MenuEditorView;
})();
