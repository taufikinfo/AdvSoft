(function(){
const { Component, useState, useRef, onMounted, onWillUnmount } = owl;

// ═══════════════════════════════════════════════════════════════
//  SHARED CALENDAR UTILITIES
// ═══════════════════════════════════════════════════════════════
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_SHORT = ['Mo','Tu','We','Th','Fr','Sa','Su'];
const DAYS_MIN = ['M','T','W','T','F','S','S'];

function daysInMonth(y, m) { return new Date(y, m+1, 0).getDate(); }
function firstDayOfMonth(y, m) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d-1; }
function toISODate(y, m, d) { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function todayISO() { const t=new Date(); return toISODate(t.getFullYear(), t.getMonth(), t.getDate()); }
function parseDate(val) { if(!val) return null; const p=val.substring(0,10).split(/[-/]/); if(p.length!==3) return null; return {y:+p[0], m:+p[1]-1, d:+p[2]}; }

// ═══════════════════════════════════════════════════════════════
//  CALENDAR MONTH COMPONENT
// ═══════════════════════════════════════════════════════════════
class CalendarMonth extends Component {
    static template = owl.xml`
        <div class="ls-datepicker-popup" t-on-click.stop="() => {}">
            <div class="ls-dp-header">
                <button class="ls-dp-nav" t-on-click="prevMonth" title="Previous month">‹</button>
                <span class="ls-dp-month-year">
                    <t t-esc="monthLabel"/> <t t-esc="state.year"/>
                </span>
                <button class="ls-dp-nav" t-on-click="nextMonth" title="Next month">›</button>
            </div>
            <div class="ls-dp-weekdays">
                <t t-foreach="DAYS_MIN" t-as="d" t-key="d"><span t-esc="d"/></t>
            </div>
            <div class="ls-dp-grid">
                <t t-foreach="state.days" t-as="day" t-key="day.key">
                    <button
                        t-att-class="'ls-dp-day' + (day.isToday ? ' ls-dp-today' : '') + (day.isSelected ? ' ls-dp-selected' : '') + (day.isOtherMonth ? ' ls-dp-other' : '') + (day.isDisabled ? ' ls-dp-disabled' : '')"
                        t-att-disabled="day.isDisabled"
                        t-on-click="() => this.selectDay(day)"
                        t-esc="day.label"/>
                </t>
            </div>
            <t t-if="props.showTime">
                <div class="ls-dp-time">
                    <input type="number" class="ls-dp-time-input" t-ref="hourInput" min="0" max="23" t-att-value="state.hours" t-on-change="onTimeChange" placeholder="HH"/>
                    <span>:</span>
                    <input type="number" class="ls-dp-time-input" t-ref="minInput" min="0" max="59" t-att-step="props.timeInterval||5" t-att-value="state.minutes" t-on-change="onTimeChange" placeholder="MM"/>
                    <t t-if="props.showSeconds">
                        <span>:</span>
                        <input type="number" class="ls-dp-time-input" t-ref="secInput" min="0" max="59" t-att-value="state.seconds" t-on-change="onTimeChange" placeholder="SS"/>
                    </t>
                </div>
            </t>
            <div class="ls-dp-footer">
                <button class="ls-btn ls-btn-sm" t-on-click="clear">Clear</button>
                <button class="ls-btn ls-btn-sm" t-on-click="setToday">Today</button>
                <button class="ls-btn ls-btn-primary ls-btn-sm" t-on-click="confirm">OK</button>
            </div>
        </div>
    `;

    static props = {
        value: { type: String, optional: true },
        minDate: { type: String, optional: true },
        maxDate: { type: String, optional: true },
        showTime: { type: Boolean, optional: true },
        showSeconds: { type: Boolean, optional: true },
        timeInterval: { type: Number, optional: true },
        onSelect: { type: Function },
        onClose: { type: Function },
    };

    setup() {
        const today = new Date();
        const parsed = parseDate(this.props.value);
        const y = parsed ? parsed.y : today.getFullYear();
        const m = parsed ? parsed.m : today.getMonth();
        const d = parsed ? parsed.d : today.getDate();
        let hours = 0, mins = 0, secs = 0;
        if (this.props.value && this.props.value.length >= 16) {
            const tp = this.props.value.substring(11, 19).split(':');
            hours = +tp[0]||0; mins = +tp[1]||0; secs = +tp[2]||0;
        }

        this.state = useState({
            year: y, month: m,
            hours, minutes: mins, seconds: secs,
            selectedDate: { y, m, d },
            days: [],
        });
        this._buildDays();
    }

    get monthLabel() { return MONTHS[this.state.month]; }

    _buildDays() {
        const { year, month, selectedDate } = this.state;
        const dim = daysInMonth(year, month);
        const first = firstDayOfMonth(year, month);
        const today = todayISO();
        const minD = this.props.minDate;
        const maxD = this.props.maxDate;
        const days = [];

        // Previous month filler
        const prevDim = daysInMonth(year, month-1 < 0 ? 11 : month-1);
        for (let i = first-1; i >= 0; i--) {
            const d = prevDim - i;
            days.push({ key: 'p'+d, label: d, isOtherMonth: true, isToday: false, isSelected: false, isDisabled: true });
        }

        // Current month
        for (let d = 1; d <= dim; d++) {
            const iso = toISODate(year, month, d);
            const sel = selectedDate && selectedDate.y === year && selectedDate.m === month && selectedDate.d === d;
            let disabled = false;
            if (minD && iso < minD) disabled = true;
            if (maxD && iso > maxD) disabled = true;
            days.push({ key: 'd'+d, label: d, isOtherMonth: false, isToday: iso === today, isSelected: !!sel, isDisabled: disabled });
        }

        // Next month filler
        const remaining = 42 - days.length;
        for (let d = 1; d <= remaining; d++) {
            days.push({ key: 'n'+d, label: d, isOtherMonth: true, isToday: false, isSelected: false, isDisabled: true });
        }

        this.state.days = days;
    }

    prevMonth() { if (this.state.month===0) { this.state.month=11; this.state.year--; } else { this.state.month--; } this._buildDays(); }
    nextMonth() { if (this.state.month===11) { this.state.month=0; this.state.year++; } else { this.state.month++; } this._buildDays(); }

    selectDay(day) {
        if (day.isOtherMonth || day.isDisabled) return;
        this.state.selectedDate = { y: this.state.year, m: this.state.month, d: day.label };
        this._buildDays();
    }

    setToday() {
        const t = new Date();
        this.state.year = t.getFullYear();
        this.state.month = t.getMonth();
        this.state.selectedDate = { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
        this._buildDays();
    }

    clear() { if (this.props.onClose) this.props.onClose(null); }

    confirm() {
        const { year, month, selectedDate, hours, minutes, seconds } = this.state;
        let val = toISODate(year, month, selectedDate.d);
        if (this.props.showTime) {
            val += ` ${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`;
            if (this.props.showSeconds) val += `:${String(seconds).padStart(2,'0')}`;
            else val += ':00';
        }
        if (this.props.onSelect) this.props.onSelect(val);
        if (this.props.onClose) this.props.onClose(val);
    }

    onTimeChange(ev) {
        const target = ev.target;
        const name = target === this.hourInputRef?.el ? 'hours' : target === this.minInputRef?.el ? 'minutes' : 'seconds';
        let v = parseInt(target.value, 10) || 0;
        if (name === 'hours') v = Math.max(0, Math.min(23, v));
        else v = Math.max(0, Math.min(59, v));
        this.state[name] = v;
    }
}

// ═══════════════════════════════════════════════════════════════
//  DATE FIELD COMPONENT (with popup calendar)
// ═══════════════════════════════════════════════════════════════
class FieldDate extends Component {
    static template = owl.xml`
        <div class="ls-date-widget" t-att-data-field="props.fieldDef.name">
            <t t-if="props.readonly">
                <span class="ls-date-display" t-esc="formattedDisplay || '—'"/>
            </t>
            <t t-else="">
                <div class="ls-datepicker-input-group">
                    <input class="ls-field-input ls-datepicker-input" type="text"
                        t-ref="input"
                        t-att-value="formattedDisplay || ''"
                        t-att-placeholder="props.fieldDef.options?.placeholder || 'YYYY-MM-DD'"
                        t-on-focus="openPicker"
                        t-on-keydown="onKeydown"
                        readonly="true"
                        autocomplete="off"/>
                    <button class="ls-datepicker-trigger" t-on-click="openPicker" title="Open calendar" tabindex="-1">📅</button>
                </div>
                <div class="ls-datepicker-dropdown" t-if="state.open" t-ref="dropdown">
                    <CalendarMonth
                        value="props.value"
                        minDate="props.fieldDef.options?.min_date"
                        maxDate="props.fieldDef.options?.max_date"
                        showTime="false"
                        onSelect="(val) => this.onDateSelect(val)"
                        onClose="(val) => this.onDateSelect(val)"
                    />
                </div>
            </t>
        </div>
    `;
    static components = { CalendarMonth };

    setup() {
        this.state = useState({ open: false });
        this.inputRef = useRef("input");
        this.dropdownRef = useRef("dropdown");

        onMounted(() => {
            document.addEventListener('click', this._onDocClick);
        });
        onWillUnmount(() => {
            document.removeEventListener('click', this._onDocClick);
        });
    }

    _onDocClick = (ev) => {
        if (this.state.open && this.dropdownRef?.el && !this.dropdownRef.el.contains(ev.target) && ev.target !== this.inputRef?.el) {
            this.state.open = false;
        }
    };

    get formattedDisplay() {
        const v = this.props.value;
        if (!v) return '';
        const d = new Date(v);
        if (isNaN(d.getTime())) return v;
        return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    openPicker() { this.state.open = !this.state.open; }

    onDateSelect(val) {
        this.state.open = false;
        if (val === null) {
            this.props.updateField(false);
        } else if (val !== undefined) {
            this.props.updateField(val);
        }
    }

    onKeydown(ev) {
        if (ev.key === 'Escape') { this.state.open = false; }
        if (ev.key === 'ArrowDown') { this.state.open = true; ev.preventDefault(); }
    }
}

// ═══════════════════════════════════════════════════════════════
//  DATETIME FIELD COMPONENT (with popup calendar + time)
// ═══════════════════════════════════════════════════════════════
class FieldDatetime extends Component {
    static template = owl.xml`
        <div class="ls-datetime-widget" t-att-data-field="props.fieldDef.name">
            <t t-if="props.readonly">
                <span class="ls-date-display" t-esc="formattedDisplay || '—'"/>
            </t>
            <t t-else="">
                <div class="ls-datepicker-input-group">
                    <input class="ls-field-input ls-datepicker-input" type="text"
                        t-ref="input"
                        t-att-value="formattedDisplay || ''"
                        t-att-placeholder="props.fieldDef.options?.placeholder || 'YYYY-MM-DD HH:MM'"
                        t-on-focus="openPicker"
                        t-on-keydown="onKeydown"
                        readonly="true"
                        autocomplete="off"/>
                    <button class="ls-datepicker-trigger" t-on-click="openPicker" title="Open calendar" tabindex="-1">📅</button>
                </div>
                <div class="ls-datepicker-dropdown" t-if="state.open" t-ref="dropdown">
                    <CalendarMonth
                        value="props.value"
                        minDate="props.fieldDef.options?.min_date"
                        maxDate="props.fieldDef.options?.max_date"
                        showTime="true"
                        showSeconds="props.fieldDef.options?.show_seconds || false"
                        timeInterval="props.fieldDef.options?.time_interval || 5"
                        onSelect="(val) => this.onDateSelect(val)"
                        onClose="(val) => this.onDateSelect(val)"
                    />
                </div>
            </t>
        </div>
    `;
    static components = { CalendarMonth };

    setup() {
        this.state = useState({ open: false });
        this.inputRef = useRef("input");
        this.dropdownRef = useRef("dropdown");

        onMounted(() => {
            document.addEventListener('click', this._onDocClick);
        });
        onWillUnmount(() => {
            document.removeEventListener('click', this._onDocClick);
        });
    }

    _onDocClick = (ev) => {
        if (this.state.open && this.dropdownRef?.el && !this.dropdownRef.el.contains(ev.target) && ev.target !== this.inputRef?.el) {
            this.state.open = false;
        }
    };

    get formattedDisplay() {
        const v = this.props.value;
        if (!v) return '';
        const d = new Date(v.replace(' ','T'));
        if (isNaN(d.getTime())) return v;
        const datePart = d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
        const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return `${datePart} ${timePart}`;
    }

    openPicker() { this.state.open = !this.state.open; }

    onDateSelect(val) {
        this.state.open = false;
        if (val === null) {
            this.props.updateField(false);
        } else if (val !== undefined) {
            this.props.updateField(val);
        }
    }

    onKeydown(ev) {
        if (ev.key === 'Escape') { this.state.open = false; }
        if (ev.key === 'ArrowDown') { this.state.open = true; ev.preventDefault(); }
    }
}

// Register as OWL components
window.addEventListener('load', () => {
    if (window.FieldWidgets && window.FieldWidgets.components) {
        window.FieldWidgets.components['date'] = FieldDate;
        window.FieldWidgets.components['datetime'] = FieldDatetime;
    }
});

})();
