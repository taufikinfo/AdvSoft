const fs = require('fs');
const engineCode = fs.readFileSync('formula-engine.js', 'utf-8');

// Mock window to load the engine
const sandbox = { window: {} };
const fn = new Function('window', engineCode);
fn(sandbox.window);

const { SpreadsheetFormulaEvaluator } = sandbox.window;

const cellData = {
    'A1': { type: sandbox.window.SpreadsheetCellType?.VALUE || 'VALUE', value: 10 },
    'A2': { type: sandbox.window.SpreadsheetCellType?.VALUE || 'VALUE', value: 20 },
};

const evaluator = new SpreadsheetFormulaEvaluator((ref) => {
    return cellData[ref] || { type: 'EMPTY', value: '' };
});

console.log('1+1 ->', evaluator.evaluate('=1+1'));
console.log('SUM(1,2,3) ->', evaluator.evaluate('=SUM(1,2,3)'));
console.log('CONCATENATE ->', evaluator.evaluate('=CONCATENATE("hello ", "world")'));
console.log('= ->', evaluator.evaluate('='));
