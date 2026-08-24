// Dynamic Form View Template — Full AdvSoft <form> Architecture
// <form> → <header>(buttons+statusbar) → <sheet>(groups+notebook) → <div.oe_chatter>
(function(){
const { xml } = owl;

// Helper functions for Owl XML template
window.formHelpers = {
    isPriorityFilled: (rec, level) => Number(rec.priority) >= level,
    progressStyle: (rec) => {
        const p = rec.progress || 0, w = Math.min(p, 100);
        const bg = p >= 100 ? 'var(--ls-success)' : p >= 50 ? 'var(--ls-warning)' : 'var(--ls-info)';
        return 'width:' + w + '%;background:' + bg;
    },
    isNavDisabledPrev: (idx) => idx <= 1,
    isNavDisabledNext: (idx, total) => idx >= total,
    renderWidget: (fieldDef, value, extras) => {
        if (!window.FieldWidgets) return String(value ?? '');
        return window.FieldWidgets.render(fieldDef, value, extras);
    },
    getGroupFields: (formDef, groupIdx, colIdx) => {
        if (!formDef || !formDef.groups || !formDef.groups[groupIdx]) return [];
        return formDef.groups[groupIdx][colIdx] || [];
    },
    getStatusbarField: (formDef) => formDef?.statusbar || null,
    getTabs: (formDef) => formDef?.tabs || [],
    getM2oDisplayName: (line, fieldName) => {
        const val = line[fieldName];
        if (Array.isArray(val)) return val[1] || '';
        return '';
    },
};

window.TEMPLATES.FormView = xml`
<div class="ls-app">
    <!-- ══════════════ Control Panel ══════════════ -->
    <div class="ls-control-panel">
        <div class="ls-cp-top">
            <div class="ls-breadcrumb">
                <span class="ls-breadcrumb-item" style="cursor:pointer;color:var(--ls-primary);" t-on-click="goBack" t-esc="props.actionTitle || 'Records'"/>
                <span class="ls-breadcrumb-sep">/</span>
                <span class="ls-breadcrumb-item" t-esc="state.record.name || 'New'"/>
            </div>
            <div class="ls-searchbar-row"></div>
        </div>
        <div class="ls-cp-bottom">
            <div class="ls-cp-action-buttons">
                <div class="ls-form-buttons" t-if="state.dirty">
                    <button class="ls-btn ls-btn-primary" t-on-click="saveRecord">Save</button>
                    <button class="ls-btn" t-on-click="discardChanges">Discard</button>
                </div>
                <div class="ls-print-menu" style="position:relative; display:inline-block;" t-if="!state.dirty and state.record.id and state.printActions and state.printActions.length > 0">
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

                <div class="ls-action-menu" style="position:relative; display:inline-block;" t-if="!state.dirty and state.record.id">
                    <button class="ls-btn" t-on-click="(ev) => this.toggleActionMenu(ev)" title="Actions">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px; vertical-align:middle;">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg> Action
                        <span class="ls-submenu-caret" style="margin-left:4px;">▾</span>
                    </button>
                    <div class="ls-submenu-dropdown" t-if="state.showActionMenu" t-on-click="(ev) => ev.stopPropagation()" style="position:absolute; top:100%; left:0; z-index:1000; display:flex; flex-direction:column; min-width:140px; text-align:left; background:var(--ls-card-bg, #fff); border:1px solid var(--ls-border, #e5e7eb); border-radius:6px; box-shadow:0 4px 12px rgba(0,0,0,0.1); padding:4px 0;">
                        <div class="ls-submenu-dropdown-item" t-on-click="(ev) => this.deleteCurrentRecord(ev)" style="cursor:pointer; color:var(--ls-danger, #ef4444); padding:8px 16px; display:flex; align-items:center; gap:8px; font-size:13px; font-weight:500;">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            <span>Delete</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="ls-cp-pager-switchers">
                <div class="ls-pager">
                    <span t-esc="props.recordIndex + ' / ' + props.totalRecords"/>
                    <div class="ls-pager-nav">
                        <button t-on-click="prevRecord" t-att-disabled="window.formHelpers.isNavDisabledPrev(props.recordIndex)">‹</button>
                        <button t-on-click="nextRecord" t-att-disabled="window.formHelpers.isNavDisabledNext(props.recordIndex, props.totalRecords)">›</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ══════════════ Form Body ══════════════ -->
    <div class="ls-form-view" t-on-input="_onWidgetInput" t-on-change="_onWidgetChange" t-on-click="_onWidgetClick" t-on-focusout="_onWidgetFocusOut">
        <t t-if="state.loading">
            <div class="ls-loading"><div class="ls-spinner"/> Loading...</div>
        </t>
        <t t-else="">
            <div class="ls-form-sheet">

                <!-- ══ <header> — Buttons + StatusBar ══ -->
                <div class="ls-form-header" t-if="statusbarStages.length || headerButtons.length">
                    <div class="ls-header-buttons" t-if="headerButtons.length">
                        <t t-foreach="headerButtons" t-as="btn" t-key="btn.name">
                            <button t-att-class="'ls-btn ' + (btn.class || 'ls-btn-secondary')"
                                    t-on-click="() => this.onActionClick(btn)"
                                    t-esc="btn.string"/>
                        </t>
                    </div>
                    <div class="ls-statusbar" t-if="statusbarStages.length">
                        <t t-foreach="statusbarStages" t-as="stg" t-key="stg.id">
                            <button t-att-class="'ls-statusbar-item' + (isStageActive(stg) ? ' active' : '') + (isStageCompleted(stg) ? ' done' : '')"
                                    t-on-click="() => this.setStage(stg.id)"
                                    t-esc="stg.name"/>
                        </t>
                    </div>
                </div>

                <!-- ══ Stat Buttons (oe_button_box) ══ -->
                <div class="oe_button_box" t-if="statButtons.length">
                    <t t-foreach="statButtons" t-as="btn" t-key="btn.name">
                        <button class="oe_stat_button" t-on-click="() => this.onActionClick(btn)">
                            <div class="oe_stat_button_icon" t-if="btn.icon">
                                <i t-att-class="'fa ' + btn.icon"/>
                            </div>
                            <div class="oe_stat_info">
                                <span class="oe_stat_value">
                                    <t t-if="btn.field">
                                        <t t-esc="formatStatValue(btn.field)"/>
                                    </t>
                                </span>
                                <span class="oe_stat_text" t-esc="btn.string"/>
                            </div>
                        </button>
                    </t>
                </div>

                <!-- ══ oe_title — AdvSoft-style title + priority inline ══ -->
                <div class="oe_title" t-if="titleField">
                    <h1>
                        <input class="ls-form-title-text" t-att-value="state.record[titleField]"
                               t-on-input="_onWidgetInput"
                               t-on-change="(ev) => this.updateField(titleField, ev.target.value)"
                               placeholder="Untitled"
                               aria-label="Record title"/>
                    </h1>
                    <div class="ls-priority-stars" t-if="priorityField" role="radiogroup" aria-label="Priority">
                        <t t-foreach="[1,2,3]" t-as="s" t-key="s">
                            <span t-att-class="'ls-priority-star' + (window.formHelpers.isPriorityFilled(state.record, s) ? ' filled' : '')"
                                  t-on-click="() => this.setPriority(s)"
                                  role="radio"
                                  t-att-aria-checked="window.formHelpers.isPriorityFilled(state.record, s)">★</span>
                        </t>
                    </div>
                </div>

                <!-- ══ <sheet> → <group> Fields ══ -->
                <div class="ls-form-groups" t-ref="formFields">
                    <t t-foreach="formGroups" t-as="group" t-key="group_index">
                        <div class="ls-form-group" t-att-style="group.col ? 'grid-template-columns: repeat(' + group.col + ', 1fr)' : ''">
                            <!-- Group title — AdvSoft-style bold header -->
                            <div class="ls-form-group-title" t-if="group.string">
                                <span t-esc="group.string"/>
                            </div>
                            <t t-foreach="group.columns" t-as="col" t-key="col_index">
                                <div class="ls-form-col">
                                    <t t-foreach="col" t-as="field" t-key="field.name">
                                        <div t-att-class="'ls-form-row' + (field.readonly ? ' ls-field-readonly' : '') + (field.required ? ' ls-field-required' : '') + (field.colspan ? ' ls-colspan-' + field.colspan : '')">
                                            <label class="ls-form-label" t-if="!field.nolabel">
                                                <span t-esc="field.label"/>
                                                <span class="ls-required-star" t-if="field.required">*</span>
                                                <span class="ls-field-help" t-if="field.help" t-att-title="field.help">?</span>
                                            </label>
                                            <div class="ls-form-value">
                                                <t t-if="field.component">
                                                    <t t-component="field.component" t-props="field.props"/>
                                                </t>
                                                <t t-else="">
                                                    <t t-out="field.html"/>
                                                </t>
                                            </div>
                                        </div>
                                    </t>
                                </div>
                            </t>
                        </div>
                    </t>
                </div>

                <!-- ══ <notebook> → <page> Tabs ══ -->
                <div class="ls-tabs" t-if="formTabs.length">
                    <div class="ls-tab-headers">
                        <t t-foreach="formTabs" t-as="tab" t-key="tab.name">
                            <button t-att-class="'ls-tab-header' + (state.activeTab === tab.name ? ' active' : '')"
                                    t-on-click="() => this.state.activeTab = tab.name"
                                    t-esc="tab.label"/>
                        </t>
                    </div>

                    <t t-foreach="formTabs" t-as="tab" t-key="tab.name + '_content'">
                        <div class="ls-tab-content" t-if="state.activeTab === tab.name">

                            <!-- Field tab (text/html) -->
                            <t t-if="tab.type === 'field'">
                                <div class="ls-tab-field-wrapper" t-out="renderTabField(tab)"/>
                            </t>

                            <!-- One2many / Many2many inline tree -->
                            <t t-if="tab.type === 'one2many' || tab.type === 'many2many'">
                                <InlineTreeWidget
                                    tabDef="tab"
                                    lines="state.record[tab.field] || []"
                                    parentRecord="state.record"
                                    parentModel="props.model || ''"
                                    relOptions="state.o2mRelOptions"
                                    onLineAdd="(defaults) => this.addO2mLine(tab, defaults)"
                                    onLineUpdate="(lineId, field, value, writeVal) => this.updateO2mLine(tab, lineId, field, value, writeVal)"
                                    onLineBatchUpdate="(lineId, values) => this.batchUpdateO2mLine(tab, lineId, values)"
                                    onLineDelete="(lineId) => this.deleteO2mLine(tab, lineId)"
                                    onLineLink="(records) => this.linkO2mRecords(tab, records)"
                                />
                            </t>

                            <!-- Group/Layout tab (fields inside page groups) -->
                            <t t-if="tab.type === 'group'">
                                <div class="ls-form-groups">
                                    <t t-foreach="getTabGroups(tab)" t-as="tgroup" t-key="tgroup_index">
                                        <div class="ls-form-group" t-att-style="tgroup.col ? 'grid-template-columns: repeat(' + tgroup.col + ', 1fr)' : ''">
                                            <div class="ls-form-group-title" t-if="tgroup.string">
                                                <span t-esc="tgroup.string"/>
                                            </div>
                                            <t t-foreach="tgroup.columns" t-as="tcol" t-key="tcol_index">
                                                <div class="ls-form-col">
                                                    <t t-foreach="tcol" t-as="tfield" t-key="tfield.name">
                                                        <div t-att-class="'ls-form-row' + (tfield.readonly ? ' ls-field-readonly' : '') + (tfield.required ? ' ls-field-required' : '')">
                                                            <label class="ls-form-label" t-if="!tfield.nolabel">
                                                                <span t-esc="tfield.label"/>
                                                                <span class="ls-required-star" t-if="tfield.required">*</span>
                                                                <span class="ls-field-help" t-if="tfield.help" t-att-title="tfield.help">?</span>
                                                            </label>
                                                            <div class="ls-form-value">
                                                                <t t-if="tfield.component">
                                                                    <t t-component="tfield.component" t-props="tfield.props"/>
                                                                </t>
                                                                <t t-else="">
                                                                    <t t-out="tfield.html"/>
                                                                </t>
                                                            </div>
                                                        </div>
                                                    </t>
                                                </div>
                                            </t>
                                        </div>
                                    </t>
                                </div>
                            </t>
                        </div>
                    </t>
                </div>
            </div>

            <!-- ══ <div class="oe_chatter"> ══ -->
            <div class="oe_chatter" t-if="chatterConfig">
                <div class="oe_chatter_header">
                    <button class="ls-btn ls-btn-sm" t-on-click="toggleChatter">
                        <span class="oe_chatter_icon">💬</span>
                        Messages
                    </button>
                    <button class="ls-btn ls-btn-sm" t-if="chatterConfig.mail_activity" t-on-click="toggleActivities">
                        <span class="oe_chatter_icon">📋</span>
                        Activities
                    </button>
                    <button class="ls-btn ls-btn-sm" t-on-click="logNote">
                        Log Note
                    </button>
                </div>

                <!-- Message compose area -->
                <div class="oe_chatter_compose" t-if="state.showComposer">
                    <textarea class="oe_chatter_textarea" t-ref="chatterInput" placeholder="Write a message or log a note..."/>
                    <div class="oe_chatter_compose_btns">
                        <button class="ls-btn ls-btn-primary ls-btn-sm" t-on-click="sendMessage">Send</button>
                        <button class="ls-btn ls-btn-sm" t-on-click="() => this.state.showComposer = false">Cancel</button>
                    </div>
                </div>

                <!-- Message list -->
                <div class="oe_chatter_messages">
                    <t t-foreach="state.messages" t-as="msg" t-key="msg.id || msg_index">
                        <div t-att-class="'oe_chatter_msg' + (msg.type === 'note' ? ' oe_chatter_note' : '')">
                            <div class="oe_chatter_msg_header">
                                <strong t-esc="msg.author || 'System'"/>
                                <span class="oe_chatter_msg_date" t-esc="msg.date || ''"/>
                            </div>
                            <div class="oe_chatter_msg_body" t-out="msg.body || ''"/>
                        </div>
                    </t>
                    <div class="oe_chatter_empty" t-if="state.messages.length === 0">
                        No messages yet.
                    </div>
                </div>
            </div>
        </t>
    </div>

    <div class="ls-footer">
        <span t-esc="'Last modified: ' + (state.record.write_date || state.record.updated_at || '')"/>
    </div>
</div>
`;
})();
