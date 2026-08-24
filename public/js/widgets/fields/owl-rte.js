// ═══════════════════════════════════════════════════════════════════════════
//  AdvSoft RTE — Odoo-style Rich Text Editor
//
//  Single-file implementation that mirrors Odoo's HTML field widget:
//    - Configurable toolbar (from field's HtmlFieldConfig)
//    - ContentEditable surface + source/HTML view toggle
//    - Built-in client-side sanitization
//    - Image upload (drag-drop / paste / file picker)
//    - @mentions with autocomplete
//    - URL embeds (YouTube/Vimeo cards)
//    - Link editor, table insert, color picker
//    - Code/source view, fullscreen, stats, history
//    - Programmatic API: window.AdvSoftRTE.create(container, options)
//
//  Architecture:
//    AdvSoftRTE          ← public factory
//      ├─ Sanitizer       ← allowlist-based HTML cleaning
//      ├─ Commands        ← execCommand wrappers + custom ops
//      ├─ Toolbar         ← dynamic button rendering
//      ├─ LinkDialog      ← link insert/edit modal
//      ├─ TablePicker     ← table size chooser
//      ├─ MentionPopup    ← @ mention autocomplete
//      ├─ ImageUpload     ← file → server → insert <img>
//      └─ History         ← undo / redo stacks
//
//  Dependencies (provided by host page):
//    - window.RPC (optional, for image upload / mentions / embeds)
//    - window.AdvSoftUser  (CSRF/uid, optional)
//    - window.owl  (only if you mount the OWL component — standalone works too)
// ═══════════════════════════════════════════════════════════════════════════
(function () {
'use strict';

// ───────────────────────────────────────────────────────────────────────
//  Utility helpers
// ───────────────────────────────────────────────────────────────────────
const esc = (v) => v == null ? '' : String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const uid = () => 'lrid_' + Math.random().toString(36).slice(2, 10);

const debounce = (fn, wait) => {
    let t; return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
};

const queryExec = (cmd, val = null) => document.execCommand(cmd, false, val);

const getSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    return sel.getRangeAt(0);
};

const saveSelection = (root) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    // Make sure range is inside the editor
    if (!root.contains(range.commonAncestorContainer)) return null;
    const pre = range.cloneRange();
    return () => {
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(pre);
    };
};

const restoreSelection = (savedRange) => { if (savedRange) savedRange(); };

const isInside = (node, root) => {
    while (node) { if (node === root) return true; node = node.parentNode; }
    return false;
};

// ═══════════════════════════════════════════════════════════════════════
//  SANITIZER (client-side, mirrors backend HtmlSanitizer)
// ═══════════════════════════════════════════════════════════════════════
class Sanitizer {
    constructor(cfg = {}) {
        this.cfg = cfg;
        this.allowedTags = new Set((cfg.allowed_tags || []).map(s => s.toLowerCase()));
        this.allowedClasses = cfg.allowed_classes || [];
        this.allowedStyles = cfg.allowed_styles || [];
        this.styleAttributes = cfg.style_attributes || {};
        this.extraAttributes = cfg.extra_attributes || {};
        this.allowedSchemes = (cfg.allowed_schemes || ['http', 'https', 'mailto', 'tel']).map(s => s.toLowerCase());
        this.attrAllowlist = {
            a:    ['href', 'title', 'rel', 'target'],
            img:  ['src', 'alt', 'title', 'width', 'height'],
            th:   ['colspan', 'rowspan', 'scope'],
            td:   ['colspan', 'rowspan'],
            ol:   ['start', 'type', 'reversed'],
            ul:   ['type'],
            li:   ['value'],
            hr:   ['size', 'width'],
        };
        Object.keys(this.extraAttributes).forEach(tag => {
            const t = tag.toLowerCase();
            this.attrAllowlist[t] = (this.attrAllowlist[t] || []).concat(this.extraAttributes[tag]);
        });
        this.forbidden = ['script', 'style', 'iframe', 'object', 'embed', 'applet',
                          'frame', 'frameset', 'noframes', 'noscript', 'base', 'meta',
                          'link', 'form', 'input', 'button', 'select', 'textarea',
                          'xml', 'svg', 'math'];
    }

    isClassAllowed(cls) {
        if (!this.allowedClasses.length) return !this.cfg.sanitize?.strip_unknown;
        const list = cls.split(/\s+/);
        for (const c of list) {
            if (!c) continue;
            let ok = false;
            for (const p of this.allowedClasses) {
                if (p === c) { ok = true; break; }
                if (p.endsWith('*') && c.startsWith(p.slice(0, -1))) { ok = true; break; }
            }
            if (!ok && this.cfg.sanitize?.strip_unknown !== false) return false;
        }
        return true;
    }

