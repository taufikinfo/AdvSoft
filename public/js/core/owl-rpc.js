// AdvSoft RPC Service – Odoo-style JSON-RPC communication layer
(function () {
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content
        || window.__CSRF_TOKEN__ || '';

    async function post(url, data = {}) {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            const e = new Error(err.error || err.message || 'RPC Error');
            e.serverError = err; // Simpan payload error backend (trace, file, line)
            throw e;
        }
        return res.json();
    }

    async function get(url) {
        const res = await fetch(url, {
            headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf },
        });
        return res.json();
    }

    // In-memory cache for static/semi-static metadata
    const _cache = {
        fields: {},        // model -> fieldsGet
        views: {},         // `${model}:${viewType}` -> getView
        loadViews: {},     // model -> loadViews result
        filters: {},       // model -> saved filters
        reportActions: {}, // model -> report actions
        nameSearch: {},    // model -> empty-query nameSearch results
    };

    // In-flight promise tracker to deduplicate simultaneous requests
    const _inFlight = new Map();

    function dedupe(key, fetcher) {
        if (_inFlight.has(key)) {
            return _inFlight.get(key);
        }
        const promise = fetcher().finally(() => {
            _inFlight.delete(key);
        });
        _inFlight.set(key, promise);
        return promise;
    }

    window.AdvSoftRPC = window.AdvSoftRPC || window.AdvsoftRPC || window.LarasoftRPC || {};
    window.AdvsoftRPC = window.AdvSoftRPC;
    window.LarasoftRPC = window.AdvSoftRPC;
    Object.assign(window.AdvSoftRPC, {
        csrf,
        _cache,

        // ── Auth ─────────────────────────────────────
        async login(login, password) {
            const res = await post('/api/auth/login', { login, password });
            if (res.success) {
                window.AdvSoftUser = res.user;
                window.AdvsoftUser = res.user;
                window.LarasoftUser = res.user;
            }
            return res;
        },
        async logout() {
            const res = await post('/api/auth/logout', {});
            window.AdvSoftUser = { uid: null };
            window.AdvsoftUser = { uid: null };
            window.LarasoftUser = { uid: null };
            return res;
        },
        async me() {
            const res = await get('/api/auth/me');
            window.AdvSoftUser = res.user || {};
            return res;
        },
        async loadMenu() {
            return get('/api/auth/menu');
        },

        // ── Generic call ──────────────────────────
        call: post,
        get: (url) => get(url),

        // ── Core ORM methods ──────────────────────
        searchRead(model, domain = [], opts = {}) {
            return post('/api/orm/search_read', {
                model, domain,
                order: opts.order, limit: opts.limit,
                offset: opts.offset, group_by: opts.group_by,
            });
        },

        read(model, id) {
            return post('/api/orm/read', { model, id });
        },

        create(model, values) {
            return post('/api/orm/create', { model, values });
        },

        write(model, ids, values) {
            return post('/api/orm/write', { model, ids, values });
        },

        unlink(model, ids) {
            return post('/api/orm/unlink', { model, ids });
        },

        // ── High Performance Batch & Cached Metadata ─
        async loadViews(model, views = ['search', 'list', 'form', 'kanban', 'calendar', 'graph', 'pivot', 'spreadsheet'], force = false) {
            if (!force && _cache.loadViews[model]) {
                return _cache.loadViews[model];
            }
            return dedupe('load_views:' + model, async () => {
                const res = await post('/api/orm/load_views', { model, views });
                _cache.loadViews[model] = res;
                if (res.fields) {
                    _cache.fields[model] = res.fields;
                }
                if (res.views) {
                    for (const [vt, def] of Object.entries(res.views)) {
                        _cache.views[`${model}:${vt}`] = def;
                    }
                }
                if (res.filters) {
                    _cache.filters[model] = res.filters;
                }
                return res;
            });
        },

        async fieldsGet(model, force = false) {
            if (!force && _cache.fields[model]) {
                return _cache.fields[model];
            }
            if (!force && _inFlight.has('load_views:' + model)) {
                try {
                    await _inFlight.get('load_views:' + model);
                    if (_cache.fields[model]) return _cache.fields[model];
                } catch(e) {}
            }
            return dedupe('fields_get:' + model, async () => {
                const res = await post('/api/orm/fields_get', { model });
                _cache.fields[model] = res;
                return res;
            });
        },

        async getView(model, viewType, force = false) {
            const cacheKey = `${model}:${viewType}`;
            if (!force && _cache.views[cacheKey]) {
                return _cache.views[cacheKey];
            }
            if (!force && _inFlight.has('load_views:' + model)) {
                try {
                    await _inFlight.get('load_views:' + model);
                    if (_cache.views[cacheKey]) return _cache.views[cacheKey];
                } catch(e) {}
            }
            return dedupe('get_view:' + cacheKey, async () => {
                const res = await post('/api/orm/get_view', { model, view_type: viewType });
                _cache.views[cacheKey] = res;
                return res;
            });
        },

        async getReportActions(model, force = false) {
            if (!force && _cache.reportActions[model]) {
                return _cache.reportActions[model];
            }
            return dedupe('report_actions:' + model, async () => {
                const res = await get('/api/report/actions?model=' + encodeURIComponent(model));
                _cache.reportActions[model] = res;
                return res;
            });
        },

        async getFilters(model, force = false) {
            if (!force && _cache.filters[model]) {
                return _cache.filters[model];
            }
            if (!force && _inFlight.has('load_views:' + model)) {
                try {
                    await _inFlight.get('load_views:' + model);
                    if (_cache.filters[model]) return _cache.filters[model];
                } catch(e) {}
            }
            return dedupe('filters:' + model, async () => {
                const res = await get('/api/filters?model=' + encodeURIComponent(model));
                _cache.filters[model] = res;
                return res;
            });
        },

        async nameSearch(model, query = '', limit = 20, force = false) {
            if (!force && query === '' && _cache.nameSearch[model]) {
                return _cache.nameSearch[model];
            }
            return dedupe(`name_search:${model}:${query}:${limit}`, async () => {
                const res = await post('/api/orm/name_search', { model, query, limit });
                if (query === '') {
                    _cache.nameSearch[model] = res;
                }
                return res;
            });
        },

        clearMetadataCache(model = null) {
            if (model) {
                delete _cache.fields[model];
                delete _cache.loadViews[model];
                delete _cache.filters[model];
                delete _cache.reportActions[model];
                delete _cache.nameSearch[model];
                for (const k of Object.keys(_cache.views)) {
                    if (k.startsWith(model + ':')) delete _cache.views[k];
                }
            } else {
                _cache.fields = {};
                _cache.views = {};
                _cache.loadViews = {};
                _cache.filters = {};
                _cache.reportActions = {};
                _cache.nameSearch = {};
            }
        },

        defaultGet(model) {
            return post('/api/orm/default_get', { model });
        },

        readGroup(model, domain = [], groupBy = [], measures = []) {
            return post('/api/orm/read_group', { model, domain, group_by: groupBy, measures });
        },

        onchange(model, field, values) {
            return post('/api/orm/onchange', { model, field, values });
        },

        call_button(model, id, method) {
            return post('/api/orm/call_button', { model, id, method });
        },

        quickCreate(model, name) {
            return post('/api/orm/quick_create', { model, name });
        },

        quickCreate(model, name) {
            return post('/api/orm/quick_create', { model, name });
        },

        // ── One2many child CRUD (ACL enforced) ─────
        createChild(parentModel, field, values, context = null) {
            return post('/api/orm/create_child', { parent_model: parentModel, field, values, context });
        },

        async updateChild(childModel, id, values, writeDate = null) {
            const res = await fetch(`/api/orm/update_child/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
                body: JSON.stringify({ child_model: childModel, values, write_date: writeDate }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: res.statusText }));
                throw new Error(err.error || 'Update failed');
            }
            return res.json();
        },

        async deleteChild(childModel, id) {
            const res = await fetch(`/api/orm/delete_child/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
                body: JSON.stringify({ child_model: childModel }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: res.statusText }));
                throw new Error(err.error || 'Delete failed');
            }
            return res.json();
        },

        // ── O2M advanced endpoints ─────────────────
        onchangeO2m(childModel, changedField, values, context = {}) {
            return post('/api/orm/onchange_o2m', { child_model: childModel, changed_field: changedField, values, context });
        },

        loadO2m(parentModel, field, parentId, opts = {}) {
            return post('/api/orm/load_o2m', {
                parent_model: parentModel,
                field,
                parent_id: parentId,
                domain: opts.domain || [],
                offset: opts.offset || 0,
                limit: opts.limit || 80,
                order: opts.order || null,
            });
        },

        loadO2mGrouped(parentModel, field, parentId, opts = {}) {
            return post('/api/orm/load_o2m_grouped', {
                parent_model: parentModel,
                field,
                parent_id: parentId,
                group_by: opts.group_by,
                aggregate_fields: opts.aggregate_fields || [],
                domain: opts.domain || [],
                load_records: opts.load_records !== false,
                limit: opts.limit || 40,
            });
        },

        bulkCreateChild(parentModel, field, records) {
            return post('/api/orm/bulk_create_child', { parent_model: parentModel, field, records });
        },

        bulkDeleteChild(childModel, ids) {
            return post('/api/orm/bulk_delete_child', { child_model: childModel, ids });
        },

        bulkWriteChild(childModel, ids, values) {
            return post('/api/orm/bulk_write_child', { child_model: childModel, ids, values });
        },

        reorderO2m(childModel, sequenceField, orderedIds) {
            return post('/api/orm/reorder_o2m', { child_model: childModel, sequence_field: sequenceField, ordered_ids: orderedIds });
        },

        callButtonO2m(childModel, id, method) {
            return post('/api/orm/call_button_o2m', { child_model: childModel, id, method });
        },

        printO2m(parentModel, field, parentId) {
            return post('/api/orm/print_o2m', { parent_model: parentModel, field, parent_id: parentId });
        },

        // ── Model introspection ──────────────────────
        defaultGet(model, fields = null) {
            return post('/api/orm/default_get', { model, fields });
        },

        modelInfo(model) {
            return post('/api/orm/model_info', { model });
        },

        // ── Menu/Action ──────────────────────────────
        loadMenus() {
            return get('/api/orm/load_menus');
        },

        loadAction(actionId) {
            return post('/api/orm/load_action', { action_id: actionId });
        },

        // ── Saved Filters ────────────────────────────
        getFilters(model) {
            return get(`/api/filters?model=${model}`);
        },

        saveFilter(data) {
            return post('/api/filters', data);
        },

        // ── Profile (own res.users record) ───────────
        async updateProfile(values) {
            const res = await post('/profile', { ...values, _ajax: 1 });
            if (res.success) {
                window.AdvSoftUser = res.user;
                window.AdvsoftUser = res.user;
                window.LarasoftUser = res.user;
            }
            return res;
        },

        async changePassword(current, next, confirmation) {
            return post('/profile/password', {
                current_password: current,
                password: next,
                password_confirmation: confirmation,
                _ajax: 1,
            });
        },
    });
})();
