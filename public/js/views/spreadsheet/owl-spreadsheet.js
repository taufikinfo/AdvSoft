// ══════════════════════════════════════════════════════════════════
//  SpreadsheetView — Odoo o-spreadsheet style
//  Features: Menu bar, Toolbar, Formulas, Cell editing, Charts,
//  Conditional formatting, Merge cells, Hyperlinks, Export CSV/XLSX,
//  Multiple sheets, Column resize, Context menu, Copy/Paste,
//  Undo/Redo, Sort, Column/Row ops, Freeze panes, Aggregation
// ══════════════════════════════════════════════════════════════════
(function () {
    const { Component, useState, onWillStart, onMounted, onWillUnmount, xml, useRef } = owl;
    const RPC = window.AdvSoftRPC;

    function esc(v) { return v == null ? '' : String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

    function colLetter(idx) {
        let s = ''; let n = idx;
        while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; }
        return s;
    }
    function colIndex(letter) {
        let n = 0;
        for (let i = 0; i < letter.length; i++) { n = n * 26 + (letter.charCodeAt(i) - 64); }
        return n - 1;
    }

    // ── Formula evaluator ──────────────────────────────────────────
    function evaluateFormula(formula, cellGetter, visited = new Set()) {
        if (!formula || typeof formula !== 'string' || !formula.startsWith('=')) return formula;

        if (window.SpreadsheetFormulaEvaluator && window.SpreadsheetCellType) {
            try {
                const evaluator = new window.SpreadsheetFormulaEvaluator((ref) => {
                    const val = cellGetter(ref, visited);
                    if (val === undefined || val === null || val === '') {
                        return { type: window.SpreadsheetCellType.EMPTY, value: '' };
                    }
                    if (typeof val === 'string' && val.startsWith('=')) {
                        return { type: window.SpreadsheetCellType.FORMULA, formula: val };
                    }
                    return { type: window.SpreadsheetCellType.VALUE, value: val };
                });
                const result = evaluator.evaluate(formula);
                return result.error ? result.error : result.value;
            } catch (e) {
                return '#ERROR!';
            }
        }

        const expr = formula.substring(1).trim().toUpperCase();
        if (visited.has(expr)) return '#CIRCULAR!';
        visited.add(expr);
        try {
            const sumMatch = expr.match(/^SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);
            if (sumMatch) {
                const [, c1, r1, c2, r2] = sumMatch; let sum = 0;
                for (let r = parseInt(r1); r <= parseInt(r2); r++) {
                    for (let ci = colIndex(c1); ci <= colIndex(c2); ci++) {
                        const val = cellGetter(colLetter(ci) + r, visited);
                        if (typeof val === 'number') sum += val;
                        else if (!isNaN(parseFloat(val))) sum += parseFloat(val);
                    }
                }
                return Math.round(sum * 100) / 100;
            }
            const avgMatch = expr.match(/^(?:AVG|AVERAGE)\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);
            if (avgMatch) {
                const [, c1, r1, c2, r2] = avgMatch; let sum = 0, count = 0;
                for (let r = parseInt(r1); r <= parseInt(r2); r++) {
                    for (let ci = colIndex(c1); ci <= colIndex(c2); ci++) {
                        const val = cellGetter(colLetter(ci) + r, visited);
                        if (typeof val === 'number') { sum += val; count++; }
                        else if (!isNaN(parseFloat(val))) { sum += parseFloat(val); count++; }
                    }
                }
                return count > 0 ? Math.round((sum / count) * 100) / 100 : 0;
            }
            const countMatch = expr.match(/^COUNT\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);
            if (countMatch) {
                const [, c1, r1, c2, r2] = countMatch; let count = 0;
                for (let r = parseInt(r1); r <= parseInt(r2); r++) {
                    for (let ci = colIndex(c1); ci <= colIndex(c2); ci++) {
                        const val = cellGetter(colLetter(ci) + r, visited);
                        if (val !== '' && val !== null && val !== undefined) count++;
                    }
                }
                return count;
            }
            const minMatch = expr.match(/^MIN\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);
            if (minMatch) {
                const [, c1, r1, c2, r2] = minMatch; let min = Infinity;
                for (let r = parseInt(r1); r <= parseInt(r2); r++) {
                    for (let ci = colIndex(c1); ci <= colIndex(c2); ci++) {
                        const val = cellGetter(colLetter(ci) + r, visited);
                        const num = typeof val === 'number' ? val : parseFloat(val);
                        if (!isNaN(num) && num < min) min = num;
                    }
                }
                return min === Infinity ? 0 : min;
            }
            const maxMatch = expr.match(/^MAX\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);
            if (maxMatch) {
                const [, c1, r1, c2, r2] = maxMatch; let max = -Infinity;
                for (let r = parseInt(r1); r <= parseInt(r2); r++) {
                    for (let ci = colIndex(c1); ci <= colIndex(c2); ci++) {
                        const val = cellGetter(colLetter(ci) + r, visited);
                        const num = typeof val === 'number' ? val : parseFloat(val);
                        if (!isNaN(num) && num > max) max = num;
                    }
                }
                return max === -Infinity ? 0 : max;
            }
            const ifMatch = expr.match(/^IF\((.+),\s*(.+),\s*(.+)\)$/);
            if (ifMatch) {
                const [, cond, trueVal, falseVal] = ifMatch;
                const condResult = evaluateSimpleCondition(cond, cellGetter, visited);
                const result = condResult ? trueVal : falseVal;
                const num = parseFloat(result);
                return isNaN(num) ? result.replace(/"/g, '') : num;
            }
            const cellRefMatch = expr.match(/^([A-Z]+)(\d+)$/);
            if (cellRefMatch) return cellGetter(cellRefMatch[1] + cellRefMatch[2], visited);
            const arithMatch = expr.match(/^([A-Z]+\d+)\s*([+\-*/])\s*([A-Z]+\d+|[\d.]+)$/);
            if (arithMatch) {
                const [, left, op, right] = arithMatch;
                const lVal = parseFloat(cellGetter(left, visited)) || 0;
                const rVal = isNaN(parseFloat(right)) ? (parseFloat(cellGetter(right, visited)) || 0) : parseFloat(right);
                if (op === '+') return lVal + rVal;
                if (op === '-') return lVal - rVal;
                if (op === '*') return lVal * rVal;
                if (op === '/') return rVal !== 0 ? lVal / rVal : '#DIV/0!';
            }
            const numVal = parseFloat(expr);
            if (!isNaN(numVal)) return numVal;
            return formula;
        } catch (e) { return '#ERROR!'; }
    }

    function evaluateSimpleCondition(cond, cellGetter, visited) {
        const m = cond.match(/^([A-Z]+\d+)\s*(>=|<=|<>|!=|=|>|<)\s*"?([^"]+)"?$/);
        if (!m) return false;
        const [, cell, op, cmpVal] = m;
        const val = cellGetter(cell, visited);
        const numVal = parseFloat(val), cmpNum = parseFloat(cmpVal);
        const useNum = !isNaN(numVal) && !isNaN(cmpNum);
        if (op === '>') return useNum ? numVal > cmpNum : String(val) > cmpVal;
        if (op === '<') return useNum ? numVal < cmpNum : String(val) < cmpVal;
        if (op === '>=') return useNum ? numVal >= cmpNum : String(val) >= cmpVal;
        if (op === '<=') return useNum ? numVal <= cmpNum : String(val) <= cmpVal;
        if (op === '<>' || op === '!=') return useNum ? numVal !== cmpNum : String(val) !== cmpVal;
        if (op === '=') return useNum ? numVal === cmpNum : String(val) === cmpVal;
        return false;
    }

    class SpreadsheetView extends Component {
        static template = xml`
<div class="ls-spreadsheet-view">
    <!-- ═══ Menu Bar ═══ -->
    <div class="ls-ss-menubar">
        <div class="ls-ss-menu-item" t-on-click="() => this.toggleMenu('file')">File</div>
        <div class="ls-ss-menu-item" t-on-click="() => this.toggleMenu('edit')">Edit</div>
        <div class="ls-ss-menu-item" t-on-click="() => this.toggleMenu('view')">View</div>
        <div class="ls-ss-menu-item" t-on-click="() => this.toggleMenu('insert')">Insert</div>
        <div class="ls-ss-menu-item" t-on-click="() => this.toggleMenu('format')">Format</div>
        <div class="ls-ss-menu-item" t-on-click="() => this.toggleMenu('data')">Data</div>
    </div>
    <t t-if="state.activeMenu">
        <div class="ls-ss-menu-overlay" t-on-click="() => this.closeMenu()"></div>
        <div class="ls-ss-menu-dropdown" t-att-style="'left:' + state.menuPos.x + 'px; top:' + state.menuPos.y + 'px;'">
            <t t-foreach="getMenuItems(state.activeMenu)" t-as="item" t-key="item.label">
                <t t-if="item.separator"><div class="ls-ss-menu-sep"></div></t>
                <t t-else="">
                    <div t-att-class="'ls-ss-menu-dd-item' + (item.disabled ? ' disabled' : '')"
                         t-on-click="() => !item.disabled and this.execMenuAction(item)">
                        <span t-if="item.icon" class="ls-ss-menu-dd-icon" t-out="icons.get(item.icon, 14)"/>
                        <span t-esc="item.label"/>
                        <span class="ls-ss-menu-dd-shortcut" t-if="item.shortcut" t-esc="item.shortcut"/>
                    </div>
                </t>
            </t>
        </div>
    </t>

    <!-- ═══ Toolbar ═══ -->
    <div class="ls-ss-toolbar">
        <div class="ls-ss-toolbar-group">
            <button class="ls-ss-tb-btn" t-on-click="undo" title="Undo (Ctrl+Z)">
                <t t-out="icons.get('undo-2', 14)"/>
            </button>
            <button class="ls-ss-tb-btn" t-on-click="redo" title="Redo (Ctrl+Y)">
                <t t-out="icons.get('redo-2', 14)"/>
            </button>
        </div>
        <div class="ls-ss-tb-sep"></div>
        <div class="ls-ss-toolbar-group">
            <select class="ls-ss-tb-select" t-on-change="(ev) => this.setFontSize(ev.target.value)">
                <t t-foreach="[8,9,10,11,12,14,16,18,20,24,28,32]" t-as="fs" t-key="fs">
                    <option t-att-value="fs" t-att-selected="getCurrentFontSize() === fs" t-esc="fs"/>
                </t>
            </select>
        </div>
        <div class="ls-ss-tb-sep"></div>
        <div class="ls-ss-toolbar-group">
            <button t-att-class="'ls-ss-tb-btn' + (isFormat('bold') ? ' active' : '')"
                    t-on-click="() => this.toggleFormat('bold')" title="Bold (Ctrl+B)">
                <b>B</b>
            </button>
            <button t-att-class="'ls-ss-tb-btn' + (isFormat('italic') ? ' active' : '')"
                    t-on-click="() => this.toggleFormat('italic')" title="Italic (Ctrl+I)">
                <i>I</i>
            </button>
            <button t-att-class="'ls-ss-tb-btn' + (isFormat('strikethrough') ? ' active' : '')"
                    t-on-click="() => this.toggleFormat('strikethrough')" title="Strikethrough">
                <s>S</s>
            </button>
            <button t-att-class="'ls-ss-tb-btn' + (isFormat('underline') ? ' active' : '')"
                    t-on-click="() => this.toggleFormat('underline')" title="Underline (Ctrl+U)">
                <u>U</u>
            </button>
        </div>
        <div class="ls-ss-tb-sep"></div>
        <div class="ls-ss-toolbar-group">
            <button class="ls-ss-tb-btn ls-ss-color-btn" title="Text Color">
                <span>A</span>
                <div class="ls-ss-color-bar" t-att-style="'background:' + (state.currentTextColor || '#000')"></div>
                <input type="color" class="ls-ss-color-input" t-att-value="state.currentTextColor || '#000000'"
                       t-on-change="(ev) => this.setTextColor(ev.target.value)"/>
            </button>
            <button class="ls-ss-tb-btn ls-ss-color-btn" title="Fill Color">
                <span>⬛</span>
                <div class="ls-ss-color-bar" t-att-style="'background:' + (state.currentBgColor || '#fff')"></div>
                <input type="color" class="ls-ss-color-input" t-att-value="state.currentBgColor || '#ffffff'"
                       t-on-change="(ev) => this.setBgColor(ev.target.value)"/>
            </button>
        </div>
        <div class="ls-ss-tb-sep"></div>
        <div class="ls-ss-toolbar-group">
            <button class="ls-ss-tb-btn" t-on-click="() => this.toggleBorders()" title="Borders">
                <t t-out="icons.get('grid', 14)"/>
            </button>
            <button class="ls-ss-tb-btn" t-on-click="() => this.mergeCells()" title="Merge Cells">
                <t t-out="icons.get('maximize-2', 14)"/>
            </button>
        </div>
        <div class="ls-ss-tb-sep"></div>
        <div class="ls-ss-toolbar-group">
            <button t-att-class="'ls-ss-tb-btn' + (getCurrentAlign() === 'left' ? ' active' : '')"
                    t-on-click="() => this.setAlign('left')" title="Align Left">
                <t t-out="icons.get('align-left', 14)"/>
            </button>
            <button t-att-class="'ls-ss-tb-btn' + (getCurrentAlign() === 'center' ? ' active' : '')"
                    t-on-click="() => this.setAlign('center')" title="Align Center">
                <t t-out="icons.get('align-center', 14)"/>
            </button>
            <button t-att-class="'ls-ss-tb-btn' + (getCurrentAlign() === 'right' ? ' active' : '')"
                    t-on-click="() => this.setAlign('right')" title="Align Right">
                <t t-out="icons.get('align-right', 14)"/>
            </button>
        </div>
        <div class="ls-ss-tb-sep"></div>
        <div class="ls-ss-toolbar-group">
            <select class="ls-ss-tb-select" t-on-change="(ev) => this.setNumberFormat(ev.target.value)">
                <option value="none">General</option>
                <option value="number">Number</option>
                <option value="currency">Currency</option>
                <option value="percent">Percent</option>
                <option value="date">Date</option>
            </select>
        </div>
        <div class="ls-ss-tb-sep"></div>
        <div class="ls-ss-toolbar-group">
            <button class="ls-ss-tb-btn" t-on-click="toggleFreeze" t-att-title="state.freezeCol gte 0 ? 'Unfreeze' : 'Freeze Panes'">
                <t t-out="icons.get(state.freezeCol gte 0 ? 'lock' : 'unlock', 14)"/>
            </button>
            <button class="ls-ss-tb-btn" t-on-click="addChart" title="Insert Chart">
                <t t-out="icons.get('bar-chart-2', 14)"/>
            </button>
        </div>
        <div class="ls-ss-tb-spacer"></div>
        <div class="ls-ss-toolbar-group">
            <button class="ls-btn ls-btn-sm" t-on-click="exportCSV">CSV</button>
            <button class="ls-btn ls-btn-sm" t-on-click="exportExcel">Excel</button>
            <button class="ls-btn ls-btn-sm ls-btn-primary" t-on-click="saveData" title="Save Spreadsheet (Ctrl+S)">
                <t t-out="icons.get('save', 14)"/> Save
            </button>
        </div>
    </div>

    <!-- ═══ Formula Bar ═══ -->
    <div class="ls-ss-formulabar">
        <div class="ls-ss-cell-ref" t-esc="state.selectedCell || ''"/>
        <div class="ls-ss-formula-sep">fx</div>
        <input class="ls-ss-formula-input" type="text"
               t-att-value="state.formulaBarValue"
               id="lsFormulaInput"
               t-on-keydown="onFormulaBarKeydown"
               placeholder="Enter value or formula (e.g. =SUM(A1:A10))"/>
    </div>

    <t t-if="state.loading">
        <div class="ls-loading"><div class="ls-spinner"/> Loading...</div>
    </t>
    <t t-else="">
        <!-- ═══ Spreadsheet Grid ═══ -->
        <div class="ls-ss-container" t-ref="gridContainer">
            <table class="ls-ss-grid" t-ref="gridTable">
                <thead>
                    <tr>
                        <th class="ls-ss-corner"></th>
                        <t t-foreach="state.columns" t-as="col" t-key="col.idx">
                            <t t-if="!col.hidden">
                                <th t-att-class="'ls-ss-col-header' + (isColSelected(col.idx) ? ' selected' : '') + (state.sortCol === col.idx ? ' sorted' : '')"
                                    t-att-style="'width:' + col.width + 'px' + (state.freezeCol gte 0 and col.idx lte state.freezeCol ? 'position:sticky;left:' + getStickyLeft(col.idx) + 'px;z-index:4;' : '')"
                                    t-on-click="() => this.selectColumn(col.idx)"
                                    t-on-dblclick="() => this.autoFitColumn(col.idx)"
                                    t-on-contextmenu.prevent="(ev) => this.onColumnContextMenu(ev, col.idx)">
                                    <span t-esc="col.letter"/>
                                    <t t-if="state.sortCol === col.idx">
                                        <span class="ls-ss-sort-icon" t-esc="state.sortDir === 'asc' ? '▲' : '▼'"/>
                                    </t>
                                    <div class="ls-ss-col-resize" t-on-mousedown.stop="(ev) => this.onColResizeStart(ev, col.idx)"/>
                                </th>
                            </t>
                        </t>
                    </tr>
                </thead>
                <tbody>
                    <t t-foreach="state.rows" t-as="row" t-key="row.idx">
                        <tr>
                            <td t-att-class="'ls-ss-row-header' + (isRowSelected(row.idx) ? ' selected' : '') + (state.freezeRow gte 0 and row.idx lte state.freezeRow ? ' frozen' : '')"
                                t-att-style="(state.freezeRow gte 0 and row.idx lte state.freezeRow ? 'position:sticky;top:' + getStickyTop(row.idx) + 'px;z-index:3;' : '')"
                                t-on-click="() => this.selectRow(row.idx)"
                                t-on-contextmenu.prevent="(ev) => this.onRowContextMenu(ev, row.idx)">
                                <span t-esc="row.idx + 1"/>
                            </td>
                            <t t-foreach="state.columns" t-as="col" t-key="col.idx + '_' + row.idx">
                                <t t-if="!col.hidden">
                                    <t t-set="mergeInfo" t-value="getMergeInfo(col.idx, row.idx)"/>
                                    <t t-if="!mergeInfo or mergeInfo.isTopLeft">
                                        <td t-att-class="getCellClass(col.idx, row.idx)"
                                            t-att-style="getCellStyle(col.idx, row.idx)"
                                            t-att-colspan="mergeInfo and mergeInfo.colSpan gt 1 ? mergeInfo.colSpan : undefined"
                                            t-att-rowspan="mergeInfo and mergeInfo.rowSpan gt 1 ? mergeInfo.rowSpan : undefined"
                                            t-att-data-col="col.idx"
                                            t-att-data-row="row.idx"
                                            t-on-click="() => this.selectCell(col.idx, row.idx)"
                                            t-on-dblclick="() => this.startEditing(col.idx, row.idx)"
                                            t-on-contextmenu.prevent="(ev) => this.onCellContextMenu(ev, col.idx, row.idx)"
                                            t-on-mousedown="(ev) => this.onCellMouseDown(ev, col.idx, row.idx)"
                                            t-on-mouseover="(ev) => this.onCellMouseMove(ev, col.idx, row.idx)"
                                            t-on-mouseup="() => this.onCellMouseUp(col.idx, row.idx)">
                                            <t t-if="state.editingCell === col.idx + '_' + row.idx">
                                                <input class="ls-ss-cell-editor" type="text"
                                                       t-att-value="state.editValue"
                                                       id="lsCellEditor"
                                                       t-on-keydown="(ev) => this.onCellKeydown(ev, col.idx, row.idx)"
                                                       t-on-blur="() => this.commitEdit()"/>
                                            </t>
                                            <t t-else="">
                                                <t t-if="isHyperlink(col.idx, row.idx)">
                                                    <a class="ls-ss-hyperlink" t-att-href="getCellValue(col.idx, row.idx)" target="_blank" t-esc="getCellValue(col.idx, row.idx)"/>
                                                </t>
                                                <t t-else="">
                                                    <span t-esc="formatCellValue(col.idx, row.idx)"/>
                                                </t>
                                            </t>
                                        </td>
                                    </t>
                                </t>
                            </t>
                        </tr>
                    </t>
                    <!-- Aggregation row -->
                    <t t-if="state.showAggregation">
                        <tr class="ls-ss-aggregation-row">
                            <td class="ls-ss-row-header ls-ss-agg-header">
                                <span t-esc="state.aggLabel || 'Σ'"/>
                            </td>
                            <t t-foreach="state.columns" t-as="col" t-key="'agg_'+col.idx">
                                <t t-if="!col.hidden">
                                    <td class="ls-ss-agg-cell" t-esc="getAggregation(col.idx)"/>
                                </t>
                            </t>
                        </tr>
                    </t>
                </tbody>
            </table>

            <!-- ═══ Floating Charts ═══ -->
            <t t-foreach="state.charts" t-as="chart" t-key="chart.id">
                <div class="ls-ss-float-chart"
                     t-att-style="'left:' + (chart.x || 20) + 'px;top:' + (chart.y || 20) + 'px;width:' + (chart.width || 480) + 'px'"
                     t-on-dblclick="() => this.editChart(chart.id)"
                     t-on-mousedown="(ev) => this.onChartMouseDown(ev, chart.id)">
                    <div class="ls-ss-chart-header">
                        <span class="ls-ss-chart-drag-handle">
                            <t t-out="icons.get('grip-vertical', 12)"/>
                        </span>
                        <span class="ls-ss-chart-title" t-esc="chart.title"/>
                        <div class="ls-ss-chart-actions">
                            <button class="ls-ss-chart-btn" t-on-click.stop="() => this.editChart(chart.id)" title="Edit Chart">
                                <t t-out="icons.get('edit', 12)"/>
                            </button>
                            <button class="ls-ss-chart-btn" t-on-click.stop="() => this.resizeChart(chart.id)" title="Resize">
                                <t t-out="icons.get('maximize-2', 12)"/>
                            </button>
                            <button class="ls-ss-chart-close" t-on-click.stop="() => this.removeChart(chart.id)" title="Remove Chart">×</button>
                        </div>
                    </div>
                    <div class="ls-ss-chart-canvas-wrap">
                        <canvas t-att-id="chart.id" width="500" height="300"></canvas>
                    </div>
                </div>
            </t>
        </div>

        <!-- ═══ Sheet Tabs ═══ -->
        <div class="ls-ss-sheetbar">
            <button class="ls-ss-sheet-add" t-on-click="addSheet" title="Add Sheet">+</button>
            <t t-foreach="state.sheets" t-as="sheet" t-key="sheet.id">
                <div t-att-class="'ls-ss-sheet-tab' + (state.activeSheet === sheet.id ? ' active' : '')"
                     t-on-click="() => this.setActiveSheet(sheet.id)"
                     t-on-dblclick="() => this.renameSheet(sheet.id)"
                     t-on-contextmenu.prevent="(ev) => this.onSheetContextMenu(ev, sheet.id)">
                    <span t-esc="sheet.name"/>
                </div>
            </t>
        </div>

        <!-- ═══ Status Bar ═══ -->
        <div class="ls-ss-statusbar">
            <span class="ls-ss-status-left">
                <t t-if="state.selectedCell">
                    <t t-esc="state.selectedCell"/>: <t t-esc="getSelectedCellRawValue()"/>
                </t>
            </span>
            <span class="ls-ss-status-right">
                <t t-if="state.statusCalc">
                    <t t-esc="state.statusCalc.label"/>: <t t-esc="state.statusCalc.value"/>
                </t>
                | Rows: <t t-esc="state.rows.length"/> | Cols: <t t-esc="state.columns.length"/>
            </span>
        </div>
    </t>

    <!-- ═══ Context Menu ═══ -->
    <t t-if="state.contextMenu.show">
        <div class="ls-ss-context-overlay" t-on-click="() => this.closeContextMenu()"></div>
        <div class="ls-ss-context-menu" t-att-style="'left:' + state.contextMenu.x + 'px;top:' + state.contextMenu.y + 'px'">
            <t t-foreach="getContextMenuItems()" t-as="item" t-key="item.label">
                <t t-if="item.separator"><div class="ls-ss-ctx-separator"></div></t>
                <t t-else="">
                    <div t-att-class="'ls-ss-ctx-item' + (item.disabled ? ' disabled' : '')"
                         t-on-click="() => !item.disabled and item.action()">
                        <span class="ls-ss-ctx-icon" t-if="item.icon" t-out="icons.get(item.icon, 14)"/>
                        <span t-esc="item.label"/>
                        <span class="ls-ss-ctx-shortcut" t-if="item.shortcut" t-esc="item.shortcut"/>
                    </div>
                </t>
            </t>
        </div>
    </t>

    <!-- ═══ Chart Config Dialog ═══ -->
    <t t-if="state.chartDialog.show">
        <div class="ls-ss-modal-overlay" t-on-click.self="() => this.closeChartDialog()">
            <div class="ls-ss-modal ls-ss-chart-modal">
                <div class="ls-ss-modal-header">
                    <span t-esc="state.chartDialog.editingId ? 'Edit Chart' : 'Insert Chart'"/>
                    <button class="ls-ss-modal-close" t-on-click="() => this.closeChartDialog()">×</button>
                </div>
                <div class="ls-ss-modal-body">
                    <div class="ls-ss-form-row">
                        <label>Chart Type</label>
                        <div class="ls-ss-chart-type-grid">
                            <button t-att-class="'ls-ss-chart-type-btn' + (state.chartForm.type === 'bar' ? ' active' : '')"
                                    t-on-click="() => this.state.chartForm.type = 'bar'">
                                <t t-out="icons.get('bar-chart-2', 20)"/>
                                <span>Bar</span>
                            </button>
                            <button t-att-class="'ls-ss-chart-type-btn' + (state.chartForm.type === 'line' ? ' active' : '')"
                                    t-on-click="() => this.state.chartForm.type = 'line'">
                                <t t-out="icons.get('trending-up', 20)"/>
                                <span>Line</span>
                            </button>
                            <button t-att-class="'ls-ss-chart-type-btn' + (state.chartForm.type === 'pie' ? ' active' : '')"
                                    t-on-click="() => this.state.chartForm.type = 'pie'">
                                <t t-out="icons.get('pie-chart', 20)"/>
                                <span>Pie</span>
                            </button>
                            <button t-att-class="'ls-ss-chart-type-btn' + (state.chartForm.type === 'doughnut' ? ' active' : '')"
                                    t-on-click="() => this.state.chartForm.type = 'doughnut'">
                                <t t-out="icons.get('circle', 20)"/>
                                <span>Doughnut</span>
                            </button>
                        </div>
                    </div>
                    <div class="ls-ss-form-row">
                        <label>Title</label>
                        <input type="text" class="ls-ss-form-input" t-model="state.chartForm.title" placeholder="Chart title"/>
                    </div>
                    <div class="ls-ss-form-row">
                        <label>Labels (Column)</label>
                        <select class="ls-ss-form-select" t-model.number="state.chartForm.labelCol">
                            <t t-foreach="state.columns" t-as="col" t-key="col.idx">
                                <option t-att-value="col.idx" t-esc="col.letter + ' - ' + col.label"/>
                            </t>
                        </select>
                    </div>
                    <div class="ls-ss-form-row">
                        <label>Data Series</label>
                        <div class="ls-ss-series-list">
                            <t t-foreach="state.chartForm.dataCols" t-as="colIdx" t-key="colIdx_index">
                                <div class="ls-ss-series-item">
                                    <input type="color" t-att-value="state.chartForm.colors[colIdx_index % state.chartForm.colors.length]"
                                           t-on-change="(ev) => this.state.chartForm.colors[colIdx_index % state.chartForm.colors.length] = ev.target.value"/>
                                    <select class="ls-ss-form-select" t-model.number="state.chartForm.dataCols[colIdx_index]">
                                        <t t-foreach="state.columns" t-as="col" t-key="col.idx">
                                            <option t-att-value="col.idx" t-esc="col.letter + ' - ' + col.label"/>
                                        </t>
                                    </select>
                                    <button class="ls-ss-series-remove" t-on-click="() => this.removeSeries(colIdx_index)"
                                            t-if="state.chartForm.dataCols.length > 1">×</button>
                                </div>
                            </t>
                            <button class="ls-ss-series-add" t-on-click="() => this.addSeries()">
                                + Add Series
                            </button>
                        </div>
                    </div>
                    <div class="ls-ss-form-row" t-if="state.chartForm.type === 'bar'">
                        <label class="ls-ss-checkbox-label">
                            <input type="checkbox" t-model="state.chartForm.stacked"/>
                            <span>Stacked</span>
                        </label>
                        <label class="ls-ss-checkbox-label">
                            <input type="checkbox" t-model="state.chartForm.horizontal"/>
                            <span>Horizontal</span>
                        </label>
                    </div>
                    <div class="ls-ss-form-row">
                        <label class="ls-ss-checkbox-label">
                            <input type="checkbox" t-model="state.chartForm.showLegend"/>
                            <span>Show Legend</span>
                        </label>
                    </div>
                    <!-- Chart Preview -->
                    <div class="ls-ss-form-row">
                        <label>Preview</label>
                        <div class="ls-ss-chart-preview">
                            <canvas id="chartPreviewCanvas" width="460" height="250"></canvas>
                        </div>
                    </div>
                </div>
                <div class="ls-ss-modal-footer">
                    <button class="ls-btn" t-on-click="() => this.closeChartDialog()">Cancel</button>
                    <button class="ls-btn ls-btn-primary" t-on-click="() => this.saveChart()">
                        <t t-esc="state.chartDialog.editingId ? 'Update' : 'Insert'"/>
                    </button>
                </div>
            </div>
        </div>
    </t>

    <!-- ═══ Find & Replace Dialog ═══ -->
    <t t-if="state.findReplaceOpen">
        <div class="ls-ss-modal-overlay" t-on-click.self="() => this.closeFindReplace()">
            <div class="ls-ss-modal ls-ss-find-modal">
                <div class="ls-ss-modal-header">
                    <span>Find &amp; Replace</span>
                    <button class="ls-ss-modal-close" t-on-click="() => this.closeFindReplace()">×</button>
                </div>
                <div class="ls-ss-modal-body">
                    <div class="ls-ss-form-row">
                        <label>Find</label>
                        <div class="ls-ss-find-inputs">
                            <input type="text" class="ls-ss-input" t-att-value="state.findReplaceText"
                                   t-on-keydown="(ev) => this.onFindKeydown(ev)"
                                   placeholder="Search..." id="lsFindInput"/>
                            <span class="ls-ss-find-count" t-if="state.findResults.length gt 0">
                                <t t-esc="state.findCurrentIndex + 1"/> / <t t-esc="state.findResults.length"/>
                            </span>
                            <span class="ls-ss-find-count" t-else="">No results</span>
                        </div>
                    </div>
                    <div class="ls-ss-form-row" t-if="state.showReplaceMode">
                        <label>Replace</label>
                        <input type="text" class="ls-ss-input" t-att-value="state.replaceText" placeholder="Replace with..." id="lsReplaceInput"/>
                    </div>
                    <div class="ls-ss-form-row ls-ss-find-options">
                        <label class="ls-ss-checkbox-label">
                            <input type="checkbox" t-model="state.findMatchCase"/> Match case
                        </label>
                        <label class="ls-ss-checkbox-label">
                            <input type="checkbox" t-model="state.findMatchEntireCell"/> Entire cell
                        </label>
                        <label class="ls-ss-checkbox-label">
                            <input type="checkbox" t-model="state.findUseRegex"/> Regex
                        </label>
                    </div>
                </div>
                <div class="ls-ss-modal-footer">
                    <button class="ls-btn" t-on-click="() => this.findNext()">Find Next</button>
                    <button class="ls-btn" t-on-click="() => this.findPrev()">Find Prev</button>
                    <t t-if="state.showReplaceMode">
                        <button class="ls-btn" t-on-click="() => this.replaceCurrent()">Replace</button>
                        <button class="ls-btn" t-on-click="() => this.replaceAll()">Replace All</button>
                    </t>
                    <button class="ls-btn" t-on-click="() => this.closeFindReplace()">Close</button>
                </div>
            </div>
        </div>
    </t>
</div>
    `;

        static props = {
            model: { type: String },
            spreadsheetViewDef: { type: Object, optional: true },
            onOpenRecord: { type: Function, optional: true },
            domain: { type: Array, optional: true },
            actionDomain: { type: Array, optional: true },
            actionTitle: { type: String, optional: true },
            viewModes: { type: Array, optional: true },
            activeViewType: { type: String, optional: true },
            onSwitchView: { type: Function, optional: true },
        };

        setup() {
            this._model = this.props.model || 'task';
            this.icons = window.AdvSoftIcons;

            // Initialize Engine
            this.engine = new window.SpreadsheetEngine({
                defaultColWidth: this.props.spreadsheetViewDef?.column_width || 100,
                defaultRowHeight: this.props.spreadsheetViewDef?.row_height || 28,
            });
            this.engine.init();

            this.state = useState({
                loading: true,
                viewDef: this.props.spreadsheetViewDef || {},
                fields: {},
                sheets: [{ id: 'sheet1', name: 'Sheet1' }],
                activeSheet: 'sheet1',
                columns: [],
                rows: [],
                cellData: {},
                cellFormats: {},
                selectedCell: null,
                selectedCol: -1,
                selectedRow: -1,
                editingCell: null,
                editValue: '',
                formulaBarValue: '',
                isDragging: false,
                dragStart: null,
                dragEnd: null,
                resizingCol: -1,
                resizeStartX: 0,
                resizeStartWidth: 0,
                showAggregation: true,
                aggLabel: 'Total',
                totalAggregate: null,
                editMode: false,
                modifiedCells: {},
                undoStack: [],
                redoStack: [],
                clipboard: [],
                clipboardMode: null,
                sortCol: -1,
                sortDir: 'asc',
                freezeCol: -1,
                freezeRow: -1,
                contextMenu: { show: false, x: 0, y: 0, type: null, data: null },
                activeMenu: null,
                menuPos: { x: 0, y: 0 },
                currentTextColor: '#000000',
                currentBgColor: '#ffffff',
                currentFontSize: 10,
                currentAlign: 'left',
                numberFormat: 'none',
                charts: [],
                mergedCells: {},
                statusCalc: null,
                // Chart dialog
                chartDialog: { show: false, editingId: null },
                chartForm: {
                    type: 'bar',
                    title: 'Chart',
                    labelCol: 0,
                    dataCols: [1],
                    stacked: false,
                    horizontal: false,
                    showLegend: true,
                    colors: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'],
                },
                // Engine-backed features
                engineReady: true,
                filterEnabled: false,
                findReplaceOpen: false,
                findReplaceText: '',
                replaceText: '',
                findMatchCase: false,
                findMatchEntireCell: false,
                findUseRegex: false,
                findResults: [],
                findCurrentIndex: -1,
                showReplaceMode: false,
                showGridLines: true,
                zoom: 100,
                sheetData: {},
            });


            onWillStart(async () => {
                const fields = await RPC.fieldsGet(this._model);
                this.state.fields = fields;
                await this.loadData();
                this._syncEngineToState();
            });

            onMounted(() => {
                this._keyHandler = (ev) => this.onGlobalKeydown(ev);
                document.addEventListener('keydown', this._keyHandler);
                this._renderChartsDebounced = this._debounce(() => this._renderAllCharts(), 100);
            });

            onWillUnmount(() => {
                document.removeEventListener('keydown', this._keyHandler);
                if (this.engine) this.engine.destroy();
            });
        }

        // ══════════════════════════════════════════════════
        //  Menu Bar
        // ══════════════════════════════════════════════════

        toggleMenu(menu) {
            if (this.state.activeMenu === menu) {
                this.state.activeMenu = null;
            } else {
                this.state.activeMenu = menu;
                const items = document.querySelectorAll('.ls-ss-menu-item');
                const idx = ['file', 'edit', 'view', 'insert', 'format', 'data'].indexOf(menu);
                if (items[idx]) {
                    const rect = items[idx].getBoundingClientRect();
                    this.state.menuPos = { x: rect.left, y: rect.bottom };
                }
            }
        }

        closeMenu() { this.state.activeMenu = null; }

        getMenuItems(menu) {
            const items = {
                file: [
                    { label: 'New', icon: 'file', shortcut: 'Ctrl+N', action: () => this.newSpreadsheet() },
                    { label: 'Open...', icon: 'folder-open', action: () => this.openSpreadsheetDialog() },
                    { separator: true },
                    { label: 'Save', icon: 'save', shortcut: 'Ctrl+S', action: () => this.saveData() },
                    { separator: true },
                    { label: 'Export as CSV', icon: 'download', action: () => this.exportCSV() },
                    { label: 'Export as Excel', icon: 'file-spreadsheet', action: () => this.exportExcel() },
                ],
                edit: [
                    { label: 'Undo', icon: 'undo-2', shortcut: 'Ctrl+Z', action: () => this.undo(), disabled: this.state.undoStack.length === 0 },
                    { label: 'Redo', icon: 'redo-2', shortcut: 'Ctrl+Y', action: () => this.redo(), disabled: this.state.redoStack.length === 0 },
                    { separator: true },
                    { label: 'Cut', icon: 'scissors', shortcut: 'Ctrl+X', action: () => this.cutSelection() },
                    { label: 'Copy', icon: 'copy', shortcut: 'Ctrl+C', action: () => this.copySelection() },
                    { label: 'Paste', icon: 'clipboard', shortcut: 'Ctrl+V', action: () => this.pasteClipboard(), disabled: this.state.clipboard.length === 0 },
                    { separator: true },
                    { label: 'Select All', icon: 'check-square', shortcut: 'Ctrl+A', action: () => this.selectAll() },
                    { label: 'Find & Replace...', icon: 'search', shortcut: 'Ctrl+H', action: () => this.openFindReplace(true) },
                ],
                view: [
                    { label: 'Freeze Panes', icon: 'lock', action: () => this.toggleFreeze() },
                    { label: 'Show Grid Lines', icon: 'grid', action: () => this.toggleGridLines() },
                    { separator: true },
                    { label: 'Zoom In', icon: 'zoom-in', shortcut: 'Ctrl++', action: () => this.zoomIn() },
                    { label: 'Zoom Out', icon: 'zoom-out', shortcut: 'Ctrl+-', action: () => this.zoomOut() },
                ],
                insert: [
                    { label: 'Row Above', icon: 'arrow-up', action: () => { if (this.state.selectedRow >= 0) this.insertRowAbove(this.state.selectedRow); } },
                    { label: 'Row Below', icon: 'arrow-down', action: () => { if (this.state.selectedRow >= 0) this.insertRowBelow(this.state.selectedRow); } },
                    { separator: true },
                    { label: 'Column Left', icon: 'arrow-left', action: () => { if (this.state.selectedCol >= 0) this.insertColumnLeft(this.state.selectedCol); } },
                    { label: 'Column Right', icon: 'arrow-right', action: () => { if (this.state.selectedCol >= 0) this.insertColumnRight(this.state.selectedCol); } },
                    { separator: true },
                    { label: 'Chart', icon: 'bar-chart-2', action: () => this.addChart() },
                    { label: 'Hyperlink', icon: 'link', action: () => this.insertHyperlink() },
                ],
                format: [
                    { label: 'Bold', icon: 'bold', shortcut: 'Ctrl+B', action: () => this.toggleFormat('bold') },
                    { label: 'Italic', icon: 'italic', shortcut: 'Ctrl+I', action: () => this.toggleFormat('italic') },
                    { label: 'Strikethrough', icon: 'strikethrough', action: () => this.toggleFormat('strikethrough') },
                    { label: 'Underline', icon: 'underline', shortcut: 'Ctrl+U', action: () => this.toggleFormat('underline') },
                    { separator: true },
                    { label: 'Number Format...', icon: 'hash', action: () => this.openNumberFormatDialog() },
                    { label: 'Conditional Formatting', icon: 'filter', action: () => this.applyConditionalFormat() },
                    { separator: true },
                    { label: 'Merge Cells', icon: 'maximize-2', action: () => this.mergeCells() },
                    { label: 'Unmerge Cells', icon: 'minimize-2', action: () => this.unmergeCells() },
                ],
                data: [
                    { label: 'Sort A → Z', icon: 'arrow-up-narrow-wide', action: () => { if (this.state.selectedCol >= 0) this.sortColumn(this.state.selectedCol, 'asc'); } },
                    { label: 'Sort Z → A', icon: 'arrow-down-wide-narrow', action: () => { if (this.state.selectedCol >= 0) this.sortColumn(this.state.selectedCol, 'desc'); } },
                    { separator: true },
                    { label: 'Remove Duplicates', icon: 'x-circle', action: () => this.removeDuplicates() },
                    { label: 'Data Validation', icon: 'check-circle', action: () => this.openDataValidation() },
                ],
            };
            return items[menu] || [];
        }

        execMenuAction(item) {
            if (item.action) item.action();
            this.closeMenu();
        }

        newSpreadsheet() {
            if (!confirm('Create new spreadsheet? Unsaved changes will be lost.')) return;
            this.state.cellData = {};
            this.state.cellFormats = {};
            this.state.modifiedCells = {};
            this.state.undoStack = [];
            this.state.redoStack = [];
            this.loadData();
        }

        async openSpreadsheetDialog() {
            const docId = prompt('Enter spreadsheet document ID to open:');
            if (!docId) return;
            try {
                await this.loadSpreadsheet(parseInt(docId));
                alert('Spreadsheet loaded successfully.');
            } catch (e) {
                alert('Failed to load spreadsheet: ' + e.message);
            }
        }

        // ══════════════════════════════════════════════════
        //  Data loading
        // ══════════════════════════════════════════════════

        async loadData() {
            this.state.loading = true;



            const vd = this.state.viewDef;
            const domain = this.props.actionDomain || this.props.domain || [];
            const fieldNames = vd.fields || Object.keys(this.state.fields).filter(k => {
                const f = this.state.fields[k];
                return f && !f.invisible && f.type !== 'one2many' && f.type !== 'many2many';
            });
            const columns = fieldNames.map((fname, idx) => {
                const fDef = this.state.fields[fname];
                return { idx, name: fname, letter: colLetter(idx), label: fDef?.string || fname, width: vd.column_width || 120, hidden: false };
            });
            const res = await RPC.searchRead(this._model, domain, { limit: vd.limit || 1000 });
            const records = res.records || [];
            const rows = records.map((r, idx) => ({ idx, record: r }));
            const cellData = {};
            for (const row of rows) {
                for (const col of columns) {
                    const key = col.idx + '_' + row.idx;
                    const fname = col.name;
                    const fDef = this.state.fields[fname];
                    const rawVal = row.record[fname];
                    let displayValue = rawVal;
                    if (Array.isArray(rawVal)) displayValue = rawVal[1] || rawVal[0];
                    else if (fDef?.type === 'boolean') displayValue = rawVal ? 'Yes' : 'No';
                    else if (fDef?.type === 'float' || fDef?.type === 'integer' || fDef?.type === 'monetary') {
                        displayValue = rawVal !== null && rawVal !== undefined ? Number(rawVal) : 0;
                    }
                    else displayValue = rawVal ?? '';
                    cellData[key] = { raw: displayValue, value: displayValue, formula: null, format: {}, recordId: row.record.id, fieldName: fname };
                }
            }
            const extraRows = Math.max(10, 50 - rows.length);
            const targetLength = rows.length + extraRows;
            for (let i = rows.length; i < targetLength; i++) { rows.push({ idx: i, record: null }); }
            this.state.columns = columns;
            this.state.rows = rows;
            this.state.cellData = cellData;

            // Load saved spreadsheet document state if exists for this model
            try {
                const savedDocs = await RPC.searchRead('spreadsheet.document', [['parent_model', '=', this._model]], { limit: 1 });
                if (savedDocs && savedDocs.records && savedDocs.records.length > 0) {
                    const doc = savedDocs.records[0];
                    this._currentDocId = doc.id;
                    if (doc.spreadsheet_data) {
                        const data = typeof doc.spreadsheet_data === 'string' ? JSON.parse(doc.spreadsheet_data) : doc.spreadsheet_data;
                        if (data.cellData && Object.keys(data.cellData).length > 0) {
                            Object.assign(this.state.cellData, data.cellData);
                            if (data.sheets) this.state.sheets = data.sheets;
                            if (data.sheetData) this.state.sheetData = data.sheetData;
                            if (data.cellFormats) this.state.cellFormats = data.cellFormats;
                            if (data.mergedCells) this.state.mergedCells = data.mergedCells;
                            if (data.charts) this.state.charts = data.charts;
                        }
                    }
                }
            } catch (e) {
                console.warn('Could not load saved spreadsheet document:', e);
            }

            this.state.loading = false;
            setTimeout(() => this._renderAllCharts(), 150);
        }

        // ══════════════════════════════════════════════════
        //  Engine Integration Helpers
        // ══════════════════════════════════════════════════

        _syncEngineToState() {
            if (!this.engine || !this.engine.isInitialized) return;

            try {
                const engineModel = this.engine.model;
                for (let r = 0; r < Math.min(this.state.rows.length, 200); r++) {
                    for (let c = 0; c < this.state.columns.length; c++) {
                        const key = c + '_' + r;
                        const cd = this.state.cellData[key];
                        if (cd && cd.raw !== undefined && cd.raw !== null && cd.raw !== '') {
                            engineModel.setCellRaw(c, r, String(cd.raw));
                            if (cd.format && Object.keys(cd.format).length > 0) {
                                engineModel.setCellFormats(c, r, cd.format);
                            }
                        }
                    }
                }

                for (let c = 0; c < this.state.columns.length; c++) {
                    const width = this.state.columns[c]?.width || 100;
                    engineModel.setColWidth(c, width);
                }
            } catch (e) {
                console.warn('Engine sync warning:', e);
            }
        }

        _debounce(fn, delay) {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn(...args), delay);
            };
        }

        _getEngineCellDisplay(col, row) {
            if (!this.engine || !this.engine.isInitialized) return '';
            return this.engine.getCellDisplay(col, row);
        }

        _getEngineCellError(col, row) {
            if (!this.engine || !this.engine.isInitialized) return null;
            return this.engine.getCellError(col, row);
        }

        _engineUndo() {
            if (this.engine) {
                const cmd = this.engine.undo();
                if (cmd) this._syncEngineToState();
            }
        }

        _engineRedo() {
            if (this.engine) {
                const cmd = this.engine.redo();
                if (cmd) this._syncEngineToState();
            }
        }

        // ══════════════════════════════════════════════════
        //  Cell operations
        // ══════════════════════════════════════════════════

        getCellData(colIdx, rowIdx) { return this.state.cellData[colIdx + '_' + rowIdx] || null; }

        getCellValue(colIdx, rowIdx) {
            const cd = this.getCellData(colIdx, rowIdx);
            if (!cd) return '';
            if (cd.formula) return evaluateFormula(cd.formula, (ref, visited) => this._getCellValueByRef(ref, visited));
            return cd.value ?? cd.raw ?? '';
        }

        _getCellValueByRef(ref, visited) {
            const m = ref.match(/^([A-Z]+)(\d+)$/);
            if (!m) return '';
            const ci = colIndex(m[1]), ri = parseInt(m[2]) - 1;
            const cd = this.getCellData(ci, ri);
            if (!cd) return '';
            if (cd.formula) return evaluateFormula(cd.formula, (r2, v2) => this._getCellValueByRef(r2, v2), visited);
            return cd.value ?? cd.raw ?? '';
        }

        formatCellValue(colIdx, rowIdx) {
            let val = this.getCellValue(colIdx, rowIdx);
            const key = colIdx + '_' + rowIdx;
            const fmt = this.state.cellFormats[key];
            if (fmt && fmt.numberFormat && !isNaN(parseFloat(val))) {
                const num = parseFloat(val);
                if (fmt.numberFormat === 'currency') val = '$' + num.toFixed(2);
                else if (fmt.numberFormat === 'percent') val = (num * 100).toFixed(2) + '%';
                else if (fmt.numberFormat === 'number') val = num.toFixed(2);
            }
            return val;
        }

        isHyperlink(colIdx, rowIdx) {
            const val = this.getCellValue(colIdx, rowIdx);
            return typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'));
        }

        getCellClass(colIdx, rowIdx) {
            const classes = ['ls-ss-cell'];
            if (this.state.selectedCell === colLetter(colIdx) + (rowIdx + 1)) classes.push('selected');
            if (this.state.editingCell === colIdx + '_' + rowIdx) classes.push('editing');
            if (this.state.dragStart && this.state.dragEnd) {
                const minC = Math.min(this.state.dragStart.col, this.state.dragEnd.col);
                const maxC = Math.max(this.state.dragStart.col, this.state.dragEnd.col);
                const minR = Math.min(this.state.dragStart.row, this.state.dragEnd.row);
                const maxR = Math.max(this.state.dragStart.row, this.state.dragEnd.row);
                if (colIdx >= minC && colIdx <= maxC && rowIdx >= minR && rowIdx <= maxR) {
                    if (minC !== maxC || minR !== maxR) classes.push('drag-highlight');
                }
            }
            const key = colIdx + '_' + rowIdx;
            const fmt = this.state.cellFormats[key];
            if (fmt) {
                if (fmt.bold) classes.push('fmt-bold');
                if (fmt.italic) classes.push('fmt-italic');
                if (fmt.underline) classes.push('fmt-underline');
                if (fmt.strikethrough) classes.push('fmt-strikethrough');
                if (fmt.align) classes.push('fmt-align-' + fmt.align);
            }
            const cellFmt = this.state.cellData[key]?.format;
            if (cellFmt?.cf) classes.push('cf-' + cellFmt.cf);
            return classes.join(' ');
        }

        getCellStyle(colIdx, rowIdx) {
            const key = colIdx + '_' + rowIdx;
            const fmt = this.state.cellFormats[key];
            const cellFmt = this.state.cellData[key]?.format;
            let styles = '';
            if (fmt) {
                if (fmt.bgColor) styles += 'background:' + fmt.bgColor + ';';
                if (fmt.color) styles += 'color:' + fmt.color + ';';
                if (fmt.fontSize) styles += 'font-size:' + fmt.fontSize + 'px;';
            }
            if (cellFmt?.cf === 'green') styles += 'background:#d1fae5;';
            if (cellFmt?.cf === 'yellow') styles += 'background:#fef3c7;';
            if (cellFmt?.cf === 'red') styles += 'background:#fee2e2;';
            return styles;
        }

        getSelectedCellRawValue() {
            if (!this.state.selectedCell) return '';
            const m = this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);
            if (!m) return '';
            const cd = this.getCellData(colIndex(m[1]), parseInt(m[2]) - 1);
            return cd ? (cd.formula || cd.raw || '') : '';
        }

        // ══════════════════════════════════════════════════
        //  Selection & Editing
        // ══════════════════════════════════════════════════

        selectCell(colIdx, rowIdx) {
            this.state.selectedCell = colLetter(colIdx) + (rowIdx + 1);
            this.state.selectedCol = colIdx;
            this.state.selectedRow = rowIdx;
            const cd = this.getCellData(colIdx, rowIdx);
            this.state.formulaBarValue = cd ? (cd.formula || String(cd.raw ?? '')) : '';
            this._updateToolbarState(colIdx, rowIdx);
            this._updateStatusCalc();
        }

        selectColumn(colIdx) { this.state.selectedCol = colIdx; this.state.selectedRow = -1; this.state.selectedCell = null; }
        selectRow(rowIdx) { this.state.selectedRow = rowIdx; this.state.selectedCol = -1; this.state.selectedCell = null; }

        startEditing(colIdx, rowIdx) {
            if (this.state.viewDef.readonly) return;
            const key = colIdx + '_' + rowIdx;
            const cd = this.getCellData(colIdx, rowIdx);
            if (cd && cd.format && cd.format.locked) return;
            this.state.editingCell = key;
            this.state.editValue = cd ? (cd.formula || String(cd.raw ?? '')) : '';
            this.state.formulaBarValue = this.state.editValue;
            this.state.editMode = true;
            setTimeout(() => { const e = document.querySelector('.ls-ss-cell-editor'); if (e) e.focus(); }, 10);
        }

        commitEdit(forcedValue = null) {
            if (!this.state.editingCell) return;
            const [colStr, rowStr] = this.state.editingCell.split('_');
            const colIdx = parseInt(colStr), rowIdx = parseInt(rowStr);
            const key = this.state.editingCell;
            let value = forcedValue !== null ? forcedValue : this.state.editValue;
            if (forcedValue === null) {
                const el = document.getElementById('lsCellEditor');
                if (el) value = el.value;
            }
            const oldData = this.state.cellData[key] ? { ...this.state.cellData[key] } : null;
            if (!this.state.cellData[key]) this.state.cellData[key] = { raw: '', value: '', formula: null, format: {} };
            const cd = this.state.cellData[key];
            if (value.startsWith('=')) { cd.formula = value; cd.raw = value; }
            else { cd.formula = null; cd.raw = value; const num = parseFloat(value); cd.value = (!isNaN(num) && String(num) === value.trim()) ? num : value; }
            if (cd.recordId) { this.state.modifiedCells[key] = { recordId: cd.recordId, fieldName: cd.fieldName, value: cd.formula ? this.getCellValue(colIdx, rowIdx) : (cd.value || cd.raw) }; }
            const newData = { ...this.state.cellData[key] };
            this._pushUndo({ type: 'edit', key, oldData, newData, colIdx, rowIdx });
            this.state.editingCell = null;
            this.state.editMode = false;
        }

        onCellKeydown(ev, colIdx, rowIdx) {
            if (ev.key === 'Enter') { this.commitEdit(); if (rowIdx + 1 < this.state.rows.length) this.selectCell(colIdx, rowIdx + 1); }
            else if (ev.key === 'Tab') { ev.preventDefault(); this.commitEdit(); if (colIdx + 1 < this.state.columns.length) this.selectCell(colIdx + 1, rowIdx); }
            else if (ev.key === 'Escape') { this.state.editingCell = null; this.state.editMode = false; }
        }

        onFormulaBarKeydown(ev) {
            if (ev.key === 'Enter' && this.state.selectedCell) {
                const el = document.getElementById('lsFormulaInput');
                if (el) this.state.formulaBarValue = el.value;
                const m = this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);
                if (m) { this.state.editingCell = colIndex(m[1]) + '_' + (parseInt(m[2]) - 1); this.state.editValue = this.state.formulaBarValue; this.commitEdit(); }
            }
        }

        onFormulaBarBlur(ev) {
            const el = document.getElementById('lsFormulaInput');
            if (el) this.state.formulaBarValue = el.value;
        }

        onGlobalKeydown(ev) {
            if (this.state.editingCell) return;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(ev.target.tagName)) return;
            if (this.state.findReplaceOpen || this.state.chartDialog.show) return;
            if (!this.state.selectedCell) return;
            const m = this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);
            if (!m) return;
            const ci = colIndex(m[1]), ri = parseInt(m[2]) - 1;
            if ((ev.ctrlKey || ev.metaKey) && ev.key === 'c') { ev.preventDefault(); this.copySelection(); return; }
            if ((ev.ctrlKey || ev.metaKey) && ev.key === 'v') { ev.preventDefault(); this.pasteClipboard(); return; }
            if ((ev.ctrlKey || ev.metaKey) && ev.key === 'x') { ev.preventDefault(); this.cutSelection(); return; }
            if ((ev.ctrlKey || ev.metaKey) && ev.key === 'z') { ev.preventDefault(); this.undo(); return; }
            if ((ev.ctrlKey || ev.metaKey) && ev.key === 'y') { ev.preventDefault(); this.redo(); return; }
            if ((ev.ctrlKey || ev.metaKey) && ev.key === 'b') { ev.preventDefault(); this.toggleFormat('bold'); return; }
            if ((ev.ctrlKey || ev.metaKey) && ev.key === 'i') { ev.preventDefault(); this.toggleFormat('italic'); return; }
            if ((ev.ctrlKey || ev.metaKey) && ev.key === 'u') { ev.preventDefault(); this.toggleFormat('underline'); return; }
            if ((ev.ctrlKey || ev.metaKey) && ev.key === 'a') { ev.preventDefault(); this.selectAll(); return; }
            if ((ev.ctrlKey || ev.metaKey) && ev.key === 'n') { ev.preventDefault(); this.newSpreadsheet(); return; }
            if ((ev.ctrlKey || ev.metaKey) && ev.key === 's') { ev.preventDefault(); this.saveData(); return; }
            if ((ev.ctrlKey || ev.metaKey) && ev.key === 'h') { ev.preventDefault(); this.openFindReplace(true); return; }
            switch (ev.key) {
                case 'ArrowUp': ev.preventDefault(); if (ri > 0) this.selectCell(ci, ri - 1); break;
                case 'ArrowDown': ev.preventDefault(); if (ri < this.state.rows.length - 1) this.selectCell(ci, ri + 1); break;
                case 'ArrowLeft': ev.preventDefault(); if (ci > 0) this.selectCell(ci - 1, ri); break;
                case 'ArrowRight': ev.preventDefault(); if (ci < this.state.columns.length - 1) this.selectCell(ci + 1, ri); break;
                case 'Enter': this.startEditing(ci, ri); break;
                case 'Delete': case 'Backspace': 
                    ev.preventDefault();
                    const sel = this._getSelectionRange();
                    if (sel) {
                        const batch = [];
                        for (let r = sel.minR; r <= sel.maxR; r++) {
                            for (let c = sel.minC; c <= sel.maxC; c++) {
                                const action = this.deleteCellValue(c, r, false);
                                if (action) batch.push(action);
                            }
                        }
                        if (batch.length > 0) this._pushUndo({ type: 'batch', actions: batch });
                    } else {
                        this.deleteCellValue(ci, ri);
                    }
                    break;
                case 'F2': this.startEditing(ci, ri); break;
                default: if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey) { this.startEditing(ci, ri); this.state.editValue = ev.key; }
            }
        }

        deleteCellValue(colIdx, rowIdx, pushUndo = true) {
            const key = colIdx + '_' + rowIdx;
            if (this.state.cellData[key]) {
                const oldData = { ...this.state.cellData[key] };
                this.state.cellData[key].raw = ''; this.state.cellData[key].value = ''; this.state.cellData[key].formula = null;
                if (this.state.cellData[key].recordId) { this.state.modifiedCells[key] = { recordId: this.state.cellData[key].recordId, fieldName: this.state.cellData[key].fieldName, value: null }; }
                const newData = { ...this.state.cellData[key] };
                const action = { type: 'edit', key, oldData, newData, colIdx, rowIdx };
                if (pushUndo) this._pushUndo(action);
                return action;
            }
            return null;
        }

        _updateToolbarState(colIdx, rowIdx) {
            const key = colIdx + '_' + rowIdx;
            const fmt = this.state.cellFormats[key] || {};
            this.state.currentTextColor = fmt.color || '#000000';
            this.state.currentBgColor = fmt.bgColor || '#ffffff';
            this.state.currentFontSize = fmt.fontSize || 10;
            this.state.currentAlign = fmt.align || 'left';
        }

        _updateStatusCalc() {
            if (!this.state.selectedCell) { this.state.statusCalc = null; return; }
            const sel = this._getSelectionRange();
            if (!sel) { this.state.statusCalc = null; return; }
            let sum = 0, count = 0, nums = [];
            for (let r = sel.minR; r <= sel.maxR; r++) {
                for (let c = sel.minC; c <= sel.maxC; c++) {
                    const val = parseFloat(this.getCellValue(c, r));
                    if (!isNaN(val)) { sum += val; count++; nums.push(val); }
                }
            }
            if (count > 0) {
                this.state.statusCalc = { label: 'Sum', value: Math.round(sum * 100) / 100 + ' | Avg: ' + (sum / count).toFixed(2) + ' | Count: ' + count };
            } else {
                this.state.statusCalc = { label: 'Count', value: count + ' cells' };
            }
        }

        // ══════════════════════════════════════════════════
        //  Formatting
        // ══════════════════════════════════════════════════

        isFormat(prop) {
            if (!this.state.selectedCell) return false;
            const m = this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);
            if (!m) return false;
            const key = colIndex(m[1]) + '_' + (parseInt(m[2]) - 1);
            const fmt = this.state.cellFormats[key];
            return fmt && fmt[prop];
        }

        toggleFormat(prop) {
            if (!this.state.selectedCell) return;
            const sel = this._getSelectionRange();
            if (!sel) return;
            const key0 = sel.minC + '_' + sel.minR;
            const currentVal = this.state.cellFormats[key0]?.[prop] || false;
            const batch = [];
            for (let r = sel.minR; r <= sel.maxR; r++) {
                for (let c = sel.minC; c <= sel.maxC; c++) {
                    const key = c + '_' + r;
                    const oldFormat = this.state.cellFormats[key] ? { ...this.state.cellFormats[key] } : null;
                    if (!this.state.cellFormats[key]) this.state.cellFormats[key] = {};
                    this.state.cellFormats[key][prop] = !currentVal;
                    const newFormat = { ...this.state.cellFormats[key] };
                    batch.push({ type: 'format', key, oldFormat, newFormat, colIdx: c, rowIdx: r });
                }
            }
            if (batch.length > 0) this._pushUndo({ type: 'batch', actions: batch });
        }

        getCurrentFontSize() { return this.state.currentFontSize; }

        setFontSize(size) {
            if (!this.state.selectedCell) return;
            const sel = this._getSelectionRange();
            if (!sel) return;
            const batch = [];
            for (let r = sel.minR; r <= sel.maxR; r++) {
                for (let c = sel.minC; c <= sel.maxC; c++) {
                    const key = c + '_' + r;
                    const oldFormat = this.state.cellFormats[key] ? { ...this.state.cellFormats[key] } : null;
                    if (!this.state.cellFormats[key]) this.state.cellFormats[key] = {};
                    this.state.cellFormats[key].fontSize = parseInt(size);
                    const newFormat = { ...this.state.cellFormats[key] };
                    batch.push({ type: 'format', key, oldFormat, newFormat, colIdx: c, rowIdx: r });
                }
            }
            if (batch.length > 0) this._pushUndo({ type: 'batch', actions: batch });
            this.state.currentFontSize = parseInt(size);
        }

        getCurrentAlign() { return this.state.currentAlign; }

        setAlign(align) {
            if (!this.state.selectedCell) return;
            const sel = this._getSelectionRange();
            if (!sel) return;
            const batch = [];
            for (let r = sel.minR; r <= sel.maxR; r++) {
                for (let c = sel.minC; c <= sel.maxC; c++) {
                    const key = c + '_' + r;
                    const oldFormat = this.state.cellFormats[key] ? { ...this.state.cellFormats[key] } : null;
                    if (!this.state.cellFormats[key]) this.state.cellFormats[key] = {};
                    this.state.cellFormats[key].align = align;
                    const newFormat = { ...this.state.cellFormats[key] };
                    batch.push({ type: 'format', key, oldFormat, newFormat, colIdx: c, rowIdx: r });
                }
            }
            if (batch.length > 0) this._pushUndo({ type: 'batch', actions: batch });
            this.state.currentAlign = align;
        }

        setTextColor(color) {
            if (!this.state.selectedCell) return;
            const sel = this._getSelectionRange();
            if (!sel) return;
            const batch = [];
            for (let r = sel.minR; r <= sel.maxR; r++) {
                for (let c = sel.minC; c <= sel.maxC; c++) {
                    const key = c + '_' + r;
                    const oldFormat = this.state.cellFormats[key] ? { ...this.state.cellFormats[key] } : null;
                    if (!this.state.cellFormats[key]) this.state.cellFormats[key] = {};
                    this.state.cellFormats[key].color = color;
                    const newFormat = { ...this.state.cellFormats[key] };
                    batch.push({ type: 'format', key, oldFormat, newFormat, colIdx: c, rowIdx: r });
                }
            }
            if (batch.length > 0) this._pushUndo({ type: 'batch', actions: batch });
            this.state.currentTextColor = color;
        }

        setBgColor(color) {
            if (!this.state.selectedCell) return;
            const sel = this._getSelectionRange();
            if (!sel) return;
            const batch = [];
            for (let r = sel.minR; r <= sel.maxR; r++) {
                for (let c = sel.minC; c <= sel.maxC; c++) {
                    const key = c + '_' + r;
                    const oldFormat = this.state.cellFormats[key] ? { ...this.state.cellFormats[key] } : null;
                    if (!this.state.cellFormats[key]) this.state.cellFormats[key] = {};
                    this.state.cellFormats[key].bgColor = color;
                    const newFormat = { ...this.state.cellFormats[key] };
                    batch.push({ type: 'format', key, oldFormat, newFormat, colIdx: c, rowIdx: r });
                }
            }
            if (batch.length > 0) this._pushUndo({ type: 'batch', actions: batch });
            this.state.currentBgColor = color;
        }

        setNumberFormat(fmt) {
            if (!this.state.selectedCell) return;
            const sel = this._getSelectionRange();
            if (!sel) return;
            const batch = [];
            for (let r = sel.minR; r <= sel.maxR; r++) {
                for (let c = sel.minC; c <= sel.maxC; c++) {
                    const key = c + '_' + r;
                    const oldFormat = this.state.cellFormats[key] ? { ...this.state.cellFormats[key] } : null;
                    if (!this.state.cellFormats[key]) this.state.cellFormats[key] = {};
                    this.state.cellFormats[key].numberFormat = fmt;
                    const newFormat = { ...this.state.cellFormats[key] };
                    batch.push({ type: 'format', key, oldFormat, newFormat, colIdx: c, rowIdx: r });
                }
            }
            if (batch.length > 0) this._pushUndo({ type: 'batch', actions: batch });
            this.state.numberFormat = fmt;
        }

        openNumberFormatDialog() {
            if (!this.state.selectedCell) return;
            const formats = [
                { value: 'none', label: 'General' },
                { value: 'number', label: 'Number (1,234.56)' },
                { value: 'currency', label: 'Currency ($1,234.56)' },
                { value: 'percent', label: 'Percent (123.45%)' },
                { value: 'date', label: 'Date (MM/DD/YYYY)' },
                { value: 'text', label: 'Text (@)' },
            ];
            const current = this.state.cellFormats[this.state.selectedCol + '_' + this.state.selectedRow]?.numberFormat || 'none';
            const options = formats.map((f, i) => (i + 1) + '. ' + f.label + (f.value === current ? ' (current)' : '')).join('\n');
            const choice = prompt('Number Format:\n' + options + '\n\nEnter number (1-6):');
            if (choice) {
                const idx = parseInt(choice) - 1;
                if (idx >= 0 && idx < formats.length) {
                    this.setNumberFormat(formats[idx].value);
                }
            }
        }

        toggleBorders() {
            if (!this.state.selectedCell) return;
            const sel = this._getSelectionRange();
            if (!sel) return;
            for (let r = sel.minR; r <= sel.maxR; r++) {
                for (let c = sel.minC; c <= sel.maxC; c++) {
                    const key = c + '_' + r;
                    if (!this.state.cellFormats[key]) this.state.cellFormats[key] = {};
                    this.state.cellFormats[key].border = !this.state.cellFormats[key].border;
                }
            }
        }

        getMergeInfo(colIdx, rowIdx) {
            for (const key in this.state.mergedCells) {
                const m = this.state.mergedCells[key];
                if (colIdx >= m.minC && colIdx <= m.maxC && rowIdx >= m.minR && rowIdx <= m.maxR) {
                    if (colIdx === m.minC && rowIdx === m.minR) {
                        return { isTopLeft: true, colSpan: m.maxC - m.minC + 1, rowSpan: m.maxR - m.minR + 1 };
                    }
                    return { isTopLeft: false };
                }
            }
            return null;
        }

        mergeCells() {
            if (!this.state.selectedCell) return;
            const sel = this._getSelectionRange();
            if (!sel || (sel.minC === sel.maxC && sel.minR === sel.maxR)) return;
            const key = sel.minC + '_' + sel.minR;
            this.state.mergedCells[key] = { minC: sel.minC, maxC: sel.maxC, minR: sel.minR, maxR: sel.maxR };
        }

        unmergeCells() {
            if (!this.state.selectedCell) return;
            const m = this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);
            if (!m) return;
            const key = colIndex(m[1]) + '_' + (parseInt(m[2]) - 1);
            delete this.state.mergedCells[key];
        }

        // ════════════════════════════════════════════════
        //  Find & Replace
        // ════════════════════════════════════════════════

        openFindReplace(withReplace) {
            this.state.findReplaceOpen = true;
            this.state.showReplaceMode = !!withReplace;
            this.state.findResults = [];
            this.state.findCurrentIndex = -1;
            this.state.findReplaceText = '';
            this.state.replaceText = '';
            setTimeout(() => { const el = document.getElementById('lsFindInput'); if (el) el.focus(); }, 10);
        }

        closeFindReplace() {
            this.state.findReplaceOpen = false;
            this.state.findResults = [];
            this.state.findCurrentIndex = -1;
        }

        executeFind() {
            const findEl = document.getElementById('lsFindInput');
            if (findEl) this.state.findReplaceText = findEl.value;
            const text = this.state.findReplaceText;
            this.state.lastSearchText = text;
            if (!text) { this.state.findResults = []; this.state.findCurrentIndex = -1; return; }
            const results = [];
            const useRegex = this.state.findUseRegex;
            const matchCase = this.state.findMatchCase;
            const entireCell = this.state.findMatchEntireCell;
            let pattern;
            try {
                pattern = useRegex ? new RegExp(text, matchCase ? 'g' : 'gi') : null;
            } catch (e) { return; }
            for (let r = 0; r < this.state.rows.length; r++) {
                for (let c = 0; c < this.state.columns.length; c++) {
                    const val = String(this.getCellValue(c, r));
                    const searchVal = matchCase ? val : val.toLowerCase();
                    const searchText = matchCase ? text : text.toLowerCase();
                    let found = false;
                    if (useRegex && pattern) {
                        pattern.lastIndex = 0;
                        found = pattern.test(val);
                    } else if (entireCell) {
                        found = searchVal === searchText;
                    } else {
                        found = searchVal.includes(searchText);
                    }
                    if (found) results.push({ col: c, row: r });
                }
            }
            this.state.findResults = results;
            this.state.findCurrentIndex = results.length > 0 ? 0 : -1;
            if (results.length > 0) this._selectFindResult();
        }

        findNext() {
            const findEl = document.getElementById('lsFindInput');
            if (findEl) this.state.findReplaceText = findEl.value;
            if (this.state.findResults.length === 0 || this.state.lastSearchText !== this.state.findReplaceText) { this.executeFind(); return; }
            this.state.findCurrentIndex = (this.state.findCurrentIndex + 1) % this.state.findResults.length;
            this._selectFindResult();
        }

        findPrev() {
            const findEl = document.getElementById('lsFindInput');
            if (findEl) this.state.findReplaceText = findEl.value;
            if (this.state.findResults.length === 0 || this.state.lastSearchText !== this.state.findReplaceText) { this.executeFind(); return; }
            this.state.findCurrentIndex = (this.state.findCurrentIndex - 1 + this.state.findResults.length) % this.state.findResults.length;
            this._selectFindResult();
        }

        _selectFindResult() {
            if (this.state.findCurrentIndex < 0 || this.state.findCurrentIndex >= this.state.findResults.length) return;
            const { col, row } = this.state.findResults[this.state.findCurrentIndex];
            this.selectCell(col, row);
            this._scrollToCell(col, row);
        }

        _scrollToCell(colIdx, rowIdx) {
            const container = document.querySelector('.ls-ss-container');
            if (!container) return;
            const td = document.querySelector(`.ls-ss-grid td[data-col="${colIdx}"][data-row="${rowIdx}"]`);
            if (td) {
                const cRect = container.getBoundingClientRect();
                const tRect = td.getBoundingClientRect();
                if (tRect.top < cRect.top || tRect.bottom > cRect.bottom || tRect.left < cRect.left || tRect.right > cRect.right) {
                    td.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                }
            }
        }

        replaceCurrent() {
            const replEl = document.getElementById('lsReplaceInput');
            if (replEl) this.state.replaceText = replEl.value;
            const findEl = document.getElementById('lsFindInput');
            if (findEl) this.state.findReplaceText = findEl.value;
            if (this.state.findCurrentIndex < 0 || this.state.findCurrentIndex >= this.state.findResults.length) return;
            const { col, row } = this.state.findResults[this.state.findCurrentIndex];
            const key = col + '_' + row;
            const cd = this.state.cellData[key];
            if (!cd) return;
            const oldVal = String(cd.raw || '');
            const search = this.state.findReplaceText;
            const replace = this.state.replaceText;
            const matchCase = this.state.findMatchCase;
            const useRegex = this.state.findUseRegex;
            let newVal;
            if (useRegex) {
                const flags = matchCase ? 'g' : 'gi';
                newVal = oldVal.replace(new RegExp(search, flags), replace);
            } else {
                if (matchCase) {
                    newVal = oldVal.split(search).join(replace);
                } else {
                    newVal = oldVal.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replace);
                }
            }
            const oldData = { ...cd };
            cd.raw = newVal;
            cd.value = newVal;
            cd.formula = null;
            this.state.modifiedCells[key] = { recordId: cd.recordId, fieldName: cd.fieldName, value: newVal };
            const newData = { ...cd };
            this._pushUndo({ type: 'edit', key, oldData, newData, colIdx: col, rowIdx: row });
            this.findNext();
        }

        replaceAll() {
            const replEl = document.getElementById('lsReplaceInput');
            if (replEl) this.state.replaceText = replEl.value;
            const findEl = document.getElementById('lsFindInput');
            if (findEl) this.state.findReplaceText = findEl.value;
            
            if (this.state.findResults.length === 0) this.executeFind();
            if (this.state.findResults.length === 0) return;
            const search = this.state.findReplaceText;
            const replace = this.state.replaceText;
            const matchCase = this.state.findMatchCase;
            const useRegex = this.state.findUseRegex;
            let count = 0;
            const batch = [];
            for (const { col, row } of this.state.findResults) {
                const key = col + '_' + row;
                const cd = this.state.cellData[key];
                if (!cd) continue;
                const oldVal = String(cd.raw || '');
                let newVal;
                if (useRegex) {
                    const flags = matchCase ? 'g' : 'gi';
                    newVal = oldVal.replace(new RegExp(search, flags), replace);
                } else {
                    if (matchCase) {
                        newVal = oldVal.split(search).join(replace);
                    } else {
                        newVal = oldVal.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replace);
                    }
                }
                if (newVal !== oldVal) {
                    const oldData = { ...cd };
                    cd.raw = newVal;
                    cd.value = newVal;
                    cd.formula = null;
                    this.state.modifiedCells[key] = { recordId: cd.recordId, fieldName: cd.fieldName, value: newVal };
                    const newData = { ...cd };
                    batch.push({ type: 'edit', key, oldData, newData, colIdx: col, rowIdx: row });
                    count++;
                }
            }
            if (batch.length > 0) this._pushUndo({ type: 'batch', actions: batch });
            this.state.findResults = [];
            this.state.findCurrentIndex = -1;
            alert('Replaced ' + count + ' occurrence(s).');
        }

        onFindKeydown(ev) {
            if (ev.key === 'Enter') {
                ev.preventDefault();
                if (ev.shiftKey) this.findPrev();
                else this.findNext();
            }
            if (ev.key === 'Escape') this.closeFindReplace();
        }

        // ════════════════════════════════════════════════
        //  Data Validation
        // ════════════════════════════════════════════════

        openDataValidation() {
            if (!this.state.selectedCell) return;
            const types = [
                '1. List (comma-separated values)',
                '2. Number (min/max range)',
                '3. Text (length limit)',
                '4. Date (range)',
                '5. Custom formula',
            ];
            const choice = prompt('Data Validation Type:\n' + types.join('\n') + '\n\nEnter number (1-5):');
            if (!choice) return;
            const idx = parseInt(choice) - 1;
            if (idx < 0 || idx > 4) return;
            const sel = this._getSelectionRange();
            if (!sel) return;
            let rule = null;
            switch (idx) {
                case 0: {
                    const vals = prompt('Enter allowed values (comma-separated):');
                    if (vals) rule = { type: 'list', values: vals.split(',').map(v => v.trim()) };
                    break;
                }
                case 1: {
                    const min = prompt('Minimum value (leave empty for no min):');
                    const max = prompt('Maximum value (leave empty for no max):');
                    rule = { type: 'number', min: min !== '' ? parseFloat(min) : null, max: max !== '' ? parseFloat(max) : null };
                    break;
                }
                case 2: {
                    const len = prompt('Maximum text length:');
                    if (len) rule = { type: 'text', maxLength: parseInt(len) };
                    break;
                }
                case 3: {
                    const minD = prompt('Start date (YYYY-MM-DD):');
                    const maxD = prompt('End date (YYYY-MM-DD):');
                    rule = { type: 'date', min: minD, max: maxD };
                    break;
                }
                case 4: {
                    const formula = prompt('Custom formula (e.g., =LEN(A1)<=10):');
                    if (formula) rule = { type: 'formula', formula };
                    break;
                }
            }
            if (!rule) return;
            for (let r = sel.minR; r <= sel.maxR; r++) {
                for (let c = sel.minC; c <= sel.maxC; c++) {
                    const key = c + '_' + r;
                    if (this.state.cellData[key]) {
                        if (!this.state.cellData[key].format) this.state.cellData[key].format = {};
                        this.state.cellData[key].format.validation = rule;
                    }
                }
            }
            alert('Data validation rule applied.');
        }

        // ════════════════════════════════════════════════
        //  Remove Duplicates
        // ════════════════════════════════════════════════

        removeDuplicates() {
            if (this.state.selectedCol < 0) return;
            const colIdx = this.state.selectedCol;
            const seen = new Set();
            const rowsToRemove = [];
            for (let r = 0; r < this.state.rows.length; r++) {
                const val = String(this.getCellValue(colIdx, r));
                if (seen.has(val)) {
                    rowsToRemove.push(r);
                } else {
                    seen.add(val);
                }
            }
            if (rowsToRemove.length === 0) { alert('No duplicates found.'); return; }
            if (!confirm('Remove ' + rowsToRemove.length + ' duplicate row(s)?')) return;
            for (const r of rowsToRemove.reverse()) {
                this.state.rows.splice(r, 1);
            }
            alert('Removed ' + rowsToRemove.length + ' duplicate row(s).');
        }

        // ════════════════════════════════════════════════
        //  Show Grid Lines Toggle
        // ════════════════════════════════════════════════

        toggleGridLines() {
            this.state.showGridLines = !this.state.showGridLines;
            const table = document.querySelector('.ls-ss-grid');
            if (table) {
                table.classList.toggle('ls-ss-no-gridlines', !this.state.showGridLines);
            }
        }

        // ════════════════════════════════════════════════
        //  Zoom
        // ════════════════════════════════════════════════

        zoomIn() {
            this.state.zoom = Math.min(200, (this.state.zoom || 100) + 10);
            this._applyZoom();
        }

        zoomOut() {
            this.state.zoom = Math.max(50, (this.state.zoom || 100) - 10);
            this._applyZoom();
        }

        _applyZoom() {
            const grid = document.querySelector('.ls-ss-container');
            if (grid) grid.style.transform = 'scale(' + (this.state.zoom / 100) + ')';
        }

        applyConditionalFormat() {
            if (!this.state.selectedCell) return;
            const sel = this._getSelectionRange();
            if (!sel) return;
            // Simple color scale: green for high, yellow for mid, red for low
            const vals = [];
            for (let r = sel.minR; r <= sel.maxR; r++) {
                for (let c = sel.minC; c <= sel.maxC; c++) {
                    const v = parseFloat(this.getCellValue(c, r));
                    if (!isNaN(v)) vals.push(v);
                }
            }
            if (vals.length === 0) return;
            const min = Math.min(...vals), max = Math.max(...vals);
            const range = max - min || 1;
            for (let r = sel.minR; r <= sel.maxR; r++) {
                for (let c = sel.minC; c <= sel.maxC; c++) {
                    const v = parseFloat(this.getCellValue(c, r));
                    const key = c + '_' + r;
                    if (this.state.cellData[key]) {
                        if (!this.state.cellData[key].format) this.state.cellData[key].format = {};
                        if (!isNaN(v)) {
                            const pct = (v - min) / range;
                            if (pct > 0.66) this.state.cellData[key].format.cf = 'green';
                            else if (pct > 0.33) this.state.cellData[key].format.cf = 'yellow';
                            else this.state.cellData[key].format.cf = 'red';
                        }
                    }
                }
            }
        }

        insertHyperlink() {
            if (!this.state.selectedCell) return;
            const url = prompt('Enter URL:', 'https://');
            if (url) {
                const m = this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);
                if (m) { this.startEditing(colIndex(m[1]), parseInt(m[2]) - 1); this.state.editValue = url; this.commitEdit(); }
            }
        }

        // ══════════════════════════════════════════════════
        //  Undo/Redo
        // ══════════════════════════════════════════════════

        _pushUndo(action) { this.state.undoStack.push(action); this.state.redoStack = []; if (this.state.undoStack.length > 100) this.state.undoStack.shift(); }

        _applyAction(action, isUndo) {
            if (action.type === 'batch') {
                const actions = isUndo ? [...action.actions].reverse() : action.actions;
                for (const subAction of actions) this._applyAction(subAction, isUndo);
                return;
            }
            if (action.type === 'edit') {
                const data = isUndo ? action.oldData : action.newData;
                if (data) this.state.cellData[action.key] = { ...data };
                else delete this.state.cellData[action.key];
            } else if (action.type === 'format') {
                const fmt = isUndo ? action.oldFormat : action.newFormat;
                if (fmt) this.state.cellFormats[action.key] = { ...fmt };
                else delete this.state.cellFormats[action.key];
            } else if (action.type === 'sort') {
                const cd = isUndo ? action.oldCellData : action.newCellData;
                const rows = isUndo ? action.oldRows : action.newRows;
                if (cd) this.state.cellData = JSON.parse(JSON.stringify(cd));
                if (rows) this.state.rows = JSON.parse(JSON.stringify(rows));
            } else if (action.type === 'colWidth') {
                this.state.columns[action.colIdx].width = isUndo ? action.oldWidth : action.newWidth;
            }
        }

        undo() {
            if (this.state.undoStack.length === 0) return;
            const action = this.state.undoStack.pop();
            this.state.redoStack.push(action);
            this._applyAction(action, true);
        }

        redo() {
            if (this.state.redoStack.length === 0) return;
            const action = this.state.redoStack.pop();
            this.state.undoStack.push(action);
            this._applyAction(action, false);
        }

        // ══════════════════════════════════════════════════
        //  Copy/Paste
        // ══════════════════════════════════════════════════

        copySelection() {
            const sel = this._getSelectionRange();
            if (!sel) return;
            const clipboard = [];
            for (let r = sel.minR; r <= sel.maxR; r++) {
                for (let c = sel.minC; c <= sel.maxC; c++) {
                    const cd = this.getCellData(c, r);
                    clipboard.push(cd ? { ...cd } : null);
                }
            }
            this.state.clipboard = clipboard;
            this.state.clipboardCols = sel.maxC - sel.minC + 1;
            this.state.clipboardRows = sel.maxR - sel.minR + 1;
            this.state.clipboardMode = 'copy';
            let text = '';
            for (let r = sel.minR; r <= sel.maxR; r++) {
                const rowVals = [];
                for (let c = sel.minC; c <= sel.maxC; c++) { rowVals.push(String(this.getCellValue(c, r))); }
                text += rowVals.join('\t') + '\n';
            }
            navigator.clipboard?.writeText(text).catch(() => { });
        }

        cutSelection() {
            this.copySelection();
            this.state.clipboardMode = 'cut';
            const sel = this._getSelectionRange();
            if (!sel) return;
            for (let r = sel.minR; r <= sel.maxR; r++) { for (let c = sel.minC; c <= sel.maxC; c++) { this.deleteCellValue(c, r); } }
        }

        pasteClipboard() {
            if (!this.state.selectedCell || this.state.clipboard.length === 0) return;
            const m = this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);
            if (!m) return;
            const startC = colIndex(m[1]), startR = parseInt(m[2]) - 1;
            const cols = this.state.clipboardCols || 1;
            const rows = this.state.clipboardRows || 1;
            let idx = 0;
            
            const batch = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const targetC = startC + c;
                    const targetR = startR + r;
                    if (targetC >= this.state.columns.length || targetR >= this.state.rows.length) {
                        idx++; continue; 
                    }
                    const clipData = this.state.clipboard[idx];
                    const key = targetC + '_' + targetR;
                    const oldData = this.state.cellData[key] ? { ...this.state.cellData[key] } : null;
                    
                    if (clipData) { 
                        this.state.cellData[key] = { ...clipData, formula: null }; 
                        this.state.modifiedCells[key] = { value: clipData.value }; 
                    } else {
                        delete this.state.cellData[key];
                    }
                    const newData = this.state.cellData[key] ? { ...this.state.cellData[key] } : null;
                    batch.push({ type: 'edit', key, oldData, newData, colIdx: targetC, rowIdx: targetR });
                    idx++;
                }
            }
            if (batch.length > 0) this._pushUndo({ type: 'batch', actions: batch });
            if (this.state.clipboardMode === 'cut') {
                this.state.clipboard = [];
                this.state.clipboardMode = null;
            }
        }

        selectAll() { 
            if (this.state.columns.length > 0 && this.state.rows.length > 0) { 
                this.state.isDragging = false;
                this.selectCell(0, 0);
                this.state.dragStart = { col: 0, row: 0 }; 
                this.state.dragEnd = { col: this.state.columns.length - 1, row: this.state.rows.length - 1 }; 
                this._updateStatusCalc();
            } 
        }

        _getSelectionRange() {
            if (this.state.dragStart && this.state.dragEnd) {
                return { minC: Math.min(this.state.dragStart.col, this.state.dragEnd.col), maxC: Math.max(this.state.dragStart.col, this.state.dragEnd.col), minR: Math.min(this.state.dragStart.row, this.state.dragEnd.row), maxR: Math.max(this.state.dragStart.row, this.state.dragEnd.row) };
            }
            if (this.state.selectedCell) {
                const m = this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);
                if (m) { const ci = colIndex(m[1]), ri = parseInt(m[2]) - 1; return { minC: ci, maxC: ci, minR: ri, maxR: ri }; }
            }
            return null;
        }

        // ══════════════════════════════════════════════════
        //  Drag selection
        // ══════════════════════════════════════════════════

        isColSelected(colIdx) {
            if (this.state.selectedCol === colIdx) return true;
            const sel = this._getSelectionRange();
            return sel && colIdx >= sel.minC && colIdx <= sel.maxC;
        }

        isRowSelected(rowIdx) {
            if (this.state.selectedRow === rowIdx) return true;
            const sel = this._getSelectionRange();
            return sel && rowIdx >= sel.minR && rowIdx <= sel.maxR;
        }

        onCellMouseDown(ev, colIdx, rowIdx) { if (ev.target.classList.contains('ls-ss-cell-editor')) return; this.state.isDragging = true; this.state.dragStart = { col: colIdx, row: rowIdx }; this.state.dragEnd = { col: colIdx, row: rowIdx }; }
        onCellMouseMove(ev, colIdx, rowIdx) { if (!this.state.isDragging) return; this.state.dragEnd = { col: colIdx, row: rowIdx }; }
        onCellMouseUp(colIdx, rowIdx) { if (this.state.isDragging) { this.state.dragEnd = { col: colIdx, row: rowIdx }; this.state.isDragging = false; } }

        // ══════════════════════════════════════════════════
        //  Context Menu
        // ══════════════════════════════════════════════════

        onCellContextMenu(ev, colIdx, rowIdx) { this.selectCell(colIdx, rowIdx); this.state.contextMenu = { show: true, x: ev.clientX, y: ev.clientY, type: 'cell', data: { colIdx, rowIdx } }; }
        onColumnContextMenu(ev, colIdx) { this.selectColumn(colIdx); this.state.contextMenu = { show: true, x: ev.clientX, y: ev.clientY, type: 'column', data: { colIdx } }; }
        onRowContextMenu(ev, rowIdx) { this.selectRow(rowIdx); this.state.contextMenu = { show: true, x: ev.clientX, y: ev.clientY, type: 'row', data: { rowIdx } }; }
        onSheetContextMenu(ev, sheetId) { this.state.contextMenu = { show: true, x: ev.clientX, y: ev.clientY, type: 'sheet', data: { sheetId } }; }
        closeContextMenu() { this.state.contextMenu = { show: false, x: 0, y: 0, type: null, data: null }; }

        getContextMenuItems() {
            const t = this.state.contextMenu.type, d = this.state.contextMenu.data;
            if (t === 'cell') return [
                { label: 'Cut', icon: 'scissors', shortcut: 'Ctrl+X', action: () => { this.cutSelection(); this.closeContextMenu(); } },
                { label: 'Copy', icon: 'copy', shortcut: 'Ctrl+C', action: () => { this.copySelection(); this.closeContextMenu(); } },
                { label: 'Paste', icon: 'clipboard', shortcut: 'Ctrl+V', action: () => { this.pasteClipboard(); this.closeContextMenu(); }, disabled: this.state.clipboard.length === 0 },
                { separator: true },
                { label: 'Insert Row Above', icon: 'arrow-up', action: () => { this.insertRowAbove(d.rowIdx); this.closeContextMenu(); } },
                { label: 'Insert Row Below', icon: 'arrow-down', action: () => { this.insertRowBelow(d.rowIdx); this.closeContextMenu(); } },
                { label: 'Delete Row', icon: 'trash-2', action: () => { this.deleteRow(d.rowIdx); this.closeContextMenu(); } },
                { separator: true },
                { label: 'Insert Column Left', icon: 'arrow-left', action: () => { this.insertColumnLeft(d.colIdx); this.closeContextMenu(); } },
                { label: 'Insert Column Right', icon: 'arrow-right', action: () => { this.insertColumnRight(d.colIdx); this.closeContextMenu(); } },
                { label: 'Delete Column', icon: 'trash-2', action: () => { this.deleteColumn(d.colIdx); this.closeContextMenu(); } },
                { separator: true },
                { label: 'Sort A→Z', icon: 'arrow-up-narrow-wide', action: () => { this.sortColumn(d.colIdx, 'asc'); this.closeContextMenu(); } },
                { label: 'Sort Z→A', icon: 'arrow-down-wide-narrow', action: () => { this.sortColumn(d.colIdx, 'desc'); this.closeContextMenu(); } },
                { separator: true },
                { label: 'Bold', icon: 'bold', action: () => { this.toggleFormat('bold'); this.closeContextMenu(); } },
                { label: 'Italic', icon: 'italic', action: () => { this.toggleFormat('italic'); this.closeContextMenu(); } },
                { label: 'Strikethrough', icon: 'strikethrough', action: () => { this.toggleFormat('strikethrough'); this.closeContextMenu(); } },
                { label: 'Clear Cell', icon: 'eraser', action: () => { this.deleteCellValue(d.colIdx, d.rowIdx); this.closeContextMenu(); } },
            ];
            if (t === 'column') return [
                { label: 'Sort A→Z', icon: 'arrow-up-narrow-wide', action: () => { this.sortColumn(d.colIdx, 'asc'); this.closeContextMenu(); } },
                { label: 'Sort Z→A', icon: 'arrow-down-wide-narrow', action: () => { this.sortColumn(d.colIdx, 'desc'); this.closeContextMenu(); } },
                { separator: true },
                { label: 'Insert Column Left', icon: 'arrow-left', action: () => { this.insertColumnLeft(d.colIdx); this.closeContextMenu(); } },
                { label: 'Insert Column Right', icon: 'arrow-right', action: () => { this.insertColumnRight(d.colIdx); this.closeContextMenu(); } },
                { label: 'Delete Column', icon: 'trash-2', action: () => { this.deleteColumn(d.colIdx); this.closeContextMenu(); } },
                { separator: true },
                { label: 'Hide Column', icon: 'eye-off', action: () => { this.hideColumn(d.colIdx); this.closeContextMenu(); } },
                { label: 'Auto-fit Width', icon: 'maximize-2', action: () => { this.autoFitColumn(d.colIdx); this.closeContextMenu(); } },
            ];
            if (t === 'row') return [
                { label: 'Insert Row Above', icon: 'arrow-up', action: () => { this.insertRowAbove(d.rowIdx); this.closeContextMenu(); } },
                { label: 'Insert Row Below', icon: 'arrow-down', action: () => { this.insertRowBelow(d.rowIdx); this.closeContextMenu(); } },
                { label: 'Delete Row', icon: 'trash-2', action: () => { this.deleteRow(d.rowIdx); this.closeContextMenu(); } },
            ];
            if (t === 'sheet') return [
                { label: 'Rename', icon: 'edit', action: () => { this.renameSheet(d.sheetId); this.closeContextMenu(); } },
                { label: 'Duplicate', icon: 'copy', action: () => { this.duplicateSheet(d.sheetId); this.closeContextMenu(); } },
                { separator: true },
                { label: 'Delete', icon: 'trash-2', action: () => { this.deleteSheet(d.sheetId); this.closeContextMenu(); }, disabled: this.state.sheets.length <= 1 },
            ];
            return [];
        }

        // ══════════════════════════════════════════════════
        //  Column/Row Operations
        // ══════════════════════════════════════════════════

        _shiftCols(startColIdx, offset) {
            const newCellData = {};
            const newCellFormats = {};
            const minCol = offset < 0 ? startColIdx + offset : startColIdx;
            
            for (const key in this.state.cellData) {
                const [cStr, rStr] = key.split('_');
                const c = parseInt(cStr), r = parseInt(rStr);
                if (c >= startColIdx) {
                    const newC = c + offset;
                    if (newC >= minCol) newCellData[newC + '_' + r] = this.state.cellData[key];
                } else if (c < minCol) {
                    newCellData[key] = this.state.cellData[key];
                }
            }
            for (const key in this.state.cellFormats) {
                const [cStr, rStr] = key.split('_');
                const c = parseInt(cStr), r = parseInt(rStr);
                if (c >= startColIdx) {
                    const newC = c + offset;
                    if (newC >= minCol) newCellFormats[newC + '_' + r] = this.state.cellFormats[key];
                } else if (c < minCol) {
                    newCellFormats[key] = this.state.cellFormats[key];
                }
            }
            this.state.cellData = newCellData;
            this.state.cellFormats = newCellFormats;
            this._clearIntersectingMerges(startColIdx, offset, true);
        }

        _shiftRows(startRowIdx, offset) {
            const newCellData = {};
            const newCellFormats = {};
            const minRow = offset < 0 ? startRowIdx + offset : startRowIdx;
            
            for (const key in this.state.cellData) {
                const [cStr, rStr] = key.split('_');
                const c = parseInt(cStr), r = parseInt(rStr);
                if (r >= startRowIdx) {
                    const newR = r + offset;
                    if (newR >= minRow) newCellData[c + '_' + newR] = this.state.cellData[key];
                } else if (r < minRow) {
                    newCellData[key] = this.state.cellData[key];
                }
            }
            for (const key in this.state.cellFormats) {
                const [cStr, rStr] = key.split('_');
                const c = parseInt(cStr), r = parseInt(rStr);
                if (r >= startRowIdx) {
                    const newR = r + offset;
                    if (newR >= minRow) newCellFormats[c + '_' + newR] = this.state.cellFormats[key];
                } else if (r < minRow) {
                    newCellFormats[key] = this.state.cellFormats[key];
                }
            }
            this.state.cellData = newCellData;
            this.state.cellFormats = newCellFormats;
            this._clearIntersectingMerges(startRowIdx, offset, false);
        }

        _clearIntersectingMerges(startIdx, offset, isCol) {
            const minIdx = offset < 0 ? startIdx + offset : startIdx;
            for (const key in this.state.mergedCells) {
                const m = this.state.mergedCells[key];
                const mStart = isCol ? m.minC : m.minR;
                const mEnd = isCol ? m.maxC : m.maxR;
                if (mStart >= startIdx) {
                    if (isCol) { m.minC += offset; m.maxC += offset; }
                    else { m.minR += offset; m.maxR += offset; }
                } else if (mEnd >= minIdx) {
                    delete this.state.mergedCells[key];
                }
            }
        }

        insertColumnLeft(colIdx) { this.state.columns.splice(colIdx, 0, { idx: colIdx, name: 'new_' + Date.now(), letter: colLetter(colIdx), label: 'New', width: this.state.viewDef.column_width || 120, hidden: false }); this._shiftCols(colIdx, 1); this._reindexColumns(); }
        insertColumnRight(colIdx) { this.state.columns.splice(colIdx + 1, 0, { idx: colIdx + 1, name: 'new_' + Date.now(), letter: colLetter(colIdx + 1), label: 'New', width: this.state.viewDef.column_width || 120, hidden: false }); this._shiftCols(colIdx + 1, 1); this._reindexColumns(); }
        deleteColumn(colIdx) { if (this.state.columns.length <= 1) return; this.state.columns.splice(colIdx, 1); this._shiftCols(colIdx + 1, -1); this._reindexColumns(); }
        hideColumn(colIdx) { if (this.state.columns[colIdx]) this.state.columns[colIdx].hidden = true; }
        autoFitColumn(colIdx) { let maxLen = 50; const col = this.state.columns[colIdx]; if (!col) return; maxLen = Math.max(maxLen, col.label.length * 8 + 20); for (let r = 0; r < Math.min(this.state.rows.length, 100); r++) { maxLen = Math.max(maxLen, String(this.getCellValue(colIdx, r)).length * 7 + 20); } this.state.columns[colIdx].width = Math.min(maxLen, 400); }
        insertRowAbove(rowIdx) { this.state.rows.splice(rowIdx, 0, { idx: rowIdx, record: null }); this._shiftRows(rowIdx, 1); this._reindexRows(); }
        insertRowBelow(rowIdx) { this.state.rows.splice(rowIdx + 1, 0, { idx: rowIdx + 1, record: null }); this._shiftRows(rowIdx + 1, 1); this._reindexRows(); }
        deleteRow(rowIdx) { if (this.state.rows.length <= 1) return; this.state.rows.splice(rowIdx, 1); this._shiftRows(rowIdx + 1, -1); this._reindexRows(); }
        _reindexColumns() { this.state.columns.forEach((c, i) => { c.idx = i; c.letter = colLetter(i); }); }
        _reindexRows() { this.state.rows.forEach((r, i) => { r.idx = i; }); }

        // ══════════════════════════════════════════════════
        //  Sort
        // ══════════════════════════════════════════════════

        sortColumn(colIdx, direction) {
            const col = this.state.columns[colIdx];
            if (!col) return;
            const fDef = this.state.fields[col.name];
            const isNumeric = fDef && ['integer', 'float', 'monetary'].includes(fDef.type);
            const dataRows = this.state.rows.filter(r => r.record);
            const emptyRows = this.state.rows.filter(r => !r.record);
            const oldCellData = { ...this.state.cellData };
            const oldRows = [...this.state.rows];
            dataRows.sort((a, b) => {
                const valA = this.getCellValue(colIdx, a.idx), valB = this.getCellValue(colIdx, b.idx);
                if (isNumeric) { return direction === 'asc' ? (parseFloat(valA) || 0) - (parseFloat(valB) || 0) : (parseFloat(valB) || 0) - (parseFloat(valA) || 0); }
                return direction === 'asc' ? String(valA).toLowerCase().localeCompare(String(valB).toLowerCase()) : String(valB).toLowerCase().localeCompare(String(valA).toLowerCase());
            });
            this.state.rows = [...dataRows, ...emptyRows];
            this._reindexRows();
            const newData = {};
            for (const row of this.state.rows) {
                for (const c of this.state.columns) {
                    if (row.record) {
                        for (const origRow of oldRows) {
                            if (origRow.record && origRow.record.id === row.record.id) {
                                const origKey = c.idx + '_' + origRow.idx;
                                if (oldCellData[origKey]) newData[c.idx + '_' + row.idx] = { ...oldCellData[origKey] };
                                break;
                            }
                        }
                    }
                }
            }
            this.state.cellData = newData;
            this.state.sortCol = colIdx;
            this.state.sortDir = direction;
            this._pushUndo({ type: 'sort', oldCellData, oldRows, newCellData: { ...newData }, newRows: [...this.state.rows] });
        }

        // ══════════════════════════════════════════════════
        //  Freeze Panes
        // ══════════════════════════════════════════════════

        toggleFreeze() {
            if (this.state.freezeCol >= 0 || this.state.freezeRow >= 0) { this.state.freezeCol = -1; this.state.freezeRow = -1; }
            else if (this.state.selectedCell) {
                const m = this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);
                if (m) { this.state.freezeCol = colIndex(m[1]); this.state.freezeRow = parseInt(m[2]) - 2; }
            }
        }

        getStickyLeft(colIdx) { let left = 50; for (let i = 0; i < colIdx; i++) left += this.state.columns[i]?.width || 120; return left; }
        getStickyTop(rowIdx) { return 28; }

        // ══════════════════════════════════════════════════
        //  Charts
        // ══════════════════════════════════════════════════

        addChart() {
            this.state.chartForm = {
                type: 'bar', title: 'Chart', labelCol: 0, dataCols: [1],
                stacked: false, horizontal: false, showLegend: true,
                colors: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'],
            };
            this.state.chartDialog = { show: true, editingId: null };
            setTimeout(() => this._renderChartPreview(), 100);
        }

        editChart(chartId) {
            const chart = this.state.charts.find(c => c.id === chartId);
            if (!chart) return;
            this.state.chartForm = {
                type: chart.type,
                title: chart.title,
                labelCol: chart.labelCol,
                dataCols: [...chart.dataCols],
                stacked: chart.stacked || false,
                horizontal: chart.horizontal || false,
                showLegend: chart.showLegend !== false,
                colors: [...(chart.colors || ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'])],
            };
            this.state.chartDialog = { show: true, editingId: chartId };
            setTimeout(() => this._renderChartPreview(), 100);
        }

        closeChartDialog() {
            this.state.chartDialog = { show: false, editingId: null };
        }

        addSeries() {
            const nextCol = this.state.chartForm.dataCols.length > 0
                ? Math.max(...this.state.chartForm.dataCols) + 1
                : 1;
            if (nextCol < this.state.columns.length) {
                this.state.chartForm.dataCols.push(nextCol);
                setTimeout(() => this._renderChartPreview(), 50);
            }
        }

        removeSeries(idx) {
            if (this.state.chartForm.dataCols.length > 1) {
                this.state.chartForm.dataCols.splice(idx, 1);
                setTimeout(() => this._renderChartPreview(), 50);
            }
        }

        saveChart() {
            const form = this.state.chartForm;
            const existingChart = this.state.chartDialog.editingId
                ? this.state.charts.find(c => c.id === this.state.chartDialog.editingId)
                : null;

            const chartData = {
                id: this.state.chartDialog.editingId || 'chart_' + Date.now(),
                type: form.type,
                title: form.title || 'Chart',
                labelCol: form.labelCol,
                dataCols: [...form.dataCols],
                stacked: form.stacked,
                horizontal: form.horizontal,
                showLegend: form.showLegend,
                colors: [...form.colors],
                x: existingChart?.x || 20 + this.state.charts.length * 30,
                y: existingChart?.y || 20 + this.state.charts.length * 30,
                width: existingChart?.width || 480,
            };

            if (this.state.chartDialog.editingId) {
                const idx = this.state.charts.findIndex(c => c.id === this.state.chartDialog.editingId);
                if (idx >= 0) this.state.charts[idx] = chartData;
            } else {
                this.state.charts.push(chartData);
            }

            this.closeChartDialog();
            setTimeout(() => this._renderAllCharts(), 100);
        }

        removeChart(chartId) {
            if (!confirm('Remove this chart?')) return;
            this.state.charts = this.state.charts.filter(c => c.id !== chartId);
        }

        onChartMouseDown(ev, chartId) {
            if (ev.target.closest('.ls-ss-chart-btn') || ev.target.closest('.ls-ss-chart-close')) return;
            const chart = this.state.charts.find(c => c.id === chartId);
            if (!chart) return;

            const startX = ev.clientX;
            const startY = ev.clientY;
            const startLeft = chart.x || 20;
            const startTop = chart.y || 20;

            const onMove = (e) => {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                chart.x = Math.max(0, startLeft + dx);
                chart.y = Math.max(0, startTop + dy);
            };

            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        }

        resizeChart(chartId) {
            const chart = this.state.charts.find(c => c.id === chartId);
            if (!chart) return;
            const sizes = [360, 480, 600, 720];
            const currentIdx = sizes.indexOf(chart.width);
            chart.width = sizes[(currentIdx + 1) % sizes.length];
            setTimeout(() => this._renderAllCharts(), 50);
        }

        _renderAllCharts() {
            this.state.charts.forEach(chart => {
                const canvas = document.getElementById(chart.id);
                if (canvas) this._renderChartOnCanvas(canvas, chart);
            });
        }

        _renderChartPreview() {
            const canvas = document.getElementById('chartPreviewCanvas');
            if (!canvas) return;
            const form = this.state.chartForm;
            this._renderChartOnCanvas(canvas, {
                type: form.type, title: form.title, labelCol: form.labelCol,
                dataCols: form.dataCols, stacked: form.stacked, horizontal: form.horizontal,
                showLegend: form.showLegend, colors: form.colors,
            });
        }

        _getChartData(chart) {
            const labels = [];
            const seriesData = [];
            const labelCol = chart.labelCol || 0;

            // Get labels from labelCol
            for (let r = 0; r < Math.min(this.state.rows.length, 50); r++) {
                const val = this.getCellValue(labelCol, r);
                if (val !== '' && val !== null && val !== undefined) {
                    labels.push(String(val).substring(0, 20));
                }
            }

            // Get data for each series
            for (const dataCol of (chart.dataCols || [])) {
                const values = [];
                for (let r = 0; r < labels.length; r++) {
                    values.push(parseFloat(this.getCellValue(dataCol, r)) || 0);
                }
                seriesData.push(values);
            }

            return { labels, seriesData };
        }

        _renderChartOnCanvas(canvas, chart) {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.parentElement.getBoundingClientRect();
            const w = rect.width || 500;
            const h = 300;

            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.scale(dpr, dpr);

            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, w, h);

            const { labels, seriesData } = this._getChartData(chart);
            if (labels.length === 0) {
                ctx.fillStyle = '#999';
                ctx.font = '14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('No data available', w / 2, h / 2);
                return;
            }

            const colors = chart.colors || ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
            const padding = { top: 45, right: 20, bottom: 60, left: 55 };
            const chartW = w - padding.left - padding.right;
            const chartH = h - padding.top - padding.bottom;

            // Find max value
            let maxVal = 0;
            for (const series of seriesData) {
                for (const v of series) { if (v > maxVal) maxVal = v; }
            }
            if (maxVal === 0) maxVal = 1;
            maxVal = maxVal * 1.1; // 10% headroom

            // Title
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(chart.title, w / 2, 25);

            if (chart.type === 'pie' || chart.type === 'doughnut') {
                this._drawPieChart(ctx, w, h, padding, labels, seriesData[0] || [], colors, chart.type === 'doughnut');
                return;
            }

            if (chart.horizontal) {
                this._drawHorizontalBar(ctx, w, h, padding, chartW, chartH, maxVal, labels, seriesData, colors, chart);
                return;
            }

            // Grid lines (vertical axis)
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 5; i++) {
                const y = padding.top + (chartH / 5) * i;
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(w - padding.right, y);
                ctx.stroke();
                ctx.fillStyle = '#94a3b8';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'right';
                const val = Math.round(maxVal * (1 - i / 5));
                ctx.fillText(val.toLocaleString(), padding.left - 8, y + 4);
            }

            const numLabels = labels.length;
            const numSeries = seriesData.length;
            const groupWidth = chartW / numLabels;
            const barWidth = chart.stacked
                ? groupWidth * 0.6
                : (groupWidth * 0.6) / numSeries;
            const barGap = groupWidth * 0.1;

            // Draw bars
            labels.forEach((label, li) => {
                const groupX = padding.left + li * groupWidth;
                let stackY = 0;

                seriesData.forEach((series, si) => {
                    const val = series[li] || 0;
                    const barH = (val / maxVal) * chartH;
                    const color = colors[si % colors.length];

                    ctx.fillStyle = color;

                    if (chart.stacked) {
                        const x = groupX + barGap;
                        const y = padding.top + chartH - stackY - barH;
                        ctx.fillRect(x, y, barWidth, barH);
                        // Value label on bar
                        if (barH > 14) {
                            ctx.fillStyle = '#fff';
                            ctx.font = 'bold 10px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.fillText(val, x + barWidth / 2, y + barH / 2 + 3);
                        }
                        stackY += barH;
                    } else {
                        const x = groupX + barGap + si * barWidth;
                        const y = padding.top + chartH - barH;
                        // Rounded top
                        const r = Math.min(4, barWidth / 2, barH / 2);
                        this._roundedRect(ctx, x, y, barWidth - 1, barH, r, r, 0, 0);
                        // Value label
                        if (barH > 14) {
                            ctx.fillStyle = '#fff';
                            ctx.font = 'bold 10px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.fillText(val, x + barWidth / 2, y + barH / 2 + 3);
                        }
                    }
                });

                // X-axis label
                ctx.save();
                const labelX = groupX + groupWidth / 2;
                const labelY = padding.top + chartH + 12;
                ctx.translate(labelX, labelY);
                ctx.rotate(-Math.PI / 5);
                ctx.fillStyle = '#64748b';
                ctx.font = '11px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(label.substring(0, 15), 0, 0);
                ctx.restore();
            });

            // Draw lines (for line chart overlay)
            if (chart.type === 'line') {
                seriesData.forEach((series, si) => {
                    const color = colors[si % colors.length];
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    series.forEach((val, li) => {
                        const x = padding.left + li * groupWidth + groupWidth / 2;
                        const y = padding.top + chartH - (val / maxVal) * chartH;
                        if (li === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    });
                    ctx.stroke();
                    // Draw dots
                    series.forEach((val, li) => {
                        const x = padding.left + li * groupWidth + groupWidth / 2;
                        const y = padding.top + chartH - (val / maxVal) * chartH;
                        ctx.fillStyle = '#fff';
                        ctx.beginPath();
                        ctx.arc(x, y, 4, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    });
                });
            }

            // Legend
            if (chart.showLegend && numSeries > 0) {
                const legendY = 35;
                let legendX = w - padding.right;
                ctx.textAlign = 'right';
                ctx.font = '11px sans-serif';

                for (let si = numSeries - 1; si >= 0; si--) {
                    const label = this.state.columns[chart.dataCols[si]]?.label || 'Series ' + (si + 1);
                    const textW = ctx.measureText(label).width;
                    legendX -= textW;
                    ctx.fillStyle = '#64748b';
                    ctx.fillText(label, legendX, legendY);
                    legendX -= 16;
                    ctx.fillStyle = colors[si % colors.length];
                    ctx.fillRect(legendX, legendY - 9, 12, 12);
                    legendX -= 8;
                }
            }
        }

        _drawHorizontalBar(ctx, w, h, padding, chartW, chartH, maxVal, labels, seriesData, colors, chart) {
            const numLabels = labels.length;
            const numSeries = seriesData.length;
            const groupHeight = chartH / numLabels;
            const barHeight = chart.stacked
                ? groupHeight * 0.6
                : (groupHeight * 0.6) / numSeries;
            const barGap = groupHeight * 0.2;

            // Vertical grid
            for (let i = 0; i <= 5; i++) {
                const x = padding.left + (chartW / 5) * i;
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, padding.top);
                ctx.lineTo(x, h - padding.bottom);
                ctx.stroke();
                ctx.fillStyle = '#94a3b8';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(Math.round(maxVal * i / 5).toLocaleString(), x, h - padding.bottom + 15);
            }

            labels.forEach((label, li) => {
                const groupY = padding.top + li * groupHeight;
                let stackX = 0;

                seriesData.forEach((series, si) => {
                    const val = series[li] || 0;
                    const barW = (val / maxVal) * chartW;
                    const color = colors[si % colors.length];
                    ctx.fillStyle = color;

                    if (chart.stacked) {
                        const y = groupY + barGap;
                        ctx.fillRect(padding.left + stackX, y, barW, barHeight);
                        stackX += barW;
                    } else {
                        const y = groupY + barGap + si * barHeight;
                        const r = Math.min(3, barHeight / 2, barW / 2);
                        this._roundedRect(ctx, padding.left, y, barW, barHeight - 1, 0, r, r, 0);
                    }
                });

                // Y label
                ctx.fillStyle = '#64748b';
                ctx.font = '11px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(label.substring(0, 20), padding.left - 8, groupY + groupHeight / 2 + 4);
            });
        }

        _drawPieChart(ctx, w, h, padding, labels, values, colors, isDoughnut) {
            const total = values.reduce((s, v) => s + Math.abs(v), 0);
            if (total === 0) return;

            const centerX = w / 2 - 40;
            const centerY = h / 2 + 10;
            const radius = Math.min(w, h) / 2 - 60;
            const innerRadius = isDoughnut ? radius * 0.55 : 0;

            let startAngle = -Math.PI / 2;
            values.forEach((val, i) => {
                if (val <= 0) return;
                const sliceAngle = (val / total) * Math.PI * 2;
                const color = colors[i % colors.length];

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(
                    centerX + innerRadius * Math.cos(startAngle),
                    centerY + innerRadius * Math.sin(startAngle)
                );
                ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
                ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
                ctx.closePath();
                ctx.fill();

                // Percentage label
                const midAngle = startAngle + sliceAngle / 2;
                const pct = ((val / total) * 100).toFixed(1);
                if (parseFloat(pct) > 3) {
                    const lx = centerX + (radius * 0.75) * Math.cos(midAngle);
                    const ly = centerY + (radius * 0.75) * Math.sin(midAngle);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 11px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(pct + '%', lx, ly + 4);
                }

                startAngle += sliceAngle;
            });

            // Legend (right side)
            if (labels.length > 0) {
                const legendX = w - 100;
                let legendY = padding.top + 10;
                ctx.font = '11px sans-serif';
                ctx.textAlign = 'left';
                labels.forEach((label, i) => {
                    if (i >= values.length || values[i] <= 0) return;
                    ctx.fillStyle = colors[i % colors.length];
                    ctx.fillRect(legendX, legendY - 8, 12, 12);
                    ctx.fillStyle = '#475569';
                    ctx.fillText(label.substring(0, 15), legendX + 18, legendY + 2);
                    legendY += 20;
                });
            }
        }

        _roundedRect(ctx, x, y, w, h, tl, tr, br, bl) {
            ctx.beginPath();
            ctx.moveTo(x + tl, y);
            ctx.lineTo(x + w - tr, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
            ctx.lineTo(x + w, y + h - br);
            ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
            ctx.lineTo(x + bl, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
            ctx.lineTo(x, y + tl);
            ctx.quadraticCurveTo(x, y, x + tl, y);
            ctx.closePath();
            ctx.fill();
        }

        // ══════════════════════════════════════════════════
        //  Column resize
        // ══════════════════════════════════════════════════

        onColResizeStart(ev, colIdx) {
            ev.preventDefault();
            this.state.resizeStartX = ev.clientX;
            this.state.resizeStartWidth = this.state.columns[colIdx].width;
            const oldWidth = this.state.columns[colIdx].width;
            const onMove = (e) => { this.state.columns[colIdx].width = Math.max(60, this.state.resizeStartWidth + (e.clientX - this.state.resizeStartX)); };
            const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); this._pushUndo({ type: 'colWidth', colIdx, oldWidth, newWidth: this.state.columns[colIdx].width }); };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        }

        // ══════════════════════════════════════════════════
        //  Aggregation
        // ══════════════════════════════════════════════════

        getAggregation(colIdx) {
            const col = this.state.columns[colIdx];
            if (!col) return '';
            const fDef = this.state.fields[col.name];
            if (!fDef || !['integer', 'float', 'monetary'].includes(fDef.type)) return '';
            let sum = 0, count = 0;
            for (const row of this.state.rows) { const val = parseFloat(this.getCellValue(colIdx, row.idx)); if (!isNaN(val)) { sum += val; count++; } }
            if (count === 0) return '';
            const aggType = this.state.viewDef.aggregation || 'sum';
            if (aggType === 'avg') return (sum / count).toFixed(2);
            if (aggType === 'count') return count;
            return Math.round(sum * 100) / 100;
        }

        // ══════════════════════════════════════════════════
        //  Sheets
        // ══════════════════════════════════════════════════

        _saveCurrentSheetData() {
            this.state.sheetData[this.state.activeSheet] = {
                cellData: { ...this.state.cellData },
                cellFormats: { ...this.state.cellFormats },
                mergedCells: { ...this.state.mergedCells },
                charts: JSON.parse(JSON.stringify(this.state.charts)),
                columns: JSON.parse(JSON.stringify(this.state.columns)),
            };
        }

        _loadSheetData(sheetId) {
            const d = this.state.sheetData[sheetId];
            if (d) {
                this.state.cellData = d.cellData || {};
                this.state.cellFormats = d.cellFormats || {};
                this.state.mergedCells = d.mergedCells || {};
                this.state.charts = d.charts || [];
                if (d.columns && d.columns.length > 0) this.state.columns = d.columns;
            } else {
                this.state.cellData = {};
                this.state.cellFormats = {};
                this.state.mergedCells = {};
                this.state.charts = [];
            }
        }

        setActiveSheet(sheetId) {
            if (sheetId === this.state.activeSheet) return;
            this._saveCurrentSheetData();
            this.state.activeSheet = sheetId;
            this._loadSheetData(sheetId);
        }

        addSheet() {
            this._saveCurrentSheetData();
            const id = 'sheet' + (this.state.sheets.length + 1);
            this.state.sheets.push({ id, name: 'Sheet' + this.state.sheets.length });
            this.state.activeSheet = id;
            this.state.cellData = {};
            this.state.cellFormats = {};
            this.state.mergedCells = {};
            this.state.charts = [];
        }

        renameSheet(sheetId) {
            const s = this.state.sheets.find(s => s.id === sheetId);
            if (!s) return;
            const n = prompt('Rename:', s.name);
            if (n) s.name = n;
        }

        duplicateSheet(sheetId) {
            this._saveCurrentSheetData();
            const s = this.state.sheets.find(s => s.id === sheetId);
            if (!s) return;
            const newId = 'sheet' + (this.state.sheets.length + 1);
            this.state.sheets.push({ id: newId, name: s.name + ' (Copy)' });
            const srcData = this.state.sheetData[sheetId] || {};
            this.state.sheetData[newId] = {
                cellData: JSON.parse(JSON.stringify(srcData.cellData || this.state.cellData)),
                cellFormats: JSON.parse(JSON.stringify(srcData.cellFormats || this.state.cellFormats)),
                mergedCells: JSON.parse(JSON.stringify(srcData.mergedCells || this.state.mergedCells)),
                charts: JSON.parse(JSON.stringify(srcData.charts || this.state.charts)),
                columns: JSON.parse(JSON.stringify(srcData.columns || this.state.columns)),
            };
        }

        deleteSheet(sheetId) {
            if (this.state.sheets.length <= 1) return;
            if (!confirm('Delete sheet?')) return;
            this.state.sheets = this.state.sheets.filter(s => s.id !== sheetId);
            delete this.state.sheetData[sheetId];
            if (this.state.activeSheet === sheetId) {
                this.state.activeSheet = this.state.sheets[0].id;
                this._loadSheetData(this.state.activeSheet);
            }
        }

        // ══════════════════════════════════════════════════
        //  Export
        // ══════════════════════════════════════════════════

        exportCSV() {
            let csv = this.state.columns.filter(c => !c.hidden).map(c => '"' + c.label.replace(/"/g, '""') + '"').join(',') + '\n';
            for (const row of this.state.rows) { if (!row.record) continue; csv += this.state.columns.filter(c => !c.hidden).map(col => '"' + String(this.getCellValue(col.idx, row.idx)).replace(/"/g, '""') + '"').join(',') + '\n'; }
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = (this.props.actionTitle || 'spreadsheet') + '.csv'; link.click();
        }

        exportExcel() {
            let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8"></head><body><table border="1">';
            html += '<tr>' + this.state.columns.filter(c => !c.hidden).map(c => '<th style="background:#4f46e5;color:#fff;font-weight:bold;padding:6px 12px">' + esc(c.label) + '</th>').join('') + '</tr>';
            for (const row of this.state.rows) { if (!row.record) continue; html += '<tr>' + this.state.columns.filter(c => !c.hidden).map(col => '<td style="padding:4px 8px">' + esc(String(this.getCellValue(col.idx, row.idx))) + '</td>').join('') + '</tr>'; }
            html += '</table></body></html>';
            const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
            const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = (this.props.actionTitle || 'spreadsheet') + '.xls'; link.click();
        }

        async saveData() {
            try {
                // 1. Save cell modifications to ORM if linked to records
                const keys = Object.keys(this.state.modifiedCells || {});
                for (const key of keys) {
                    const cellInfo = this.state.modifiedCells[key];
                    if (cellInfo && cellInfo.recordId && cellInfo.fieldName) {
                        await RPC.write(this._model, [cellInfo.recordId], { [cellInfo.fieldName]: cellInfo.value });
                    }
                }
                this.state.modifiedCells = {};

                // 2. Save full spreadsheet state as JSON document
                this._saveCurrentSheetData();
                const stateData = {
                    sheetData: this.state.sheetData,
                    sheets: this.state.sheets,
                    activeSheet: this.state.activeSheet,
                    cellData: this.state.cellData,
                    cellFormats: this.state.cellFormats,
                    mergedCells: this.state.mergedCells,
                    charts: this.state.charts,
                };

                const docName = (this.props.actionTitle || this._model) + ' Spreadsheet';
                if (this._currentDocId) {
                    await RPC.write('spreadsheet.document', [this._currentDocId], {
                        name: docName,
                        spreadsheet_data: JSON.stringify(stateData),
                        raw_data: stateData,
                    });
                } else {
                    const existingDocs = await RPC.searchRead('spreadsheet.document', [['parent_model', '=', this._model]], { limit: 1 });
                    if (existingDocs && existingDocs.records && existingDocs.records.length > 0) {
                        this._currentDocId = existingDocs.records[0].id;
                        await RPC.write('spreadsheet.document', [this._currentDocId], {
                            name: docName,
                            spreadsheet_data: JSON.stringify(stateData),
                            raw_data: stateData,
                        });
                    } else {
                        const newDoc = await RPC.create('spreadsheet.document', {
                            name: docName,
                            parent_model: this._model,
                            spreadsheet_data: JSON.stringify(stateData),
                            raw_data: stateData,
                            user_id: 1,
                        });
                        if (newDoc && newDoc.id) this._currentDocId = newDoc.id;
                    }
                }

                if (window.AdvSoftToast) {
                    window.AdvSoftToast.success('Spreadsheet saved successfully');
                } else {
                    alert('Spreadsheet saved successfully');
                }
            } catch (e) {
                if (window.AdvSoftToast) {
                    window.AdvSoftToast.error('Save failed: ' + e.message);
                } else {
                    alert('Save failed: ' + e.message);
                }
            }
        }

        async loadSpreadsheet(docId) {
            if (!this.engine || !this.engine.isInitialized) return;
            try {
                const record = await RPC.read('spreadsheet.document', docId);
                if (record && record.spreadsheet_data) {
                    const data = typeof record.spreadsheet_data === 'string'
                        ? JSON.parse(record.spreadsheet_data)
                        : record.spreadsheet_data;
                    if (data.sheetData) {
                        this.state.sheetData = data.sheetData;
                    } else {
                        // Legacy format: single sheet
                        this.state.sheetData = {
                            sheet1: {
                                cellData: data.cells || {},
                                cellFormats: {},
                                mergedCells: data.mergedCells || {},
                                charts: data.charts || [],
                                columns: data.columns || [],
                            }
                        };
                    }
                    if (data.sheets) this.state.sheets = data.sheets;
                    if (data.activeSheet) this.state.activeSheet = data.activeSheet;
                    this._loadSheetData(this.state.activeSheet);
                    this.engine.loadFromJSON(data);
                }
            } catch (e) {
                console.error('Load spreadsheet error:', e);
            }
        }

        async refreshData() { await this.loadData(); }
    }

    window.SpreadsheetView = SpreadsheetView;
})();