    isStyleAllowed(style, tag) {
        const allowed = (this.allowedStyles || []).concat(this.styleAttributes[tag] || []);
        if (!allowed.length) return !this.cfg.sanitize?.strip_unknown;
        const decls = style.split(';');
        for (const d of decls) {
            const [prop, val] = d.split(':');
            if (!prop || !val) continue;
            const p = prop.trim().toLowerCase();
            if (!allowed.includes(p) && this.cfg.sanitize?.strip_unknown !== false) return false;
            if (/url\s*\(|expression\s*\(|javascript\s*:/i.test(val)) return false;
        }
        return true;
    }

    isUrlAllowed(url) {
        if (!url) return true;
        const m = url.match(/^([a-z][a-z0-9+.\-]*):/i);
        if (!m) return true;
        const scheme = m[1].toLowerCase();
        if (['javascript', 'data', 'vbscript'].includes(scheme)) return false;
        return this.allowedSchemes.includes(scheme);
    }

    cleanAttributes(el, tag) {
        if (!el.attributes) return;
        const keep = this.attrAllowlist[tag] || [];
        const toRemove = [];
        for (const attr of Array.from(el.attributes)) {
            const n = attr.name.toLowerCase();
            const v = attr.value;
            if (n.startsWith('on'))         { toRemove.push(attr.name); continue; }
            if (n.startsWith('xmlns:') || n.startsWith('xml:')) { toRemove.push(attr.name); continue; }
            if (n === 'class' && !this.isClassAllowed(v))   { toRemove.push(attr.name); continue; }
            if (n === 'style' && !this.isStyleAllowed(v, tag)) { toRemove.push(attr.name); continue; }
            if (['href', 'src'].includes(n) && !this.isUrlAllowed(v)) { toRemove.push(attr.name); continue; }
            if (n.startsWith('data-')) {
                if (!keep.includes(n)) { toRemove.push(attr.name); continue; }
            }
            if (n.startsWith('aria-')) {
                if (!keep.includes(n)) { toRemove.push(attr.name); continue; }
            }
            if (n === 'id' && !keep.includes('id')) { toRemove.push(attr.name); continue; }
            if (!keep.includes(n)) { toRemove.push(attr.name); continue; }
        }
        toRemove.forEach(a => el.removeAttribute(a));
    }

    sanitize(html) {
        if (!html) return '';
        const tmpl = document.createElement('template');
        tmpl.innerHTML = html;
        this._walk(tmpl.content);
        return tmpl.innerHTML;
    }

    sanitizeRoot(rootEl) {
        if (!rootEl) return;
        // Make a copy so we can safely walk
        const tmpl = document.createElement('template');
        tmpl.innerHTML = rootEl.innerHTML;
        this._walk(tmpl.content);
        rootEl.innerHTML = tmpl.innerHTML;
    }

    _walk(node) {
        if (!node) return;
        const children = Array.from(node.childNodes);
        for (const c of children) {
            if (c.nodeType === Node.COMMENT_NODE || c.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
                c.remove(); continue;
            }
            if (c.nodeType !== Node.ELEMENT_NODE) continue;
            const tag = c.tagName.toLowerCase();
            if (this.forbidden.includes(tag)) {
                c.remove(); continue;
            }
            if (!this.allowedTags.has(tag)) {
                // Unwrap: keep children
                const parent = c.parentNode;
                while (c.firstChild) parent.insertBefore(c.firstChild, c);
                c.remove();
                this._walk(parent);
                continue;
            }
            this.cleanAttributes(c, tag);
            if (tag === 'a' && this.cfg.sanitize?.allow_blank !== false) {
                const href = c.getAttribute('href') || '';
                if (/^https?:\/\//.test(href)) {
                    if (!c.getAttribute('target')) c.setAttribute('target', '_blank');
                    const rel = c.getAttribute('rel') || '';
                    if (!rel.includes('noopener')) c.setAttribute('rel', (rel + ' noopener noreferrer').trim());
                }
            }
            if (tag === 'img' && !c.getAttribute('src')) c.remove();
            this._walk(c);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════
//  HISTORY (undo / redo)
// ═══════════════════════════════════════════════════════════════════════
class History {
    constructor(root, max = 50) { this.root = root; this.stack = ['']; this.idx = 0; this.max = max; }
    snapshot() {
        const html = this.root.innerHTML;
        if (html === this.stack[this.idx]) return;
        this.stack = this.stack.slice(0, this.idx + 1);
        this.stack.push(html);
        if (this.stack.length > this.max) this.stack.shift();
        this.idx = this.stack.length - 1;
    }
    undo() { if (this.idx > 0) { this.idx--; this.root.innerHTML = this.stack[this.idx]; } }
    redo() { if (this.idx < this.stack.length - 1) { this.idx++; this.root.innerHTML = this.stack[this.idx]; } }
    reset(html) { this.stack = [html || '']; this.idx = 0; }
}

// ═══════════════════════════════════════════════════════════════════════
//  TOOLBAR DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════
const ICONS = {
    'history-undo':  'undo',
    'history-redo':  'redo',
    'format-bold':   'bold',
    'format-italic': 'italic',
    'format-underline': 'underline',
    'format-strike': 'strikethrough',
    'heading-p':     'pilcrow',
    'heading-h1':    'heading-1',
    'heading-h2':    'heading-2',
    'heading-h3':    'heading-3',
    'heading-h4':    'heading-4',
    'list-ul':       'list',
    'list-ol':       'list-ordered',
    'indent':        'indent',
    'outdent':       'outdent',
    'link':          'link',
    'unlink':        'unlink',
    'image':         'image',
    'table':         'table',
    'code':          'code',
    'code-block':    'square-code',
    'quote':         'text-quote',
    'text-color':    'baseline',
    'background-color': 'palette',
    'clean-format':  'eraser',
    'source-view':   'code-xml',
    'fullscreen':    'maximize',
    'callout':       'message-square',
    'divider':       'minus',
    'toc':           'list-tree',
    'mention':       'at-sign',
    'embed':         'monitor-play',
    'emoji':         'smile',
    'math':          'sigma',
};

// ═══════════════════════════════════════════════════════════════════════
//  COMMANDS — execCommand wrappers + custom operations
// ═══════════════════════════════════════════════════════════════════════
class Commands {
    constructor(editor) { this.editor = editor; }

    // ── Inline formatting ───────────────────────────────
    bold()      { queryExec('bold'); }
    italic()    { queryExec('italic'); }
    underline() { queryExec('underline'); }
    strike()    { queryExec('strikeThrough'); }
    subscript() { queryExec('subscript'); }
    superscript(){ queryExec('superscript'); }

    // ── Block formatting ─────────────────────────────────
    format(tag, value = null) { queryExec('formatBlock', tag); }
    paragraph()  { this.format('P'); }
    heading(level) { this.format('H' + level); }
    blockquote() { this.format('BLOCKQUOTE'); }
    pre()        { this.format('PRE'); }

    // ── Lists ────────────────────────────────────────────
    ul()  { queryExec('insertUnorderedList'); }
    ol()  { queryExec('insertOrderedList'); }
    indent()   { queryExec('indent'); }
    outdent()  { queryExec('outdent'); }

    // ── History ──────────────────────────────────────────
    undo() { this.editor.history.undo(); }
    redo() { this.editor.history.redo(); }

    // ── Links ────────────────────────────────────────────
    insertLink(url, text, target = '_blank') {
        if (!url) return;
        const sel = saveSelection(this.editor.rootEl);
        // If selection is collapsed, insert the URL as text
        let html;
        if (this.editor.rootEl.contains(document.getSelection().anchorNode)) {
            const range = document.getSelection();
            if (range.isCollapsed) {
                html = `<a href="${esc(url)}" target="${esc(target)}" rel="noopener noreferrer">${esc(text || url)}</a>&nbsp;`;
                queryExec('insertHTML', html);
            } else {
                queryExec('createLink', url);
            }
        } else {
            queryExec('insertHTML', `<a href="${esc(url)}" target="${esc(target)}" rel="noopener noreferrer">${esc(text || url)}</a>`);
        }
        this.editor._onChange();
    }

    unlink() { queryExec('unlink'); }

    // ── Image (HTML mode — for source-view flow) ─────────
    insertImage(url, alt = '') {
        const html = `<img src="${esc(url)}" alt="${esc(alt)}" />`;
        queryExec('insertHTML', html);
        this.editor._onChange();
    }

    // ── Table ────────────────────────────────────────────
    insertTable(rows, cols) {
        let html = '<table style="width:100%;border-collapse:collapse;margin:8px 0">';
        for (let r = 0; r < rows; r++) {
            html += '<tr>';
            for (let c = 0; c < cols; c++) {
                const tag = r === 0 ? 'th' : 'td';
                html += `<${tag} style="border:1px solid #d1d5db;padding:6px">&nbsp;</${tag}>`;
            }
            html += '</tr>';
        }
        html += '</table><p>&nbsp;</p>';
        queryExec('insertHTML', html);
        this.editor._onChange();
    }

    // ── Code ─────────────────────────────────────────────
    inlineCode() {
        const sel = document.getSelection();
        if (sel.rangeCount && !sel.isCollapsed) {
            const text = sel.toString();
            queryExec('insertHTML', `<code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-family:monospace">${esc(text)}</code>`);
        }
    }
    codeBlock() { this.format('PRE'); }

    // ── Quote / callout ──────────────────────────────────
    quote() { this.format('BLOCKQUOTE'); }
    callout(kind = 'info') {
        const sel = document.getSelection();
        const text = sel.toString() || 'Callout text...';
        queryExec('insertHTML', `<div class="ls-callout ls-callout-${esc(kind)}" style="border-left:4px solid #3b82f6;background:#eff6ff;padding:8px 12px;margin:8px 0;border-radius:4px">${esc(text)}</div><p>&nbsp;</p>`);
    }
    divider() { queryExec('insertHTML', '<hr/><p>&nbsp;</p>'); }

    // ── Color ────────────────────────────────────────────
    color(c)      { queryExec('foreColor', c); }
    bgColor(c)    { queryExec('hiliteColor', c); }

    // ── Clean ────────────────────────────────────────────
    removeFormat() {
        queryExec('removeFormat');
        queryExec('formatBlock', 'P');
    }

    // ── Embeds ───────────────────────────────────────────
    insertEmbed(iframeHtml) {
        queryExec('insertHTML', `<div class="ls-embed" contenteditable="false" style="margin:8px 0">${iframeHtml}</div><p>&nbsp;</p>`);
    }

    // ── Mention ──────────────────────────────────────────
    insertMention(label, model, id) {
        const html = `<a href="#" class="o_mention" data-mention-id="${esc(id)}" data-mention-model="${esc(model)}" contenteditable="false" style="background:#e0e7ff;color:#3730a3;padding:1px 6px;border-radius:10px;font-weight:500">@${esc(label)}</a>&nbsp;`;
        queryExec('insertHTML', html);
    }

    // ── Source / HTML view ───────────────────────────────
    toggleSource() {
        this.editor.toggleSourceView();
    }

    // ── Fullscreen ───────────────────────────────────────
    toggleFullscreen() { this.editor.toggleFullscreen(); }
}

// ═══════════════════════════════════════════════════════════════════════
//  MODAL / OVERLAY helpers
// ═══════════════════════════════════════════════════════════════════════
function makeOverlay(html) {
    const ov = document.createElement('div');
    ov.className = 'ls-rte-modal-overlay';
    ov.innerHTML = `<div class="ls-rte-modal">${html}</div>`;
    document.body.appendChild(ov);
    setTimeout(() => ov.classList.add('ls-rte-modal-visible'), 10);
    return ov;
}
function closeOverlay(ov) {
    if (!ov) return;
    ov.classList.remove('ls-rte-modal-visible');
    setTimeout(() => ov.remove(), 150);
}

// ═══════════════════════════════════════════════════════════════════════
//  LinkDialog
// ═══════════════════════════════════════════════════════════════════════
class LinkDialog {
    static open(editor, initial = {}) {
        const ov = makeOverlay(`
            <div class="ls-rte-modal-title">${initial.url ? 'Edit link' : 'Insert link'}</div>
            <label>URL <input type="text" class="ls-rte-input" data-role="url" value="${esc(initial.url || 'https://')}" placeholder="https://example.com"/></label>
            <label>Display text <input type="text" class="ls-rte-input" data-role="text" value="${esc(initial.text || '')}" placeholder="Link text"/></label>
            <div class="ls-rte-modal-row">
                <label class="ls-rte-check"><input type="checkbox" data-role="newtab" ${initial.newtab !== false ? 'checked' : ''}/> Open in new tab</label>
            </div>
            <div class="ls-rte-modal-actions">
                ${initial.url ? '<button class="ls-rte-btn ls-rte-btn-danger" data-role="remove">Remove</button>' : ''}
                <button class="ls-rte-btn" data-role="cancel">Cancel</button>
                <button class="ls-rte-btn ls-rte-btn-primary" data-role="save">${initial.url ? 'Update' : 'Insert'}</button>
            </div>
        `);
        const urlInput = ov.querySelector('[data-role="url"]');
        urlInput.focus(); urlInput.select();

        const close = () => closeOverlay(ov);

        ov.querySelector('[data-role="cancel"]').onclick = close;
        ov.querySelector('[data-role="save"]').onclick = () => {
            const url = ov.querySelector('[data-role="url"]').value.trim();
            const text = ov.querySelector('[data-role="text"]').value.trim();
            const newtab = ov.querySelector('[data-role="newtab"]').checked;
            if (!url) { urlInput.focus(); return; }
            if (initial.onSave) initial.onSave({ url, text, newtab });
            else editor.commands.insertLink(url, text, newtab ? '_blank' : '');
            close();
        };
        if (initial.url) {
            const removeBtn = ov.querySelector('[data-role="remove"]');
            if (removeBtn) removeBtn.onclick = () => { editor.commands.unlink(); close(); };
        }
        ov.addEventListener('keydown', e => { if (e.key === 'Enter') ov.querySelector('[data-role="save"]').click(); });
        return ov;
    }
}

// ═══════════════════════════════════════════════════════════════════════
//  TablePicker
// ═══════════════════════════════════════════════════════════════════════
class TablePicker {
    static open(editor) {
        const ov = makeOverlay(`
            <div class="ls-rte-modal-title">Insert table</div>
            <div class="ls-rte-grid-picker">
                <div class="ls-rte-grid-info">Select a grid</div>
                <div class="ls-rte-grid" data-role="grid"></div>
                <div class="ls-rte-grid-label">Click to insert</div>
            </div>
            <div class="ls-rte-modal-actions">
                <button class="ls-rte-btn" data-role="cancel">Cancel</button>
            </div>
        `);
        const grid = ov.querySelector('[data-role="grid"]');
        const info = ov.querySelector('.ls-rte-grid-info');
        for (let r = 1; r <= 8; r++) {
            for (let c = 1; c <= 8; c++) {
                const cell = document.createElement('div');
                cell.className = 'ls-rte-grid-cell';
                cell.dataset.r = r; cell.dataset.c = c;
                grid.appendChild(cell);
            }
        }
        grid.addEventListener('mouseover', e => {
            const t = e.target.closest('.ls-rte-grid-cell');
            if (!t) return;
            grid.querySelectorAll('.ls-rte-grid-cell.active').forEach(c => c.classList.remove('active'));
            const r = +t.dataset.r, c = +t.dataset.c;
            grid.querySelectorAll(`.ls-rte-grid-cell`).forEach(cell => {
                if (+cell.dataset.r <= r && +cell.dataset.c <= c) cell.classList.add('active');
            });
            info.textContent = `${r} × ${c} table`;
        });
        grid.addEventListener('click', e => {
            const t = e.target.closest('.ls-rte-grid-cell');
            if (!t) return;
            editor.commands.insertTable(+t.dataset.r, +t.dataset.c);
            closeOverlay(ov);
        });
        ov.querySelector('[data-role="cancel"]').onclick = () => closeOverlay(ov);
    }
}

// ═══════════════════════════════════════════════════════════════════════
//  MentionPopup — autocomplete for @mentions
// ═══════════════════════════════════════════════════════════════════════
class MentionPopup {
    constructor(editor) {
        this.editor = editor;
        this.popup = null;
        this.items = [];
        this.idx = 0;
        this.triggerOffset = 0;
    }

    open(anchorRect, query) {
        this.close();
        const cfg = this.editor.cfg.mention || {};
        this.popup = document.createElement('div');
        this.popup.className = 'ls-rte-mention-popup';
        this.popup.innerHTML = '<div class="ls-rte-mention-loading">Searching…</div>';
        document.body.appendChild(this.popup);
        this.popup.style.left = anchorRect.left + 'px';
        this.popup.style.top  = (anchorRect.bottom + 4) + 'px';
        setTimeout(() => this.popup.classList.add('visible'), 10);

        const url = (cfg.route || '/api/html-field/mentions');
        const fetchData = window.RPC
            ? window.RPC.post(url, { term: query, model: cfg.model || 'res.partner' })
            : fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': window.__CSRF_TOKEN__ || '' },
                body: JSON.stringify({ term: query, model: cfg.model || 'res.partner' }),
              }).then(r => r.json());

        Promise.resolve(fetchData).then(data => {
            this.items = (data && data.results) || [];
            this.idx = 0;
            this.render();
        }).catch(() => {
            this.popup.innerHTML = '<div class="ls-rte-mention-empty">Mention search failed</div>';
        });
    }

    render() {
        if (!this.popup) return;
        if (!this.items.length) {
            this.popup.innerHTML = '<div class="ls-rte-mention-empty">No matches</div>';
            return;
        }
        this.popup.innerHTML = this.items.map((it, i) => `
            <div class="ls-rte-mention-item ${i === this.idx ? 'active' : ''}" data-i="${i}">
                <span class="ls-rte-mention-avatar">${esc((it.name||'?')[0].toUpperCase())}</span>
                <span class="ls-rte-mention-name">${esc(it.name)}</span>
                <span class="ls-rte-mention-model">${esc(it.model)}</span>
            </div>
        `).join('');
        this.popup.querySelectorAll('.ls-rte-mention-item').forEach(el => {
            el.onclick = () => { this.idx = +el.dataset.i; this.commit(); };
        });
    }

    next() { this.idx = (this.idx + 1) % this.items.length; this.render(); }
    prev() { this.idx = (this.idx - 1 + this.items.length) % this.items.length; this.render(); }
    commit() {
        if (!this.items.length) return;
        const item = this.items[this.idx];
        // Replace "@query" with a mention link
        const sel = window.getSelection();
        if (sel.rangeCount) {
            const range = sel.getRangeAt(0);
            // Move to end of @query text
            const textNode = range.startContainer;
            if (textNode.nodeType === Node.TEXT_NODE) {
                const text = textNode.textContent;
                // Find the last "@" before caret
                const upto = text.substring(0, range.startOffset);
                const at = upto.lastIndexOf('@');
                if (at >= 0) {
                    range.setStart(textNode, at);
                    range.setEnd(textNode, range.startOffset);
                    range.deleteContents();
                }
            }
            this.editor.commands.insertMention(item.name, item.model, item.id);
        }
        this.close();
    }
    close() {
        if (this.popup) { this.popup.remove(); this.popup = null; }
    }
}

// ═══════════════════════════════════════════════════════════════════════
//  ImageUpload
// ═══════════════════════════════════════════════════════════════════════
class ImageUpload {
    static open(editor) {
        const ov = makeOverlay(`
            <div class="ls-rte-modal-title">Insert image</div>
            <div class="ls-rte-tabs">
                <button class="ls-rte-tab active" data-tab="upload">Upload</button>
                <button class="ls-rte-tab" data-tab="url">By URL</button>
            </div>
            <div class="ls-rte-tab-pane active" data-pane="upload">
                <div class="ls-rte-image-drop" data-role="drop">
                    <input type="file" data-role="file" accept="image/*" hidden/>
                    <p>Drop image here or <button class="ls-rte-link-btn" data-role="browse">browse</button></p>
                    <p class="ls-rte-image-meta">Max ${(editor.cfg.image?.max_size || 5242880)/1024/1024} MB · ${(editor.cfg.image?.allowed_mimes || []).join(', ')}</p>
                </div>
                <div class="ls-rte-image-status" data-role="status"></div>
            </div>
            <div class="ls-rte-tab-pane" data-pane="url">
                <label>Image URL <input type="text" class="ls-rte-input" data-role="url" value="https://" placeholder="https://"/></label>
                <label>Alt text <input type="text" class="ls-rte-input" data-role="alt" placeholder="Description for accessibility"/></label>
                <div class="ls-rte-modal-actions">
                    <button class="ls-rte-btn" data-role="cancel">Cancel</button>
                    <button class="ls-rte-btn ls-rte-btn-primary" data-role="insert">Insert</button>
                </div>
            </div>
        `);
        const tabBtns = ov.querySelectorAll('.ls-rte-tab');
        tabBtns.forEach(b => b.onclick = () => {
            tabBtns.forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            ov.querySelectorAll('.ls-rte-tab-pane').forEach(p => p.classList.remove('active'));
            ov.querySelector(`[data-pane="${b.dataset.tab}"]`).classList.add('active');
        });
        ov.querySelector('[data-role="cancel"]').onclick = () => closeOverlay(ov);
        ov.querySelector('[data-role="insert"]').onclick = () => {
            const url = ov.querySelector('[data-role="url"]').value.trim();
            const alt = ov.querySelector('[data-role="alt"]').value.trim();
            if (url) { editor.commands.insertImage(url, alt); closeOverlay(ov); }
        };
        const drop = ov.querySelector('[data-role="drop"]');
        const fileInput = ov.querySelector('[data-role="file"]');
        const status = ov.querySelector('[data-role="status"]');
        ov.querySelector('[data-role="browse"]').onclick = () => fileInput.click();
        drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('ls-rte-image-drop-hover'); });
        drop.addEventListener('dragleave', () => drop.classList.remove('ls-rte-image-drop-hover'));
        drop.addEventListener('drop', e => {
            e.preventDefault(); drop.classList.remove('ls-rte-image-drop-hover');
            if (e.dataTransfer.files[0]) ImageUpload._upload(editor, e.dataTransfer.files[0], status, ov);
        });
        fileInput.onchange = () => {
            if (fileInput.files[0]) ImageUpload._upload(editor, fileInput.files[0], status, ov);
        };
    }

    static _upload(editor, file, statusEl, ov) {
        const cfg = editor.cfg.image || {};
        if ((cfg.max_size || 5242880) && file.size > cfg.max_size) {
            statusEl.innerHTML = `<span class="ls-rte-image-error">File too large (max ${cfg.max_size/1024/1024} MB)</span>`;
            return;
        }
        statusEl.innerHTML = '<span class="ls-rte-image-uploading">Uploading…</span>';

        const fd = new FormData();
        fd.append('file', file);
        fd.append('model', editor.modelName || '');
        fd.append('field', editor.fieldName || '');

        const url = cfg.upload_route || '/api/html-field/image-upload';
        const promise = window.RPC && window.RPC.upload
            ? window.RPC.upload(url, fd)
            : fetch(url, {
                method: 'POST',
                body: fd,
                headers: { 'X-CSRF-TOKEN': window.__CSRF_TOKEN__ || '', 'X-Requested-With': 'XMLHttpRequest' },
              }).then(r => r.json());

        Promise.resolve(promise).then(data => {
            if (data.error) {
                statusEl.innerHTML = `<span class="ls-rte-image-error">${esc(data.error)}</span>`;
                return;
            }
            editor.commands.insertImage(data.url, data.name);
            closeOverlay(ov);
        }).catch(err => {
            statusEl.innerHTML = `<span class="ls-rte-image-error">Upload failed: ${esc(err.message || err)}</span>`;
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════
//  EmbedDialog
// ═══════════════════════════════════════════════════════════════════════
class EmbedDialog {
    static open(editor) {
        const ov = makeOverlay(`
            <div class="ls-rte-modal-title">Insert URL / embed</div>
            <label>URL <input type="text" class="ls-rte-input" data-role="url" value="https://" placeholder="Paste a YouTube / Vimeo / link"/></label>
            <div class="ls-rte-embed-preview" data-role="preview">Paste a URL above to fetch preview</div>
            <div class="ls-rte-modal-actions">
                <button class="ls-rte-btn" data-role="cancel">Cancel</button>
                <button class="ls-rte-btn ls-rte-btn-primary" data-role="insert">Insert</button>
            </div>
        `);
        const urlInput = ov.querySelector('[data-role="url"]');
        const preview = ov.querySelector('[data-role="preview"]');
        urlInput.oninput = debounce(() => {
            const url = urlInput.value.trim();
            if (!url || !/^https?:\/\//.test(url)) {
                preview.innerHTML = 'Paste a URL above to fetch preview';
                return;
            }
            preview.innerHTML = '<em>Fetching…</em>';
            const route = (editor.cfg.embed?.route || '/api/html-field/embeds');
            const promise = window.RPC
                ? window.RPC.post(route, { url, model: editor.modelName || '', field: editor.fieldName || '' })
                : fetch(route, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': window.__CSRF_TOKEN__ || '' },
                    body: JSON.stringify({ url, model: editor.modelName || '', field: editor.fieldName || '' }),
                  }).then(r => r.json());

            Promise.resolve(promise).then(data => {
                if (data.html) {
                    preview.innerHTML = data.html;
                } else {
                    preview.innerHTML = `<div class="ls-rte-embed-card"><strong>${esc(data.title || url)}</strong><br><small>${esc(data.provider || 'link')}</small></div>`;
                }
            }).catch(() => preview.innerHTML = '<em>Failed to fetch preview</em>');
        }, 350);
        ov.querySelector('[data-role="cancel"]').onclick = () => closeOverlay(ov);
        ov.querySelector('[data-role="insert"]').onclick = () => {
            const url = urlInput.value.trim();
            if (!url) return;
            const html = `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="ls-embed-link">${esc(url)}</a>`;
            editor.commands.insertEmbed(html);
            closeOverlay(ov);
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════
//  SourceView — show raw HTML in a textarea
// ═══════════════════════════════════════════════════════════════════════
class SourceView {
    static open(editor) {
        const ov = makeOverlay(`
            <div class="ls-rte-modal-title">HTML source</div>
            <textarea class="ls-rte-source" data-role="source" spellcheck="false"></textarea>
            <div class="ls-rte-modal-actions">
                <button class="ls-rte-btn" data-role="cancel">Cancel</button>
                <button class="ls-rte-btn ls-rte-btn-primary" data-role="apply">Apply</button>
            </div>
        `);
        const ta = ov.querySelector('[data-role="source"]');
        ta.value = editor.getValue();
        ov.querySelector('[data-role="cancel"]').onclick = () => closeOverlay(ov);
        ov.querySelector('[data-role="apply"]').onclick = () => {
            const clean = editor.sanitizer.sanitize(ta.value);
            editor.setValue(clean);
            closeOverlay(ov);
        };
        ta.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') ov.querySelector('[data-role="apply"]').click();
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════
//  Main AdvSoftRTE class
// ═══════════════════════════════════════════════════════════════════════
class AdvSoftRTE {
    constructor(container, options = {}) {
        if (typeof container === 'string') container = document.querySelector(container);
        if (!container) throw new Error('AdvSoftRTE: container not found');
        this.container = container;
        this.options = options;
        this.cfg = options.html || options.config || { allowed_tags: [], toolbar: [], plugins: [] };
        this.value = options.value || '';
        this.readonly = !!(options.readonly || this.cfg.readonly);
        this.modelName = options.model || '';
        this.fieldName = options.field || '';
        this.onChange = options.onChange || function () {};
        this.placeholder = options.placeholder || this.cfg.placeholder || 'Write something…';
        this.minHeight = options.minHeight || this.cfg.min_height || '160px';
        this.maxHeight = options.max_height || this.cfg.max_height || null;
        this.sanitizer = new Sanitizer(this.cfg);
        this.history = null;
        this.mention = null;
        this._mentionActive = false;
        this._mentionQuery = '';
        this._mentionStart = null;
        this._sourceMode = false;
        this._fullscreen = false;
        this._build();
        this.setValue(this.value);
    }

    // ── Build DOM ────────────────────────────────────────
    _build() {
        this.container.classList.add('ls-rte');
        if (this.cfg.compact) this.container.classList.add('ls-rte-compact');
        if (this.readonly) this.container.classList.add('ls-rte-readonly');
        this.container.innerHTML = `
            <div class="ls-rte-toolbar" data-role="toolbar"></div>
            <div class="ls-rte-body" data-role="body">
                <div class="ls-rte-content" data-role="content" contenteditable="${!this.readonly}"></div>
                <textarea class="ls-rte-source" data-role="source" spellcheck="false" style="display:none"></textarea>
            </div>
            <div class="ls-rte-statusbar" data-role="statusbar"></div>
        `;
        this.toolbarEl  = this.container.querySelector('[data-role="toolbar"]');
        this.bodyEl     = this.container.querySelector('[data-role="body"]');
        this.contentEl  = this.container.querySelector('[data-role="content"]');
        this.sourceEl   = this.container.querySelector('[data-role="source"]');
        this.statusEl   = this.container.querySelector('[data-role="statusbar"]');

        this.contentEl.style.minHeight = this.minHeight;
        if (this.maxHeight) {
            this.contentEl.style.maxHeight = this.maxHeight;
            this.contentEl.style.overflowY = 'auto';
        }

        this._renderToolbar();
        this._renderStatusbar();
        this._bindEvents();
        this.commands = new Commands(this);
        this.history  = new History(this.contentEl);
        this.mention  = new MentionPopup(this);

        if (this.cfg.autofocus && !this.readonly) {
            setTimeout(() => this.contentEl.focus(), 50);
        }
    }

    // ── Toolbar rendering ────────────────────────────────
    _renderToolbar() {
        const groups = this.cfg.toolbar || [];
        if (!groups.length) {
            this.toolbarEl.style.display = 'none';
            return;
        }
        this.toolbarEl.innerHTML = groups.map((group, gi) => {
            return `<div class="ls-rte-toolbar-group">${group.map(btn => this._renderButton(btn)).join('')}</div>` +
                (gi < groups.length - 1 ? '<div class="ls-rte-toolbar-sep"></div>' : '');
        }).join('');
        this._bindToolbar();
    }

    _renderButton(key) {
        if (key === '|') return '<div class="ls-rte-toolbar-sep"></div>';
        const title = key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        let icon = '';
        if (ICONS[key] && window.lucideIcon) {
            icon = window.lucideIcon(ICONS[key], 24);
            if (!icon || String(icon).includes('span')) {
                // If lucideIcon fails or returns the fallback span, check if it's emoji/math
                if (ICONS[key] === 'smile') icon = '😀';
                else if (ICONS[key] === 'sigma') icon = '<b>∑</b>';
                else icon = `<span>${esc(title[0])}</span>`;
            }
        } else {
            icon = `<span>${esc(title[0])}</span>`;
        }
        return `<button type="button" class="ls-rte-btn" data-action="${esc(key)}" title="${esc(title)}">${icon}</button>`;
    }

    _bindToolbar() {
        this.toolbarEl.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('mousedown', e => e.preventDefault()); // keep selection
            btn.addEventListener('click', () => this._execAction(btn.dataset.action));
        });
    }

    _execAction(key) {
        if (this.readonly) return;
        // Restore selection before executing
        const cmds = this.commands;
        switch (key) {
            case 'history-undo': cmds.undo(); break;
            case 'history-redo': cmds.redo(); break;
            case 'format-bold':   cmds.bold(); break;
            case 'format-italic': cmds.italic(); break;
            case 'format-underline': cmds.underline(); break;
            case 'format-strike': cmds.strike(); break;
            case 'heading-p':    cmds.paragraph(); break;
            case 'heading-h1':   cmds.heading(1); break;
            case 'heading-h2':   cmds.heading(2); break;
            case 'heading-h3':   cmds.heading(3); break;
            case 'heading-h4':   cmds.heading(4); break;
            case 'list-ul':      cmds.ul(); break;
            case 'list-ol':      cmds.ol(); break;
            case 'indent':       cmds.indent(); break;
            case 'outdent':      cmds.outdent(); break;
            case 'link':         this._openLinkDialog(); break;
            case 'unlink':       cmds.unlink(); break;
            case 'image':        ImageUpload.open(this); break;
            case 'table':        TablePicker.open(this); break;
            case 'code':         cmds.inlineCode(); break;
            case 'code-block':   cmds.codeBlock(); break;
            case 'quote':        cmds.quote(); break;
            case 'callout':      cmds.callout('info'); break;
            case 'divider':      cmds.divider(); break;
            case 'text-color':   this._openColorDialog('foreColor'); break;
            case 'background-color': this._openColorDialog('hiliteColor'); break;
            case 'clean-format': cmds.removeFormat(); break;
            case 'source-view':  SourceView.open(this); break;
            case 'fullscreen':   this.toggleFullscreen(); break;
            case 'mention':      this._triggerMention(); break;
            case 'embed':        EmbedDialog.open(this); break;
            case 'toc':          this._insertToc(); break;
            case 'emoji':        this._openEmojiDialog(); break;
            case 'math':         this._openMathDialog(); break;
            default: console.warn('Unknown RTE action:', key);
        }
        this._onChange();
    }

    // ── Link dialog ──────────────────────────────────────
    _openLinkDialog() {
        // Pre-fill with current selection
        const sel = window.getSelection();
        let text = '', url = '';
        if (sel.rangeCount && !sel.isCollapsed) {
            text = sel.toString();
            const node = sel.anchorNode;
            if (node && node.parentNode && node.parentNode.tagName === 'A') {
                url = node.parentNode.getAttribute('href') || '';
                text = node.parentNode.textContent;
            }
        }
        LinkDialog.open(this, { url, text });
    }

    // ── Color dialog (simple picker) ─────────────────────
    _openColorDialog(cmd) {
        const colors = ['#000000', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#db2777', '#ffffff', '#fef3c7', '#dcfce7', '#dbeafe', '#f3e8ff'];
        const ov = makeOverlay(`
            <div class="ls-rte-modal-title">${cmd === 'foreColor' ? 'Text color' : 'Background color'}</div>
            <div class="ls-rte-color-grid">${colors.map(c => `<button class="ls-rte-color-cell" style="background:${c}" data-c="${c}"></button>`).join('')}</div>
            <div class="ls-rte-modal-actions">
                <input type="color" data-role="custom"/>
                <button class="ls-rte-btn" data-role="cancel">Cancel</button>
            </div>
        `);
        ov.querySelectorAll('.ls-rte-color-cell').forEach(b => b.onclick = () => {
            this.commands.color && cmd === 'foreColor' ? this.commands.color(b.dataset.c) : this.commands.bgColor(b.dataset.c);
            closeOverlay(ov);
        });
        ov.querySelector('[data-role="custom"]').onchange = e => {
            cmd === 'foreColor' ? this.commands.color(e.target.value) : this.commands.bgColor(e.target.value);
            closeOverlay(ov);
        };
        ov.querySelector('[data-role="cancel"]').onclick = () => closeOverlay(ov);
    }

    // ── Emoji dialog ─────────────────────────────────────
    _openEmojiDialog() {
        const emojis = ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','😗','😙','😚','🙂','🤗','🤔','🤐','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','😷','🤒','🤕','🤢','🤮','🤧','😇','🤠','🤡','🥳','🥴','🥺','🤥','🤫','🤭','🧐','🤓','😈','👿','👹','👺','💀','☠️','👻','👽','🤖','💩'];
        const ov = makeOverlay(`
            <div class="ls-rte-modal-title">Insert emoji</div>
            <div class="ls-rte-emoji-grid">${emojis.map(e => `<button class="ls-rte-emoji-cell" data-e="${e}">${e}</button>`).join('')}</div>
            <div class="ls-rte-modal-actions">
                <button class="ls-rte-btn" data-role="cancel">Cancel</button>
            </div>
        `);
        ov.querySelectorAll('.ls-rte-emoji-cell').forEach(b => b.onclick = () => {
            queryExec('insertText', b.dataset.e);
            closeOverlay(ov);
        });
        ov.querySelector('[data-role="cancel"]').onclick = () => closeOverlay(ov);
    }

    // ── Math dialog (simple) ────────────────────────────
    _openMathDialog() {
        const ov = makeOverlay(`
            <div class="ls-rte-modal-title">Insert equation (LaTeX)</div>
            <label>LaTeX <input type="text" class="ls-rte-input" data-role="math" value="E = mc^2"/></label>
            <div class="ls-rte-modal-actions">
                <button class="ls-rte-btn" data-role="cancel">Cancel</button>
                <button class="ls-rte-btn ls-rte-btn-primary" data-role="insert">Insert</button>
            </div>
        `);
        ov.querySelector('[data-role="cancel"]').onclick = () => closeOverlay(ov);
        ov.querySelector('[data-role="insert"]').onclick = () => {
            const expr = ov.querySelector('[data-role="math"]').value.trim();
            if (expr) queryExec('insertHTML', `<code class="ls-rte-math" contenteditable="false" style="background:#f3f4f6;padding:1px 6px;border-radius:3px;font-family:serif">$${esc(expr)}$</code>&nbsp;`);
            closeOverlay(ov);
        };
    }

    // ── TOC insert ───────────────────────────────────────
    _insertToc() {
        const blocks = this.contentEl.querySelectorAll('h1,h2,h3');
        if (!blocks.length) {
            queryExec('insertHTML', '<p><em>No headings found to build a table of contents.</em></p>');
            return;
        }
        const items = Array.from(blocks).map(h => {
            const lvl = +h.tagName[1];
            const text = h.textContent.trim();
            return `<li style="margin-left:${(lvl-1)*16}px"><a href="#">${esc(text)}</a></li>`;
        }).join('');
        queryExec('insertHTML', `<div class="ls-rte-toc" contenteditable="false" style="background:#f9fafb;border:1px solid #e5e7eb;padding:8px 12px;margin:8px 0;border-radius:4px"><strong>Contents</strong><ul style="margin:4px 0;padding-left:0;list-style:none">${items}</ul></div><p>&nbsp;</p>`);
    }

    // ── Mention trigger ──────────────────────────────────
    _triggerMention() {
        // Place "@" at the current caret
        queryExec('insertText', '@');
        this._onChange();
    }

    // ── Status bar ───────────────────────────────────────
    _renderStatusbar() {
        if (!this.cfg.show_stats) { this.statusEl.style.display = 'none'; return; }
        this.statusEl.innerHTML = `
            <span class="ls-rte-stat" data-role="words">0 words</span>
            <span class="ls-rte-stat" data-role="chars">0 chars</span>
            <span class="ls-rte-stat" data-role="read">0s read</span>
            <span class="ls-rte-stat-spacer"></span>
            ${this.cfg.allow_fullscreen ? '<button class="ls-rte-stat-btn" data-role="fs" title="Toggle fullscreen">⛶</button>' : ''}
        `;
        this.statusEl.querySelector('[data-role="fs"]').onclick = () => this.toggleFullscreen();
        this._updateStats();
    }

    _updateStats() {
        if (!this.cfg.show_stats) return;
        const text = this.contentEl.innerText || '';
        const words = (text.match(/\S+/g) || []).length;
        const chars = text.length;
        const readSec = Math.max(1, Math.round(words / 200 * 60));
        const wEl = this.statusEl.querySelector('[data-role="words"]');
        const cEl = this.statusEl.querySelector('[data-role="chars"]');
        const rEl = this.statusEl.querySelector('[data-role="read"]');
        if (wEl) wEl.textContent = `${words} word${words !== 1 ? 's' : ''}`;
        if (cEl) cEl.textContent = `${chars} char${chars !== 1 ? 's' : ''}`;
        if (rEl) rEl.textContent = `${readSec}s read`;
    }

    // ── Source / HTML view ───────────────────────────────
    toggleSourceView() {
        this._sourceMode = !this._sourceMode;
        if (this._sourceMode) {
            this.sourceEl.value = this.contentEl.innerHTML;
            this.sourceEl.style.display = '';
            this.contentEl.style.display = 'none';
        } else {
            const clean = this.sanitizer.sanitize(this.sourceEl.value);
            this.contentEl.innerHTML = clean;
            this.sourceEl.style.display = 'none';
            this.contentEl.style.display = '';
            this._onChange();
        }
    }

    // ── Fullscreen ───────────────────────────────────────
    toggleFullscreen() {
        this._fullscreen = !this._fullscreen;
        this.container.classList.toggle('ls-rte-fullscreen', this._fullscreen);
        if (this._fullscreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    // ── Event binding ────────────────────────────────────
    _bindEvents() {
        const onInput = debounce(() => {
            this.history.snapshot();
        }, 250);

        this.contentEl.addEventListener('input', onInput);
        this.contentEl.addEventListener('blur', () => {
            this.history.snapshot();
            this._onChange();
        });
        this.contentEl.addEventListener('keydown', e => this._onKeydown(e));

        // Drag & drop images
        this.contentEl.addEventListener('dragover', e => { e.preventDefault(); });
        this.contentEl.addEventListener('drop', e => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const file = e.dataTransfer.files[0];
                if (file.type.startsWith('image/')) {
                    ImageUpload._upload(this, file, document.body, null);
                }
            }
        });

        // Paste: sanitize HTML
        this.contentEl.addEventListener('paste', e => {
            e.preventDefault();
            const cd = e.clipboardData || window.clipboardData;
            const html = cd.getData('text/html') || cd.getData('text/plain');
            if (!html) return;
            const clean = this.sanitizer.sanitize(html);
            queryExec('insertHTML', clean);
            this._onChange();
        });
    }

    // ── Keydown handler ──────────────────────────────────
    _onKeydown(e) {
        // Save selection for any pending mention popup
        if (this._mentionActive) {
            if (e.key === 'ArrowDown') { this.mention.next(); e.preventDefault(); return; }
            if (e.key === 'ArrowUp')   { this.mention.prev(); e.preventDefault(); return; }
            if (e.key === 'Enter' || e.key === 'Tab') { this.mention.commit(); e.preventDefault(); return; }
            if (e.key === 'Escape')    { this.mention.close(); this._mentionActive = false; e.preventDefault(); return; }
        }
        // Standard shortcuts
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'b') { this.commands.bold(); e.preventDefault(); return; }
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'i') { this.commands.italic(); e.preventDefault(); return; }
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'u') { this.commands.underline(); e.preventDefault(); return; }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { this.commands.undo(); e.preventDefault(); return; }
        if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { this.commands.redo(); e.preventDefault(); return; }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { this._openLinkDialog(); e.preventDefault(); return; }

        // Mention trigger
        if (e.key === '@' || (e.key.length === 1 && this._mentionActive)) {
            // Schedule mention detection on next tick (after the @ is inserted)
            setTimeout(() => this._detectMention(), 0);
        }
    }

    _detectMention() {
        if (!this.cfg.plugins || !this.cfg.plugins.includes('mention')) return;
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        if (node.nodeType !== Node.TEXT_NODE) {
            this.mention.close(); this._mentionActive = false; return;
        }
        const text = node.textContent;
        const caret = range.startOffset;
        // Find the last '@' before caret that's not part of a word
        let at = -1;
        for (let i = caret - 1; i >= 0; i--) {
            const ch = text[i];
            if (ch === '@') { at = i; break; }
            if (/\s/.test(ch)) break;
        }
        if (at < 0) {
            this.mention.close(); this._mentionActive = false; return;
        }
        const query = text.substring(at + 1, caret);
        this._mentionActive = true;
        // Get rect
        const rect = range.getBoundingClientRect();
        this.mention.open({ left: rect.left, bottom: rect.bottom, right: rect.right }, query);
    }

    // ── Change handler ───────────────────────────────────
    _onChange() {
        this._updateStats();
        this.history && this.history.snapshot();
        this.onChange(this.getValue());
    }

    // ── Public API ───────────────────────────────────────
    getValue() {
        if (this._sourceMode) {
            return this.sanitizer.sanitize(this.sourceEl.value);
        }
        return this.sanitizer.sanitize(this.contentEl.innerHTML);
    }

    setValue(html) {
        const clean = this.sanitizer.sanitize(html || '');
        this.contentEl.innerHTML = clean;
        if (this.history) this.history.reset(clean);
        this._updateStats();
    }

    focus() { this.contentEl.focus(); }
    blur()  { this.contentEl.blur(); }

    destroy() {
        this.container.innerHTML = '';
        this.container.classList.remove('ls-rte', 'ls-rte-compact', 'ls-rte-readonly', 'ls-rte-fullscreen');
    }
}

// ═══════════════════════════════════════════════════════════════════════
//  Public factory
// ═══════════════════════════════════════════════════════════════════════
const instances = new WeakMap();
window.AdvSoftRTE = {
    create(container, options) {
        const inst = new AdvSoftRTE(container, options);
        instances.set(container, inst);
        return inst;
    },
    get(container) { return instances.get(container); },
    Sanitizer, Commands, History, Toolbar: null,
};

// Auto-mount: scan for [data-rte] elements
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-rte]:not(.ls-rte)').forEach(el => {
        try {
            const cfgAttr = el.getAttribute('data-rte-config');
            const cfg = cfgAttr ? JSON.parse(cfgAttr) : {};
            const value = el.textContent || el.innerHTML || '';
            window.AdvSoftRTE.create(el, {
                value,
                ...cfg,
            });
        } catch (e) { console.error('RTE auto-mount failed', e); }
    });
});

})();
