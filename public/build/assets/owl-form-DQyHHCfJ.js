(function(){let{xml:e}=owl;window.formHelpers={isPriorityFilled:(e,t)=>Number(e.priority)>=t,progressStyle:e=>{let t=e.progress||0,n=Math.min(t,100),r=t>=100?`var(--ls-success)`:t>=50?`var(--ls-warning)`:`var(--ls-info)`;return`width:`+n+`%;background:`+r},isNavDisabledPrev:e=>e<=1,isNavDisabledNext:(e,t)=>e>=t,renderWidget:(e,t,n)=>window.FieldWidgets?window.FieldWidgets.render(e,t,n):String(t??``),getGroupFields:(e,t,n)=>!e||!e.groups||!e.groups[t]?[]:e.groups[t][n]||[],getStatusbarField:e=>e?.statusbar||null,getTabs:e=>e?.tabs||[],getM2oDisplayName:(e,t)=>{let n=e[t];return Array.isArray(n)&&n[1]||``}},window.TEMPLATES.FormView=e`
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
    <div class="ls-form-view" t-on-change="_onWidgetChange" t-on-click="_onWidgetClick" t-on-focusout="_onWidgetFocusOut">
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

                <!-- ══ oe_title — Odoo-style title + priority inline ══ -->
                <div class="oe_title" t-if="titleField">
                    <h1>
                        <input class="ls-form-title-text" t-att-value="state.record[titleField]"
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
                            <!-- Group title — Odoo-style bold header -->
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
`})(),(function(){let{Component:e,useState:t,onWillStart:n,onMounted:r,onPatched:i,useRef:a}=owl,o=window.LarasoftRPC;class s extends e{static template=window.TEMPLATES.FormView;static components={InlineTreeWidget:window.InlineTreeWidget};static props={recordId:{type:[Number,String,Boolean],optional:!0},recordIndex:{type:Number,optional:!0},totalRecords:{type:Number,optional:!0},model:{type:String,optional:!0},stages:{type:Array,optional:!0},projects:{type:Array,optional:!0},tags:{type:Array,optional:!0},formViewDef:{type:Object,optional:!0},actionTitle:{type:String,optional:!0},onBack:{type:Function,optional:!0},onNavigate:{type:Function,optional:!0},onSaved:{type:Function,optional:!0},actionContext:{type:Object,optional:!0}};setup(){this._model=this.props.model||`task`,this._formDef=this.props.formViewDef||{},this.formFieldsRef=a(`formFields`),this._relOptionsCache={},this._childFieldDefs={},this._m2oInstances=[],this.state=t({record:{},loading:!0,dirty:!1,activeTab:this._formDef.tabs?.[0]?.name||`description`,relOptions:{},o2mRelOptions:{},messages:[],showComposer:!1,composerType:`message`,printActions:[],showPrintMenu:!1}),n(async()=>{await this._fetchPrintActions(),await this._loadRelOptions(),await this._loadChildFieldDefs(),await this.loadRecord()}),r(()=>{window.scrollTo(0,0),this._bindM2OAutocompletes(),this._bindSignatures(),this._bindImageValidation(),this._bindRTEInstances(),this._boundKeyHandler=this._handleKeyboardShortcuts.bind(this),document.addEventListener(`keydown`,this._boundKeyHandler),this._autoSaveTimer=setInterval(()=>{this.state.dirty&&this.props.recordId>0&&this.saveRecord()},12e4)}),i(()=>{this._bindM2OAutocompletes(),this._bindSignatures(),this._bindImageValidation(),this._bindRTEInstances()}),owl.onWillDestroy(()=>{this._boundKeyHandler&&document.removeEventListener(`keydown`,this._boundKeyHandler),this._autoSaveTimer&&clearInterval(this._autoSaveTimer),Object.values(this._debounceTimers).forEach(e=>clearTimeout(e))}),this._onClickOutside=e=>{e.target.closest(`.ls-print-menu`)||(this.state.showPrintMenu=!1)},document.addEventListener(`click`,this._onClickOutside),owl.onWillDestroy(()=>{document.removeEventListener(`click`,this._onClickOutside)})}_bindM2OAutocompletes(){this._m2oInstances=this._m2oInstances.filter(e=>document.body.contains(e.input)?!0:(e.destroy(),!1)),Array.from(document.querySelectorAll(`.ls-m2o-autocomplete:not([data-m2o-bound])`)).filter(e=>!e.closest(`.ls-it-table`)).forEach(e=>{e.setAttribute(`data-m2o-bound`,`1`);let t=e.dataset.field,n=e.dataset.relation;if(!n||!t)return;let r=e.closest(`.ls-reference-widget`),i=!!r&&!!r.querySelector(`.ls-ref-model`),a=i?r.dataset.field:t,o=(this._formDef.field_defs||{})[a],s=o?.options||{},c=e.closest(`.ls-m2o-widget`),l=this.state.relOptions[a]||[],u=new window.M2OAutocomplete({input:e,relation:n,fieldLabel:o?.string||a,fieldName:a,relOptions:l,options:{no_create:c?.dataset.noCreate===`1`||s.no_create,no_quick_create:c?.dataset.noQuickCreate===`1`||s.no_quick_create,no_create_edit:c?.dataset.noCreateEdit===`1`||s.no_create_edit,domain:o?.domain||null},onSelect:e=>{if(i){let t=r.querySelector(`.ls-ref-model`).value;this.updateField(a,[t,e.id,e.name])}else this.updateField(a,[e.id,e.name])},onClear:()=>{if(i){let e=r.querySelector(`.ls-ref-model`).value;this.updateField(a,e?`${e},`:``)}else this.updateField(a,!1)}});this._m2oInstances.push(u)}),document.querySelectorAll(`.ls-m2o-external-link:not([data-bound])`).forEach(e=>{e.setAttribute(`data-bound`,`1`),e.addEventListener(`click`,t=>{t.preventDefault();let n=e.closest(`.ls-reference-widget`),r=!!n&&!!n.querySelector(`.ls-ref-model`),i=r?n.dataset.field:e.dataset.field,a=parseInt(e.dataset.id),o=(this._formDef.field_defs||{})[i],s=r?n.querySelector(`.ls-ref-model`).value:o?.relation;s&&a&&window.__doAction&&window.__doAction({type:`ir.actions.act_window`,res_model:s,res_id:a,view_mode:`form`})})}),document.querySelectorAll(`.ls-m2o-clear:not([data-bound])`).forEach(e=>{e.setAttribute(`data-bound`,`1`),e.addEventListener(`click`,t=>{t.preventDefault();let n=e.closest(`.ls-reference-widget`);if(n&&n.querySelector(`.ls-ref-model`)){let e=n.dataset.field,t=n.querySelector(`.ls-ref-model`).value;this.updateField(e,t?`${t},`:``)}else{let t=e.dataset.field;this.updateField(t,!1)}})}),document.querySelectorAll(`.ls-m2o-dropdown-trigger:not([data-bound])`).forEach(e=>{e.setAttribute(`data-bound`,`1`),e.addEventListener(`click`,t=>{t.preventDefault(),e.dataset.field;let n=e.closest(`.ls-m2o-widget`)?.querySelector(`.ls-m2o-autocomplete`);n&&n.focus()})})}_bindSignatures(){document.querySelectorAll(`.ls-signature-widget:not([data-bound-widget])`).forEach(e=>{e.setAttribute(`data-bound-widget`,`1`);let t=e.dataset.field,n=e.querySelector(`.ls-sig-clear`);n&&n.addEventListener(`click`,()=>{this.updateField(t,!1)});let r=e.querySelector(`.ls-sig-canvas`);if(!r)return;let i=r.getContext(`2d`),a=!1,o=0,s=0,c=e=>{let t=r.getBoundingClientRect(),n=e.touches?e.touches[0].clientX:e.clientX,i=e.touches?e.touches[0].clientY:e.clientY;return{x:(n-t.left)*(r.width/t.width),y:(i-t.top)*(r.height/t.height)}},l=e=>{a=!0;let t=c(e);o=t.x,s=t.y,e.type===`touchstart`&&e.preventDefault()},u=e=>{if(!a)return;let t=c(e);i.beginPath(),i.moveTo(o,s),i.lineTo(t.x,t.y),i.strokeStyle=`#1e293b`,i.lineWidth=3,i.lineCap=`round`,i.stroke(),o=t.x,s=t.y,e.type===`touchmove`&&e.preventDefault()},d=()=>{a=!1};r.addEventListener(`mousedown`,l),r.addEventListener(`mousemove`,u),r.addEventListener(`mouseup`,d),r.addEventListener(`mouseout`,d),r.addEventListener(`touchstart`,l,{passive:!1}),r.addEventListener(`touchmove`,u,{passive:!1}),r.addEventListener(`touchend`,d);let f=e.querySelector(`.ls-sig-accept`),p=e.querySelector(`.ls-sig-clear-pad`);f&&f.addEventListener(`click`,()=>{let e=r.toDataURL(`image/png`).split(`,`)[1];this.updateField(t,e)}),p&&p.addEventListener(`click`,()=>{i.clearRect(0,0,r.width,r.height)})})}async _loadRelOptions(){let e=this._formDef.field_defs||{},t=[],n=[],r={};for(let[i,a]of Object.entries(e))(a.type===`many2one`||a.type===`many2many`)&&a.relation&&(n.push(i),r[a.relation]||(r[a.relation]=o.nameSearch(a.relation,``,100).catch(()=>[])),t.push(r[a.relation]));let i=await Promise.all(t),a={};n.forEach((e,t)=>{a[e]=i[t]||[]}),this.state.relOptions=a}async _loadChildFieldDefs(){let e=this._formDef.field_defs||{},t=[],n=[];for(let[r,i]of Object.entries(e))i.type!==`one2many`&&i.type!==`many2many`||i.widget===`many2many_tags`||i.widget===`many2many_checkboxes`||i.relation&&(n.push({fname:r,fdef:i}),i.child_field_defs||t.push(o.fieldsGet(i.relation).then(e=>{i.child_field_defs=e}).catch(e=>console.warn(`Failed to load child field defs for`,r,e))));await Promise.all(t);let r={},i=[],a=[];for(let{fname:e,fdef:t}of n){let n=t.child_field_defs||{};this._childFieldDefs[e]=n;let s=t.tree_fields;if(!s){let r=(this._formDef.tabs||[]).find(t=>t.field===e);s=r?r.tree_fields:Object.keys(n).slice(0,10),t.tree_fields=s}let c={...this.state.o2mRelOptions};for(let e of s||[]){let t=n[e];t&&t.type===`many2one`&&t.relation&&(r[t.relation]||(c[e]?r[t.relation]=Promise.resolve(c[e]):r[t.relation]=o.nameSearch(t.relation,``,100).catch(()=>[])),i.push(r[t.relation]),a.push({fname:e,promiseIdx:i.length-1}))}}let s=await Promise.all(i),c={...this.state.o2mRelOptions};for(let e of a)c[e.fname]=s[e.promiseIdx]||[];this.state.o2mRelOptions=c}async loadRecord(){if(this.state.loading=!0,!this.props.recordId||this.props.recordId===`null`){if(this.state.record=await o.defaultGet(this._model),this.props.actionContext){for(let[e,t]of Object.entries(this.props.actionContext))if(e.startsWith(`default_`)){let n=e.substring(8);this.state.record[n]=t}}}else this.state.record=await o.read(this._model,this.props.recordId);this.state.loading=!1,this.state.dirty=!1}_onWidgetFocusOut(e){let t=e.target;if(t.closest(`.ls-inline-tree`))return;let n=t.getAttribute(`data-field`);n&&t.isContentEditable&&this.updateField(n,t.innerHTML)}_onWidgetChange(e){let t=e.target;if(t.closest(`.ls-inline-tree`))return;if(t.classList.contains(`ls-ref-model`)){let e=t.closest(`.ls-reference-widget`);if(e){let n=e.getAttribute(`data-field`),r=t.value;r?this.updateField(n,`${r},`):this.updateField(n,``)}return}let n=t.getAttribute(`data-field`);if(!n)return;if(t.type===`file`){let e=t.files[0];if(e){let t=new FileReader;t.onload=e=>{let t=e.target.result.split(`,`)[1];this.updateField(n,t)},t.readAsDataURL(e)}else this.updateField(n,null);return}let r=t.value;t.type===`checkbox`&&(r=t.checked),t.type===`number`&&(r=parseFloat(t.value)),this.updateField(n,r)}_onWidgetClick(e){let t=e.target;if(!t.closest(`.ls-inline-tree`)){if(t.classList.contains(`ls-domain-hint`)||t.closest(`.ls-domain-hint`)){let e=t.closest(`.ls-domain-builder`);if(e){let t=e.getAttribute(`data-field`),n=this.state.record[t]||`[]`,r=this.state.record.res_model||this.state.record.model_id||this._model;window.DomainBuilderDialog.open({domain:n,model:r,onSave:n=>{this.updateField(t,n);let r=e.querySelector(`input`);r&&(r.value=n)}})}return}if(t.classList.contains(`ls-priority-star`)&&t.hasAttribute(`data-level`)){let e=t.getAttribute(`data-field`),n=parseInt(t.getAttribute(`data-level`)),r=Number(this.state.record[e]);this.updateField(e,String(r===n?n-1:n))}if(t.classList.contains(`ls-favorite-widget`)){let e=t.getAttribute(`data-field`),n=parseInt(t.getAttribute(`data-val`))||0;this.updateField(e,+!n)}if(t.hasAttribute(`data-upload`)){e.preventDefault();let n=t.getAttribute(`data-upload`),r=t.parentElement.querySelector(`input[type="file"][data-field="${n}"]`);r&&r.click()}if(t.hasAttribute(`data-clear-image`)||t.closest(`[data-clear-image]`)){e.preventDefault();let n=t.hasAttribute(`data-clear-image`)?t:t.closest(`[data-clear-image]`),r=n.getAttribute(`data-clear-image`);this.updateField(r,!1);let i=n.closest(`.ls-image-widget`);if(i){let e=i.querySelector(`img.ls-image-preview`);if(e){let t=document.createElement(`div`);t.className=`ls-image-placeholder`,t.textContent=`📷`;let n=i.querySelector(`.ls-image-container`);n&&(t.style.width=n.style.width,t.style.height=n.style.height,t.style.lineHeight=n.style.height),e.replaceWith(t)}n.style.display=`none`}}if(t.hasAttribute(`data-copy`)){e.preventDefault();let n=t.getAttribute(`data-copy`);navigator.clipboard.writeText(n).then(()=>{let e=t.innerText;t.innerText=`✓`,setTimeout(()=>t.innerText=e,1500)})}if(t.classList.contains(`ls-badges-item`)&&t.hasAttribute(`data-value`)){let e=t.getAttribute(`data-field`),n=t.getAttribute(`data-value`);this.updateField(e,n)}if(t.classList.contains(`ls-color-dot`)&&t.hasAttribute(`data-value`)){let e=t.getAttribute(`data-field`),n=t.getAttribute(`data-value`);this.updateField(e,n)}if(t.classList.contains(`ls-boolean-btn`)&&t.hasAttribute(`data-field`)){let e=t.getAttribute(`data-field`);this.updateField(e,!this.state.record[e])}if(t.hasAttribute(`data-m2m-id`)){let e=parseInt(t.getAttribute(`data-m2m-id`)),n=t.closest(`.ls-m2m-checkboxes-widget`);if(n){let r=n.getAttribute(`data-field`),i=this.state.record[r]||[];if(t.checked){let t=(this.state.relOptions[r]||[]).find(t=>t.id===e);t&&i.push(t)}else i=i.filter(t=>t.id!==e);this.state.record[r]=i,this.state.dirty=!0}}}}_debounceTimers={};debouncedUpdate(e,t){this._debounceTimers[e]&&clearTimeout(this._debounceTimers[e]),this._debounceTimers[e]=setTimeout(()=>{this.updateField(e,t),delete this._debounceTimers[e]},300)}updateField(e,t){this.state.record[e]=t,this.state.dirty=!0,this._triggerOnchange(e)}async _triggerOnchange(e){try{let t=this._formDef.field_defs||{},n={};for(let[e,r]of Object.entries(t)){if(r.type===`one2many`)continue;let t=this.state.record[e];r.type===`many2one`?n[e]=Array.isArray(t)?t[0]:t:n[e]=t??null}let r=await o.onchange(this._model,e,n);if(r&&r.values){let t=[];for(let[n,i]of Object.entries(r.values)){let r=this.state.record[n],a=Array.isArray(r)?r[0]:r,o=Array.isArray(i)?i[0]:i;n!==e&&a!==o&&(this.state.record[n]=i,t.push(n))}t.length>0&&(console.log(`[Onchange]`,e,`→ updated:`,t.join(`, `)),this._showOnchangeToast(e,t))}}catch(t){console.warn(`[Onchange] error for field`,e,t)}}_showOnchangeToast(e,t){let n=this._formDef.field_defs||{},r=t.map(e=>n[e]?.string||e).join(`, `),i=n[e]?.string||e,a=document.createElement(`div`);a.className=`ls-onchange-toast`,a.innerHTML=`<span class="ls-onchange-icon">⚡</span> <strong>${i}</strong> → updated: ${r}`,document.body.appendChild(a),requestAnimationFrame(()=>a.classList.add(`visible`)),setTimeout(()=>{a.classList.remove(`visible`),setTimeout(()=>a.remove(),300)},3e3)}get statusbarStages(){let e=this._formDef.statusbar;if(!e)return[];let t=(this._formDef.field_defs||{})[e];return t?t.type===`selection`&&t.selection?(Array.isArray(t.selection)?t.selection:Object.entries(t.selection)).map((e,t)=>({id:Array.isArray(e)?e[0]:e.value,name:Array.isArray(e)?e[1]:e.label,sequence:t,_isSelection:!0})):this.state.relOptions[e]||this.props.stages||[]:[]}get isStatusbarSelection(){let e=this._formDef.statusbar;return e?(this._formDef.field_defs||{})[e]?.type===`selection`:!1}get titleField(){return this._formDef.title_field||null}get priorityField(){return this._formDef.priority_field||null}get headerButtons(){return(this._formDef.header_buttons||[]).filter(e=>this._evalInvisible(e))}get statButtons(){return(this._formDef.stat_buttons||[]).filter(e=>this._evalInvisible(e))}_evalInvisible(e){return e.invisible?!this._evalAttrExpr(e.invisible):!0}formatStatValue(e){let t=this.state.record[e]??0,n=(this._formDef.field_defs||{})[e];return n?n.widget===`monetary`||n.type===`monetary`?new Intl.NumberFormat(`id-ID`,{style:`currency`,currency:window.LarasoftUser?.company_currency||`IDR`,minimumFractionDigits:0,maximumFractionDigits:0}).format(t):n.widget===`integer`||n.type===`integer`?new Intl.NumberFormat(`id-ID`,{maximumFractionDigits:0}).format(t):n.widget===`float`||n.type===`float`?new Intl.NumberFormat(`id-ID`,{minimumFractionDigits:2,maximumFractionDigits:2}).format(t):String(t):String(t)}get chatterConfig(){return this._formDef.chatter||null}async onActionClick(e){if(!(e.confirm&&!confirm(e.confirm)))if(this.state.dirty&&await this.saveRecord(),e.type===`object`)try{let t=await window.LarasoftRPC.call_button(this.props.model,this.props.recordId,e.name);if(t.action)if(t.action.type===`ir.actions.client`){if(t.action.tag===`reload`)await this.loadRecord();else if(t.action.tag===`display_notification`){let e=t.action.params||{};this.showToast(`${e.title||`Notification`}: ${e.message||``}`),await this.loadRecord()}}else t.action.type===`ir.actions.act_window`?window.__doAction?window.__doAction(t.action):window.location.hash=`#action=window&model=${t.action.res_model}&view_type=${t.action.view_mode.split(`,`)[0]}`:t.action===!0&&await this.loadRecord();else await this.loadRecord()}catch(e){alert(`Action Error: ${e.message}`)}else e.type===`action`&&alert(`Action type not fully implemented yet`)}async _fetchPrintActions(){try{let e=await fetch(`/api/report/actions?model=`+this._model,{headers:{Accept:`application/json`}});e.ok&&(this.state.printActions=await e.json())}catch(e){console.error(`Failed to load print actions`,e)}}togglePrintMenu(){this.state.showPrintMenu=!this.state.showPrintMenu}printReport(e){this.state.record.id&&(window.open(`/api/report/pdf/`+e+`?ids=`+this.state.record.id,`_blank`),this.state.showPrintMenu=!1)}get formTabs(){return this._formDef.tabs||[]}renderTabField(e){let t=(this._formDef.field_defs||{})[e.field];return t?window.formHelpers.renderWidget(t,this.state.record[e.field],{}):owl.markup(`<textarea class="ls-description-area" data-field="${e.field}" placeholder="Add content...">${this.state.record[e.field]||``}</textarea>`)}getTabGroups(e){if(!e.groups)return[];let t=this._formDef.field_defs||{},n=[];for(let r of e.groups){let e={string:r.string||null,col:r.col||(r.columns?r.columns.length:2),colspan:r.colspan||1},i=r.columns||[],a=[];for(let e of i){let n=[];for(let r of e){let e,i;typeof r==`string`?(e=r,i={}):(e=r.name,i=r);let a=t[e];if(!a)continue;let o=i.attrs||{};if(o.invisible&&this._evalAttrExpr(o.invisible))continue;let s=o.readonly?this._evalAttrExpr(o.readonly):i.readonly||a.readonly,c=o.required?this._evalAttrExpr(o.required):i.required||a.required,l={...a};i.widget&&(l.widget=i.widget),i.options&&(l.options={...a.options||{},...i.options});let u=this.state.relOptions[e]||[],d=window.formHelpers.renderWidget(l,this.state.record[e],{relOptions:u,readonly:s,required:c}),f=null,p=null;if(l.widget===`one2many`||l.widget===`many2many`||!l.widget&&(l.type===`one2many`||l.type===`many2many`)){let t={...l,field:e};l.type===`many2many`&&t.add_from_list===void 0&&(t.add_from_list=!0),f=window.InlineTreeWidget,p={tabDef:t,lines:this.state.record[e]||[],parentRecord:this.state.record,parentModel:this.props.model||``,relOptions:this.state.o2mRelOptions,onLineAdd:e=>this.addO2mLine(t,e),onLineUpdate:(e,n,r,i)=>this.updateO2mLine(t,e,n,r,i),onLineBatchUpdate:(e,n)=>this.batchUpdateO2mLine(t,e,n),onLineDelete:e=>this.deleteO2mLine(t,e),onLineLink:e=>this.linkO2mRecords(t,e)}}n.push({name:e,label:i.label||i.string||a.string||e,nolabel:i.nolabel||!1,colspan:i.colspan||1,html:d,component:f,props:p,help:a.help||``,readonly:s,required:c})}a.push(n)}n.push({...e,columns:a})}return n}get formGroups(){if(!this._formDef.groups)return[];let e=[],t=this._formDef.field_defs||{};for(let n of this._formDef.groups){let r={string:n.string||null,col:n.col||(n.columns?n.columns.length:2),colspan:n.colspan||1},i=n.columns||n,a=[];for(let e of i){let n=[];for(let r of e){let e,i;typeof r==`string`?(e=r,i={}):(e=r.name,i=r);let a=t[e];if(!a)continue;let o=i.attrs||{};if(o.invisible&&this._evalAttrExpr(o.invisible))continue;let s=o.readonly?this._evalAttrExpr(o.readonly):a.readonly,c=o.required?this._evalAttrExpr(o.required):a.required,l=i.widget||null,u=i.options||null,d={...a};l&&(d.widget=l),u&&(d.options={...a.options||{},...u});let f=this.state.relOptions[e]||[],p=window.formHelpers.renderWidget(d,this.state.record[e],{relOptions:f,readonly:s,required:c}),m=null,h=null,g=d.widget===`one2many`||d.widget===`many2many`||!d.widget&&(d.type===`one2many`||d.type===`many2many`);if(d.widget===`many2many_tags`)m=window.Many2manyTagsWidget,h={tags:this.state.record[e]||[],relation:d.relation||``,name:e,label:d.string||e,readonly:s,relOptions:f,options:d.options||{},noCreate:(d.options||{}).no_create,onAdd:t=>{let n=this.state.record[e]?[...this.state.record[e]]:[];n.find(e=>e.id===t.id)||(n.push(t),this.updateField(e,n))},onRemove:t=>{let n=(this.state.record[e]||[]).filter(e=>e.id!==t);this.updateField(e,n)}};else if(g){let t={...d,field:e};d.type===`many2many`&&t.add_from_list===void 0&&(t.add_from_list=!0),m=window.InlineTreeWidget,h={tabDef:t,lines:this.state.record[e]||[],parentRecord:this.state.record,parentModel:this.props.model||``,relOptions:this.state.o2mRelOptions,onLineAdd:e=>this.addO2mLine(t,e),onLineUpdate:(e,n,r,i)=>this.updateO2mLine(t,e,n,r,i),onLineBatchUpdate:(e,n)=>this.batchUpdateO2mLine(t,e,n),onLineDelete:e=>this.deleteO2mLine(t,e),onLineLink:e=>this.linkO2mRecords(t,e)}}n.push({name:e,label:i.label||i.string||a.string||e,nolabel:i.nolabel||!1,colspan:i.colspan||1,html:p,component:m,props:h,help:a.help||``,readonly:s,required:c})}a.push(n)}e.push({...r,columns:a})}return e}_evalAttrExpr(e){if(!e)return!1;if(typeof e==`boolean`)return e;try{let t=this.state.record,n=String(e).replace(/ and /g,` && `).replace(/ or /g,` || `).replace(/!=/g,`!==`).replace(/([^!><])={1}(?!=)/g,`$1===`).replace(/False/g,`false`).replace(/True/g,`true`),r=Object.keys(t),i=r.map(e=>{let n=t[e];return Array.isArray(n)?n[0]:n});return Function(...r,`return !!(${n});`)(...i)}catch{return!1}}setStage(e){let t=this._formDef.statusbar;if(t){if(this.isStatusbarSelection)this.state.record[t]=e;else{let n=this.statusbarStages.find(t=>t.id===e);this.state.record[t]=n?[n.id,n.name]:this.state.record[t]}this.state.dirty=!0}}isStageCompleted(e){let t=this._formDef.statusbar;if(!t||!this.state.record[t])return!1;if(this.isStatusbarSelection){let n=this.statusbarStages,r=n.findIndex(e=>e.id===this.state.record[t]);return n.findIndex(t=>t.id===e.id)<r}let n=this.statusbarStages.find(e=>e.id===this.state.record[t]?.[0]);return n?e.sequence<n.sequence:!1}isStageActive(e){let t=this._formDef.statusbar;return t?this.isStatusbarSelection?this.state.record[t]===e.id:Array.isArray(this.state.record[t])&&this.state.record[t][0]===e.id:!1}setPriority(e){if(!this.priorityField)return;let t=Number(this.state.record[this.priorityField]);this.state.record[this.priorityField]=String(t===e?e-1:e),this.state.dirty=!0}getFieldLabel(e){for(let t of Object.values(this._childFieldDefs))if(t[e])return t[e].string||e;return(this._formDef.field_defs||{})[e]?.string||e}getChildFieldDef(e,t){return(this._childFieldDefs[e]||{})[t]||null}isO2mFieldMany2one(e,t){let n=this.getChildFieldDef(e,t);return n&&n.type===`many2one`}getO2mRelOptions(e){return this.state.o2mRelOptions[e]||[]}getO2mM2oDisplayId(e,t){let n=e[t];return Array.isArray(n)?n[0]:n||``}getO2mInputType(e){for(let t of Object.values(this._childFieldDefs)){let n=t[e];if(n)return n.type===`many2one`?`many2one`:n.type===`date`?`date`:n.type===`datetime`?`datetime-local`:n.type===`float`||n.type===`integer`||n.type===`monetary`?`number`:n.type===`boolean`?`checkbox`:`text`}return e===`date`||e.endsWith(`_date`)?`date`:e.includes(`hours`)||e.includes(`qty`)||e.includes(`amount`)||e===`progress`?`number`:`text`}getO2mStep(e){for(let t of Object.values(this._childFieldDefs)){let n=t[e];if(n&&n.digits)return String(10**-(n.digits[1]||2))}return e.includes(`hours`)||e.includes(`amount`)?`0.01`:e.includes(`qty`)?`1`:``}computeO2mSum(e){return(this.state.record[e.field]||[]).reduce((t,n)=>{let r=n[e.sum_field];return Array.isArray(r)&&(r=r[0]),t+(parseFloat(r)||0)},0).toFixed(1)}_o2mDebounceTimers=new Map;async addO2mLine(e,t){if(!(e.child_model||this._formDef.field_defs?.[e.field]?.relation))return null;if((!this.state.record.id||this.state.record.id===`null`)&&(window.LarasoftToast&&window.LarasoftToast.info(`Auto-saving record to attach lines...`),await this.saveRecord(),!this.state.record.id||this.state.record.id===`null`))return window.LarasoftToast&&window.LarasoftToast.error(`Please complete required fields first.`),null;let n=this._formDef.field_defs?.[e.field],r=e.inverse_field||(n?n.inverse_field:null);r&&this.state.record.id&&this.state.record.id!==`null`&&(t[r]=this.state.record.id);try{let n=await o.createChild(this._model,e.field,t,e.context||null),r=n.record||n;return this.state.record[e.field]||(this.state.record[e.field]=[]),this.state.record[e.field]=[...this.state.record[e.field],r],this.state.dirty=!0,r}catch(e){return window.LarasoftToast&&window.LarasoftToast.error(`Add line failed: `+e.message),null}}updateO2mLine(e,t,n,r,i){let a=e.child_model||this._formDef.field_defs?.[e.field]?.relation;if(!a)return;let s=this.state.record[e.field]||[],c=typeof t==`string`?parseInt(t):t,l=s.find(e=>e.id===c||e.id===t||e.__temp_id===t);if(!l)return;let u=l[n];l[n]=r,this.state.dirty=!0,this.state.record[e.field]=[...s];let d=`${e.field}:${l.id||t}:${n}`,f=this._o2mDebounceTimers.get(d);f&&clearTimeout(f.timer);let p=async()=>{try{let e=await o.updateChild(a,l.id,{[n]:i===void 0?r:i},l.write_date||null);e&&e.write_date&&(l.write_date=e.write_date),window.dispatchEvent&&window.dispatchEvent(new CustomEvent(`ls-o2m-saved`,{detail:{lineId:l.id||t}}))}catch(t){l[n]=u,this.state.record[e.field]=[...s],window.LarasoftToast&&window.LarasoftToast.error(`Update ${n} failed: ${t.message}`)}finally{this._o2mDebounceTimers.delete(d)}};this._o2mDebounceTimers.set(d,{timer:setTimeout(p,250),execute:p})}batchUpdateO2mLine(e,t,n){let r=e.child_model||this._formDef.field_defs?.[e.field]?.relation;if(!r)return;let i=this.state.record[e.field]||[],a=typeof t==`string`?parseInt(t):t,s=i.find(e=>e.id===a||e.id===t||e.__temp_id===t);if(!s)return;let c={};Object.keys(n).forEach(e=>{c[e]=s[e]}),Object.assign(s,n),this.state.dirty=!0,this.state.record[e.field]=[...i];let l={};Object.entries(n).forEach(([e,t])=>{l[e]=Array.isArray(t)?t[0]:t}),Object.keys(n).forEach(n=>{let r=`${e.field}:${s.id||t}:${n}`,i=this._o2mDebounceTimers.get(r);i&&(clearTimeout(i.timer),this._o2mDebounceTimers.delete(r))}),s.id&&o.updateChild(r,s.id,l,s.write_date||null).then(e=>{e&&e.write_date&&(s.write_date=e.write_date),window.dispatchEvent&&window.dispatchEvent(new CustomEvent(`ls-o2m-saved`,{detail:{lineId:s.id||t}}))}).catch(t=>{Object.assign(s,c),this.state.record[e.field]=[...i],window.LarasoftToast&&window.LarasoftToast.error(`Batch update failed: ${t.message}`)})}async deleteO2mLine(e,t){let n=e.child_model||this._formDef.field_defs?.[e.field]?.relation;if(!n)return;let r=typeof t==`string`?parseInt(t):t;try{if(e.type===`many2many`){this.state.record[e.field]=(this.state.record[e.field]||[]).filter(e=>e.id!==r&&e.id!==t&&e.__temp_id!==t),this.state.dirty=!0;return}await o.deleteChild(n,r),this.state.record[e.field]=(this.state.record[e.field]||[]).filter(e=>e.id!==r&&e.id!==t&&e.__temp_id!==t)}catch(e){console.warn(`Failed to delete O2M line:`,e)}}linkO2mRecords(e,t){this.state.record[e.field]||(this.state.record[e.field]=[]);let n=this.state.record[e.field],r=new Set(n.map(e=>e.id));for(let e of t)r.has(e.id)||n.push(e);this.state.record[e.field]=[...n],this.state.dirty=!0}_handleKeyboardShortcuts(e){let t=e.target.tagName,n=t===`INPUT`||t===`TEXTAREA`||t===`SELECT`||e.target.isContentEditable,r=e.ctrlKey||e.metaKey;if(r&&e.key===`s`){e.preventDefault(),this.state.dirty&&this.saveRecord();return}if(r&&e.shiftKey&&e.key===`S`){e.preventDefault(),this.state.dirty&&this.saveRecord().then(()=>{this.props.onBack&&this.props.onBack()});return}if(e.key===`Escape`&&!n){this.state.dirty?confirm(`You have unsaved changes. Discard them?`)&&this.discardChanges():this.props.onBack&&this.props.onBack();return}if(r&&e.key===`d`&&!n&&this.props.recordId>0){e.preventDefault(),this.duplicateRecord();return}if(r&&e.key===`n`&&!n){e.preventDefault(),this.props.onBack&&this.props.onBack();return}if(!n&&e.key===`ArrowLeft`&&this.props.recordIndex>1){e.preventDefault(),this.props.onNavigate&&this.props.onNavigate(this.props.recordIndex-1);return}if(!n&&e.key===`ArrowRight`&&this.props.recordIndex<this.props.totalRecords){e.preventDefault(),this.props.onNavigate&&this.props.onNavigate(this.props.recordIndex+1);return}}async saveRecord(){this._rteInstances&&this._rteInstances.forEach(e=>{e.fieldName&&(this.state.record[e.fieldName]=e.getValue())});let e=this.state.record,t=this._formDef.field_defs||{},n={};for(let[n,r]of Object.entries(t)){if(!r.required||r.readonly)continue;let t=e[n];if(t==null||t===``||t===!1||Array.isArray(t)&&t.length===0||typeof t==`object`&&!Array.isArray(t)&&Object.keys(t).length===0){this._markFieldError(n,`${r.string||n} is required.`),alert(`${r.string||n} is required.`);return}}let r=Array.from(this._o2mDebounceTimers.values());for(let e of r)clearTimeout(e.timer),await e.execute();for(let[r,i]of Object.entries(t))if(!i.readonly)if(i.type===`many2one`)n[r]=e[r]?Array.isArray(e[r])?e[r][0]:e[r]:null;else if(i.type===`many2many`)n[r]=(e[r]||[]).map(e=>e.id);else if(i.type===`one2many`)continue;else i.type===`reference`?Array.isArray(e[r])?n[r]=e[r][1]?`${e[r][0]},${e[r][1]}`:null:typeof e[r]==`string`&&e[r].endsWith(`,`)?n[r]=null:n[r]=e[r]||null:i.store!==!1&&(n[r]=e[r]??null);if(!e.id||e.id===`null`){let e=await o.create(this._model,n);this.state.dirty=!1,this.props.onSaved?this.props.onSaved(e):this.props.onNavigate&&this.props.onNavigate(`form`,e.id)}else await o.write(this._model,[e.id],n),this.state.dirty=!1,this.props.onSaved&&this.props.onSaved(e)}_markFieldError(e,t){let n=this.formFieldsRef.el?.querySelector(`[data-field="${e}"]`);n&&(n.classList.add(`ls-field-error`),n.setAttribute(`title`,t),setTimeout(()=>n.classList.remove(`ls-field-error`),4e3),n.focus())}async discardChanges(){await this.loadRecord()}toggleChatter(){this.state.showComposer=!this.state.showComposer,this.state.composerType=`message`}logNote(){this.state.showComposer=!0,this.state.composerType=`note`}toggleActivities(){alert(`Activity scheduling coming soon`)}async sendMessage(){let e=document.querySelector(`.oe_chatter_textarea`);if(!e||!e.value.trim())return;let t={id:Date.now(),author:`Current User`,date:new Date().toLocaleString(),body:e.value.trim(),type:this.state.composerType};this.state.messages=[t,...this.state.messages],this.state.showComposer=!1,e.value=``;try{await o.call(`/api/orm/log_message`,{model:this._model,id:this.state.record.id,body:t.body,type:t.type})}catch(e){console.warn(`Message log failed:`,e)}}showToast(e){let t=document.createElement(`div`);t.className=`ls-onchange-toast`,t.innerHTML=`<span class="ls-onchange-icon">✓</span> ${e}`,document.body.appendChild(t),requestAnimationFrame(()=>t.classList.add(`visible`)),setTimeout(()=>{t.classList.remove(`visible`),setTimeout(()=>t.remove(),300)},3e3)}goBack(){this.state.dirty&&!confirm(`Discard unsaved changes?`)||this.props.onBack()}prevRecord(){this.state.dirty&&!confirm(`Discard unsaved changes?`)||this.props.onNavigate(-1)}nextRecord(){this.state.dirty&&!confirm(`Discard unsaved changes?`)||this.props.onNavigate(1)}_bindImageValidation(){document.querySelectorAll(`.ls-image-widget input[type="file"][data-validate="image"]:not([data-bound])`).forEach(e=>{e.setAttribute(`data-bound`,`1`);let t=e.closest(`.ls-image-widget`),n=parseInt(t.dataset.maxSize)||10*1024*1024,r=(t.dataset.allowedTypes||`image/png,image/jpeg,image/webp,image/gif`).split(`,`).map(e=>e.trim()),i=t.querySelector(`.ls-image-error`),a=a=>{if(!a)return;if(a.size>n){let t=(n/1024/1024).toFixed(1);i&&(i.textContent=`File too large (max ${t}MB)`,i.style.display=`block`),e.value=``;return}if(!r.includes(a.type)){i&&(i.textContent=`Invalid type. Allowed: ${r.join(`, `)}`,i.style.display=`block`),e.value=``;return}i&&(i.style.display=`none`);let o=new FileReader;o.onload=()=>{let n=o.result.split(`,`)[1]||``;this.state.record[e.dataset.field]=n,this.state.dirty=!0,this.updateField(e.dataset.field,n);let r=t.querySelector(`img.ls-image-preview`);if(!r){r=document.createElement(`img`),r.className=`ls-image-preview`;let e=t.querySelector(`.ls-image-container`);e&&(r.width=parseInt(e.style.width)||90,r.height=parseInt(e.style.height)||90);let n=t.querySelector(`.ls-image-placeholder`);n&&n.replaceWith(r)}r.src=o.result;let i=t.querySelector(`.ls-image-clear-btn`);i&&(i.style.display=`flex`)},o.readAsDataURL(a)};e.addEventListener(`change`,e=>{a(e.target.files?.[0])}),t.addEventListener(`dragover`,e=>{e.preventDefault(),t.classList.add(`drag-over`),t.style.borderColor=`var(--ls-primary, #714b67)`,t.style.backgroundColor=`var(--ls-primary-light, #fdf4f9)`}),t.addEventListener(`dragleave`,e=>{e.preventDefault(),t.classList.remove(`drag-over`),t.style.borderColor=``,t.style.backgroundColor=``}),t.addEventListener(`drop`,e=>{e.preventDefault(),t.classList.remove(`drag-over`),t.style.borderColor=``,t.style.backgroundColor=``;let n=e.dataTransfer?.files?.[0];n&&a(n)})})}_bindRTEInstances(){window.LarasoftRTE&&(this._rteInstances=(this._rteInstances||[]).filter(e=>{if(!document.body.contains(e.mountEl))return e.destroy(),!1;let t=``;try{t=JSON.parse(e.mountEl.getAttribute(`data-rte-value`)||`""`)}catch{t=e.mountEl.getAttribute(`data-rte-value`)||``}return t!==e.getValue()&&(!e.contentEl||!e.contentEl.contains(document.activeElement))&&e.setValue(t),!0}),document.querySelectorAll(`[data-rte="1"]:not([data-rte-mounted])`).forEach(e=>{e.setAttribute(`data-rte-mounted`,`1`);let t=e.getAttribute(`data-rte-field`),n=e.getAttribute(`data-rte-model`)||this._model||``,r={};try{r=JSON.parse(e.getAttribute(`data-rte-config`)||`{}`)}catch{r={}}let i=``;try{i=JSON.parse(e.getAttribute(`data-rte-value`)||`""`)}catch{i=e.getAttribute(`data-rte-value`)||``}let a=window.LarasoftRTE.create(e,{value:i,model:n,field:t,html:r,placeholder:r.placeholder||e.placeholder||`Write something…`,onChange:e=>{t&&this.updateField(t,e)}});a.mountEl=e,this._rteInstances.push(a)}))}}window.FormView=s})(),(function(){let{Component:e,xml:t,useState:n,onMounted:r}=owl,i=window.LarasoftRPC;class a extends e{static template=t`
<div class="ls-m2o-dialog-overlay" t-on-click="onOverlayClick" style="z-index: 10000; display:flex; align-items:center; justify-content:center;">
    <div class="ls-m2o-dialog ls-form-dialog" style="width: 90vw; height: 90vh; max-width: 1000px; max-height: 800px; display: flex; flex-direction: column; background: #fff; border-radius: 6px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);" t-on-click.stop="">
        <div class="ls-m2o-dialog-header" style="flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--ls-border,#e5e7eb);">
            <h3 t-esc="props.title || 'Record'" style="margin: 0; font-size: 16px; font-weight: 600;"/>
            <button class="ls-m2o-dialog-close" t-on-click="onCancel" style="background:none; border:none; font-size: 20px; cursor:pointer;">×</button>
        </div>
        <div class="ls-m2o-dialog-body" style="flex: 1 1 auto; overflow: auto; padding: 0; position: relative;">
            <t t-if="state.viewDef">
                <FormView
                    model="props.model"
                    recordId="props.resId"
                    formViewDef="state.viewDef"
                    onBack="() => this.onCancel()"
                    onSaved="(rec) => this.onSaved(rec)"
                    onNavigate="() => {}"
                />
            </t>
            <t t-else="">
                <div style="padding: 20px; text-align:center; color:#6b7280;">Loading form...</div>
            </t>
        </div>
    </div>
</div>`;static components={FormView:window.FormView};static props={model:{type:String},resId:{type:[Number,String,Boolean],optional:!0},title:{type:String,optional:!0},context:{type:Object,optional:!0},onClose:{type:Function},onSaved:{type:Function,optional:!0}};setup(){this.state=n({viewDef:null,loading:!0}),r(()=>this.loadView())}async loadView(){try{this.state.loading=!0;let e=await i.getView(this.props.model,`form`);this.state.viewDef=e}catch(e){console.error(`Failed to load form view`,e)}finally{this.state.loading=!1}}onOverlayClick(e){e.target.classList.contains(`ls-m2o-dialog-overlay`)&&this.onCancel()}onCancel(){this.props.onClose&&this.props.onClose()}onSaved(e){this.props.onSaved&&this.props.onSaved(e),this.onCancel()}}window.FormViewDialog=a})();