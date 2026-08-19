(function(){
const { Component, useState, onMounted, useRef, onPatched, onWillUnmount } = owl;

class FieldMany2one extends Component {
    static template = owl.xml`
        <div class="ls-reference-widget ls-m2o-widget" t-att-data-field="props.fieldDef.name" t-att-data-relation="props.fieldDef.relation">
            <t t-if="props.readonly">
                <a t-if="props.value and props.value[0]" href="#" class="ls-m2o-external-link" t-att-data-id="props.value[0]" t-att-data-field="props.fieldDef.name" t-esc="props.value[1] || props.value[0]" t-on-click.prevent="openRecord"/>
                <span t-else="" class="ls-empty-dash">—</span>
            </t>
            <t t-else="">
                <div class="ls-m2o-input-group">
                    <input type="text" class="ls-field-input ls-m2o-autocomplete"
                        t-ref="input"
                        data-m2o-bound="1"
                        t-att-placeholder="props.fieldDef.placeholder || ''"
                        t-att-data-field="props.fieldDef.name"
                        t-att-data-relation="props.fieldDef.relation" />
                    <button type="button" class="ls-m2o-dropdown-trigger" tabindex="-1" t-on-click.prevent="focusInput">
                        <span class="ls-m2o-chevron">▼</span>
                    </button>
                    <button type="button" class="ls-m2o-clear" t-if="props.value" t-on-click="onClear">✕</button>
                    <a t-if="props.value and props.value[0]" href="#" class="ls-m2o-external-link ls-m2o-internal-link" tabindex="-1" t-att-data-id="props.value[0]" t-att-data-field="props.fieldDef.name" t-on-click.prevent="openRecord">🔗</a>
                </div>
            </t>
        </div>
    `;

    setup() {
        this.inputRef = useRef("input");
        this.m2oInstance = null;
        
        onMounted(() => {
            this._initAutocomplete();
        });
        
        onPatched(() => {
            this._syncAutocomplete();
        });
        
        onWillUnmount(() => {
            if (this.m2oInstance) this.m2oInstance.destroy();
        });
    }

    _initAutocomplete() {
        if (!this.inputRef.el || this.props.readonly) return;
        
        const fDef = this.props.fieldDef;
        this.m2oInstance = new window.M2OAutocomplete({
            input: this.inputRef.el,
            relation: fDef.relation,
            fieldLabel: fDef.string || fDef.name,
            fieldName: fDef.name,
            relOptions: this.props.relOptions || [],
            options: fDef.options || {},
            onSelect: (item) => {
                this.props.updateField([item.id, item.name]);
            },
            onClear: () => {
                this.props.updateField(false);
            }
        });
        this._syncAutocomplete();
    }

    _syncAutocomplete() {
        if (!this.m2oInstance) return;
        if (this.props.value) {
            this.inputRef.el.value = Array.isArray(this.props.value) ? this.props.value[1] : this.props.value;
        } else {
            this.inputRef.el.value = '';
        }
    }

    onClear(ev) {
        ev.preventDefault();
        this.props.updateField(false);
        if (this.inputRef.el) {
            this.inputRef.el.value = '';
            this.inputRef.el.focus();
        }
    }
    
    focusInput() {
        if (this.inputRef.el) this.inputRef.el.focus();
    }
    
    openRecord(ev) {
        if (!this.props.value || !this.props.value[0]) return;
        const id = Array.isArray(this.props.value) ? this.props.value[0] : this.props.value;
        const relation = this.props.fieldDef.relation;
        if (relation && id && window.__doAction) {
            window.__doAction({
                type: 'ir.actions.act_window',
                res_model: relation,
                res_id: parseInt(id),
                view_mode: 'form'
            });
        }
    }
}

class FieldMany2manyTags extends Component {
    static template = owl.xml`
        <div class="ls-m2m-widget" t-att-data-field="props.fieldDef.name" t-att-data-relation="props.fieldDef.relation">
            <t t-if="props.value and props.value.length">
                <span t-foreach="props.value" t-as="tag" t-key="tag.id" t-att-class="'ls-badge ' + (tag.color ? 'ls-badge-color-' + tag.color : 'ls-badge-primary')">
                    <t t-esc="tag.name"/>
                    <button t-if="!props.readonly" type="button" class="ls-m2m-tag-remove" t-on-click.prevent="() => this.removeTag(tag.id)">✕</button>
                </span>
            </t>
            <t t-else="">
                <span t-if="props.readonly" class="ls-empty-dash">—</span>
            </t>
            
            <t t-if="!props.readonly">
                <div class="ls-m2m-input-container" style="display:inline-block; vertical-align:middle; margin-left:4px;">
                    <input type="text" class="ls-m2m-autocomplete"
                        t-ref="input"
                        data-m2o-bound="1"
                        placeholder="Add..."
                        style="border:none; outline:none; background:transparent; width:120px;"
                        t-att-data-field="props.fieldDef.name"
                        t-att-data-relation="props.fieldDef.relation" />
                </div>
            </t>
        </div>
    `;

    setup() {
        this.inputRef = useRef("input");
        this.m2oInstance = null;
        
        onMounted(() => {
            this._initAutocomplete();
        });
        
        onWillUnmount(() => {
            if (this.m2oInstance) this.m2oInstance.destroy();
        });
    }

    _initAutocomplete() {
        if (!this.inputRef.el || this.props.readonly) return;
        
        const fDef = this.props.fieldDef;
        this.m2oInstance = new window.M2OAutocomplete({
            input: this.inputRef.el,
            relation: fDef.relation,
            fieldLabel: fDef.string || fDef.name,
            fieldName: fDef.name,
            relOptions: this.props.relOptions || [],
            options: fDef.options || {},
            onSelect: (item) => {
                const current = Array.isArray(this.props.value) ? [...this.props.value] : [];
                if (!current.find(t => t.id === item.id)) {
                    current.push({ id: item.id, name: item.name });
                    this.props.updateField(current);
                }
                this.inputRef.el.value = '';
                this.inputRef.el.focus();
            }
        });
    }

    removeTag(tagId) {
        if (this.props.readonly) return;
        const current = Array.isArray(this.props.value) ? [...this.props.value] : [];
        const filtered = current.filter(t => t.id !== tagId);
        this.props.updateField(filtered);
    }
}

// Register as OWL component
if (window.FieldWidgets && window.FieldWidgets.components) {
    window.FieldWidgets.components['many2one'] = FieldMany2one;
    window.FieldWidgets.components['many2many_tags'] = FieldMany2manyTags;
} else {
    // Wait for FieldWidgets to be initialized
    window.addEventListener('load', () => {
        if (window.FieldWidgets && window.FieldWidgets.components) {
            window.FieldWidgets.components['many2one'] = FieldMany2one;
            window.FieldWidgets.components['many2many_tags'] = FieldMany2manyTags;
        }
    });
}

})();
