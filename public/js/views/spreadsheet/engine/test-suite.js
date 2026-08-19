/**
 * Spreadsheet Engine Test Suite
 * Tests all engine modules for actual functionality
 */
(function() {
    'use strict';

    const results = { pass: 0, fail: 0, errors: [] };

    function assert(condition, msg) {
        if (condition) { results.pass++; }
        else { results.fail++; results.errors.push(msg); }
    }

    function testFormulaEngine() {
        const evaluator = new window.SpreadsheetFormulaEvaluator(
            (ref) => null,
            null
        );

        const tests = [
            { formula: '1+2', expected: 3 },
            { formula: '10-3', expected: 7 },
            { formula: '4*5', expected: 20 },
            { formula: '10/2', expected: 5 },
            { formula: '2^3', expected: 8 },
            { formula: '"Hello"', expected: 'Hello' },
            { formula: 'TRUE', expected: true },
            { formula: 'FALSE', expected: false },
            { formula: 'IF(1>0, "yes", "no")', expected: 'yes' },
            { formula: 'IF(1<0, "yes", "no")', expected: 'no' },
            { formula: 'ABS(-5)', expected: 5 },
            { formula: 'ROUND(3.14159, 2)', expected: 3.14 },
            { formula: 'MIN(3, 1, 2)', expected: 1 },
            { formula: 'MAX(3, 1, 2)', expected: 3 },
            { formula: 'PI()', expected: Math.PI },
            { formula: 'UPPER("hello")', expected: 'HELLO' },
            { formula: 'LOWER("HELLO")', expected: 'hello' },
            { formula: 'LEN("test")', expected: 4 },
            { formula: 'CONCATENATE("a", "b", "c")', expected: 'abc' },
            { formula: 'NOW()', pass: (v) => typeof v === 'string' },
            { formula: 'TODAY()', pass: (v) => typeof v === 'string' },
            { formula: 'INT(3.9)', expected: 3 },
            { formula: 'SQRT(9)', expected: 3 },
            { formula: 'MOD(10, 3)', expected: 1 },
            { formula: 'POWER(2, 10)', expected: 1024 },
            { formula: '1=1', expected: true },
            { formula: '1<>2', expected: true },
            { formula: '1>2', expected: false },
            { formula: '1<2', expected: true },
            { formula: 'AND(TRUE, TRUE)', expected: true },
            { formula: 'OR(TRUE, FALSE)', expected: true },
            { formula: 'NOT(FALSE)', expected: true },
            { formula: 'IFERROR(1/0, "err")', expected: 'err' },
            { formula: 'ISTEXT("hi")', expected: true },
            { formula: 'ISNUMBER(42)', expected: true },
            { formula: 'ISBLANK("")', expected: true },
            { formula: 'VALUE("123")', expected: 123 },
            { formula: 'REPT("x", 3)', expected: 'xxx' },
            { formula: 'LEFT("abc", 2)', expected: 'ab' },
            { formula: 'RIGHT("abc", 2)', expected: 'bc' },
            { formula: 'MID("abc", 2, 1)', expected: 'b' },
            { formula: 'TRIM("  hi  ")', expected: 'hi' },
            { formula: 'FIND("b", "abc")', expected: 2 },
            { formula: 'SIGN(5)', expected: 1 },
            { formula: 'SIGN(-5)', expected: -1 },
            { formula: 'SIGN(0)', expected: 0 },
        ];

        for (const t of tests) {
            try {
                const result = evaluator.evaluate(t.formula);
                if (t.pass) {
                    assert(t.pass(result.value), `PASS(fn): ${t.formula} = ${result.value}`);
                } else {
                    assert(result.value === t.expected, `FAIL: ${t.formula} = ${result.value} (expected ${t.expected})`);
                }
                assert(result.error === null, `ERROR: ${t.formula} -> ${result.error}`);
            } catch (e) {
                results.fail++;
                results.errors.push(`EXCEPTION: ${t.formula} -> ${e.message}`);
            }
        }
    }

    function testCellModel() {
        const cell1 = new window.SpreadsheetCell('', {});
        assert(cell1.type === 'empty', 'Empty cell type');
        assert(cell1.value === null, 'Empty cell value');

        const cell2 = new window.SpreadsheetCell('hello', {});
        assert(cell2.type === 'string', 'String cell type');
        assert(cell2.value === 'hello', 'String cell value');

        const cell3 = new window.SpreadsheetCell('42', {});
        assert(cell3.type === 'number', 'Number cell type');
        assert(cell3.value === 42, 'Number cell value');

        const cell4 = new window.SpreadsheetCell('TRUE', {});
        assert(cell4.type === 'boolean', 'Boolean cell type');
        assert(cell4.value === true, 'Boolean cell value');

        const cell5 = new window.SpreadsheetCell('=SUM(1,2)', {});
        assert(cell5.type === 'formula', 'Formula cell type');
        assert(cell5.formula === 'SUM(1,2)', 'Formula extraction');

        const cell6 = new window.SpreadsheetCell('2026-01-15', {});
        assert(cell6.type === 'date', 'Date cell type');

        const cell7 = new window.SpreadsheetCell('', { bold: true, fontSize: 14 });
        assert(cell7.format.bold === true, 'Cell format bold');
        assert(cell7.format.fontSize === 14, 'Cell format fontSize');
    }

    function testRangeParser() {
        const pos = window.SpreadsheetRange.parseCellRef('A1');
        assert(pos.col === 0 && pos.row === 0, 'A1 -> col=0, row=0');

        const pos2 = window.SpreadsheetRange.parseCellRef('Z10');
        assert(pos2.col === 25 && pos2.row === 9, 'Z10 -> col=25, row=9');

        const pos3 = window.SpreadsheetRange.parseCellRef('AA1');
        assert(pos3.col === 26 && pos3.row === 0, 'AA1 -> col=26, row=0');

        const ref = window.SpreadsheetRange.cellRef(0, 0);
        assert(ref === 'A1', 'cellRef(0,0) -> A1');

        const ref2 = window.SpreadsheetRange.cellRef(25, 9);
        assert(ref2 === 'Z10', 'cellRef(25,9) -> Z10');

        const range = window.SpreadsheetRange.parseRange('A1:C3');
        assert(range.startCol === 0 && range.startRow === 0, 'Range startCol/startRow');
        assert(range.endCol === 2 && range.endRow === 2, 'Range endCol/endRow');

        const expanded = window.SpreadsheetRange.expandRange('A1:B2');
        assert(expanded.length === 4, 'A1:B2 expands to 4 cells');
        assert(expanded.includes('A1') && expanded.includes('B2'), 'Expanded contains A1,B2');

        assert(window.SpreadsheetRange.isCellRef('A1') === true, 'isCellRef A1');
        assert(window.SpreadsheetRange.isRange('A1:C3') === true, 'isRange A1:C3');
        assert(window.SpreadsheetRange.colToLetter(0) === 'A', 'colToLetter(0) = A');
        assert(window.SpreadsheetRange.colToLetter(25) === 'Z', 'colToLetter(25) = Z');
        assert(window.SpreadsheetRange.colToLetter(26) === 'AA', 'colToLetter(26) = AA');
    }

    function testCommandHistory() {
        const history = new window.SpreadsheetCommandHistory(50);
        assert(history.canUndo === false, 'No undo initially');
        assert(history.canRedo === false, 'No redo initially');

        history.push(new window.SpreadsheetCommand('cell_edit', { col: 0, row: 0 }, 'Edit A1'));
        assert(history.canUndo === true, 'Can undo after push');

        const cmd = history.undo();
        assert(cmd.type === 'cell_edit', 'Undo returns correct command');
        assert(history.canRedo === true, 'Can redo after undo');

        const cmd2 = history.redo();
        assert(cmd2.type === 'cell_edit', 'Redo returns correct command');
    }

    function testSpreadsheetModel() {
        const model = new window.SpreadsheetModel({ maxRows: 100, maxCols: 26 });

        model.setCellRaw(0, 0, 'Hello');
        assert(model.getCellRaw(0, 0) === 'Hello', 'Set/Get cell raw');

        model.setCellRaw(1, 0, '42');
        assert(model.getCellValue(1, 0) === 42, 'Cell value as number');

        model.setCellRaw(0, 1, '=SUM(1,2)');
        const val = model.getCellValue(0, 1);
        assert(val === 3, 'Formula evaluation in model');

        model.setCellFormat(0, 0, 'bold', true);
        const fmt = model.getCellFormat(0, 0);
        assert(fmt.bold === true, 'Cell format in model');

        model.deleteCell(0, 0);
        assert(model.getCellRaw(0, 0) === '', 'Delete cell');

        const colW = model.getColWidth(0);
        assert(colW === 100, 'Default col width');

        model.setColWidth(0, 150);
        assert(model.getColWidth(0) === 150, 'Set col width');

        const json = model.toJSON();
        assert(json.sheets !== undefined, 'Model toJSON has sheets');
        assert(json.activeSheetId === 'sheet1', 'Model toJSON has activeSheetId');

        const model2 = new window.SpreadsheetModel();
        model2.fromJSON(json);
        assert(model2.getCellRaw(1, 0) === '42', 'Model fromJSON restores data');
    }

    function testPluginSystem() {
        const registry = new window.SpreadsheetPluginRegistry();
        assert(registry.has('chart') === false, 'Registry empty initially');

        registry.register('testPlugin', class extends window.SpreadsheetCorePlugin {});
        assert(registry.has('testPlugin') === true, 'Plugin registered');

        const model = new window.SpreadsheetModel();
        const instance = registry.create('testPlugin', model);
        assert(instance !== null, 'Plugin instance created');
        assert(instance.uid === 'testPlugin', 'Plugin uid set');
    }

    function testChartPlugin() {
        const model = new window.SpreadsheetModel();
        const registry = new window.SpreadsheetPluginRegistry();
        registry.register('chart', window.SpreadsheetChartPlugin);
        const plugin = registry.create('chart', model);
        plugin.setup();

        const chart = plugin.addChart({
            type: 'bar',
            title: 'Test Chart',
            labelCol: 0,
            dataCols: [1],
        });
        assert(chart.id !== undefined, 'Chart created');
        assert(plugin.getAllCharts().length === 1, 'One chart in registry');

        plugin.removeChart(chart.id);
        assert(plugin.getAllCharts().length === 0, 'Chart removed');
    }

    function testFilterPlugin() {
        const model = new window.SpreadsheetModel();
        model.setCellRaw(0, 0, 'Name');
        model.setCellRaw(0, 1, 'Alice');
        model.setCellRaw(0, 2, 'Bob');
        model.setCellRaw(0, 3, 'Charlie');

        const registry = new window.SpreadsheetPluginRegistry();
        registry.register('filter', window.SpreadsheetFilterPlugin);
        const plugin = registry.create('filter', model);
        plugin.setup();

        plugin.enableAutoFilter();
        assert(plugin.autoFilterEnabled === true, 'Auto-filter enabled');

        const filter = plugin.getFilter(0);
        assert(filter !== null, 'Filter created for col 0');

        plugin.setFilter(0, { values: ['Alice'] });
        assert(plugin.isRowVisible(0) === true, 'Header row visible');
        assert(plugin.isRowVisible(1) === true, 'Alice row visible');
        assert(plugin.isRowVisible(2) === false, 'Bob row hidden');
        assert(plugin.isRowVisible(3) === false, 'Charlie row hidden');

        plugin.disableAutoFilter();
        assert(plugin.autoFilterEnabled === false, 'Auto-filter disabled');
    }

    function testConditionalFormatting() {
        const model = new window.SpreadsheetModel();
        const cf = new window.SpreadsheetConditionalFormattingManager(model);

        const rule = cf.addRule({
            type: window.SpreadsheetCFType.CELL_VALUE,
            ranges: ['A1:A10'],
            comparison: window.SpreadsheetCFComparison.GREATER_THAN,
            value1: 100,
            format: { bgColor: '#ff0000' },
        });
        assert(rule.id !== undefined, 'CF rule created');

        const result = cf.validateCell ? null : rule.evaluate(150);
        assert(result === true, 'CF evaluates 150 > 100');

        const result2 = rule.evaluate(50);
        assert(result2 === false, 'CF evaluates 50 > 100 is false');
    }

    function testDataValidation() {
        const model = new window.SpreadsheetModel();
        const dv = new window.SpreadsheetDataValidationManager(model);

        const validation = dv.addValidation({
            type: window.SpreadsheetValidationType.LIST,
            ranges: ['A1:A10'],
            values: ['Option1', 'Option2', 'Option3'],
        });
        assert(validation.id !== undefined, 'DV created');

        const result1 = validation.validate('Option1');
        assert(result1.valid === true, 'DV accepts Option1');

        const result2 = validation.validate('Invalid');
        assert(result2.valid === false, 'DV rejects Invalid');
    }

    function testFindReplace() {
        const model = new window.SpreadsheetModel();
        model.setCellRaw(0, 0, 'Hello World');
        model.setCellRaw(0, 1, 'Test Hello');
        model.setCellRaw(0, 2, 'No match');

        const fr = new window.SpreadsheetFindReplace(model);
        fr.searchText = 'Hello';
        assert(fr.matchCount === 2, 'Find found 2 matches');
    }

    function testXLSXExport() {
        const model = new window.SpreadsheetModel();
        model.setCellRaw(0, 0, 'Name');
        model.setCellRaw(1, 0, 'Value');
        model.setCellRaw(0, 1, 'Alice');
        model.setCellRaw(1, 1, '100');

        const exporter = new window.SpreadsheetExport(model);
        const csv = exporter._generateCSV();
        assert(csv.includes('Name,Value') || csv.includes('Name'), 'CSV export contains headers');
        assert(csv.includes('Alice'), 'CSV export contains data');
    }

    function testSheetManager() {
        const model = new window.SpreadsheetModel();
        const sm = new window.SpreadsheetSheetManager(model);

        sm.addSheet({ name: 'Sheet2' });
        assert(sm.sheets.length === 2, 'Two sheets after add');

        sm.renameSheet('sheet2', 'Renamed');
        assert(sm.getSheet('sheet2').name === 'Renamed', 'Sheet renamed');

        sm.activateSheet('sheet2');
        assert(sm.activeSheetId === 'sheet2', 'Sheet activated');

        sm.removeSheet('sheet2');
        assert(sm.sheets.length === 1, 'Sheet removed');
    }

    function runAllTests() {
        console.log('=== Spreadsheet Engine Test Suite ===');

        testFormulaEngine();
        testCellModel();
        testRangeParser();
        testCommandHistory();
        testSpreadsheetModel();
        testPluginSystem();
        testChartPlugin();
        testFilterPlugin();
        testConditionalFormatting();
        testDataValidation();
        testFindReplace();
        testXLSXExport();
        testSheetManager();

        console.log(`\n=== Results: ${results.pass} passed, ${results.fail} failed ===`);
        if (results.errors.length > 0) {
            console.log('Errors:', results.errors);
        }
        return results;
    }

    window.SpreadsheetTestSuite = { run: runAllTests, results };
})();
