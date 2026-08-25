// ══════════════════════════════════════════════════════════════
//  InlineTree — Column Resolver
//  Resolves tabDef → visibleColumns with attrs/aggregation/width
// ══════════════════════════════════════════════════════════════
(function () {

function humanize(name) {
    return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function pickAggregation(cc) {
    for (const agg of ['sum', 'avg', 'max', 'min']) {
        if (cc[agg]) return { type: agg, label: cc[agg] };
    }
    return null;
}

function loadUserHidden(fieldName) {
    try {
        const raw = localStorage.getItem('ls-it-hidden:' + fieldName);
        return new Set(raw ? JSON.parse(raw) : []);
    } catch (e) { return new Set(); }
}

function saveUserHidden(fieldName, set) {
    try {
        localStorage.setItem('ls-it-hidden:' + fieldName, JSON.stringify([...set]));
    } catch (e) {}
}

function loadUserWidths(fieldName) {
    try {
        const raw = localStorage.getItem('ls-it-width:' + fieldName);
        return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
}

function saveUserWidths(fieldName, widths) {
    try {
        localStorage.setItem('ls-it-width:' + fieldName, JSON.stringify(widths));
    } catch (e) {}
}

function loadUserOrder(fieldName, defaultOrder) {
    try {
        const raw = localStorage.getItem('ls-it-order:' + fieldName);
        return raw ? JSON.parse(raw) : defaultOrder;
    } catch (e) { return defaultOrder; }
}

function saveUserOrder(fieldName, order) {
    try {
        localStorage.setItem('ls-it-order:' + fieldName, JSON.stringify(order));
    } catch (e) {}
}

function resolveColumns(tabDef, parentRecord) {
    const defs = tabDef.child_field_defs || {};
    const config = tabDef.tree_column_config || {};
    const staticHidden = new Set(tabDef.column_invisible || []);
    const optionalHide = new Set(tabDef.optional_hide || []);
    const userHidden = loadUserHidden(tabDef.field);
    const treeAttrs = tabDef.tree_field_attrs || {};
    let order = loadUserOrder(tabDef.field, tabDef.tree_fields || []);
    if ((!order || !order.length) && Object.keys(defs).length) {
        order = Object.keys(defs).filter(k => !k.startsWith('_') && k !== 'id');
    }
    if ((!order || !order.length) && (!Object.keys(defs).length)) {
        order = ['name'];
    }
    const userWidths = loadUserWidths(tabDef.field);

    const columns = [];
    for (const fname of order) {
        if (staticHidden.has(fname)) continue;
        if (optionalHide.has(fname) && userHidden.has(fname)) continue;

        const fdef = defs[fname] || { string: humanize(fname), type: 'char' };

        const cc = config[fname] || {};
        const fa = treeAttrs[fname] || {};

        const attrs = window.InlineTreeAttrs && window.InlineTreeAttrs.computeColumnAttrs
            ? window.InlineTreeAttrs.computeColumnAttrs(fa, parentRecord)
            : { invisible: false, readonly: fa.readonly || false, required: fa.required || false };
        if (attrs.invisible) continue;

        // User-resized width takes precedence over config width
        const persistedWidth = userWidths[fname] || null;

        columns.push({
            name: fname,
            label: cc.label || fdef.string || humanize(fname),
            type: fdef.type,
            widget: cc.widget || fdef.widget || null,
            readonly: attrs.readonly || fa.readonly || fdef.readonly || false,
            required: attrs.required || fa.required || fdef.required || false,
            width: persistedWidth || cc.width || null,
            selection: fdef.selection || [],
            relation: fdef.relation || null,
            digits: fdef.digits || null,
            currency_symbol: fdef.currency_symbol || '$',
            currency_field: fdef.currency_field || null,
            aggregation: pickAggregation(cc),
            options: { ...(fdef.options || {}), ...(cc.options || {}) },
            optional: optionalHide.has(fname),
            invisible: attrs.invisible,
            // sortable: enabled unless explicitly disabled in config or field def
            sortable: cc.sortable !== false && fdef.sortable !== false,
            help: cc.help || fdef.help || null,
            // model_label for M2O picker dialog title
            model_label: fdef.relation ? (tabDef.child_field_defs?.[fname]?.string || '') : null,
        });
    }
    return columns;
}

window.InlineTreeColumns = {
    resolve: resolveColumns,
    loadUserHidden, saveUserHidden,
    loadUserWidths, saveUserWidths,
    loadUserOrder, saveUserOrder,
    pickAggregation, humanize,
};
})();
