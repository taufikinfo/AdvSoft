// ══════════════════════════════════════════════════════════════
//  InlineTree — Attribute Expression Evaluator
//  Evaluates Odoo-style attrs expressions safely
//  Supports: 'state != "draft"', 'parent.state == "posted"',
//            'debit > 0 and credit == 0', boolean values
// ══════════════════════════════════════════════════════════════
(function () {

/**
 * Evaluate an Odoo-style expression string against a context object.
 * Supports:
 *   - Python-like `and`, `or`, `not`
 *   - Comparison operators: ==, !=, <, >, <=, >=
 *   - String literals: 'draft', "posted"
 *   - Booleans: True, False
 *   - `parent.field` references (resolved from context.__parent__)
 */
function evalAttrExpr(expr, context) {
    if (expr === true || expr == null) return true;
    if (expr === false) return false;
    if (typeof expr !== 'string') return !!expr;
    if (expr === '') return true;

    const ctx = context || {};

    // Resolve parent.field references: replace 'parent.state' with the actual value
    let safe = expr.replace(/parent\.(\w+)/g, (match, field) => {
        const parentCtx = ctx.__parent__ || ctx;
        const val = parentCtx[field];
        if (val === undefined || val === null) return 'null';
        if (typeof val === 'string') return `"${val}"`;
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        return String(val);
    });

    // Convert Python-isms to JS
    safe = safe
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null')
        .replace(/\band\b/g, '&&')
        .replace(/\bor\b/g, '||')
        .replace(/\bnot\b/g, '!')
        .replace(/!=/g, '!==')
        .replace(/(?<![=!<>])=(?!=)/g, '===');

    const keys = Object.keys(ctx).filter(k => !k.startsWith('__'));
    try {
        return new Function(...keys, `try { return !!(${safe}); } catch(e) { return false; }`)
            (...keys.map(k => ctx[k]));
    } catch (e) {
        console.warn('evalAttrExpr failed:', expr, e);
        return false;
    }
}

/**
 * Compute column-level attrs (invisible, readonly, required) from
 * tree_field_attrs config, evaluated against parentRecord context.
 * 
 * @param {Object} treeAttrsRow - The attrs config for one field (e.g. {readonly: "state != 'draft'"})
 * @param {Object} parentRecord - The parent form record for context resolution
 * @param {Object} lineRecord - Optional: the specific line record for per-row attrs
 */
function computeColumnAttrs(treeAttrsRow, parentRecord, lineRecord) {
    const ctx = { ...(lineRecord || {}), ...(parentRecord || {}), __parent__: parentRecord || {} };
    return {
        invisible: evalAttrExpr(treeAttrsRow.invisible ?? false, ctx),
        readonly:  evalAttrExpr(treeAttrsRow.readonly  ?? false, ctx),
        required:  evalAttrExpr(treeAttrsRow.required  ?? false, ctx),
    };
}

/**
 * Evaluate tab-level dynamic readonly based on parent record state.
 * Used to lock the entire inline tree when parent is in a non-editable state.
 * 
 * @param {Object} tabDef - The tab definition containing optional `readonly_when` expr
 * @param {Object} parentRecord - The parent record
 * @returns {boolean} - Whether the tab should be read-only
 */
function evaluateTabReadonly(tabDef, parentRecord) {
    if (tabDef.read_only) return true;
    const expr = tabDef.readonly_when || null;
    if (!expr) return false;
    const ctx = { ...(parentRecord || {}), __parent__: parentRecord || {} };
    return evalAttrExpr(expr, ctx);
}

window.InlineTreeAttrs = {
    evalAttrExpr,
    computeColumnAttrs,
    evaluateTabReadonly,
};
})();
