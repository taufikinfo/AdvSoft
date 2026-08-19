(function(){
const { Component, useState, onMounted } = owl;

class FieldDomain extends Component {
    static template = owl.xml`
        <div class="ls-domain-builder-component" t-att-data-field="props.fieldDef.name" style="position: relative;">
            <t t-if="props.readonly">
                <div class="ls-field-input ls-code-font" style="background:#f8fafc; color:#64748b; padding:6px 12px; border-radius:4px;" t-esc="props.value || '[]'"/>
            </t>
            <t t-else="">
                <input type="text" class="ls-field-input ls-code-font" 
                    t-att-value="props.value || '[]'" 
                    placeholder="[('field', '=', 'value')]"
                    t-on-change="onChange"/>
                <span class="ls-domain-hint" title="Open Visual Domain Builder" 
                      style="cursor: pointer; position: absolute; right: 10px; top: 50%; transform: translateY(-50%);"
                      t-on-click="openDialog">🔧</span>
            </t>
        </div>
    `;

    setup() {
        // We use the existing DomainBuilderDialog for the UI modal, but handle state natively in OWL
    }

    onChange(ev) {
        this.props.updateField(ev.target.value);
    }

    openDialog() {
        if (!window.DomainBuilderDialog) {
            console.error("DomainBuilderDialog not found!");
            return;
        }
        
        window.DomainBuilderDialog.open({
            domain: this.props.value || '[]',
            model: this.props.fieldDef.relation || this.props.record?._model || '',
            onSave: (newDomain) => {
                this.props.updateField(newDomain);
            }
        });
    }
}

// Register as OWL component
window.addEventListener('load', () => {
    if (window.FieldWidgets && window.FieldWidgets.components) {
        window.FieldWidgets.components['domain'] = FieldDomain;
        window.FieldWidgets.components['char_domain'] = FieldDomain;
    }
});

})();
