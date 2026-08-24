// ══════════════════════════════════════════════════════════════
//  MenuEditorView Template — AdvSoft-style Menu Item Editor
//  Settings → Technical → User Interface → Menu Items
// ══════════════════════════════════════════════════════════════
(function(){
const { xml } = owl;

// ── Helper: Recursive Row Renderer ──────────────────
// OWL's t-call doesn't support self-referencing templates, so we
// render the tree iteratively using a flatten approach in the component.

window.TEMPLATES.MenuEditor = xml`
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
`;

})();
