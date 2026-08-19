// WebClient Root Template — Odoo-style menu system + View Switcher
(function () {
    const { xml } = owl;

    // ── AppSwitcher (Home screen with app grid & search) ───
    window.TEMPLATES.AppSwitcher = xml`
<div class="ls-app-switcher">
    <!-- Sleek Odoo Enterprise Search Bar -->
    <div class="ls-app-search-wrap">
        <div class="ls-app-search-box">
            <span class="ls-app-search-icon">
                <t t-out="window.lucideIcon('search', 18)"/>
            </span>
            <input type="text"
                   class="ls-app-search-input"
                   placeholder="Search applications and menus... (Press / to focus)"
                   t-model="state.searchQuery"
                   t-ref="searchInput"
                   autocomplete="off"
                   spellcheck="false"/>
            <t t-if="state.searchQuery">
                <button type="button" class="ls-app-search-clear" t-on-click="clearSearch" title="Clear">
                    <t t-out="window.lucideIcon('x', 14)"/>
                </button>
            </t>
            <t t-else="">
                <span class="ls-app-search-kbd">/</span>
            </t>
        </div>
    </div>

    <!-- App Grid -->
    <div class="ls-app-grid" t-if="filteredApps.length > 0">
        <t t-foreach="filteredApps" t-as="app" t-key="app.id">
            <t t-set="vis" t-value="this.getAppVisuals(app)"/>
            <div class="ls-app-card"
                 t-on-click="() => this.onAppClick(app)"
                 t-att-style="'--app-glow:' + vis.glow + '; animation-delay:' + (app_index * 40) + 'ms;'">
                <div class="ls-app-card-icon" t-att-style="'background:' + vis.gradient + '; box-shadow: 0 10px 25px -4px ' + vis.glow + ', inset 0 1px 1px rgba(255,255,255,0.4);'">
                    <span class="ls-app-icon-shine"></span>
                    <t t-out="window.lucideIcon(vis.icon || app.web_icon || 'box', 36)"/>
                </div>
                <div class="ls-app-card-name" t-esc="app.name"/>
            </div>
        </t>
    </div>

    <!-- Deep Menu Search Results (if searching) -->
    <t t-if="state.searchQuery and matchingMenuItems.length > 0">
        <div class="ls-app-menu-results">
            <div class="ls-app-menu-results-header">Menu Items</div>
            <div class="ls-app-menu-results-list">
                <t t-foreach="matchingMenuItems" t-as="item" t-key="item.id">
                    <div class="ls-app-menu-result-item" t-on-click="() => this.onMenuItemClick(item)">
                        <div class="ls-app-menu-result-icon">
                            <t t-out="window.lucideIcon(item.icon || 'chevron-right', 16)"/>
                        </div>
                        <div class="ls-app-menu-result-info">
                            <span class="ls-app-menu-result-title" t-esc="item.name"/>
                            <span class="ls-app-menu-result-path" t-esc="item.fullPath"/>
                        </div>
                        <span class="ls-app-menu-result-arrow">→</span>
                    </div>
                </t>
            </div>
        </div>
    </t>

    <!-- Empty search message -->
    <t t-if="state.searchQuery and filteredApps.length === 0 and matchingMenuItems.length === 0">
        <div class="ls-app-empty-state">
            <div class="ls-app-empty-icon">🔍</div>
            <div class="ls-app-empty-title">No applications or menus found</div>
            <div class="ls-app-empty-sub">Try searching with a different keyword</div>
        </div>
    </t>
</div>
`;

    // ── NavBar (Top navigation) ──────────────────────────
    window.TEMPLATES.NavBar = xml`
<nav t-att-class="'ls-navbar' + (props.isHome ? ' ls-navbar-home' : '')">
    <button class="ls-hamburger" t-on-click="() => window.LarasoftLayout.toggleMobileMenu()">
        <t t-out="window.lucideIcon('menu', 20)"/>
    </button>
    
    <!-- 9-Dots Waffle Icon (Odoo Enterprise signature app switcher) -->
    <button class="ls-waffle-btn" t-on-click="props.onHome" title="Applications (Home)">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
            <rect x="1" y="1" width="4" height="4" rx="1"/>
            <rect x="7" y="1" width="4" height="4" rx="1"/>
            <rect x="13" y="1" width="4" height="4" rx="1"/>
            <rect x="1" y="7" width="4" height="4" rx="1"/>
            <rect x="7" y="7" width="4" height="4" rx="1"/>
            <rect x="13" y="7" width="4" height="4" rx="1"/>
            <rect x="1" y="13" width="4" height="4" rx="1"/>
            <rect x="7" y="13" width="4" height="4" rx="1"/>
            <rect x="13" y="13" width="4" height="4" rx="1"/>
        </svg>
    </button>

    <div class="ls-navbar-brand" t-on-click="props.onHome" style="cursor:pointer;" title="Applications (Home)">
        <span class="ls-brand-logo">
            <t t-out="window.lucideIcon('box', 20)"/>
        </span>
        <span class="ls-brand-name">Larasoft</span>
    </div>

    <!-- App Switcher Top Links -->
    <div class="ls-navbar-menu" t-if="!props.isHome">
        <t t-foreach="props.apps" t-as="app" t-key="app.id">
            <a href="#" t-att-class="'ls-nav-app' + (props.activeAppId === app.id ? ' active' : '')"
               t-on-click.prevent="() => this.onAppClick(app)"
               t-esc="app.name"/>
        </t>
    </div>

    <div class="ls-navbar-right">
        <button class="ls-theme-toggle" t-on-click="toggleTheme" title="Toggle Light/Dark Theme">
            <t t-out="window.lucideIcon(effectiveTheme === 'dark' ? 'sun' : 'moon', 16)"/>
        </button>
        <button class="ls-theme-toggle" t-on-click="toggleSettings" title="Settings &amp; Preferences">
            <t t-out="window.lucideIcon('settings', 16)"/>
        </button>
        <t t-set="u" t-value="window.LarasoftUser || {}"/>
        <div class="ls-user-chip" t-if="u.uid" title="User Profile">
            <a href="#" class="ls-user-chip-btn" t-on-click.prevent="() => this.onProfileClick()" title="My Profile">
                <div class="ls-avatar">
                    <t t-esc="(u.name || u.login || '?').charAt(0).toUpperCase()"/>
                </div>
                <div class="ls-user-chip-info">
                    <span class="ls-user-chip-name" t-esc="u.name || u.login"/>
                    <span class="ls-user-chip-company" t-esc="u.company || 'My Company'"/>
                </div>
            </a>
            <a href="/logout" class="ls-user-chip-logout" title="Logout">
                <t t-out="window.lucideIcon('log-out', 13)"/>
            </a>
        </div>
    </div>
</nav>
`;

    // ── SubMenu (Level 2-3 menu items) ───────────────────
    window.TEMPLATES.SubMenu = xml`
<div class="ls-submenu-bar" t-if="props.items and props.items.length">
    <t t-foreach="props.items" t-as="item" t-key="item.id">
        <div t-att-class="'ls-submenu-item' + (props.activeMenuId === item.id ? ' active' : '') + (state.openDropdown === item.id ? ' open' : '')">
            <t t-if="item.children and item.children.length">
                <button type="button" class="ls-submenu-label ls-submenu-dropdown-toggle"
                        t-on-click="(ev) => this.toggleDropdown(item.id, ev)">
                    <span t-esc="item.name"/>
                    <span class="ls-submenu-caret">▾</span>
                </button>
                <div class="ls-submenu-dropdown" t-if="state.openDropdown === item.id">
                    <t t-foreach="item.children" t-as="child" t-key="child.id">
                        <div t-att-class="'ls-submenu-dropdown-item' + (props.activeMenuId === child.id ? ' active' : '')"
                             t-on-click="() => this.onMenuClick(child)">
                            <span t-esc="child.name"/>
                        </div>
                    </t>
                </div>
            </t>
            <t t-else="">
                <button type="button" class="ls-submenu-label"
                        t-on-click="() => this.onMenuClick(item)">
                    <span t-esc="item.name"/>
                </button>
            </t>
        </div>
    </t>
</div>
`;

    // ── Breadcrumb ───────────────────────────────────────
    window.TEMPLATES.Breadcrumb = xml`
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
`;

    // ── WebClient (Root) ─────────────────────────────────
    window.TEMPLATES.Root = xml`
<div class="ls-webclient">
    <t t-if="!state.clientError">
        <NavBar apps="state.apps" activeAppId="state.activeAppId"
                onAppClick.bind="onAppClick" onHome.bind="goHome"
                onOpenProfile.bind="openProfile"
                isHome="state.currentView === 'home'"/>

    <t t-if="state.currentView === 'home'">
        <AppSwitcher apps="state.apps" onAppClick.bind="onAppClick" onMenuClick.bind="onMenuClick"/>
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
`;
})();
