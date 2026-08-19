// View Builder Component — Odoo Studio-style view configuration
(function(){
const { Component, useState, onMounted, markup } = owl;
const RPC = window.LarasoftRPC;

class ViewBuilderView extends Component {
    static template = window.TEMPLATES.ViewBuilder;
    static props = {};

    setup() {
        this._undoStack = [];
        this._redoStack = [];
        this.state = useState({
            activeTab: 'list',
            models: [],
            selectedModel: '',
            fields: {},
            arch: {},
            selectedField: null,
            selectedGroup: null,
            showXml: false,
            xmlPreview: '',
            formActiveTab: '',
            toast: '',
            toastType: '',
            loading: false,
            fieldSearch: '',
            showCode: false,
            codePreview: '',
        });
        onMounted(() => this.loadModels());
    }

    // ── Tab definitions ────────────────────────────────
    get builderTabs() {
        return [
            { id: 'list', label: 'List builder', icon: 'table' },
            { id: 'form', label: 'Form builder', icon: 'file-text' },
            { id: 'kanban', label: 'Kanban builder', icon: 'columns' },
            { id: 'calendar', label: 'Calendar builder', icon: 'calendar' },
            { id: 'pivot', label: 'Pivot builder', icon: 'grid-3x3' },
            { id: 'spreadsheet', label: 'Spreadsheet builder', icon: 'file-spreadsheet' },
        ];
    }

    // ── Palette items ──────────────────────────────────
    get listComponents() {
        return [
            { id: 'handle', label: 'Handle (drag)', icon: 'grip-vertical', type: 'handle' },
            { id: 'char', label: 'Char / text', icon: 'type', type: 'char' },
            { id: 'many2one', label: 'Many2one', icon: 'link', type: 'many2one' },
            { id: 'date', label: 'Date', icon: 'calendar', type: 'date' },
            { id: 'monetary', label: 'Monetary', icon: 'dollar-sign', type: 'monetary' },
            { id: 'selection', label: 'Selection badge', icon: 'list', type: 'selection' },
            { id: 'boolean', label: 'Boolean toggle', icon: 'toggle-left', type: 'boolean' },
            { id: 'button', label: 'Button', icon: 'square', type: 'button' },
        ];
    }

    get formComponents() {
        return [
            { id: 'group', label: 'Group (2-col)', icon: 'columns', type: 'group' },
            { id: 'tab', label: 'Notebook Tab', icon: 'book-open', type: 'tab' },
            { id: 'separator', label: 'Separator', icon: 'minus', type: 'separator' },
            { id: 'statusbar', label: 'Statusbar', icon: 'git-branch', type: 'statusbar' },
            { id: 'chatter', label: 'Chatter', icon: 'message-circle', type: 'chatter' },
            { id: 'stat_button', label: 'Stat Button', icon: 'bar-chart-2', type: 'stat_button' },
        ];
    }

    get listAttrCards() {
        return [
            { name: 'optional', type: '"show"/"hide"', desc: 'Column can be hidden/shown by user via gear icon.' },
            { name: 'column_invisible', type: 'domain', desc: 'Hide column based on parent context expression.' },
            { name: 'sum / avg / max / min', type: 'string label', desc: 'Show aggregation in footer. String = label text.' },
            { name: 'decoration-danger/warning', type: 'domain expr', desc: 'Color rows based on field condition expression.' },
            { name: 'width', type: 'string "80px"', desc: 'Override column width manually (px or ratio).' },
            { name: 'nolabel', type: 'bool "1"', desc: 'Hide column header label. Useful for handle/button.' },
        ];
    }

    // ── Field getters ──────────────────────────────────
    get availableFields() {
        const fields = this.state.fields;
        let list = Object.values(fields).filter(f => !f.invisible);
        const q = (this.state.fieldSearch || '').trim().toLowerCase();
        if (q) {
            list = list.filter(f => (f.string || '').toLowerCase().includes(q) || (f.name || '').toLowerCase().includes(q) || (f.type || '').toLowerCase().includes(q));
        }
        return list.sort((a, b) => (a.string || '').localeCompare(b.string || ''));
    }

    get groupableFields() {
        return Object.values(this.state.fields).filter(f => f.groupable);
    }

    get numericFields() {
        return Object.values(this.state.fields).filter(f => f.is_numeric);
    }

    get dateFields() {
        return Object.values(this.state.fields).filter(f => f.is_temporal);
    }

    get stringFields() {
        return Object.values(this.state.fields).filter(f => f.is_string || f.type === 'char');
    }

    get m2mFields() {
        return Object.values(this.state.fields).filter(f => f.type === 'many2many');
    }

    get o2mFields() {
        return Object.values(this.state.fields).filter(f => f.type === 'one2many');
    }

    get binaryFields() {
        return Object.values(this.state.fields).filter(f => f.type === 'binary' || f.type === 'image');
    }

    get colorFields() {
        return Object.values(this.state.fields).filter(f => f.widget === 'color_picker' || f.name === 'color');
    }

    get selectionFields() {
        return Object.values(this.state.fields).filter(f => f.type === 'selection');
    }

    get allFields() {
        return Object.values(this.state.fields);
    }

    getFieldLabel(fieldName) {
        const f = this.state.fields[fieldName];
        return f ? (f.string || f.name) : fieldName;
    }

    removeFromArchArray(key, value) {
        if (!this.state.arch[key]) return;
        this.state.arch[key] = this.state.arch[key].filter(v => v !== value);
        this.state.arch = { ...this.state.arch };
    }

    // ── Calendar days generator ─────────────────────────
    get calendarDays() {
        const days = [];
        const today = new Date();
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        const startDay = (first.getDay() + 6) % 7; // Monday=0
        for (let i = 0; i < 35; i++) {
            const d = new Date(first);
            d.setDate(1 - startDay + i);
            days.push({
                num: d.getDate(),
                month: d.getMonth(),
                today: d.toDateString() === today.toDateString(),
                otherMonth: d.getMonth() !== today.getMonth(),
                event: [5, 12, 18, 23, 27].includes(d.getDate()) && d.getMonth() === today.getMonth(),
            });
        }
        return days;
    }

    // ── Data loading ───────────────────────────────────
    async loadModels() {
        try {
            const resp = await fetch('/api/view-builder/models');
            const models = await resp.json();
            this.state.models = models;
        } catch (e) {
            console.error('Failed to load models', e);
        }
    }

    async onModelChange() {
        const model = this.state.selectedModel;
        if (!model) { this.state.fields = {}; return; }
        try {
            this.state.loading = true;
            const data = await RPC.call('/api/view-builder/fields', { model });
            this.state.fields = data.fields || {};
            await this.loadCurrentView();
        } catch (e) {
            this.showToast('Failed to load model fields', 'error');
        } finally {
            this.state.loading = false;
        }
    }

    async loadCurrentView() {
        try {
            const data = await RPC.call('/api/view-builder/load-view', {
                model: this.state.selectedModel,
                type: this.state.activeTab,
            });
            if (data.arch && Object.keys(data.arch).length) {
                this.state.arch = { ...data.arch };
                if (data.arch.tabs && data.arch.tabs.length) {
                    this.state.formActiveTab = data.arch.tabs[0].name || '';
                }
            } else {
                this.initDefaultArch();
            }
        } catch (e) {
            this.initDefaultArch();
        }
    }

    initDefaultArch() {
        const fieldNames = Object.keys(this.state.fields).slice(0, 6);
        const tab = this.state.activeTab;
        if (tab === 'list') {
            this.state.arch = { fields: fieldNames, column_config: {}, decoration: {}, limit: 80 };
        } else if (tab === 'form') {
            const half = Math.ceil(fieldNames.length / 2);
            this.state.arch = {
                string: this.state.selectedModel,
                groups: [{ columns: [fieldNames.slice(0, half), fieldNames.slice(half)] }],
                tabs: [], statusbar: '', header_buttons: [], field_config: {},
            };
        } else if (tab === 'kanban') {
            const gb = this.groupableFields[0];
            this.state.arch = {
                default_group_by: gb?.name || '', quick_create: true,
                card_title: Object.keys(this.state.fields)[0] || 'name',
                card_fields: fieldNames.slice(1, 4), card_tags: '',
                card_image: '', color_field: '', card_footer: ['priority'],
            };
        } else if (tab === 'calendar') {
            const df = this.dateFields[0];
            this.state.arch = {
                date_start: df?.name || '', date_stop: '', color: '',
                mode: 'month', event_display_fields: fieldNames.slice(0, 2),
                quick_create: true, create_name_field: '', date_delay: '',
                color_legend: true,
            };
        } else if (tab === 'pivot') {
            const dims = this.groupableFields.slice(0, 2).map(f => f.name);
            const meas = this.numericFields.slice(0, 2).map(f => f.name);
            this.state.arch = {
                row_groupby: dims.slice(0, 1), col_groupby: dims.slice(1, 2), measures: meas,
            };
        } else if (tab === 'spreadsheet') {
            this.state.arch = {
                fields: fieldNames, column_width: 120, row_height: 28,
                limit: 1000, aggregation: 'sum', readonly: false,
            };
        }
    }

    // ── Field manipulation ─────────────────────────────
    addField(fieldName) {
        const tab = this.state.activeTab;
        if (tab === 'list') {
            if (!this.state.arch.fields) this.state.arch.fields = [];
            if (!this.state.arch.fields.includes(fieldName)) {
                this.state.arch.fields = [...this.state.arch.fields, fieldName];
            }
        } else if (tab === 'kanban') {
            if (!this.state.arch.card_fields) this.state.arch.card_fields = [];
            if (!this.state.arch.card_fields.includes(fieldName)) {
                this.state.arch.card_fields = [...this.state.arch.card_fields, fieldName];
            }
        } else if (tab === 'spreadsheet') {
            if (!this.state.arch.fields) this.state.arch.fields = [];
            if (!this.state.arch.fields.includes(fieldName)) {
                this.state.arch.fields = [...this.state.arch.fields, fieldName];
            }
        } else if (tab === 'calendar') {
            if (!this.state.arch.event_display_fields) this.state.arch.event_display_fields = [];
            if (!this.state.arch.event_display_fields.includes(fieldName)) {
                this.state.arch.event_display_fields = [...this.state.arch.event_display_fields, fieldName];
            }
        } else if (tab === 'form') {
            this.removeSelectedFieldByName(fieldName);

            // If a notebook tab is active and is layout type, add to that tab's groups
            const activeTab = this.state.formActiveTab
                ? (this.state.arch.tabs || []).find(t => t.name === this.state.formActiveTab)
                : null;

            if (activeTab && (!activeTab.type || activeTab.type === 'layout')) {
                // Add to active tab's groups
                if (!activeTab.groups || !activeTab.groups.length) {
                    activeTab.groups = [{ columns: [[], []] }];
                }
                const grp = activeTab.groups[0];
                if (grp.columns && grp.columns.length) {
                    grp.columns[0] = [...grp.columns[0], fieldName];
                }
            } else {
                // Add to main form groups
                if (!this.state.arch.groups || !this.state.arch.groups.length) {
                    this.state.arch.groups = [{ columns: [[], []] }];
                }
                const grp = this.state.arch.groups[0];
                if (grp.columns && grp.columns.length) {
                    grp.columns[0] = [...grp.columns[0], fieldName];
                }
            }
            this.state.arch = { ...this.state.arch };
        }
        this.selectField(fieldName);
    }

    // ── Layout Component click-to-add ─────────────────
    addFormComponent(type) {
        this._pushUndo();
        if (type === 'group') {
            const activeTab = this.state.formActiveTab
                ? (this.state.arch.tabs || []).find(t => t.name === this.state.formActiveTab)
                : null;
            if (activeTab && (!activeTab.type || activeTab.type === 'layout')) {
                activeTab.groups = activeTab.groups || [];
                activeTab.groups.push({ columns: [[], []] });
            } else {
                this.state.arch.groups = this.state.arch.groups || [];
                this.state.arch.groups.push({ columns: [[], []] });
            }
        } else if (type === 'tab') {
            this.state.arch.tabs = this.state.arch.tabs || [];
            const newTab = { name: 'tab_' + Date.now(), label: 'New Tab' };
            this.state.arch.tabs.push(newTab);
            if (this.state.arch.tabs.length === 1) {
                this.state.formActiveTab = newTab.name;
            }
        } else if (type === 'separator') {
            this.state.arch.groups = this.state.arch.groups || [];
            this.state.arch.groups.push({ columns: [['separator_' + Date.now()], []] });
        } else if (type === 'statusbar') {
            this.state.arch.statusbar = this.state.arch.statusbar || '1';
        } else if (type === 'chatter') {
            this.state.arch.chatter = true;
        } else if (type === 'stat_button') {
            this.state.arch.stat_buttons = this.state.arch.stat_buttons || [];
            this.state.arch.stat_buttons.push({ name: 'stat_' + Date.now() });
        }
        this.state.arch = { ...this.state.arch };
    }

    selectField(fieldName) {
        this.state.selectedField = fieldName;
        this.state.selectedTab = null;
        this.state.selectedGroup = null;
    }

    removeSelectedField() {
        const fn = this.state.selectedField;
        if (!fn) return;
        if (this.state.activeTab === 'list' && this.state.arch.fields) {
            this.state.arch.fields = this.state.arch.fields.filter(f => f !== fn);
            if (this.state.arch.column_config) delete this.state.arch.column_config[fn];
        }
        if (this.state.activeTab === 'spreadsheet' && this.state.arch.fields) {
            this.state.arch.fields = this.state.arch.fields.filter(f => f !== fn);
        }
        if (this.state.activeTab === 'kanban' && this.state.arch.card_fields) {
            this.state.arch.card_fields = this.state.arch.card_fields.filter(f => f !== fn);
        }
        if (this.state.activeTab === 'form') {
            let removed = false;
            if (this.state.arch.groups) {
                for (let g = 0; g < this.state.arch.groups.length; g++) {
                    const grp = this.state.arch.groups[g];
                    for (let c = 0; c < (grp.columns || []).length; c++) {
                        const col = grp.columns[c];
                        const idx = col.findIndex(f => (typeof f === 'string' ? f : f.name) === fn);
                        if (idx !== -1) {
                            col.splice(idx, 1);
                            removed = true;
                        }
                    }
                }
            }
            if (this.state.arch.tabs) {
                for (let t = 0; t < this.state.arch.tabs.length; t++) {
                    const tab = this.state.arch.tabs[t];
                    if (tab.groups) {
                        for (let g = 0; g < tab.groups.length; g++) {
                            const grp = tab.groups[g];
                            for (let c = 0; c < (grp.columns || []).length; c++) {
                                const col = grp.columns[c];
                                const idx = col.findIndex(f => (typeof f === 'string' ? f : f.name) === fn);
                                if (idx !== -1) {
                                    col.splice(idx, 1);
                                    removed = true;
                                }
                            }
                        }
                    }
                }
            }
            if (removed) this.state.arch = { ...this.state.arch };
        }
        this.state.selectedField = null;
    }

    setColumnConfig(fieldName, key, value) {
        if (!this.state.arch.column_config) this.state.arch.column_config = {};
        if (!this.state.arch.column_config[fieldName]) this.state.arch.column_config[fieldName] = {};
        if (key === '_agg') {
            delete this.state.arch.column_config[fieldName].sum;
            delete this.state.arch.column_config[fieldName].avg;
            delete this.state.arch.column_config[fieldName].max;
            delete this.state.arch.column_config[fieldName].min;
            if (value) this.state.arch.column_config[fieldName][value] = 'Total';
        } else {
            if (value) {
                this.state.arch.column_config[fieldName][key] = value;
            } else {
                delete this.state.arch.column_config[fieldName][key];
            }
        }
        this.state.arch = { ...this.state.arch };
    }

    addToArchArray(key, value) {
        if (!value) return;
        if (!this.state.arch[key]) this.state.arch[key] = [];
        if (!this.state.arch[key].includes(value)) {
            this.state.arch[key] = [...this.state.arch[key], value];
        }
    }

    // ── Undo / Redo ────────────────────────────────────
    _pushUndo() {
        this._undoStack.push(JSON.stringify(this.state.arch));
        if (this._undoStack.length > 50) this._undoStack.shift();
        this._redoStack = [];
    }
    undo() {
        if (!this._undoStack.length) return;
        this._redoStack.push(JSON.stringify(this.state.arch));
        this.state.arch = JSON.parse(this._undoStack.pop());
    }
    redo() {
        if (!this._redoStack.length) return;
        this._undoStack.push(JSON.stringify(this.state.arch));
        this.state.arch = JSON.parse(this._redoStack.pop());
    }

    // ── Drag & Drop Handlers ───────────────────────────
    onPaletteDrag(ev, component) {
        ev.dataTransfer.setData('text/plain', JSON.stringify(component));
        ev.dataTransfer.effectAllowed = 'copy';
        ev.currentTarget.classList.add('ls-vb-dragging');
    }
    onPaletteDragEnd(ev) {
        ev.currentTarget.classList.remove('ls-vb-dragging');
    }

    onFieldPaletteDrag(ev, fieldName) {
        ev.dataTransfer.setData('text/plain', JSON.stringify({ type: 'field', name: fieldName }));
        ev.dataTransfer.effectAllowed = 'copy';
        ev.currentTarget.classList.add('ls-vb-dragging');
    }
    onFieldPaletteDragEnd(ev) {
        ev.currentTarget.classList.remove('ls-vb-dragging');
    }

    onDragOver(ev) {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'copy';
        const el = ev.currentTarget;
        if (el && el.classList) {
            el.classList.add('drag-over');
        }
    }

    onDragLeave(ev) {
        const el = ev.currentTarget;
        if (el && el.classList) {
            el.classList.remove('drag-over');
        }
    }

    onFormFieldDrag(ev, fldName, grpIdx, colIdx, fldIdx) {
        ev.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'move_field', name: fldName, grpIdx, colIdx, fldIdx
        }));
        ev.dataTransfer.effectAllowed = 'move';
        ev.currentTarget.classList.add('ls-vb-dragging');
    }
    onFormFieldDragEnd(ev) {
        ev.currentTarget.classList.remove('ls-vb-dragging');
    }

    onFormFieldDragTab(ev, tabName, fieldName, grpIdx, colIdx, fldIdx) {
        ev.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'move_field_tab', name: fieldName, tabName, grpIdx, colIdx, fldIdx
        }));
        ev.dataTransfer.effectAllowed = 'move';
        ev.currentTarget.classList.add('ls-vb-dragging');
    }

    onDropFormCol(ev, grpIndex, colIndex, targetFldIndex = null) {
        ev.preventDefault();
        ev.stopPropagation();
        this.onDragLeave(ev);
        const dataStr = ev.dataTransfer.getData('text/plain');
        if (!dataStr) return;
        try {
            const data = JSON.parse(dataStr);
            if (data.type === 'move_field') {
                // Intra/inter-column move: remove from source first, then insert at target
                this._pushUndo();
                this._removeFieldAt(data.grpIdx, data.colIdx, data.fldIdx);
                // Adjust target index if moving within same column
                let adjIdx = targetFldIndex;
                if (grpIndex === data.grpIdx && colIndex === data.colIdx && adjIdx !== null && data.fldIdx < adjIdx) {
                    adjIdx--;
                }
                this._insertFieldAt(data.name, grpIndex, colIndex, adjIdx);
                this.state.arch = { ...this.state.arch };
                this.selectField(data.name);
                return;
            }
            const fieldName = data.name;
            if (fieldName) {
                this._pushUndo();
                this.addFieldToFormCol(fieldName, grpIndex, colIndex, targetFldIndex);
            }
        } catch(e) {}
    }

    onDropFormTabCol(ev, tabName, grpIndex, colIndex, targetFldIndex = null) {
        ev.preventDefault();
        ev.stopPropagation();
        this.onDragLeave(ev);
        const dataStr = ev.dataTransfer.getData('text/plain');
        if (!dataStr) return;
        try {
            const data = JSON.parse(dataStr);
            const fieldName = data.name || (data.type === 'field' ? data.name : null);
            if (fieldName) {
                this.addFieldToFormTabCol(fieldName, tabName, grpIndex, colIndex, targetFldIndex);
            }
        } catch(e) {}
    }

    onDropFormLayout(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this.onDragLeave(ev);
        const dataStr = ev.dataTransfer.getData('text/plain');
        if (!dataStr) return;
        try {
            const data = JSON.parse(dataStr);
            if (data.type === 'group') {
                this.state.arch.groups = this.state.arch.groups || [];
                this.state.arch.groups.push({ columns: [[], []] });
                this.state.arch = { ...this.state.arch };
            } else if (data.type === 'tab') {
                this.state.arch.tabs = this.state.arch.tabs || [];
                const newTabName = 'new_tab_' + Date.now();
                this.state.arch.tabs.push({ name: newTabName, label: 'New Tab' });
                if (this.state.arch.tabs.length === 1) {
                    this.state.formActiveTab = newTabName;
                }
                this.state.arch = { ...this.state.arch };
                if (this.state.arch.tabs.length === 1) {
                    this.state.formActiveTab = this.state.arch.tabs[0].name;
                }
            } else if (data.type === 'statusbar') {
                this.state.arch.statusbar = '1';
                this.state.arch = { ...this.state.arch };
            } else if (data.type === 'chatter') {
                this.state.arch.chatter = '1';
                this.state.arch = { ...this.state.arch };
            } else if (data.type === 'stat_button') {
                this.state.arch.stat_buttons = this.state.arch.stat_buttons || [];
                this.state.arch.stat_buttons.push({ name: 'stat_' + Date.now() });
                this.state.arch = { ...this.state.arch };
            } else if (data.type === 'separator') {
                this.state.arch.groups = this.state.arch.groups || [];
                this.state.arch.groups.push({ columns: [['separator_' + Date.now()], []] });
                this.state.arch = { ...this.state.arch };
            } else if (data.type === 'field' || (data.name && !data.id)) {
                this.state.arch.groups = this.state.arch.groups || [];
                this.state.arch.groups.push({ columns: [[data.name], []] });
                this.removeSelectedFieldByName(data.name);
                this.selectField(data.name);
                this.state.arch = { ...this.state.arch };
            }
        } catch(e) {}
    }

    removeStatButton(index) {
        if (!this.state.arch.stat_buttons) return;
        this.state.arch.stat_buttons.splice(index, 1);
        this.state.arch = { ...this.state.arch };
    }

    onDropFormTabLayout(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this.onDragLeave(ev);
        if (!this.state.formActiveTab) return;
        const tab = this.state.arch.tabs.find(t => t.name === this.state.formActiveTab);
        if (!tab) return;
        
        const dataStr = ev.dataTransfer.getData('text/plain');
        if (!dataStr) return;
        try {
            const data = JSON.parse(dataStr);
            if (data.type === 'group') {
                tab.groups = tab.groups || [];
                tab.groups.push({ columns: [[], []] });
                this.state.arch = { ...this.state.arch };
            } else if (data.type === 'field' || (data.name && !data.id)) {
                tab.groups = tab.groups || [];
                tab.groups.push({ columns: [[data.name], []] });
                this.removeSelectedFieldByName(data.name);
                this.selectField(data.name);
                this.state.arch = { ...this.state.arch };
            } else if (data.type === 'tab') {
                this.state.arch.tabs = this.state.arch.tabs || [];
                const newTabName = 'new_tab_' + Date.now();
                this.state.arch.tabs.push({ name: newTabName, label: 'New Tab' });
                this.state.formActiveTab = newTabName;
                this.state.arch = { ...this.state.arch };
            }
        } catch(e) {}
    }

    _removeFieldAt(grpIdx, colIdx, fldIdx) {
        if (this.state.arch.groups && this.state.arch.groups[grpIdx]) {
            const col = this.state.arch.groups[grpIdx].columns?.[colIdx];
            if (col && fldIdx >= 0 && fldIdx < col.length) col.splice(fldIdx, 1);
        }
    }
    _insertFieldAt(fieldName, grpIdx, colIdx, fldIdx) {
        if (this.state.arch.groups && this.state.arch.groups[grpIdx]) {
            const col = this.state.arch.groups[grpIdx].columns?.[colIdx];
            if (col) {
                if (fldIdx !== null && fldIdx >= 0) col.splice(fldIdx, 0, fieldName);
                else col.push(fieldName);
            }
        }
    }

    addFieldToFormCol(fieldName, grpIndex, colIndex, targetFldIndex = null) {
        this.removeSelectedFieldByName(fieldName);
        
        if (this.state.arch.groups && this.state.arch.groups[grpIndex]) {
            const grp = this.state.arch.groups[grpIndex];
            if (grp.columns && grp.columns[colIndex]) {
                if (targetFldIndex !== null && targetFldIndex >= 0) {
                    grp.columns[colIndex].splice(targetFldIndex, 0, fieldName);
                } else {
                    grp.columns[colIndex].push(fieldName);
                }
                this.state.arch = { ...this.state.arch };
            }
        }
        this.selectField(fieldName);
    }

    addFieldToFormTabCol(fieldName, tabName, grpIndex, colIndex, targetFldIndex = null) {
        this.removeSelectedFieldByName(fieldName);
        
        if (this.state.arch.tabs) {
            const tab = this.state.arch.tabs.find(t => t.name === tabName);
            if (tab && tab.groups && tab.groups[grpIndex]) {
                const grp = tab.groups[grpIndex];
                if (grp.columns && grp.columns[colIndex]) {
                    if (targetFldIndex !== null && targetFldIndex >= 0) {
                        grp.columns[colIndex].splice(targetFldIndex, 0, fieldName);
                    } else {
                        grp.columns[colIndex].push(fieldName);
                    }
                    this.state.arch = { ...this.state.arch };
                }
            }
        }
        this.selectField(fieldName);
    }

    removeSelectedFieldByName(fn) {
        if (this.state.activeTab === 'form') {
            if (this.state.arch.groups) {
                for (let g = 0; g < this.state.arch.groups.length; g++) {
                    const grp = this.state.arch.groups[g];
                    for (let c = 0; c < (grp.columns || []).length; c++) {
                        const col = grp.columns[c];
                        const idx = col.findIndex(f => (typeof f === 'string' ? f : f.name) === fn);
                        if (idx !== -1) col.splice(idx, 1);
                    }
                }
            }
            if (this.state.arch.tabs) {
                for (let t = 0; t < this.state.arch.tabs.length; t++) {
                    const tab = this.state.arch.tabs[t];
                    if (tab.groups) {
                        for (let g = 0; g < tab.groups.length; g++) {
                            const grp = tab.groups[g];
                            for (let c = 0; c < (grp.columns || []).length; c++) {
                                const col = grp.columns[c];
                                const idx = col.findIndex(f => (typeof f === 'string' ? f : f.name) === fn);
                                if (idx !== -1) col.splice(idx, 1);
                            }
                        }
                    }
                }
            }
        }
    }

    // ── Form Layout Controls ───────────────────────────
    selectTab(index) {
        this.state.selectedTab = index;
        this.state.selectedField = null;
        this.state.selectedGroup = null;
        if (this.state.arch.tabs[index]) {
            this.state.formActiveTab = this.state.arch.tabs[index].name;
        }
    }

    selectGroup(index) {
        this.state.selectedGroup = index;
        this.state.selectedField = null;
        this.state.selectedTab = null;
    }

    moveTab(index, dir) {
        if (!this.state.arch.tabs) return;
        const target = index + dir;
        if (target < 0 || target >= this.state.arch.tabs.length) return;
        const tabs = this.state.arch.tabs;
        const temp = tabs[index];
        tabs[index] = tabs[target];
        tabs[target] = temp;
        this.state.selectedTab = target;
        this.state.arch = { ...this.state.arch };
    }

    removeTab(index) {
        if (!this.state.arch.tabs) return;
        this.state.arch.tabs.splice(index, 1);
        this.state.selectedTab = null;
        this.state.arch = { ...this.state.arch };
    }

    setGroupColumns(grpIndex, colCount) {
        colCount = parseInt(colCount) || 2;
        this._pushUndo();
        const grp = this.state.arch.groups?.[grpIndex];
        if (!grp) return;
        const current = grp.columns || [];
        while (current.length < colCount) current.push([]);
        while (current.length > colCount) {
            const removed = current.pop();
            if (removed.length && current.length > 0) current[current.length - 1].push(...removed);
        }
        grp.columns = current;
        this.state.arch = { ...this.state.arch };
    }

    moveGroup(index, dir) {
        if (!this.state.arch.groups) return;
        const target = index + dir;
        if (target < 0 || target >= this.state.arch.groups.length) return;
        this._pushUndo();
        const groups = this.state.arch.groups;
        const temp = groups[index];
        groups[index] = groups[target];
        groups[target] = temp;
        this.state.arch = { ...this.state.arch };
    }

    removeGroup(index) {
        if (!this.state.arch.groups) return;
        if (confirm("Remove this group and all its fields?")) {
            this.state.arch.groups.splice(index, 1);
            this.state.arch = { ...this.state.arch };
        }
    }

    moveTabGroup(tabName, index, dir) {
        const tab = (this.state.arch.tabs || []).find(t => t.name === tabName);
        if (!tab || !tab.groups) return;
        const target = index + dir;
        if (target < 0 || target >= tab.groups.length) return;
        const temp = tab.groups[index];
        tab.groups[index] = tab.groups[target];
        tab.groups[target] = temp;
        this.state.arch = { ...this.state.arch };
    }

    removeTabGroup(tabName, index) {
        const tab = (this.state.arch.tabs || []).find(t => t.name === tabName);
        if (!tab || !tab.groups) return;
        if (confirm("Remove this group and all its fields?")) {
            tab.groups.splice(index, 1);
            this.state.arch = { ...this.state.arch };
        }
    }

    // ── Tab Type Management ───────────────────────────
    setTabType(index, type) {
        const tab = this.state.arch.tabs[index];
        if (!tab) return;
        tab.type = type;
        if (type === 'one2many') {
            tab.field = tab.field || '';
            tab.editable = tab.editable || 'bottom';
            tab.tree_fields = tab.tree_fields || [];
            delete tab.groups;
        } else if (type === 'field') {
            tab.field = tab.field || '';
            delete tab.groups;
            delete tab.tree_fields;
            delete tab.editable;
        } else {
            // layout (default)
            tab.groups = tab.groups || [];
            delete tab.field;
            delete tab.tree_fields;
            delete tab.editable;
            delete tab.type;
        }
        this.state.arch = { ...this.state.arch };
    }

    setTabField(index, fieldName) {
        const tab = this.state.arch.tabs[index];
        if (!tab) return;
        tab.field = fieldName;
        // Auto-populate tree_fields for one2many from child model if empty
        if (tab.type === 'one2many' && (!tab.tree_fields || tab.tree_fields.length === 0)) {
            const f = this.state.fields[fieldName];
            if (f && f.relation_fields) {
                tab.tree_fields = Object.keys(f.relation_fields).slice(0, 5);
            }
        }
        this.state.arch = { ...this.state.arch };
    }

    addTabTreeField(index, fieldName) {
        const tab = this.state.arch.tabs[index];
        if (!tab || !fieldName) return;
        if (!tab.tree_fields) tab.tree_fields = [];
        if (!tab.tree_fields.includes(fieldName)) {
            tab.tree_fields.push(fieldName);
            this.state.arch = { ...this.state.arch };
        }
    }

    removeTabTreeField(index, fieldIndex) {
        const tab = this.state.arch.tabs[index];
        if (!tab || !tab.tree_fields) return;
        tab.tree_fields.splice(fieldIndex, 1);
        this.state.arch = { ...this.state.arch };
    }

    getTabChildFields(tabIndex) {
        const tab = this.state.arch.tabs?.[tabIndex];
        if (!tab || !tab.field) return [];
        const f = this.state.fields[tab.field];
        if (!f || !f.relation_fields) return [];
        return Object.entries(f.relation_fields).map(([name, meta]) => ({
            name,
            string: meta.string || name,
            type: meta.type || 'char',
        }));
    }

    // ── Form Field Config ──────────────────────────────
    get widgetOptions() {
        if (!this.state.selectedField) return [['', 'Default']];
        const type = this.fieldType(this.state.selectedField);
        const map = {
            char: [['','Default'],['email','Email'],['phone','Phone'],['url','URL'],['image','Image'],['color','Color Picker']],
            text: [['','Default'],['html','Rich Text (HTML)']],
            integer: [['','Default'],['progressbar','Progress Bar'],['handle','Drag Handle']],
            float: [['','Default'],['float_time','Duration (H:M)'],['progressbar','Progress Bar'],['percentage','Percentage']],
            monetary: [['','Default (Monetary)']],
            boolean: [['','Default (Checkbox)'],['toggle','Toggle Switch']],
            date: [['','Default'],['remaining_days','Remaining Days']],
            datetime: [['','Default'],['remaining_days','Remaining Days']],
            selection: [['','Default'],['badge','Badge'],['radio','Radio'],['priority','Priority Stars'],['statusbar','Status Bar']],
            many2one: [['','Default'],['many2one_avatar','Avatar']],
            one2many: [['','Default (Inline List)']],
            many2many: [['','Default'],['many2many_tags','Tags'],['many2many_checkboxes','Checkboxes']],
            html: [['','Default (HTML)']],
        };
        return map[type] || [['','Default']];
    }

    setFormFieldConfig(fieldName, key, value) {
        if (!this.state.arch.field_config) this.state.arch.field_config = {};
        if (!this.state.arch.field_config[fieldName]) this.state.arch.field_config[fieldName] = {};
        if (value === '' || value === false || value === null || value === undefined) {
            delete this.state.arch.field_config[fieldName][key];
            if (Object.keys(this.state.arch.field_config[fieldName]).length === 0) {
                delete this.state.arch.field_config[fieldName];
            }
        } else {
            this.state.arch.field_config[fieldName][key] = value;
        }
        this.state.arch = { ...this.state.arch };
    }

    getFormFieldConfig(fieldName, key) {
        return this.state.arch?.field_config?.[fieldName]?.[key] ?? '';
    }

    setGroupString(grpIndex, value) {
        if (this.state.arch.groups && this.state.arch.groups[grpIndex]) {
            this.state.arch.groups[grpIndex].string = value || null;
            this.state.arch = { ...this.state.arch };
        }
    }

    // ── Helper methods ─────────────────────────────────
    fieldLabel(fieldName) {
        if (fieldName && fieldName.startsWith('separator_')) return 'Separator';
        const f = this.state.fields[fieldName];
        return f?.string || fieldName;
    }

    fieldType(fieldName) {
        if (fieldName && fieldName.startsWith('separator_')) return 'separator';
        return this.state.fields[fieldName]?.type || 'char';
    }

    fieldIcon(type) {
        const map = {
            char: 'type', text: 'align-left', integer: 'hash', float: 'hash',
            monetary: 'dollar-sign', boolean: 'toggle-left', date: 'calendar',
            datetime: 'clock', selection: 'list', many2one: 'link',
            one2many: 'git-branch', many2many: 'tags', html: 'code', separator: 'minus'
        };
        return map[type] || 'box';
    }

    sampleValue(fieldName, rowIndex) {
        if (fieldName && fieldName.startsWith('separator_')) return markup(`<hr style="margin: 4px 0; padding: 0; border: 0; border-top: 2px dashed #d1d5db;"/>`);
        const f = this.state.fields[fieldName];
        if (!f) return fieldName;
        const type = f.type;
        const samples = {
            char: ['Laptop Pro 15', 'Monitor 4K 27"', 'Keyboard Mech', 'Mouse Wireless'],
            text: ['Description...', 'Notes here...', 'Details...', 'Content...'],
            integer: [42, 128, 7, 365],
            float: [24.50, 9.75, 3.25, 1.05],
            monetary: ['Rp 24.000.000', 'Rp 9.000.000', 'Rp 3.750.000', 'Rp 1.050.000'],
            boolean: [true, false, true, false],
            date: ['2026-06-01', '2026-06-15', '2026-07-01', '2026-07-30'],
            datetime: ['2026-06-01 08:00', '2026-06-15 14:30', '2026-07-01 09:00', '2026-07-30 16:00'],
            selection: ['New', 'In Progress', 'Done', 'Cancelled'],
            many2one: ['Project Alpha', 'Beta Corp', 'Gamma Inc', 'Delta LLC'],
            many2many: ['Tag A, Tag B', 'Tag C', 'Tag A, Tag D', 'Tag B, Tag C'],
        };
        const arr = samples[type] || samples.char;
        const idx = ((rowIndex || 1) - 1) % arr.length;
        const val = arr[idx];
        if (type === 'monetary') return val;
        if (type === 'many2one') return markup(`<span class="ls-vb-sample-m2o">${val}</span>`);
        if (type === 'selection') return markup(`<span class="ls-vb-sample-badge">${val}</span>`);
        if (type === 'boolean') return markup(`<span class="ls-vb-sample-check ${val ? 'checked' : ''}"></span>`);
        if (type === 'many2many') return markup(`<span class="ls-vb-sample-tags">${val.split(',').map(t => `<span class="ls-vb-sample-tag">${t.trim()}</span>`).join('')}</span>`);
        return String(val);
    }

    async switchTab(tabId) {
        this.state.activeTab = tabId;
        this.state.selectedField = null;
        this.state.showXml = false;
        if (this.state.selectedModel) {
            await this.loadCurrentView();
        }
    }

    onPaletteDrag(ev, component) {
        ev.dataTransfer.setData('text/plain', JSON.stringify(component));
    }

    // ── XML preview & actions ──────────────────────────
    async viewXml() {
        try {
            const data = await RPC.call('/api/view-builder/preview-xml', {
                type: this.state.activeTab,
                arch: this.state.arch,
            });
            this.state.xmlPreview = data.xml || '';
            this.state.showXml = !this.state.showXml || this.state.xmlPreview;
        } catch (e) {
            this.showToast('Failed to generate XML', 'error');
        }
    }

    copyXml() {
        navigator.clipboard.writeText(this.state.xmlPreview);
        this.showToast('XML copied to clipboard', 'success');
    }

    async resetView() {
        this.initDefaultArch();
        this.state.selectedField = null;
        this.state.showXml = false;
        this.showToast('View reset to defaults', 'success');
    }

    async saveView() {
        if (!this.state.selectedModel) return;
        try {
            await RPC.call('/api/view-builder/save-view', {
                model: this.state.selectedModel,
                type: this.state.activeTab,
                arch: this.state.arch,
            });
            this.showToast('View saved successfully!', 'success');
        } catch (e) {
            this.showToast('Failed to save view: ' + e.message, 'error');
        }
    }

    async exportToCode() {
        if (!this.state.selectedModel) return;
        try {
            const res = await RPC.call('/api/view-builder/export-code', {
                model: this.state.selectedModel,
                type: this.state.activeTab,
                arch: this.state.arch,
            });
            this.state.codePreview = res.code || '// No code generated';
            this.state.showCode = true;
        } catch (e) {
            this.showToast('Failed to export code: ' + e.message, 'error');
        }
    }

    copyCode() {
        if (navigator.clipboard && this.state.codePreview) {
            navigator.clipboard.writeText(this.state.codePreview).then(() => {
                this.showToast('Code copied to clipboard!', 'success');
            });
        }
    }

    showToast(msg, type = '') {
        this.state.toast = msg;
        this.state.toastType = type;
        setTimeout(() => { this.state.toast = ''; }, 3000);
    }
}

window.ViewBuilderView = ViewBuilderView;
})();
