// ══════════════════════════════════════════════════════════════════
//  CalendarView — Odoo-style calendar with day/week/month modes
//  Features: drag-drop reschedule, time grid, create-by-selection,
//  multi-day spanning, tooltips, color legend, quick create
// ══════════════════════════════════════════════════════════════════
(function () {
const { Component, useState, onWillStart, onMounted, onWillUnmount, xml, useRef } = owl;
const RPC = window.AdvSoftRPC;

function esc(v) { return v == null ? '' : String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const EVENT_COLORS = [
    '#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626',
    '#ec4899', '#0891b2', '#4f46e5', '#0d9488', '#b45309',
];

const COLOR_HEX = {
    0: '#ef4444', 1: '#f97316', 2: '#f59e0b', 3: '#10b981',
    4: '#06b6d4', 5: '#3b82f6', 6: '#8b5cf6', 7: '#ec4899',
    8: '#6366f1', 9: '#84cc16',
};

function getColorForValue(val) {
    if (val == null || val === false) return null;
    if (typeof val === 'number' || /^\d+$/.test(String(val))) {
        return COLOR_HEX[Number(val)] || EVENT_COLORS[Number(val) % EVENT_COLORS.length];
    }
    // Hash string to consistent color
    let hash = 0;
    const s = String(val);
    for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
    return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

function fmtTime(d) {
    if (!d) return '';
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtDate(d) {
    if (!d) return '';
    return d.toISOString().slice(0, 10);
}

class CalendarView extends Component {
    static template = xml`
<div class="ls-calendar-view">
    <div class="ls-control-panel">
        <div class="ls-cp-top">
            <div class="ls-breadcrumb">
                <span class="ls-breadcrumb-item" t-esc="props.actionTitle || 'Records'"/>
            </div>
            <div class="ls-searchbar-row"></div>
        </div>
        <div class="ls-cp-bottom">
            <div class="ls-cp-action-buttons">
                <button class="ls-btn ls-btn-primary ls-btn-sm" t-on-click="onAddEvent">
                    + Add Event
                </button>
            </div>
            <div class="ls-cp-pager-switchers">
                <div class="ls-view-switcher" t-if="props.viewModes and props.viewModes.length > 1">
                    <t t-foreach="props.viewModes" t-as="vm" t-key="vm.type">
                        <button t-att-class="'ls-btn-icon' + (props.activeViewType === vm.type ? ' active' : '')"
                                t-on-click="() => props.onSwitchView(vm.type)"
                                t-att-title="vm.label">
                            <t t-out="vm.icon"/>
                        </button>
                    </t>
                </div>
            </div>
        </div>
    </div>
    <t t-if="state.loading">
        <div class="ls-loading"><div class="ls-spinner"/> Loading Calendar...</div>
    </t>
    <t t-else="">
        <div class="ls-calendar-toolbar">
            <div class="ls-calendar-nav">
                <button class="ls-btn ls-btn-sm" t-on-click="goToday">Today</button>
                <button class="ls-btn ls-btn-sm ls-btn-icon" t-on-click="goPrev">&#8249;</button>
                <button class="ls-btn ls-btn-sm ls-btn-icon" t-on-click="goNext">&#8250;</button>
                <span class="ls-calendar-title" t-esc="calendarTitle"/>
            </div>
            <div class="ls-calendar-modes">
                <button t-att-class="'ls-btn ls-btn-sm' + (state.mode === 'day' ? ' active' : '')"
                        t-on-click="() => this.setMode('day')">Day</button>
                <button t-att-class="'ls-btn ls-btn-sm' + (state.mode === 'week' ? ' active' : '')"
                        t-on-click="() => this.setMode('week')">Week</button>
                <button t-att-class="'ls-btn ls-btn-sm' + (state.mode === 'month' ? ' active' : '')"
                        t-on-click="() => this.setMode('month')">Month</button>
            </div>
        </div>

        <div class="ls-calendar-body">
            <!-- Color Legend Sidebar -->
            <t t-if="Object.keys(state.colorMap).length > 1">
                <div class="ls-calendar-sidebar">
                    <div class="ls-calendar-legend-title">Legend</div>
                    <t t-foreach="Object.entries(state.colorMap)" t-as="entry" t-key="entry[0]">
                        <div class="ls-calendar-legend-item">
                            <span class="ls-calendar-legend-dot" t-att-style="'background:' + entry[1]"/>
                            <span class="ls-calendar-legend-label" t-esc="getColorLabel(entry[0])"/>
                        </div>
                    </t>
                </div>
            </t>

            <!-- MONTH VIEW -->
            <t t-if="state.mode === 'month'">
                <div class="ls-calendar-grid ls-calendar-month">
                    <div class="ls-calendar-weekday" t-foreach="['Sun','Mon','Tue','Wed','Thu','Fri','Sat']" t-as="d" t-key="d" t-esc="d"/>
                    <t t-foreach="monthCells" t-as="cell" t-key="cell.key">
                        <div t-att-class="'ls-calendar-cell' + (cell.isToday ? ' today' : '') + (cell.isOtherMonth ? ' other-month' : '')"
                             t-on-click="() => this.onCellClick(cell.date)"
                             t-on-mousedown="(ev) => this.onCellMouseDown(ev, cell.date)"
                             t-on-mouseover="(ev) => this.onCellMouseMove(ev, cell.date)"
                             t-on-mouseup="() => this.onCellMouseUp(cell.date)"
                             t-att-data-date="cell.date">
                            <div class="ls-calendar-day-num" t-esc="cell.day"/>
                            <div class="ls-calendar-events">
                                <t t-foreach="cell.events" t-as="ev" t-key="ev.id">
                                    <div class="ls-calendar-event"
                                         t-att-style="'background:' + ev._color + '18;color:' + ev._color + ';border-left:3px solid ' + ev._color"
                                         t-att-title="ev._tooltip"
                                         draggable="true"
                                         t-on-dragstart="(e) => this.onEventDragStart(e, ev)"
                                         t-on-click.stop="() => this.onEventClick(ev)"
                                         t-on-mouseenter="(e) => this.showTooltip(e, ev)"
                                         t-on-mouseleave="() => this.hideTooltip()">
                                        <t t-if="ev._isMultiDay">
                                            <span class="ls-cal-ev-multiday" t-esc="ev._title"/>
                                        </t>
                                        <t t-else="">
                                            <t t-esc="ev._title"/>
                                        </t>
                                    </div>
                                </t>
                                <t t-if="cell.events.length > 3">
                                    <div class="ls-calendar-more" t-esc="'+' + (cell.events.length - 3) + ' more'"/>
                                </t>
                            </div>
                        </div>
                    </t>
                </div>
            </t>

            <!-- WEEK VIEW (Time Grid) -->
            <t t-if="state.mode === 'week'">
                <div class="ls-calendar-week-timegrid">
                    <!-- All-day section -->
                    <div class="ls-cal-timegrid-header">
                        <div class="ls-cal-timegrid-gutter"/>
                        <t t-foreach="weekCells" t-as="cell" t-key="cell.key">
                            <div t-att-class="'ls-cal-timegrid-header-cell' + (cell.isToday ? ' today' : '')">
                                <div class="ls-cal-tg-dayname" t-esc="cell.dayName"/>
                                <div t-att-class="'ls-cal-tg-daynum' + (cell.isToday ? ' today' : '')" t-esc="cell.day"/>
                            </div>
                        </t>
                    </div>
                    <!-- All-day events row -->
                    <div class="ls-cal-timegrid-allday">
                        <div class="ls-cal-timegrid-gutter ls-cal-allday-label">All day</div>
                        <t t-foreach="weekCells" t-as="cell" t-key="'allday_'+cell.key">
                            <div class="ls-cal-timegrid-allday-cell"
                                 t-on-click="() => this.onCellClick(cell.date)">
                                <t t-foreach="cell.allDayEvents" t-as="ev" t-key="ev.id">
                                    <div class="ls-calendar-event ls-cal-ev-allday"
                                         t-att-style="'background:' + ev._color + ';color:#fff'"
                                         draggable="true"
                                         t-on-dragstart="(e) => this.onEventDragStart(e, ev)"
                                         t-on-click.stop="() => this.onEventClick(ev)"
                                         t-esc="ev._title"/>
                                </t>
                            </div>
                        </t>
                    </div>
                    <!-- Time grid -->
                    <div class="ls-cal-timegrid-scroll" t-ref="timeGridScroll">
                        <div class="ls-cal-timegrid-body">
                            <t t-foreach="HOURS" t-as="h" t-key="'hour_'+h">
                                <div class="ls-cal-timegrid-row">
                                    <div class="ls-cal-timegrid-gutter ls-cal-time-label" t-esc="fmtHour(h)"/>
                                    <t t-foreach="weekCells" t-as="cell" t-key="'hour_'+h+'_'+cell.key">
                                        <div t-att-class="'ls-cal-timegrid-cell' + (cell.isToday ? ' today' : '')"
                                             t-att-data-hour="h"
                                             t-att-data-date="cell.date"
                                             t-on-click="() => this.onTimeCellClick(cell.date, h)"
                                             t-on-mousedown="(ev) => this.onTimeCellMouseDown(ev, cell.date, h)"
                                             t-on-mouseover="(ev) => this.onTimeCellMouseMove(ev, cell.date, h)"
                                             t-on-mouseup="() => this.onTimeCellMouseUp(cell.date, h)">
                                            <t t-foreach="getEventsForHour(cell, h)" t-as="ev" t-key="ev.id">
                                                <div class="ls-cal-timegrid-event"
                                                     t-att-style="getTimeEventStyle(ev, h)"
                                                     t-att-title="ev._tooltip"
                                                     draggable="true"
                                                     t-on-dragstart="(e) => this.onEventDragStart(e, ev)"
                                                     t-on-click.stop="() => this.onEventClick(ev)">
                                                    <span class="ls-cal-tg-ev-time" t-esc="fmtTime(ev._date) + ' - ' + fmtTime(ev._dateEnd)"/>
                                                    <span class="ls-cal-tg-ev-title" t-esc="ev._title"/>
                                                </div>
                                            </t>
                                        </div>
                                    </t>
                                </div>
                            </t>
                            <!-- Current time indicator -->
                            <t t-if="state.showTimeIndicator">
                                <div class="ls-cal-timegrid-now" t-att-style="'top:' + state.timeIndicatorTop + 'px'">
                                    <span class="ls-cal-now-dot"/>
                                    <span class="ls-cal-now-line"/>
                                </div>
                            </t>
                        </div>
                    </div>
                </div>
            </t>

            <!-- DAY VIEW (Time Grid) -->
            <t t-if="state.mode === 'day'">
                <div class="ls-calendar-day-timegrid">
                    <div class="ls-cal-dayview-header" t-esc="dayTitle"/>
                    <!-- All-day section -->
                    <div class="ls-cal-dayview-allday">
                        <span class="ls-cal-allday-label">All day</span>
                        <div class="ls-cal-dayview-allday-events">
                            <t t-foreach="dayAllDayEvents" t-as="ev" t-key="ev.id">
                                <div class="ls-calendar-event ls-cal-ev-allday"
                                     t-att-style="'background:' + ev._color + ';color:#fff'"
                                     draggable="true"
                                     t-on-dragstart="(e) => this.onEventDragStart(e, ev)"
                                     t-on-click.stop="() => this.onEventClick(ev)"
                                     t-esc="ev._title"/>
                            </t>
                        </div>
                    </div>
                    <!-- Time grid -->
                    <div class="ls-cal-timegrid-scroll" t-ref="dayTimeGridScroll">
                        <div class="ls-cal-timegrid-body ls-cal-dayview-body">
                            <t t-foreach="HOURS" t-as="h" t-key="'dhour_'+h">
                                <div class="ls-cal-timegrid-row">
                                    <div class="ls-cal-timegrid-gutter ls-cal-time-label" t-esc="fmtHour(h)"/>
                                    <div t-att-class="'ls-cal-timegrid-cell ls-cal-dayview-cell' + (isCurrentHour(h) ? ' current-hour' : '')"
                                         t-att-data-hour="h"
                                         t-on-click="() => this.onTimeCellClick(state.currentDate.toISOString().slice(0,10), h)"
                                         t-on-mousedown="(ev) => this.onTimeCellMouseDown(ev, state.currentDate.toISOString().slice(0,10), h)"
                                         t-on-mouseover="(ev) => this.onTimeCellMouseMove(ev, state.currentDate.toISOString().slice(0,10), h)"
                                         t-on-mouseup="() => this.onTimeCellMouseUp(state.currentDate.toISOString().slice(0,10), h)">
                                        <t t-foreach="getDayEventsForHour(h)" t-as="ev" t-key="ev.id">
                                            <div class="ls-cal-timegrid-event"
                                                 t-att-style="getTimeEventStyle(ev, h)"
                                                 t-att-title="ev._tooltip"
                                                 draggable="true"
                                                 t-on-dragstart="(e) => this.onEventDragStart(e, ev)"
                                                 t-on-click.stop="() => this.onEventClick(ev)">
                                                <span class="ls-cal-tg-ev-time" t-esc="fmtTime(ev._date) + ' - ' + fmtTime(ev._dateEnd)"/>
                                                <span class="ls-cal-tg-ev-title" t-esc="ev._title"/>
                                                <t t-foreach="ev._displayFields" t-as="df" t-key="df.field">
                                                    <span class="ls-cal-tg-ev-detail" t-esc="df.value"/>
                                                </t>
                                            </div>
                                        </t>
                                    </div>
                                </div>
                            </t>
                            <t t-if="state.showTimeIndicator">
                                <div class="ls-cal-timegrid-now" t-att-style="'top:' + state.timeIndicatorTop + 'px'">
                                    <span class="ls-cal-now-dot"/>
                                    <span class="ls-cal-now-line"/>
                                </div>
                            </t>
                        </div>
                    </div>
                </div>
            </t>
        </div>

        <!-- Tooltip -->
        <t t-if="state.tooltip.visible">
            <div class="ls-calendar-tooltip"
                 t-att-style="'left:' + state.tooltip.x + 'px;top:' + state.tooltip.y + 'px'"
                 t-on-mouseenter="() => this.keepTooltip()"
                 t-on-mouseleave="() => this.hideTooltip()">
                <div class="ls-cal-tooltip-title" t-esc="state.tooltip.event._title"/>
                <div class="ls-cal-tooltip-time" t-esc="state.tooltip.event._tooltipTime"/>
                <t t-foreach="state.tooltip.event._displayFields" t-as="df" t-key="df.field">
                    <div class="ls-cal-tooltip-field">
                        <span class="ls-cal-tooltip-label" t-esc="df.label + ': '"/>
                        <span t-esc="df.value"/>
                    </div>
                </t>
            </div>
        </t>

        <!-- Quick Create Modal -->
        <t t-if="state.quickCreate.visible">
            <div class="ls-calendar-modal-overlay" t-on-click="() => this.closeQuickCreate()">
                <div class="ls-calendar-modal" t-on-click.stop="">
                    <div class="ls-cal-modal-header">New Event</div>
                    <div class="ls-cal-modal-body">
                        <div class="ls-cal-form-group">
                            <label>Title</label>
                            <input type="text" t-model="state.quickCreate.title" placeholder="Event title..." class="ls-cal-form-input"/>
                        </div>
                        <div class="ls-cal-form-row">
                            <div class="ls-cal-form-group">
                                <label>Start</label>
                                <input type="datetime-local" t-model="state.quickCreate.start" class="ls-cal-form-input"/>
                            </div>
                            <div class="ls-cal-form-group">
                                <label>End</label>
                                <input type="datetime-local" t-model="state.quickCreate.end" class="ls-cal-form-input"/>
                            </div>
                        </div>
                        <t t-if="state.quickCreate.allDayField">
                            <div class="ls-cal-form-group">
                                <label class="ls-cal-form-check">
                                    <input type="checkbox" t-model="state.quickCreate.allDay"/>
                                    All day
                                </label>
                            </div>
                        </t>
                    </div>
                    <div class="ls-cal-modal-footer">
                        <button class="ls-btn ls-btn-sm" t-on-click="() => this.closeQuickCreate()">Discard</button>
                        <button class="ls-btn ls-btn-primary ls-btn-sm" t-on-click="() => this.submitQuickCreate()">Save</button>
                    </div>
                </div>
            </div>
        </t>
    </t>
</div>
    `;

    static props = {
        model: { type: String },
        calendarViewDef: { type: Object, optional: true },
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
        const vd = this.props.calendarViewDef || {};
        this._timeIndicatorInterval = null;
        this.HOURS = HOURS;
        this.fmtTime = fmtTime;

        this.state = useState({
            loading: true,
            mode: vd.mode || 'month',
            currentDate: new Date(),
            events: [],
            viewDef: vd,
            fields: {},
            colorMap: {},
            // Drag state
            dragEvent: null,
            dragStartDate: null,
            dragEndDate: null,
            isDragging: false,
            // Selection state (create by drag)
            selectionStart: null,
            selectionEnd: null,
            isSelecting: false,
            // Tooltip
            tooltip: { visible: false, x: 0, y: 0, event: null },
            tooltipTimeout: null,
            // Quick create
            quickCreate: { visible: false, title: '', start: '', end: '', allDay: false, allDayField: null },
            // Time indicator
            showTimeIndicator: false,
            timeIndicatorTop: 0,
        });

        onWillStart(async () => {
            const fields = await RPC.fieldsGet(this._model);
            this.state.fields = fields;
            await this.loadEvents();
        });

        onMounted(() => {
            this._timeIndicatorInterval = setInterval(() => this.updateTimeIndicator(), 60000);
            this.updateTimeIndicator();
            this._keyHandler = (ev) => {
                if (ev.key === 'Escape') {
                    this.hideTooltip();
                    this.closeQuickCreate();
                }
            };
            document.addEventListener('keydown', this._keyHandler);
        });

        onWillUnmount(() => {
            if (this._timeIndicatorInterval) clearInterval(this._timeIndicatorInterval);
            document.removeEventListener('keydown', this._keyHandler);
        });
    }

    // ══════════════════════════════════════════════════
    //  Data loading
    // ══════════════════════════════════════════════════

    async loadEvents() {
        this.state.loading = true;
        const vd = this.state.viewDef;
        const dateField = vd.date_start || 'deadline';
        const domain = this.props.actionDomain || this.props.domain || [];

        const range = this.getDateRange();
        const dateDomain = [
            ...domain,
            [dateField, '>=', range.start],
            [dateField, '<=', range.end],
        ];

        const res = await RPC.searchRead(this._model, dateDomain, { limit: 500 });
        const records = res.records || [];
        const colorField = vd.color;
        const displayFields = vd.event_display_fields || ['name'];

        // Build color map
        const colorMap = {};
        records.forEach(r => {
            if (colorField) {
                const colorKey = Array.isArray(r[colorField]) ? r[colorField][0] : r[colorField];
                if (colorKey && !colorMap[colorKey]) {
                    colorMap[colorKey] = getColorForValue(colorKey);
                }
            }
        });

        this.state.events = records.map(r => {
            const dateVal = r[dateField];
            const dateEnd = vd.date_stop && r[vd.date_stop] ? new Date(r[vd.date_stop]) : null;
            const colorKey = colorField ? (Array.isArray(r[colorField]) ? r[colorField][0] : r[colorField]) : null;
            const displayFieldData = displayFields.map(df => {
                const fd = this.state.fields[df];
                let val = r[df];
                if (Array.isArray(val)) val = val[1];
                return { field: df, label: fd?.string || df, value: val ?? '' };
            });

            const dateObj = dateVal ? new Date(dateVal) : null;
            const isMultiDay = dateEnd && dateObj && fmtDate(dateObj) !== fmtDate(dateEnd);

            return {
                ...r,
                _date: dateObj,
                _dateEnd: dateEnd,
                _title: r[vd.event_display_fields?.[0] || 'name'] || 'Untitled',
                _color: colorMap[colorKey] || '#7c3aed',
                _displayFields: displayFieldData,
                _isMultiDay: isMultiDay,
                _tooltip: buildTooltip(r, displayFieldData, dateObj, dateEnd),
                _tooltipTime: buildTooltipTime(dateObj, dateEnd),
            };
        }).filter(e => e._date);

        this.state.colorMap = colorMap;
        this.state.loading = false;
        this.updateTimeIndicator();
    }

    getDateRange() {
        const d = this.state.currentDate;
        const mode = this.state.mode;
        let start, end;
        if (mode === 'month') {
            start = new Date(d.getFullYear(), d.getMonth(), 1);
            start.setDate(start.getDate() - start.getDay());
            end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            end.setDate(end.getDate() + (6 - end.getDay()));
        } else if (mode === 'week') {
            start = new Date(d);
            start.setDate(d.getDate() - d.getDay());
            end = new Date(start);
            end.setDate(start.getDate() + 6);
        } else {
            start = new Date(d);
            end = new Date(d);
        }
        return {
            start: start.toISOString().slice(0, 10),
            end: end.toISOString().slice(0, 10),
        };
    }

    // ══════════════════════════════════════════════════
    //  Navigation
    // ══════════════════════════════════════════════════

    get calendarTitle() {
        const d = this.state.currentDate;
        if (this.state.mode === 'month') return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        if (this.state.mode === 'week') {
            const range = this.getDateRange();
            return `${range.start} — ${range.end}`;
        }
        return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    get dayTitle() {
        return this.state.currentDate.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    goToday() {
        this.state.currentDate = new Date();
        this.loadEvents();
    }

    goPrev() {
        const d = new Date(this.state.currentDate);
        if (this.state.mode === 'month') d.setMonth(d.getMonth() - 1);
        else if (this.state.mode === 'week') d.setDate(d.getDate() - 7);
        else d.setDate(d.getDate() - 1);
        this.state.currentDate = d;
        this.loadEvents();
    }

    goNext() {
        const d = new Date(this.state.currentDate);
        if (this.state.mode === 'month') d.setMonth(d.getMonth() + 1);
        else if (this.state.mode === 'week') d.setDate(d.getDate() + 7);
        else d.setDate(d.getDate() + 1);
        this.state.currentDate = d;
        this.loadEvents();
    }

    setMode(mode) {
        this.state.mode = mode;
        this.loadEvents();
    }

    // ══════════════════════════════════════════════════
    //  Month view cells
    // ══════════════════════════════════════════════════

    get monthCells() {
        const d = this.state.currentDate;
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const cells = [];
        for (let i = 0; i < 42; i++) {
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + i);
            const dateStr = fmtDate(cellDate);

            cells.push({
                key: dateStr,
                date: dateStr,
                day: cellDate.getDate(),
                isToday: cellDate.getTime() === today.getTime(),
                isOtherMonth: cellDate.getMonth() !== d.getMonth(),
                events: this.state.events.filter(e => {
                    const eStart = fmtDate(e._date);
                    if (e._dateEnd) {
                        const eEnd = fmtDate(e._dateEnd);
                        return dateStr >= eStart && dateStr <= eEnd;
                    }
                    return eStart === dateStr;
                }),
            });
        }
        return cells;
    }

    // ══════════════════════════════════════════════════
    //  Week view cells (time grid)
    // ══════════════════════════════════════════════════

    get weekCells() {
        const d = this.state.currentDate;
        const start = new Date(d);
        start.setDate(d.getDate() - d.getDay());
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const cells = [];
        for (let i = 0; i < 7; i++) {
            const cellDate = new Date(start);
            cellDate.setDate(start.getDate() + i);
            const dateStr = fmtDate(cellDate);

            const dayEvents = this.state.events.filter(e => {
                const eStart = fmtDate(e._date);
                if (e._dateEnd) {
                    const eEnd = fmtDate(e._dateEnd);
                    return dateStr >= eStart && dateStr <= eEnd;
                }
                return eStart === dateStr;
            });

            cells.push({
                key: dateStr,
                date: dateStr,
                day: cellDate.getDate(),
                dayName: DAYS[cellDate.getDay()],
                isToday: cellDate.getTime() === today.getTime(),
                events: dayEvents,
                allDayEvents: dayEvents.filter(e => e._isMultiDay || this.state.viewDef.all_day),
                timedEvents: dayEvents.filter(e => !e._isMultiDay),
            });
        }
        return cells;
    }

    // ══════════════════════════════════════════════════
    //  Day view
    // ══════════════════════════════════════════════════

    get dayEvents() {
        const dateStr = fmtDate(this.state.currentDate);
        return this.state.events.filter(e => {
            const eStart = fmtDate(e._date);
            if (e._dateEnd) {
                const eEnd = fmtDate(e._dateEnd);
                return dateStr >= eStart && dateStr <= eEnd;
            }
            return eStart === dateStr;
        });
    }

    get dayAllDayEvents() {
        return this.dayEvents.filter(e => e._isMultiDay || this.state.viewDef.all_day);
    }

    getEventsForHour(cell, hour) {
        return cell.timedEvents.filter(ev => {
            if (!ev._date) return false;
            const evHour = ev._date.getHours();
            return evHour === hour;
        });
    }

    getDayEventsForHour(hour) {
        return this.dayEvents.filter(ev => {
            if (!ev._date) return false;
            return ev._date.getHours() === hour;
        });
    }

    isCurrentHour(h) {
        return this.state.mode === 'day' && new Date().getHours() === h;
    }

    fmtHour(h) {
        if (h === 0) return '12 AM';
        if (h < 12) return h + ' AM';
        if (h === 12) return '12 PM';
        return (h - 12) + ' PM';
    }

    getTimeEventStyle(ev, hour) {
        const startMin = ev._date ? ev._date.getMinutes() : 0;
        const top = startMin; // px from hour top (60px per hour)
        let height = 60; // default 1 hour
        if (ev._dateEnd && ev._date) {
            const diffMs = ev._dateEnd - ev._date;
            height = Math.max(30, (diffMs / 3600000) * 60);
        }
        return `top:${top}px;height:${height}px;background:${ev._color};color:#fff;border-left:3px solid ${ev._color};`;
    }

    // ══════════════════════════════════════════════════
    //  Time indicator
    // ══════════════════════════════════════════════════

    updateTimeIndicator() {
        if (this.state.mode !== 'week' && this.state.mode !== 'day') {
            this.state.showTimeIndicator = false;
            return;
        }
        const now = new Date();
        const top = (now.getHours() * 60 + now.getMinutes()); // 60px per hour
        this.state.showTimeIndicator = true;
        this.state.timeIndicatorTop = top;
    }

    // ══════════════════════════════════════════════════
    //  Color legend
    // ══════════════════════════════════════════════════

    getColorLabel(key) {
        const colorField = this.state.viewDef.color;
        if (!colorField) return String(key);
        const fDef = this.state.fields[colorField];
        if (fDef && fDef.type === 'selection') {
            const sel = fDef.selection.find(s => String(s[0]) === String(key));
            return sel ? sel[1] : String(key);
        }
        if (fDef && fDef.type === 'many2one' && Array.isArray(key)) {
            return key[1] || String(key[0]);
        }
        return String(key);
    }

    // ══════════════════════════════════════════════════
    //  Tooltip
    // ══════════════════════════════════════════════════

    showTooltip(ev, event) {
        if (this.state.tooltipTimeout) clearTimeout(this.state.tooltipTimeout);
        this.state.tooltipTimeout = setTimeout(() => {
            this.state.tooltip = {
                visible: true,
                x: Math.min(ev.clientX + 10, window.innerWidth - 250),
                y: Math.min(ev.clientY + 10, window.innerHeight - 150),
                event: event,
            };
        }, 300);
    }

    keepTooltip() {
        if (this.state.tooltipTimeout) clearTimeout(this.state.tooltipTimeout);
    }

    hideTooltip() {
        if (this.state.tooltipTimeout) clearTimeout(this.state.tooltipTimeout);
        this.state.tooltip = { visible: false, x: 0, y: 0, event: null };
    }

    // ══════════════════════════════════════════════════
    //  Drag and drop (reschedule)
    // ══════════════════════════════════════════════════

    onEventDragStart(ev, event) {
        this.state.dragEvent = event;
        ev.dataTransfer.effectAllowed = 'move';
        ev.dataTransfer.setData('text/plain', String(event.id));
        ev.target.classList.add('dragging');
    }

    async onDropToDate(targetDate, targetHour = null) {
        const ev = this.state.dragEvent;
        if (!ev) return;

        const vd = this.state.viewDef;
        const dateField = vd.date_start;
        const dateStopField = vd.date_stop;

        // Calculate new date
        const oldDate = new Date(ev._date);
        const newDate = new Date(targetDate + 'T00:00:00');
        if (targetHour !== null) newDate.setHours(targetHour, oldDate.getMinutes());

        // Preserve time component if dropping on same-day or all-day
        if (targetHour === null && !vd.all_day) {
            newDate.setHours(oldDate.getHours(), oldDate.getMinutes());
        }

        const values = {};
        values[dateField] = formatDateForDB(newDate, this.state.fields[dateField]);

        // If has date_stop, shift it by the same delta
        if (dateStopField && ev._dateEnd) {
            const delta = newDate - oldDate;
            const newEnd = new Date(ev._dateEnd.getTime() + delta);
            values[dateStopField] = formatDateForDB(newEnd, this.state.fields[dateStopField]);
        }

        try {
            await RPC.write(this._model, [ev.id], values);
            await this.loadEvents();
        } catch (e) {
            alert('Reschedule failed: ' + e.message);
        }

        this.state.dragEvent = null;
        document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    }

    // ══════════════════════════════════════════════════
    //  Create by selection (drag on empty cells)
    // ══════════════════════════════════════════════════

    onCellMouseDown(ev, dateStr) {
        if (ev.target.closest('.ls-calendar-event')) return;
        this.state.isSelecting = true;
        this.state.selectionStart = dateStr;
        this.state.selectionEnd = dateStr;
    }

    onCellMouseMove(ev, dateStr) {
        if (!this.state.isSelecting) return;
        this.state.selectionEnd = dateStr;
    }

    onCellMouseUp(dateStr) {
        if (!this.state.isSelecting) return;
        this.state.isSelecting = false;

        const start = this.state.selectionStart;
        const end = dateStr;
        const [s, e] = start < end ? [start, end] : [end, start];

        this.openQuickCreate(s, e);
        this.state.selectionStart = null;
        this.state.selectionEnd = null;
    }

    onTimeCellMouseDown(ev, dateStr, hour) {
        if (ev.target.closest('.ls-cal-timegrid-event')) return;
        this.state.isSelecting = true;
        this.state.selectionStart = { date: dateStr, hour };
        this.state.selectionEnd = { date: dateStr, hour };
    }

    onTimeCellMouseMove(ev, dateStr, hour) {
        if (!this.state.isSelecting) return;
        this.state.selectionEnd = { date: dateStr, hour };
    }

    onTimeCellMouseUp(dateStr, hour) {
        if (!this.state.isSelecting) return;
        this.state.isSelecting = false;

        const start = this.state.selectionStart;
        if (!start) return;

        const startDate = start.date;
        const startHour = start.hour;
        const endDate = dateStr;
        const endHour = hour + 1;

        this.openQuickCreate(
            startDate,
            endDate,
            `${startDate}T${String(startHour).padStart(2, '0')}:00`,
            `${endDate}T${String(endHour).padStart(2, '0')}:00`
        );

        this.state.selectionStart = null;
        this.state.selectionEnd = null;
    }

    // ══════════════════════════════════════════════════
    //  Quick Create
    // ══════════════════════════════════════════════════

    onAddEvent() {
        const today = fmtDate(new Date());
        this.openQuickCreate(today, today);
    }

    onCellClick(dateStr) {
        if (this.state.mode === 'month') {
            // In month view, switch to day view
            this.state.currentDate = new Date(dateStr + 'T00:00:00');
            this.state.mode = 'day';
            this.loadEvents();
        }
    }

    onTimeCellClick(dateStr, hour) {
        // Could open quick create with pre-filled time
    }

    openQuickCreate(startDate, endDate, startDateTime = null, endDateTime = null) {
        const vd = this.state.viewDef;
        const allDayField = vd.all_day ? 'all_day' : null;
        const defaultStart = startDateTime || `${startDate}T09:00`;
        const defaultEnd = endDateTime || `${endDate}T10:00`;

        this.state.quickCreate = {
            visible: true,
            title: '',
            start: defaultStart,
            end: defaultEnd,
            allDay: false,
            allDayField: allDayField,
        };
    }

    closeQuickCreate() {
        this.state.quickCreate.visible = false;
    }

    async submitQuickCreate() {
        const qc = this.state.quickCreate;
        const vd = this.state.viewDef;
        const title = qc.title.trim();
        if (!title) return;

        const values = {};
        const titleField = vd.create_name_field || vd.event_display_fields?.[0] || 'name';
        values[titleField] = title;

        if (vd.date_start) {
            values[vd.date_start] = qc.allDay ? qc.start.split('T')[0] : qc.start;
        }
        if (vd.date_stop) {
            values[vd.date_stop] = qc.allDay ? qc.end.split('T')[0] : qc.end;
        }
        if (vd.all_day) {
            values['all_day'] = qc.allDay;
        }

        // Apply required defaults
        for (const [fn, fd] of Object.entries(this.state.fields)) {
            if (fd.required && !values[fn] && fd.default !== undefined) {
                values[fn] = fd.default;
            }
        }

        try {
            await RPC.create(this._model, values);
            this.closeQuickCreate();
            await this.loadEvents();
        } catch (e) {
            alert('Create failed: ' + e.message);
        }
    }

    // ══════════════════════════════════════════════════
    //  Event interactions
    // ══════════════════════════════════════════════════

    onEventClick(ev) {
        this.hideTooltip();
        if (this.props.onOpenRecord) {
            this.props.onOpenRecord(ev.id, 1, this.state.events.length);
        }
    }
}

// ── Helpers ──────────────────────────────────────────

function buildTooltip(record, displayFields, dateStart, dateEnd) {
    const parts = displayFields.map(df => `${df.label}: ${df.value}`).join('\n');
    const time = buildTooltipTime(dateStart, dateEnd);
    return `${time}\n${parts}`;
}

function buildTooltipTime(dateStart, dateEnd) {
    if (!dateStart) return '';
    const opts = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    let s = dateStart.toLocaleDateString('en-US', opts);
    if (dateEnd) {
        s += ' — ' + dateEnd.toLocaleDateString('en-US', opts);
    }
    return s;
}

function formatDateForDB(date, fieldDef) {
    if (!date) return null;
    if (fieldDef && fieldDef.type === 'date') {
        return date.toISOString().slice(0, 10);
    }
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

window.CalendarView = CalendarView;
})();
