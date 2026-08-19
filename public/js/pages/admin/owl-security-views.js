// ══════════════════════════════════════════════════════════════════
//  Larasoft Security Management UI
//  4 components: AccessRights (matrix), RecordRules, Groups, Users
//  Each is a full Odoo-style view with list+form switching.
// ══════════════════════════════════════════════════════════════════
(function () {
const { Component, useState, useRef, onWillStart, onMounted } = owl;
const RPC = window.LarasoftRPC;
const icons = window.LarasoftIcons;

const PERM_COLS = [
    { key: 'r', label: 'Read',   short: 'R', color: '#059669' },
    { key: 'w', label: 'Write',  short: 'W', color: '#2563eb' },
    { key: 'c', label: 'Create', short: 'C', color: '#7c3aed' },
    { key: 'u', label: 'Delete', short: 'D', color: '#dc2626' },
];

function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ═══════════════════════════════════════════════════════════════
//  0. SECURITY OVERVIEW
// ═══════════════════════════════════════════════════════════════
class SecurityOverview extends Component {
    static template = window.TEMPLATES.securityOverview;
    static props = {};

    setup() {
        this.state = useState({
            loading: true,
            data: {
                counts: { users: 0, groups: 0, models: 0, acl_rules: 0, record_rules: 0 },
                top_users: []
            }
        });
        onMounted(() => this.load());
    }

    async load() {
        this.state.loading = true;
        try {
            const res = await RPC.get('/api/security/overview');
            if (res && res.counts) {
                this.state.data = res;
            }
        } catch (e) {
            console.error('Load overview failed', e);
        }
        this.state.loading = false;
    }
}
window.SecurityOverview = SecurityOverview;

// ═══════════════════════════════════════════════════════════════
//  1. ACCESS RIGHTS MATRIX — the iconic Odoo grid view
// ═══════════════════════════════════════════════════════════════
class AccessRights extends Component {
    static template = window.TEMPLATES.accessRights;
    static props = {};

    setup() {
        this.state = useState({
            loading: true,
            groups: [],
            models: [],
            cells:  {},
            filter: '',
            selectedModule: 'all',
            saving: {},
            showCreate: false,
            newModel: { model: '', name: '' },
        });
        onMounted(() => this.load());
    }

    get modules() {
        const set = new Set(this.state.models.map(m => m.module || 'larasoft'));
        return Array.from(set).sort();
    }

    get filteredModels() {
        const term = this.state.filter.toLowerCase();
        const mod = this.state.selectedModule;
        return this.state.models.filter(m => {
            if (mod !== 'all' && (m.module || 'larasoft') !== mod) return false;
            if (!term) return true;
            return m.model.toLowerCase().includes(term) ||
                   (m.name || '').toLowerCase().includes(term);
        });
    }

    get filteredGroups() {
        const term = this.state.filter.toLowerCase();
        if (!term) return this.state.groups;
        return this.state.groups.filter(g => g.name.toLowerCase().includes(term));
    }

    getCell(modelId, groupId) {
        return this.state.cells[modelId + ':' + groupId] || null;
    }

    isSaving(modelId, groupId, perm) {
        return !!this.state.saving[modelId + ':' + groupId + ':' + perm];
    }

    async load() {
        this.state.loading = true;
        try {
            const res = await RPC.get('/api/security/acl/matrix');
            this.state.groups = res.groups;
            this.state.models = res.models;
            this.state.cells  = res.cells;
        } catch (e) {
            console.error('Load matrix failed', e);
            alert('Failed to load ACL matrix: ' + e.message);
        }
        this.state.loading = false;
    }

    async toggleCell(modelId, groupId, perm, currentValue) {
        const key = modelId + ':' + groupId + ':' + perm;
        this.state.saving[key] = true;
        try {
            const res = await RPC.call('/api/security/acl/toggle', {
                model_id: modelId, group_id: groupId, perm, value: !currentValue,
            });
            const cellKey = modelId + ':' + groupId;
            const existing = this.state.cells[cellKey] || {
                r: false, w: false, c: false, u: false, group_id: groupId,
            };
            this.state.cells[cellKey] = {
                ...existing,
                ...res.cell,
                acl_id: res.acl_id,
                group_id: groupId,
            };
        } catch (e) {
            alert('Toggle failed: ' + e.message);
        }
        this.state.saving[key] = false;
    }

    async syncModels() {
        if (!confirm('Re-discover all Odoo model definitions and register them in ir.model?')) return;
        try {
            const res = await RPC.call('/api/security/sync-models', {});
            alert(`Synced: discovered=${res.discovered}, in db=${res.in_database}`);
            await this.load();
        } catch (e) {
            alert('Sync failed: ' + e.message);
        }
    }

    permColor(permKey) {
        return (PERM_COLS.find(p => p.key === permKey) || {}).color || '#6b7280';
    }
}

window.AccessRights = AccessRights;

// ═══════════════════════════════════════════════════════════════
//  2. RECORD RULES — tree + form with domain editor
// ═══════════════════════════════════════════════════════════════
class RecordRules extends Component {
    static template = window.TEMPLATES.recordRules;
    static props = {};

    setup() {
        this.state = useState({
            mode: 'list',              // 'list' | 'form'
            records: [],
            loading: true,
            search: '',
            current: null,             // form values
            models: [],                // for model_id select
            groups: [],                // for groups M2M
            error: '',
            saving: false,
        });
        onMounted(() => this.load());
    }

    async load() {
        this.state.loading = true;
        try {
            const [rules, models, groups] = await Promise.all([
                RPC.searchRead('ir.rule', [], { order: 'id asc', limit: 200 }),
                RPC.nameSearch('ir.model', '', 200),
                RPC.nameSearch('res.groups', '', 200),
            ]);
            this.state.records = rules.records || [];
            this.state.models  = models.results || models;
            this.state.groups  = groups.results || groups;
        } catch (e) {
            alert('Load failed: ' + e.message);
        }
        this.state.loading = false;
    }

    get filteredRecords() {
        const q = this.state.search.toLowerCase();
        if (!q) return this.state.records;
        return this.state.records.filter(r =>
            (r.name || '').toLowerCase().includes(q) ||
            (r.model_id && String(r.model_id[1] || '').toLowerCase().includes(q))
        );
    }

    newRecord() {
        this.state.current = {
            name: '',
            model_id: false,
            domain_force: '[]',
            global: false,
            groups: [],
            perm_read: true,
            perm_write: false,
            perm_create: false,
            perm_unlink: false,
            active: true,
        };
        this.state.mode = 'form';
        this.state.error = '';
    }

    editRecord(rec) {
        this.state.current = {
            id: rec.id,
            name: rec.name || '',
            model_id: rec.model_id ? rec.model_id[0] : false,
            domain_force: rec.domain_force || '[]',
            global: !!rec.global,
            groups: Array.isArray(rec.groups) ? rec.groups.map(g => (g && typeof g === 'object' && !Array.isArray(g)) ? g.id : (Array.isArray(g) ? g[0] : g)) : [],
            perm_read: !!rec.perm_read,
            perm_write: !!rec.perm_write,
            perm_create: !!rec.perm_create,
            perm_unlink: !!rec.perm_unlink,
            active: rec.active === undefined ? true : !!rec.active,
        };
        this.state.mode = 'form';
        this.state.error = '';
    }

    backToList() {
        this.state.mode = 'list';
        this.state.current = null;
    }

    async save() {
        const c = this.state.current;
        if (!c.name.trim()) { this.state.error = 'Name is required.'; return; }
        if (!c.model_id)    { this.state.error = 'Model is required.'; return; }
        if (!c.domain_force.trim()) { this.state.error = 'Domain is required.'; return; }

        this.state.saving = true;
        this.state.error = '';
        try {
            const vals = {
                name: c.name,
                model_id: c.model_id,
                domain_force: c.domain_force,
                global: c.global,
                groups: [[6, 0, c.groups]],   // M2M replace
                perm_read: c.perm_read,
                perm_write: c.perm_write,
                perm_create: c.perm_create,
                perm_unlink: c.perm_unlink,
                active: c.active,
            };
            if (c.id) {
                await RPC.write('ir.rule', [c.id], vals);
            } else {
                await RPC.create('ir.rule', vals);
            }
            await this.load();
            this.backToList();
        } catch (e) {
            this.state.error = e.message || String(e);
        }
        this.state.saving = false;
    }

    async deleteRecord(rec) {
        if (!confirm(`Delete rule "${rec.name}"?`)) return;
        try {
            await RPC.unlink('ir.rule', [rec.id]);
            await this.load();
        } catch (e) {
            alert('Delete failed: ' + e.message);
        }
    }

    toggleGroupInForm(gid) {
        const i = this.state.current.groups.indexOf(gid);
        if (i >= 0) this.state.current.groups.splice(i, 1);
        else this.state.current.groups.push(gid);
    }

    insertPlaceholder(ph) {
        this.state.current.domain_force += ph;
    }

    // Predefined domain templates
    insertTemplate(tpl) {
        this.state.current.domain_force = tpl;
    }
}

window.RecordRules = RecordRules;

// ═══════════════════════════════════════════════════════════════
//  3. GROUPS — tree + form + users
// ═══════════════════════════════════════════════════════════════
class GroupsView extends Component {
    static template = window.TEMPLATES.groupsView;
    static props = {};

    setup() {
        this.state = useState({
            mode: 'list',
            records: [],
            loading: true,
            search: '',
            current: null,
            categories: [],
            groups: [],
            error: '',
            saving: false,
            groupUsers: null,
        });
        onMounted(() => this.load());
    }

    async load() {
        this.state.loading = true;
        try {
            const [groups, categories, allGroups] = await Promise.all([
                RPC.searchRead('res.groups', [], { order: 'name asc', limit: 200 }),
                RPC.searchRead('res.groups.category', [], { order: 'name asc', limit: 100 }),
                RPC.nameSearch('res.groups', '', 200),
            ]);
            this.state.records   = groups.records || [];
            this.state.categories = categories.records || [];
            this.state.groups    = allGroups.results || allGroups;
        } catch (e) {
            alert('Load failed: ' + e.message);
        }
        this.state.loading = false;
    }

    get filteredRecords() {
        const q = this.state.search.toLowerCase();
        if (!q) return this.state.records;
        return this.state.records.filter(r =>
            (r.name || '').toLowerCase().includes(q) ||
            (r.description || '').toLowerCase().includes(q)
        );
    }

    newRecord() {
        this.state.current = {
            name: '',
            description: '',
            category_id: false,
            share: false,
            implied_ids: [],
        };
        this.state.mode = 'form';
        this.state.error = '';
        this.state.groupUsers = null;
    }

    editRecord(rec) {
        this.state.current = {
            id: rec.id,
            name: rec.name || '',
            description: rec.description || '',
            category_id: rec.category_id ? (Array.isArray(rec.category_id) ? rec.category_id[0] : (typeof rec.category_id === 'object' ? rec.category_id.id : rec.category_id)) : false,
            share: !!rec.share,
            implied_ids: Array.isArray(rec.implied_ids) ? rec.implied_ids.map(g => (g && typeof g === 'object' && !Array.isArray(g)) ? g.id : (Array.isArray(g) ? g[0] : g)) : [],
        };
        this.state.mode = 'form';
        this.state.error = '';
        this.loadGroupUsers(rec.id);
    }

    async loadGroupUsers(gid) {
        try {
            const res = await RPC.get('/api/security/groups/' + gid + '/users');
            this.state.groupUsers = res;
        } catch { this.state.groupUsers = null; }
    }

    backToList() {
        this.state.mode = 'list';
        this.state.current = null;
        this.state.groupUsers = null;
    }

    async save() {
        const c = this.state.current;
        if (!c.name.trim()) { this.state.error = 'Name is required.'; return; }
        this.state.saving = true;
        this.state.error = '';
        try {
            const vals = {
                name: c.name,
                description: c.description,
                category_id: c.category_id || false,
                share: c.share,
                implied_ids: [[6, 0, c.implied_ids]],
            };
            if (c.id) {
                await RPC.write('res.groups', [c.id], vals);
            } else {
                const res = await RPC.create('res.groups', vals);
                c.id = res.id;
            }
            await this.load();
            this.state.mode = 'form';   // stay in form to view users
            this.loadGroupUsers(c.id);
        } catch (e) {
            this.state.error = e.message || String(e);
        }
        this.state.saving = false;
    }

    async deleteRecord(rec) {
        if (!confirm(`Delete group "${rec.name}"?\nUsers in this group will lose its permissions.`)) return;
        try {
            await RPC.unlink('res.groups', [rec.id]);
            await this.load();
        } catch (e) {
            alert('Delete failed: ' + e.message);
        }
    }

    toggleImplied(gid) {
        const i = this.state.current.implied_ids.indexOf(gid);
        if (i >= 0) this.state.current.implied_ids.splice(i, 1);
        else this.state.current.implied_ids.push(gid);
    }
}

window.GroupsView = GroupsView;

// ═══════════════════════════════════════════════════════════════
//  4. USERS — tree + form + groups + admin password reset
// ═══════════════════════════════════════════════════════════════
class UsersView extends Component {
    static template = window.TEMPLATES.usersView;
    static props = {};

    setup() {
        this.state = useState({
            mode: 'list',
            records: [],
            loading: true,
            search: '',
            current: null,
            groups: [],
            companies: [],
            error: '',
            saving: false,
            showPasswordReset: false,
            passwordForm: { password: '', password_confirmation: '' },
            passwordMessage: '',
        });
        onMounted(() => this.load());
    }

    async load() {
        this.state.loading = true;
        try {
            const [users, groups, companies] = await Promise.all([
                RPC.searchRead('res.users', [], { order: 'login asc', limit: 200 }),
                RPC.nameSearch('res.groups', '', 200),
                RPC.nameSearch('res.company', '', 50),
            ]);
            this.state.records  = users.records || [];
            this.state.groups   = groups.results || groups;
            this.state.companies = companies.results || companies;
        } catch (e) {
            alert('Load failed: ' + e.message);
        }
        this.state.loading = false;
    }

    get filteredRecords() {
        const q = this.state.search.toLowerCase();
        if (!q) return this.state.records;
        return this.state.records.filter(r =>
            (r.login || '').toLowerCase().includes(q) ||
            (r.name || '').toLowerCase().includes(q) ||
            (r.email || '').toLowerCase().includes(q)
        );
    }

    newRecord() {
        this.state.current = {
            login: '',
            name: '',
            email: '',
            company_id: false,
            active: true,
            share: false,
            signature: '',
            group_ids: [],
            password: '',
        };
        this.state.mode = 'form';
        this.state.error = '';
        this.state.showPasswordReset = false;
    }

    editRecord(rec) {
        this.state.current = {
            id: rec.id,
            login: rec.login,
            name: rec.name || '',
            email: rec.email || '',
            company_id: rec.company_id ? (Array.isArray(rec.company_id) ? rec.company_id[0] : (typeof rec.company_id === 'object' ? rec.company_id.id : rec.company_id)) : false,
            active: rec.active === undefined ? true : !!rec.active,
            share: !!rec.share,
            signature: rec.signature || '',
            group_ids: Array.isArray(rec.groups_id) ? rec.groups_id.map(g => (g && typeof g === 'object' && !Array.isArray(g)) ? g.id : (Array.isArray(g) ? g[0] : g)) : [],
            password: '',
        };
        this.state.mode = 'form';
        this.state.error = '';
        this.state.showPasswordReset = false;
    }

    backToList() {
        this.state.mode = 'list';
        this.state.current = null;
        this.state.showPasswordReset = false;
    }

    async save() {
        const c = this.state.current;
        if (!c.login.trim()) { this.state.error = 'Login is required.'; return; }
        if (!c.id && !c.password) { this.state.error = 'Password is required for new users.'; return; }

        this.state.saving = true;
        this.state.error = '';
        try {
            const vals = {
                login: c.login,
                name: c.name,
                email: c.email,
                company_id: c.company_id || false,
                active: c.active,
                share: c.share,
                signature: c.signature,
                groups_id: [[6, 0, c.group_ids]],
            };
            if (c.id) {
                await RPC.write('res.users', [c.id], vals);
            } else {
                vals.password = c.password;
                const res = await RPC.create('res.users', vals);
                c.id = res.id;
            }
            // Sync groups separately (M2M through relation table)
            await RPC.call('/api/security/users/' + c.id + '/groups', {
                group_ids: c.group_ids,
            });
            await this.load();
        } catch (e) {
            this.state.error = e.message || String(e);
        }
        this.state.saving = false;
    }

    async deleteRecord(rec) {
        if (!confirm(`Delete user "${rec.login}"?`)) return;
        try {
            await RPC.unlink('res.users', [rec.id]);
            await this.load();
        } catch (e) {
            alert('Delete failed: ' + e.message);
        }
    }

    toggleGroupInForm(gid) {
        const i = this.state.current.group_ids.indexOf(gid);
        if (i >= 0) this.state.current.group_ids.splice(i, 1);
        else this.state.current.group_ids.push(gid);
    }

    openPasswordReset() {
        this.state.showPasswordReset = true;
        this.state.passwordForm = { password: '', password_confirmation: '' };
        this.state.passwordMessage = '';
    }

    async submitPasswordReset() {
        const f = this.state.passwordForm;
        if (f.password.length < 6) {
            this.state.passwordMessage = 'Password must be at least 6 characters.';
            return;
        }
        if (f.password !== f.password_confirmation) {
            this.state.passwordMessage = 'Passwords do not match.';
            return;
        }
        try {
            await RPC.call('/api/security/users/' + this.state.current.id + '/password', {
                password: f.password,
                password_confirmation: f.password_confirmation,
            });
            this.state.passwordMessage = 'Password reset successfully.';
            this.state.passwordForm = { password: '', password_confirmation: '' };
        } catch (e) {
            this.state.passwordMessage = 'Error: ' + e.message;
        }
    }
}

window.UsersView = UsersView;
})();
