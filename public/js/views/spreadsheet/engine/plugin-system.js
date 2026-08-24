/**
 * Plugin System - CorePlugin + UIPlugin base classes
 * Follows Odoo advsoft-spreadsheet plugin architecture
 */
(function() {
    'use strict';

    const PluginState = Object.freeze({
        IDLE: 'idle',
        RUNNING: 'running',
        STOPPED: 'stopped',
    });

    class CorePlugin {
        constructor(config) {
            this._model = config.model;
            this._uid = config.uid || 'plugin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            this._state = PluginState.IDLE;
            this._config = config;
            this._history = [];
        }

        get uid() { return this._uid; }
        get state() { return this._state; }
        get model() { return this._model; }

        setup() {
            this._state = PluginState.RUNNING;
            this._onSetup();
        }

        destroy() {
            this._state = PluginState.STOPPED;
            this._onDestroy();
        }

        _onSetup() {}
        _onDestroy() {}

        handle(cmd) {
            if (this._state !== PluginState.RUNNING) return;
            this._onCommand(cmd);
        }

        _onCommand(cmd) {}

        dispatch(type, payload) {
            if (this._model) {
                this._model._emit('pluginDispatch', { type, payload, plugin: this._uid });
            }
        }

        getSheetData(sheetId) {
            return this._model?.toJSON() || {};
        }

        exportJSON() {
            return {};
        }

        importJSON(data) {}

        toJSON() {
            return {
                uid: this._uid,
                state: this._state,
                data: this.exportJSON(),
            };
        }
    }

    class UIPlugin extends CorePlugin {
        constructor(config) {
            super(config);
            this._renderers = new Map();
            this._eventHandlers = new Map();
            this._overlays = [];
        }

        get overlays() { return [...this._overlays]; }

        _onSetup() {
            this._registerEventHandlers();
        }

        _onDestroy() {
            this._unregisterEventHandlers();
            this._renderers.clear();
            this._eventHandlers.clear();
            this._overlays = [];
        }

        _registerEventHandlers() {}

        _unregisterEventHandlers() {}

        registerRenderer(id, renderer) {
            this._renderers.set(id, renderer);
        }

        removeRenderer(id) {
            this._renderers.delete(id);
        }

        render(ctx, rect) {
            for (const [, renderer] of this._renderers) {
                renderer(ctx, rect);
            }
        }

        addOverlay(overlay) {
            this._overlays.push(overlay);
        }

        removeOverlay(id) {
            this._overlays = this._overlays.filter(o => o.id !== id);
        }

        onCellHover(col, row, event) {}
        onCellClick(col, row, event) {}
        onCellDoubleClick(col, row, event) {}
        onContextMenu(col, row, event) {}
        onKeyDown(event) {}
    }

    class PluginRegistry {
        constructor() {
            this._plugins = new Map();
            this._instances = new Map();
        }

        register(name, PluginClass, options = {}) {
            if (this._plugins.has(name)) {
                console.warn(`Plugin '${name}' already registered, overriding.`);
            }
            this._plugins.set(name, {
                PluginClass,
                options,
                type: PluginClass.prototype instanceof UIPlugin ? 'ui' : 'core',
            });
        }

        unregister(name) {
            this._instances.delete(name);
            this._plugins.delete(name);
        }

        has(name) {
            return this._plugins.has(name);
        }

        get(name) {
            return this._plugins.get(name);
        }

        getAll() {
            return [...this._plugins.entries()];
        }

        getCorePlugins() {
            return [...this._plugins.entries()].filter(([, p]) => p.type === 'core');
        }

        getUIPlugins() {
            return [...this._plugins.entries()].filter(([, p]) => p.type === 'ui');
        }

        createAll(model, config = {}) {
            for (const [name, pluginDef] of this._plugins) {
                this.create(name, model, config);
            }
        }

        create(name, model, config = {}) {
            const pluginDef = this._plugins.get(name);
            if (!pluginDef) {
                console.error(`Plugin '${name}' not found.`);
                return null;
            }

            if (this._instances.has(name)) {
                return this._instances.get(name);
            }

            const instance = new pluginDef.PluginClass({
                model,
                uid: name,
                ...pluginDef.options,
                ...config,
            });

            this._instances.set(name, instance);
            return instance;
        }

        setupAll() {
            for (const [name, instance] of this._instances) {
                try {
                    instance.setup();
                } catch (e) {
                    console.error(`Plugin '${name}' setup error:`, e);
                }
            }
        }

        destroyAll() {
            for (const [name, instance] of this._instances) {
                try {
                    instance.destroy();
                } catch (e) {
                    console.error(`Plugin '${name}' destroy error:`, e);
                }
            }
            this._instances.clear();
        }

        destroy(name) {
            const instance = this._instances.get(name);
            if (instance) {
                instance.destroy();
                this._instances.delete(name);
            }
        }

        dispatchToAll(type, payload) {
            for (const [, instance] of this._instances) {
                try {
                    instance.handle({ type, payload });
                } catch (e) {
                    console.error(`Plugin dispatch error:`, e);
                }
            }
        }

        get(name) {
            return this._instances.get(name) || null;
        }

        getAllInstances() {
            return [...this._instances.values()];
        }

        getCoreInstances() {
            return [...this._instances.entries()]
                .filter(([name]) => this._plugins.get(name)?.type === 'core')
                .map(([, instance]) => instance);
        }

        getUIInstances() {
            return [...this._instances.entries()]
                .filter(([name]) => this._plugins.get(name)?.type === 'ui')
                .map(([, instance]) => instance);
        }

        toJSON() {
            const data = {};
            for (const [name, instance] of this._instances) {
                data[name] = instance.toJSON();
            }
            return data;
        }

        fromJSON(data) {
            for (const [name, instance] of this._instances) {
                if (data[name]) {
                    instance.importJSON(data[name]);
                }
            }
        }
    }

    window.SpreadsheetPluginState = PluginState;
    window.SpreadsheetCorePlugin = CorePlugin;
    window.SpreadsheetUIPlugin = UIPlugin;
    window.SpreadsheetPluginRegistry = PluginRegistry;
})();
