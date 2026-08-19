// ══════════════════════════════════════════════════════════════
//  InlineTree — Add From List Picker
//  Wraps M2OSearchDialog for multi-select O2M creation
// ══════════════════════════════════════════════════════════════
(function () {
const { Component, xml, useState, onMounted } = owl;
const RPC = window.LarasoftRPC;

class AddFromListDialog extends Component {
    static template = xml`
<div class="ls-m2o-dialog-overlay" t-on-click="onOverlayClick">
    <div class="ls-m2o-dialog ls-add-from-list" t-on-click.stop="">
        <div class="ls-m2o-dialog-header">
            <h3 t-esc="'Select ' + (props.picker.model_label || props.picker.model) + ' records'"/>
            <button class="ls-m2o-dialog-close" t-on-click="onCancel">×</button>
        </div>
        <div class="ls-m2o-dialog-search-bar">
            <input type="text" class="ls-m2o-dialog-search-box" placeholder="Search..."
                   t-att-value="state.query"
                   t-on-input="(ev) => this.onSearch(ev)"/>
        </div>
        <div class="ls-m2o-dialog-body">
            <table class="ls-m2o-dialog-table">
                <thead>
                    <tr>
                        <th style="width:30px"><input type="checkbox" t-on-change="toggleAll" t-att-checked="state.allSelected"/></th>
                        <t t-foreach="props.picker.fields || ['name']" t-as="f" t-key="f">
                            <th t-esc="f"/>
                        </t>
                    </tr>
                </thead>
                <tbody>
                    <tr t-foreach="state.results" t-as="rec" t-key="rec.id"
                        t-on-click="(ev) => this.toggleRow(rec, ev)">
                        <td><input type="checkbox" t-att-checked="state.selectedIds.includes(rec.id)"
                                   t-on-click.stop="(ev) => this.toggleRow(rec, ev)"
                                   t-on-change="(ev) => this.toggleRow(rec, ev)"/></td>
                        <t t-foreach="props.picker.fields || ['name']" t-as="f" t-key="f">
                            <td t-esc="rec[f] || ''"/>
                        </t>
                    </tr>
                    <tr t-if="state.results.length === 0">
                        <td t-att-colspan="(props.picker.fields || ['name']).length + 1" class="ls-m2o-dialog-empty">
                            No records found.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="ls-m2o-dialog-footer">
            <span t-esc="state.selectedIds.length + ' selected'"/>
            <div style="flex:1"></div>
            <button class="ls-btn ls-btn-sm" t-on-click="onCancel">Cancel</button>
            <button class="ls-btn ls-btn-primary ls-btn-sm" t-on-click="onConfirm" t-att-disabled="state.selectedIds.length === 0">
                Add (<t t-esc="state.selectedIds.length"/>)
            </button>
        </div>
    </div>
</div>`;

    static props = {
        picker: { type: Object },
        onClose: { type: Function },
        onConfirm: { type: Function },
    };

    setup() {
        this.state = useState({
            query: '',
            results: [],
            selectedIds: [],
            allSelected: false,
            loading: false,
        });
        onMounted(() => this.search());
    }

    async search() {
        const model = this.props.picker.model;
        const domain = this.props.picker.default_domain || [];
        try {
            this.state.loading = true;
            const res = await RPC.searchRead(model, domain, {
                fields: this.props.picker.fields || ['name'],
                limit: this.props.picker.limit || 80,
            });
            this.state.results = res.records || [];
        } catch (e) {
            this.state.results = [];
        } finally {
            this.state.loading = false;
        }
    }

    onSearch(ev) {
        this.state.query = ev.target.value;
        clearTimeout(this._t);
        this._t = setTimeout(() => this.search(), 220);
    }

    toggleRow(rec, ev) {
        if (ev) ev.stopPropagation();
        const idx = this.state.selectedIds.indexOf(rec.id);
        if (idx >= 0) this.state.selectedIds.splice(idx, 1);
        else this.state.selectedIds.push(rec.id);
        this.state.allSelected = this.state.selectedIds.length === this.state.results.length;
    }

    toggleAll() {
        if (this.state.allSelected) {
            this.state.selectedIds = [];
            this.state.allSelected = false;
        } else {
            this.state.selectedIds = this.state.results.map(r => r.id);
            this.state.allSelected = true;
        }
    }

    onOverlayClick(ev) {
        if (ev.target.classList.contains('ls-m2o-dialog-overlay')) {
            this.onCancel();
        }
    }

    onCancel() {
        this.props.onClose();
    }

    onConfirm() {
        const sel = this.state.selectedIds.map(id => {
            return this.state.results.find(r => r.id === id);
        }).filter(Boolean);
        this.props.onConfirm(sel);
    }
}

window.AddFromListDialog = AddFromListDialog;
})();
