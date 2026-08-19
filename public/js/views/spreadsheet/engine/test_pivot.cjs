const fs = require('fs');

// Mock window
const sandbox = { window: {} };

const loadModule = (filename) => {
    const code = fs.readFileSync(filename, 'utf-8');
    const fn = new Function('window', code);
    fn(sandbox.window);
};

// Load dependencies
loadModule('plugin-system.js');
loadModule('formula-engine.js');
loadModule('pivot-plugin.js');

const { SpreadsheetPluginRegistry, SpreadsheetFormulaEvaluator, SpreadsheetPivotPlugin } = sandbox.window;

// Initialize Registry
const registry = new SpreadsheetPluginRegistry();
registry.register('pivot', SpreadsheetPivotPlugin);

// Create plugin instance
const pivotPlugin = registry.create('pivot', {});
pivotPlugin.setup();

// Add a mock pivot
pivotPlugin.addPivot({
    id: 'pivot_1',
    model: 'sale.order',
    groupBy: ['month'],
    measures: [{ field: 'amount_total', aggregator: 'sum' }]
});

// Mock the loaded data
pivotPlugin._data.set('pivot_1', [
    { month: 'Januari', amount_total: 1000 },
    { month: 'Januari', amount_total: 500 },
    { month: 'Februari', amount_total: 2000 }
]);
pivotPlugin._computeAggregations('pivot_1');

// Create Evaluator
const evaluator = new SpreadsheetFormulaEvaluator((ref) => {
    return { type: 'EMPTY', value: '' }; // Not testing cell refs
});

// Test Pivot Formula
console.log('--- TEST PIVOT FORMULAS ---');

// Grand Total
let res = evaluator.evaluate('PIVOT("pivot_1", "amount_total")');
console.log('Grand Total amount_total:', res.value);

// Group Total: Januari
res = evaluator.evaluate('PIVOT("pivot_1", "amount_total", "Januari")');
console.log('Total amount_total (Januari):', res.value);

// Group Total: Februari
res = evaluator.evaluate('PIVOT("pivot_1", "amount_total", "Februari")');
console.log('Total amount_total (Februari):', res.value);

// Header index 0
res = evaluator.evaluate('PIVOT.HEADER("pivot_1", 0)');
console.log('Header 0:', res.value);
