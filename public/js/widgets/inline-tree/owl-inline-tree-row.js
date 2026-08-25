// ══════════════════════════════════════════════════════════════
//  InlineTree — Row Component
//  Presentational row with support for Sections & Notes (Odoo parity)
// ══════════════════════════════════════════════════════════════
(function () {
const { Component, xml } = owl;

class InlineTreeRow extends Component {
    static template = xml`
<tr t-att-class="rowClass()"
    t-att-data-id="line.id || line.__temp_id"
    t-att-data-index="props.index"
    t-on-click="(ev) => this.onRowClick(ev)"
    t-on-keydown="(ev) => this.onKeydown(ev)"
    t-on-contextmenu.prevent="(ev) => this.onContextMenu(ev)"
    t-ref="row">
    <!-- Selection checkbox -->
    <td class="ls-it-td-check" t-if="state.showSelect">
        <input type="checkbox" t-att-checked="state.isSelected(line)"
               t-on-click.stop="() => state.toggleSelect(line)"/>
    </td>
    <!-- Sequence handle -->
    <td class="ls-it-td-handle" t-if="hasSequence">
        <span class="ls-it-drag-handle" draggable="true"
              t-on-dragstart="(ev) => { ev.stopPropagation(); ev.preventDefault(); this.onDragStart(ev); }"
              t-on-dragend="(ev) => { ev.stopPropagation(); this.onDragEnd(ev); }"
              t-on-dragover="(ev) => ev.preventDefault()"
              title="Drag to reorder">☰</span>
    </td>

    <!-- ── SECTION ROW (display_type == 'line_section') ── -->
    <t t-if="isSection">
        <td t-att-colspan="props.columns.length" class="ls-it-td-section"
            t-on-click.stop="(ev) => this.onSectionClick(ev)">
            <t t-if="isEditing()">
                <input type="text" class="ls-it-input ls-it-section-input"
                       t-att-data-line-id="line.id || line.__temp_id"
                       data-field="name"
                       t-att-value="line.name || ''"
                       t-on-input="(ev) => this.onNameInput(ev)"
                       t-on-change="(ev) => this.onNameChange(ev)"
                       t-on-blur="(ev) => this.onNameChange(ev)"
                       placeholder="Section title..."/>
            </t>
            <t t-else="">
                <strong class="ls-it-section-title" t-esc="line.name || 'Untitled Section'"/>
            </t>
        </td>
    </t>

    <!-- ── NOTE ROW (display_type == 'line_note') ── -->
    <t t-elif="isNote">
        <td t-att-colspan="props.columns.length" class="ls-it-td-note"
            t-on-click.stop="(ev) => this.onNoteClick(ev)">
            <t t-if="isEditing()">
                <textarea class="ls-it-input ls-it-note-input"
                          t-att-data-line-id="line.id || line.__temp_id"
                          data-field="name"
                          rows="1"
                          t-on-input="(ev) => this.onNameInput(ev)"
                          t-on-change="(ev) => this.onNameChange(ev)"
                          t-on-blur="(ev) => this.onNameChange(ev)"
                          placeholder="Note description..."><t t-esc="line.name || ''"/></textarea>
            </t>
            <t t-else="">
                <em class="ls-it-note-text" t-esc="line.name || 'Note'"/>
            </t>
        </td>
    </t>

    <!-- ── STANDARD DATA CELLS ── -->
    <t t-else="">
        <t t-foreach="props.columns" t-as="col" t-key="col.name + '_' + (line.id || line.__temp_id)">
            <td t-att-class="cellClass(col)"
                t-att-data-field="col.name"
                t-att-data-type="col.type"
                t-att-title="getCellTitle(line, col)"
                t-on-click.stop="(ev) => this.onCellClick(line, col, ev)">
                <t t-out="renderCell(line, col)"/>
            </td>
        </t>
    </t>

    <!-- Row status indicator -->
    <td class="ls-it-td-status" t-if="!state.readOnly">
        <span t-att-class="'ls-it-status-dot ' + (state.rowStatus[line.id || line.__temp_id] || '')"
              t-att-title="state.rowStatus[line.id || line.__temp_id] || ''"/>
    </td>
    <!-- Row action buttons (from tabDef.buttons) -->
    <t t-if="rowButtons.length">
        <td class="ls-it-td-rowbtn" t-foreach="rowButtons" t-as="btn" t-key="btn.name">
            <button t-att-class="'ls-it-row-btn ' + (btn.class || '')"
                    t-on-click.stop="(ev) => this.onButtonClick(line, btn, ev)">
                <t t-if="btn.icon" t-esc="btn.icon"/>
                <t t-esc="btn.string || btn.name"/>
            </button>
        </td>
    </t>
    <!-- Delete column -->
    <td class="ls-it-td-actions" t-if="canDelete">
        <button class="ls-it-btn-delete" t-on-click.stop="() => this.deleteLine(line)"
                title="Delete row">🗑</button>
    </td>
</tr>`;

    static props = {
        line: { type: Object },
        index: { type: Number },
        columns: { type: Array },
        state: { type: Object },
        canDelete: { type: Boolean, optional: true },
        hasSequence: { type: Boolean, optional: true },
        rowButtons: { type: Array, optional: true },
        decorators: { type: Object, optional: true },
        onLineUpdate: { type: Function, optional: true },
        onLineDelete: { type: Function, optional: true },
        onRowClick: { type: Function, optional: true },
        onRowContext: { type: Function, optional: true },
        onDragStart: { type: Function, optional: true },
        onDragEnd: { type: Function, optional: true },
        onDragOver: { type: Function, optional: true },
        onCellClick: { type: Function, optional: true },
        onButtonClick: { type: Function, optional: true },
        onTabOut: { type: Function, optional: true },
        onTabIn: { type: Function, optional: true },
    };

    get line() { return this.props.line; }
    get state() { return this.props.state; }
    get hasSequence() { return this.props.hasSequence; }
    get rowButtons() { return this.props.rowButtons || []; }
    get canDelete() { return this.props.canDelete; }
    get isSection() { return this.line.display_type === 'line_section' || this.line.display_type === 'section'; }
    get isNote() { return this.line.display_type === 'line_note' || this.line.display_type === 'note'; }

    rowClass() {
        const line = this.props.line;
        const id = line.id || line.__temp_id;
        const cls = ['ls-it-row'];
        if (this.isSection) cls.push('ls-it-section-row o_is_line_section');
        if (this.isNote) cls.push('ls-it-note-row o_is_line_note');
        if (this.props.state.isSelected(line)) cls.push('selected');
        if (this.props.state.editingIds.includes(id)) cls.push('editing');
        const decClass = this.computeDecorationClass();
        if (decClass) cls.push(decClass);
        const status = this.props.state.rowStatus[id];
        if (status === 'dirty') cls.push('ls-it-dirty');
        else if (status === 'error') cls.push('ls-it-error');
        else if (status === 'saved') cls.push('ls-it-saved');
        return cls.join(' ');
    }

    cellClass(col) {
        const cls = ['ls-it-td'];
        if (['float', 'integer', 'monetary'].includes(col.type)) cls.push('ls-it-num');
        if (col.required) cls.push('ls-it-required');
        if (col.readonly) cls.push('ls-it-readonly');
        return cls.join(' ');
    }

    getCellTitle(line, col) {
        if (col.help) return col.help;
        const val = line[col.name];
        if (typeof val === 'string' && val.length > 40) return val;
        if (Array.isArray(val)) return val[1] || '';
        return '';
    }

    computeDecorationClass() {
        const line = this.props.line;
        const dec = this.props.decorators || {};
        const ctx = { ...line };
        const map = {
            'decoration-bf': 'ls-it-bold',
            'decoration-it': 'ls-it-italic',
            'decoration-danger': 'ls-it-danger',
            'decoration-warning': 'ls-it-warning',
            'decoration-success': 'ls-it-success',
            'decoration-info': 'ls-it-row-info',
            'decoration-primary': 'ls-it-primary',
            'decoration-muted': 'ls-it-muted',
            bf: 'ls-it-bold',
            it: 'ls-it-italic',
            danger: 'ls-it-danger',
            warning: 'ls-it-warning',
            success: 'ls-it-success',
            info: 'ls-it-row-info',
            primary: 'ls-it-primary',
            muted: 'ls-it-muted',
        };
        if (window.InlineTreeAttrs) {
            for (const [key, cls] of Object.entries(map)) {
                if (dec[key] && window.InlineTreeAttrs.evalAttrExpr(dec[key], ctx)) {
                    return cls;
                }
            }
        }
        return '';
    }

    isEditing() {
        return this.props.state.editingIds.includes(this.props.line.id || this.props.line.__temp_id);
    }

    renderCell(line, col) {
        if (this.isEditing() && !col.readonly) {
            return window.CellEditors.edit(col, line, this.props.state);
        }
        return window.CellEditors.render(col, line);
    }

    onRowClick(ev) {
        if (this.props.onRowClick) this.props.onRowClick(this.props.line, ev);
    }

    onSectionClick(ev) {
        const id = this.line.id || this.line.__temp_id;
        this.props.state.enterEdit(id);
        setTimeout(() => {
            const el = document.querySelector(`input[data-line-id="${id}"][data-field="name"]`);
            if (el) el.focus();
        }, 20);
    }

    onNoteClick(ev) {
        const id = this.line.id || this.line.__temp_id;
        this.props.state.enterEdit(id);
        setTimeout(() => {
            const el = document.querySelector(`textarea[data-line-id="${id}"][data-field="name"]`);
            if (el) el.focus();
        }, 20);
    }

    onNameInput(ev) {
        this.line.name = ev.target.value;
    }

    onNameChange(ev) {
        const val = ev.target.value;
        const lineId = this.line.id || this.line.__temp_id;
        this.line.name = val;
        if (this.props.onLineUpdate) {
            this.props.onLineUpdate(lineId, 'name', val, val);
        }
    }

    onCellClick(line, col, ev) {
        if (this.props.onCellClick) this.props.onCellClick(line, col, ev);
    }

    onContextMenu(ev) {
        if (this.props.onRowContext) this.props.onRowContext(this.props.line, ev);
    }

    onKeydown(ev) {
        const lineId = this.props.line.id || this.props.line.__temp_id;

        if (ev.key === 'Tab') {
            const td = ev.target.closest('td.ls-it-td, td.ls-it-td-section, td.ls-it-td-note');
            if (!td) return;
            const row = td.parentElement;
            const cells = Array.from(row.querySelectorAll('td.ls-it-td:not(.ls-it-readonly), td.ls-it-td-section, td.ls-it-td-note'));
            const idx = cells.indexOf(td);

            if (!ev.shiftKey && idx === cells.length - 1) {
                if (this.props.onTabOut) {
                    ev.preventDefault();
                    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
                    this.props.onTabOut(this.props.line, this.props.index);
                } else {
                    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
                    this.props.state.exitEdit(lineId);
                }
            } else if (ev.shiftKey && idx === 0) {
                if (this.props.onTabIn) {
                    ev.preventDefault();
                    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
                    this.props.onTabIn(this.props.line, this.props.index);
                } else {
                    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
                    this.props.state.exitEdit(lineId);
                }
            }
        } else if (ev.key === 'Enter') {
            // In note textarea, Shift+Enter makes newline; Enter confirms
            if (ev.target.tagName === 'TEXTAREA' && ev.shiftKey) {
                return;
            }
            ev.preventDefault();
            if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
            if (this.props.onTabOut) {
                this.props.onTabOut(this.props.line, this.props.index);
            } else {
                this.props.state.exitEdit(lineId);
            }
        } else if (ev.key === 'Escape') {
            ev.preventDefault();
            this.props.state.exitEdit(lineId);
        } else if (ev.key === 'ArrowDown' && !ev.shiftKey && !ev.altKey) {
            if (ev.target.tagName !== 'SELECT' && ev.target.tagName !== 'TEXTAREA') {
                const curRow = ev.target.closest('tr.ls-it-row');
                const nextRow = curRow?.nextElementSibling;
                if (nextRow && nextRow.classList.contains('ls-it-row')) {
                    ev.preventDefault();
                    const targetInput = nextRow.querySelector('input:not([type="checkbox"]), select, textarea');
                    if (targetInput) targetInput.focus();
                }
            }
        } else if (ev.key === 'ArrowUp' && !ev.shiftKey && !ev.altKey) {
            if (ev.target.tagName !== 'SELECT' && ev.target.tagName !== 'TEXTAREA') {
                const curRow = ev.target.closest('tr.ls-it-row');
                const prevRow = curRow?.previousElementSibling;
                if (prevRow && prevRow.classList.contains('ls-it-row')) {
                    ev.preventDefault();
                    const targetInput = prevRow.querySelector('input:not([type="checkbox"]), select, textarea');
                    if (targetInput) targetInput.focus();
                }
            }
        }
    }

    onButtonClick(line, btn, ev) {
        if (this.props.onButtonClick) this.props.onButtonClick(line, btn, ev);
    }

    onDragStart(ev) {
        if (this.props.onDragStart) this.props.onDragStart(this.props.line, this.props.index, ev);
    }

    onDragEnd(ev) {
        if (this.props.onDragEnd) this.props.onDragEnd(this.props.line, this.props.index, ev);
    }

    deleteLine(line) {
        if (this.props.onLineDelete) this.props.onLineDelete(line);
    }
}

window.InlineTreeRow = InlineTreeRow;
})();
