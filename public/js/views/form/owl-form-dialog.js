// ══════════════════════════════════════════════════════════════
//  Form View Dialog Component
//  Displays FormView within a modal for inline relation editing
// ══════════════════════════════════════════════════════════════
(function () {
const { Component, xml, useState, onMounted } = owl;
const RPC = window.AdvSoftRPC;

class FormViewDialog extends Component {
    static template = xml`
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
</div>`;

    static components = { FormView: window.FormView };

    static props = {
        model: { type: String },
        resId: { type: [Number, String, Boolean], optional: true }, // Boolean for false/null
        title: { type: String, optional: true },
        context: { type: Object, optional: true },
        onClose: { type: Function },
        onSaved: { type: Function, optional: true },
    };

    setup() {
        this.state = useState({
            viewDef: null,
            loading: true,
        });
        onMounted(() => this.loadView());
    }

    async loadView() {
        try {
            this.state.loading = true;
            const res = await RPC.getView(this.props.model, 'form');
            this.state.viewDef = res;
        } catch (e) {
            console.error('Failed to load form view', e);
        } finally {
            this.state.loading = false;
        }
    }

    onOverlayClick(ev) {
        if (ev.target.classList.contains('ls-m2o-dialog-overlay')) {
            // Close if clicked outside
            this.onCancel();
        }
    }

    onCancel() {
        if (this.props.onClose) this.props.onClose();
    }

    onSaved(rec) {
        if (this.props.onSaved) this.props.onSaved(rec);
        this.onCancel();
    }
}

window.FormViewDialog = FormViewDialog;
})();
