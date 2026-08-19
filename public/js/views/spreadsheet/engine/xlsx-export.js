/**
 * XLSX Export - Real XLSX export using SheetJS (client-side)
 * Falls back to CSV if SheetJS not available
 */
(function() {
    'use strict';

    class SpreadsheetExport {
        constructor(model, config = {}) {
            this._model = model;
            this._sheetJS = config.sheetJS || window.XLSX || null;
        }

        get hasSheetJS() {
            return this._sheetJS !== null;
        }

        exportToCSV(filename = 'spreadsheet.csv') {
            const csv = this._generateCSV();
            this._download(csv, filename, 'text/csv;charset=utf-8;');
            return csv;
        }

        exportToXLSX(filename = 'spreadsheet.xlsx') {
            if (!this.hasSheetJS) {
                console.warn('SheetJS not available, falling back to CSV');
                return this.exportToCSV(filename.replace('.xlsx', '.csv'));
            }

            const wb = this._sheetJS.utils.book_new();

            for (const sheet of this._model.sheets) {
                const data = this._getSheetData(sheet.id);
                const ws = this._sheetJS.utils.aoa_to_sheet(data);

                this._applyStyles(ws, sheet.id);
                this._applyColumnWidths(ws, sheet.id);

                const sheetName = sheet.name.substring(0, 31).replace(/[\\\/\*\?\[\]]/g, '');
                this._sheetJS.utils.book_append_sheet(wb, ws, sheetName);
            }

            if (this._model.sheets.length === 1) {
                const ws = wb.Sheets[wb.SheetNames[0]];
                this._sheetJS.utils.book_append_sheet(wb, ws, 'Sheet1');
            }

            this._sheetJS.writeFile(wb, filename);
            return wb;
        }

        exportToJSON(filename = 'spreadsheet.json') {
            const data = this._model.toJSON();
            const json = JSON.stringify(data, null, 2);
            this._download(json, filename, 'application/json');
            return data;
        }

        exportToHTML(filename = 'spreadsheet.html') {
            const html = this._generateHTML();
            this._download(html, filename, 'text/html');
            return html;
        }

        _generateCSV() {
            const rows = [];
            const sheet = this._model.getActiveSheet();
            if (!sheet) return '';

            const maxCol = this._findLastUsedCol();
            const maxRow = this._findLastUsedRow();

            for (let r = 0; r <= maxRow; r++) {
                const row = [];
                for (let c = 0; c <= maxCol; c++) {
                    const val = this._model.getCellFormattedValue(c, r);
                    row.push(this._escapeCSV(val));
                }
                rows.push(row.join(','));
            }

            return rows.join('\n');
        }

        _escapeCSV(val) {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        }

        _getSheetData(sheetId) {
            const rows = [];
            const maxCol = this._findLastUsedCol(sheetId);
            const maxRow = this._findLastUsedRow(sheetId);

            for (let r = 0; r <= maxRow; r++) {
                const row = [];
                for (let c = 0; c <= maxCol; c++) {
                    const cell = this._model.getCellFromSheet ? this._model.getCellFromSheet(sheetId, c, r) : this._model.getCell(c, r, sheetId);
                    if (cell) {
                        if (cell.type === window.SpreadsheetCellType.FORMULA) {
                            const result = cell.value;
                            row.push(result !== null && result !== undefined ? result : '');
                        } else {
                            row.push(cell.value !== null && cell.value !== undefined ? cell.value : '');
                        }
                    } else {
                        row.push('');
                    }
                }
                rows.push(row);
            }

            return rows;
        }

        _applyStyles(ws, sheetId) {
            if (!this.hasSheetJS) return;

            const range = this._sheetJS.utils.decode_range(ws['!ref'] || 'A1');

            for (let r = range.s.r; r <= range.e.r; r++) {
                for (let c = range.s.c; c <= range.e.c; c++) {
                    const cellRef = this._sheetJS.utils.encode_cell({ r, c });
                    const cell = this._model.getCellFromSheet ? this._model.getCellFromSheet(sheetId, c, r) : this._model.getCell(c, r, sheetId);

                    if (!cell) continue;

                    const style = {};
                    const fmt = cell.format;

                    if (fmt) {
                        if (fmt.bold) style.font = { ...(style.font || {}), bold: true };
                        if (fmt.italic) style.font = { ...(style.font || {}), italic: true };
                        if (fmt.underline) style.font = { ...(style.font || {}), underline: true };
                        if (fmt.strikethrough) style.font = { ...(style.font || {}), strike: true };
                        if (fmt.color) style.font = { ...(style.font || {}), color: { rgb: fmt.color.replace('#', '') } };
                        if (fmt.fontSize) style.font = { ...(style.font || {}), sz: fmt.fontSize };
                        if (fmt.bgColor) style.fill = { fgColor: { rgb: fmt.bgColor.replace('#', '') } };
                        if (fmt.align) style.alignment = { horizontal: fmt.align };
                        if (fmt.numberFormat) {
                            style.numFmt = this._getNumberFormatCode(fmt.numberFormat, fmt.decimalPlaces);
                        }
                    }

                    if (Object.keys(style).length > 0) {
                        if (!ws[cellRef]) ws[cellRef] = {};
                        ws[cellRef].s = style;
                    }
                }
            }
        }

        _applyColumnWidths(ws, sheetId) {
            if (!this.hasSheetJS) return;

            const widths = [];
            for (let c = 0; c < this._model.colCount; c++) {
                const w = this._model.getColWidth(c);
                widths.push({ wch: w / 7 });
            }
            ws['!cols'] = widths;
        }

        _getNumberFormatCode(format, decimals = 2) {
            switch (format) {
                case 'number': return `#,##0.${'0'.repeat(decimals)}`;
                case 'currency': return `$#,##0.00`;
                case 'percent': return `0.${'0'.repeat(decimals)}%`;
                case 'date': return `yyyy-mm-dd`;
                default: return 'General';
            }
        }

        _findLastUsedCol(sheetId = null) {
            for (let c = this._model.colCount - 1; c >= 0; c--) {
                for (let r = 0; r < Math.min(this._model.rowCount, 100); r++) {
                    const cell = sheetId
                        ? (this._model.getCellFromSheet ? this._model.getCellFromSheet(sheetId, c, r) : null)
                        : this._model.getCell(c, r);
                    if (cell && cell.raw !== '' && cell.raw !== null) return c;
                }
            }
            return 0;
        }

        _findLastUsedRow(sheetId = null) {
            for (let r = this._model.rowCount - 1; r >= 0; r--) {
                for (let c = 0; c < Math.min(this._model.colCount, 26); c++) {
                    const cell = sheetId
                        ? (this._model.getCellFromSheet ? this._model.getCellFromSheet(sheetId, c, r) : null)
                        : this._model.getCell(c, r);
                    if (cell && cell.raw !== '' && cell.raw !== null) return r;
                }
            }
            return 0;
        }

        _generateHTML() {
            const maxCol = this._findLastUsedCol();
            const maxRow = this._findLastUsedRow();

            let html = '<!DOCTYPE html>\n<html>\n<head>\n';
            html += '<meta charset="UTF-8">\n';
            html += '<title>Spreadsheet Export</title>\n';
            html += '<style>\n';
            html += 'table { border-collapse: collapse; font-family: Arial, sans-serif; }\n';
            html += 'th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }\n';
            html += 'th { background: #f3f4f6; font-weight: bold; }\n';
            html += '.number { text-align: right; }\n';
            html += '.bold { font-weight: bold; }\n';
            html += '.italic { font-style: italic; }\n';
            html += '</style>\n</head>\n<body>\n';
            html += '<table>\n';

            html += '<thead><tr>';
            html += '<th></th>';
            for (let c = 0; c <= maxCol; c++) {
                html += `<th>${window.SpreadsheetRange.colToLetter(c)}</th>`;
            }
            html += '</tr></thead>\n';

            html += '<tbody>\n';
            for (let r = 0; r <= maxRow; r++) {
                html += `<tr><th>${r + 1}</th>`;
                for (let c = 0; c <= maxCol; c++) {
                    const val = this._model.getCellFormattedValue(c, r);
                    const cell = this._model.getCell(c, r);
                    const classes = [];

                    if (cell && cell.format) {
                        if (cell.format.bold) classes.push('bold');
                        if (cell.format.italic) classes.push('italic');
                        if (cell.format.align === 'right' || cell.format.numberFormat !== 'general') {
                            classes.push('number');
                        }
                    }

                    const classStr = classes.length ? ` class="${classes.join(' ')}"` : '';
                    html += `<td${classStr}>${this._escapeHTML(val)}</td>`;
                }
                html += '</tr>\n';
            }
            html += '</tbody>\n</table>\n</body>\n</html>';

            return html;
        }

        _escapeHTML(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        _download(content, filename, mimeType) {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    window.SpreadsheetExport = SpreadsheetExport;
})();
