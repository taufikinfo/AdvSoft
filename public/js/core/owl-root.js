// ══════════════════════════════════════════════════════════════════
//  WebClient — Odoo-style menu-driven SPA with multi-view support
//  Components: AppSwitcher, NavBar, SubMenu, Breadcrumb, WebClient
(function () {
    const { Component, useState, useRef, onWillStart, onMounted, onError } = owl;
    const RPC = window.AdvSoftRPC;

    // View type icons (SVG inline)
    const VIEW_ICONS = {
        list: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
        kanban: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
        calendar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        graph: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
        pivot: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>',
        spreadsheet: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>',
    };

    const VIEW_LABELS = {
        list: 'List', kanban: 'Kanban', calendar: 'Calendar',
        graph: 'Graph', pivot: 'Pivot', form: 'Form', spreadsheet: 'Spreadsheet',
    };

    // Global Page Registry
    window.AdvSoftPageRegistry = Object.assign({
        'security_overview': window.SecurityOverview,
        'security_access': window.AccessRights,
        'security_rules': window.RecordRules,
        'security_groups': window.GroupsView,
        'security_users': window.UsersView,
        'menu_editor': window.MenuEditorView,
        'view_builder': window.ViewBuilderView,
        'accounting_reports': window.AccountingReports,
    }, window.AdvSoftPageRegistry || {});
    window.AdvsoftPageRegistry = window.AdvSoftPageRegistry;
    window.LarasoftPageRegistry = window.AdvSoftPageRegistry;

    window.registerCustomPage = function(viewId, componentClass) {
        window.AdvSoftPageRegistry[viewId] = componentClass;
    };

    // ── App Theme Palette Helper for Odoo Enterprise Look ─
    function getAppVisuals(app) {
        const name = (app.name || '').toLowerCase();
        const icon = (app.web_icon || app.icon || '').toLowerCase();
        
        if (name.includes('project') || icon.includes('briefcase') || icon.includes('layers')) {
            return {
                gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                glow: 'rgba(139, 92, 246, 0.45)',
                icon: 'layers',
            };
        }
        if (name.includes('account') || name.includes('invoic') || name.includes('finance') || icon.includes('book')) {
            return {
                gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                glow: 'rgba(16, 185, 129, 0.45)',
                icon: 'book-open',
            };
        }
        if (name.includes('showcase') || icon.includes('eye')) {
            return {
                gradient: 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
                glow: 'rgba(6, 182, 212, 0.45)',
                icon: 'sparkles',
            };
        }
        if (name.includes('security') || name.includes('user') || icon.includes('shield') || icon.includes('lock')) {
            return {
                gradient: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)',
                glow: 'rgba(244, 63, 94, 0.45)',
                icon: 'shield-check',
            };
        }
        if (name.includes('spreadsheet') || icon.includes('sheet') || icon.includes('table')) {
            return {
                gradient: 'linear-gradient(135deg, #059669 0%, #064E3B 100%)',
                glow: 'rgba(5, 150, 105, 0.45)',
                icon: 'file-spreadsheet',
            };
        }
        if (name.includes('setting') || name.includes('admin') || icon.includes('settings')) {
            return {
                gradient: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
                glow: 'rgba(99, 102, 241, 0.45)',
                icon: 'settings',
            };
        }

        if (app.web_icon_color) {
            return {
                gradient: `linear-gradient(135deg, ${app.web_icon_color} 0%, #4C1D95 100%)`,
                glow: app.web_icon_color + '77',
                icon: app.web_icon || app.icon || 'box',
            };
        }

        return {
            gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            glow: 'rgba(139, 92, 246, 0.45)',
            icon: app.web_icon || app.icon || 'box',
        };
    }

    // ── AppSwitcher Component ────────────────────────────
    class AppSwitcher extends Component {
        static template = window.TEMPLATES.AppSwitcher;
        static props = {
            apps: { type: Array },
            onAppClick: { type: Function },
            onMenuClick: { type: Function, optional: true },
        };

        setup() {
            this.state = useState({
                searchQuery: '',
            });
            this.searchInputRef = useRef('searchInput');

            this._onKeyDown = (ev) => {
                const tag = ev.target.tagName;
                if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
                    if (ev.key === 'Escape') {
                        this.state.searchQuery = '';
                        this.searchInputRef.el?.blur();
                    } else if (ev.key === 'Enter') {
                        this.openSelected();
                    }
                    return;
                }
                // If user pressed '/' or starts typing an alphanumeric key on home screen, focus search
                if (ev.key === '/' || (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey)) {
                    if (ev.key === '/') ev.preventDefault();
                    if (this.searchInputRef.el) {
                        this.searchInputRef.el.focus();
                    }
                }
            };

            onMounted(() => {
                window.addEventListener('keydown', this._onKeyDown);
                setTimeout(() => this.searchInputRef.el?.focus(), 80);
            });

            owl.onWillDestroy(() => {
                window.removeEventListener('keydown', this._onKeyDown);
            });
        }

        get filteredApps() {
            const q = this.state.searchQuery.trim().toLowerCase();
            if (!q) return this.props.apps || [];
            return (this.props.apps || []).filter(app => {
                return (app.name || '').toLowerCase().includes(q);
            });
        }

        get matchingMenuItems() {
            const q = this.state.searchQuery.trim().toLowerCase();
            if (!q) return [];
            const results = [];
            const collect = (items, path) => {
                for (const item of items) {
                    const currentPath = path ? `${path} / ${item.name}` : item.name;
                    if ((item.name || '').toLowerCase().includes(q)) {
                        results.push({ ...item, fullPath: currentPath });
                    }
                    if (item.children && item.children.length) {
                        collect(item.children, currentPath);
                    }
                }
            };
            for (const app of this.props.apps || []) {
                if (app.children && app.children.length) {
                    collect(app.children, app.name);
                }
            }
            return results.slice(0, 12);
        }

        getAppVisuals(app) {
            return getAppVisuals(app);
        }

        onAppClick(app) {
            this.props.onAppClick(app);
        }

        onMenuItemClick(item) {
            if (this.props.onMenuClick) {
                this.props.onMenuClick(item);
            }
        }

        openSelected() {
            const apps = this.filteredApps;
            if (apps.length > 0) {
                this.onAppClick(apps[0]);
            } else if (this.matchingMenuItems.length > 0) {
                this.onMenuItemClick(this.matchingMenuItems[0]);
            }
        }

        clearSearch() {
            this.state.searchQuery = '';
            this.searchInputRef.el?.focus();
        }
    }

    // ── NavBar Component (Top Navigation) ───────────────
    class NavBar extends Component {
        static template = window.TEMPLATES.NavBar;
        static props = {
            apps: { type: Array },
            activeAppId: { type: Number, optional: true },
            onAppClick: { type: Function },
            onHome: { type: Function },
            onOpenProfile: { type: Function, optional: true },
            isHome: { type: Boolean, optional: true },
        };

        onAppClick(app) { this.props.onAppClick(app); }
        onProfileClick(ev) {
            if (ev) ev.preventDefault();
            const uid = window.AdvSoftUser?.uid || 1;
            if (this.props.onOpenProfile) {
                this.props.onOpenProfile(uid);
            }
        }
        toggleTheme() {
            if (window.AdvSoftLayout) {
                window.AdvSoftLayout.setTheme(window.AdvSoftLayout.effectiveTheme === 'dark' ? 'light' : 'dark');
            }
        }
        toggleSettings() {
            if (window.AdvSoftLayout) window.AdvSoftLayout.toggleSettings();
        }
        get effectiveTheme() {
            return window.AdvSoftLayout ? window.AdvSoftLayout.effectiveTheme : 'light';
        }
    }

    // ── SubMenu Component (Level 2-3 with dropdowns) ─────
    class SubMenu extends Component {
        static template = window.TEMPLATES.SubMenu;
        static props = {
            items: { type: Array, optional: true },
            activeMenuId: { type: Number, optional: true },
            onMenuClick: { type: Function },
        };

        setup() {
            this.state = useState({ openDropdown: null });
            this._onDocClick = (ev) => {
                if (ev.target.closest('.ls-submenu-dropdown') || ev.target.closest('.ls-submenu-dropdown-toggle')) {
                    return;
                }
                this.state.openDropdown = null;
            };
            onMounted(() => document.addEventListener('click', this._onDocClick));
            owl.onWillDestroy(() => document.removeEventListener('click', this._onDocClick));
        }

        toggleDropdown(id, ev) {
            if (ev) {
                ev.preventDefault();
                ev.stopPropagation();
            }
            this.state.openDropdown = this.state.openDropdown === id ? null : id;
        }

        onMenuClick(item) {
            this.state.openDropdown = null;
            this.props.onMenuClick(item);
        }
    }

    // ── WebClient (Root) ─────────────────────────────────
    class WebClient extends Component {
        static template = window.TEMPLATES.Root;
        static components = {
            AppSwitcher, NavBar, SubMenu,
            ListView: window.ListView,
            FormView: window.FormView,
            KanbanView: window.KanbanView,
            CalendarView: window.CalendarView,
            GraphView: window.GraphView,
            PivotView: window.PivotView,
            SpreadsheetView: window.SpreadsheetView,
        };

        // Get the dynamic component from registry
        get customComponent() {
            return window.AdvSoftPageRegistry[this.state.currentView] || null;
        }

        get isCustomView() {
            return !!window.AdvSoftPageRegistry[this.state.currentView];
        }

        setup() {
            this.state = useState({
                // Menu state
                menus: [],
                apps: [],
                activeAppId: null,
                activeMenuId: null,

                // View state
                currentView: 'home',
                actionView: 'list',
                currentModel: null,
                actionTitle: '',
                actionDomain: [],
                actionContext: {},

                // Action data
                currentAction: null,
                searchViewDef: {},
                listViewDef: {},
                formViewDef: {},
                kanbanViewDef: {},
                calendarViewDef: {},
                graphViewDef: {},
                pivotViewDef: {},
                spreadsheetViewDef: {},

                // Available view modes for current action
                viewModes: ['list', 'form'],

                // Form navigation
                formRecordId: null,
                formIndex: 1,
                formTotal: 0,

                // Shared relation data
                stages: [],
                projects: [],
                tags: [],

                // Breadcrumb stack
                breadcrumbs: [],

                // URL hash
                hash: {},

                // Error state
                clientError: null,

                // Layout / Theme / Device state
                layout: window.AdvSoftLayout ? window.AdvSoftLayout.toState() : {
                    theme: 'light', effectiveTheme: 'light', brandColor: 'purple',
                    density: 'default', device: 'desktop', isMobile: false,
                    isTablet: false, isDesktop: true, settingsOpen: false,
                    mobileMenuOpen: false, brandColors: [],
                },
            });

            this._menuCache = {};
            this._actionCache = {};

            // Sync LayoutService → Owl state
            if (window.AdvSoftLayout) {
                window.AdvSoftLayout.onChange(() => {
                    Object.assign(this.state.layout, window.AdvSoftLayout.toState());
                });
            }

            // Expose security-nav API for menu clicks
            window.__navSecurity = (type) => this.openCustomView(type);
            window.__doAction = (action) => this._executeActionDict(action);

            // Global Error Boundary for Owl Components
            onError(error => {
                console.error("[Owl Error Boundary Caught]", error);
                const cause = error.cause || error;
                if (error.cause) {
                    console.error("[Owl Error Cause]", error.cause);
                }
                this.state.clientError = {
                    message: cause.message || String(cause),
                    stack: cause.stack || '',
                    serverError: cause.serverError || null
                };
            });

            // Global window error catchers
            const handleGlobalError = (event) => {
                if (this.state.clientError) return; // Don't overwrite if already showing
                const err = event.error || event.reason;
                if (err) {
                    this.state.clientError = {
                        message: err.message || String(err),
                        stack: err.stack || '',
                        serverError: err.serverError || null
                    };
                }
            };
            window.addEventListener('error', handleGlobalError);
            window.addEventListener('unhandledrejection', handleGlobalError);

            onWillStart(async () => {
                const menus = await RPC.get('/api/orm/load_menus');
                // PERFORMA: markRaw pada data master
                this.state.menus = menus;
                this.state.apps = menus;

                const [projects, stages, tags] = await Promise.all([
                    RPC.nameSearch('project.project', '', 100).catch(() => []),
                    RPC.nameSearch('project.stage', '', 100).catch(() => []),
                    RPC.nameSearch('project.tag', '', 100).catch(() => []),
                ]);
                this.state.projects = projects || [];
                this.state.stages = stages || [];
                this.state.tags = tags || [];

                this._parseHash();
            });

            onMounted(() => {
                window.addEventListener('hashchange', () => this._parseHash());
            });
        }

        // ── Custom SPA Page Navigation ──────────────
        openCustomView(type, updateHash = true) {
            if (!window.AdvSoftPageRegistry[type]) {
                console.warn('Custom page not found in registry:', type);
                return;
            }
            this.state.currentView = type;
            
            // Try to find which app and menu item has this security_view to highlight the menu
            for (const app of this.state.apps) {
                if (app.security_view === type) {
                    this.state.activeAppId = app.id;
                    this.state.activeMenuId = app.id;
                    break;
                }
                const menuItem = this._findMenuBySecurityView(app.children || [], type);
                if (menuItem) {
                    this.state.activeAppId = app.id;
                    this.state.activeMenuId = menuItem.id;
                    break;
                }
            }
            if (updateHash && type !== 'adianti_page') {
                this._updateHash({ class: this._customViewToClass(type) });
            }
        }

        _findMenuBySecurityView(items, type) {
            for (const item of items) {
                if (item.security_view === type) return item;
                if (item.children) {
                    const found = this._findMenuBySecurityView(item.children, type);
                    if (found) return found;
                }
            }
            return null;
        }

        // ── Error Handling ──────────────────────────────
        clearError() {
            this.state.clientError = null;
        }

        reloadPage() {
            window.location.reload();
        }

        setTheme(theme) {
            if (window.AdvSoftLayout) window.AdvSoftLayout.setTheme(theme);
        }

        closeSettings() {
            if (window.AdvSoftLayout) window.AdvSoftLayout.closeSettings();
        }

        // ── View Mode Switcher ──────────────────────────
        get availableViewModes() {
            const modes = this.state.viewModes.filter(m => m !== 'form');
            return modes.map(type => ({
                type,
                label: VIEW_LABELS[type] || type,
                icon: owl.markup(VIEW_ICONS[type] || VIEW_ICONS.list),
            }));
        }

        switchView(viewType) {
            if (viewType === this.state.actionView) return;
            this.state.actionView = viewType;
            this._updateHash({
                class: this._modelViewToClass(this.state.currentModel, viewType),
            });
        }

        // ── Menu Navigation ──────────────────────────────

        onAppClick(app) {
            this.state.activeAppId = app.id;

            if (app.action_id && app.action) {
                this._executeAction(app.action, app.id);
            } else if (app.security_view) {
                this.onMenuClick(app);
            } else if (app.model) {
                this.onMenuClick(app);
            } else if (app.children && app.children.length > 0) {
                const firstAction = this._findFirstAction(app.children);
                if (firstAction) {
                    this.onMenuClick(firstAction);
                }
            }
        }

        onMenuClick(item) {
            // Security management view (custom SPA pages)
            if (item.security_view) {
                this.openCustomView(item.security_view);
                return;
            }

            // Odoo action dict
            if (item.action_id && item.action) {
                this._executeAction(item.action, item.id);
                return;
            }

            // Simple model+view menu item (e.g. "model=res.users, view=list")
            if (item.model) {
                const viewMode = (item.view || 'list');
                this._executeActionDict({
                    type: 'ir.actions.act_window',
                    res_model: item.model,
                    name: item.name || item.model,
                    view_mode: viewMode + ',form',
                });
                this.state.activeMenuId = item.id;
            }
        }

        goHome() {
            this.state.currentView = 'home';
            this.state.activeAppId = null;
            this.state.activeMenuId = null;
            this.state.currentAction = null;
            this._updateHash({});
        }

        get currentSubMenus() {
            if (!this.state.activeAppId) {
                // If activeAppId is not set, try to find the app from currentModel
                if (this.state.currentModel) {
                    const match = this._findAppForModelOrAction(this.state.currentModel);
                    if (match) {
                        this.state.activeAppId = match.app.id;
                    }
                }
            }
            const app = (this.state.apps || []).find(a => a.id === this.state.activeAppId);
            return app?.children || [];
        }

        _findAppForModelOrAction(model, actionId) {
            if (!this.state.apps || !this.state.apps.length) return null;
            for (const app of this.state.apps) {
                if (app.model === model || (actionId && app.action_id === actionId)) {
                    return { app, menu: app };
                }
                const foundMenu = this._findMenuItem(app.children || [], model, actionId);
                if (foundMenu) {
                    return { app, menu: foundMenu };
                }
            }
            return null;
        }

        _findMenuItem(items, model, actionId) {
            for (const item of items) {
                if (actionId && item.action_id === actionId) return item;
                if (model && item.model === model) return item;
                if (model && item.action && item.action.res_model === model) return item;
                if (item.children && item.children.length) {
                    const found = this._findMenuItem(item.children, model, actionId);
                    if (found) return found;
                }
            }
            return null;
        }

        _findMenuById(items, menuId) {
            for (const item of items) {
                if (item.id === menuId) return item;
                if (item.children && item.children.length) {
                    const found = this._findMenuById(item.children, menuId);
                    if (found) return found;
                }
            }
            return null;
        }

        // ── Action Execution (ActionService) ─────────────

        async _executeAction(actionDef, menuId) {
            this.state.activeMenuId = menuId;

            // Ensure activeAppId is set
            if (menuId) {
                for (const app of this.state.apps) {
                    if (app.id === menuId || this._findMenuById(app.children || [], menuId)) {
                        this.state.activeAppId = app.id;
                        break;
                    }
                }
            }
            if (!this.state.activeAppId && actionDef && actionDef.res_model) {
                const match = this._findAppForModelOrAction(actionDef.res_model, actionDef.id);
                if (match) {
                    this.state.activeAppId = match.app.id;
                    if (!this.state.activeMenuId) this.state.activeMenuId = match.menu.id;
                }
            }

            this.state.currentAction = actionDef;
            this.state.currentModel = actionDef.res_model;
            this.state.actionTitle = actionDef.name;
            try { this.state.actionDomain = actionDef.domain ? (typeof actionDef.domain === 'string' ? JSON.parse(actionDef.domain) : actionDef.domain) : []; } catch (e) { this.state.actionDomain = []; }
            try { this.state.actionContext = actionDef.context ? (typeof actionDef.context === 'string' ? JSON.parse(actionDef.context) : actionDef.context) : {}; } catch (e) { this.state.actionContext = {}; }

            // Parse view_mode to determine available views
            const viewModes = actionDef.view_mode
                ? actionDef.view_mode.split(',').map(m => m.trim())
                : ['list', 'form'];
            this.state.viewModes = viewModes;
            this.state.actionView = viewModes[0] === 'form' ? 'list' : viewModes[0];
            this.state.currentView = 'action';

            // Load view definitions for this action
            const cached = this._actionCache[actionDef.id];
            if (cached) {
                this._applyViewDefs(cached.views || {});
            } else {
                try {
                    const data = await RPC.call('/api/orm/load_action', { action_id: actionDef.id });
                    this._actionCache[actionDef.id] = data;
                    this._applyViewDefs(data.views || {});
                } catch (e) {
                    console.error('Failed to load action:', e);
                    this._applyViewDefs({});
                }
            }

            this._updateHash({
                class: this._modelViewToClass(actionDef.res_model, this.state.actionView),
            });
        }

        _applyViewDefs(views) {
            this.state.searchViewDef = views.search || {};
            this.state.listViewDef = views.list || {};
            this.state.formViewDef = views.form || {};
            this.state.kanbanViewDef = views.kanban || {};
            this.state.calendarViewDef = views.calendar || {};
            this.state.graphViewDef = views.graph || {};
            this.state.pivotViewDef = views.pivot || {};
            this.state.spreadsheetViewDef = views.spreadsheet || {};
        }

        async _executeActionDict(actionDict) {
            if (actionDict.type !== 'ir.actions.act_window') return;

            // Resolve activeAppId & activeMenuId from model/action
            const match = this._findAppForModelOrAction(actionDict.res_model, actionDict.id);
            if (match) {
                this.state.activeAppId = match.app.id;
                if (!this.state.activeMenuId) this.state.activeMenuId = match.menu.id;
            }

            this.state.currentAction = actionDict;
            this.state.currentModel = actionDict.res_model;
            this.state.actionTitle = actionDict.name;
            try { this.state.actionDomain = actionDict.domain ? (typeof actionDict.domain === 'string' ? JSON.parse(actionDict.domain) : actionDict.domain) : []; } catch (e) { this.state.actionDomain = []; }
            try { this.state.actionContext = actionDict.context ? (typeof actionDict.context === 'string' ? JSON.parse(actionDict.context) : actionDict.context) : {}; } catch (e) { this.state.actionContext = {}; }
            if (actionDict.res_id) {
                this.state.formRecordId = actionDict.res_id;
            }

            const viewModes = actionDict.view_mode ? actionDict.view_mode.split(',').map(m => m.trim()) : ['list'];
            this.state.viewModes = viewModes;
            this.state.actionView = (actionDict.res_id ? 'form' : (viewModes[0].trim()));
            this.state.currentView = 'action';

            try {
                const res = await RPC.loadViews(actionDict.res_model);
                if (res && res.views) {
                    this._applyViewDefs(res.views);
                }
            } catch (e) {
                console.error('Failed to load dynamic views:', e);
            }

            const hashParams = { class: this._modelViewToClass(actionDict.res_model, this.state.actionView) };
            if (actionDict.res_id || this.state.actionView === 'form') {
                hashParams.method = 'onEdit';
                if (actionDict.res_id) hashParams.id = actionDict.res_id;
            }
            this._updateHash(hashParams);
        }

        _findFirstAction(items) {
            for (const item of items) {
                if (item.action_id && item.action) return item;
                if (item.security_view) return item;
                if (item.model) return item;
                if (item.children && item.children.length > 0) {
                    const found = this._findFirstAction(item.children);
                    if (found) return found;
                }
            }
            return null;
        }

        // ── Form View Navigation ─────────────────────────

        openProfile(uid) {
            let userId = null;
            if (typeof uid === 'number' || (typeof uid === 'string' && /^\d+$/.test(uid))) {
                userId = parseInt(uid);
            } else {
                userId = (window.AdvSoftUser && window.AdvSoftUser.uid) ? window.AdvSoftUser.uid : 1;
            }
            this.state.formRecordId = userId;
            this.state.currentModel = 'res.users';
            this.state.actionTitle = 'My Profile';
            this.state.actionView = 'form';
            this._executeActionDict({
                type: 'ir.actions.act_window',
                res_model: 'res.users',
                name: 'My Profile',
                view_mode: 'form',
                res_id: userId,
            });
        }

        openRecord(recordId, index, total) {
            this.state.formRecordId = recordId;
            this.state.formIndex = index;
            this.state.formTotal = total;
            this.state.actionView = 'form';
            this._updateHash({
                class: this._modelViewToClass(this.state.currentModel, 'form'),
                method: 'onEdit',
                id: recordId,
            });
        }

        backToList() {
            // Go back to the first non-form view
            const firstView = this.state.viewModes.find(m => m !== 'form') || 'list';
            this.state.actionView = firstView;
            this._updateHash({
                class: this._modelViewToClass(this.state.currentModel, firstView),
            });
        }
        recordSaved(rec) {
            if (rec && rec.id) {
                this.state.formRecordId = rec.id;
                this._updateHash({
                    class: this._modelViewToClass(this.state.currentModel, 'form'),
                    method: 'onEdit',
                    id: rec.id,
                });
            }
        }

        navigateRecord(direction) {
            const newIndex = this.state.formIndex + direction;
            if (newIndex < 1 || newIndex > this.state.formTotal) return;
            this.state.formIndex = newIndex;
            this._fetchRecordAtIndex(newIndex);
        }

        async _fetchRecordAtIndex(index) {
            const res = await RPC.searchRead(this.state.currentModel, [], {
                order: 'id desc', limit: 1, offset: index - 1,
            });
            if (res.records && res.records.length > 0) {
                this.state.formRecordId = res.records[0].id;
                this.state.actionView = '';
                await new Promise(r => setTimeout(r, 10));
                this.state.actionView = 'form';
            }
        }

        // ── Adianti Class <-> Model/View Mapper ────────────────

        _modelViewToClass(model, viewType = 'list') {
            if (!model) return 'HomeView';
            const modelPart = model
                .split('.')
                .map(part => part.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''))
                .join('');
            const viewPart = (viewType || 'list').charAt(0).toUpperCase() + (viewType || 'list').slice(1);
            return modelPart + viewPart;
        }

        _classToModelView(className) {
            if (!className) return null;
            const viewSuffixes = ['Form', 'Kanban', 'Calendar', 'Graph', 'Pivot', 'Spreadsheet', 'List'];
            for (const suffix of viewSuffixes) {
                if (className.endsWith(suffix) && className.length > suffix.length) {
                    const base = className.slice(0, -suffix.length);
                    const viewType = suffix.toLowerCase();
                    const foundModel = this._findModelByPascalCase(base);
                    if (foundModel) {
                        return { model: foundModel, viewType };
                    }
                }
            }
            return null;
        }

        _findModelByPascalCase(pascalName) {
            const target = pascalName.toLowerCase();
            const aliasMap = {
                'projecttask': 'task',
                'task': 'task',
                'project': 'project.project',
                'projectproject': 'project.project',
                'projecttag': 'project.tag',
                'tag': 'project.tag',
                'stage': 'stage',
                'projectstage': 'stage',
                'tasktimesheet': 'task.timesheet',
            };
            if (aliasMap[target]) return aliasMap[target];

            const allModels = [
                'project.project', 'task', 'project.task', 'task.timesheet', 'stage', 'project.tag',
                'account.move', 'account.move.line', 'account.account', 'account.journal', 'account.tax', 'account.payment',
                'showcase.model', 'res.users', 'res.groups', 'res.groups.category', 'res.partner', 'res.company',
                'ir.model', 'ir.model.access', 'ir.rule', 'ir.action', 'ir.actions.report', 'ir.ui.menu', 'ir.ui.view',
                'ir.sequence', 'ir.module.module', 'ir.config_parameter', 'saved_filter', 'spreadsheet.document'
            ];
            for (const m of allModels) {
                const clean = m.replace(/[\._]/g, '').toLowerCase();
                if (clean === target) return m;
            }
            return target;
        }

        _customViewToClass(viewType) {
            const map = {
                'security_overview': 'SecurityOverview',
                'security_access': 'AccessRights',
                'security_rules': 'RecordRules',
                'security_groups': 'SecurityGroups',
                'security_users': 'SecurityUsers',
                'menu_editor': 'MenuEditor',
                'view_builder': 'ViewBuilder',
                'accounting_reports': 'AccountingReports',
                'my_custom_page': 'MyCustomPage',
                'adianti_page': this.state?.adiantiControllerClass || 'SampleController',
                'home': 'HomeView',
            };
            return map[viewType] || viewType;
        }

        _classToCustomView(className) {
            const map = {
                'SecurityOverview': 'security_overview',
                'AccessRights': 'security_access',
                'SecurityAccess': 'security_access',
                'RecordRules': 'security_rules',
                'SecurityRules': 'security_rules',
                'SecurityGroups': 'security_groups',
                'SecurityUsers': 'security_users',
                'MenuEditor': 'menu_editor',
                'ViewBuilder': 'view_builder',
                'AccountingReports': 'accounting_reports',
                'MyCustomPage': 'my_custom_page',
                'HomeView': 'home',
            };
            return map[className] || null;
        }

        // ── URL Hash (Adianti RouterService) ─────────────

        _parseHash() {
            const raw = window.location.hash.slice(1) || window.location.search.slice(1);
            if (!raw) return;
            const params = {};
            raw.split('&').forEach(p => {
                const [k, v] = p.split('=');
                if (k) params[k] = decodeURIComponent(v || '');
            });

            // 1. Adianti standard class routing (#class=ProjectProjectForm&method=onEdit&id=3, #class=AccessRights, etc.)
            if (params.class) {
                const customView = this._classToCustomView(params.class);
                if (customView) {
                    this.openCustomView(customView);
                    return;
                }

                const modelView = this._classToModelView(params.class);
                if (modelView) {
                    const isForm = modelView.viewType === 'form' || params.method === 'onEdit' || !!params.id;
                    const viewType = isForm ? 'form' : modelView.viewType;
                    const resId = params.id ? parseInt(params.id) : null;
                    if (isForm && resId) {
                        this.state.formRecordId = resId;
                    }
                    this._executeActionDict({
                        type: 'ir.actions.act_window',
                        res_model: modelView.model,
                        name: modelView.model,
                        view_mode: viewType + ',form',
                        res_id: resId,
                    });
                    return;
                }

                // Standard Adianti Controller Fallback (TPage / TWindow)
                if (window.AdvSoftPageRegistry && window.AdvSoftPageRegistry['adianti_page']) {
                    this.state.adiantiControllerClass = params.class;
                    this.state.adiantiControllerMethod = params.method || '';
                    this.state.adiantiControllerParams = params;
                    this.openCustomView('adianti_page', false);
                    return;
                }
            }

            // 2. Legacy custom view routing (#view=security_access)
            if (params.view && window.AdvSoftPageRegistry[params.view]) {
                this.openCustomView(params.view);
                return;
            }

            // 3. Legacy model routing (#action=1&model=project.project&id=3&view_type=form)
            if (params.model) {
                const isForm = params.view_type === 'form' || params.view === 'form' || !!params.id;
                const viewType = isForm ? 'form' : (params.view_type || 'list');
                const resId = params.id ? parseInt(params.id) : null;
                if (resId) {
                    this.state.formRecordId = resId;
                }
                this._executeActionDict({
                    type: 'ir.actions.act_window',
                    res_model: params.model,
                    name: params.model,
                    view_mode: viewType + ',form',
                    res_id: resId,
                });
                return;
            }

            // 4. Legacy action id routing (#action=1)
            if (params.action) {
                const actionId = parseInt(params.action);
                for (const app of this.state.apps) {
                    if (app.action_id === actionId) {
                        this.onAppClick(app);
                        return;
                    }
                    const menuItem = this._findMenuByActionId(app.children || [], actionId);
                    if (menuItem) {
                        this.state.activeAppId = app.id;
                        this.onMenuClick(menuItem);
                        return;
                    }
                }
            }
        }

        _findMenuByActionId(items, actionId) {
            for (const item of items) {
                if (item.action_id === actionId) return item;
                if (item.children) {
                    const found = this._findMenuByActionId(item.children, actionId);
                    if (found) return found;
                }
            }
            return null;
        }

        _updateHash(params = {}) {
            let hashStr = '';
            if (params.class) {
                const parts = [`class=${params.class}`];
                if (params.method) parts.push(`method=${params.method}`);
                if (params.id) parts.push(`id=${params.id}`);
                for (const [k, v] of Object.entries(params)) {
                    if (!['class', 'method', 'id'].includes(k) && v !== undefined && v !== null) {
                        parts.push(`${k}=${encodeURIComponent(v)}`);
                    }
                }
                hashStr = parts.join('&');
            } else if (params.view) {
                const cls = this._customViewToClass(params.view);
                hashStr = `class=${cls}`;
            } else if (params.model) {
                const cls = this._modelViewToClass(params.model, params.view_type || this.state.actionView || 'list');
                const parts = [`class=${cls}`];
                if (params.view_type === 'form' || params.id) {
                    parts.push('method=onEdit');
                    if (params.id) parts.push(`id=${params.id}`);
                }
                hashStr = parts.join('&');
            }
            history.replaceState(null, '', hashStr ? '#' + hashStr : window.location.pathname);
        }
    }

    // ── Inisialisasi & Mounting (Best Practice Owl 2) ──
    document.addEventListener('DOMContentLoaded', () => {
        // 1. Setup Global Environment (Env)
        // Env digunakan untuk menyimpan objek global yang bisa diakses oleh seluruh komponen 
        // melalui `this.env` (misal: router, translations, global event bus).
        const env = {
            _t: (str) => str, // Placeholder fungsi translasi (i18n)
            services: {
                rpc: window.AdvSoftRPC
            }
        };

        // 2. Konfigurasi Aplikasi (Performa & Mode)
        const config = {
            env: env,
            
            // PERFORMA: `dev: false` akan menonaktifkan validasi internal Owl (prop types, dll).
            // Ini membuat performa rendering DOM jauh lebih cepat di lingkungan Production.
            // Ubah ke `true` hanya saat proses debugging.
            dev: false, 
            
            // ERROR HANDLING: Mencegah error diam-diam ketika state secara tidak sengaja termutasi
            warnIfMutatingProps: true,

            // Template registry global
            templates: window.TEMPLATES
        };

        // 3. Inisialisasi & Mount
        try {
            const app = new owl.App(WebClient, config);
            app.mount(document.getElementById('app'));
        } catch (e) {
            console.error("[CRITICAL] Gagal me-mount AdvSoft WebClient:", e);
            document.getElementById('app').innerHTML = `
                <div style="padding: 20px; color: red; font-family: sans-serif;">
                    <h3>Critical System Error</h3>
                    <p>WebClient gagal dimuat. Periksa konsol browser untuk detail error.</p>
                </div>
            `;
        }

        // ── Expose Standard Adianti JavaScript API ──
        window.Adianti = window.Adianti || {};
        window.Adianti.loadPage = (className, method = '', params = {}) => {
            let hash = `#class=${className}`;
            if (method) hash += `&method=${method}`;
            if (params && typeof params === 'object') {
                const q = new URLSearchParams(params).toString();
                if (q) hash += `&${q}`;
            }
            window.location.hash = hash;
        };
        window.Adianti.openPage = window.Adianti.loadPage;
        window.Adianti.currentClass = () => {
            const raw = window.location.hash.slice(1) || window.location.search.slice(1);
            const p = new URLSearchParams(raw);
            return p.get('class') || '';
        };
    });
})();
