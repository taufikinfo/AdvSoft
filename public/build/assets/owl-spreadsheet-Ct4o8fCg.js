(function(){class e{constructor(e={}){this._config=e,this.model=null,this.plugins=null,this.navigation=null,this.contextMenuBuilder=null,this.findReplace=null,this.document=null,this.sheetManager=null,this.conditionalFormatting=null,this.dataValidation=null,this.exporter=null,this.collaboration=null,this._initialized=!1}get isInitialized(){return this._initialized}init(e={}){this._initialized||=(this._config={...this._config,...e},this.model=new window.SpreadsheetModel({defaultColWidth:this._config.defaultColWidth||100,defaultRowHeight:this._config.defaultRowHeight||28,maxRows:this._config.maxRows||1e4,maxCols:this._config.maxCols||702}),this.sheetManager=new window.SpreadsheetSheetManager(this.model),this.navigation=new window.SpreadsheetKeyboardNavigation(this.model),this.contextMenuBuilder=new window.SpreadsheetContextMenuBuilder(this.model),this.findReplace=new window.SpreadsheetFindReplace(this.model),this.conditionalFormatting=new window.SpreadsheetConditionalFormattingManager(this.model),this.dataValidation=new window.SpreadsheetDataValidationManager(this.model),this.exporter=new window.SpreadsheetExport(this.model),this.document=new window.SpreadsheetDocument,this._config.collaboration&&(this.collaboration=new window.SpreadsheetCollaborationBus(this._config.collaboration)),this.plugins=window.SpreadsheetPluginRegistryInstance,this.plugins.createAll(this.model),this.plugins.setupAll(),this.navigation.setup(),this._setupEventHandlers(),!0)}_setupEventHandlers(){this.navigation.on(`copy`,e=>this._handleCopy(e)),this.navigation.on(`paste`,e=>this._handlePaste(e)),this.navigation.on(`cut`,e=>this._handleCut(e)),this.navigation.on(`deleteSelection`,e=>this._handleDeleteSelection(e)),this.navigation.on(`clearAndEdit`,e=>this._handleClearAndEdit(e)),this.navigation.on(`toggleFormat`,e=>this._handleToggleFormat(e)),this.navigation.on(`openFind`,()=>this._handleOpenFind()),this.navigation.on(`openFindReplace`,()=>this._handleOpenFindReplace()),this.navigation.on(`moved`,e=>this._handleCellMoved(e)),this.navigation.on(`editModeChanged`,e=>this._handleEditModeChanged(e))}loadData(e,t){this.model.clearAll();let n=t||Object.keys(this._config.fieldDefs||{});for(let e=0;e<n.length;e++)this.model.setCellRaw(e,0,n[e]),this.model.setCellFormat(e,0,`bold`,!0),this.model.setCellFormat(e,0,`bgColor`,`#f3f4f6`);for(let t=0;t<e.length;t++){let r=e[t];for(let e=0;e<n.length;e++){let i=r[n[e]];i!=null&&this.model.setCellRaw(e,t+1,String(i))}}}loadFromJSON(e){if(e.cells)for(let[t,n]of Object.entries(e.cells)){let e=t.split(`:`);if(e.length===3){let t=e[0],r=parseInt(e[1],10),i=parseInt(e[2],10);if(t===this.model.activeSheetId){let e=window.SpreadsheetCell.fromJSON(n);this.model.setCellRaw(r,i,e.raw),e.format&&this.model.setCellFormats(r,i,e.format)}}}if(e.sheets&&this.sheetManager.importJSON(e),e.colWidths)for(let[t,n]of Object.entries(e.colWidths))this.model.setColWidth(parseInt(t,10),n);if(e.rowHeights)for(let[t,n]of Object.entries(e.rowHeights))this.model.setRowHeight(parseInt(t,10),n)}saveToJSON(){return this.model.toJSON()}async save(){let e=this.saveToJSON();try{return await this.document.save(e),!0}catch(e){return console.error(`Save error:`,e),!1}}async load(e){try{let t=await this.document.load(e);return t&&this.loadFromJSON(t),!0}catch(e){return console.error(`Load error:`,e),!1}}getCellDisplay(e,t){return this.model.getCellFormattedValue(e,t)}getCellRaw(e,t){return this.model.getCellRaw(e,t)}setCellRaw(e,t,n){this.model.setCellRaw(e,t,n)}getCellFormat(e,t){return this.model.getCellFormat(e,t)}setCellFormat(e,t,n,r){this.model.setCellFormat(e,t,n,r)}getCellError(e,t){return this.model.getCellError(e,t)}_handleCopy(e){let t=e.selection||this.model.selection;if(!t)return;let n=[];for(let e=t.startRow;e<=t.endRow;e++){let r=[];for(let n=t.startCol;n<=t.endCol;n++)r.push(this.getCellDisplay(n,e));n.push(r.join(`	`))}let r=n.join(`
`);navigator.clipboard&&navigator.clipboard.writeText(r).catch(()=>{})}_handlePaste(e){navigator.clipboard&&navigator.clipboard.readText().then(t=>{this._pasteText(t,e.cell)}).catch(()=>{})}_pasteText(e,t){if(!e||!t)return;let n=e.split(`
`);for(let e=0;e<n.length;e++){let r=n[e].split(`	`);for(let n=0;n<r.length;n++)this.model.setCellRaw(t.col+n,t.row+e,r[n])}}_handleCut(e){this._handleCopy(e);let t=e.selection||this.model.selection;if(t)for(let e=t.startRow;e<=t.endRow;e++)for(let n=t.startCol;n<=t.endCol;n++)this.model.deleteCell(n,e)}_handleDeleteSelection(e){let t=e.selection||this.model.selection;if(t)for(let e=t.startRow;e<=t.endRow;e++)for(let n=t.startCol;n<=t.endCol;n++)this.model.deleteCell(n,e)}_handleClearAndEdit(e){e.cell&&this.model.deleteCell(e.cell.col,e.cell.row)}_handleToggleFormat(e){let t=this.model.selection;if(!t)return;let n=e.format,r=this.model.getCell(t.startCol,t.startRow)?.format?.[n]||!1;for(let e=t.startRow;e<=t.endRow;e++)for(let i=t.startCol;i<=t.endCol;i++)this.model.setCellFormat(i,e,n,!r)}_handleOpenFind(){this.findReplace._find()}_handleOpenFindReplace(){this.findReplace._find()}_handleCellMoved(e){this.collaboration&&this.collaboration.isConnected&&this.collaboration.sendCursorPosition(e.col,e.row)}_handleEditModeChanged(e){}undo(){return this.model.undo()}redo(){return this.model.redo()}sortColumn(e,t){this.model.sortColumn(e,t)}insertCol(e){this.model.insertCol(e)}deleteCol(e){this.model.deleteCol(e)}insertRow(e){this.model.insertRow(e)}deleteRow(e){this.model.deleteRow(e)}setColWidth(e,t){this.model.setColWidth(e,t)}setRowHeight(e,t){this.model.setRowHeight(e,t)}mergeCells(e){this.model.setMergedCells(e,!0)}unmergeCells(e){this.model.setMergedCells(e,!1)}setFrozenPane(e,t){this.model.setFrozenPane(e,t)}addChart(e){let t=this.plugins.get(`chart`);return t?t.addChart(e):null}updateChart(e,t){let n=this.plugins.get(`chart`);n&&n.updateChart(e,t)}removeChart(e){let t=this.plugins.get(`chart`);t&&t.removeChart(e)}getCharts(){let e=this.plugins.get(`chart`);return e?e.getAllCharts():[]}enableAutoFilter(){let e=this.plugins.get(`filter`);e&&e.enableAutoFilter()}disableAutoFilter(){let e=this.plugins.get(`filter`);e&&e.disableAutoFilter()}addConditionalFormat(e){return this.conditionalFormatting.addRule(e)}addDataValidation(e){return this.dataValidation.addValidation(e)}exportCSV(e){return this.exporter.exportToCSV(e)}exportXLSX(e){return this.exporter.exportToXLSX(e)}exportJSON(e){return this.exporter.exportToJSON(e)}connectCollaboration(){this.collaboration&&this.collaboration.connect()}disconnectCollaboration(){this.collaboration&&this.collaboration.disconnect()}destroy(){this.navigation&&this.navigation.destroy(),this.collaboration&&this.collaboration.disconnect(),this.plugins&&this.plugins.destroyAll()}}window.SpreadsheetEngine=e})(),(function(){let{Component:e,useState:t,onWillStart:n,onMounted:r,onWillUnmount:i,xml:a,useRef:o}=owl,s=window.LarasoftRPC;function c(e){return e==null?``:String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}function l(e){let t=``,n=e;for(;n>=0;)t=String.fromCharCode(65+n%26)+t,n=Math.floor(n/26)-1;return t}function u(e){let t=0;for(let n=0;n<e.length;n++)t=t*26+(e.charCodeAt(n)-64);return t-1}function d(e,t,n=new Set){if(!e||typeof e!=`string`||!e.startsWith(`=`))return e;if(window.SpreadsheetFormulaEvaluator&&window.SpreadsheetCellType)try{let r=new window.SpreadsheetFormulaEvaluator(e=>{let r=t(e,n);return r==null||r===``?{type:window.SpreadsheetCellType.EMPTY,value:``}:typeof r==`string`&&r.startsWith(`=`)?{type:window.SpreadsheetCellType.FORMULA,formula:r}:{type:window.SpreadsheetCellType.VALUE,value:r}}).evaluate(e);return r.error?r.error:r.value}catch{return`#ERROR!`}let r=e.substring(1).trim().toUpperCase();if(n.has(r))return`#CIRCULAR!`;n.add(r);try{let i=r.match(/^SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);if(i){let[,e,r,a,o]=i,s=0;for(let i=parseInt(r);i<=parseInt(o);i++)for(let r=u(e);r<=u(a);r++){let e=t(l(r)+i,n);typeof e==`number`?s+=e:isNaN(parseFloat(e))||(s+=parseFloat(e))}return Math.round(s*100)/100}let a=r.match(/^(?:AVG|AVERAGE)\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);if(a){let[,e,r,i,o]=a,s=0,c=0;for(let a=parseInt(r);a<=parseInt(o);a++)for(let r=u(e);r<=u(i);r++){let e=t(l(r)+a,n);typeof e==`number`?(s+=e,c++):isNaN(parseFloat(e))||(s+=parseFloat(e),c++)}return c>0?Math.round(s/c*100)/100:0}let o=r.match(/^COUNT\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);if(o){let[,e,r,i,a]=o,s=0;for(let o=parseInt(r);o<=parseInt(a);o++)for(let r=u(e);r<=u(i);r++){let e=t(l(r)+o,n);e!==``&&e!=null&&s++}return s}let s=r.match(/^MIN\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);if(s){let[,e,r,i,a]=s,o=1/0;for(let s=parseInt(r);s<=parseInt(a);s++)for(let r=u(e);r<=u(i);r++){let e=t(l(r)+s,n),i=typeof e==`number`?e:parseFloat(e);!isNaN(i)&&i<o&&(o=i)}return o===1/0?0:o}let c=r.match(/^MAX\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);if(c){let[,e,r,i,a]=c,o=-1/0;for(let s=parseInt(r);s<=parseInt(a);s++)for(let r=u(e);r<=u(i);r++){let e=t(l(r)+s,n),i=typeof e==`number`?e:parseFloat(e);!isNaN(i)&&i>o&&(o=i)}return o===-1/0?0:o}let d=r.match(/^IF\((.+),\s*(.+),\s*(.+)\)$/);if(d){let[,e,r,i]=d,a=f(e,t,n)?r:i,o=parseFloat(a);return isNaN(o)?a.replace(/"/g,``):o}let p=r.match(/^([A-Z]+)(\d+)$/);if(p)return t(p[1]+p[2],n);let m=r.match(/^([A-Z]+\d+)\s*([+\-*/])\s*([A-Z]+\d+|[\d.]+)$/);if(m){let[,e,r,i]=m,a=parseFloat(t(e,n))||0,o=isNaN(parseFloat(i))?parseFloat(t(i,n))||0:parseFloat(i);if(r===`+`)return a+o;if(r===`-`)return a-o;if(r===`*`)return a*o;if(r===`/`)return o===0?`#DIV/0!`:a/o}let h=parseFloat(r);return isNaN(h)?e:h}catch{return`#ERROR!`}}function f(e,t,n){let r=e.match(/^([A-Z]+\d+)\s*(>=|<=|<>|!=|=|>|<)\s*"?([^"]+)"?$/);if(!r)return!1;let[,i,a,o]=r,s=t(i,n),c=parseFloat(s),l=parseFloat(o),u=!isNaN(c)&&!isNaN(l);return a===`>`?u?c>l:String(s)>o:a===`<`?u?c<l:String(s)<o:a===`>=`?u?c>=l:String(s)>=o:a===`<=`?u?c<=l:String(s)<=o:a===`<>`||a===`!=`?u?c!==l:String(s)!==o:a===`=`?u?c===l:String(s)===o:!1}class p extends e{static template=a`
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
            <t t-if="Object.keys(state.modifiedCells).length > 0">
                <button class="ls-btn ls-btn-sm ls-btn-primary" t-on-click="saveData">
                    <t t-out="icons.get('save', 14)"/> Save
                </button>
            </t>
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
    `;static props={model:{type:String},spreadsheetViewDef:{type:Object,optional:!0},onOpenRecord:{type:Function,optional:!0},domain:{type:Array,optional:!0},actionDomain:{type:Array,optional:!0},actionTitle:{type:String,optional:!0},viewModes:{type:Array,optional:!0},activeViewType:{type:String,optional:!0},onSwitchView:{type:Function,optional:!0}};setup(){this._model=this.props.model||`task`,this.icons=window.LarasoftIcons,this.engine=new window.SpreadsheetEngine({defaultColWidth:this.props.spreadsheetViewDef?.column_width||100,defaultRowHeight:this.props.spreadsheetViewDef?.row_height||28}),this.engine.init(),this.state=t({loading:!0,viewDef:this.props.spreadsheetViewDef||{},fields:{},sheets:[{id:`sheet1`,name:`Sheet1`}],activeSheet:`sheet1`,columns:[],rows:[],cellData:{},cellFormats:{},selectedCell:null,selectedCol:-1,selectedRow:-1,editingCell:null,editValue:``,formulaBarValue:``,isDragging:!1,dragStart:null,dragEnd:null,resizingCol:-1,resizeStartX:0,resizeStartWidth:0,showAggregation:!0,aggLabel:`Total`,totalAggregate:null,editMode:!1,modifiedCells:{},undoStack:[],redoStack:[],clipboard:[],clipboardMode:null,sortCol:-1,sortDir:`asc`,freezeCol:-1,freezeRow:-1,contextMenu:{show:!1,x:0,y:0,type:null,data:null},activeMenu:null,menuPos:{x:0,y:0},currentTextColor:`#000000`,currentBgColor:`#ffffff`,currentFontSize:10,currentAlign:`left`,numberFormat:`none`,charts:[],mergedCells:{},statusCalc:null,chartDialog:{show:!1,editingId:null},chartForm:{type:`bar`,title:`Chart`,labelCol:0,dataCols:[1],stacked:!1,horizontal:!1,showLegend:!0,colors:[`#6366f1`,`#f59e0b`,`#10b981`,`#ef4444`,`#8b5cf6`,`#ec4899`]},engineReady:!0,filterEnabled:!1,findReplaceOpen:!1,findReplaceText:``,replaceText:``,findMatchCase:!1,findMatchEntireCell:!1,findUseRegex:!1,findResults:[],findCurrentIndex:-1,showReplaceMode:!1,showGridLines:!0,zoom:100,sheetData:{}}),n(async()=>{let e=await s.fieldsGet(this._model);this.state.fields=e,await this.loadData(),this._syncEngineToState()}),r(()=>{this._keyHandler=e=>this.onGlobalKeydown(e),document.addEventListener(`keydown`,this._keyHandler),this._renderChartsDebounced=this._debounce(()=>this._renderAllCharts(),100)}),i(()=>{document.removeEventListener(`keydown`,this._keyHandler),this.engine&&this.engine.destroy()})}toggleMenu(e){if(this.state.activeMenu===e)this.state.activeMenu=null;else{this.state.activeMenu=e;let t=document.querySelectorAll(`.ls-ss-menu-item`),n=[`file`,`edit`,`view`,`insert`,`format`,`data`].indexOf(e);if(t[n]){let e=t[n].getBoundingClientRect();this.state.menuPos={x:e.left,y:e.bottom}}}}closeMenu(){this.state.activeMenu=null}getMenuItems(e){return{file:[{label:`New`,icon:`file`,shortcut:`Ctrl+N`,action:()=>this.newSpreadsheet()},{label:`Open...`,icon:`folder-open`,action:()=>this.openSpreadsheetDialog()},{separator:!0},{label:`Save`,icon:`save`,shortcut:`Ctrl+S`,action:()=>this.saveData()},{separator:!0},{label:`Export as CSV`,icon:`download`,action:()=>this.exportCSV()},{label:`Export as Excel`,icon:`file-spreadsheet`,action:()=>this.exportExcel()}],edit:[{label:`Undo`,icon:`undo-2`,shortcut:`Ctrl+Z`,action:()=>this.undo(),disabled:this.state.undoStack.length===0},{label:`Redo`,icon:`redo-2`,shortcut:`Ctrl+Y`,action:()=>this.redo(),disabled:this.state.redoStack.length===0},{separator:!0},{label:`Cut`,icon:`scissors`,shortcut:`Ctrl+X`,action:()=>this.cutSelection()},{label:`Copy`,icon:`copy`,shortcut:`Ctrl+C`,action:()=>this.copySelection()},{label:`Paste`,icon:`clipboard`,shortcut:`Ctrl+V`,action:()=>this.pasteClipboard(),disabled:this.state.clipboard.length===0},{separator:!0},{label:`Select All`,icon:`check-square`,shortcut:`Ctrl+A`,action:()=>this.selectAll()},{label:`Find & Replace...`,icon:`search`,shortcut:`Ctrl+H`,action:()=>this.openFindReplace(!0)}],view:[{label:`Freeze Panes`,icon:`lock`,action:()=>this.toggleFreeze()},{label:`Show Grid Lines`,icon:`grid`,action:()=>this.toggleGridLines()},{separator:!0},{label:`Zoom In`,icon:`zoom-in`,shortcut:`Ctrl++`,action:()=>this.zoomIn()},{label:`Zoom Out`,icon:`zoom-out`,shortcut:`Ctrl+-`,action:()=>this.zoomOut()}],insert:[{label:`Row Above`,icon:`arrow-up`,action:()=>{this.state.selectedRow>=0&&this.insertRowAbove(this.state.selectedRow)}},{label:`Row Below`,icon:`arrow-down`,action:()=>{this.state.selectedRow>=0&&this.insertRowBelow(this.state.selectedRow)}},{separator:!0},{label:`Column Left`,icon:`arrow-left`,action:()=>{this.state.selectedCol>=0&&this.insertColumnLeft(this.state.selectedCol)}},{label:`Column Right`,icon:`arrow-right`,action:()=>{this.state.selectedCol>=0&&this.insertColumnRight(this.state.selectedCol)}},{separator:!0},{label:`Chart`,icon:`bar-chart-2`,action:()=>this.addChart()},{label:`Hyperlink`,icon:`link`,action:()=>this.insertHyperlink()}],format:[{label:`Bold`,icon:`bold`,shortcut:`Ctrl+B`,action:()=>this.toggleFormat(`bold`)},{label:`Italic`,icon:`italic`,shortcut:`Ctrl+I`,action:()=>this.toggleFormat(`italic`)},{label:`Strikethrough`,icon:`strikethrough`,action:()=>this.toggleFormat(`strikethrough`)},{label:`Underline`,icon:`underline`,shortcut:`Ctrl+U`,action:()=>this.toggleFormat(`underline`)},{separator:!0},{label:`Number Format...`,icon:`hash`,action:()=>this.openNumberFormatDialog()},{label:`Conditional Formatting`,icon:`filter`,action:()=>this.applyConditionalFormat()},{separator:!0},{label:`Merge Cells`,icon:`maximize-2`,action:()=>this.mergeCells()},{label:`Unmerge Cells`,icon:`minimize-2`,action:()=>this.unmergeCells()}],data:[{label:`Sort A → Z`,icon:`arrow-up-narrow-wide`,action:()=>{this.state.selectedCol>=0&&this.sortColumn(this.state.selectedCol,`asc`)}},{label:`Sort Z → A`,icon:`arrow-down-wide-narrow`,action:()=>{this.state.selectedCol>=0&&this.sortColumn(this.state.selectedCol,`desc`)}},{separator:!0},{label:`Remove Duplicates`,icon:`x-circle`,action:()=>this.removeDuplicates()},{label:`Data Validation`,icon:`check-circle`,action:()=>this.openDataValidation()}]}[e]||[]}execMenuAction(e){e.action&&e.action(),this.closeMenu()}newSpreadsheet(){confirm(`Create new spreadsheet? Unsaved changes will be lost.`)&&(this.state.cellData={},this.state.cellFormats={},this.state.modifiedCells={},this.state.undoStack=[],this.state.redoStack=[],this.loadData())}async openSpreadsheetDialog(){let e=prompt(`Enter spreadsheet document ID to open:`);if(e)try{await this.loadSpreadsheet(parseInt(e)),alert(`Spreadsheet loaded successfully.`)}catch(e){alert(`Failed to load spreadsheet: `+e.message)}}async loadData(){this.state.loading=!0;let e=this.state.viewDef,t=this.props.actionDomain||this.props.domain||[],n=(e.fields||Object.keys(this.state.fields).filter(e=>{let t=this.state.fields[e];return t&&!t.invisible&&t.type!==`one2many`&&t.type!==`many2many`})).map((t,n)=>{let r=this.state.fields[t];return{idx:n,name:t,letter:l(n),label:r?.string||t,width:e.column_width||120,hidden:!1}}),r=((await s.searchRead(this._model,t,{limit:e.limit||1e3})).records||[]).map((e,t)=>({idx:t,record:e})),i={};for(let e of r)for(let t of n){let n=t.idx+`_`+e.idx,r=t.name,a=this.state.fields[r],o=e.record[r],s=o;s=Array.isArray(o)?o[1]||o[0]:a?.type===`boolean`?o?`Yes`:`No`:a?.type===`float`||a?.type===`integer`||a?.type===`monetary`?o==null?0:Number(o):o??``,i[n]={raw:s,value:s,formula:null,format:{},recordId:e.record.id,fieldName:r}}let a=Math.max(10,50-r.length),o=r.length+a;for(let e=r.length;e<o;e++)r.push({idx:e,record:null});this.state.columns=n,this.state.rows=r,this.state.cellData=i,this.state.loading=!1,setTimeout(()=>this._renderAllCharts(),150)}_syncEngineToState(){if(!(!this.engine||!this.engine.isInitialized))try{let e=this.engine.model;for(let t=0;t<Math.min(this.state.rows.length,200);t++)for(let n=0;n<this.state.columns.length;n++){let r=n+`_`+t,i=this.state.cellData[r];i&&i.raw!==void 0&&i.raw!==null&&i.raw!==``&&(e.setCellRaw(n,t,String(i.raw)),i.format&&Object.keys(i.format).length>0&&e.setCellFormats(n,t,i.format))}for(let t=0;t<this.state.columns.length;t++){let n=this.state.columns[t]?.width||100;e.setColWidth(t,n)}}catch(e){console.warn(`Engine sync warning:`,e)}}_debounce(e,t){let n;return(...r)=>{clearTimeout(n),n=setTimeout(()=>e(...r),t)}}_getEngineCellDisplay(e,t){return!this.engine||!this.engine.isInitialized?``:this.engine.getCellDisplay(e,t)}_getEngineCellError(e,t){return!this.engine||!this.engine.isInitialized?null:this.engine.getCellError(e,t)}_engineUndo(){this.engine&&this.engine.undo()&&this._syncEngineToState()}_engineRedo(){this.engine&&this.engine.redo()&&this._syncEngineToState()}getCellData(e,t){return this.state.cellData[e+`_`+t]||null}getCellValue(e,t){let n=this.getCellData(e,t);return n?n.formula?d(n.formula,(e,t)=>this._getCellValueByRef(e,t)):n.value??n.raw??``:``}_getCellValueByRef(e,t){let n=e.match(/^([A-Z]+)(\d+)$/);if(!n)return``;let r=u(n[1]),i=parseInt(n[2])-1,a=this.getCellData(r,i);return a?a.formula?d(a.formula,(e,t)=>this._getCellValueByRef(e,t),t):a.value??a.raw??``:``}formatCellValue(e,t){let n=this.getCellValue(e,t),r=e+`_`+t,i=this.state.cellFormats[r];if(i&&i.numberFormat&&!isNaN(parseFloat(n))){let e=parseFloat(n);i.numberFormat===`currency`?n=`$`+e.toFixed(2):i.numberFormat===`percent`?n=(e*100).toFixed(2)+`%`:i.numberFormat===`number`&&(n=e.toFixed(2))}return n}isHyperlink(e,t){let n=this.getCellValue(e,t);return typeof n==`string`&&(n.startsWith(`http://`)||n.startsWith(`https://`))}getCellClass(e,t){let n=[`ls-ss-cell`];if(this.state.selectedCell===l(e)+(t+1)&&n.push(`selected`),this.state.editingCell===e+`_`+t&&n.push(`editing`),this.state.dragStart&&this.state.dragEnd){let r=Math.min(this.state.dragStart.col,this.state.dragEnd.col),i=Math.max(this.state.dragStart.col,this.state.dragEnd.col),a=Math.min(this.state.dragStart.row,this.state.dragEnd.row),o=Math.max(this.state.dragStart.row,this.state.dragEnd.row);e>=r&&e<=i&&t>=a&&t<=o&&(r!==i||a!==o)&&n.push(`drag-highlight`)}let r=e+`_`+t,i=this.state.cellFormats[r];i&&(i.bold&&n.push(`fmt-bold`),i.italic&&n.push(`fmt-italic`),i.underline&&n.push(`fmt-underline`),i.strikethrough&&n.push(`fmt-strikethrough`),i.align&&n.push(`fmt-align-`+i.align));let a=this.state.cellData[r]?.format;return a?.cf&&n.push(`cf-`+a.cf),n.join(` `)}getCellStyle(e,t){let n=e+`_`+t,r=this.state.cellFormats[n],i=this.state.cellData[n]?.format,a=``;return r&&(r.bgColor&&(a+=`background:`+r.bgColor+`;`),r.color&&(a+=`color:`+r.color+`;`),r.fontSize&&(a+=`font-size:`+r.fontSize+`px;`)),i?.cf===`green`&&(a+=`background:#d1fae5;`),i?.cf===`yellow`&&(a+=`background:#fef3c7;`),i?.cf===`red`&&(a+=`background:#fee2e2;`),a}getSelectedCellRawValue(){if(!this.state.selectedCell)return``;let e=this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);if(!e)return``;let t=this.getCellData(u(e[1]),parseInt(e[2])-1);return t&&(t.formula||t.raw)||``}selectCell(e,t){this.state.selectedCell=l(e)+(t+1),this.state.selectedCol=e,this.state.selectedRow=t;let n=this.getCellData(e,t);this.state.formulaBarValue=n?n.formula||String(n.raw??``):``,this._updateToolbarState(e,t),this._updateStatusCalc()}selectColumn(e){this.state.selectedCol=e,this.state.selectedRow=-1,this.state.selectedCell=null}selectRow(e){this.state.selectedRow=e,this.state.selectedCol=-1,this.state.selectedCell=null}startEditing(e,t){if(this.state.viewDef.readonly)return;let n=e+`_`+t,r=this.getCellData(e,t);r&&r.format&&r.format.locked||(this.state.editingCell=n,this.state.editValue=r?r.formula||String(r.raw??``):``,this.state.formulaBarValue=this.state.editValue,this.state.editMode=!0,setTimeout(()=>{let e=document.querySelector(`.ls-ss-cell-editor`);e&&e.focus()},10))}commitEdit(e=null){if(!this.state.editingCell)return;let[t,n]=this.state.editingCell.split(`_`),r=parseInt(t),i=parseInt(n),a=this.state.editingCell,o=e===null?this.state.editValue:e;if(e===null){let e=document.getElementById(`lsCellEditor`);e&&(o=e.value)}let s=this.state.cellData[a]?{...this.state.cellData[a]}:null;this.state.cellData[a]||(this.state.cellData[a]={raw:``,value:``,formula:null,format:{}});let c=this.state.cellData[a];if(o.startsWith(`=`))c.formula=o,c.raw=o;else{c.formula=null,c.raw=o;let e=parseFloat(o);c.value=!isNaN(e)&&String(e)===o.trim()?e:o}c.recordId&&(this.state.modifiedCells[a]={recordId:c.recordId,fieldName:c.fieldName,value:c.formula?this.getCellValue(r,i):c.value||c.raw});let l={...this.state.cellData[a]};this._pushUndo({type:`edit`,key:a,oldData:s,newData:l,colIdx:r,rowIdx:i}),this.state.editingCell=null,this.state.editMode=!1}onCellKeydown(e,t,n){e.key===`Enter`?(this.commitEdit(),n+1<this.state.rows.length&&this.selectCell(t,n+1)):e.key===`Tab`?(e.preventDefault(),this.commitEdit(),t+1<this.state.columns.length&&this.selectCell(t+1,n)):e.key===`Escape`&&(this.state.editingCell=null,this.state.editMode=!1)}onFormulaBarKeydown(e){if(e.key===`Enter`&&this.state.selectedCell){let e=document.getElementById(`lsFormulaInput`);e&&(this.state.formulaBarValue=e.value);let t=this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);t&&(this.state.editingCell=u(t[1])+`_`+(parseInt(t[2])-1),this.state.editValue=this.state.formulaBarValue,this.commitEdit())}}onFormulaBarBlur(e){let t=document.getElementById(`lsFormulaInput`);t&&(this.state.formulaBarValue=t.value)}onGlobalKeydown(e){if(this.state.editingCell||[`INPUT`,`TEXTAREA`,`SELECT`].includes(e.target.tagName)||this.state.findReplaceOpen||this.state.chartDialog.show||!this.state.selectedCell)return;let t=this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);if(!t)return;let n=u(t[1]),r=parseInt(t[2])-1;if((e.ctrlKey||e.metaKey)&&e.key===`c`){e.preventDefault(),this.copySelection();return}if((e.ctrlKey||e.metaKey)&&e.key===`v`){e.preventDefault(),this.pasteClipboard();return}if((e.ctrlKey||e.metaKey)&&e.key===`x`){e.preventDefault(),this.cutSelection();return}if((e.ctrlKey||e.metaKey)&&e.key===`z`){e.preventDefault(),this.undo();return}if((e.ctrlKey||e.metaKey)&&e.key===`y`){e.preventDefault(),this.redo();return}if((e.ctrlKey||e.metaKey)&&e.key===`b`){e.preventDefault(),this.toggleFormat(`bold`);return}if((e.ctrlKey||e.metaKey)&&e.key===`i`){e.preventDefault(),this.toggleFormat(`italic`);return}if((e.ctrlKey||e.metaKey)&&e.key===`u`){e.preventDefault(),this.toggleFormat(`underline`);return}if((e.ctrlKey||e.metaKey)&&e.key===`a`){e.preventDefault(),this.selectAll();return}if((e.ctrlKey||e.metaKey)&&e.key===`n`){e.preventDefault(),this.newSpreadsheet();return}if((e.ctrlKey||e.metaKey)&&e.key===`s`){e.preventDefault(),this.saveData();return}if((e.ctrlKey||e.metaKey)&&e.key===`h`){e.preventDefault(),this.openFindReplace(!0);return}switch(e.key){case`ArrowUp`:e.preventDefault(),r>0&&this.selectCell(n,r-1);break;case`ArrowDown`:e.preventDefault(),r<this.state.rows.length-1&&this.selectCell(n,r+1);break;case`ArrowLeft`:e.preventDefault(),n>0&&this.selectCell(n-1,r);break;case`ArrowRight`:e.preventDefault(),n<this.state.columns.length-1&&this.selectCell(n+1,r);break;case`Enter`:this.startEditing(n,r);break;case`Delete`:case`Backspace`:e.preventDefault();let t=this._getSelectionRange();if(t){let e=[];for(let n=t.minR;n<=t.maxR;n++)for(let r=t.minC;r<=t.maxC;r++){let t=this.deleteCellValue(r,n,!1);t&&e.push(t)}e.length>0&&this._pushUndo({type:`batch`,actions:e})}else this.deleteCellValue(n,r);break;case`F2`:this.startEditing(n,r);break;default:e.key.length===1&&!e.ctrlKey&&!e.metaKey&&(this.startEditing(n,r),this.state.editValue=e.key)}}deleteCellValue(e,t,n=!0){let r=e+`_`+t;if(this.state.cellData[r]){let i={...this.state.cellData[r]};this.state.cellData[r].raw=``,this.state.cellData[r].value=``,this.state.cellData[r].formula=null,this.state.cellData[r].recordId&&(this.state.modifiedCells[r]={recordId:this.state.cellData[r].recordId,fieldName:this.state.cellData[r].fieldName,value:null});let a={type:`edit`,key:r,oldData:i,newData:{...this.state.cellData[r]},colIdx:e,rowIdx:t};return n&&this._pushUndo(a),a}return null}_updateToolbarState(e,t){let n=e+`_`+t,r=this.state.cellFormats[n]||{};this.state.currentTextColor=r.color||`#000000`,this.state.currentBgColor=r.bgColor||`#ffffff`,this.state.currentFontSize=r.fontSize||10,this.state.currentAlign=r.align||`left`}_updateStatusCalc(){if(!this.state.selectedCell){this.state.statusCalc=null;return}let e=this._getSelectionRange();if(!e){this.state.statusCalc=null;return}let t=0,n=0,r=[];for(let i=e.minR;i<=e.maxR;i++)for(let a=e.minC;a<=e.maxC;a++){let e=parseFloat(this.getCellValue(a,i));isNaN(e)||(t+=e,n++,r.push(e))}n>0?this.state.statusCalc={label:`Sum`,value:Math.round(t*100)/100+` | Avg: `+(t/n).toFixed(2)+` | Count: `+n}:this.state.statusCalc={label:`Count`,value:n+` cells`}}isFormat(e){if(!this.state.selectedCell)return!1;let t=this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);if(!t)return!1;let n=u(t[1])+`_`+(parseInt(t[2])-1),r=this.state.cellFormats[n];return r&&r[e]}toggleFormat(e){if(!this.state.selectedCell)return;let t=this._getSelectionRange();if(!t)return;let n=t.minC+`_`+t.minR,r=this.state.cellFormats[n]?.[e]||!1,i=[];for(let n=t.minR;n<=t.maxR;n++)for(let a=t.minC;a<=t.maxC;a++){let t=a+`_`+n,o=this.state.cellFormats[t]?{...this.state.cellFormats[t]}:null;this.state.cellFormats[t]||(this.state.cellFormats[t]={}),this.state.cellFormats[t][e]=!r;let s={...this.state.cellFormats[t]};i.push({type:`format`,key:t,oldFormat:o,newFormat:s,colIdx:a,rowIdx:n})}i.length>0&&this._pushUndo({type:`batch`,actions:i})}getCurrentFontSize(){return this.state.currentFontSize}setFontSize(e){if(!this.state.selectedCell)return;let t=this._getSelectionRange();if(!t)return;let n=[];for(let r=t.minR;r<=t.maxR;r++)for(let i=t.minC;i<=t.maxC;i++){let t=i+`_`+r,a=this.state.cellFormats[t]?{...this.state.cellFormats[t]}:null;this.state.cellFormats[t]||(this.state.cellFormats[t]={}),this.state.cellFormats[t].fontSize=parseInt(e);let o={...this.state.cellFormats[t]};n.push({type:`format`,key:t,oldFormat:a,newFormat:o,colIdx:i,rowIdx:r})}n.length>0&&this._pushUndo({type:`batch`,actions:n}),this.state.currentFontSize=parseInt(e)}getCurrentAlign(){return this.state.currentAlign}setAlign(e){if(!this.state.selectedCell)return;let t=this._getSelectionRange();if(!t)return;let n=[];for(let r=t.minR;r<=t.maxR;r++)for(let i=t.minC;i<=t.maxC;i++){let t=i+`_`+r,a=this.state.cellFormats[t]?{...this.state.cellFormats[t]}:null;this.state.cellFormats[t]||(this.state.cellFormats[t]={}),this.state.cellFormats[t].align=e;let o={...this.state.cellFormats[t]};n.push({type:`format`,key:t,oldFormat:a,newFormat:o,colIdx:i,rowIdx:r})}n.length>0&&this._pushUndo({type:`batch`,actions:n}),this.state.currentAlign=e}setTextColor(e){if(!this.state.selectedCell)return;let t=this._getSelectionRange();if(!t)return;let n=[];for(let r=t.minR;r<=t.maxR;r++)for(let i=t.minC;i<=t.maxC;i++){let t=i+`_`+r,a=this.state.cellFormats[t]?{...this.state.cellFormats[t]}:null;this.state.cellFormats[t]||(this.state.cellFormats[t]={}),this.state.cellFormats[t].color=e;let o={...this.state.cellFormats[t]};n.push({type:`format`,key:t,oldFormat:a,newFormat:o,colIdx:i,rowIdx:r})}n.length>0&&this._pushUndo({type:`batch`,actions:n}),this.state.currentTextColor=e}setBgColor(e){if(!this.state.selectedCell)return;let t=this._getSelectionRange();if(!t)return;let n=[];for(let r=t.minR;r<=t.maxR;r++)for(let i=t.minC;i<=t.maxC;i++){let t=i+`_`+r,a=this.state.cellFormats[t]?{...this.state.cellFormats[t]}:null;this.state.cellFormats[t]||(this.state.cellFormats[t]={}),this.state.cellFormats[t].bgColor=e;let o={...this.state.cellFormats[t]};n.push({type:`format`,key:t,oldFormat:a,newFormat:o,colIdx:i,rowIdx:r})}n.length>0&&this._pushUndo({type:`batch`,actions:n}),this.state.currentBgColor=e}setNumberFormat(e){if(!this.state.selectedCell)return;let t=this._getSelectionRange();if(!t)return;let n=[];for(let r=t.minR;r<=t.maxR;r++)for(let i=t.minC;i<=t.maxC;i++){let t=i+`_`+r,a=this.state.cellFormats[t]?{...this.state.cellFormats[t]}:null;this.state.cellFormats[t]||(this.state.cellFormats[t]={}),this.state.cellFormats[t].numberFormat=e;let o={...this.state.cellFormats[t]};n.push({type:`format`,key:t,oldFormat:a,newFormat:o,colIdx:i,rowIdx:r})}n.length>0&&this._pushUndo({type:`batch`,actions:n}),this.state.numberFormat=e}openNumberFormatDialog(){if(!this.state.selectedCell)return;let e=[{value:`none`,label:`General`},{value:`number`,label:`Number (1,234.56)`},{value:`currency`,label:`Currency ($1,234.56)`},{value:`percent`,label:`Percent (123.45%)`},{value:`date`,label:`Date (MM/DD/YYYY)`},{value:`text`,label:`Text (@)`}],t=this.state.cellFormats[this.state.selectedCol+`_`+this.state.selectedRow]?.numberFormat||`none`,n=e.map((e,n)=>n+1+`. `+e.label+(e.value===t?` (current)`:``)).join(`
`),r=prompt(`Number Format:
`+n+`

Enter number (1-6):`);if(r){let t=parseInt(r)-1;t>=0&&t<e.length&&this.setNumberFormat(e[t].value)}}toggleBorders(){if(!this.state.selectedCell)return;let e=this._getSelectionRange();if(e)for(let t=e.minR;t<=e.maxR;t++)for(let n=e.minC;n<=e.maxC;n++){let e=n+`_`+t;this.state.cellFormats[e]||(this.state.cellFormats[e]={}),this.state.cellFormats[e].border=!this.state.cellFormats[e].border}}getMergeInfo(e,t){for(let n in this.state.mergedCells){let r=this.state.mergedCells[n];if(e>=r.minC&&e<=r.maxC&&t>=r.minR&&t<=r.maxR)return e===r.minC&&t===r.minR?{isTopLeft:!0,colSpan:r.maxC-r.minC+1,rowSpan:r.maxR-r.minR+1}:{isTopLeft:!1}}return null}mergeCells(){if(!this.state.selectedCell)return;let e=this._getSelectionRange();if(!e||e.minC===e.maxC&&e.minR===e.maxR)return;let t=e.minC+`_`+e.minR;this.state.mergedCells[t]={minC:e.minC,maxC:e.maxC,minR:e.minR,maxR:e.maxR}}unmergeCells(){if(!this.state.selectedCell)return;let e=this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);if(!e)return;let t=u(e[1])+`_`+(parseInt(e[2])-1);delete this.state.mergedCells[t]}openFindReplace(e){this.state.findReplaceOpen=!0,this.state.showReplaceMode=!!e,this.state.findResults=[],this.state.findCurrentIndex=-1,this.state.findReplaceText=``,this.state.replaceText=``,setTimeout(()=>{let e=document.getElementById(`lsFindInput`);e&&e.focus()},10)}closeFindReplace(){this.state.findReplaceOpen=!1,this.state.findResults=[],this.state.findCurrentIndex=-1}executeFind(){let e=document.getElementById(`lsFindInput`);e&&(this.state.findReplaceText=e.value);let t=this.state.findReplaceText;if(this.state.lastSearchText=t,!t){this.state.findResults=[],this.state.findCurrentIndex=-1;return}let n=[],r=this.state.findUseRegex,i=this.state.findMatchCase,a=this.state.findMatchEntireCell,o;try{o=r?new RegExp(t,i?`g`:`gi`):null}catch{return}for(let e=0;e<this.state.rows.length;e++)for(let s=0;s<this.state.columns.length;s++){let c=String(this.getCellValue(s,e)),l=i?c:c.toLowerCase(),u=i?t:t.toLowerCase(),d=!1;r&&o?(o.lastIndex=0,d=o.test(c)):d=a?l===u:l.includes(u),d&&n.push({col:s,row:e})}this.state.findResults=n,this.state.findCurrentIndex=n.length>0?0:-1,n.length>0&&this._selectFindResult()}findNext(){let e=document.getElementById(`lsFindInput`);if(e&&(this.state.findReplaceText=e.value),this.state.findResults.length===0||this.state.lastSearchText!==this.state.findReplaceText){this.executeFind();return}this.state.findCurrentIndex=(this.state.findCurrentIndex+1)%this.state.findResults.length,this._selectFindResult()}findPrev(){let e=document.getElementById(`lsFindInput`);if(e&&(this.state.findReplaceText=e.value),this.state.findResults.length===0||this.state.lastSearchText!==this.state.findReplaceText){this.executeFind();return}this.state.findCurrentIndex=(this.state.findCurrentIndex-1+this.state.findResults.length)%this.state.findResults.length,this._selectFindResult()}_selectFindResult(){if(this.state.findCurrentIndex<0||this.state.findCurrentIndex>=this.state.findResults.length)return;let{col:e,row:t}=this.state.findResults[this.state.findCurrentIndex];this.selectCell(e,t),this._scrollToCell(e,t)}_scrollToCell(e,t){let n=document.querySelector(`.ls-ss-container`);if(!n)return;let r=document.querySelector(`.ls-ss-grid td[data-col="${e}"][data-row="${t}"]`);if(r){let e=n.getBoundingClientRect(),t=r.getBoundingClientRect();(t.top<e.top||t.bottom>e.bottom||t.left<e.left||t.right>e.right)&&r.scrollIntoView({behavior:`smooth`,block:`center`,inline:`center`})}}replaceCurrent(){let e=document.getElementById(`lsReplaceInput`);e&&(this.state.replaceText=e.value);let t=document.getElementById(`lsFindInput`);if(t&&(this.state.findReplaceText=t.value),this.state.findCurrentIndex<0||this.state.findCurrentIndex>=this.state.findResults.length)return;let{col:n,row:r}=this.state.findResults[this.state.findCurrentIndex],i=n+`_`+r,a=this.state.cellData[i];if(!a)return;let o=String(a.raw||``),s=this.state.findReplaceText,c=this.state.replaceText,l=this.state.findMatchCase,u=this.state.findUseRegex,d;if(u){let e=l?`g`:`gi`;d=o.replace(new RegExp(s,e),c)}else d=l?o.split(s).join(c):o.replace(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),`gi`),c);let f={...a};a.raw=d,a.value=d,a.formula=null,this.state.modifiedCells[i]={recordId:a.recordId,fieldName:a.fieldName,value:d};let p={...a};this._pushUndo({type:`edit`,key:i,oldData:f,newData:p,colIdx:n,rowIdx:r}),this.findNext()}replaceAll(){let e=document.getElementById(`lsReplaceInput`);e&&(this.state.replaceText=e.value);let t=document.getElementById(`lsFindInput`);if(t&&(this.state.findReplaceText=t.value),this.state.findResults.length===0&&this.executeFind(),this.state.findResults.length===0)return;let n=this.state.findReplaceText,r=this.state.replaceText,i=this.state.findMatchCase,a=this.state.findUseRegex,o=0,s=[];for(let{col:e,row:t}of this.state.findResults){let c=e+`_`+t,l=this.state.cellData[c];if(!l)continue;let u=String(l.raw||``),d;if(a){let e=i?`g`:`gi`;d=u.replace(new RegExp(n,e),r)}else d=i?u.split(n).join(r):u.replace(new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`),`gi`),r);if(d!==u){let n={...l};l.raw=d,l.value=d,l.formula=null,this.state.modifiedCells[c]={recordId:l.recordId,fieldName:l.fieldName,value:d};let r={...l};s.push({type:`edit`,key:c,oldData:n,newData:r,colIdx:e,rowIdx:t}),o++}}s.length>0&&this._pushUndo({type:`batch`,actions:s}),this.state.findResults=[],this.state.findCurrentIndex=-1,alert(`Replaced `+o+` occurrence(s).`)}onFindKeydown(e){e.key===`Enter`&&(e.preventDefault(),e.shiftKey?this.findPrev():this.findNext()),e.key===`Escape`&&this.closeFindReplace()}openDataValidation(){if(!this.state.selectedCell)return;let e=prompt(`Data Validation Type:
`+[`1. List (comma-separated values)`,`2. Number (min/max range)`,`3. Text (length limit)`,`4. Date (range)`,`5. Custom formula`].join(`
`)+`

Enter number (1-5):`);if(!e)return;let t=parseInt(e)-1;if(t<0||t>4)return;let n=this._getSelectionRange();if(!n)return;let r=null;switch(t){case 0:{let e=prompt(`Enter allowed values (comma-separated):`);e&&(r={type:`list`,values:e.split(`,`).map(e=>e.trim())});break}case 1:{let e=prompt(`Minimum value (leave empty for no min):`),t=prompt(`Maximum value (leave empty for no max):`);r={type:`number`,min:e===``?null:parseFloat(e),max:t===``?null:parseFloat(t)};break}case 2:{let e=prompt(`Maximum text length:`);e&&(r={type:`text`,maxLength:parseInt(e)});break}case 3:r={type:`date`,min:prompt(`Start date (YYYY-MM-DD):`),max:prompt(`End date (YYYY-MM-DD):`)};break;case 4:{let e=prompt(`Custom formula (e.g., =LEN(A1)<=10):`);e&&(r={type:`formula`,formula:e});break}}if(r){for(let e=n.minR;e<=n.maxR;e++)for(let t=n.minC;t<=n.maxC;t++){let n=t+`_`+e;this.state.cellData[n]&&(this.state.cellData[n].format||(this.state.cellData[n].format={}),this.state.cellData[n].format.validation=r)}alert(`Data validation rule applied.`)}}removeDuplicates(){if(this.state.selectedCol<0)return;let e=this.state.selectedCol,t=new Set,n=[];for(let r=0;r<this.state.rows.length;r++){let i=String(this.getCellValue(e,r));t.has(i)?n.push(r):t.add(i)}if(n.length===0){alert(`No duplicates found.`);return}if(confirm(`Remove `+n.length+` duplicate row(s)?`)){for(let e of n.reverse())this.state.rows.splice(e,1);alert(`Removed `+n.length+` duplicate row(s).`)}}toggleGridLines(){this.state.showGridLines=!this.state.showGridLines;let e=document.querySelector(`.ls-ss-grid`);e&&e.classList.toggle(`ls-ss-no-gridlines`,!this.state.showGridLines)}zoomIn(){this.state.zoom=Math.min(200,(this.state.zoom||100)+10),this._applyZoom()}zoomOut(){this.state.zoom=Math.max(50,(this.state.zoom||100)-10),this._applyZoom()}_applyZoom(){let e=document.querySelector(`.ls-ss-container`);e&&(e.style.transform=`scale(`+this.state.zoom/100+`)`)}applyConditionalFormat(){if(!this.state.selectedCell)return;let e=this._getSelectionRange();if(!e)return;let t=[];for(let n=e.minR;n<=e.maxR;n++)for(let r=e.minC;r<=e.maxC;r++){let e=parseFloat(this.getCellValue(r,n));isNaN(e)||t.push(e)}if(t.length===0)return;let n=Math.min(...t),r=Math.max(...t)-n||1;for(let t=e.minR;t<=e.maxR;t++)for(let i=e.minC;i<=e.maxC;i++){let e=parseFloat(this.getCellValue(i,t)),a=i+`_`+t;if(this.state.cellData[a]&&(this.state.cellData[a].format||(this.state.cellData[a].format={}),!isNaN(e))){let t=(e-n)/r;t>.66?this.state.cellData[a].format.cf=`green`:t>.33?this.state.cellData[a].format.cf=`yellow`:this.state.cellData[a].format.cf=`red`}}}insertHyperlink(){if(!this.state.selectedCell)return;let e=prompt(`Enter URL:`,`https://`);if(e){let t=this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);t&&(this.startEditing(u(t[1]),parseInt(t[2])-1),this.state.editValue=e,this.commitEdit())}}_pushUndo(e){this.state.undoStack.push(e),this.state.redoStack=[],this.state.undoStack.length>100&&this.state.undoStack.shift()}_applyAction(e,t){if(e.type===`batch`){let n=t?[...e.actions].reverse():e.actions;for(let e of n)this._applyAction(e,t);return}if(e.type===`edit`){let n=t?e.oldData:e.newData;n?this.state.cellData[e.key]={...n}:delete this.state.cellData[e.key]}else if(e.type===`format`){let n=t?e.oldFormat:e.newFormat;n?this.state.cellFormats[e.key]={...n}:delete this.state.cellFormats[e.key]}else if(e.type===`sort`){let n=t?e.oldCellData:e.newCellData,r=t?e.oldRows:e.newRows;n&&(this.state.cellData=JSON.parse(JSON.stringify(n))),r&&(this.state.rows=JSON.parse(JSON.stringify(r)))}else e.type===`colWidth`&&(this.state.columns[e.colIdx].width=t?e.oldWidth:e.newWidth)}undo(){if(this.state.undoStack.length===0)return;let e=this.state.undoStack.pop();this.state.redoStack.push(e),this._applyAction(e,!0)}redo(){if(this.state.redoStack.length===0)return;let e=this.state.redoStack.pop();this.state.undoStack.push(e),this._applyAction(e,!1)}copySelection(){let e=this._getSelectionRange();if(!e)return;let t=[];for(let n=e.minR;n<=e.maxR;n++)for(let r=e.minC;r<=e.maxC;r++){let e=this.getCellData(r,n);t.push(e?{...e}:null)}this.state.clipboard=t,this.state.clipboardCols=e.maxC-e.minC+1,this.state.clipboardRows=e.maxR-e.minR+1,this.state.clipboardMode=`copy`;let n=``;for(let t=e.minR;t<=e.maxR;t++){let r=[];for(let n=e.minC;n<=e.maxC;n++)r.push(String(this.getCellValue(n,t)));n+=r.join(`	`)+`
`}navigator.clipboard?.writeText(n).catch(()=>{})}cutSelection(){this.copySelection(),this.state.clipboardMode=`cut`;let e=this._getSelectionRange();if(e)for(let t=e.minR;t<=e.maxR;t++)for(let n=e.minC;n<=e.maxC;n++)this.deleteCellValue(n,t)}pasteClipboard(){if(!this.state.selectedCell||this.state.clipboard.length===0)return;let e=this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);if(!e)return;let t=u(e[1]),n=parseInt(e[2])-1,r=this.state.clipboardCols||1,i=this.state.clipboardRows||1,a=0,o=[];for(let e=0;e<i;e++)for(let i=0;i<r;i++){let r=t+i,s=n+e;if(r>=this.state.columns.length||s>=this.state.rows.length){a++;continue}let c=this.state.clipboard[a],l=r+`_`+s,u=this.state.cellData[l]?{...this.state.cellData[l]}:null;c?(this.state.cellData[l]={...c,formula:null},this.state.modifiedCells[l]={value:c.value}):delete this.state.cellData[l];let d=this.state.cellData[l]?{...this.state.cellData[l]}:null;o.push({type:`edit`,key:l,oldData:u,newData:d,colIdx:r,rowIdx:s}),a++}o.length>0&&this._pushUndo({type:`batch`,actions:o}),this.state.clipboardMode===`cut`&&(this.state.clipboard=[],this.state.clipboardMode=null)}selectAll(){this.state.columns.length>0&&this.state.rows.length>0&&(this.state.isDragging=!1,this.selectCell(0,0),this.state.dragStart={col:0,row:0},this.state.dragEnd={col:this.state.columns.length-1,row:this.state.rows.length-1},this._updateStatusCalc())}_getSelectionRange(){if(this.state.dragStart&&this.state.dragEnd)return{minC:Math.min(this.state.dragStart.col,this.state.dragEnd.col),maxC:Math.max(this.state.dragStart.col,this.state.dragEnd.col),minR:Math.min(this.state.dragStart.row,this.state.dragEnd.row),maxR:Math.max(this.state.dragStart.row,this.state.dragEnd.row)};if(this.state.selectedCell){let e=this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);if(e){let t=u(e[1]),n=parseInt(e[2])-1;return{minC:t,maxC:t,minR:n,maxR:n}}}return null}isColSelected(e){if(this.state.selectedCol===e)return!0;let t=this._getSelectionRange();return t&&e>=t.minC&&e<=t.maxC}isRowSelected(e){if(this.state.selectedRow===e)return!0;let t=this._getSelectionRange();return t&&e>=t.minR&&e<=t.maxR}onCellMouseDown(e,t,n){e.target.classList.contains(`ls-ss-cell-editor`)||(this.state.isDragging=!0,this.state.dragStart={col:t,row:n},this.state.dragEnd={col:t,row:n})}onCellMouseMove(e,t,n){this.state.isDragging&&(this.state.dragEnd={col:t,row:n})}onCellMouseUp(e,t){this.state.isDragging&&(this.state.dragEnd={col:e,row:t},this.state.isDragging=!1)}onCellContextMenu(e,t,n){this.selectCell(t,n),this.state.contextMenu={show:!0,x:e.clientX,y:e.clientY,type:`cell`,data:{colIdx:t,rowIdx:n}}}onColumnContextMenu(e,t){this.selectColumn(t),this.state.contextMenu={show:!0,x:e.clientX,y:e.clientY,type:`column`,data:{colIdx:t}}}onRowContextMenu(e,t){this.selectRow(t),this.state.contextMenu={show:!0,x:e.clientX,y:e.clientY,type:`row`,data:{rowIdx:t}}}onSheetContextMenu(e,t){this.state.contextMenu={show:!0,x:e.clientX,y:e.clientY,type:`sheet`,data:{sheetId:t}}}closeContextMenu(){this.state.contextMenu={show:!1,x:0,y:0,type:null,data:null}}getContextMenuItems(){let e=this.state.contextMenu.type,t=this.state.contextMenu.data;return e===`cell`?[{label:`Cut`,icon:`scissors`,shortcut:`Ctrl+X`,action:()=>{this.cutSelection(),this.closeContextMenu()}},{label:`Copy`,icon:`copy`,shortcut:`Ctrl+C`,action:()=>{this.copySelection(),this.closeContextMenu()}},{label:`Paste`,icon:`clipboard`,shortcut:`Ctrl+V`,action:()=>{this.pasteClipboard(),this.closeContextMenu()},disabled:this.state.clipboard.length===0},{separator:!0},{label:`Insert Row Above`,icon:`arrow-up`,action:()=>{this.insertRowAbove(t.rowIdx),this.closeContextMenu()}},{label:`Insert Row Below`,icon:`arrow-down`,action:()=>{this.insertRowBelow(t.rowIdx),this.closeContextMenu()}},{label:`Delete Row`,icon:`trash-2`,action:()=>{this.deleteRow(t.rowIdx),this.closeContextMenu()}},{separator:!0},{label:`Insert Column Left`,icon:`arrow-left`,action:()=>{this.insertColumnLeft(t.colIdx),this.closeContextMenu()}},{label:`Insert Column Right`,icon:`arrow-right`,action:()=>{this.insertColumnRight(t.colIdx),this.closeContextMenu()}},{label:`Delete Column`,icon:`trash-2`,action:()=>{this.deleteColumn(t.colIdx),this.closeContextMenu()}},{separator:!0},{label:`Sort A→Z`,icon:`arrow-up-narrow-wide`,action:()=>{this.sortColumn(t.colIdx,`asc`),this.closeContextMenu()}},{label:`Sort Z→A`,icon:`arrow-down-wide-narrow`,action:()=>{this.sortColumn(t.colIdx,`desc`),this.closeContextMenu()}},{separator:!0},{label:`Bold`,icon:`bold`,action:()=>{this.toggleFormat(`bold`),this.closeContextMenu()}},{label:`Italic`,icon:`italic`,action:()=>{this.toggleFormat(`italic`),this.closeContextMenu()}},{label:`Strikethrough`,icon:`strikethrough`,action:()=>{this.toggleFormat(`strikethrough`),this.closeContextMenu()}},{label:`Clear Cell`,icon:`eraser`,action:()=>{this.deleteCellValue(t.colIdx,t.rowIdx),this.closeContextMenu()}}]:e===`column`?[{label:`Sort A→Z`,icon:`arrow-up-narrow-wide`,action:()=>{this.sortColumn(t.colIdx,`asc`),this.closeContextMenu()}},{label:`Sort Z→A`,icon:`arrow-down-wide-narrow`,action:()=>{this.sortColumn(t.colIdx,`desc`),this.closeContextMenu()}},{separator:!0},{label:`Insert Column Left`,icon:`arrow-left`,action:()=>{this.insertColumnLeft(t.colIdx),this.closeContextMenu()}},{label:`Insert Column Right`,icon:`arrow-right`,action:()=>{this.insertColumnRight(t.colIdx),this.closeContextMenu()}},{label:`Delete Column`,icon:`trash-2`,action:()=>{this.deleteColumn(t.colIdx),this.closeContextMenu()}},{separator:!0},{label:`Hide Column`,icon:`eye-off`,action:()=>{this.hideColumn(t.colIdx),this.closeContextMenu()}},{label:`Auto-fit Width`,icon:`maximize-2`,action:()=>{this.autoFitColumn(t.colIdx),this.closeContextMenu()}}]:e===`row`?[{label:`Insert Row Above`,icon:`arrow-up`,action:()=>{this.insertRowAbove(t.rowIdx),this.closeContextMenu()}},{label:`Insert Row Below`,icon:`arrow-down`,action:()=>{this.insertRowBelow(t.rowIdx),this.closeContextMenu()}},{label:`Delete Row`,icon:`trash-2`,action:()=>{this.deleteRow(t.rowIdx),this.closeContextMenu()}}]:e===`sheet`?[{label:`Rename`,icon:`edit`,action:()=>{this.renameSheet(t.sheetId),this.closeContextMenu()}},{label:`Duplicate`,icon:`copy`,action:()=>{this.duplicateSheet(t.sheetId),this.closeContextMenu()}},{separator:!0},{label:`Delete`,icon:`trash-2`,action:()=>{this.deleteSheet(t.sheetId),this.closeContextMenu()},disabled:this.state.sheets.length<=1}]:[]}_shiftCols(e,t){let n={},r={},i=t<0?e+t:e;for(let r in this.state.cellData){let[a,o]=r.split(`_`),s=parseInt(a),c=parseInt(o);if(s>=e){let e=s+t;e>=i&&(n[e+`_`+c]=this.state.cellData[r])}else s<i&&(n[r]=this.state.cellData[r])}for(let n in this.state.cellFormats){let[a,o]=n.split(`_`),s=parseInt(a),c=parseInt(o);if(s>=e){let e=s+t;e>=i&&(r[e+`_`+c]=this.state.cellFormats[n])}else s<i&&(r[n]=this.state.cellFormats[n])}this.state.cellData=n,this.state.cellFormats=r,this._clearIntersectingMerges(e,t,!0)}_shiftRows(e,t){let n={},r={},i=t<0?e+t:e;for(let r in this.state.cellData){let[a,o]=r.split(`_`),s=parseInt(a),c=parseInt(o);if(c>=e){let e=c+t;e>=i&&(n[s+`_`+e]=this.state.cellData[r])}else c<i&&(n[r]=this.state.cellData[r])}for(let n in this.state.cellFormats){let[a,o]=n.split(`_`),s=parseInt(a),c=parseInt(o);if(c>=e){let e=c+t;e>=i&&(r[s+`_`+e]=this.state.cellFormats[n])}else c<i&&(r[n]=this.state.cellFormats[n])}this.state.cellData=n,this.state.cellFormats=r,this._clearIntersectingMerges(e,t,!1)}_clearIntersectingMerges(e,t,n){let r=t<0?e+t:e;for(let i in this.state.mergedCells){let a=this.state.mergedCells[i],o=n?a.minC:a.minR,s=n?a.maxC:a.maxR;o>=e?n?(a.minC+=t,a.maxC+=t):(a.minR+=t,a.maxR+=t):s>=r&&delete this.state.mergedCells[i]}}insertColumnLeft(e){this.state.columns.splice(e,0,{idx:e,name:`new_`+Date.now(),letter:l(e),label:`New`,width:this.state.viewDef.column_width||120,hidden:!1}),this._shiftCols(e,1),this._reindexColumns()}insertColumnRight(e){this.state.columns.splice(e+1,0,{idx:e+1,name:`new_`+Date.now(),letter:l(e+1),label:`New`,width:this.state.viewDef.column_width||120,hidden:!1}),this._shiftCols(e+1,1),this._reindexColumns()}deleteColumn(e){this.state.columns.length<=1||(this.state.columns.splice(e,1),this._shiftCols(e+1,-1),this._reindexColumns())}hideColumn(e){this.state.columns[e]&&(this.state.columns[e].hidden=!0)}autoFitColumn(e){let t=50,n=this.state.columns[e];if(n){t=Math.max(t,n.label.length*8+20);for(let n=0;n<Math.min(this.state.rows.length,100);n++)t=Math.max(t,String(this.getCellValue(e,n)).length*7+20);this.state.columns[e].width=Math.min(t,400)}}insertRowAbove(e){this.state.rows.splice(e,0,{idx:e,record:null}),this._shiftRows(e,1),this._reindexRows()}insertRowBelow(e){this.state.rows.splice(e+1,0,{idx:e+1,record:null}),this._shiftRows(e+1,1),this._reindexRows()}deleteRow(e){this.state.rows.length<=1||(this.state.rows.splice(e,1),this._shiftRows(e+1,-1),this._reindexRows())}_reindexColumns(){this.state.columns.forEach((e,t)=>{e.idx=t,e.letter=l(t)})}_reindexRows(){this.state.rows.forEach((e,t)=>{e.idx=t})}sortColumn(e,t){let n=this.state.columns[e];if(!n)return;let r=this.state.fields[n.name],i=r&&[`integer`,`float`,`monetary`].includes(r.type),a=this.state.rows.filter(e=>e.record),o=this.state.rows.filter(e=>!e.record),s={...this.state.cellData},c=[...this.state.rows];a.sort((n,r)=>{let a=this.getCellValue(e,n.idx),o=this.getCellValue(e,r.idx);return i?t===`asc`?(parseFloat(a)||0)-(parseFloat(o)||0):(parseFloat(o)||0)-(parseFloat(a)||0):t===`asc`?String(a).toLowerCase().localeCompare(String(o).toLowerCase()):String(o).toLowerCase().localeCompare(String(a).toLowerCase())}),this.state.rows=[...a,...o],this._reindexRows();let l={};for(let e of this.state.rows)for(let t of this.state.columns)if(e.record){for(let n of c)if(n.record&&n.record.id===e.record.id){let r=t.idx+`_`+n.idx;s[r]&&(l[t.idx+`_`+e.idx]={...s[r]});break}}this.state.cellData=l,this.state.sortCol=e,this.state.sortDir=t,this._pushUndo({type:`sort`,oldCellData:s,oldRows:c,newCellData:{...l},newRows:[...this.state.rows]})}toggleFreeze(){if(this.state.freezeCol>=0||this.state.freezeRow>=0)this.state.freezeCol=-1,this.state.freezeRow=-1;else if(this.state.selectedCell){let e=this.state.selectedCell.match(/^([A-Z]+)(\d+)$/);e&&(this.state.freezeCol=u(e[1]),this.state.freezeRow=parseInt(e[2])-2)}}getStickyLeft(e){let t=50;for(let n=0;n<e;n++)t+=this.state.columns[n]?.width||120;return t}getStickyTop(e){return 28}addChart(){this.state.chartForm={type:`bar`,title:`Chart`,labelCol:0,dataCols:[1],stacked:!1,horizontal:!1,showLegend:!0,colors:[`#6366f1`,`#f59e0b`,`#10b981`,`#ef4444`,`#8b5cf6`,`#ec4899`]},this.state.chartDialog={show:!0,editingId:null},setTimeout(()=>this._renderChartPreview(),100)}editChart(e){let t=this.state.charts.find(t=>t.id===e);t&&(this.state.chartForm={type:t.type,title:t.title,labelCol:t.labelCol,dataCols:[...t.dataCols],stacked:t.stacked||!1,horizontal:t.horizontal||!1,showLegend:t.showLegend!==!1,colors:[...t.colors||[`#6366f1`,`#f59e0b`,`#10b981`,`#ef4444`,`#8b5cf6`,`#ec4899`]]},this.state.chartDialog={show:!0,editingId:e},setTimeout(()=>this._renderChartPreview(),100))}closeChartDialog(){this.state.chartDialog={show:!1,editingId:null}}addSeries(){let e=this.state.chartForm.dataCols.length>0?Math.max(...this.state.chartForm.dataCols)+1:1;e<this.state.columns.length&&(this.state.chartForm.dataCols.push(e),setTimeout(()=>this._renderChartPreview(),50))}removeSeries(e){this.state.chartForm.dataCols.length>1&&(this.state.chartForm.dataCols.splice(e,1),setTimeout(()=>this._renderChartPreview(),50))}saveChart(){let e=this.state.chartForm,t=this.state.chartDialog.editingId?this.state.charts.find(e=>e.id===this.state.chartDialog.editingId):null,n={id:this.state.chartDialog.editingId||`chart_`+Date.now(),type:e.type,title:e.title||`Chart`,labelCol:e.labelCol,dataCols:[...e.dataCols],stacked:e.stacked,horizontal:e.horizontal,showLegend:e.showLegend,colors:[...e.colors],x:t?.x||20+this.state.charts.length*30,y:t?.y||20+this.state.charts.length*30,width:t?.width||480};if(this.state.chartDialog.editingId){let e=this.state.charts.findIndex(e=>e.id===this.state.chartDialog.editingId);e>=0&&(this.state.charts[e]=n)}else this.state.charts.push(n);this.closeChartDialog(),setTimeout(()=>this._renderAllCharts(),100)}removeChart(e){confirm(`Remove this chart?`)&&(this.state.charts=this.state.charts.filter(t=>t.id!==e))}onChartMouseDown(e,t){if(e.target.closest(`.ls-ss-chart-btn`)||e.target.closest(`.ls-ss-chart-close`))return;let n=this.state.charts.find(e=>e.id===t);if(!n)return;let r=e.clientX,i=e.clientY,a=n.x||20,o=n.y||20,s=e=>{let t=e.clientX-r,s=e.clientY-i;n.x=Math.max(0,a+t),n.y=Math.max(0,o+s)},c=()=>{document.removeEventListener(`mousemove`,s),document.removeEventListener(`mouseup`,c)};document.addEventListener(`mousemove`,s),document.addEventListener(`mouseup`,c)}resizeChart(e){let t=this.state.charts.find(t=>t.id===e);if(!t)return;let n=[360,480,600,720];t.width=n[(n.indexOf(t.width)+1)%n.length],setTimeout(()=>this._renderAllCharts(),50)}_renderAllCharts(){this.state.charts.forEach(e=>{let t=document.getElementById(e.id);t&&this._renderChartOnCanvas(t,e)})}_renderChartPreview(){let e=document.getElementById(`chartPreviewCanvas`);if(!e)return;let t=this.state.chartForm;this._renderChartOnCanvas(e,{type:t.type,title:t.title,labelCol:t.labelCol,dataCols:t.dataCols,stacked:t.stacked,horizontal:t.horizontal,showLegend:t.showLegend,colors:t.colors})}_getChartData(e){let t=[],n=[],r=e.labelCol||0;for(let e=0;e<Math.min(this.state.rows.length,50);e++){let n=this.getCellValue(r,e);n!==``&&n!=null&&t.push(String(n).substring(0,20))}for(let r of e.dataCols||[]){let e=[];for(let n=0;n<t.length;n++)e.push(parseFloat(this.getCellValue(r,n))||0);n.push(e)}return{labels:t,seriesData:n}}_renderChartOnCanvas(e,t){let n=e.getContext(`2d`);if(!n)return;let r=window.devicePixelRatio||1,i=e.parentElement.getBoundingClientRect().width||500;e.width=i*r,e.height=300*r,e.style.width=i+`px`,e.style.height=`300px`,n.scale(r,r),n.clearRect(0,0,i,300),n.fillStyle=`#fff`,n.fillRect(0,0,i,300);let{labels:a,seriesData:o}=this._getChartData(t);if(a.length===0){n.fillStyle=`#999`,n.font=`14px sans-serif`,n.textAlign=`center`,n.fillText(`No data available`,i/2,300/2);return}let s=t.colors||[`#6366f1`,`#f59e0b`,`#10b981`,`#ef4444`,`#8b5cf6`,`#ec4899`],c={top:45,right:20,bottom:60,left:55},l=i-c.left-c.right,u=300-c.top-c.bottom,d=0;for(let e of o)for(let t of e)t>d&&(d=t);if(d===0&&(d=1),d*=1.1,n.fillStyle=`#1e293b`,n.font=`bold 14px sans-serif`,n.textAlign=`center`,n.fillText(t.title,i/2,25),t.type===`pie`||t.type===`doughnut`){this._drawPieChart(n,i,300,c,a,o[0]||[],s,t.type===`doughnut`);return}if(t.horizontal){this._drawHorizontalBar(n,i,300,c,l,u,d,a,o,s,t);return}n.strokeStyle=`#e5e7eb`,n.lineWidth=1;for(let e=0;e<=5;e++){let t=c.top+u/5*e;n.beginPath(),n.moveTo(c.left,t),n.lineTo(i-c.right,t),n.stroke(),n.fillStyle=`#94a3b8`,n.font=`10px sans-serif`,n.textAlign=`right`;let r=Math.round(d*(1-e/5));n.fillText(r.toLocaleString(),c.left-8,t+4)}let f=a.length,p=o.length,m=l/f,h=t.stacked?m*.6:m*.6/p,g=m*.1;if(a.forEach((e,r)=>{let i=c.left+r*m,a=0;o.forEach((e,o)=>{let l=e[r]||0,f=l/d*u;if(n.fillStyle=s[o%s.length],t.stacked){let e=i+g,t=c.top+u-a-f;n.fillRect(e,t,h,f),f>14&&(n.fillStyle=`#fff`,n.font=`bold 10px sans-serif`,n.textAlign=`center`,n.fillText(l,e+h/2,t+f/2+3)),a+=f}else{let e=i+g+o*h,t=c.top+u-f,r=Math.min(4,h/2,f/2);this._roundedRect(n,e,t,h-1,f,r,r,0,0),f>14&&(n.fillStyle=`#fff`,n.font=`bold 10px sans-serif`,n.textAlign=`center`,n.fillText(l,e+h/2,t+f/2+3))}}),n.save();let l=i+m/2,f=c.top+u+12;n.translate(l,f),n.rotate(-Math.PI/5),n.fillStyle=`#64748b`,n.font=`11px sans-serif`,n.textAlign=`right`,n.fillText(e.substring(0,15),0,0),n.restore()}),t.type===`line`&&o.forEach((e,t)=>{let r=s[t%s.length];n.strokeStyle=r,n.lineWidth=2.5,n.beginPath(),e.forEach((e,t)=>{let r=c.left+t*m+m/2,i=c.top+u-e/d*u;t===0?n.moveTo(r,i):n.lineTo(r,i)}),n.stroke(),e.forEach((e,t)=>{let i=c.left+t*m+m/2,a=c.top+u-e/d*u;n.fillStyle=`#fff`,n.beginPath(),n.arc(i,a,4,0,Math.PI*2),n.fill(),n.strokeStyle=r,n.lineWidth=2,n.stroke()})}),t.showLegend&&p>0){let e=i-c.right;n.textAlign=`right`,n.font=`11px sans-serif`;for(let r=p-1;r>=0;r--){let i=this.state.columns[t.dataCols[r]]?.label||`Series `+(r+1),a=n.measureText(i).width;e-=a,n.fillStyle=`#64748b`,n.fillText(i,e,35),e-=16,n.fillStyle=s[r%s.length],n.fillRect(e,26,12,12),e-=8}}}_drawHorizontalBar(e,t,n,r,i,a,o,s,c,l,u){let d=s.length,f=c.length,p=a/d,m=u.stacked?p*.6:p*.6/f,h=p*.2;for(let t=0;t<=5;t++){let a=r.left+i/5*t;e.strokeStyle=`#e5e7eb`,e.lineWidth=1,e.beginPath(),e.moveTo(a,r.top),e.lineTo(a,n-r.bottom),e.stroke(),e.fillStyle=`#94a3b8`,e.font=`10px sans-serif`,e.textAlign=`center`,e.fillText(Math.round(o*t/5).toLocaleString(),a,n-r.bottom+15)}s.forEach((t,n)=>{let a=r.top+n*p,s=0;c.forEach((t,c)=>{let d=(t[n]||0)/o*i;if(e.fillStyle=l[c%l.length],u.stacked){let t=a+h;e.fillRect(r.left+s,t,d,m),s+=d}else{let t=a+h+c*m,n=Math.min(3,m/2,d/2);this._roundedRect(e,r.left,t,d,m-1,0,n,n,0)}}),e.fillStyle=`#64748b`,e.font=`11px sans-serif`,e.textAlign=`right`,e.fillText(t.substring(0,20),r.left-8,a+p/2+4)})}_drawPieChart(e,t,n,r,i,a,o,s){let c=a.reduce((e,t)=>e+Math.abs(t),0);if(c===0)return;let l=t/2-40,u=n/2+10,d=Math.min(t,n)/2-60,f=s?d*.55:0,p=-Math.PI/2;if(a.forEach((t,n)=>{if(t<=0)return;let r=t/c*Math.PI*2;e.fillStyle=o[n%o.length],e.beginPath(),e.moveTo(l+f*Math.cos(p),u+f*Math.sin(p)),e.arc(l,u,d,p,p+r),e.arc(l,u,f,p+r,p,!0),e.closePath(),e.fill();let i=p+r/2,a=(t/c*100).toFixed(1);if(parseFloat(a)>3){let t=l+d*.75*Math.cos(i),n=u+d*.75*Math.sin(i);e.fillStyle=`#fff`,e.font=`bold 11px sans-serif`,e.textAlign=`center`,e.fillText(a+`%`,t,n+4)}p+=r}),i.length>0){let n=t-100,s=r.top+10;e.font=`11px sans-serif`,e.textAlign=`left`,i.forEach((t,r)=>{r>=a.length||a[r]<=0||(e.fillStyle=o[r%o.length],e.fillRect(n,s-8,12,12),e.fillStyle=`#475569`,e.fillText(t.substring(0,15),n+18,s+2),s+=20)})}}_roundedRect(e,t,n,r,i,a,o,s,c){e.beginPath(),e.moveTo(t+a,n),e.lineTo(t+r-o,n),e.quadraticCurveTo(t+r,n,t+r,n+o),e.lineTo(t+r,n+i-s),e.quadraticCurveTo(t+r,n+i,t+r-s,n+i),e.lineTo(t+c,n+i),e.quadraticCurveTo(t,n+i,t,n+i-c),e.lineTo(t,n+a),e.quadraticCurveTo(t,n,t+a,n),e.closePath(),e.fill()}onColResizeStart(e,t){e.preventDefault(),this.state.resizeStartX=e.clientX,this.state.resizeStartWidth=this.state.columns[t].width;let n=this.state.columns[t].width,r=e=>{this.state.columns[t].width=Math.max(60,this.state.resizeStartWidth+(e.clientX-this.state.resizeStartX))},i=()=>{document.removeEventListener(`mousemove`,r),document.removeEventListener(`mouseup`,i),this._pushUndo({type:`colWidth`,colIdx:t,oldWidth:n,newWidth:this.state.columns[t].width})};document.addEventListener(`mousemove`,r),document.addEventListener(`mouseup`,i)}getAggregation(e){let t=this.state.columns[e];if(!t)return``;let n=this.state.fields[t.name];if(!n||![`integer`,`float`,`monetary`].includes(n.type))return``;let r=0,i=0;for(let t of this.state.rows){let n=parseFloat(this.getCellValue(e,t.idx));isNaN(n)||(r+=n,i++)}if(i===0)return``;let a=this.state.viewDef.aggregation||`sum`;return a===`avg`?(r/i).toFixed(2):a===`count`?i:Math.round(r*100)/100}_saveCurrentSheetData(){this.state.sheetData[this.state.activeSheet]={cellData:{...this.state.cellData},cellFormats:{...this.state.cellFormats},mergedCells:{...this.state.mergedCells},charts:JSON.parse(JSON.stringify(this.state.charts)),columns:JSON.parse(JSON.stringify(this.state.columns))}}_loadSheetData(e){let t=this.state.sheetData[e];t?(this.state.cellData=t.cellData||{},this.state.cellFormats=t.cellFormats||{},this.state.mergedCells=t.mergedCells||{},this.state.charts=t.charts||[],t.columns&&t.columns.length>0&&(this.state.columns=t.columns)):(this.state.cellData={},this.state.cellFormats={},this.state.mergedCells={},this.state.charts=[])}setActiveSheet(e){e!==this.state.activeSheet&&(this._saveCurrentSheetData(),this.state.activeSheet=e,this._loadSheetData(e))}addSheet(){this._saveCurrentSheetData();let e=`sheet`+(this.state.sheets.length+1);this.state.sheets.push({id:e,name:`Sheet`+this.state.sheets.length}),this.state.activeSheet=e,this.state.cellData={},this.state.cellFormats={},this.state.mergedCells={},this.state.charts=[]}renameSheet(e){let t=this.state.sheets.find(t=>t.id===e);if(!t)return;let n=prompt(`Rename:`,t.name);n&&(t.name=n)}duplicateSheet(e){this._saveCurrentSheetData();let t=this.state.sheets.find(t=>t.id===e);if(!t)return;let n=`sheet`+(this.state.sheets.length+1);this.state.sheets.push({id:n,name:t.name+` (Copy)`});let r=this.state.sheetData[e]||{};this.state.sheetData[n]={cellData:JSON.parse(JSON.stringify(r.cellData||this.state.cellData)),cellFormats:JSON.parse(JSON.stringify(r.cellFormats||this.state.cellFormats)),mergedCells:JSON.parse(JSON.stringify(r.mergedCells||this.state.mergedCells)),charts:JSON.parse(JSON.stringify(r.charts||this.state.charts)),columns:JSON.parse(JSON.stringify(r.columns||this.state.columns))}}deleteSheet(e){this.state.sheets.length<=1||confirm(`Delete sheet?`)&&(this.state.sheets=this.state.sheets.filter(t=>t.id!==e),delete this.state.sheetData[e],this.state.activeSheet===e&&(this.state.activeSheet=this.state.sheets[0].id,this._loadSheetData(this.state.activeSheet)))}exportCSV(){let e=this.state.columns.filter(e=>!e.hidden).map(e=>`"`+e.label.replace(/"/g,`""`)+`"`).join(`,`)+`
`;for(let t of this.state.rows)t.record&&(e+=this.state.columns.filter(e=>!e.hidden).map(e=>`"`+String(this.getCellValue(e.idx,t.idx)).replace(/"/g,`""`)+`"`).join(`,`)+`
`);let t=new Blob([e],{type:`text/csv;charset=utf-8;`}),n=document.createElement(`a`);n.href=URL.createObjectURL(t),n.download=(this.props.actionTitle||`spreadsheet`)+`.csv`,n.click()}exportExcel(){let e=`<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8"></head><body><table border="1">`;e+=`<tr>`+this.state.columns.filter(e=>!e.hidden).map(e=>`<th style="background:#4f46e5;color:#fff;font-weight:bold;padding:6px 12px">`+c(e.label)+`</th>`).join(``)+`</tr>`;for(let t of this.state.rows)t.record&&(e+=`<tr>`+this.state.columns.filter(e=>!e.hidden).map(e=>`<td style="padding:4px 8px">`+c(String(this.getCellValue(e.idx,t.idx)))+`</td>`).join(``)+`</tr>`);e+=`</table></body></html>`;let t=new Blob([e],{type:`application/vnd.ms-excel`}),n=document.createElement(`a`);n.href=URL.createObjectURL(t),n.download=(this.props.actionTitle||`spreadsheet`)+`.xls`,n.click()}async saveData(){let e=Object.keys(this.state.modifiedCells);if(!(e.length===0&&!this.engine))try{for(let t of e){let{recordId:e,fieldName:n,value:r}=this.state.modifiedCells[t];e&&n&&await s.write(this._model,[e],{[n]:r})}if(this.state.modifiedCells={},this.engine&&this.engine.isInitialized){this._saveCurrentSheetData(),this.engine.saveToJSON();let e={sheetData:this.state.sheetData,sheets:this.state.sheets,activeSheet:this.state.activeSheet};await s.create(`spreadsheet.document`,{name:this._model+` Spreadsheet`,spreadsheet_data:JSON.stringify(e),raw_data:e})}await this.loadData()}catch(e){alert(`Save failed: `+e.message)}}async loadSpreadsheet(e){if(!(!this.engine||!this.engine.isInitialized))try{let t=await s.read(`spreadsheet.document`,e);if(t&&t.spreadsheet_data){let e=typeof t.spreadsheet_data==`string`?JSON.parse(t.spreadsheet_data):t.spreadsheet_data;e.sheetData?this.state.sheetData=e.sheetData:this.state.sheetData={sheet1:{cellData:e.cells||{},cellFormats:{},mergedCells:e.mergedCells||{},charts:e.charts||[],columns:e.columns||[]}},e.sheets&&(this.state.sheets=e.sheets),e.activeSheet&&(this.state.activeSheet=e.activeSheet),this._loadSheetData(this.state.activeSheet),this.engine.loadFromJSON(e)}}catch(e){console.error(`Load spreadsheet error:`,e)}}async refreshData(){await this.loadData()}}window.SpreadsheetView=p})();