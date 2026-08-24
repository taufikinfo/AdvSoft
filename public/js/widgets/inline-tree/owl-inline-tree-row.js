// ══════════════════════════════════════════════════════════════
//  InlineTree — Row Component
//  Presentational row that delegates cells to CellEditors
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
    <!-- Data cells -->
    <t t-foreach="props.columns" t-as="col" t-key="col.name + '_' + (line.id || line.__temp_id)">
        <td t-att-class="cellClass(col)"
            t-att-data-field="col.name"
            t-att-data-type="col.type"
            t-att-title="getCellTitle(line, col)"
            t-on-click.stop="(ev) => this.onCellClick(line, col, ev)">
            <t t-out="renderCell(line, col)"/>
        </td>
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
        onTabOut: { type: Function, optional: true },   // called when Tab goes past last cell
        onTabIn: { type: Function, optional: true },    // called when Shift+Tab goes before first cell
    };

    get line() { return this.props.line; }
    get state() { return this.props.state; }
    get hasSequence() { return this.props.hasSequence; }
    get rowButtons() { return this.props.rowButtons || []; }
    get canDelete() { return this.props.canDelete; }

    rowClass() {
        const line = this.props.line;
        const id = line.id || line.__temp_id;
        const cls = ['ls-it-row'];
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
        // For text-overflow cells, show full value as tooltip
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
            // Legacy short keys (kept for compat)
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

    onCellClick(line, col, ev) {
        if (this.props.onCellClick) this.props.onCellClick(line, col, ev);
    }

    onContextMenu(ev) {
        if (this.props.onRowContext) this.props.onRowContext(this.props.line, ev);
    }

    onKeydown(ev) {
        if (ev.key === 'Tab') {
            const td = ev.target.closest('td.ls-it-td');
            if (!td) return;
            const row = td.parentElement;
            const cells = Array.from(row.querySelectorAll('td.ls-it-td:not(.ls-it-readonly)'));
            const idx = cells.indexOf(td);
            if (!ev.shiftKey && idx === cells.length - 1) {
                // Moving past last editable cell → notify parent to move to next row
                if (this.props.onTabOut) {
                    ev.preventDefault();
                    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
                    this.props.onTabOut(this.props.line, this.props.index);
                } else {
                    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
                    this.props.state.exitEdit(this.props.line.id || this.props.line.__temp_id);
                }
            } else if (ev.shiftKey && idx === 0) {
                // Moving before first editable cell → notify parent to move to prev row
                if (this.props.onTabIn) {
                    ev.preventDefault();
                    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
                    this.props.onTabIn(this.props.line, this.props.index);
                } else {
                    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
                    this.props.state.exitEdit(this.props.line.id || this.props.line.__temp_id);
                }
            }
        } else if (ev.key === 'Enter') {
            // Commit current cell and exit edit mode (AdvSoft behaviour)
            ev.preventDefault();
            if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
            this.props.state.exitEdit(this.props.line.id || this.props.line.__temp_id);
        } else if (ev.key === 'Escape') {
            // Discard pending input and exit edit mode
            ev.preventDefault();
            this.props.state.exitEdit(this.props.line.id || this.props.line.__temp_id);
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
