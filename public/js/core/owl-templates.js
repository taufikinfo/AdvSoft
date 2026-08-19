// Owl App - Part 1: Templates (Fully Dynamic — Odoo <tree> Architecture)
(function(){
const { xml } = owl;

window.TEMPLATES = window.TEMPLATES || {};

// Helper functions for dynamic templates
window.listHelpers = {
    renderListCell: (fieldDef, value) => {
        if (!window.FieldWidgets) return String(value ?? '');
        return window.FieldWidgets.renderList(fieldDef, value);
    },
    getFieldLabel: (viewDef, fieldName, fields) => {
        // Try column defs first, then field_defs, then format name
        if (viewDef?.columns) {
            const col = viewDef.columns.find(c => c.name === fieldName);
            if (col?.string) return col.string;
        }
        const fromView = (viewDef?.field_defs || {})[fieldName]?.string;
        if (fromView) return fromView;
        const fromFields = (fields || {})[fieldName]?.string;
        if (fromFields) return fromFields;
        return fieldName.replace(/_/g, ' ').replace(/\bid\b/g, '').trim().replace(/^\w/, c => c.toUpperCase()) || fieldName;
    }
};

window.TEMPLATES.App = xml`
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
`;
})();
