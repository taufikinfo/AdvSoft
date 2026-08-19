/**
 * Node.js test runner for spreadsheet engine modules
 * Run: node test-runner.cjs
 */

const fs = require('fs');
const path = require('path');

const engineDir = __dirname;

const files = [
    'cell-model.js',
    'range-parser.js',
    'formula-engine.js',
    'command-history.js',
    'spreadsheet-model.js',
];

global.window = {};
global.window.SpreadsheetCellType = null;
global.window.SpreadsheetCell = null;
global.window.SpreadsheetRange = null;
global.window.SpreadsheetCommandHistory = null;
global.window.SpreadsheetCommand = null;
global.window.SpreadsheetCommandType = null;
global.window.SpreadsheetModel = null;
global.window.SpreadsheetFormulaEvaluator = null;
global.window.SpreadsheetFormulaFunctions = null;
global.window.NamedRangeStore = null;
global.window.SelectionZone = null;
global.window.DEFAULT_CELL_FORMAT = null;

for (const file of files) {
    const code = fs.readFileSync(path.join(engineDir, file), 'utf8');
    try {
        eval(code);
        console.log(`✓ Loaded: ${file}`);
    } catch (e) {
        console.error(`✗ Failed to load ${file}: ${e.message}`);
    }
}

let pass = 0;
let fail = 0;
const errors = [];

function assert(cond, msg) {
    if (cond) { pass++; }
    else { fail++; errors.push(msg); }
}

console.log('\n=== Cell Model Tests ===');

const c1 = new window.SpreadsheetCell('', {});
assert(c1.type === 'empty', 'Empty cell type');
assert(c1.value === null, 'Empty cell value');

const c2 = new window.SpreadsheetCell('hello', {});
assert(c2.type === 'string', 'String cell type');
assert(c2.value === 'hello', 'String cell value');

const c3 = new window.SpreadsheetCell('42', {});
assert(c3.type === 'number', 'Number cell type');
assert(c3.value === 42, 'Number cell value');

const c4 = new window.SpreadsheetCell('TRUE', {});
assert(c4.type === 'boolean', 'Boolean cell type');
assert(c4.value === true, 'Boolean cell value');

const c5 = new window.SpreadsheetCell('=SUM(1,2)', {});
assert(c5.type === 'formula', 'Formula cell type');
assert(c5.formula === 'SUM(1,2)', 'Formula extraction');

const c6 = new window.SpreadsheetCell('2026-01-15', {});
assert(c6.type === 'date', 'Date cell type');

const c7 = new window.SpreadsheetCell('', { bold: true, fontSize: 14 });
assert(c7.format.bold === true, 'Cell format bold');
assert(c7.format.fontSize === 14, 'Cell format fontSize');

console.log(`  Cell Model: ${pass} passed, ${fail} failed`);

console.log('\n=== Range Parser Tests ===');

const pos1 = window.SpreadsheetRange.parseCellRef('A1');
assert(pos1.col === 0 && pos1.row === 0, 'A1 -> col=0, row=0');

const pos2 = window.SpreadsheetRange.parseCellRef('Z10');
assert(pos2.col === 25 && pos2.row === 9, 'Z10 -> col=25, row=9');

const pos3 = window.SpreadsheetRange.parseCellRef('AA1');
assert(pos3.col === 26 && pos3.row === 0, 'AA1 -> col=26, row=0');

const ref1 = window.SpreadsheetRange.cellRef(0, 0);
assert(ref1 === 'A1', 'cellRef(0,0) = A1');

const ref2 = window.SpreadsheetRange.cellRef(25, 9);
assert(ref2 === 'Z10', 'cellRef(25,9) = Z10');

const range1 = window.SpreadsheetRange.parseRange('A1:C3');
assert(range1.startCol === 0 && range1.startRow === 0, 'Range start');
assert(range1.endCol === 2 && range1.endRow === 2, 'Range end');

const expanded = window.SpreadsheetRange.expandRange('A1:B2');
assert(expanded.length === 4, 'A1:B2 expands to 4 cells');

assert(window.SpreadsheetRange.colToLetter(0) === 'A', 'colToLetter(0) = A');
assert(window.SpreadsheetRange.colToLetter(25) === 'Z', 'colToLetter(25) = Z');
assert(window.SpreadsheetRange.colToLetter(26) === 'AA', 'colToLetter(26) = AA');

console.log(`  Range Parser: ${pass} passed, ${fail} failed`);

console.log('\n=== Command History Tests ===');

