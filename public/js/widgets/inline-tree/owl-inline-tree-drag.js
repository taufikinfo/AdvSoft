// ══════════════════════════════════════════════════════════════
//  InlineTree — Drag & Drop Reorder
//  HTML5 drag-drop for sequence_field persistence
// ══════════════════════════════════════════════════════════════
(function () {

class DragController {
    constructor(opts) {
        this.tabField = opts.tabField;
        this.sequenceField = opts.sequenceField;
        this.onReorder = opts.onReorder || (() => {});
        this.draggingIdx = -1;
        this._cleanup = null;
    }

    attach(tableEl) {
        if (!tableEl) return;
        this._cleanup = () => {
            if (tableEl) {
                tableEl.querySelectorAll('.ls-it-drag-handle').forEach(h => {
                    h.removeAttribute('draggable');
                });
                tableEl.removeEventListener('dragstart', this._onStart);
                tableEl.removeEventListener('dragend', this._onEnd);
                tableEl.removeEventListener('dragover', this._onOver);
                tableEl.removeEventListener('drop', this._onDrop);
            }
        };
        tableEl.addEventListener('dragstart', (ev) => this._onStart(ev));
        tableEl.addEventListener('dragend', (ev) => this._onEnd(ev));
        tableEl.addEventListener('dragover', (ev) => this._onOver(ev));
        tableEl.addEventListener('drop', (ev) => this._onDrop(ev));
    }

    destroy() {
        if (this._cleanup) this._cleanup();
    }

    _rowFromEvent(ev) {
        const tr = ev.target.closest('tr.ls-it-row');
        if (!tr) return null;
        return { idx: parseInt(tr.dataset.index), id: tr.dataset.id };
    }

    _onStart = (ev) => {
        const row = this._rowFromEvent(ev);
        if (!row) return;
        this.draggingIdx = row.idx;
        ev.dataTransfer.effectAllowed = 'move';
        ev.dataTransfer.setData('text/plain', row.id);
        ev.target.closest('tr').classList.add('ls-it-dragging');
    };

    _onEnd = (ev) => {
        ev.target.closest('tr')?.classList.remove('ls-it-dragging');
        document.querySelectorAll('.ls-it-drop-above, .ls-it-drop-below').forEach(el => {
            el.classList.remove('ls-it-drop-above', 'ls-it-drop-below');
        });
        this.draggingIdx = -1;
    };

    _onOver = (ev) => {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'move';
        const tr = ev.target.closest('tr.ls-it-row');
        if (!tr) return;
        document.querySelectorAll('.ls-it-drop-above, .ls-it-drop-below').forEach(el => {
            el.classList.remove('ls-it-drop-above', 'ls-it-drop-below');
        });
        const rect = tr.getBoundingClientRect();
        const before = (ev.clientY - rect.top) < rect.height / 2;
        tr.classList.add(before ? 'ls-it-drop-above' : 'ls-it-drop-below');
    };

    _onDrop = (ev) => {
        ev.preventDefault();
        const target = this._rowFromEvent(ev);
        const fromIdx = this.draggingIdx;
        if (!target || fromIdx < 0 || fromIdx === target.idx) return;
        this.onReorder(fromIdx, target.idx, this.sequenceField);
    };
}

window.InlineTreeDrag = DragController;
})();
