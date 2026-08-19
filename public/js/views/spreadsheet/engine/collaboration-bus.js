/**
 * Collaboration Bus - WebSocket/long-polling for multi-user
 * Follows Odoo im_bus / OT mutation pattern
 */
(function() {
    'use strict';

    const ConnectionState = Object.freeze({
        DISCONNECTED: 'disconnected',
        CONNECTING: 'connecting',
        CONNECTED: 'connected',
        RECONNECTING: 'reconnecting',
    });

    const OperationType = Object.freeze({
        CELL_UPDATE: 'cellUpdate',
        CELL_DELETE: 'cellDelete',
        FORMAT_UPDATE: 'formatUpdate',
        SELECTION_UPDATE: 'selectionUpdate',
        CURSOR_MOVE: 'cursorMove',
        CHART_UPDATE: 'chartUpdate',
        SHEET_ADD: 'sheetAdd',
        SHEET_DELETE: 'sheetDelete',
        MERGE: 'merge',
        FILTER_UPDATE: 'filterUpdate',
    });

    class CollaborationBus {
        constructor(config = {}) {
            this._url = config.url || '';
            this._userId = config.userId || null;
            this._userName = config.userName || 'Anonymous';
            this._userColor = config.userColor || '#6366f1';
            this._spreadsheetId = config.spreadsheetId || null;
            this._connection = null;
            this._state = ConnectionState.DISCONNECTED;
            this._reconnectAttempts = 0;
            this._maxReconnectAttempts = config.maxReconnectAttempts || 10;
            this._reconnectDelay = config.reconnectDelay || 1000;
            this._listeners = new Map();
            this._pendingOps = [];
            this._remoteCursors = new Map();
            this._operationBuffer = [];
            this._bufferTimeout = null;
            this._bufferDelay = config.bufferDelay || 300; // [Ponytail] lazy debounce network spam
            this._useWebSocket = config.useWebSocket !== false;
            this._longPollUrl = config.longPollUrl || config.url;
            this._longPollTimer = null;
            this._longPollInterval = config.longPollInterval || 30000;
        }

        get state() { return this._state; }
        get isConnected() { return this._state === ConnectionState.CONNECTED; }
        get remoteCursors() { return new Map(this._remoteCursors); }

        connect() {
            if (this._state === ConnectionState.CONNECTED || this._state === ConnectionState.CONNECTING) {
                return;
            }

            this._state = ConnectionState.CONNECTING;
            this._emit('stateChanged', { state: this._state });

            if (this._useWebSocket && this._url) {
                this._connectWebSocket();
            } else if (this._longPollUrl) {
                this._startLongPoll();
            }
        }

        disconnect() {
            this._state = ConnectionState.DISCONNECTED;
            if (this._connection) {
                this._connection.close();
                this._connection = null;
            }
            this._stopLongPoll();
            this._clearBuffer();
            this._emit('stateChanged', { state: this._state });
        }

        _connectWebSocket() {
            try {
                this._connection = new WebSocket(this._url);

                this._connection.onopen = () => {
                    this._state = ConnectionState.CONNECTED;
                    this._reconnectAttempts = 0;
                    this._emit('stateChanged', { state: this._state });
                    this._sendPresence();
                    this._flushPendingOps();
                };

                this._connection.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);
                        this._handleMessage(msg);
                    } catch (e) {
                        console.error('WS message parse error:', e);
                    }
                };

                this._connection.onclose = () => {
                    this._state = ConnectionState.DISCONNECTED;
                    this._emit('stateChanged', { state: this._state });
                    this._scheduleReconnect();
                };

                this._connection.onerror = (error) => {
                    console.error('WS error:', error);
                };
            } catch (e) {
                console.error('WS connect error:', e);
                this._scheduleReconnect();
            }
        }

        _startLongPoll() {
            this._longPollTimer = setInterval(() => {
                this._longPoll();
            }, this._longPollInterval);
            this._longPoll();
            this._state = ConnectionState.CONNECTED;
            this._emit('stateChanged', { state: this._state });
        }

        _stopLongPoll() {
            if (this._longPollTimer) {
                clearInterval(this._longPollTimer);
                this._longPollTimer = null;
            }
        }

        async _longPoll() {
            try {
                const rpc = window.LaravelRPC || window.rpc;
                const result = await rpc.call('spreadsheet.collaboration', 'longpoll', {
                    spreadsheet_id: this._spreadsheetId,
                    last_sequence: this._lastSequence || 0,
                });

                if (result && result.messages) {
                    for (const msg of result.messages) {
                        this._handleMessage(msg);
                    }
                    this._lastSequence = result.last_sequence || this._lastSequence;
                }
            } catch (e) {
                console.error('Long poll error:', e);
            }
        }

        _handleMessage(msg) {
            if (msg.sender === this._userId) return;

            switch (msg.type) {
                case 'operation':
                    this._handleRemoteOperation(msg.operation);
                    break;
                case 'cursor':
                    this._handleRemoteCursor(msg);
                    break;
                case 'presence':
                    this._handlePresence(msg);
                    break;
                case 'selection':
                    this._handleRemoteSelection(msg);
                    break;
            }
        }

        _handleRemoteOperation(operation) {
            this._emit('remoteOperation', operation);
        }

        _handleRemoteCursor(msg) {
            if (msg.userId === this._userId) return;

            this._remoteCursors.set(msg.userId, {
                userId: msg.userId,
                userName: msg.userName,
                userColor: msg.userColor,
                col: msg.col,
                row: msg.row,
                timestamp: Date.now(),
            });

            this._emit('remoteCursorMoved', {
                userId: msg.userId,
                userName: msg.userName,
                userColor: msg.userColor,
                col: msg.col,
                row: msg.row,
            });
        }

        _handleRemoteSelection(msg) {
            if (msg.userId === this._userId) return;

            this._remoteCursors.set(msg.userId, {
                ...this._remoteCursors.get(msg.userId),
                selection: msg.selection,
                timestamp: Date.now(),
            });

            this._emit('remoteSelectionChanged', {
                userId: msg.userId,
                selection: msg.selection,
            });
        }

        _handlePresence(msg) {
            this._emit('userPresence', {
                userId: msg.userId,
                userName: msg.userName,
                userColor: msg.userColor,
                online: msg.online,
            });
        }

        sendOperation(operation) {
            const op = {
                ...operation,
                sender: this._userId,
                timestamp: Date.now(),
            };

            this._operationBuffer.push(op);
            this._scheduleFlush();
        }

        _scheduleFlush() {
            if (this._bufferTimeout) return;
            this._bufferTimeout = setTimeout(() => {
                this._flushBuffer();
            }, this._bufferDelay);
        }

        _flushBuffer() {
            if (this._operationBuffer.length === 0) return;

            const ops = [...this._operationBuffer];
            this._operationBuffer = [];
            this._bufferTimeout = null;

            const batch = {
                type: 'batch',
                operations: ops,
                sender: this._userId,
                timestamp: Date.now(),
            };

            this._send(batch);
        }

        _clearBuffer() {
            this._operationBuffer = [];
            if (this._bufferTimeout) {
                clearTimeout(this._bufferTimeout);
                this._bufferTimeout = null;
            }
        }

        sendCursorPosition(col, row) {
            this._send({
                type: 'cursor',
                userId: this._userId,
                userName: this._userName,
                userColor: this._userColor,
                col,
                row,
                timestamp: Date.now(),
            });
        }

        sendSelection(selection) {
            this._send({
                type: 'selection',
                userId: this._userId,
                selection: selection ? selection.toString() : null,
                timestamp: Date.now(),
            });
        }

        _sendPresence() {
            this._send({
                type: 'presence',
                userId: this._userId,
                userName: this._userName,
                userColor: this._userColor,
                online: true,
                timestamp: Date.now(),
            });
        }

        _send(data) {
            const msg = JSON.stringify(data);

            if (this._connection && this._connection.readyState === WebSocket.OPEN) {
                this._connection.send(msg);
            } else if (this._longPollUrl) {
                this._sendViaRPC(data);
            } else {
                this._pendingOps.push(data);
            }
        }

        async _sendViaRPC(data) {
            try {
                const rpc = window.LaravelRPC || window.rpc;
                await rpc.call('spreadsheet.collaboration', 'publish', {
                    spreadsheet_id: this._spreadsheetId,
                    message: data,
                });
            } catch (e) {
                console.error('RPC publish error:', e);
                this._pendingOps.push(data);
            }
        }

        _flushPendingOps() {
            while (this._pendingOps.length > 0) {
                const op = this._pendingOps.shift();
                this._send(op);
            }
        }

        _scheduleReconnect() {
            if (this._reconnectAttempts >= this._maxReconnectAttempts) {
                this._emit('reconnectFailed', {});
                return;
            }

            this._state = ConnectionState.RECONNECTING;
            this._emit('stateChanged', { state: this._state });

            const delay = this._reconnectDelay * Math.pow(2, this._reconnectAttempts);
            this._reconnectAttempts++;

            setTimeout(() => {
                this.connect();
            }, delay);
        }

        removeStaleCursors(maxAge = 30000) {
            const now = Date.now();
            for (const [userId, cursor] of this._remoteCursors) {
                if (now - cursor.timestamp > maxAge) {
                    this._remoteCursors.delete(userId);
                    this._emit('remoteCursorRemoved', { userId });
                }
            }
        }

        on(event, callback) {
            if (!this._listeners.has(event)) {
                this._listeners.set(event, new Set());
            }
            this._listeners.get(event).add(callback);
            return () => this._listeners.get(event)?.delete(callback);
        }

        _emit(event, data) {
            const listeners = this._listeners.get(event);
            if (listeners) {
                for (const cb of listeners) {
                    try { cb(data); } catch (e) { console.error(`Collab event ${event} error:`, e); }
                }
            }
        }
    }

    class OperationalTransform {
        constructor() {
            this._history = [];
        }

        transform(op1, op2) {
            if (op1.type !== op2.type) return op2;

            if (op1.type === OperationType.CELL_UPDATE && op2.type === OperationType.CELL_UPDATE) {
                if (op1.col === op2.col && op1.row === op2.row) {
                    return {
                        ...op2,
                        value: op1.timestamp > op2.timestamp ? op2.value : op1.value,
                    };
                }
            }

            return op2;
        }

        addToHistory(operation) {
            this._history.push(operation);
            if (this._history.length > 1000) {
                this._history.shift();
            }
        }

        getHistory() {
            return [...this._history];
        }
    }

    window.SpreadsheetConnectionState = ConnectionState;
    window.SpreadsheetOperationType = OperationType;
    window.SpreadsheetCollaborationBus = CollaborationBus;
    window.SpreadsheetOperationalTransform = OperationalTransform;
})();