const history = new window.SpreadsheetCommandHistory(50);
assert(history.canUndo === false, 'No undo initially');
assert(history.canRedo === false, 'No redo initially');

history.push(new window.SpreadsheetCommand('cell_edit', { col: 0, row: 0 }, 'Edit A1'));
assert(history.canUndo === true, 'Can undo after push');

const cmd1 = history.undo();
assert(cmd1.type === 'cell_edit', 'Undo returns correct command');
assert(history.canRedo === true, 'Can redo after undo');

const cmd2 = history.redo();
assert(cmd2.type === 'cell_edit', 'Redo returns correct command');

console.log(`  Command History: ${pass} passed, ${fail} failed`);

console.log('\n=== Formula Engine Tests ===');

const evaluator = new window.SpreadsheetFormulaEvaluator((ref) => null, null);

const formulaTests = [
    ['1+2', 3],
    ['10-3', 7],
    ['4*5', 20],
    ['10/2', 5],
    ['2^3', 8],
    ['IF(1>0, "yes", "no")', 'yes'],
    ['IF(1<0, "yes", "no")', 'no'],
    ['ABS(-5)', 5],
    ['ROUND(3.14159, 2)', 3.14],
    ['MIN(3, 1, 2)', 1],
    ['MAX(3, 1, 2)', 3],
    ['UPPER("hello")', 'HELLO'],
    ['LOWER("HELLO")', 'hello'],
    ['LEN("test")', 4],
    ['CONCATENATE("a", "b", "c")', 'abc'],
    ['INT(3.9)', 3],
    ['SQRT(9)', 3],
    ['MOD(10, 3)', 1],
    ['POWER(2, 10)', 1024],
    ['1=1', true],
    ['1<>2', true],
    ['AND(TRUE, TRUE)', true],
    ['OR(TRUE, FALSE)', true],
    ['NOT(FALSE)', true],
    ['ISTEXT("hi")', true],
    ['ISNUMBER(42)', true],
    ['VALUE("123")', 123],
    ['REPT("x", 3)', 'xxx'],
    ['LEFT("abc", 2)', 'ab'],
    ['RIGHT("abc", 2)', 'bc'],
    ['MID("abc", 2, 1)', 'b'],
    ['TRIM("  hi  ")', 'hi'],
    ['FIND("b", "abc")', 2],
    ['SIGN(5)', 1],
    ['SIGN(-5)', -1],
    ['SIGN(0)', 0],
];

for (const [formula, expected] of formulaTests) {
    try {
        const result = evaluator.evaluate(formula);
        assert(result.value === expected, `FAIL: ${formula} = ${result.value} (expected ${expected})`);
    } catch (e) {
        fail++;
        errors.push(`EXCEPTION: ${formula} -> ${e.message}`);
    }
}

console.log(`  Formula Engine: ${pass} passed, ${fail} failed`);

console.log('\n=== Spreadsheet Model Tests ===');

const model = new window.SpreadsheetModel({ maxRows: 100, maxCols: 26 });

model.setCellRaw(0, 0, 'Hello');
assert(model.getCellRaw(0, 0) === 'Hello', 'Set/Get cell raw');

model.setCellRaw(1, 0, '42');
assert(model.getCellValue(1, 0) === 42, 'Cell value as number');

model.setCellRaw(0, 1, '=SUM(1,2)');
const sumVal = model.getCellValue(0, 1);
assert(sumVal === 3, 'Formula evaluation in model');

model.setCellFormat(0, 0, 'bold', true);
const fmt = model.getCellFormat(0, 0);
assert(fmt.bold === true, 'Cell format in model');

model.deleteCell(0, 0);
assert(model.getCellRaw(0, 0) === '', 'Delete cell');

assert(model.getColWidth(0) === 100, 'Default col width');

model.setColWidth(0, 150);
assert(model.getColWidth(0) === 150, 'Set col width');

const json = model.toJSON();
assert(json.sheets !== undefined, 'Model toJSON has sheets');
assert(json.activeSheetId === 'sheet1', 'Model toJSON activeSheetId');

const model2 = new window.SpreadsheetModel();
model2.fromJSON(json);
assert(model2.getCellRaw(1, 0) === '42', 'Model fromJSON restores data');

console.log(`  Spreadsheet Model: ${pass} passed, ${fail} failed`);

console.log('\n========================================');
console.log(`TOTAL: ${pass} passed, ${fail} failed`);
if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log('  -', e));
}
process.exit(fail > 0 ? 1 : 0);
