/**
 * Formula Engine - Full Lexer/Parser with 40+ functions
 * Follows Odoo o-spreadsheet formula engine pattern
 */
(function() {
    'use strict';

    const TokenType = Object.freeze({
        NUMBER: 'NUMBER',
        STRING: 'STRING',
        BOOLEAN: 'BOOLEAN',
        CELL_REF: 'CELL_REF',
        RANGE: 'RANGE',
        FUNCTION: 'FUNCTION',
        OPERATOR: 'OPERATOR',
        LPAREN: 'LPAREN',
        RPAREN: 'RPAREN',
        COMMA: 'COMMA',
        COLON: 'COLON',
        SEMICOLON: 'SEMICOLON',
        ERROR: 'ERROR',
        EOF: 'EOF',
    });

    const OperatorType = Object.freeze({
        ADD: '+',
        SUB: '-',
        MUL: '*',
        DIV: '/',
        MOD: '%',
        POW: '^',
        EQ: '=',
        NEQ: '<>',
        LT: '<',
        GT: '>',
        LTE: '<=',
        GTE: '>=',
        CONCAT: '&',
    });

    const ASTNodeType = Object.freeze({
        NUMBER: 'NUMBER',
        STRING: 'STRING',
        BOOLEAN: 'BOOLEAN',
        CELL_REF: 'CELL_REF',
        RANGE: 'RANGE',
        FUNCTION_CALL: 'FUNCTION_CALL',
        BINARY_OP: 'BINARY_OP',
        UNARY_OP: 'UNARY_OP',
        ERROR: 'ERROR',
    });

    class Token {
        constructor(type, value, start = 0, end = 0) {
            this.type = type;
            this.value = value;
            this.start = start;
            this.end = end;
        }
    }

    class Lexer {
        constructor(formula) {
            this.formula = formula;
            this.pos = 0;
            this.tokens = [];
        }

        tokenize() {
            this.tokens = [];
            while (this.pos < this.formula.length) {
                this._skipSpaces();
                if (this.pos >= this.formula.length) break;
                this._readToken();
            }
            this.tokens.push(new Token(TokenType.EOF, null, this.pos, this.pos));
            return this.tokens;
        }

        _skipSpaces() {
            while (this.pos < this.formula.length && this.formula[this.pos] === ' ') {
                this.pos++;
            }
        }

        _readToken() {
            const ch = this.formula[this.pos];
            const start = this.pos;

            if (ch === '"') {
                this._readString();
            } else if (ch === '(') {
                this.tokens.push(new Token(TokenType.LPAREN, '(', start, start + 1));
                this.pos++;
            } else if (ch === ')') {
                this.tokens.push(new Token(TokenType.RPAREN, ')', start, start + 1));
                this.pos++;
            } else if (ch === ',') {
                this.tokens.push(new Token(TokenType.COMMA, ',', start, start + 1));
                this.pos++;
            } else if (ch === ';') {
                this.tokens.push(new Token(TokenType.SEMICOLON, ';', start, start + 1));
                this.pos++;
            } else if (ch === ':') {
                this.tokens.push(new Token(TokenType.COLON, ':', start, start + 1));
                this.pos++;
            } else if ('+-*/%^'.includes(ch)) {
                this.tokens.push(new Token(TokenType.OPERATOR, ch, start, start + 1));
                this.pos++;
            } else if (ch === '<') {
                if (this.formula[this.pos + 1] === '>') {
                    this.tokens.push(new Token(TokenType.OPERATOR, '<>', start, start + 2));
                    this.pos += 2;
                } else if (this.formula[this.pos + 1] === '=') {
                    this.tokens.push(new Token(TokenType.OPERATOR, '<=', start, start + 2));
                    this.pos += 2;
                } else {
                    this.tokens.push(new Token(TokenType.OPERATOR, '<', start, start + 1));
                    this.pos++;
                }
            } else if (ch === '>') {
                if (this.formula[this.pos + 1] === '=') {
                    this.tokens.push(new Token(TokenType.OPERATOR, '>=', start, start + 2));
                    this.pos += 2;
                } else {
                    this.tokens.push(new Token(TokenType.OPERATOR, '>', start, start + 1));
                    this.pos++;
                }
            } else if (ch === '=') {
                this.tokens.push(new Token(TokenType.OPERATOR, '=', start, start + 1));
                this.pos++;
            } else if (ch === '&') {
                this.tokens.push(new Token(TokenType.OPERATOR, '&', start, start + 1));
                this.pos++;
            } else if (/\d/.test(ch) || (ch === '.' && /\d/.test(this.formula[this.pos + 1]))) {
                this._readNumber();
            } else if (/[A-Za-z_]/.test(ch)) {
                this._readIdentifier();
            } else {
                this.tokens.push(new Token(TokenType.ERROR, `Unexpected character: ${ch}`, start, start + 1));
                this.pos++;
            }
        }

        _readString() {
            const start = this.pos;
            this.pos++;
            let str = '';
            while (this.pos < this.formula.length && this.formula[this.pos] !== '"') {
                if (this.formula[this.pos] === '\\') {
                    this.pos++;
                    str += this.formula[this.pos] || '';
                } else {
                    str += this.formula[this.pos];
                }
                this.pos++;
            }
            if (this.pos < this.formula.length) this.pos++;
            this.tokens.push(new Token(TokenType.STRING, str, start, this.pos));
        }

        _readNumber() {
            const start = this.pos;
            let num = '';
            while (this.pos < this.formula.length && (/\d/.test(this.formula[this.pos]) || this.formula[this.pos] === '.')) {
                num += this.formula[this.pos];
                this.pos++;
            }
            this.tokens.push(new Token(TokenType.NUMBER, parseFloat(num), start, this.pos));
        }

        _readIdentifier() {
            const start = this.pos;
            let name = '';
            while (this.pos < this.formula.length && /[A-Za-z0-9_.]/.test(this.formula[this.pos])) {
                name += this.formula[this.pos];
                this.pos++;
            }

            const upper = name.toUpperCase();

            if (upper === 'TRUE' || upper === 'FALSE') {
                this.tokens.push(new Token(TokenType.BOOLEAN, upper === 'TRUE', start, this.pos));
                return;
            }

            if (this.formula[this.pos] === '(') {
                this.tokens.push(new Token(TokenType.FUNCTION, upper, start, this.pos));
                return;
            }

            if (/^[A-Z]+$/i.test(name) && this.formula[this.pos] === /\d/) {
                this.tokens.push(new Token(TokenType.CELL_REF, upper, start, this.pos));
                return;
            }

            if (/^[A-Z]+\d+$/i.test(name)) {
                this.tokens.push(new Token(TokenType.CELL_REF, upper, start, this.pos));
                return;
            }

            this.tokens.push(new Token(TokenType.CELL_REF, upper, start, this.pos));
        }
    }

    class Parser {
        constructor(tokens) {
            this.tokens = tokens;
            this.pos = 0;
        }

        parse() {
            const expr = this._expression();
            if (this._current().type !== TokenType.EOF) {
                return this._errorNode('Unexpected token after expression');
            }
            return expr;
        }

        _current() {
            return this.tokens[this.pos] || new Token(TokenType.EOF, null);
        }

        _peek() {
            return this.tokens[this.pos + 1] || new Token(TokenType.EOF, null);
        }

        _advance() {
            const token = this.tokens[this.pos];
            this.pos++;
            return token;
        }

        _expect(type) {
            const token = this._current();
            if (token.type !== type) {
                return this._errorNode(`Expected ${type}, got ${token.type}`);
            }
            return this._advance();
        }

        _expression() {
            return this._concat();
        }

        _concat() {
            let left = this._comparison();
            while (this._current().type === TokenType.OPERATOR && this._current().value === '&') {
                this._advance();
                const right = this._comparison();
                left = {
                    type: ASTNodeType.BINARY_OP,
                    operator: '&',
                    left,
                    right,
                };
            }
            return left;
        }

        _comparison() {
            let left = this._addition();
            while (this._current().type === TokenType.OPERATOR &&
                   ['=', '<>', '<', '>', '<=', '>='].includes(this._current().value)) {
                const op = this._advance();
                const right = this._addition();
                left = {
                    type: ASTNodeType.BINARY_OP,
                    operator: op.value,
                    left,
                    right,
                };
            }
            return left;
        }

        _addition() {
            let left = this._multiplication();
            while (this._current().type === TokenType.OPERATOR &&
                   ['+', '-'].includes(this._current().value)) {
                const op = this._advance();
                const right = this._multiplication();
                left = {
                    type: ASTNodeType.BINARY_OP,
                    operator: op.value,
                    left,
                    right,
                };
            }
            return left;
        }

        _multiplication() {
            let left = this._power();
            while (this._current().type === TokenType.OPERATOR &&
                   ['*', '/', '%'].includes(this._current().value)) {
                const op = this._advance();
                const right = this._power();
                left = {
                    type: ASTNodeType.BINARY_OP,
                    operator: op.value,
                    left,
                    right,
                };
            }
            return left;
        }

        _power() {
            let left = this._unary();
            while (this._current().type === TokenType.OPERATOR && this._current().value === '^') {
                this._advance();
                const right = this._unary();
                left = {
                    type: ASTNodeType.BINARY_OP,
                    operator: '^',
                    left,
                    right,
                };
            }
            return left;
        }

        _unary() {
            if (this._current().type === TokenType.OPERATOR && this._current().value === '-') {
                this._advance();
                const operand = this._primary();
                return {
                    type: ASTNodeType.UNARY_OP,
                    operator: '-',
                    operand,
                };
            }
            if (this._current().type === TokenType.OPERATOR && this._current().value === '+') {
                this._advance();
                return this._primary();
            }
            return this._primary();
        }

        _primary() {
            const token = this._current();

            if (token.type === TokenType.NUMBER) {
                this._advance();
                return { type: ASTNodeType.NUMBER, value: token.value };
            }

            if (token.type === TokenType.STRING) {
                this._advance();
                return { type: ASTNodeType.STRING, value: token.value };
            }

            if (token.type === TokenType.BOOLEAN) {
                this._advance();
                return { type: ASTNodeType.BOOLEAN, value: token.value };
            }

            if (token.type === TokenType.CELL_REF) {
                this._advance();
                if (this._current().type === TokenType.COLON) {
                    this._advance();
                    const end = this._expect(TokenType.CELL_REF);
                    return {
                        type: ASTNodeType.RANGE,
                        value: `${token.value}:${end.value}`,
                    };
                }
                return { type: ASTNodeType.CELL_REF, value: token.value };
            }

            if (token.type === TokenType.FUNCTION) {
                return this._functionCall();
            }

            if (token.type === TokenType.LPAREN) {
                this._advance();
                const expr = this._expression();
                this._expect(TokenType.RPAREN);
                return expr;
            }

            return this._errorNode(`Unexpected token: ${token.value}`);
        }

        _functionCall() {
            const nameToken = this._advance();
            this._expect(TokenType.LPAREN);

            const args = [];
            if (this._current().type !== TokenType.RPAREN) {
                args.push(this._expression());
                while (this._current().type === TokenType.COMMA ||
                       this._current().type === TokenType.SEMICOLON) {
                    this._advance();
                    if (this._current().type === TokenType.RPAREN) break;
                    args.push(this._expression());
                }
            }

            this._expect(TokenType.RPAREN);

            return {
                type: ASTNodeType.FUNCTION_CALL,
                name: nameToken.value,
                args,
            };
        }

        _errorNode(message) {
            return {
                type: ASTNodeType.ERROR,
                value: message,
            };
        }
    }

    class FormulaEvaluator {
        constructor(cellGetter, namedRangeStore = null) {
            this._cellGetter = cellGetter;
            this._namedRangeStore = namedRangeStore;
            this._evaluating = new Set();
            this._cache = new Map();
        }

        evaluate(formula) {
            try {
                const cleanFormula = formula.startsWith('=') ? formula.substring(1) : formula;
                const lexer = new Lexer(cleanFormula);
                const tokens = lexer.tokenize();
                const parser = new Parser(tokens);
                const ast = parser.parse();
                return this._evalNode(ast);
            } catch (e) {
                return { value: null, error: `#ERROR: ${e.message}` };
            }
        }

        evaluateCell(cellRef) {
            if (this._cache.has(cellRef)) {
                return this._cache.get(cellRef);
            }

            if (this._evaluating.has(cellRef)) {
                return { value: null, error: '#CIRCULAR!' };
            }

            this._evaluating.add(cellRef);
            const cell = this._cellGetter(cellRef);

            if (!cell || cell.type === window.SpreadsheetCellType.EMPTY) {
                this._evaluating.delete(cellRef);
                return { value: 0, error: null };
            }

            if (cell.type !== window.SpreadsheetCellType.FORMULA) {
                const result = { value: cell.value, error: null };
                this._cache.set(cellRef, result);
                this._evaluating.delete(cellRef);
                return result;
            }

            const result = this.evaluate(cell.formula);
            this._cache.set(cellRef, result);
            this._evaluating.delete(cellRef);
            return result;
        }

        clearCache() {
            this._cache.clear();
        }

        _evalNode(node) {
            switch (node.type) {
                case ASTNodeType.NUMBER:
                    return { value: node.value, error: null };
                case ASTNodeType.STRING:
                    return { value: node.value, error: null };
                case ASTNodeType.BOOLEAN:
                    return { value: node.value, error: null };
                case ASTNodeType.CELL_REF:
                    return this._evalCellRef(node.value);
                case ASTNodeType.RANGE:
                    return { value: node.value, error: null };
                case ASTNodeType.BINARY_OP:
                    return this._evalBinaryOp(node);
                case ASTNodeType.UNARY_OP:
                    return this._evalUnaryOp(node);
                case ASTNodeType.FUNCTION_CALL:
                    return this._evalFunction(node.name, node.args);
                case ASTNodeType.ERROR:
                    return { value: null, error: node.value };
                default:
                    return { value: null, error: '#UNKNOWN' };
            }
        }

        _evalCellRef(ref) {
            if (this._namedRangeStore && this._namedRangeStore.has(ref)) {
                const range = this._namedRangeStore.get(ref);
                const cells = range.expand();
                if (cells.length === 1) {
                    return this.evaluateCell(cells[0]);
                }
                return { value: cells, error: null };
            }
            return this.evaluateCell(ref);
        }

        _evalBinaryOp(node) {
            const left = this._evalNode(node.left);
            if (left.error) return left;
            const right = this._evalNode(node.right);
            if (right.error) return right;

            const l = left.value;
            const r = right.value;

            switch (node.operator) {
                case '+': return { value: (Number(l) || 0) + (Number(r) || 0), error: null };
                case '-': return { value: (Number(l) || 0) - (Number(r) || 0), error: null };
                case '*': return { value: (Number(l) || 0) * (Number(r) || 0), error: null };
                case '/':
                    if (Number(r) === 0) return { value: null, error: '#DIV/0!' };
                    return { value: (Number(l) || 0) / Number(r), error: null };
                case '%': return { value: (Number(l) || 0) % (Number(r) || 0), error: null };
                case '^': return { value: Math.pow(Number(l) || 0, Number(r) || 0), error: null };
                case '=': return { value: l == r, error: null };
                case '<>': return { value: l != r, error: null };
                case '<': return { value: Number(l) < Number(r), error: null };
                case '>': return { value: Number(l) > Number(r), error: null };
                case '<=': return { value: Number(l) <= Number(r), error: null };
                case '>=': return { value: Number(l) >= Number(r), error: null };
                case '&': return { value: String(l ?? '') + String(r ?? ''), error: null };
                default: return { value: null, error: '#OP?' };
            }
        }

        _evalUnaryOp(node) {
            const operand = this._evalNode(node.operand);
            if (operand.error) return operand;

            if (node.operator === '-') {
                return { value: -Number(operand.value), error: null };
            }
            return operand;
        }

        _evalFunction(name, args) {
            const fn = FormulaFunctions[name];
            if (!fn) {
                return { value: null, error: `#NAME? (${name})` };
            }
            try {
                return fn(args, this);
            } catch (e) {
                return { value: null, error: `#ERROR: ${e.message}` };
            }
        }

        _resolveArg(arg) {
            if (arg.type === ASTNodeType.RANGE) {
                return this._resolveRange(arg.value);
            }
            return this._evalNode(arg);
        }

        _resolveRange(rangeStr) {
            const cells = window.SpreadsheetRange.expandRange(rangeStr);
            const values = [];
            for (const ref of cells) {
                const result = this.evaluateCell(ref);
                if (result.error) return result;
                values.push(result.value);
            }
            return { value: values, error: null };
        }

        _flattenArgs(args) {
            const values = [];
            for (const arg of args) {
                const result = this._resolveArg(arg);
                if (result.error) return result;
                if (Array.isArray(result.value)) {
                    values.push(...result.value);
                } else {
                    values.push(result.value);
                }
            }
            return { value: values, error: null };
        }

        _numbersOnly(args) {
            const flat = this._flattenArgs(args);
            if (flat.error) return flat;
            return {
                value: flat.value.filter(v => typeof v === 'number' && !isNaN(v)),
                error: null,
            };
        }
    }

    const FormulaFunctions = {
        SUM: (args, eval_) => {
            const nums = eval_._numbersOnly(args);
            if (nums.error) return nums;
            return { value: nums.value.reduce((a, b) => a + b, 0), error: null };
        },

        AVERAGE: (args, eval_) => {
            const nums = eval_._numbersOnly(args);
            if (nums.error) return nums;
            if (nums.value.length === 0) return { value: 0, error: null };
            return { value: nums.value.reduce((a, b) => a + b, 0) / nums.value.length, error: null };
        },
        AVG: (args, eval_) => FormulaFunctions.AVERAGE(args, eval_),

        COUNT: (args, eval_) => {
            const flat = eval_._flattenArgs(args);
            if (flat.error) return flat;
            return { value: flat.value.filter(v => v !== null && v !== '').length, error: null };
        },

        COUNTA: (args, eval_) => {
            const flat = eval_._flattenArgs(args);
            if (flat.error) return flat;
            return { value: flat.value.filter(v => v !== null && v !== undefined && v !== '').length, error: null };
        },

        MIN: (args, eval_) => {
            const nums = eval_._numbersOnly(args);
            if (nums.error) return nums;
            if (nums.value.length === 0) return { value: 0, error: null };
            return { value: Math.min(...nums.value), error: null };
        },

        MAX: (args, eval_) => {
            const nums = eval_._numbersOnly(args);
            if (nums.error) return nums;
            if (nums.value.length === 0) return { value: 0, error: null };
            return { value: Math.max(...nums.value), error: null };
        },

        ABS: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            return { value: Math.abs(Number(r.value)), error: null };
        },

        ROUND: (args, eval_) => {
            const val = eval_._evalNode(args[0]);
            if (val.error) return val;
            const digits = args[1] ? eval_._evalNode(args[1]) : { value: 0, error: null };
            if (digits.error) return digits;
            const factor = Math.pow(10, Number(digits.value));
            return { value: Math.round(Number(val.value) * factor) / factor, error: null };
        },

        CEILING: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            return { value: Math.ceil(Number(r.value)), error: null };
        },

        FLOOR: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            return { value: Math.floor(Number(r.value)), error: null };
        },

        MOD: (args, eval_) => {
            const num = eval_._evalNode(args[0]);
            if (num.error) return num;
            const div = eval_._evalNode(args[1]);
            if (div.error) return div;
            if (Number(div.value) === 0) return { value: null, error: '#DIV/0!' };
            return { value: Number(num.value) % Number(div.value), error: null };
        },

        POWER: (args, eval_) => {
            const base = eval_._evalNode(args[0]);
            if (base.error) return base;
            const exp = eval_._evalNode(args[1]);
            if (exp.error) return exp;
            return { value: Math.pow(Number(base.value), Number(exp.value)), error: null };
        },

        SQRT: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            const val = Number(r.value);
            if (val < 0) return { value: null, error: '#NUM!' };
            return { value: Math.sqrt(val), error: null };
        },

        IF: (args, eval_) => {
            if (args.length < 2) return { value: null, error: '#VALUE!' };
            const cond = eval_._evalNode(args[0]);
            if (cond.error) return cond;
            if (cond.value) {
                return eval_._evalNode(args[1]);
            }
            return args[2] ? eval_._evalNode(args[2]) : { value: false, error: null };
        },

        AND: (args, eval_) => {
            const flat = eval_._flattenArgs(args);
            if (flat.error) return flat;
            return { value: flat.value.every(v => Boolean(v)), error: null };
        },

        OR: (args, eval_) => {
            const flat = eval_._flattenArgs(args);
            if (flat.error) return flat;
            return { value: flat.value.some(v => Boolean(v)), error: null };
        },

        NOT: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            return { value: !Boolean(r.value), error: null };
        },

        CONCATENATE: (args, eval_) => {
            const flat = eval_._flattenArgs(args);
            if (flat.error) return flat;
            return { value: flat.value.map(String).join(''), error: null };
        },

        LEFT: (args, eval_) => {
            const str = eval_._evalNode(args[0]);
            if (str.error) return str;
            const len = args[1] ? eval_._evalNode(args[1]) : { value: 1, error: null };
            if (len.error) return len;
            return { value: String(str.value).substring(0, Number(len.value)), error: null };
        },

        RIGHT: (args, eval_) => {
            const str = eval_._evalNode(args[0]);
            if (str.error) return str;
            const len = args[1] ? eval_._evalNode(args[1]) : { value: 1, error: null };
            if (len.error) return len;
            const s = String(str.value);
            return { value: s.substring(s.length - Number(len.value)), error: null };
        },

        MID: (args, eval_) => {
            const str = eval_._evalNode(args[0]);
            if (str.error) return str;
            const start = eval_._evalNode(args[1]);
            if (start.error) return start;
            const len = eval_._evalNode(args[2]);
            if (len.error) return len;
            return { value: String(str.value).substr(Number(start.value) - 1, Number(len.value)), error: null };
        },

        LEN: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            return { value: String(r.value).length, error: null };
        },

        UPPER: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            return { value: String(r.value).toUpperCase(), error: null };
        },

        LOWER: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            return { value: String(r.value).toLowerCase(), error: null };
        },

        TRIM: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            return { value: String(r.value).trim(), error: null };
        },

        FIND: (args, eval_) => {
            const find = eval_._evalNode(args[0]);
            if (find.error) return find;
            const text = eval_._evalNode(args[1]);
            if (text.error) return text;
            const start = args[2] ? eval_._evalNode(args[2]) : { value: 1, error: null };
            if (start.error) return start;
            const idx = String(text.value).indexOf(String(find.value), Number(start.value) - 1);
            if (idx === -1) return { value: null, error: '#N/A' };
            return { value: idx + 1, error: null };
        },

        SUBSTITUTE: (args, eval_) => {
            const text = eval_._evalNode(args[0]);
            if (text.error) return text;
            const old = eval_._evalNode(args[1]);
            if (old.error) return old;
            const nw = eval_._evalNode(args[2]);
            if (nw.error) return nw;
            const inst = args[3] ? eval_._evalNode(args[3]) : null;
            if (inst && inst.error) return inst;

            let s = String(text.value);
            const search = String(old.value);
            const replacement = String(nw.value);

            if (inst) {
                let count = 0;
                s = s.replace(search, (match) => {
                    count++;
                    return count === Number(inst.value) ? replacement : match;
                });
            } else {
                s = s.split(search).join(replacement);
            }
            return { value: s, error: null };
        },

        VALUE: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            const num = Number(r.value);
            if (isNaN(num)) return { value: null, error: '#VALUE!' };
            return { value: num, error: null };
        },

        TEXT: (args, eval_) => {
            const val = eval_._evalNode(args[0]);
            if (val.error) return val;
            const fmt = args[1] ? eval_._evalNode(args[1]) : { value: 'General', error: null };
            if (fmt.error) return fmt;
            return { value: String(val.value), error: null };
        },

        NOW: () => {
            return { value: new Date().toISOString(), error: null };
        },

        TODAY: () => {
            return { value: new Date().toISOString().split('T')[0], error: null };
        },

        YEAR: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            try {
                return { value: new Date(r.value).getFullYear(), error: null };
            } catch (e) {
                return { value: null, error: '#VALUE!' };
            }
        },

        MONTH: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            try {
                return { value: new Date(r.value).getMonth() + 1, error: null };
            } catch (e) {
                return { value: null, error: '#VALUE!' };
            }
        },

        DAY: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            try {
                return { value: new Date(r.value).getDate(), error: null };
            } catch (e) {
                return { value: null, error: '#VALUE!' };
            }
        },

        DATE: (args, eval_) => {
            const y = eval_._evalNode(args[0]);
            if (y.error) return y;
            const m = eval_._evalNode(args[1]);
            if (m.error) return m;
            const d = eval_._evalNode(args[2]);
            if (d.error) return d;
            try {
                const date = new Date(Number(y.value), Number(m.value) - 1, Number(d.value));
                return { value: date.toISOString().split('T')[0], error: null };
            } catch (e) {
                return { value: null, error: '#VALUE!' };
            }
        },

        DATEDIF: (args, eval_) => {
            const start = eval_._evalNode(args[0]);
            if (start.error) return start;
            const end = eval_._evalNode(args[1]);
            if (end.error) return end;
            const unit = args[2] ? eval_._evalNode(args[2]) : { value: 'D', error: null };
            if (unit.error) return unit;

            try {
                const s = new Date(start.value);
                const e = new Date(end.value);
                const diff = e - s;
                const u = String(unit.value).toUpperCase();
                if (u === 'D') return { value: Math.floor(diff / 86400000), error: null };
                if (u === 'M') return { value: Math.floor(diff / 2592000000), error: null };
                if (u === 'Y') return { value: Math.floor(diff / 31536000000), error: null };
                return { value: null, error: '#VALUE!' };
            } catch (e) {
                return { value: null, error: '#VALUE!' };
            }
        },

        PI: () => ({ value: Math.PI, error: null }),

        RAND: () => ({ value: Math.random(), error: null }),

        RANDBETWEEN: (args, eval_) => {
            const low = eval_._evalNode(args[0]);
            if (low.error) return low;
            const high = eval_._evalNode(args[1]);
            if (high.error) return high;
            const l = Number(low.value);
            const h = Number(high.value);
            return { value: Math.floor(Math.random() * (h - l + 1)) + l, error: null };
        },

        INT: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            return { value: Math.floor(Number(r.value)), error: null };
        },

        SIGN: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            const v = Number(r.value);
            return { value: v > 0 ? 1 : v < 0 ? -1 : 0, error: null };
        },

        SUMIF: (args, eval_) => {
            if (args.length < 2) return { value: null, error: '#VALUE!' };
            const rangeResult = eval_._resolveArg(args[0]);
            if (rangeResult.error) return rangeResult;
            const criteriaResult = eval_._evalNode(args[1]);
            if (criteriaResult.error) return criteriaResult;
            const sumRangeResult = args[2] ? eval_._resolveArg(args[2]) : null;

            const rangeVals = Array.isArray(rangeResult.value) ? rangeResult.value : [rangeResult.value];
            const sumVals = sumRangeResult
                ? (Array.isArray(sumRangeResult.value) ? sumRangeResult.value : [sumRangeResult.value])
                : rangeVals;

            const criteria = String(criteriaResult.value);
            let total = 0;
            for (let i = 0; i < rangeVals.length; i++) {
                if (FormulaFunctions._matchCriteria(rangeVals[i], criteria)) {
                    total += Number(sumVals[i]) || 0;
                }
            }
            return { value: total, error: null };
        },

        COUNTIF: (args, eval_) => {
            if (args.length < 2) return { value: null, error: '#VALUE!' };
            const rangeResult = eval_._resolveArg(args[0]);
            if (rangeResult.error) return rangeResult;
            const criteriaResult = eval_._evalNode(args[1]);
            if (criteriaResult.error) return criteriaResult;

            const rangeVals = Array.isArray(rangeResult.value) ? rangeResult.value : [rangeResult.value];
            const criteria = String(criteriaResult.value);
            let count = 0;
            for (const v of rangeVals) {
                if (FormulaFunctions._matchCriteria(v, criteria)) count++;
            }
            return { value: count, error: null };
        },

        _matchCriteria: (value, criteria) => {
            if (typeof criteria === 'string' && (criteria.startsWith('>') || criteria.startsWith('<') || criteria.startsWith('='))) {
                const op = criteria.substring(0, 1) === '=' ? '==' : criteria.substring(0, 2);
                const val = criteria.substring(op.length);
                const num = Number(val);
                const v = Number(value);
                switch (op) {
                    case '>': return v > num;
                    case '<': return v < num;
                    case '>=': return v >= num;
                    case '<=': return v <= num;
                    case '<>': return v != val;
                    case '==': return String(value) === val;
                    default: return String(value) === criteria;
                }
            }
            return String(value) === String(criteria);
        },

        IFERROR: (args, eval_) => {
            const val = eval_._evalNode(args[0]);
            if (val.error) {
                return args[1] ? eval_._evalNode(args[1]) : { value: '', error: null };
            }
            return val;
        },

        INDEX: (args, eval_) => {
            if (args.length < 3) return { value: null, error: '#VALUE!' };
            const range = eval_._resolveArg(args[0]);
            if (range.error) return range;
            const row = eval_._evalNode(args[1]);
            if (row.error) return row;
            const col = eval_._evalNode(args[2]);
            if (col.error) return col;

            const vals = Array.isArray(range.value) ? range.value : [range.value];
            const r = Number(row.value) - 1;
            const c = Number(col.value) - 1;
            const cols = Number(args[3] ? eval_._evalNode(args[3]).value : 1);

            const idx = r * cols + c;
            if (idx < 0 || idx >= vals.length) return { value: null, error: '#REF!' };
            return { value: vals[idx], error: null };
        },

        VLOOKUP: (args, eval_) => {
            if (args.length < 3) return { value: null, error: '#VALUE!' };
            const lookup = eval_._evalNode(args[0]);
            if (lookup.error) return lookup;
            const range = eval_._resolveArg(args[1]);
            if (range.error) return range;
            const colIdx = eval_._evalNode(args[2]);
            if (colIdx.error) return colIdx;
            const approx = args[3] ? eval_._evalNode(args[3]) : { value: true, error: null };
            if (approx.error) return approx;

            const vals = Array.isArray(range.value) ? range.value : [range.value];
            const cols = Number(colIdx.value);
            const rows = Math.ceil(vals.length / cols);

            for (let r = 0; r < rows; r++) {
                const cellVal = vals[r * cols];
                if (String(cellVal) === String(lookup.value)) {
                    const resultIdx = r * cols + (cols - 1);
                    return { value: vals[resultIdx], error: null };
                }
            }
            return { value: null, error: '#N/A' };
        },

        HLOOKUP: (args, eval_) => {
            if (args.length < 3) return { value: null, error: '#VALUE!' };
            const lookup = eval_._evalNode(args[0]);
            if (lookup.error) return lookup;
            const range = eval_._resolveArg(args[1]);
            if (range.error) return range;
            const rowIdx = eval_._evalNode(args[2]);
            if (rowIdx.error) return rowIdx;

            const vals = Array.isArray(range.value) ? range.value : [range.value];
            const row = Number(rowIdx.value) - 1;
            const cols = Math.ceil(vals.length / (row + 1));

            for (let c = 0; c < cols; c++) {
                if (String(vals[c]) === String(lookup.value)) {
                    return { value: vals[c * (row + 1) + row], error: null };
                }
            }
            return { value: null, error: '#N/A' };
        },

        LOOKUP: (args, eval_) => {
            if (args.length < 2) return { value: null, error: '#VALUE!' };
            const lookup = eval_._evalNode(args[0]);
            if (lookup.error) return lookup;
            const range = eval_._resolveArg(args[1]);
            if (range.error) return range;

            const vals = Array.isArray(range.value) ? range.value : [range.value];
            for (let i = 0; i < vals.length; i++) {
                if (String(vals[i]) === String(lookup.value)) {
                    return { value: vals[i], error: null };
                }
            }
            return { value: vals[vals.length - 1], error: null };
        },

        AVERAGEIF: (args, eval_) => {
            if (args.length < 2) return { value: null, error: '#VALUE!' };
            const rangeResult = eval_._resolveArg(args[0]);
            if (rangeResult.error) return rangeResult;
            const criteriaResult = eval_._evalNode(args[1]);
            if (criteriaResult.error) return criteriaResult;
            const avgRangeResult = args[2] ? eval_._resolveArg(args[2]) : null;

            const rangeVals = Array.isArray(rangeResult.value) ? rangeResult.value : [rangeResult.value];
            const avgVals = avgRangeResult
                ? (Array.isArray(avgRangeResult.value) ? avgRangeResult.value : [avgRangeResult.value])
                : rangeVals;

            const criteria = String(criteriaResult.value);
            let total = 0, count = 0;
            for (let i = 0; i < rangeVals.length; i++) {
                if (FormulaFunctions._matchCriteria(rangeVals[i], criteria)) {
                    total += Number(avgVals[i]) || 0;
                    count++;
                }
            }
            return { value: count === 0 ? 0 : total / count, error: null };
        },

        COUNTBLANK: (args, eval_) => {
            const range = eval_._resolveArg(args[0]);
            if (range.error) return range;
            const vals = Array.isArray(range.value) ? range.value : [range.value];
            return { value: vals.filter(v => v === null || v === '' || v === undefined).length, error: null };
        },

        ISTEXT: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return { value: false, error: null };
            return { value: typeof r.value === 'string', error: null };
        },

        ISNUMBER: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return { value: false, error: null };
            return { value: typeof r.value === 'number' && !isNaN(r.value), error: null };
        },

        ISBLANK: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            return { value: r.value === null || r.value === '' || r.value === undefined, error: null };
        },

        TYPE: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return { value: 16, error: null };
            if (typeof r.value === 'number') return { value: 1, error: null };
            if (typeof r.value === 'string') return { value: 2, error: null };
            if (typeof r.value === 'boolean') return { value: 4, error: null };
            return { value: 16, error: null };
        },

        CHAR: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            return { value: String.fromCharCode(Number(r.value)), error: null };
        },

        CODE: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            const s = String(r.value);
            return { value: s.charCodeAt(0) || 0, error: null };
        },

        REPT: (args, eval_) => {
            const text = eval_._evalNode(args[0]);
            if (text.error) return text;
            const count = eval_._evalNode(args[1]);
            if (count.error) return count;
            return { value: String(text.value).repeat(Math.max(0, Number(count.value))), error: null };
        },

        T: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return { value: '', error: null };
            return { value: typeof r.value === 'string' ? r.value : '', error: null };
        },

        NA: () => ({ value: null, error: '#N/A' }),

        'ISNA': (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            return { value: r.error === '#N/A', error: null };
        },

        'ISERR': (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            return { value: r.error !== null && r.error !== '#N/A', error: null };
        },

        'ISERROR': (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            return { value: r.error !== null, error: null };
        },

        ERROR: (args, eval_) => {
            const r = eval_._evalNode(args[0]);
            if (r.error) return r;
            return { value: null, error: String(r.value) };
        },
    };

    window.SpreadsheetLexer = Lexer;
    window.SpreadsheetParser = Parser;
    window.SpreadsheetFormulaEvaluator = FormulaEvaluator;
    window.SpreadsheetFormulaFunctions = FormulaFunctions;
    window.FormulaTokenType = TokenType;
    window.FormulaASTNodeType = ASTNodeType;
})();
