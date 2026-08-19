// View Builder Template — Odoo Studio-style
(function(){
const { xml } = owl;

window.TEMPLATES.ViewBuilder = xml`
<div class="ls-view-builder">
  <!-- Tab Bar -->
  <div class="ls-vb-tabs">
    <button t-foreach="builderTabs" t-as="tab" t-key="tab.id"
            t-att-class="'ls-vb-tab' + (state.activeTab === tab.id ? ' active' : '')"
            t-on-click="() => this.switchTab(tab.id)">
      <t t-out="window.lucideIcon(tab.icon, 15)"/>
      <t t-esc="tab.label"/>
    </button>
  </div>

  <!-- Model Selector -->
  <div class="ls-vb-toolbar">
    <label>Model:</label>
    <select t-model="state.selectedModel" t-on-change="onModelChange">
      <option value="">— Select Model —</option>
      <t t-foreach="state.models" t-as="m" t-key="m.name">
        <option t-att-value="m.name" t-esc="m.description + ' (' + m.name + ')'"/>
      </t>
    </select>
    <div class="ls-vb-toolbar-actions">
      <button class="ls-vb-btn" t-on-click="undo" title="Undo (Ctrl+Z)">
        <t t-out="window.lucideIcon('undo-2', 14)"/>
      </button>
      <button class="ls-vb-btn" t-on-click="redo" title="Redo (Ctrl+Y)">
        <t t-out="window.lucideIcon('redo-2', 14)"/>
      </button>
      <button class="ls-vb-btn" t-on-click="viewXml">
        <t t-out="window.lucideIcon('code', 14)"/> View XML
      </button>
      <button class="ls-vb-btn" t-on-click="exportToCode">
        <t t-out="window.lucideIcon('file-code', 14)"/> Export PHP
      </button>
      <button class="ls-vb-btn" t-on-click="resetView">
        <t t-out="window.lucideIcon('rotate-ccw', 14)"/> Reset
      </button>
      <button class="ls-vb-btn ls-vb-btn-success" t-on-click="saveView" t-att-disabled="!state.selectedModel">
        <t t-out="window.lucideIcon('save', 14)"/> Save View
      </button>
    </div>
  </div>

  <!-- Empty state -->
  <div class="ls-vb-empty" t-if="!state.selectedModel">
    <t t-out="window.lucideIcon('layout-template', 48)"/>
    <p>Select a model to start building views</p>
  </div>

  <!-- Builder Body -->
  <div class="ls-vb-body" t-if="state.selectedModel">
    <!-- Left: Field Palette -->
    <div class="ls-vb-palette">
      <div class="ls-vb-palette-section" t-if="state.activeTab === 'list'">
        <div class="ls-vb-palette-title">Column Components</div>
        <div class="ls-vb-palette-item" t-foreach="listComponents" t-as="c" t-key="c.id"
             draggable="true" t-on-dragstart="(ev) => this.onPaletteDrag(ev, c)">
          <t t-out="window.lucideIcon(c.icon, 14)"/>
          <span t-esc="c.label"/>
          <span class="ls-vb-fi-type" t-esc="c.type"/>
        </div>
      </div>
      <div class="ls-vb-palette-section" t-if="state.activeTab === 'form'">
        <div class="ls-vb-palette-title">Layout Components</div>
        <div class="ls-vb-palette-item" t-foreach="formComponents" t-as="c" t-key="c.id"
             draggable="true" t-on-dragstart="(ev) => this.onPaletteDrag(ev, c)"
             t-on-dragend="(ev) => this.onPaletteDragEnd(ev)"
             t-on-click="() => this.addFormComponent(c.type)">
          <t t-out="window.lucideIcon(c.icon, 14)"/>
          <span t-esc="c.label"/>
        </div>
      </div>
      <div class="ls-vb-palette-section" t-if="state.activeTab === 'form'">
        <div class="ls-vb-palette-title">Form Settings</div>
        <div class="ls-vb-prop">
          <label>Form Label</label>
          <input type="text" t-model="state.arch.string" placeholder="Form title"></input>
        </div>
        <div class="ls-vb-prop">
          <label>Title Field (oe_title)</label>
          <select t-model="state.arch.title">
            <option value="">none</option>
            <t t-foreach="stringFields" t-as="sf" t-key="sf.name">
              <option t-att-value="sf.name" t-esc="sf.string"></option>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Statusbar Field</label>
          <select t-model="state.arch.statusbar">
            <option value="">none</option>
            <t t-foreach="availableFields" t-as="sbf" t-key="sbf.name">
              <option t-if="sbf.type === 'selection'" t-att-value="sbf.name" t-esc="sbf.string"></option>
            </t>
          </select>
        </div>
      </div>

      <!-- Model Fields -->
      <div class="ls-vb-palette-section">
        <div class="ls-vb-palette-title">Model Fields</div>
        <div class="ls-vb-field-search">
          <t t-out="window.lucideIcon('search', 13)"/>
          <input type="text" t-model="state.fieldSearch" placeholder="Search fields..." class="ls-vb-field-search-input"/>
        </div>
        <div class="ls-vb-field-list">
          <div class="ls-vb-palette-item" t-foreach="availableFields" t-as="f" t-key="f.name"
               draggable="true"
               t-on-dragstart="(ev) => this.onFieldPaletteDrag(ev, f.name)"
               t-on-dragend="(ev) => this.onFieldPaletteDragEnd(ev)"
               t-on-click="() => this.addField(f.name)"
               t-att-title="f.help || ''">
            <t t-out="window.lucideIcon(this.fieldIcon(f.type), 14)"/>
            <span t-esc="f.string"/>
            <span class="ls-vb-fi-type" t-esc="f.type"/>
          </div>
        </div>
        <div class="ls-vb-field-count" t-esc="availableFields.length + ' fields'"/>
      </div>

      <!-- Tree Attributes (List tab only) -->
      <div class="ls-vb-palette-section" t-if="state.activeTab === 'list'">
        <div class="ls-vb-palette-title">Tree Attributes</div>
        <div class="ls-vb-prop">
          <label>editable</label>
          <select t-model="state.arch.editable">
            <option value="">disabled</option>
            <option value="top">top</option>
            <option value="bottom">bottom</option>
          </select>
        </div>
        <div class="ls-vb-prop-row">
          <label>multi_edit</label>
          <label class="ls-vb-toggle">
            <input type="checkbox" t-model="state.arch.multi_edit"/>
            <span class="ls-vb-toggle-slider"></span>
          </label>
        </div>
        <div class="ls-vb-prop">
          <label>limit</label>
          <input type="number" t-model="state.arch.limit" min="10" step="10"/>
        </div>
      </div>
    </div>

    <!-- Center: Preview -->
    <div class="ls-vb-center">
      <!-- LIST BUILDER -->
      <t t-if="state.activeTab === 'list'">
        <div class="ls-vb-preview">
          <div class="ls-vb-preview-header">
            <t t-out="window.lucideIcon('table', 14)"/>
            Preview — <t t-esc="state.selectedModel"/>
          </div>
          <table class="ls-vb-table">
            <thead><tr>
              <th class="ls-vb-drag-col"></th>
              <t t-foreach="state.arch.fields or []" t-as="fn" t-key="fn">
                <th t-att-class="state.selectedField === fn ? 'ls-vb-col-selected' : ''"
                    t-on-click="() => this.selectField(fn)"
                    style="cursor:pointer">
                  <t t-esc="fieldLabel(fn)"/>
                </th>
              </t>
            </tr></thead>
            <tbody>
              <t t-foreach="[1,2,3,4]" t-as="row" t-key="row">
                <tr>
                  <td class="ls-vb-drag-col"><t t-out="window.lucideIcon('grip-vertical', 12)"/></td>
                  <t t-foreach="state.arch.fields or []" t-as="fn" t-key="fn">
                    <td t-att-class="state.selectedField === fn ? 'ls-vb-col-selected' : ''"
                        t-on-click="() => this.selectField(fn)">
                      <t t-out="sampleValue(fn, row)"/>
                    </td>
                  </t>
                </tr>
              </t>
            </tbody>
          </table>
        </div>
      </t>

      <!-- FORM BUILDER -->
      <t t-if="state.activeTab === 'form'">
        <div class="ls-vb-preview">
          <div class="ls-vb-preview-header">
            <t t-out="window.lucideIcon('file-text', 14)"/>
            Form Preview — <t t-esc="state.selectedModel"/>
          </div>
          <div class="ls-vb-form-preview">
            <t t-if="state.arch.statusbar">
              <div style="padding:8px 16px;background:#f3f4f6;border-bottom:1px solid #e5e7eb;display:flex;gap:8px;align-items:center">
                <span class="ls-vb-sample-badge">New</span>
                <span class="ls-vb-sample-badge" style="background:#dbeafe;color:#1e40af">In Progress</span>
                <span class="ls-vb-sample-badge" style="background:#d1fae5;color:#047857">Done</span>
              </div>
            </t>
            <div t-if="state.arch.stat_buttons and state.arch.stat_buttons.length" style="display:flex; justify-content:flex-end; padding:8px; border-bottom:1px solid #e5e7eb;">
              <t t-foreach="state.arch.stat_buttons" t-as="sb" t-key="sb_index">
                <button class="ls-vb-btn-ghost" style="padding:4px 8px; font-size:12px; display:flex; gap:4px; align-items:center; border:1px solid #d1d5db; border-radius:4px; margin-left:4px;" title="Remove Stat Button" t-on-click.stop="() => this.removeStatButton(sb_index)">
                  <t t-out="window.lucideIcon('bar-chart-2', 14)"></t> Stat
                  <t t-out="window.lucideIcon('trash-2', 12)"></t>
                </button>
              </t>
            </div>
            <div class="ls-vb-form-layout ls-vb-drop-zone"
                 t-on-dragover.prevent="(ev) => this.onDragOver(ev)"
                 t-on-dragleave="(ev) => this.onDragLeave(ev)"
                 t-on-drop="(ev) => this.onDropFormLayout(ev)">
              <t t-foreach="state.arch.groups or []" t-as="grp" t-key="grp_index">
                <div class="ls-vb-form-group-wrapper">
                  <div class="ls-vb-form-group-toolbar">
                     <input type="text" class="ls-vb-group-label-input"
                            t-att-value="grp.string || ''" placeholder="Group label"
                            t-on-change="(ev) => this.setGroupString(grp_index, ev.target.value)"
                            t-on-click.stop="() => {}"></input>
                     <select class="ls-vb-col-count-select" t-on-change="(ev) => this.setGroupColumns(grp_index, ev.target.value)"
                             t-on-click.stop="() => {}">
                       <option value="1" t-att-selected="(grp.columns || []).length === 1">1 col</option>
                       <option value="2" t-att-selected="(grp.columns || []).length === 2">2 col</option>
                       <option value="3" t-att-selected="(grp.columns || []).length === 3">3 col</option>
                       <option value="4" t-att-selected="(grp.columns || []).length === 4">4 col</option>
                     </select>
                     <button class="ls-vb-btn-ghost ls-vb-toolbar-icon" title="Move Up" t-on-click.stop="() => this.moveGroup(grp_index, -1)"><t t-out="window.lucideIcon('arrow-up', 12)"></t></button>
                     <button class="ls-vb-btn-ghost ls-vb-toolbar-icon" title="Move Down" t-on-click.stop="() => this.moveGroup(grp_index, 1)"><t t-out="window.lucideIcon('arrow-down', 12)"></t></button>
                     <button class="ls-vb-btn-ghost ls-vb-toolbar-icon" style="color:#ef4444" title="Remove Group" t-on-click.stop="() => this.removeGroup(grp_index)"><t t-out="window.lucideIcon('trash-2', 12)"></t></button>
                  </div>
                  <div class="ls-vb-form-group" t-att-style="'grid-template-columns: repeat(' + ((grp.columns || []).length || 2) + ', 1fr); margin-bottom:0'">
                  <t t-foreach="grp.columns or []" t-as="col" t-key="col_index">
                    <div class="ls-vb-form-col">
                      <t t-foreach="col" t-as="fld" t-key="fld_index">
                        <div class="ls-vb-field-drop-zone"
                             t-on-dragover.prevent="(ev) => this.onDragOver(ev)"
                             t-on-dragleave="(ev) => this.onDragLeave(ev)"
                             t-on-drop="(ev) => this.onDropFormCol(ev, grp_index, col_index, fld_index)"></div>
                        <div class="ls-vb-form-field"
                             draggable="true"
                             t-on-dragstart="(ev) => this.onFormFieldDrag(ev, typeof fld === 'string' ? fld : fld.name, grp_index, col_index, fld_index)"
                             t-on-dragend="(ev) => this.onFormFieldDragEnd(ev)"
                             t-att-class="state.selectedField === (typeof fld === 'string' ? fld : fld.name) ? 'selected' : ''"
                             t-on-click.stop="() => this.selectField(typeof fld === 'string' ? fld : fld.name)">
                          <span class="ls-vb-form-field-label">
                            <t t-out="window.lucideIcon(this.fieldIcon(this.fieldType(typeof fld === 'string' ? fld : fld.name)), 12)"/>
                            <t t-esc="fieldLabel(typeof fld === 'string' ? fld : fld.name)"/>
                          </span>
                          <div class="ls-vb-form-field-value"
                               t-out="sampleValue(typeof fld === 'string' ? fld : fld.name, 1)"></div>
                        </div>
                      </t>
                      <div class="ls-vb-field-drop-tail"
                           t-on-dragover.prevent="(ev) => this.onDragOver(ev)"
                           t-on-dragleave="(ev) => this.onDragLeave(ev)"
                           t-on-drop="(ev) => this.onDropFormCol(ev, grp_index, col_index, null)">+ Drop field here</div>
                    </div>
                  </t>
                  </div>
                </div>
              </t>
              <div t-if="!state.arch.groups or state.arch.groups.length === 0" style="padding:40px 20px; text-align:center; color:#9ca3af; border:2px dashed #e5e7eb; border-radius:8px;">
                Drop a Group Layout Component here
              </div>
            </div>
            <t t-if="state.arch.tabs and state.arch.tabs.length">
              <div class="ls-vb-form-tabs">
                <div class="ls-vb-form-tab-bar">
                  <t t-foreach="state.arch.tabs" t-as="tab" t-key="tab_index">
                    <button class="ls-vb-form-tab-btn"
                            t-att-class="(state.formActiveTab === tab.name ? 'active ' : '') + (state.selectedTab === tab_index ? 'ls-vb-col-selected' : '')"
                            t-on-click.stop="() => this.selectTab(tab_index)"
                            t-esc="tab.label"></button>
                  </t>
                </div>
                <div class="ls-vb-form-tab-content ls-vb-drop-zone"
                     t-on-dragover.prevent="(ev) => this.onDragOver(ev)"
                     t-on-dragleave="(ev) => this.onDragLeave(ev)"
                     t-on-drop="(ev) => this.onDropFormTabLayout(ev)">
                  <t t-foreach="state.arch.tabs.filter(t => t.name === state.formActiveTab)" t-as="activeTab" t-key="activeTab.name">

                    <!-- Tab Type: one2many (inline tree preview) -->
                    <t t-if="activeTab.type === 'one2many'">
                      <div style="padding:12px">
                        <div style="font-size:12px; color:#6b7280; margin-bottom:8px; display:flex; align-items:center; gap:6px">
                          <t t-out="window.lucideIcon('git-branch', 14)"></t>
                          <span>One2Many: </span>
                          <strong t-esc="fieldLabel(activeTab.field) || '(select field)'"></strong>
                        </div>
                        <t t-if="activeTab.tree_fields and activeTab.tree_fields.length">
                          <table class="ls-vb-table" style="font-size:12px">
                            <thead><tr>
                              <t t-foreach="activeTab.tree_fields" t-as="tf" t-key="tf">
                                <th style="padding:4px 8px; font-size:11px">
                                  <t t-esc="tf"></t>
                                  <button class="ls-vb-btn-ghost" style="padding:0 2px; margin-left:4px; color:#ef4444; cursor:pointer; font-size:10px;"
                                          t-on-click.stop="() => this.removeTabTreeField(state.selectedTab, tf_index)">x</button>
                                </th>
                              </t>
                            </tr></thead>
                            <tbody>
                              <t t-foreach="[1,2,3]" t-as="r" t-key="r">
                                <tr>
                                  <t t-foreach="activeTab.tree_fields" t-as="tf2" t-key="tf2">
                                    <td style="padding:4px 8px; font-size:11px; color:#6b7280" t-esc="tf2"></td>
                                  </t>
                                </tr>
                              </t>
                            </tbody>
                          </table>
                        </t>
                        <div t-if="!activeTab.tree_fields or activeTab.tree_fields.length === 0"
                             style="padding:20px; text-align:center; color:#9ca3af; font-size:12px; border:1px dashed #d1d5db; border-radius:6px;">
                          Configure tree fields in the Tab Properties panel →
                        </div>
                      </div>
                    </t>

                    <!-- Tab Type: field (single field) -->
                    <t t-if="activeTab.type === 'field'">
                      <div style="padding:20px">
                        <div style="font-size:12px; color:#6b7280; margin-bottom:8px; display:flex; align-items:center; gap:6px">
                          <t t-out="window.lucideIcon('box', 14)"></t>
                          <span>Single Field: </span>
                          <strong t-esc="fieldLabel(activeTab.field) || '(select field)'"></strong>
                        </div>
                        <div t-if="activeTab.field" class="ls-vb-form-field" style="max-width:400px; cursor:default;">
                          <span class="ls-vb-form-field-label" t-esc="fieldLabel(activeTab.field)"></span>
                          <div class="ls-vb-form-field-value" t-out="sampleValue(activeTab.field, 1)"></div>
                        </div>
                        <div t-if="!activeTab.field"
                             style="padding:20px; text-align:center; color:#9ca3af; font-size:12px; border:1px dashed #d1d5db; border-radius:6px;">
                          Select a field in the Tab Properties panel →
                        </div>
                      </div>
                    </t>

                    <!-- Tab Type: layout (default - groups with fields) -->
                    <t t-if="!activeTab.type or activeTab.type === 'layout'">
                    <t t-foreach="activeTab.groups or []" t-as="grp" t-key="grp_index">
                      <div class="ls-vb-form-group-wrapper" style="position:relative; margin-bottom:16px;">
                        <div class="ls-vb-form-group-toolbar" style="position:absolute; top:-10px; right:10px; background:#fff; border:1px solid #d1d5db; border-radius:4px; padding:2px; display:flex; gap:4px; z-index:10; box-shadow:0 1px 2px rgba(0,0,0,0.05)">
                           <button class="ls-vb-btn-ghost" style="padding:2px; cursor:pointer;" title="Move Up" t-on-click.stop="() => this.moveTabGroup(activeTab.name, grp_index, -1)"><t t-out="window.lucideIcon('arrow-up', 12)"></t></button>
                           <button class="ls-vb-btn-ghost" style="padding:2px; cursor:pointer;" title="Move Down" t-on-click.stop="() => this.moveTabGroup(activeTab.name, grp_index, 1)"><t t-out="window.lucideIcon('arrow-down', 12)"></t></button>
                           <button class="ls-vb-btn-ghost" style="padding:2px; cursor:pointer; color:#ef4444" title="Remove Group" t-on-click.stop="() => this.removeTabGroup(activeTab.name, grp_index)"><t t-out="window.lucideIcon('trash-2', 12)"></t></button>
                        </div>
                        <div class="ls-vb-form-group" style="margin-bottom:0">
                          <t t-foreach="grp.columns or []" t-as="col" t-key="col_index">
                            <div class="ls-vb-form-col" style="position:relative; min-height:40px;">
                              <t t-foreach="col" t-as="fld" t-key="fld_index">
                                <div class="ls-vb-field-drop-zone ls-vb-drop-zone" style="height:6px; margin:-3px 0; z-index:5; position:relative; opacity:0; transition:opacity 0.2s; background:#6366f1; border-radius:2px;"
                                     t-on-dragover.prevent="(ev) => this.onDragOver(ev)"
                                     t-on-dragleave="(ev) => this.onDragLeave(ev)"
                                     t-on-drop="(ev) => this.onDropFormTabCol(ev, activeTab.name, grp_index, col_index, fld_index)"></div>
                                <div class="ls-vb-form-field"
                                     draggable="true"
                                     t-on-dragstart="(ev) => this.onFormFieldDragTab(ev, activeTab.name, typeof fld === 'string' ? fld : fld.name, grp_index, col_index, fld_index)"
                                     t-att-class="state.selectedField === (typeof fld === 'string' ? fld : fld.name) ? 'selected' : ''"
                                     t-on-click.stop="() => this.selectField(typeof fld === 'string' ? fld : fld.name)">
                                  <span class="ls-vb-form-field-label"
                                        t-esc="fieldLabel(typeof fld === 'string' ? fld : fld.name)"></span>
                                  <div class="ls-vb-form-field-value"
                                       t-out="sampleValue(typeof fld === 'string' ? fld : fld.name, 1)"></div>
                                </div>
                              </t>
                              <div class="ls-vb-field-drop-zone ls-vb-drop-zone" style="height:20px; margin-top:4px; border:2px dashed transparent; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#9ca3af; font-size:11px;"
                                   t-on-dragover.prevent="(ev) => this.onDragOver(ev)"
                                   t-on-dragleave="(ev) => this.onDragLeave(ev)"
                                   t-on-drop="(ev) => this.onDropFormTabCol(ev, activeTab.name, grp_index, col_index, null)">Drop fields here</div>
                            </div>
                          </t>
                        </div>
                      </div>
                    </t>
                    <div t-if="!activeTab.groups or activeTab.groups.length === 0" style="padding:40px 20px; text-align:center; color:#9ca3af; border:2px dashed #e5e7eb; border-radius:8px;">
                      Drop a Group or Fields here
                    </div>
                    </t>

                  </t>
                </div>
              </div>
            </t>
            <t t-if="state.arch.chatter">
              <div style="margin-top:20px; padding:16px; border-top:1px solid #e5e7eb; background:#f9fafb; position:relative;">
                <h4 style="margin:0 0 10px 0; font-size:14px; color:#374151;">Chatter</h4>
                <div style="font-size:12px; color:#6b7280;">Send messages, log notes, and schedule activities</div>
                <button class="ls-vb-btn-ghost" title="Remove Chatter" style="position:absolute; top:16px; right:16px; padding:2px; cursor:pointer; color:#ef4444" t-on-click.stop="() => this.state.arch.chatter = false">
                   <t t-out="window.lucideIcon('trash-2', 12)"></t>
                </button>
              </div>
            </t>
          </div>
        </div>
      </t>

      <!-- KANBAN BUILDER -->
      <t t-if="state.activeTab === 'kanban'">
        <div class="ls-vb-preview">
          <div class="ls-vb-preview-header">
            <t t-out="window.lucideIcon('columns', 14)"/>
            Kanban Preview — <t t-esc="state.selectedModel"/>
          </div>
          <div class="ls-vb-kanban-preview">
            <t t-foreach="['New','In Progress','Done']" t-as="stage" t-key="stage">
              <div class="ls-vb-kanban-col">
                <div class="ls-vb-kanban-col-header">
                  <t t-esc="stage"/>
                  <span class="ls-vb-kanban-col-count">2</span>
                </div>
                <div class="ls-vb-kanban-cards">
                  <t t-foreach="[1,2]" t-as="c" t-key="c">
                    <div class="ls-vb-kanban-card">
                      <div class="ls-vb-kanban-card-title" t-esc="'Record ' + (stage_index * 2 + c)"/>
                      <t t-foreach="state.arch.card_fields or []" t-as="cf" t-key="cf">
                        <div class="ls-vb-kanban-card-field">
                          <span style="color:#9ca3af" t-esc="fieldLabel(cf) + ': '"/>
                          <t t-out="sampleValue(cf, c)"/>
                        </div>
                      </t>
                    </div>
                  </t>
                </div>
              </div>
            </t>
          </div>
        </div>
      </t>

      <!-- CALENDAR BUILDER -->
      <t t-if="state.activeTab === 'calendar'">
        <div class="ls-vb-preview">
          <div class="ls-vb-preview-header">
            <t t-out="window.lucideIcon('calendar', 14)"/>
            Calendar Preview — <t t-esc="state.selectedModel"/>
          </div>
          <div class="ls-vb-calendar-preview">
            <div class="ls-vb-mini-cal">
              <t t-foreach="['Mon','Tue','Wed','Thu','Fri','Sat','Sun']" t-as="d" t-key="d">
                <div class="ls-vb-mini-cal-head" t-esc="d"/>
              </t>
              <t t-foreach="calendarDays" t-as="day" t-key="day.num + '_' + day.month">
                <div t-att-class="'ls-vb-mini-cal-day' + (day.today ? ' today' : '') + (day.event ? ' has-event' : '') + (day.otherMonth ? ' other-month' : '')">
                  <t t-esc="day.num"/>
                </div>
              </t>
            </div>
          </div>
        </div>
      </t>

      <!-- PIVOT BUILDER -->
      <t t-if="state.activeTab === 'pivot'">
        <div class="ls-vb-preview">
          <div class="ls-vb-preview-header">
            <t t-out="window.lucideIcon('grid-3x3', 14)"/>
            Pivot Preview — <t t-esc="state.selectedModel"/>
          </div>
          <div class="ls-vb-pivot-preview">
            <table class="ls-vb-pivot-table">
              <thead><tr>
                <th></th>
                <t t-foreach="state.arch.col_groupby or ['Total']" t-as="cg" t-key="cg">
                  <th t-esc="fieldLabel(cg) || cg"/>
                </t>
                <th>Total</th>
              </tr></thead>
              <tbody>
                <t t-foreach="state.arch.row_groupby or ['Total']" t-as="rg" t-key="rg">
                  <tr>
                    <td class="label" t-esc="fieldLabel(rg) || rg"/>
                    <t t-foreach="state.arch.col_groupby or ['Total']" t-as="cg2" t-key="cg2">
                      <td t-esc="Math.floor(Math.random()*1000)"/>
                    </t>
                    <td style="font-weight:600" t-esc="Math.floor(Math.random()*5000)"/>
                  </tr>
                </t>
                <tr class="total">
                  <td class="label">Total</td>
                  <t t-foreach="state.arch.col_groupby or ['Total']" t-as="cg3" t-key="cg3">
                    <td t-esc="Math.floor(Math.random()*3000)"/>
                  </t>
                  <td t-esc="Math.floor(Math.random()*10000)"/>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </t>

      <t t-if="state.activeTab === 'spreadsheet'">
        <div class="ls-vb-preview">
          <div class="ls-vb-preview-header">
            <t t-out="window.lucideIcon('file-spreadsheet', 14)"/>
            Spreadsheet Preview — <t t-esc="state.selectedModel"/>
          </div>
          <div class="ls-vb-spreadsheet-preview">
            <table class="ls-vb-spreadsheet-table">
              <thead><tr>
                <th class="ls-vb-sp-rownum">#</th>
                <t t-foreach="state.arch.fields or []" t-as="f" t-key="f">
                  <th t-esc="getFieldLabel(f) || f"/>
                </t>
              </tr></thead>
              <tbody>
                <t t-foreach="[1,2,3,4,5]" t-as="row" t-key="row">
                  <tr>
                    <td class="ls-vb-sp-rownum" t-esc="row"/>
                    <t t-foreach="state.arch.fields or []" t-as="f2" t-key="f2 + row">
                      <td class="ls-vb-sp-cell">—</td>
                    </t>
                  </tr>
                </t>
                <tr class="ls-vb-sp-total">
                  <td class="ls-vb-sp-rownum" style="font-weight:600">Σ</td>
                  <t t-foreach="state.arch.fields or []" t-as="f3" t-key="'tot_' + f3">
                    <td class="ls-vb-sp-cell" t-esc="state.arch.aggregation || 'sum'"/>
                  </t>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </t>

      <!-- XML Code Block -->
      <div class="ls-vb-xml" t-if="state.showXml">
        <div class="ls-vb-xml-header">
          <span>XML Architecture</span>
          <button class="ls-vb-btn-ghost" style="color:#a5b4fc" t-on-click="copyXml">
            <t t-out="window.lucideIcon('copy', 12)"/> Copy
          </button>
        </div>
        <pre t-esc="state.xmlPreview"/>
      </div>

      <!-- Attribute Reference Cards -->
      <div class="ls-vb-attr-cards" t-if="state.activeTab === 'list'">
        <t t-foreach="listAttrCards" t-as="card" t-key="card.name">
          <div class="ls-vb-attr-card">
            <h5 t-esc="card.name"/>
            <span class="ls-vb-attr-type" t-esc="card.type"/>
            <p t-esc="card.desc"/>
          </div>
        </t>
      </div>
    </div>

    <!-- Right: Properties Panel -->
    <div class="ls-vb-props" t-if="state.selectedField or state.selectedTab != null">
      <div class="ls-vb-props-section" t-if="state.selectedField">
        <div class="ls-vb-props-title">Field Properties</div>
        <div class="ls-vb-prop">
          <label>Field Name</label>
          <input type="text" t-att-value="state.selectedField" readonly="true"></input>
        </div>
        <div class="ls-vb-prop">
          <label>Label</label>
          <input type="text" t-att-value="fieldLabel(state.selectedField)" readonly="true"></input>
        </div>
        <div class="ls-vb-prop">
          <label>Type</label>
          <input type="text" t-att-value="fieldType(state.selectedField)" readonly="true"></input>
        </div>
      </div>

      <div class="ls-vb-props-section" t-if="state.activeTab === 'form' and state.selectedField">
        <div class="ls-vb-props-title">Form Field Config</div>
        <div class="ls-vb-prop">
          <label>Widget</label>
          <select t-on-change="(ev) => this.setFormFieldConfig(state.selectedField, 'widget', ev.target.value)">
            <t t-foreach="widgetOptions" t-as="wo" t-key="wo[0]">
              <option t-att-value="wo[0]" t-att-selected="getFormFieldConfig(state.selectedField, 'widget') === wo[0]" t-esc="wo[1]"></option>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Placeholder</label>
          <input type="text" t-att-value="getFormFieldConfig(state.selectedField, 'placeholder')" placeholder="e.g. Enter value..."
                 t-on-change="(ev) => this.setFormFieldConfig(state.selectedField, 'placeholder', ev.target.value)"></input>
        </div>
        <div class="ls-vb-prop-row">
          <label>Required</label>
          <label class="ls-vb-toggle">
            <input type="checkbox" t-att-checked="getFormFieldConfig(state.selectedField, 'required')"
                   t-on-change="(ev) => this.setFormFieldConfig(state.selectedField, 'required', ev.target.checked)"></input>
            <span class="ls-vb-toggle-slider"></span>
          </label>
        </div>
        <div class="ls-vb-prop-row">
          <label>Readonly</label>
          <label class="ls-vb-toggle">
            <input type="checkbox" t-att-checked="getFormFieldConfig(state.selectedField, 'readonly')"
                   t-on-change="(ev) => this.setFormFieldConfig(state.selectedField, 'readonly', ev.target.checked)"></input>
            <span class="ls-vb-toggle-slider"></span>
          </label>
        </div>
        <div class="ls-vb-prop-row">
          <label>Invisible</label>
          <label class="ls-vb-toggle">
            <input type="checkbox" t-att-checked="getFormFieldConfig(state.selectedField, 'invisible')"
                   t-on-change="(ev) => this.setFormFieldConfig(state.selectedField, 'invisible', ev.target.checked)"></input>
            <span class="ls-vb-toggle-slider"></span>
          </label>
        </div>
        <div class="ls-vb-prop-row">
          <label>No Label</label>
          <label class="ls-vb-toggle">
            <input type="checkbox" t-att-checked="getFormFieldConfig(state.selectedField, 'nolabel')"
                   t-on-change="(ev) => this.setFormFieldConfig(state.selectedField, 'nolabel', ev.target.checked)"></input>
            <span class="ls-vb-toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="ls-vb-props-section" t-if="state.activeTab === 'list' and state.selectedField">
        <div class="ls-vb-props-title">Column Config</div>
        <div class="ls-vb-prop">
          <label>Widget Override</label>
          <select t-on-change="(ev) => this.setColumnConfig(state.selectedField, 'widget', ev.target.value)">
            <option value="">default</option>
            <option value="badge">badge</option>
            <option value="float_time">float_time</option>
            <option value="progressbar">progressbar</option>
            <option value="remaining_days">remaining_days</option>
            <option value="monetary">monetary</option>
            <option value="many2one_avatar">many2one_avatar</option>
            <option value="priority">priority</option>
            <option value="handle">handle</option>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Optional</label>
          <select t-on-change="(ev) => this.setColumnConfig(state.selectedField, 'optional', ev.target.value)">
            <option value="">none</option>
            <option value="show">show</option>
            <option value="hide">hide</option>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Aggregation</label>
          <select t-on-change="(ev) => this.setColumnConfig(state.selectedField, '_agg', ev.target.value)">
            <option value="">none</option>
            <option value="sum">sum</option>
            <option value="avg">avg</option>
            <option value="max">max</option>
            <option value="min">min</option>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Width</label>
          <input type="text" placeholder="e.g. 120px"
                 t-on-change="(ev) => this.setColumnConfig(state.selectedField, 'width', ev.target.value)"></input>
        </div>
      </div>

      <div class="ls-vb-props-section" t-if="state.selectedTab != null and state.arch.tabs and state.arch.tabs[state.selectedTab]">
        <div class="ls-vb-props-title">Tab Properties</div>
        <div class="ls-vb-prop">
           <label>Label</label>
           <input type="text" t-model="state.arch.tabs[state.selectedTab].label"></input>
        </div>
        <div class="ls-vb-prop">
           <label>Name</label>
           <input type="text" t-model="state.arch.tabs[state.selectedTab].name" disabled="1"></input>
        </div>
        <div class="ls-vb-prop">
           <label>Tab Type</label>
           <select t-on-change="(ev) => this.setTabType(state.selectedTab, ev.target.value)">
             <option value="layout" t-att-selected="!state.arch.tabs[state.selectedTab].type or state.arch.tabs[state.selectedTab].type === 'layout'">Layout (Groups)</option>
             <option value="one2many" t-att-selected="state.arch.tabs[state.selectedTab].type === 'one2many'">One2Many Field</option>
             <option value="field" t-att-selected="state.arch.tabs[state.selectedTab].type === 'field'">Single Field</option>
           </select>
        </div>

        <!-- One2Many config -->
        <t t-if="state.arch.tabs[state.selectedTab].type === 'one2many'">
          <div class="ls-vb-prop">
            <label>One2Many Field</label>
            <select t-on-change="(ev) => this.setTabField(state.selectedTab, ev.target.value)">
              <option value="">— Select —</option>
              <t t-foreach="o2mFields" t-as="of" t-key="of.name">
                <option t-att-value="of.name" t-att-selected="state.arch.tabs[state.selectedTab].field === of.name" t-esc="of.string + ' (' + of.name + ')'"></option>
              </t>
            </select>
          </div>
          <div class="ls-vb-prop">
            <label>Editable</label>
            <select t-model="state.arch.tabs[state.selectedTab].editable">
              <option value="bottom">bottom</option>
              <option value="top">top</option>
            </select>
          </div>
          <div class="ls-vb-prop">
            <label>Tree Columns</label>
            <div style="margin-top:4px">
              <t t-foreach="state.arch.tabs[state.selectedTab].tree_fields or []" t-as="tf" t-key="tf">
                <div style="display:flex; align-items:center; gap:4px; padding:2px 0;">
                  <span style="flex:1; font-size:11px; padding:2px 6px; background:#f3f4f6; border-radius:3px;" t-esc="tf"></span>
                  <button class="ls-vb-btn-ghost" style="padding:2px; color:#ef4444; cursor:pointer;" t-on-click.stop="() => this.removeTabTreeField(state.selectedTab, tf_index)">
                    <t t-out="window.lucideIcon('x', 10)"></t>
                  </button>
                </div>
              </t>
            </div>
            <select style="margin-top:6px; font-size:11px;" t-on-change="(ev) => { this.addTabTreeField(state.selectedTab, ev.target.value); ev.target.value = ''; }">
              <option value="">+ Add column...</option>
              <t t-foreach="getTabChildFields(state.selectedTab)" t-as="cf" t-key="cf.name">
                <option t-att-value="cf.name" t-esc="cf.string + ' (' + cf.type + ')'"></option>
              </t>
              <t t-if="getTabChildFields(state.selectedTab).length === 0">
                <t t-foreach="availableFields" t-as="af" t-key="af.name">
                  <option t-att-value="af.name" t-esc="af.string + ' (' + af.type + ')'"></option>
                </t>
              </t>
            </select>
          </div>
        </t>

        <!-- Single field config -->
        <t t-if="state.arch.tabs[state.selectedTab].type === 'field'">
          <div class="ls-vb-prop">
            <label>Field</label>
            <select t-on-change="(ev) => this.setTabField(state.selectedTab, ev.target.value)">
              <option value="">— Select —</option>
              <t t-foreach="availableFields" t-as="af2" t-key="af2.name">
                <option t-att-value="af2.name" t-att-selected="state.arch.tabs[state.selectedTab].field === af2.name" t-esc="af2.string + ' (' + af2.type + ')'"></option>
              </t>
            </select>
          </div>
        </t>

        <div style="display:flex; gap:8px; margin-top:12px">
          <button class="ls-vb-btn ls-vb-btn-sm" style="flex:1" t-on-click="() => this.moveTab(state.selectedTab, -1)"><t t-out="window.lucideIcon('arrow-left', 12)"></t> Left</button>
          <button class="ls-vb-btn ls-vb-btn-sm" style="flex:1" t-on-click="() => this.moveTab(state.selectedTab, 1)">Right <t t-out="window.lucideIcon('arrow-right', 12)"></t></button>
        </div>
        <div style="margin-top:12px">
          <button class="ls-vb-btn ls-vb-btn-danger ls-vb-btn-sm" style="width: 100%" t-on-click="() => this.removeTab(state.selectedTab)">
            <t t-out="window.lucideIcon('trash-2', 12)"></t> Remove Tab
          </button>
        </div>
      </div>

      <div style="margin-top:16px; border-top: 1px solid #e5e7eb; padding-top: 16px;" t-if="(state.activeTab === 'list' or state.activeTab === 'form') and state.selectedField">
        <button class="ls-vb-btn ls-vb-btn-danger ls-vb-btn-sm" style="width: 100%" t-on-click="removeSelectedField">
          <t t-out="window.lucideIcon('trash-2', 12)"></t> Remove <t t-esc="state.activeTab === 'list' ? 'Column' : 'Field'"></t>
        </button>
      </div>

      <!-- Kanban/Calendar/Pivot field config -->
      <div class="ls-vb-props-section" t-if="state.activeTab === 'kanban'">
        <div class="ls-vb-props-title">Kanban Config</div>
        <div class="ls-vb-prop">
          <label>Group By</label>
          <select t-model="state.arch.default_group_by">
            <option value="">none</option>
            <t t-foreach="groupableFields" t-as="gf" t-key="gf.name">
              <option t-att-value="gf.name" t-esc="gf.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Card Title</label>
          <select t-model="state.arch.card_title">
            <t t-foreach="stringFields" t-as="sf" t-key="sf.name">
              <option t-att-value="sf.name" t-esc="sf.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Card Image</label>
          <select t-model="state.arch.card_image">
            <option value="">none</option>
            <t t-foreach="binaryFields" t-as="bf" t-key="bf.name">
              <option t-att-value="bf.name" t-esc="bf.string"/>
            </t>
            <t t-foreach="stringFields" t-as="sf2" t-key="'img_'+sf2.name">
              <option t-att-value="sf2.name" t-esc="sf2.string + ' (URL)'"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Card Tags</label>
          <select t-model="state.arch.card_tags">
            <option value="">none</option>
            <t t-foreach="m2mFields" t-as="mf" t-key="mf.name">
              <option t-att-value="mf.name" t-esc="mf.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Color Field</label>
          <select t-model="state.arch.color_field">
            <option value="">none</option>
            <t t-foreach="colorFields" t-as="cf" t-key="cf.name">
              <option t-att-value="cf.name" t-esc="cf.string"/>
            </t>
            <t t-foreach="selectionFields" t-as="selF" t-key="'sel_'+selF.name">
              <option t-att-value="selF.name" t-esc="selF.string + ' (selection)'"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Card Footer</label>
          <div class="ls-vb-field-list">
            <t t-foreach="state.arch.card_footer || []" t-as="cf2" t-key="'cf_'+cf2">
              <div class="ls-vb-field-chip">
                <span t-esc="getFieldLabel(cf2)"/>
                <button class="ls-vb-chip-x" t-on-click="() => this.removeFromArchArray('card_footer', cf2)">&#215;</button>
              </div>
            </t>
          </div>
          <select t-on-change="(ev) => { this.addToArchArray('card_footer', ev.target.value); ev.target.value = ''; }">
            <option value="">+ Add footer field</option>
            <t t-foreach="allFields" t-as="aff" t-key="'cff_'+aff.name">
              <option t-att-value="aff.name" t-esc="aff.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop-row">
          <label>Quick Create</label>
          <label class="ls-vb-toggle">
            <input type="checkbox" t-model="state.arch.quick_create"/>
            <span class="ls-vb-toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="ls-vb-props-section" t-if="state.activeTab === 'calendar'">
        <div class="ls-vb-props-title">Calendar Config</div>
        <div class="ls-vb-prop">
          <label>Date Start</label>
          <select t-model="state.arch.date_start">
            <t t-foreach="dateFields" t-as="df" t-key="df.name">
              <option t-att-value="df.name" t-esc="df.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Date Stop</label>
          <select t-model="state.arch.date_stop">
            <option value="">none</option>
            <t t-foreach="dateFields" t-as="df2" t-key="df2.name">
              <option t-att-value="df2.name" t-esc="df2.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Duration Field</label>
          <select t-model="state.arch.date_delay">
            <option value="">none</option>
            <t t-foreach="numericFields" t-as="nf" t-key="'delay_'+nf.name">
              <option t-att-value="nf.name" t-esc="nf.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Color Field</label>
          <select t-model="state.arch.color">
            <option value="">none</option>
            <t t-foreach="groupableFields" t-as="cf" t-key="cf.name">
              <option t-att-value="cf.name" t-esc="cf.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Default Mode</label>
          <select t-model="state.arch.mode">
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="day">Day</option>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Event Display Fields</label>
          <div class="ls-vb-field-list">
            <t t-foreach="state.arch.event_display_fields || []" t-as="ef" t-key="'ef_'+ef">
              <div class="ls-vb-field-chip">
                <span t-esc="getFieldLabel(ef)"/>
                <button class="ls-vb-chip-x" t-on-click="() => this.removeFromArchArray('event_display_fields', ef)">&#215;</button>
              </div>
            </t>
          </div>
          <select t-on-change="(ev) => { this.addToArchArray('event_display_fields', ev.target.value); ev.target.value = ''; }">
            <option value="">+ Add display field</option>
            <t t-foreach="allFields" t-as="aff" t-key="'ef_'+aff.name">
              <option t-att-value="aff.name" t-esc="aff.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Quick Create Name Field</label>
          <select t-model="state.arch.create_name_field">
            <option value="">default (name)</option>
            <t t-foreach="stringFields" t-as="sf" t-key="'cn_'+sf.name">
              <option t-att-value="sf.name" t-esc="sf.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop-row">
          <label>Quick Create</label>
          <label class="ls-vb-toggle">
            <input type="checkbox" t-model="state.arch.quick_create"/>
            <span class="ls-vb-toggle-slider"></span>
          </label>
        </div>
        <div class="ls-vb-prop-row">
          <label>Show Legend</label>
          <label class="ls-vb-toggle">
            <input type="checkbox" t-model="state.arch.color_legend"/>
            <span class="ls-vb-toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="ls-vb-props-section" t-if="state.activeTab === 'pivot'">
        <div class="ls-vb-props-title">Pivot Config</div>
        <div class="ls-vb-prop">
          <label>Row Group By</label>
          <select t-on-change="(ev) => this.addToArchArray('row_groupby', ev.target.value)">
            <option value="">+ Add row dimension</option>
            <t t-foreach="groupableFields" t-as="rf" t-key="rf.name">
              <option t-att-value="rf.name" t-esc="rf.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Col Group By</label>
          <select t-on-change="(ev) => this.addToArchArray('col_groupby', ev.target.value)">
            <option value="">+ Add col dimension</option>
            <t t-foreach="groupableFields" t-as="cf2" t-key="cf2.name">
              <option t-att-value="cf2.name" t-esc="cf2.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label>Measures</label>
          <select t-on-change="(ev) => this.addToArchArray('measures', ev.target.value)">
            <option value="">+ Add measure</option>
            <t t-foreach="numericFields" t-as="nf" t-key="nf.name">
              <option t-att-value="nf.name" t-esc="nf.string"/>
            </t>
          </select>
        </div>
      </div>

      <div class="ls-vb-props-section" t-if="state.activeTab === 'spreadsheet'">
        <div class="ls-vb-props-title">Spreadsheet Config</div>
        <div class="ls-vb-prop">
          <label>Fields</label>
          <select t-on-change="(ev) => this.addToArchArray('fields', ev.target.value)">
            <option value="">+ Add field</option>
            <t t-foreach="allFields" t-as="sf" t-key="sf.name">
              <option t-att-value="sf.name" t-esc="sf.string"/>
            </t>
          </select>
        </div>
        <div class="ls-vb-arch-array" t-if="state.arch.fields and state.arch.fields.length">
          <t t-foreach="state.arch.fields" t-as="sf2" t-key="'sp_' + sf2 + '_' + sf2_index">
            <span class="ls-vb-arch-tag">
              <t t-esc="fieldLabel(sf2) || sf2"/>
              <button class="ls-vb-tag-remove" t-on-click="() => this.removeFromArchArray('fields', sf2_index)">×</button>
            </span>
          </t>
        </div>
        <div class="ls-vb-prop">
          <label>Column Width (px)</label>
          <input type="number" class="ls-vb-input" t-att-value="state.arch.column_width || 120"
                 t-on-change="(ev) => this.state.arch.column_width = parseInt(ev.target.value) || 120"/>
        </div>
        <div class="ls-vb-prop">
          <label>Row Height (px)</label>
          <input type="number" class="ls-vb-input" t-att-value="state.arch.row_height || 28"
                 t-on-change="(ev) => this.state.arch.row_height = parseInt(ev.target.value) || 28"/>
        </div>
        <div class="ls-vb-prop">
          <label>Row Limit</label>
          <input type="number" class="ls-vb-input" t-att-value="state.arch.limit || 1000"
                 t-on-change="(ev) => this.state.arch.limit = parseInt(ev.target.value) || 1000"/>
        </div>
        <div class="ls-vb-prop">
          <label>Aggregation</label>
          <select t-model="state.arch.aggregation">
            <option value="sum">Sum</option>
            <option value="avg">Average</option>
            <option value="count">Count</option>
            <option value="min">Min</option>
            <option value="max">Max</option>
            <option value="none">None</option>
          </select>
        </div>
        <div class="ls-vb-prop">
          <label class="ls-vb-toggle">
            <input type="checkbox" t-att-checked="state.arch.readonly"
                   t-on-change="(ev) => this.state.arch.readonly = ev.target.checked"/>
            <span>Read-only</span>
          </label>
        </div>
      </div>
    </div>
  </div>

  <!-- Export Code Modal -->
  <div class="ls-vb-modal-overlay" t-if="state.showCode" t-on-click.self="() => this.state.showCode = false">
    <div class="ls-vb-modal">
      <div class="ls-vb-modal-header">
        <span>Export PHP Code — <t t-esc="state.activeTab"/> view</span>
        <button class="ls-vb-btn-ghost" t-on-click="() => this.state.showCode = false">✕</button>
      </div>
      <div class="ls-vb-modal-body">
        <pre class="ls-vb-code-block"><code t-esc="state.codePreview"/></pre>
      </div>
      <div class="ls-vb-modal-footer">
        <button class="ls-vb-btn" t-on-click="copyCode">
          <t t-out="window.lucideIcon('clipboard-copy', 14)"/> Copy to Clipboard
        </button>
        <button class="ls-vb-btn" t-on-click="() => this.state.showCode = false">Close</button>
      </div>
    </div>
  </div>

  <!-- Toast -->
  <div class="ls-vb-toast" t-if="state.toast" t-att-class="'ls-vb-toast ' + (state.toastType || '')">
    <t t-out="window.lucideIcon(state.toastType === 'error' ? 'alert-circle' : 'check-circle', 14)"/>
    <t t-esc="state.toast"/>
  </div>
</div>
`;
})();
