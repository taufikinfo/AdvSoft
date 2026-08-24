<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>AdvSoft — Business Applications</title>
    <meta name="description" content="AdvSoft is a metadata-driven business application platform with configurable views, ORM, and AdvSoft-style architecture.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <script>
        window.TEMPLATES = {};
        window.AdvSoftRPC = {};
        window.AdvsoftRPC = window.AdvSoftRPC;
        window.LarasoftRPC = window.AdvSoftRPC;
        window.__adianti_dialog = function(opts) {
            console.log('[Adianti Dialog]', opts);
            if (opts.callback) opts.callback();
        };
        window.__adianti_error = function(title, message, callback) {
            console.warn('[Adianti Error]', title, message);
            window.__adianti_dialog({type: 'error', title: title, message: message, callback: callback});
        };
        window.__adianti_message = function(title, message, callback) {
            console.log('[Adianti Info]', title, message);
            window.__adianti_dialog({type: 'info', title: title, message: message, callback: callback});
        };
        window.__adianti_goto_page = function(page, params) {
            if (window.Adianti && window.Adianti.loadPage) {
                window.Adianti.loadPage(page, '', params);
            } else {
                window.location.hash = '#class=' + page;
            }
        };
        window.__adianti_load_page = window.__adianti_goto_page;
        window.__adianti_ajax_exec = function(url, callback) {
            fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                .then(r => r.text())
                .then(html => { if (callback) callback(html); })
                .catch(e => console.error('[Adianti Ajax Exec Error]', e));
        };
    </script>
    <script src="{{ asset('js/core/owl.iife.js') }}"></script>
    <script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script>
    <script>window.XLSX = window.XLSX || null;</script>
    @if(app()->environment('local'))
        <!-- Development Mode: Direct Scripts (Uncompiled) -->
        @php
            $coreFiles = [
                'js/core/owl-dialog-system.js',
                'js/core/owl-rpc.js',
                'js/core/owl-icons.js',
                'js/core/owl-layout-service.js',
                'js/core/owl-templates.js',
                'js/core/owl-root-tpl.js',
            ];
            $widgetFiles = [
                'js/widgets/fields/owl-field-widgets.js',
                'js/widgets/fields/owl-field-m2o.js',
                'js/widgets/fields/owl-field-datetime.js',
                'js/widgets/fields/owl-field-domain.js',
                'js/widgets/fields/owl-rte.js',
                'js/widgets/fields/owl-m2o-dialog.js',
                'js/widgets/fields/owl-domain-dialog.js',
                'js/widgets/inline-tree/owl-inline-tree-attrs.js',
                'js/widgets/inline-tree/owl-inline-tree-state.js',
                'js/widgets/inline-tree/owl-inline-tree-columns.js',
                'js/widgets/inline-tree/owl-inline-tree-cell-editors.js',
                'js/widgets/inline-tree/owl-inline-tree-drag.js',
                'js/widgets/inline-tree/owl-inline-tree-onchange.js',
                'js/widgets/inline-tree/owl-inline-tree-bulk.js',
                'js/widgets/inline-tree/owl-inline-tree-picker.js',
                'js/widgets/inline-tree/owl-inline-tree-row.js',
                'js/widgets/inline-tree/owl-inline-tree.js',
            ];
            $viewFiles = [
                'js/views/list/owl-list.js',
                'js/views/form/owl-form-tpl.js',
                'js/views/form/owl-form.js',
                'js/views/form/owl-form-dialog.js',
                'js/views/kanban/owl-kanban.js',
                'js/views/calendar/owl-calendar.js',
                'js/views/graph/owl-graph.js',
                'js/views/pivot/owl-pivot.js',
                'js/views/spreadsheet/engine/cell-model.js',
                'js/views/spreadsheet/engine/range-parser.js',
                'js/views/spreadsheet/engine/formula-engine.js',
                'js/views/spreadsheet/engine/command-history.js',
                'js/views/spreadsheet/engine/spreadsheet-model.js',
                'js/views/spreadsheet/engine/plugin-system.js',
                'js/views/spreadsheet/engine/chart-plugin.js',
                'js/views/spreadsheet/engine/pivot-plugin.js',
                'js/views/spreadsheet/engine/list-plugin.js',
                'js/views/spreadsheet/engine/filter-plugin.js',
                'js/views/spreadsheet/engine/plugin-registry.js',
                'js/views/spreadsheet/engine/spreadsheet-document.js',
                'js/views/spreadsheet/engine/sheet-manager.js',
                'js/views/spreadsheet/engine/conditional-formatting.js',
                'js/views/spreadsheet/engine/data-validation.js',
                'js/views/spreadsheet/engine/find-replace.js',
                'js/views/spreadsheet/engine/keyboard-navigation.js',
                'js/views/spreadsheet/engine/context-menu-builder.js',
                'js/views/spreadsheet/engine/xlsx-export.js',
                'js/views/spreadsheet/engine/collaboration-bus.js',
                'js/views/spreadsheet/engine/spreadsheet-engine.js',
                'js/views/spreadsheet/owl-spreadsheet.js',
            ];
            
            // Auto-load Pages
            $pageDir = public_path('js/pages');
            $pageTpls = [];
            $pageScripts = [];
            if (is_dir($pageDir)) {
                $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($pageDir));
                foreach ($iterator as $file) {
                    if ($file->isFile() && $file->getExtension() === 'js') {
                        $path = 'js/pages/' . str_replace('\\', '/', $iterator->getSubPathname());
                        if (str_ends_with($path, '-tpl.js')) {
                            $pageTpls[] = $path;
                        } else {
                            $pageScripts[] = $path;
                        }
                    }
                }
            }
            sort($pageTpls);
            sort($pageScripts);

            $allScripts = array_merge($coreFiles, $widgetFiles, $viewFiles, $pageTpls, $pageScripts, ['js/core/owl-root.js']);
        @endphp
        @foreach($allScripts as $script)
            <script src="{{ asset($script) }}?v=adianti-1.0" defer></script>
        @endforeach
        <!-- Styles (Unbundled) -->
        <link rel="stylesheet" href="{{ asset('css/odoo-layout.css') }}?v=38">
        <link rel="stylesheet" href="{{ asset('css/odoo-dialog.css') }}?v=38">
        <link rel="stylesheet" href="{{ asset('css/odoo-list.css') }}?v=38">
        <link rel="stylesheet" href="{{ asset('css/odoo-form.css') }}?v=38">
        <link rel="stylesheet" href="{{ asset('css/odoo-menu.css') }}?v=38">
        <link rel="stylesheet" href="{{ asset('css/odoo-widgets.css') }}?v=38">
        <link rel="stylesheet" href="{{ asset('css/odoo-kanban.css') }}?v=38">
        <link rel="stylesheet" href="{{ asset('css/odoo-calendar.css') }}?v=38">
        <link rel="stylesheet" href="{{ asset('css/odoo-spreadsheet.css') }}?v=38">
        <link rel="stylesheet" href="{{ asset('css/odoo-views.css') }}?v=38">
        <link rel="stylesheet" href="{{ asset('css/odoo-inline-tree.css') }}?v=38">
        <link rel="stylesheet" href="{{ asset('css/odoo-security.css') }}?v=38">
        <link rel="stylesheet" href="{{ asset('css/odoo-menu-editor.css') }}?v=38">
        <link rel="stylesheet" href="{{ asset('css/odoo-view-builder.css') }}?v=38">
        <link rel="stylesheet" href="{{ asset('css/odoo-rte.css') }}?v=38">
        <link rel="stylesheet" href="{{ asset('css/odoo-report.css') }}?v=38">
        <link rel="stylesheet" href="{{ asset('css/odoo-dark.css') }}?v=38">
        <link rel="stylesheet" href="{{ asset('css/odoo-custom-page.css') }}?v=38">
    @else
        <!-- Production Mode: Pre-Compiled Single Bundles -->
        @php
            if (!file_exists(public_path('js/app.bundle.js')) || !file_exists(public_path('css/app.bundle.css'))) {
                \App\Advsoft\Core\Support\AssetCompiler::compileAll();
            }
            $assetVer = file_exists(public_path('js/app.bundle.js')) ? filemtime(public_path('js/app.bundle.js')) : '1.0';
        @endphp
        <link rel="stylesheet" href="{{ asset('css/app.bundle.css') }}?v={{ $assetVer }}">
        <script src="{{ asset('js/app.bundle.js') }}?v={{ $assetVer }}" defer></script>
    @endif
</head>
<body>
    <div id="app"></div>
    <script>
    window.__CSRF_TOKEN__ = '{{ csrf_token() }}';
    @php
        $ctx = app(\App\Advsoft\Security\SecurityContext::class);
        $userArr = $ctx->toArray();
    @endphp
    window.AdvSoftUser = @json($userArr);
    window.AdvsoftUser = window.AdvSoftUser;
    window.LarasoftUser = window.AdvSoftUser;
    // ── Dark Mode Toggle ──────────────────────────
    (function() {
        const saved = localStorage.getItem('ls-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved || (prefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
        window.AdvSoftTheme = {
            get: () => document.documentElement.getAttribute('data-theme'),
            set: (t) => {
                document.documentElement.setAttribute('data-theme', t);
                localStorage.setItem('ls-theme', t);
            },
            toggle: () => {
                const cur = window.AdvSoftTheme.get();
                window.AdvSoftTheme.set(cur === 'dark' ? 'light' : 'dark');
            }
        };
        window.AdvsoftTheme = window.AdvSoftTheme;
        window.LarasoftTheme = window.AdvSoftTheme;
    })();
    </script>
    <!-- App is mounted automatically by bundled scripts -->
</body>
</html>
