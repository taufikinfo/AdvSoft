(function () {
    const m = owl.markup;

    class DomainBuilderDialog {
        constructor() {
            this.el = null;
            this.rules = [];
            this.rawDomain = '[]';
            this.model = '';
            this.onSave = null;
            this.mode = 'visual'; // 'visual' or 'raw'
            this.operators = [
                { val: '=', label: '=' },
                { val: '!=', label: '!=' },
                { val: '>', label: '>' },
                { val: '>=', label: '>=' },
                { val: '<', label: '<' },
                { val: '<=', label: '<=' },
                { val: 'ilike', label: 'contains' },
                { val: 'not ilike', label: 'does not contain' },
                { val: 'in', label: 'in' },
                { val: 'not in', label: 'not in' }
            ];
        }

        open(config) {
            this.rawDomain = config.domain || '[]';
            this.model = config.model || '';
            this.onSave = config.onSave;
            this.mode = 'visual';
            
            this.rules = this.parseDomainTokens(this.rawDomain);
            if (this.rawDomain.trim() !== '[]' && this.rules.length === 0 && !this.rawDomain.includes('(')) {
                // Not empty, but couldn't parse tuples, might be complex
                this.mode = 'raw';
            }

            this.render();
            document.body.appendChild(this.el);
            
            // Animate in
            requestAnimationFrame(() => {
                this.el.style.opacity = '1';
                this.el.querySelector('.ls-domain-dialog-content').style.transform = 'translateY(0) scale(1)';
            });
        }

        close() {
            if (!this.el) return;
            this.el.style.opacity = '0';
            this.el.querySelector('.ls-domain-dialog-content').style.transform = 'translateY(20px) scale(0.95)';
            setTimeout(() => {
                if (this.el) {
                    this.el.remove();
                    this.el = null;
                }
            }, 300);
        }

        parseDomainTokens(domainStr) {
            const rules = [];
            // Match Python tuples: ('field', 'op', 'val') or ("field", "=", 123)
            // It's a naive regex but works for simple UI visual rules
            const regex = /\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*(.*?)\s*\)/g;
            let match;
            while ((match = regex.exec(domainStr)) !== null) {
                let field = match[1];
                let op = match[2];
                let valRaw = match[3];
                let val = valRaw;
                if ((valRaw.startsWith("'") && valRaw.endsWith("'")) || (valRaw.startsWith('"') && valRaw.endsWith('"'))) {
                    val = valRaw.substring(1, valRaw.length - 1);
                }
                rules.push({ id: Date.now() + Math.random(), field, op, val });
            }
            return rules;
        }

        serializeDomain() {
            if (this.mode === 'raw') {
                return this.el.querySelector('.ls-domain-raw-input').value;
            }
            
            if (this.rules.length === 0) return '[]';
            const tuples = this.rules.map(r => {
                const safeVal = r.val.replace(/'/g, "\\'");
                // If it looks like a number or boolean, maybe keep it unquoted? For now, quote everything for safety unless it's an array
                if (r.op === 'in' || r.op === 'not in') {
                    // Expect array format [1,2,3]
                    const v = r.val.startsWith('[') ? r.val : `[${r.val}]`;
                    return `('${r.field}', '${r.op}', ${v})`;
                }
                // Handle python True/False
                if (r.val === 'True' || r.val === 'False') {
                    return `('${r.field}', '${r.op}', ${r.val})`;
                }
                return `('${r.field}', '${r.op}', '${safeVal}')`;
            });
            return `[${tuples.join(', ')}]`;
        }

        render() {
            if (this.el) {
                this.el.remove();
            }

            this.el = document.createElement('div');
            this.el.className = 'ls-domain-dialog-overlay';
            this.el.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px);
                display: flex; align-items: center; justify-content: center;
                z-index: 10000; opacity: 0; transition: opacity 0.3s ease;
            `;

            const content = document.createElement('div');
            content.className = 'ls-domain-dialog-content';
            content.style.cssText = `
                background: #fff; width: 600px; max-width: 90vw; border-radius: 12px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                transform: translateY(20px) scale(0.95); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                display: flex; flex-direction: column; overflow: hidden;
            `;

            // HTML Structure
            content.innerHTML = `
                <div style="padding: 16px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #0f172a;">Domain Builder ${this.model ? `(${this.model})` : ''}</h3>
                    <div style="display: flex; gap: 12px;">
                        <button class="ls-btn ls-btn-sm ls-toggle-mode">${this.mode === 'visual' ? 'Raw Code' : 'Visual'}</button>
                        <button class="ls-close-btn" style="background: none; border: none; cursor: pointer; font-size: 18px; color: #64748b;">✕</button>
                    </div>
                </div>
                <div style="padding: 24px; min-height: 200px; max-height: 60vh; overflow-y: auto;" class="ls-domain-body">
                    <!-- Body injected here -->
                </div>
                <div style="padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; background: #f8fafc;">
                    <button class="ls-btn ls-btn-secondary ls-cancel-btn">Cancel</button>
                    <button class="ls-btn ls-btn-primary ls-save-btn">Apply Domain</button>
                </div>
            `;

            this.el.appendChild(content);

            // Bind global actions
            content.querySelector('.ls-close-btn').addEventListener('click', () => this.close());
            content.querySelector('.ls-cancel-btn').addEventListener('click', () => this.close());
            
            content.querySelector('.ls-toggle-mode').addEventListener('click', () => {
                if (this.mode === 'visual') {
                    this.rawDomain = this.serializeDomain();
                    this.mode = 'raw';
                } else {
                    this.rawDomain = content.querySelector('.ls-domain-raw-input').value;
                    const parsed = this.parseDomainTokens(this.rawDomain);
                    if (parsed.length > 0 || this.rawDomain.trim() === '[]') {
                        this.rules = parsed;
                        this.mode = 'visual';
                    } else {
                        alert("Domain is too complex to parse visually. Staying in raw mode.");
                        return;
                    }
                }
                this.renderBody(content.querySelector('.ls-domain-body'));
                content.querySelector('.ls-toggle-mode').innerText = this.mode === 'visual' ? 'Raw Code' : 'Visual';
            });

            content.querySelector('.ls-save-btn').addEventListener('click', () => {
                const finalDomain = this.serializeDomain();
                if (this.onSave) this.onSave(finalDomain);
                this.close();
            });

            this.renderBody(content.querySelector('.ls-domain-body'));
        }

        renderBody(container) {
            container.innerHTML = '';
            if (this.mode === 'raw') {
                container.innerHTML = `
                    <div style="margin-bottom: 8px; font-size: 12px; color: #64748b;">Enter domain as a Python list of tuples. Example: [('active', '=', True)]</div>
                    <textarea class="ls-field-textarea ls-domain-raw-input ls-code-font" rows="8" style="font-family: monospace; font-size: 13px; background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 6px;">${this.rawDomain}</textarea>
                `;
                return;
            }

            // Visual Mode
            if (this.rules.length === 0) {
                container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 40px 0; font-style: italic;">No rules defined. Match all records.</div>`;
            } else {
                const list = document.createElement('div');
                list.style.cssText = `display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;`;
                
                this.rules.forEach((r, idx) => {
                    const row = document.createElement('div');
                    row.style.cssText = `display: flex; gap: 8px; align-items: center;`;
                    
                    let opOptions = this.operators.map(o => `<option value="${o.val}" ${r.op === o.val ? 'selected' : ''}>${o.label}</option>`).join('');

                    row.innerHTML = `
                        <input type="text" class="ls-field-input" value="${r.field}" placeholder="field_name" style="flex: 2; min-width: 0;" data-idx="${idx}" data-key="field"/>
                        <select class="ls-field-select" style="flex: 1.5; min-width: 0;" data-idx="${idx}" data-key="op">${opOptions}</select>
                        <input type="text" class="ls-field-input" value="${r.val}" placeholder="value" style="flex: 3; min-width: 0;" data-idx="${idx}" data-key="val"/>
                        <button class="ls-btn-icon ls-del-rule" data-idx="${idx}" style="color: #ef4444;" title="Delete rule">✕</button>
                    `;
                    list.appendChild(row);
                });
                container.appendChild(list);

                // Bind rule inputs
                container.querySelectorAll('input, select').forEach(input => {
                    input.addEventListener('change', (e) => {
                        const idx = e.target.getAttribute('data-idx');
                        const key = e.target.getAttribute('data-key');
                        this.rules[idx][key] = e.target.value;
                    });
                });

                container.querySelectorAll('.ls-del-rule').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const idx = parseInt(e.target.getAttribute('data-idx'));
                        this.rules.splice(idx, 1);
                        this.renderBody(container);
                    });
                });
            }

            const addBtn = document.createElement('button');
            addBtn.className = 'ls-btn ls-btn-secondary';
            addBtn.innerHTML = '+ Add Rule';
            addBtn.addEventListener('click', () => {
                this.rules.push({ id: Date.now(), field: '', op: '=', val: '' });
                this.renderBody(container);
            });
            container.appendChild(addBtn);
        }
    }

    window.DomainBuilderDialog = new DomainBuilderDialog();
})();
