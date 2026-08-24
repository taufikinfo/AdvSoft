// ══════════════════════════════════════════════════════════════════
//  Security Management Templates
//  4 OWL templates: AccessRights (matrix), RecordRules, GroupsView, UsersView
// ══════════════════════════════════════════════════════════════════
(function () {
const { xml } = owl;
const PERM_COLS = [
    { key: 'r', label: 'Read',   short: 'R' },
    { key: 'w', label: 'Write',  short: 'W' },
    { key: 'c', label: 'Create', short: 'C' },
    { key: 'u', label: 'Delete', short: 'D' },
];

// ── 0. SECURITY OVERVIEW ──────────────────────────────
window.TEMPLATES.securityOverview = xml`
<div class="ls-sec-page">
    <div class="ls-sec-header">
        <h1>Security Overview</h1>
        <p class="ls-sec-subtitle">Dashboard and diagnostics for the AdvSoft security engine.</p>
    </div>

    <div t-if="state.loading" class="ls-sec-loading">
        <t t-out="window.lucideIcon('loader', 24)"/> Loading overview...
    </div>

    <div t-else="" style="padding: 1rem;">
        <div class="ls-dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div class="ls-stat-card" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; text-align: center;">
                <div style="font-size: 2rem; font-weight: bold; color: #2563eb;" t-esc="state.data.counts.users"/>
                <div style="color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.5rem;">Users</div>
            </div>
            <div class="ls-stat-card" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; text-align: center;">
                <div style="font-size: 2rem; font-weight: bold; color: #059669;" t-esc="state.data.counts.groups"/>
                <div style="color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.5rem;">Groups</div>
            </div>
            <div class="ls-stat-card" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; text-align: center;">
                <div style="font-size: 2rem; font-weight: bold; color: #7c3aed;" t-esc="state.data.counts.models"/>
                <div style="color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.5rem;">Models</div>
            </div>
            <div class="ls-stat-card" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; text-align: center;">
                <div style="font-size: 2rem; font-weight: bold; color: #dc2626;" t-esc="state.data.counts.acl_rules"/>
                <div style="color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.5rem;">ACL Rules</div>
            </div>
            <div class="ls-stat-card" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; text-align: center;">
                <div style="font-size: 2rem; font-weight: bold; color: #d97706;" t-esc="state.data.counts.record_rules"/>
                <div style="color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.5rem;">Record Rules</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr; gap: 2rem;">
            <div class="ls-panel" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px;">
                <div style="padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Top Permissioned Users</div>
                <table class="ls-sec-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Groups</th>
                            <th>Admin</th>
                        </tr>
                    </thead>
                    <tbody>
                        <t t-foreach="state.data.top_users" t-as="u" t-key="u.id">
                            <tr>
                                <td><strong t-esc="u.name || u.login"/></td>
                                <td t-esc="u.email || ''"/>
                                <td><span class="ls-badge" t-esc="u.group_count + ' groups'"/></td>
                                <td><span t-if="u.is_admin" class="ls-badge ls-badge-w">Admin</span></td>
                            </tr>
                        </t>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
`;

// ── 1. ACCESS RIGHTS MATRIX ──────────────────────────
window.TEMPLATES.accessRights = xml`
<div class="ls-sec-page">
    <div class="ls-sec-header">
        <h1>Access Rights</h1>
        <p class="ls-sec-subtitle">Configure per-model CRUD permissions for each group. Click a cell to toggle.</p>
        <div class="ls-sec-toolbar">
            <input type="text" class="ls-input" placeholder="Search model or group..." t-model="state.filter"/>
            <select class="ls-input" t-model="state.selectedModule">
                <option value="all">All modules</option>
                <t t-foreach="modules" t-as="m" t-key="m">
                    <option t-att-value="m" t-esc="m"/>
                </t>
            </select>
            <button class="ls-btn ls-btn-secondary" t-on-click="syncModels">
                <t t-out="window.lucideIcon('refresh-cw', 14)"/>
                Sync Models
            </button>
        </div>
    </div>

    <div t-if="state.loading" class="ls-sec-loading">
        <t t-out="window.lucideIcon('loader', 24)"/>
        Loading access matrix...
    </div>

    <div t-else="" class="ls-matrix-wrapper">
        <table class="ls-matrix">
            <thead>
                <tr>
                    <th class="ls-matrix-corner">Model \\ Group</th>
                    <t t-foreach="filteredGroups" t-as="g" t-key="g.id">
                        <th class="ls-matrix-colhead" t-att-title="g.category_name || ''">
                            <div class="ls-matrix-colhead-name" t-esc="g.name"/>
                            <div t-if="g.category_name" class="ls-matrix-colhead-cat" t-esc="g.category_name"/>
                            <div t-if="g.share" class="ls-matrix-colhead-tag">portal</div>
                        </th>
                    </t>
                </tr>
            </thead>
            <tbody>
                <t t-foreach="filteredModels" t-as="m" t-key="m.id">
                    <tr class="ls-matrix-row">
                        <td class="ls-matrix-rowhead">
                            <div class="ls-matrix-rowhead-name" t-esc="m.model"/>
                            <div class="ls-matrix-rowhead-meta">
                                <span t-esc="m.module || 'AdvSoft'"/>
                                <span> · </span>
                                <span t-esc="m.group_count"/> rules
                            </div>
                        </td>
                        <t t-foreach="filteredGroups" t-as="g" t-key="g.id">
                            <td class="ls-matrix-cell">
                                <t t-set="cell" t-value="getCell(m.id, g.id)"/>
                                <div class="ls-matrix-cell-row">
                                    <t t-foreach="['r','w','c','u']" t-as="perm" t-key="perm">
                                        <button t-att-class="'ls-perm-btn' + (cell &amp;&amp; cell[perm] ? ' ls-perm-on' : '') + (isSaving(m.id, g.id, perm) ? ' ls-perm-saving' : '')"
                                                t-att-title="({'r':'Read','w':'Write','c':'Create','u':'Delete'})[perm]"
                                                t-att-disabled="isSaving(m.id, g.id, perm)"
                                                t-on-click="() => this.toggleCell(m.id, g.id, perm, cell ? cell[perm] : false)">
                                            <t t-esc="({'r':'R','w':'W','c':'C','u':'D'})[perm]"/>
                                        </button>
                                    </t>
                                </div>
                            </td>
                        </t>
                    </tr>
                </t>
            </tbody>
        </table>
        <div t-if="filteredModels.length === 0" class="ls-sec-empty">No models match your filter.</div>
    </div>

    <div class="ls-legend">
        <span class="ls-legend-label">Permissions:</span>
        <span><b>R</b> Read</span>
        <span><b>W</b> Write (includes Read)</span>
        <span><b>C</b> Create</span>
        <span><b>D</b> Delete (unlink)</span>
    </div>
</div>
`;

// ── 2. RECORD RULES ─────────────────────────────────
window.TEMPLATES.recordRules = xml`
<div class="ls-sec-page">
    <div class="ls-sec-header">
        <h1>Record Rules</h1>
        <p class="ls-sec-subtitle">Row-level access (record filtering). Each rule restricts which records a user can see or modify.</p>
    </div>

    <!-- LIST MODE -->
    <div t-if="state.mode === 'list'">
        <div class="ls-sec-toolbar">
            <input type="text" class="ls-input" placeholder="Search rules..." t-model="state.search"/>
            <button class="ls-btn ls-btn-primary" t-on-click="newRecord">
                <t t-out="window.lucideIcon('plus', 14)"/>
                New Rule
            </button>
        </div>

        <div t-if="state.loading" class="ls-sec-loading">Loading rules...</div>

        <table t-else="" class="ls-sec-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Model</th>
                    <th>Domain</th>
                    <th>Perms</th>
                    <th>Active</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <t t-foreach="filteredRecords" t-as="r" t-key="r.id">
                    <tr>
                        <td><strong t-esc="r.name || '(unnamed)'"/></td>
                        <td>
                            <t t-if="r.model_id" t-esc="r.model_id[1]"/>
                            <t t-else="" t-esc="'?'"/>
                        </td>
                        <td><code class="ls-code" t-esc="(r.domain_force || '').substring(0, 50) + ((r.domain_force || '').length > 50 ? '...' : '')"/></td>
                        <td>
                            <span t-if="r.perm_read"   class="ls-badge ls-badge-r">R</span>
                            <span t-if="r.perm_write"  class="ls-badge ls-badge-w">W</span>
                            <span t-if="r.perm_create" class="ls-badge ls-badge-c">C</span>
                            <span t-if="r.perm_unlink" class="ls-badge ls-badge-u">D</span>
                            <span t-if="r.global"      class="ls-badge ls-badge-global">global</span>
                        </td>
                        <td>
                            <span t-att-class="r.active ? 'ls-dot ls-dot-on' : 'ls-dot ls-dot-off'"/>
                            <span t-esc="r.active ? 'Active' : 'Inactive'"/>
                        </td>
                        <td class="ls-actions">
                            <button class="ls-btn-icon" t-on-click="() => this.editRecord(r)" title="Edit"><t t-out="window.lucideIcon('pencil', 14)"/></button>
                            <button class="ls-btn-icon ls-btn-danger" t-on-click="() => this.deleteRecord(r)" title="Delete"><t t-out="window.lucideIcon('trash-2', 14)"/></button>
                        </td>
                    </tr>
                </t>
            </tbody>
        </table>
        <div t-if="filteredRecords.length === 0 &amp;&amp; !state.loading" class="ls-sec-empty">
            No record rules. Click <strong>New Rule</strong> to add one.
        </div>
    </div>

    <!-- FORM MODE -->
    <div t-if="state.mode === 'form'">
        <form class="ls-card-form" t-on-submit.prevent="save">
            <div class="ls-form-bar">
                <button type="button" class="ls-btn" t-on-click="backToList">
                    <t t-out="window.lucideIcon('arrow-left', 14)"/> Back
                </button>
                <h2 t-esc="state.current.id ? 'Edit Rule' : 'New Rule'"/>
                <div style="flex:1"></div>
                <button type="submit" class="ls-btn ls-btn-primary" t-att-disabled="state.saving">
                    <t t-if="state.saving" t-out="window.lucideIcon('loader', 14)"/>
                    <t t-else="" t-out="window.lucideIcon('check', 14)"/>
                    Save
                </button>
            </div>

            <div t-if="state.error" class="ls-alert-error" t-esc="state.error"/>

            <div class="ls-form-grid">
                <div class="ls-form-field">
                    <label>Name <span class="req">*</span></label>
                    <input type="text" class="ls-input" t-model="state.current.name" required="required" maxlength="120"/>
                </div>
                <div class="ls-form-field">
                    <label>Model <span class="req">*</span></label>
                    <select class="ls-input" t-model="state.current.model_id" required="required">
                        <option t-att-value="false">— Select —</option>
                        <t t-foreach="state.models" t-as="m" t-key="m.id">
                            <option t-att-value="m.id" t-esc="m.name + ' (' + (m.id) + ')'"/>
                        </t>
                    </select>
                </div>
            </div>

            <div class="ls-form-field">
                <label>Permissions</label>
                <div class="ls-perm-toggles">
                    <label><input type="checkbox" t-model="state.current.perm_read"/> Read</label>
                    <label><input type="checkbox" t-model="state.current.perm_write"/> Write</label>
                    <label><input type="checkbox" t-model="state.current.perm_create"/> Create</label>
                    <label><input type="checkbox" t-model="state.current.perm_unlink"/> Delete</label>
                    <label><input type="checkbox" t-model="state.current.global"/> Global (apply to all users)</label>
                    <label><input type="checkbox" t-model="state.current.active"/> Active</label>
                </div>
            </div>

            <div class="ls-form-field">
                <label>Domain <span class="req">*</span></label>
                <textarea class="ls-input ls-input-mono" t-model="state.current.domain_force" rows="3" required="required"
                          placeholder="[('user_id','=',__user_id__),('company_id','=',__company_id__)]"></textarea>
                <div class="ls-form-help">
                    Odoo domain syntax. Use placeholders:
                    <code class="ls-code-inline" t-on-click="() => this.insertPlaceholder(' __user_id__')">__user_id__</code>
                    <code class="ls-code-inline" t-on-click="() => this.insertPlaceholder(' __uid__')">__uid__</code>
                    <code class="ls-code-inline" t-on-click="() => this.insertPlaceholder(' __company_id__')">__company_id__</code>
                    <code class="ls-code-inline" t-on-click="() => this.insertPlaceholder(' __date__')">__date__</code>
                </div>
                <div class="ls-form-templates">
                    <span>Templates:</span>
                    <button type="button" class="ls-btn-link" t-on-click="() => this.insertTemplate('[(\'user_id\',\'=\',__user_id__)]')">Own records</button>
                    <button type="button" class="ls-btn-link" t-on-click="() => this.insertTemplate('[(\'company_id\',\'=\',__company_id__)]')">Own company</button>
                    <button type="button" class="ls-btn-link" t-on-click="() => this.insertTemplate('[]')">No filter</button>
                </div>
            </div>

            <div class="ls-form-field">
                <label>Groups (when not Global)</label>
                <div class="ls-checkbox-grid">
                    <t t-foreach="state.groups" t-as="g" t-key="g.id">
                        <label class="ls-checkbox-item">
                            <input type="checkbox"
                                   t-att-checked="state.current.groups.includes(g.id) ? 'checked' : null"
                                   t-on-change="() => this.toggleGroupInForm(g.id)"/>
                            <span t-esc="g.name"/>
                        </label>
                    </t>
                </div>
            </div>
        </form>
    </div>
</div>
`;

// ── 3. GROUPS ───────────────────────────────────────
window.TEMPLATES.groupsView = xml`
<div class="ls-sec-page">
    <div class="ls-sec-header">
        <h1>Groups</h1>
        <p class="ls-sec-subtitle">Security groups with implied-group hierarchy. Members of a group automatically inherit implied groups.</p>
    </div>

    <div t-if="state.mode === 'list'">
        <div class="ls-sec-toolbar">
            <input type="text" class="ls-input" placeholder="Search groups..." t-model="state.search"/>
            <button class="ls-btn ls-btn-primary" t-on-click="newRecord">
                <t t-out="window.lucideIcon('plus', 14)"/>
                New Group
            </button>
        </div>

        <div t-if="state.loading" class="ls-sec-loading">Loading groups...</div>

        <table t-else="" class="ls-sec-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <t t-foreach="filteredRecords" t-as="r" t-key="r.id">
                    <tr>
                        <td><strong t-esc="r.name"/></td>
                        <td>
                            <t t-if="r.category_id" t-esc="r.category_id[1]"/>
                            <t t-else="" t-esc="'—'"/>
                        </td>
                        <td t-esc="r.description || ''"/>
                        <td>
                            <span t-if="r.share" class="ls-badge ls-badge-portal">portal</span>
                            <span t-else="" class="ls-badge">internal</span>
                        </td>
                        <td class="ls-actions">
                            <button class="ls-btn-icon" t-on-click="() => this.editRecord(r)" title="Edit"><t t-out="window.lucideIcon('pencil', 14)"/></button>
                            <button class="ls-btn-icon ls-btn-danger" t-on-click="() => this.deleteRecord(r)" title="Delete"><t t-out="window.lucideIcon('trash-2', 14)"/></button>
                        </td>
                    </tr>
                </t>
            </tbody>
        </table>
    </div>

    <div t-if="state.mode === 'form'">
        <form class="ls-card-form" t-on-submit.prevent="save">
            <div class="ls-form-bar">
                <button type="button" class="ls-btn" t-on-click="backToList">
                    <t t-out="window.lucideIcon('arrow-left', 14)"/> Back
                </button>
                <h2 t-esc="state.current.id ? 'Edit Group' : 'New Group'"/>
                <div style="flex:1"></div>
                <button type="submit" class="ls-btn ls-btn-primary" t-att-disabled="state.saving">Save</button>
            </div>

            <div t-if="state.error" class="ls-alert-error" t-esc="state.error"/>

            <div class="ls-form-grid">
                <div class="ls-form-field">
                    <label>Name <span class="req">*</span></label>
                    <input type="text" class="ls-input" t-model="state.current.name" required="required" maxlength="80"/>
                </div>
                <div class="ls-form-field">
                    <label>Category</label>
                    <select class="ls-input" t-model="state.current.category_id">
                        <option t-att-value="false">— None —</option>
                        <t t-foreach="state.categories" t-as="c" t-key="c.id">
                            <option t-att-value="c.id" t-esc="c.name"/>
                        </t>
                    </select>
                </div>
            </div>

            <div class="ls-form-field">
                <label>Description</label>
                <input type="text" class="ls-input" t-model="state.current.description" maxlength="200"/>
            </div>

            <div class="ls-form-field">
                <label>Options</label>
                <label class="ls-checkbox-item">
                    <input type="checkbox" t-model="state.current.share"/>
                    Portal / Public group (for external users)
                </label>
            </div>

            <div class="ls-form-field">
                <label>Implied Groups (members of this group automatically belong to these)</label>
                <div class="ls-checkbox-grid">
                    <t t-foreach="state.groups" t-as="g" t-key="g.id">
                        <t t-if="!state.current.id || g.id !== state.current.id">
                            <label class="ls-checkbox-item">
                                <input type="checkbox"
                                       t-att-checked="state.current.implied_ids.includes(g.id) ? 'checked' : null"
                                       t-on-change="() => this.toggleImplied(g.id)"/>
                                <span t-esc="g.name"/>
                            </label>
                        </t>
                    </t>
                </div>
            </div>

            <div t-if="state.current.id &amp;&amp; state.groupUsers" class="ls-group-users">
                <h3>Members (<t t-esc="state.groupUsers.users.length"/>)</h3>
                <div class="ls-member-grid">
                    <t t-foreach="state.groupUsers.users" t-as="u" t-key="u.id">
                        <div class="ls-member-chip">
                            <span class="ls-avatar-mini" t-esc="(u.name || u.login).charAt(0).toUpperCase()"/>
                            <div>
                                <div t-esc="u.name || u.login"/>
                                <div class="ls-member-meta">
                                    <span t-esc="u.login"/>
                                    <span t-if="u.via === 'implied'" class="ls-via-tag">via inheritance</span>
                                </div>
                            </div>
                        </div>
                    </t>
                </div>
                <p t-if="state.groupUsers.users.length === 0" class="ls-empty-inline">No members yet.</p>
            </div>
        </form>
    </div>
</div>
`;

// ── 4. USERS ────────────────────────────────────────
window.TEMPLATES.usersView = xml`
<div class="ls-sec-page">
    <div class="ls-sec-header">
        <h1>Users</h1>
        <p class="ls-sec-subtitle">Manage user accounts, group memberships, and reset passwords.</p>
    </div>

    <div t-if="state.mode === 'list'">
        <div class="ls-sec-toolbar">
            <input type="text" class="ls-input" placeholder="Search users..." t-model="state.search"/>
            <button class="ls-btn ls-btn-primary" t-on-click="newRecord">
                <t t-out="window.lucideIcon('plus', 14)"/>
                New User
            </button>
        </div>

        <div t-if="state.loading" class="ls-sec-loading">Loading users...</div>

        <table t-else="" class="ls-sec-table">
            <thead>
                <tr>
                    <th></th>
                    <th>Login</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <t t-foreach="filteredRecords" t-as="r" t-key="r.id">
                    <tr>
                        <td>
                            <div class="ls-avatar-mini" t-esc="(r.name || r.login || '?').charAt(0).toUpperCase()"/>
                        </td>
                        <td><strong t-esc="r.login"/></td>
                        <td t-esc="r.name || ''"/>
                        <td t-esc="r.email || ''"/>
                        <td>
                            <t t-if="r.company_id" t-esc="r.company_id[1]"/>
                            <t t-else="" t-esc="'—'"/>
                        </td>
                        <td>
                            <span t-att-class="r.active ? 'ls-dot ls-dot-on' : 'ls-dot ls-dot-off'"/>
                            <span t-esc="r.active ? 'Active' : 'Inactive'"/>
                        </td>
                        <td class="ls-actions">
                            <button class="ls-btn-icon" t-on-click="() => this.editRecord(r)" title="Edit"><t t-out="window.lucideIcon('pencil', 14)"/></button>
                            <button class="ls-btn-icon ls-btn-danger" t-on-click="() => this.deleteRecord(r)" title="Delete"><t t-out="window.lucideIcon('trash-2', 14)"/></button>
                        </td>
                    </tr>
                </t>
            </tbody>
        </table>
    </div>

    <div t-if="state.mode === 'form'">
        <form class="ls-card-form" t-on-submit.prevent="save">
            <div class="ls-form-bar">
                <button type="button" class="ls-btn" t-on-click="backToList">
                    <t t-out="window.lucideIcon('arrow-left', 14)"/> Back
                </button>
                <h2 t-esc="state.current.id ? 'Edit User: ' + state.current.login : 'New User'"/>
                <div style="flex:1"></div>
                <button t-if="state.current.id" type="button" class="ls-btn ls-btn-warning" t-on-click="openPasswordReset">
                    <t t-out="window.lucideIcon('key', 14)"/> Reset Password
                </button>
                <button type="submit" class="ls-btn ls-btn-primary" t-att-disabled="state.saving">Save</button>
            </div>

            <div t-if="state.error" class="ls-alert-error" t-esc="state.error"/>

            <!-- PASSWORD RESET PANEL -->
            <div t-if="state.showPasswordReset" class="ls-password-panel">
                <h3>Reset Password</h3>
                <p class="ls-help">Set a new password for this user. The user will need to use it on their next login.</p>
                <div class="ls-form-grid">
                    <div class="ls-form-field">
                        <label>New Password</label>
                        <input type="password" class="ls-input" t-model="state.passwordForm.password" minlength="6"/>
                    </div>
                    <div class="ls-form-field">
                        <label>Confirm</label>
                        <input type="password" class="ls-input" t-model="state.passwordForm.password_confirmation" minlength="6"/>
                    </div>
                </div>
                <div style="display:flex;gap:8px;">
                    <button type="button" class="ls-btn ls-btn-primary" t-on-click="submitPasswordReset">Set Password</button>
                    <button type="button" class="ls-btn" t-on-click="() => state.showPasswordReset = false">Cancel</button>
                </div>
                <div t-if="state.passwordMessage" t-esc="state.passwordMessage"
                     t-att-class="state.passwordMessage.indexOf('successfully') >= 0 || state.passwordMessage.indexOf('success') >= 0 ? 'ls-alert-success' : 'ls-alert-error'"/>
            </div>

            <div class="ls-form-grid">
                <div class="ls-form-field">
                    <label>Login <span class="req">*</span></label>
                    <input type="text" class="ls-input" t-model="state.current.login" required="required" maxlength="64"
                           t-att-disabled="state.current.id ? 'disabled' : null"/>
                </div>
                <div class="ls-form-field">
                    <label>Name</label>
                    <input type="text" class="ls-input" t-model="state.current.name" maxlength="120"/>
                </div>
            </div>

            <div class="ls-form-grid">
                <div class="ls-form-field">
                    <label>Email</label>
                    <input type="email" class="ls-input" t-model="state.current.email" maxlength="160"/>
                </div>
                <div class="ls-form-field">
                    <label>Company</label>
                    <select class="ls-input" t-model="state.current.company_id">
                        <option t-att-value="false">— None —</option>
                        <t t-foreach="state.companies" t-as="c" t-key="c.id">
                            <option t-att-value="c.id" t-esc="c.name"/>
                        </t>
                    </select>
                </div>
            </div>

            <div class="ls-form-field" t-if="!state.current.id">
                <label>Password <span class="req">*</span></label>
                <input type="password" class="ls-input" t-model="state.current.password" minlength="6" maxlength="128"/>
                <p class="ls-help">User can change this from their profile after first login.</p>
            </div>

            <div class="ls-form-field">
                <label>Options</label>
                <div class="ls-perm-toggles">
                    <label><input type="checkbox" t-model="state.current.active"/> Active</label>
                    <label><input type="checkbox" t-model="state.current.share"/> Portal user (limited access)</label>
                </div>
            </div>

            <div class="ls-form-field">
                <label>Signature</label>
                <textarea class="ls-input" t-model="state.current.signature" rows="3" maxlength="2000"
                          placeholder="Email signature..."></textarea>
            </div>

            <div class="ls-form-field">
                <label>Security Groups</label>
                <div class="ls-checkbox-grid">
                    <t t-foreach="state.groups" t-as="g" t-key="g.id">
                        <label class="ls-checkbox-item">
                            <input type="checkbox"
                                   t-att-checked="state.current.group_ids.includes(g.id) ? 'checked' : null"
                                   t-on-change="() => this.toggleGroupInForm(g.id)"/>
                            <span t-esc="g.name"/>
                        </label>
                    </t>
                </div>
                <p class="ls-help">Members of a group automatically inherit its implied groups.</p>
            </div>
        </form>
    </div>
</div>
`;
})();
