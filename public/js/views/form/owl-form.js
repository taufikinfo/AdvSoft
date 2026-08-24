// Form View Component – Completely Dynamic & Widget-Driven
(function () {
const { Component, useState, onWillStart, onMounted, onPatched, useRef } = owl;
const RPC = window.AdvSoftRPC;

class FormView extends Component {
    static template = window.TEMPLATES.FormView;
    static components = { InlineTreeWidget: window.InlineTreeWidget };
    static props = {
        recordId: { type: [Number, String, Boolean], optional: true },
        recordIndex: { type: Number, optional: true },
        totalRecords: { type: Number, optional: true },
        model: { type: String, optional: true },
        stages: { type: Array, optional: true },
        projects: { type: Array, optional: true },
        tags: { type: Array, optional: true },
        formViewDef: { type: Object, optional: true },
        actionTitle: { type: String, optional: true },
        onBack: { type: Function, optional: true },
        onNavigate: { type: Function, optional: true },
        onSaved: { type: Function, optional: true },
        actionContext: { type: Object, optional: true },
    };

    setup() {
        this._model = this.props.model || 'task';
        this._formDef = this.props.formViewDef || {};
        this.formFieldsRef = useRef("formFields");
        this._relOptionsCache = {}; // Cache for name_search results
        this._childFieldDefs = {};  // Field definitions for child models (one2many)
        this._m2oInstances = [];    // Active M2OAutocomplete instances

        this.state = useState({
            record: {},
            loading: true,
            dirty: false,
            activeTab: this._formDef.tabs?.[0]?.name || 'description',
            relOptions: {}, // Dynamic relation options keyed by field name
            o2mRelOptions: {}, // Relation options for one2many child fields
            // Chatter state
            messages: [],
            showComposer: false,
            composerType: 'message', // 'message' or 'note'
            printActions: [],
            showPrintMenu: false,
        });

        onWillStart(async () => {
            await this._fetchPrintActions();
            await this._loadRelOptions();
            await this._loadChildFieldDefs();
            await this.loadRecord();
        });

        onMounted(() => {
            // Scroll to top
            window.scrollTo(0, 0);
            this._bindM2OAutocompletes();
            this._bindSignatures();
            this._bindImageValidation();
            this._bindRTEInstances();
            // ── Keyboard Shortcuts ──
            this._boundKeyHandler = this._handleKeyboardShortcuts.bind(this);
            document.addEventListener('keydown', this._boundKeyHandler);
            // ── Auto-Save Timer (every 120s if dirty) ──
            this._autoSaveTimer = setInterval(() => {
                if (this.state.dirty && this.props.recordId > 0) {
                    this.saveRecord();
                }
            }, 120000);
        });

        onPatched(() => {
            this._bindM2OAutocompletes();
            this._bindSignatures();
            this._bindImageValidation();
            this._bindRTEInstances();
        });

        // ── Cleanup: remove keyboard listener & auto-save on destroy ──
        owl.onWillDestroy(() => {
            if (this._boundKeyHandler) document.removeEventListener('keydown', this._boundKeyHandler);
            if (this._autoSaveTimer) clearInterval(this._autoSaveTimer);
            Object.values(this._debounceTimers).forEach(t => clearTimeout(t));
        });

        // Global click to close print menu
        this._onClickOutside = (e) => {
            if (!e.target.closest('.ls-print-menu')) {
                this.state.showPrintMenu = false;
            }
        };
        document.addEventListener('click', this._onClickOutside);
        owl.onWillDestroy(() => {
            document.removeEventListener('click', this._onClickOutside);
        });
    }

    /**
     * Bind M2OAutocomplete instances to all Many2one autocomplete inputs.
     * Handles both form-level M2O fields and O2M inline tree M2O inputs.
     */
    _bindM2OAutocompletes() {
        // Clean up instances whose inputs are no longer in DOM
        this._m2oInstances = this._m2oInstances.filter(inst => {
            if (!document.body.contains(inst.input)) {
                inst.destroy();
                return false;
            }
            return true;
        });

        // ── 1. Form-level Many2one autocomplete inputs ──
        const formInputs = Array.from(document.querySelectorAll('.ls-m2o-autocomplete:not([data-m2o-bound])'))
                                .filter(el => !el.closest('.ls-it-table'));
        formInputs.forEach(input => {
            input.setAttribute('data-m2o-bound', '1');
            const fieldName = input.dataset.field;
            const relation = input.dataset.relation;
            if (!relation || !fieldName) return;

            const refWidget = input.closest('.ls-reference-widget');
            // Only treat as reference if it has a model selector (true Reference field)
            const isReference = !!refWidget && !!refWidget.querySelector('.ls-ref-model');
            const actualFieldName = isReference ? refWidget.dataset.field : fieldName;

            const fdef = (this._formDef.field_defs || {})[actualFieldName];
            const fieldOpts = fdef?.options || {};
            const widget = input.closest('.ls-m2o-widget');
            const relOptions = this.state.relOptions[actualFieldName] || [];

            const ac = new window.M2OAutocomplete({
                input,
                relation,
                fieldLabel: fdef?.string || actualFieldName,
                fieldName: actualFieldName,
                relOptions,
                options: {
                    no_create: widget?.dataset.noCreate === '1' || fieldOpts.no_create,
                    no_quick_create: widget?.dataset.noQuickCreate === '1' || fieldOpts.no_quick_create,
                    no_create_edit: widget?.dataset.noCreateEdit === '1' || fieldOpts.no_create_edit,
                    domain: fdef?.domain || null,
                },
                onSelect: (opt) => {
                    if (isReference) {
                        const curModel = refWidget.querySelector('.ls-ref-model').value;
                        this.updateField(actualFieldName, [curModel, opt.id, opt.name]);
                    } else {
                        this.updateField(actualFieldName, [opt.id, opt.name]);
                    }
                },
                onClear: () => {
                    if (isReference) {
                        const curModel = refWidget.querySelector('.ls-ref-model').value;
                        this.updateField(actualFieldName, curModel ? `${curModel},` : '');
                    } else {
                        this.updateField(actualFieldName, false);
                    }
                },
            });
            this._m2oInstances.push(ac);
        });



        // ── 2. M2O Action Buttons (external link, clear, dropdown trigger) ──
        // External link
        document.querySelectorAll('.ls-m2o-external-link:not([data-bound])').forEach(btn => {
            btn.setAttribute('data-bound', '1');
            btn.addEventListener('click', (ev) => {
                ev.preventDefault();
                const refContainer = btn.closest('.ls-reference-widget');
                const isReference = !!refContainer && !!refContainer.querySelector('.ls-ref-model');
                const fieldName = isReference ? refContainer.dataset.field : btn.dataset.field;
                const recordId = parseInt(btn.dataset.id);
                const fdef = (this._formDef.field_defs || {})[fieldName];
                const relModel = isReference ? refContainer.querySelector('.ls-ref-model').value : fdef?.relation;
                if (relModel && recordId && window.__doAction) {
                    window.__doAction({
                        type: 'ir.actions.act_window',
                        res_model: relModel,
                        res_id: recordId,
                        view_mode: 'form',
                    });
                }
            });
        });

        // Clear button
        document.querySelectorAll('.ls-m2o-clear:not([data-bound])').forEach(btn => {
            btn.setAttribute('data-bound', '1');
            btn.addEventListener('click', (ev) => {
                ev.preventDefault();
                const refWidget = btn.closest('.ls-reference-widget');
                const isReference = !!refWidget && !!refWidget.querySelector('.ls-ref-model');
                if (isReference) {
                    const fieldName = refWidget.dataset.field;
                    const curModel = refWidget.querySelector('.ls-ref-model').value;
                    this.updateField(fieldName, curModel ? `${curModel},` : '');
                } else {
                    const fieldName = btn.dataset.field;
                    this.updateField(fieldName, false);
                }
            });
        });

        // Dropdown trigger button
        document.querySelectorAll('.ls-m2o-dropdown-trigger:not([data-bound])').forEach(btn => {
            btn.setAttribute('data-bound', '1');
            btn.addEventListener('click', (ev) => {
                ev.preventDefault();
                const fieldName = btn.dataset.field;
                // Find the associated autocomplete input and trigger focus
                const widget = btn.closest('.ls-m2o-widget');
                const input = widget?.querySelector('.ls-m2o-autocomplete');
                if (input) {
                    input.focus();
                }
            });
        });

        // InlineTreeWidget now handles its own O2M M2O binding internally.
    }

    /** Bind drawing events to signature canvases */
    _bindSignatures() {
        const widgets = document.querySelectorAll('.ls-signature-widget:not([data-bound-widget])');
        widgets.forEach(widgetEl => {
            widgetEl.setAttribute('data-bound-widget', '1');
            const fieldName = widgetEl.dataset.field;
            
            const clearBtn = widgetEl.querySelector('.ls-sig-clear');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    this.updateField(fieldName, false);
                });
            }

            const canvas = widgetEl.querySelector('.ls-sig-canvas');
            if (!canvas) return; // If image is showing, no canvas

            const ctx = canvas.getContext('2d');
            
            let isDrawing = false;
            let lastX = 0;
            let lastY = 0;

            const getPos = (e) => {
                const rect = canvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return {
                    x: (clientX - rect.left) * (canvas.width / rect.width),
                    y: (clientY - rect.top) * (canvas.height / rect.height)
                };
            };

            const startDraw = (e) => {
                isDrawing = true;
                const pos = getPos(e);
                lastX = pos.x;
                lastY = pos.y;
                if(e.type === 'touchstart') e.preventDefault();
            };

            const draw = (e) => {
                if (!isDrawing) return;
                const pos = getPos(e);
                
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(pos.x, pos.y);
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.stroke();
                
                lastX = pos.x;
                lastY = pos.y;
                if(e.type === 'touchmove') e.preventDefault();
            };

            const stopDraw = () => {
                isDrawing = false;
            };

            // Mouse events
            canvas.addEventListener('mousedown', startDraw);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDraw);
            canvas.addEventListener('mouseout', stopDraw);
            
            // Touch events
            canvas.addEventListener('touchstart', startDraw, {passive: false});
            canvas.addEventListener('touchmove', draw, {passive: false});
            canvas.addEventListener('touchend', stopDraw);
            
            const acceptBtn = widgetEl.querySelector('.ls-sig-accept');
            const clearPadBtn = widgetEl.querySelector('.ls-sig-clear-pad');
            
            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => {
                    const dataUrl = canvas.toDataURL('image/png');
                    const base64 = dataUrl.split(',')[1];
                    this.updateField(fieldName, base64);
                });
            }
            if (clearPadBtn) {
                clearPadBtn.addEventListener('click', () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                });
            }
        });
    }

    /** Load relation options for all relational fields */
    async _loadRelOptions() {
        const defs = this._formDef.field_defs || {};
        const promises = [];
        const fieldNames = [];
        const relationCache = {};

        for (const [fname, fdef] of Object.entries(defs)) {
            if ((fdef.type === 'many2one' || fdef.type === 'many2many') && fdef.relation) {
                fieldNames.push(fname);
                if (!relationCache[fdef.relation]) {
                    relationCache[fdef.relation] = RPC.nameSearch(fdef.relation, '', 100).catch(() => []);
                }
                promises.push(relationCache[fdef.relation]);
            }
        }
        const results = await Promise.all(promises);
        const relOpts = {};
        fieldNames.forEach((fn, i) => { relOpts[fn] = results[i] || []; });
        this.state.relOptions = relOpts;
    }

    /** Load field definitions and relation options for one2many child models */
    async _loadChildFieldDefs() {
        const defs = this._formDef.field_defs || {};
        const fieldPromises = [];
        const processListFields = [];

        // Identify all list fields (O2M / M2M)
        for (const [fname, fdef] of Object.entries(defs)) {
            if (fdef.type !== 'one2many' && fdef.type !== 'many2many') continue;
            if (fdef.widget === 'many2many_tags' || fdef.widget === 'many2many_checkboxes') continue;
            if (!fdef.relation) continue;

            processListFields.push({ fname, fdef });
            // Queue fetch if not inline
            if (!fdef.child_field_defs) {
                fieldPromises.push(
                    RPC.fieldsGet(fdef.relation)
                        .then(childFields => { fdef.child_field_defs = childFields; })
                        .catch(e => console.warn('Failed to load child field defs for', fname, e))
                );
            }
        }
        await Promise.all(fieldPromises);

        // Second pass: gather many2one options for all child models
        const relationCache = {};
        const childPromises = [];
        const childOptionMappings = [];

        for (const { fname, fdef } of processListFields) {
            const childFields = fdef.child_field_defs || {};
            this._childFieldDefs[fname] = childFields;
            
            // Assume tree_fields are either from tab config, field config, or all child fields
            let treeFields = fdef.tree_fields;
            if (!treeFields) {
                // Try to find tree_fields from tabs, otherwise fallback to all child fields
                const tab = (this._formDef.tabs || []).find(t => t.field === fname);
                treeFields = tab ? tab.tree_fields : Object.keys(childFields).slice(0, 10);
                fdef.tree_fields = treeFields;
            }

            const o2mRelOpts = { ...this.state.o2mRelOptions };

            for (const tf of (treeFields || [])) {
                const cdef = childFields[tf];
                if (cdef && cdef.type === 'many2one' && cdef.relation) {
                    if (!relationCache[cdef.relation]) {
                        if (o2mRelOpts[tf]) {
                            relationCache[cdef.relation] = Promise.resolve(o2mRelOpts[tf]);
                        } else {
                            relationCache[cdef.relation] = RPC.nameSearch(cdef.relation, '', 100).catch(() => []);
                        }
                    }
                    childPromises.push(relationCache[cdef.relation]);
                    childOptionMappings.push({ fname: tf, promiseIdx: childPromises.length - 1 });
                }
            }
        }

        const childResults = await Promise.all(childPromises);
        const newRelOpts = { ...this.state.o2mRelOptions };
        for (const mapping of childOptionMappings) {
            newRelOpts[mapping.fname] = childResults[mapping.promiseIdx] || [];
        }
        this.state.o2mRelOptions = newRelOpts;
    }

    async loadRecord() {
        this.state.loading = true;
        if (!this.props.recordId || this.props.recordId === 'null') {
            this.state.record = await RPC.defaultGet(this._model);
            if (this.props.actionContext) {
                for (const [k, v] of Object.entries(this.props.actionContext)) {
                    if (k.startsWith('default_')) {
                        const fieldName = k.substring(8);
                        this.state.record[fieldName] = v;
                    }
                }
            }
        } else {
            this.state.record = await RPC.read(this._model, this.props.recordId);
        }
        this.state.loading = false;
        this.state.dirty = false;
    }

    // ── Global Widget Event Handlers ─────────────────
    
    _onWidgetFocusOut(ev) {
        const target = ev.target;
        if (target.closest('.ls-inline-tree')) return; // Ignore events from InlineTreeWidget

        const fieldName = target.getAttribute('data-field');
        if (!fieldName) return;
        
        if (target.isContentEditable) {
            this.updateField(fieldName, target.innerHTML);
        }
    }

    _onWidgetInput(ev) {
        const target = ev.target;
        if (target.closest('.ls-inline-tree')) return; // Ignore events from InlineTreeWidget

        if (!this.state.dirty) {
            this.state.dirty = true;
        }
    }

    _onWidgetChange(ev) {
        const target = ev.target;
        if (target.closest('.ls-inline-tree')) return; // Ignore events from InlineTreeWidget

        // Handle reference model change
        if (target.classList.contains('ls-ref-model')) {
            const widget = target.closest('.ls-reference-widget');
            if (widget) {
                const fieldName = widget.getAttribute('data-field');
                const newModel = target.value;
                if (!newModel) {
                    this.updateField(fieldName, '');
                } else {
                    this.updateField(fieldName, `${newModel},`);
                }
            }
            return;
        }

        // (Removed legacy data-add-tag-select logic since we use M2OAutocomplete now)

        const fieldName = target.getAttribute('data-field');
        if (!fieldName) return;

        if (target.type === 'file') {
            const file = target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64 = e.target.result.split(',')[1];
                    this.updateField(fieldName, base64);
                };
                reader.readAsDataURL(file);
            } else {
                this.updateField(fieldName, null);
            }
            return;
        }

        let value = target.value;
        if (target.type === 'checkbox') value = target.checked;
        if (target.type === 'number') value = target.value === '' ? null : parseFloat(target.value);

        this.updateField(fieldName, value);
    }

    _onWidgetClick(ev) {
        const target = ev.target;
        if (target.closest('.ls-inline-tree')) return; // Ignore events from InlineTreeWidget
        
        // Domain Builder
        if (target.classList.contains('ls-domain-hint') || target.closest('.ls-domain-hint')) {
            const widget = target.closest('.ls-domain-builder');
            if (widget) {
                const fieldName = widget.getAttribute('data-field');
                const val = this.state.record[fieldName] || '[]';
                const model = this.state.record.res_model || this.state.record.model_id || this._model;
                
                window.DomainBuilderDialog.open({
                    domain: val,
                    model: model,
                    onSave: (newDomain) => {
                        this.updateField(fieldName, newDomain);
                        // Also update the input visually
                        const input = widget.querySelector('input');
                        if (input) input.value = newDomain;
                    }
                });
            }
            return;
        }

        // Priority stars
        if (target.classList.contains('ls-priority-star') && target.hasAttribute('data-level')) {
            const fieldName = target.getAttribute('data-field');
            const level = parseInt(target.getAttribute('data-level'));
            const current = Number(this.state.record[fieldName]);
            this.updateField(fieldName, (current === level) ? String(level - 1) : String(level));
        }

        // Favorite toggle widget
        if (target.classList.contains('ls-favorite-widget') || target.closest('.ls-favorite-widget')) {
            const widget = target.classList.contains('ls-favorite-widget') ? target : target.closest('.ls-favorite-widget');
            const fieldName = widget.getAttribute('data-field');
            if (fieldName) {
                const currentVal = !!this.state.record[fieldName];
                const newVal = !currentVal;
                this.updateField(fieldName, newVal);
                widget.setAttribute('data-val', newVal ? '1' : '0');
                if (newVal) {
                    widget.classList.add('active');
                    widget.textContent = '★';
                } else {
                    widget.classList.remove('active');
                    widget.textContent = '☆';
                }
            }
        }

        // Image upload proxy
        if (target.hasAttribute('data-upload') || target.closest('[data-upload]')) {
            ev.preventDefault();
            const btn = target.hasAttribute('data-upload') ? target : target.closest('[data-upload]');
            const fieldName = btn.getAttribute('data-upload');
            const widget = btn.closest('.ls-image-widget, .ls-signature-widget') || btn.parentElement;
            const fileInput = widget ? widget.querySelector(`input[type="file"][data-field="${fieldName}"]`) : null;
            if (fileInput) fileInput.click();
        }

        // Image clear
        if (target.hasAttribute('data-clear-image') || target.closest('[data-clear-image]')) {
            ev.preventDefault();
            const btn = target.hasAttribute('data-clear-image') ? target : target.closest('[data-clear-image]');
            const fieldName = btn.getAttribute('data-clear-image');
            this.updateField(fieldName, false);
            
            // Manually update DOM for string-based widget
            const widget = btn.closest('.ls-image-widget');
            if (widget) {
                const img = widget.querySelector('img.ls-image-preview');
                if (img) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'ls-image-placeholder';
                    placeholder.textContent = '📷';
                    const container = widget.querySelector('.ls-image-container');
                    if (container) {
                        placeholder.style.width = container.style.width;
                        placeholder.style.height = container.style.height;
                        placeholder.style.lineHeight = container.style.height;
                    }
                    img.replaceWith(placeholder);
                }
                btn.style.display = 'none'; // hide the clear button
            }
        }

        // Copy to clipboard
        if (target.hasAttribute('data-copy')) {
            ev.preventDefault();
            const text = target.getAttribute('data-copy');
            navigator.clipboard.writeText(text).then(() => {
                const originalText = target.innerText;
                target.innerText = '✓';
                setTimeout(() => target.innerText = originalText, 1500);
            });
        }



        // Badges selection (click on a badge pill)
        if (target.classList.contains('ls-badges-item') && target.hasAttribute('data-value')) {
            const fieldName = target.getAttribute('data-field');
            const value = target.getAttribute('data-value');
            this.updateField(fieldName, value);
        }

        // Color index selection
        if (target.classList.contains('ls-color-dot') && target.hasAttribute('data-value')) {
            const fieldName = target.getAttribute('data-field');
            const value = target.getAttribute('data-value');
            this.updateField(fieldName, value);
        }

        // Boolean button toggle
        if (target.classList.contains('ls-boolean-btn') && target.hasAttribute('data-field')) {
            const fieldName = target.getAttribute('data-field');
            this.updateField(fieldName, !this.state.record[fieldName]);
        }
        
        // Many2many Checkboxes
        if (target.hasAttribute('data-m2m-id')) {
            const tagId = parseInt(target.getAttribute('data-m2m-id'));
            const widget = target.closest('.ls-m2m-checkboxes-widget');
            if (widget) {
                const fieldName = widget.getAttribute('data-field');
                let current = this.state.record[fieldName] || [];
                if (target.checked) {
                    const opts = this.state.relOptions[fieldName] || [];
                    const opt = opts.find(t => t.id === tagId);
                    if (opt) current.push(opt);
                } else {
                    current = current.filter(t => t.id !== tagId);
                }
                this.state.record[fieldName] = current;
                this.state.dirty = true;
            }
        }
    }

    // ── Debounced field update (300ms delay, used for text inputs) ──
    _debounceTimers = {};
    debouncedUpdate(field, value) {
        if (this._debounceTimers[field]) clearTimeout(this._debounceTimers[field]);
        this._debounceTimers[field] = setTimeout(() => {
            this.updateField(field, value);
            delete this._debounceTimers[field];
        }, 300);
    }
    updateField(field, value) {
        this.state.record[field] = value;
        this.state.dirty = true;
        // Trigger onchange asynchronously (non-blocking)
        this._triggerOnchange(field);
    }

    /** Call the onchange endpoint and apply returned updates */
    async _triggerOnchange(field) {
        try {
            // Build current values snapshot
            const defs = this._formDef.field_defs || {};
            const snapshot = {};
            for (const [fname, fdef] of Object.entries(defs)) {
                if (fdef.type === 'one2many') continue;
                const val = this.state.record[fname];
                if (fdef.type === 'many2one') {
                    snapshot[fname] = Array.isArray(val) ? val[0] : val;
                } else {
                    snapshot[fname] = val ?? null;
                }
            }

            const result = await RPC.onchange(this._model, field, snapshot);
            if (result && result.values) {
                const changed = [];
                for (const [key, val] of Object.entries(result.values)) {
                    // Only apply if value actually changed (avoid loops)
                    const current = this.state.record[key];
                    const currentFlat = Array.isArray(current) ? current[0] : current;
                    const newFlat = Array.isArray(val) ? val[0] : val;
                    if (key !== field && currentFlat !== newFlat) {
                        this.state.record[key] = val;
                        changed.push(key);
                    }
                }
                if (changed.length > 0) {
                    console.log('[Onchange]', field, '→ updated:', changed.join(', '));
                    this._showOnchangeToast(field, changed);
                }
            }
        } catch (e) {
            // Onchange errors are non-fatal
            console.warn('[Onchange] error for field', field, e);
        }
    }

    /** Show a brief toast notification for onchange updates */
    _showOnchangeToast(trigger, updatedFields) {
        const defs = this._formDef.field_defs || {};
        const labels = updatedFields.map(f => defs[f]?.string || f).join(', ');
        const triggerLabel = defs[trigger]?.string || trigger;

        const toast = document.createElement('div');
        toast.className = 'ls-onchange-toast';
        toast.innerHTML = `<span class="ls-onchange-icon">⚡</span> <strong>${triggerLabel}</strong> → updated: ${labels}`;
        document.body.appendChild(toast);
        // Animate in
        requestAnimationFrame(() => toast.classList.add('visible'));
        // Remove after 3s
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ── Dynamic Computed Properties ──────────────────

    /** Statusbar items – works for both selection fields and many2one relations */
    get statusbarStages() {
        const sbField = this._formDef.statusbar;
        if (!sbField) return [];
        const fDef = (this._formDef.field_defs || {})[sbField];
        if (!fDef) return [];

        if (fDef.type === 'selection' && fDef.selection) {
            const selArray = Array.isArray(fDef.selection) ? fDef.selection : Object.entries(fDef.selection);
            return selArray.map((item, idx) => {
                const val = Array.isArray(item) ? item[0] : item.value;
                const label = Array.isArray(item) ? item[1] : item.label;
                return { id: val, name: label, sequence: idx, _isSelection: true };
            });
        }
        // many2one: use loaded relation options or stages prop
        return this.state.relOptions[sbField] || this.props.stages || [];
    }

    /** Detect if statusbar field is a selection type */
    get isStatusbarSelection() {
        const sbField = this._formDef.statusbar;
        if (!sbField) return false;
        const fDef = (this._formDef.field_defs || {})[sbField];
        return fDef?.type === 'selection';
    }

    get titleField() {
        return this._formDef.title_field || null;
    }

    get priorityField() {
        return this._formDef.priority_field || null;
    }

    get headerButtons() {
        return (this._formDef.header_buttons || []).filter(btn => this._evalInvisible(btn));
    }

    get statButtons() {
        return (this._formDef.stat_buttons || []).filter(btn => this._evalInvisible(btn));
    }

    _evalInvisible(btn) {
        if (!btn.invisible) return true;
        // Use the shared attr expression evaluator
        return !this._evalAttrExpr(btn.invisible);
    }

    formatStatValue(fieldName) {
        const val = this.state.record[fieldName] ?? 0;
        const fDef = (this._formDef.field_defs || {})[fieldName];
        if (!fDef) return String(val);

        if (fDef.widget === 'monetary' || fDef.type === 'monetary') {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: window.AdvSoftUser?.company_currency || 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0 // Stat buttons usually look better without decimals
            }).format(val);
        }
        if (fDef.widget === 'integer' || fDef.type === 'integer') {
            return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(val);
        }
        if (fDef.widget === 'float' || fDef.type === 'float') {
            return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
        }
        return String(val);
    }

    get chatterConfig() {
        return this._formDef.chatter || null;
    }

    async onActionClick(btn) {
        if (btn.confirm && !confirm(btn.confirm)) return;

        // Auto-save if dirty before running action
        if (this.state.dirty) {
            await this.saveRecord();
        }

        if (btn.type === 'object') {
            try {
                const res = await window.AdvSoftRPC.call_button(this.props.model, this.props.recordId, btn.name);
                if (res.action) {
                    if (res.action.type === 'ir.actions.client') {
                        if (res.action.tag === 'reload') {
                            await this.loadRecord();
                        } else if (res.action.tag === 'display_notification') {
                            const p = res.action.params || {};
                            this.showToast(`${p.title || 'Notification'}: ${p.message || ''}`);
                            await this.loadRecord();
                        }
                    } else if (res.action.type === 'ir.actions.act_window') {
                        if (window.__doAction) {
                            window.__doAction(res.action);
                        } else {
                            window.location.hash = `#action=window&model=${res.action.res_model}&view_type=${res.action.view_mode.split(',')[0]}`;
                        }
                    } else if (res.action === true) {
                        await this.loadRecord(); // standard boolean return reloads record
                    }
                } else {
                    await this.loadRecord(); // default behavior is reload
                }
            } catch (e) {
                alert(`Action Error: ${e.message}`);
            }
        } else if (btn.type === 'action') {
            // handle action type
            alert('Action type not fully implemented yet');
        }
    }

    // ══ PRINT REPORT ════════════════════════════════
    async _fetchPrintActions() {
        try {
            this.state.printActions = await RPC.getReportActions(this._model) || [];
        } catch(e) { console.error("Failed to load print actions", e); }
    }

    togglePrintMenu() {
        this.state.showPrintMenu = !this.state.showPrintMenu;
    }

    printReport(reportId) {
        if (!this.state.record.id) return;
        window.open('/api/report/pdf/' + reportId + '?ids=' + this.state.record.id, '_blank');
        this.state.showPrintMenu = false;
    }

    get formTabs() {
        const tabs = this._formDef.tabs || [];
        const fdefs = this._formDef.field_defs || {};
        return tabs.map(tab => {
            if (tab.type === 'one2many' || tab.type === 'many2many') {
                const fdef = fdefs[tab.field] || {};
                const childDefs = fdef.child_field_defs || this._childFieldDefs[tab.field] || {};
                return {
                    ...tab,
                    child_model: tab.child_model || fdef.relation,
                    relation: tab.relation || fdef.relation,
                    child_field_defs: childDefs,
                    editable: tab.editable !== undefined ? tab.editable : 'bottom',
                };
            }
            return tab;
        });
    }

    /** Render tab field content using proper widget */
    renderTabField(tab) {
        const defs = this._formDef.field_defs || {};
        const fDef = defs[tab.field];
        if (!fDef) return owl.markup(`<textarea class="ls-description-area" data-field="${tab.field}" placeholder="Add content...">${this.state.record[tab.field] || ''}</textarea>`);
        return window.formHelpers.renderWidget(fDef, this.state.record[tab.field], {});
    }

    /** Process nested groups in a 'group' type tab into renderable field data */
    getTabGroups(tab) {
        if (!tab.groups) return [];
        const defs = this._formDef.field_defs || {};
        const result = [];

        for (const grp of tab.groups) {
            const grpMeta = {
                string: grp.string || null,
                col: grp.col || (grp.columns ? grp.columns.length : 2),
                colspan: grp.colspan || 1,
            };
            const rawColumns = grp.columns || [];
            const columns = [];

            for (const col of rawColumns) {
                const fieldsInCol = [];
                for (const fieldEntry of col) {
                    let fname, fieldMeta;
                    if (typeof fieldEntry === 'string') {
                        fname = fieldEntry;
                        fieldMeta = {};
                    } else {
                        fname = fieldEntry.name;
                        fieldMeta = fieldEntry;
                    }

                    const fDef = defs[fname];
                    if (!fDef) continue;

                    const attrs = fieldMeta.attrs || {};
                    if (attrs.invisible && this._evalAttrExpr(attrs.invisible)) continue;

                    const isReadonly = attrs.readonly ? this._evalAttrExpr(attrs.readonly) : (fieldMeta.readonly || fDef.readonly);
                    const isRequired = attrs.required ? this._evalAttrExpr(attrs.required) : (fieldMeta.required || fDef.required);

                    const effectiveDef = { ...fDef };
                    if (fieldMeta.widget) effectiveDef.widget = fieldMeta.widget;
                    if (fieldMeta.options) effectiveDef.options = { ...(fDef.options || {}), ...fieldMeta.options };

                    const relOptions = this.state.relOptions[fname] || [];
                    const html = window.formHelpers.renderWidget(effectiveDef, this.state.record[fname], {
                        relOptions,
                        readonly: isReadonly,
                        required: isRequired,
                    });

                    // Determine if this is a list widget (one2many or many2many without tags)
                    let component = null;
                    let props = null;
                    const isListWidget = effectiveDef.widget === 'one2many' || effectiveDef.widget === 'many2many' ||
                                        (!effectiveDef.widget && (effectiveDef.type === 'one2many' || effectiveDef.type === 'many2many'));

                    if (isListWidget) {
                        const tabDef = { ...effectiveDef, field: fname };
                        if (effectiveDef.type === 'many2many' && tabDef.add_from_list === undefined) {
                            tabDef.add_from_list = true;
                        }
                        component = window.InlineTreeWidget; // Pass constructor directly for OWL t-component
                        props = {
                            tabDef: tabDef,
                            lines: this.state.record[fname] || [],
                            parentRecord: this.state.record,
                            parentModel: this.props.model || '',
                            relOptions: this.state.o2mRelOptions,
                            onLineAdd: (defaults) => this.addO2mLine(tabDef, defaults),
                            onLineUpdate: (lineId, field, value, writeVal) => this.updateO2mLine(tabDef, lineId, field, value, writeVal),
                            onLineBatchUpdate: (lineId, values) => this.batchUpdateO2mLine(tabDef, lineId, values),
                            onLineDelete: (lineId) => this.deleteO2mLine(tabDef, lineId),
                            onLineLink: (records) => this.linkO2mRecords(tabDef, records)
                        };
                    }

                    fieldsInCol.push({
                        name: fname,
                        label: fieldMeta.label || fieldMeta.string || fDef.string || fname,
                        nolabel: fieldMeta.nolabel || false,
                        colspan: fieldMeta.colspan || 1,
                        html,
                        component: component,
                        props: props,
                        help: fDef.help || '',
                        readonly: isReadonly,
                        required: isRequired,
                    });
                }
                columns.push(fieldsInCol);
            }
            result.push({ ...grpMeta, columns });
        }
        return result;
    }

    get formGroups() {
        if (!this._formDef.groups) return [];
        const groups = [];
        const defs = this._formDef.field_defs || {};

        for (const grp of this._formDef.groups) {
            // New format: { string, col, columns: [[...], [...]] }
            const grpMeta = {
                string: grp.string || null,
                col: grp.col || (grp.columns ? grp.columns.length : 2),
                colspan: grp.colspan || 1,
            };
            const rawColumns = grp.columns || grp; // fallback: legacy format

            const columns = [];
            for (const col of rawColumns) {
                const fieldsInCol = [];
                for (const fieldEntry of col) {
                    // Field can be string or { name, widget, attrs, ... }
                    let fname, fieldMeta;
                    if (typeof fieldEntry === 'string') {
                        fname = fieldEntry;
                        fieldMeta = {};
                    } else {
                        fname = fieldEntry.name;
                        fieldMeta = fieldEntry;
                    }

                    const fDef = defs[fname];
                    if (!fDef) continue;

                    // Evaluate attrs for dynamic visibility/editability
                    const attrs = fieldMeta.attrs || {};
                    if (attrs.invisible && this._evalAttrExpr(attrs.invisible)) continue; // hidden

                    const isReadonly = attrs.readonly ? this._evalAttrExpr(attrs.readonly) : fDef.readonly;
                    const isRequired = attrs.required ? this._evalAttrExpr(attrs.required) : fDef.required;

                    // Widget & options override from view layout
                    const widgetOverride = fieldMeta.widget || null;
                    const optionsOverride = fieldMeta.options || null;
                    const effectiveDef = { ...fDef };
                    if (widgetOverride) effectiveDef.widget = widgetOverride;
                    if (optionsOverride) effectiveDef.options = { ...(fDef.options || {}), ...optionsOverride };

                    const relOptions = this.state.relOptions[fname] || [];
                    const html = window.formHelpers.renderWidget(effectiveDef, this.state.record[fname], {
                        relOptions,
                        readonly: isReadonly,
                        required: isRequired,
                    });

                    // Determine if this is a list widget (one2many or many2many without tags)
                    let component = null;
                    let props = null;
                    const isListWidget = effectiveDef.widget === 'one2many' || effectiveDef.widget === 'many2many' ||
                                        (!effectiveDef.widget && (effectiveDef.type === 'one2many' || effectiveDef.type === 'many2many'));

                    if (effectiveDef.widget === 'many2many_tags') {
                        component = window.Many2manyTagsWidget;
                        props = {
                            tags: this.state.record[fname] || [],
                            relation: effectiveDef.relation || '',
                            name: fname,
                            label: effectiveDef.string || fname,
                            readonly: isReadonly,
                            relOptions: relOptions,
                            options: effectiveDef.options || {},
                            noCreate: (effectiveDef.options || {}).no_create,
                            onAdd: (opt) => {
                                let current = this.state.record[fname] ? [...this.state.record[fname]] : [];
                                const optId = typeof opt === 'object' && opt !== null ? opt.id : opt;
                                if (!current.find(t => (typeof t === 'object' && t !== null ? t.id : t) === optId)) {
                                    current.push(opt);
                                    this.updateField(fname, current);
                                }
                            },
                            onRemove: (tagId) => {
                                const newArr = (this.state.record[fname] || []).filter(t => (typeof t === 'object' && t !== null ? t.id : t) !== tagId);
                                this.updateField(fname, newArr);
                            }
                        };
                    } else if (isListWidget) {
                        const tabDef = { ...effectiveDef, field: fname };
                        if (effectiveDef.type === 'many2many' && tabDef.add_from_list === undefined) {
                            tabDef.add_from_list = true;
                        }
                        component = window.InlineTreeWidget; // Pass constructor directly for OWL t-component
                        props = {
                            tabDef: tabDef,
                            lines: this.state.record[fname] || [],
                            parentRecord: this.state.record,
                            parentModel: this.props.model || '',
                            relOptions: this.state.o2mRelOptions,
                            onLineAdd: (defaults) => this.addO2mLine(tabDef, defaults),
                            onLineUpdate: (lineId, field, value, writeVal) => this.updateO2mLine(tabDef, lineId, field, value, writeVal),
                            onLineBatchUpdate: (lineId, values) => this.batchUpdateO2mLine(tabDef, lineId, values),
                            onLineDelete: (lineId) => this.deleteO2mLine(tabDef, lineId),
                            onLineLink: (records) => this.linkO2mRecords(tabDef, records)
                        };
                    }

                    fieldsInCol.push({
                        name: fname,
                        label: fieldMeta.label || fieldMeta.string || fDef.string || fname,
                        nolabel: fieldMeta.nolabel || false,
                        colspan: fieldMeta.colspan || 1,
                        html: html,
                        component: component,
                        props: props,
                        help: fDef.help || '',
                        readonly: isReadonly,
                        required: isRequired,
                    });
                }
                columns.push(fieldsInCol);
            }
            groups.push({ ...grpMeta, columns });
        }
        return groups;
    }

    /**
     * Evaluate an attr domain expression against the current record.
     * E.g. "progress >= 100" → true/false
     */
    _evalAttrExpr(expr) {
        if (!expr) return false;
        if (typeof expr === 'boolean') return expr;
        try {
            const rec = this.state.record;
            const parts = String(expr)
                .replace(/ and /g, ' && ').replace(/ or /g, ' || ')
                .replace(/!=/g, '!==')
                .replace(/([^!><])={1}(?!=)/g, '$1===')
                .replace(/False/g, 'false').replace(/True/g, 'true');
            const fields = Object.keys(rec);
            const vals = fields.map(f => {
                const v = rec[f];
                return Array.isArray(v) ? v[0] : v;
            });
            const fn = new Function(...fields, `return !!(${parts});`);
            return fn(...vals);
        } catch { return false; }
    }

    // ── Status Bar logic ─────────────────────────────
    setStage(stageId) {
        const sbField = this._formDef.statusbar;
        if (!sbField) return;

        if (this.isStatusbarSelection) {
            // Selection field: value is the string key
            this.state.record[sbField] = stageId;
        } else {
            // Many2one: value is [id, name]
            const stage = this.statusbarStages.find(s => s.id === stageId);
            this.state.record[sbField] = stage ? [stage.id, stage.name] : this.state.record[sbField];
        }
        this.state.dirty = true;
    }

    isStageCompleted(stg) {
        const sbField = this._formDef.statusbar;
        if (!sbField || !this.state.record[sbField]) return false;

        if (this.isStatusbarSelection) {
            const stages = this.statusbarStages;
            const curIdx = stages.findIndex(s => s.id === this.state.record[sbField]);
            const stgIdx = stages.findIndex(s => s.id === stg.id);
            return stgIdx < curIdx;
        }
        // Many2one
        const currentStage = this.statusbarStages.find(s => s.id === this.state.record[sbField]?.[0]);
        if (!currentStage) return false;
        return stg.sequence < currentStage.sequence;
    }

    isStageActive(stg) {
        const sbField = this._formDef.statusbar;
        if (!sbField) return false;
        if (this.isStatusbarSelection) {
            return this.state.record[sbField] === stg.id;
        }
        return Array.isArray(this.state.record[sbField]) && this.state.record[sbField][0] === stg.id;
    }

    setPriority(level) {
        if (!this.priorityField) return;
        const current = Number(this.state.record[this.priorityField]);
        this.state.record[this.priorityField] = (current === level) ? String(level - 1) : String(level);
        this.state.dirty = true;
    }

    // ── One2many Dynamic Logic ───────────────────────
    
    getFieldLabel(fieldName) {
        // First check child field defs, then parent field defs
        for (const childDefs of Object.values(this._childFieldDefs)) {
            if (childDefs[fieldName]) return childDefs[fieldName].string || fieldName;
        }
        return (this._formDef.field_defs || {})[fieldName]?.string || fieldName;
    }
    
    /** Get the child field definition for a given tree field */
    getChildFieldDef(tabField, fieldName) {
        const childDefs = this._childFieldDefs[tabField] || {};
        return childDefs[fieldName] || null;
    }

    /** Check if a field in the one2many tree is a many2one relation */
    isO2mFieldMany2one(tabField, fieldName) {
        const cdef = this.getChildFieldDef(tabField, fieldName);
        return cdef && cdef.type === 'many2one';
    }

    /** Get relation options for a child many2one field */
    getO2mRelOptions(fieldName) {
        return this.state.o2mRelOptions[fieldName] || [];
    }

    /** Get display name for a many2one value in one2many context */
    getO2mM2oDisplayId(line, fieldName) {
        const val = line[fieldName];
        if (Array.isArray(val)) return val[0];
        return val || '';
    }
    
    getO2mInputType(fieldName) {
        // Check child field definitions first for accurate type detection
        for (const childDefs of Object.values(this._childFieldDefs)) {
            const cdef = childDefs[fieldName];
            if (cdef) {
                if (cdef.type === 'many2one') return 'many2one';
                if (cdef.type === 'date') return 'date';
                if (cdef.type === 'datetime') return 'datetime-local';
                if (cdef.type === 'float' || cdef.type === 'integer' || cdef.type === 'monetary') return 'number';
                if (cdef.type === 'boolean') return 'checkbox';
                return 'text';
            }
        }
        // Fallback to name-based heuristics
        if (fieldName === 'date' || fieldName.endsWith('_date')) return 'date';
        if (fieldName.includes('hours') || fieldName.includes('qty') || fieldName.includes('amount') || fieldName === 'progress') return 'number';
        return 'text';
    }
    
    getO2mStep(fieldName) {
        // Check child field definitions for digits precision
        for (const childDefs of Object.values(this._childFieldDefs)) {
            const cdef = childDefs[fieldName];
            if (cdef && cdef.digits) {
                return String(Math.pow(10, -(cdef.digits[1] || 2)));
            }
        }
        if (fieldName.includes('hours') || fieldName.includes('amount')) return '0.01';
        if (fieldName.includes('qty')) return '1';
        return '';
    }

    computeO2mSum(tab) {
        const lines = this.state.record[tab.field] || [];
        return lines.reduce((s, l) => {
            let val = l[tab.sum_field];
            // Handle many2one values [id, name]
            if (Array.isArray(val)) val = val[0];
            return s + (parseFloat(val) || 0);
        }, 0).toFixed(1);
    }

    // ── Generic O2M CRUD (used by InlineTreeWidget) ──
    // Debounced writes + rollback on error + write_date echo for concurrency

    _o2mDebounceTimers = new Map();

    async addO2mLine(tab, defaults) {
        const childModel = tab.child_model || (this._formDef.field_defs?.[tab.field]?.relation);
        if (!childModel) return null;

        // Force save parent if it is new, because createChild requires a parent ID in this architecture
        if (!this.state.record.id || this.state.record.id === 'null') {
            if (window.AdvSoftToast) window.AdvSoftToast.info('Auto-saving record to attach lines...');
            await this.saveRecord();
            if (!this.state.record.id || this.state.record.id === 'null') {
                if (window.AdvSoftToast) window.AdvSoftToast.error('Please complete required fields first.');
                return null; // Could not save parent
            }
        }

        // Always inject the parent ID into defaults using the inverse field
        const fdef = this._formDef.field_defs?.[tab.field];
        const inverseField = tab.inverse_field || (fdef ? fdef.inverse_field : null);
        if (inverseField && this.state.record.id && this.state.record.id !== 'null') {
            defaults[inverseField] = this.state.record.id;
        }

        try {
            const result = await RPC.createChild(this._model, tab.field, defaults, tab.context || null);
            const ts = result.record || result;
            if (!this.state.record[tab.field]) this.state.record[tab.field] = [];
            this.state.record[tab.field] = [...this.state.record[tab.field], ts];
            this.state.dirty = true;
            return ts;
        } catch (e) {
            if (window.AdvSoftToast) window.AdvSoftToast.error('Add line failed: ' + e.message);
            return null;
        }
    }

    updateO2mLine(tab, lineId, field, value, writeVal) {
        const childModel = tab.child_model || (this._formDef.field_defs?.[tab.field]?.relation);
        if (!childModel) return;

        const lines = this.state.record[tab.field] || [];
        const numId = typeof lineId === 'string' ? parseInt(lineId) : lineId;
        const line = lines.find(l => l.id === numId || l.id === lineId || l.__temp_id === lineId);
        if (!line) return;

        const oldValue = line[field];
        // Update local state optimistically
        line[field] = value;
        this.state.dirty = true;
        this.state.record[tab.field] = [...lines];

        // Debounce the actual RPC write
        const key = `${tab.field}:${line.id || lineId}:${field}`;
        const existing = this._o2mDebounceTimers.get(key);
        if (existing) clearTimeout(existing.timer);

        const execute = async () => {
            try {
                const result = await RPC.updateChild(
                    childModel, line.id,
                    { [field]: writeVal !== undefined ? writeVal : value },
                    line.write_date || null
                );
                if (result && result.write_date) {
                    line.write_date = result.write_date;
                }
                if (window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('ls-o2m-saved', { detail: { lineId: line.id || lineId } }));
                }
            } catch (e) {
                // Rollback on error
                line[field] = oldValue;
                this.state.record[tab.field] = [...lines];
                if (window.AdvSoftToast) window.AdvSoftToast.error(`Update ${field} failed: ${e.message}`);
            } finally {
                this._o2mDebounceTimers.delete(key);
            }
        };

        this._o2mDebounceTimers.set(key, {
            timer: setTimeout(execute, 250),
            execute: execute
        });
    }

    /**
     * Batch update a line — multiple fields persisted in ONE RPC call.
     * Used by InlineTree onchange when a single field-change cascades into multiple field updates.
     * Avoids the N×debounced writes pattern that the per-field updateO2mLine would produce.
     */
    batchUpdateO2mLine(tab, lineId, values) {
        const childModel = tab.child_model || (this._formDef.field_defs?.[tab.field]?.relation);
        if (!childModel) return;

        const lines = this.state.record[tab.field] || [];
        const numId = typeof lineId === 'string' ? parseInt(lineId) : lineId;
        const line = lines.find(l => l.id === numId || l.id === lineId || l.__temp_id === lineId);
        if (!line) return;

        // Snapshot old values for rollback
        const oldValues = {};
        Object.keys(values).forEach(k => { oldValues[k] = line[k]; });

        // Optimistic local update
        Object.assign(line, values);
        this.state.dirty = true;
        this.state.record[tab.field] = [...lines];

        // Build write payload: m2o tuples → scalar id
        const writeValues = {};
        Object.entries(values).forEach(([k, v]) => {
            writeValues[k] = Array.isArray(v) ? v[0] : v;
        });

        // Cancel any pending per-field debounced writes for the same fields
        Object.keys(values).forEach(field => {
            const key = `${tab.field}:${line.id || lineId}:${field}`;
            const existing = this._o2mDebounceTimers.get(key);
            if (existing) { clearTimeout(existing.timer); this._o2mDebounceTimers.delete(key); }
        });

        if (!line.id) return; // temp row — wait until create

        RPC.updateChild(childModel, line.id, writeValues, line.write_date || null)
            .then(result => {
                if (result && result.write_date) line.write_date = result.write_date;
                if (window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('ls-o2m-saved', { detail: { lineId: line.id || lineId } }));
                }
            })
            .catch(e => {
                Object.assign(line, oldValues);
                this.state.record[tab.field] = [...lines];
                if (window.AdvSoftToast) window.AdvSoftToast.error(`Batch update failed: ${e.message}`);
            });
    }

    async deleteO2mLine(tab, lineId) {
        const childModel = tab.child_model || (this._formDef.field_defs?.[tab.field]?.relation);
        if (!childModel) return;

        const numId = typeof lineId === 'string' ? parseInt(lineId) : lineId;
        try {
            if (tab.type === 'many2many') {
                // Just remove from local state
                this.state.record[tab.field] = (this.state.record[tab.field] || []).filter(
                    l => l.id !== numId && l.id !== lineId && l.__temp_id !== lineId
                );
                this.state.dirty = true;
                return;
            }
            await RPC.deleteChild(childModel, numId);
            this.state.record[tab.field] = (this.state.record[tab.field] || []).filter(
                l => l.id !== numId && l.id !== lineId && l.__temp_id !== lineId
            );
        } catch (e) {
            console.warn('Failed to delete O2M line:', e);
        }
    }

    linkO2mRecords(tab, records) {
        if (!this.state.record[tab.field]) this.state.record[tab.field] = [];
        const current = this.state.record[tab.field];
        const existingIds = new Set(current.map(l => l.id));
        for (const r of records) {
            if (!existingIds.has(r.id)) {
                current.push(r);
            }
        }
        this.state.record[tab.field] = [...current];
        this.state.dirty = true;
    }

    // Legacy addTimesheet/updateTimesheet/deleteTimesheet removed — InlineTreeWidget handles its own CRUD.

    // ── Keyboard Shortcuts ───────────────────
    _handleKeyboardShortcuts(ev) {
        // Ignore if typing in input/textarea/contenteditable
        const tag = ev.target.tagName;
        const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || ev.target.isContentEditable;
        const mod = ev.ctrlKey || ev.metaKey;

        // Ctrl+S / Cmd+S = Save
        if (mod && ev.key === 's') {
            ev.preventDefault();
            if (this.state.dirty) this.saveRecord();
            return;
        }
        // Ctrl+Shift+S = Save & Close
        if (mod && ev.shiftKey && ev.key === 'S') {
            ev.preventDefault();
            if (this.state.dirty) {
                this.saveRecord().then(() => {
                    if (this.props.onBack) this.props.onBack();
                });
            }
            return;
        }
        // Escape = Close/Discard (if not in editable field)
        if (ev.key === 'Escape' && !isEditable) {
            if (this.state.dirty) {
                if (confirm('You have unsaved changes. Discard them?')) {
                    this.discardChanges();
                }
            } else if (this.props.onBack) {
                this.props.onBack();
            }
            return;
        }
        // Ctrl+D = Duplicate (if record is saved)
        if (mod && ev.key === 'd' && !isEditable && this.props.recordId > 0) {
            ev.preventDefault();
            this.duplicateRecord();
            return;
        }
        // Ctrl+N = New record
        if (mod && ev.key === 'n' && !isEditable) {
            ev.preventDefault();
            if (this.props.onBack) this.props.onBack();
            return;
        }
        // ← / → arrow keys navigate between records (when not in editable field)
        if (!isEditable && ev.key === 'ArrowLeft' && this.props.recordIndex > 1) {
            ev.preventDefault();
            if (this.props.onNavigate) this.props.onNavigate(this.props.recordIndex - 1);
            return;
        }
        if (!isEditable && ev.key === 'ArrowRight' && this.props.recordIndex < this.props.totalRecords) {
            ev.preventDefault();
            if (this.props.onNavigate) this.props.onNavigate(this.props.recordIndex + 1);
            return;
        }
    }

    // ── Save / Discard ───────────────────────
    async saveRecord() {
        // ── 1. Force-sync RTEs before save ──
        if (this._rteInstances) {
            this._rteInstances.forEach(inst => {
                if (inst.fieldName) this.state.record[inst.fieldName] = inst.getValue();
            });
        }

        // ── 2. Harvest all DOM inputs inside the form sheet directly ──
        const formEl = document.querySelector('.ls-form-sheet') || this.formFieldsRef?.el;
        if (formEl) {
            // Harvest title input
            const titleInput = formEl.querySelector('.ls-form-title-text');
            if (titleInput && this.titleField) {
                this.state.record[this.titleField] = titleInput.value;
            }

            // Harvest standard inputs
            const inputs = formEl.querySelectorAll('input[data-field], textarea[data-field], select[data-field]');
            inputs.forEach(input => {
                if (input.closest('.ls-inline-tree')) return;
                const fieldName = input.getAttribute('data-field');
                if (!fieldName) return;

                if (input.type === 'checkbox') {
                    this.state.record[fieldName] = input.checked;
                } else if (input.type === 'number') {
                    this.state.record[fieldName] = input.value === '' ? null : parseFloat(input.value);
                } else if (input.type === 'file') {
                    // Handled by onChange FileReader
                } else if (!input.classList.contains('ls-m2o-autocomplete')) {
                    this.state.record[fieldName] = input.value;
                }
            });
        }

        const rec = this.state.record;
        const fieldDefs = this._formDef.field_defs || {};
        const values = {};

        // ── Client-side required validation (P3 polish) ──
        for (const [fname, fdef] of Object.entries(fieldDefs)) {
            if (!fdef.required || fdef.readonly) continue;
            const v = rec[fname];
            const isEmpty = v === null || v === undefined || v === '' || v === false
                || (Array.isArray(v) && v.length === 0)
                || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);
            if (isEmpty) {
                this._markFieldError(fname, `${fdef.string || fname} is required.`);
                alert(`${fdef.string || fname} is required.`);
                return;
            }
        }

        // ── FLUSH PENDING O2M WRITES BEFORE SAVING PARENT ──
        const pendingO2m = Array.from(this._o2mDebounceTimers.values());
        for (const entry of pendingO2m) {
            clearTimeout(entry.timer);
            await entry.execute();
        }

        for (const [fname, fdef] of Object.entries(fieldDefs)) {
            if (fdef.readonly) continue;
            if (fdef.type === 'many2one') {
                values[fname] = rec[fname] ? (Array.isArray(rec[fname]) ? rec[fname][0] : rec[fname]) : null;
            } else if (fdef.type === 'many2many') {
                values[fname] = (rec[fname] || []).map(t => typeof t === 'object' && t !== null ? t.id : t);
            } else if (fdef.type === 'one2many') {
                continue;
            } else if (fdef.type === 'reference') {
                if (Array.isArray(rec[fname])) {
                    values[fname] = rec[fname][1] ? `${rec[fname][0]},${rec[fname][1]}` : null;
                } else if (typeof rec[fname] === 'string' && rec[fname].endsWith(',')) {
                    values[fname] = null; // No ID selected yet
                } else {
                    values[fname] = rec[fname] || null;
                }
            } else if (fdef.store !== false) {
                values[fname] = rec[fname] ?? null;
            }
        }

        if (!rec.id || rec.id === 'null') {
            const newRec = await RPC.create(this._model, values);
            this.state.dirty = false;
            this.showToast('Record created successfully');
            if (this.props.onSaved) this.props.onSaved(newRec);
            else if (this.props.onNavigate) this.props.onNavigate('form', newRec.id);
        } else {
            await RPC.write(this._model, [rec.id], values);
            this.state.dirty = false;
            this.showToast('Record saved successfully');
            try {
                const refreshed = await RPC.read(this._model, rec.id);
                if (refreshed) {
                    Object.assign(this.state.record, refreshed);
                }
            } catch (e) {
                console.warn('Post-save refresh failed:', e);
            }
            if (this.props.onSaved) this.props.onSaved(this.state.record);
        }
    }

    /** Mark a field visually as having an error (red border) */
    _markFieldError(fieldName, message) {
        const el = this.formFieldsRef.el?.querySelector(`[data-field="${fieldName}"]`);
        if (!el) return;
        el.classList.add('ls-field-error');
        el.setAttribute('title', message);
        setTimeout(() => el.classList.remove('ls-field-error'), 4000);
        el.focus();
    }

    async discardChanges() {
        await this.loadRecord();
    }

    // ── Chatter (oe_chatter) ─────────────────
    toggleChatter() {
        this.state.showComposer = !this.state.showComposer;
        this.state.composerType = 'message';
    }

    logNote() {
        this.state.showComposer = true;
        this.state.composerType = 'note';
    }

    toggleActivities() {
        // Future: open activity scheduling dialog
        alert('Activity scheduling coming soon');
    }

    async sendMessage() {
        const textarea = document.querySelector('.oe_chatter_textarea');
        if (!textarea || !textarea.value.trim()) return;

        const msg = {
            id: Date.now(),
            author: 'Current User',
            date: new Date().toLocaleString(),
            body: textarea.value.trim(),
            type: this.state.composerType,
        };

        this.state.messages = [msg, ...this.state.messages];
        this.state.showComposer = false;
        textarea.value = '';

        // Persist to backend (fire-and-forget)
        try {
            await RPC.call('/api/orm/log_message', {
                model: this._model,
                id: this.state.record.id,
                body: msg.body,
                type: msg.type,
            });
        } catch (e) { console.warn('Message log failed:', e); }
    }

    showToast(text) {
        const toast = document.createElement('div');
        toast.className = 'ls-onchange-toast';
        toast.innerHTML = `<span class="ls-onchange-icon">✓</span> ${text}`;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('visible'));
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ── Navigation ───────────────────────────
    goBack() {
        if (this.state.dirty && !confirm('Discard unsaved changes?')) return;
        this.props.onBack();
    }
    prevRecord() {
        if (this.state.dirty && !confirm('Discard unsaved changes?')) return;
        this.props.onNavigate(-1);
    }
    nextRecord() {
        if (this.state.dirty && !confirm('Discard unsaved changes?')) return;
        this.props.onNavigate(1);
    }

    // ── Image upload validation & drag-drop ───────────
    _bindImageValidation() {
        const inputs = document.querySelectorAll('.ls-image-widget input[type="file"][data-validate="image"]:not([data-bound])');
        inputs.forEach(input => {
            input.setAttribute('data-bound', '1');
            const widget = input.closest('.ls-image-widget');
            const maxSize = parseInt(widget.dataset.maxSize) || (10 * 1024 * 1024);
            const allowedTypes = (widget.dataset.allowedTypes || 'image/png,image/jpeg,image/webp,image/gif')
                .split(',').map(s => s.trim());
            const errBox = widget.querySelector('.ls-image-error');
            
            const handleFile = (file) => {
                if (!file) return;
                if (file.size > maxSize) {
                    const maxMB = (maxSize / 1024 / 1024).toFixed(1);
                    if (errBox) { errBox.textContent = `File too large (max ${maxMB}MB)`; errBox.style.display = 'block'; }
                    input.value = '';
                    return;
                }
                if (!allowedTypes.includes(file.type)) {
                    if (errBox) { errBox.textContent = `Invalid type. Allowed: ${allowedTypes.join(', ')}`; errBox.style.display = 'block'; }
                    input.value = '';
                    return;
                }
                if (errBox) errBox.style.display = 'none';
                
                // Read as base64
                const reader = new FileReader();
                reader.onload = () => {
                    const b64 = reader.result.split(',')[1] || '';
                    this.state.record[input.dataset.field] = b64;
                    this.state.dirty = true;
                    this.updateField(input.dataset.field, b64);
                    
                    // Manually update DOM since string widget doesn't re-render
                    let preview = widget.querySelector('img.ls-image-preview');
                    if (!preview) {
                        preview = document.createElement('img');
                        preview.className = 'ls-image-preview';
                        const container = widget.querySelector('.ls-image-container');
                        if (container) {
                            preview.width = parseInt(container.style.width) || 90;
                            preview.height = parseInt(container.style.height) || 90;
                        }
                        const placeholder = widget.querySelector('.ls-image-placeholder');
                        if (placeholder) placeholder.replaceWith(preview);
                    }
                    preview.src = reader.result;
                    
                    const clearBtn = widget.querySelector('.ls-image-clear-btn');
                    if (clearBtn) clearBtn.style.display = 'flex';
                };
                reader.readAsDataURL(file);
            };

            input.addEventListener('change', (ev) => {
                handleFile(ev.target.files?.[0]);
            });

            // Drag and drop support
            widget.addEventListener('dragover', (ev) => {
                ev.preventDefault();
                widget.classList.add('drag-over');
                widget.style.borderColor = 'var(--ls-primary, #714b67)';
                widget.style.backgroundColor = 'var(--ls-primary-light, #fdf4f9)';
            });
            widget.addEventListener('dragleave', (ev) => {
                ev.preventDefault();
                widget.classList.remove('drag-over');
                widget.style.borderColor = '';
                widget.style.backgroundColor = '';
            });
            widget.addEventListener('drop', (ev) => {
                ev.preventDefault();
                widget.classList.remove('drag-over');
                widget.style.borderColor = '';
                widget.style.backgroundColor = '';
                const file = ev.dataTransfer?.files?.[0];
                if (file) handleFile(file);
            });
        });
    }

    // ── RTE (Rich Text Editor) instances ────────────────
    /**
     * Mount a AdvSoftRTE instance on every [data-rte] mount div
     * that hasn't been mounted yet. The mount div is created by the
     * html widget (W.html in owl-field-widgets.js).
     */
    _bindRTEInstances() {
        if (!window.AdvSoftRTE) return;
        // Garbage-collect instances whose mounts are no longer in the DOM
        this._rteInstances = (this._rteInstances || []).filter(inst => {
            if (!document.body.contains(inst.mountEl)) {
                inst.destroy();
                return false;
            }
            // Sync external value changes if not actively editing
            let extVal = '';
            try { extVal = JSON.parse(inst.mountEl.getAttribute('data-rte-value') || '""'); }
            catch (e) { extVal = inst.mountEl.getAttribute('data-rte-value') || ''; }
            if (extVal !== inst.getValue() && (!inst.contentEl || !inst.contentEl.contains(document.activeElement))) {
                inst.setValue(extVal);
            }
            return true;
        });
        // Mount any new RTE placeholders
        const mounts = document.querySelectorAll('[data-rte="1"]:not([data-rte-mounted])');
        mounts.forEach(mountEl => {
            mountEl.setAttribute('data-rte-mounted', '1');
            const fieldName = mountEl.getAttribute('data-rte-field');
            const modelName = mountEl.getAttribute('data-rte-model') || this._model || '';
            let cfg = {};
            try { cfg = JSON.parse(mountEl.getAttribute('data-rte-config') || '{}'); } catch (e) { cfg = {}; }
            let value = '';
            try { value = JSON.parse(mountEl.getAttribute('data-rte-value') || '""'); }
            catch (e) { value = mountEl.getAttribute('data-rte-value') || ''; }
            const inst = window.AdvSoftRTE.create(mountEl, {
                value,
                model: modelName,
                field: fieldName,
                html: cfg,
                placeholder: cfg.placeholder || mountEl.placeholder || 'Write something…',
                onChange: (html) => {
                    // Push the new value back into the form state
                    if (fieldName) this.updateField(fieldName, html);
                },
            });
            inst.mountEl = mountEl;
            this._rteInstances.push(inst);
        });
    }
}

window.FormView = FormView;
})();
