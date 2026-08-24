// ══════════════════════════════════════════════════════════════
//  AdiantiPageView — Owl Component
//  Renders any standard Adianti Controller inside Adiantisoft SPA
// ══════════════════════════════════════════════════════════════
(function () {
    const { Component, useState, useRef, onMounted } = owl;

    class AdiantiPageView extends Component {
        static template = window.TEMPLATES.AdiantiPageView;

        setup() {
            this.contentSlot = useRef('contentSlot');
            this.state = useState({
                loading: true,
                error: null,
                className: '',
                method: '',
                htmlContent: '',
            });

            onMounted(() => {
                this.loadAdiantiController();
            });
        }

        async loadAdiantiController() {
            this.state.loading = true;
            this.state.error = null;

            const raw = window.location.hash.slice(1) || window.location.search.slice(1);
            const params = new URLSearchParams(raw);
            let className = params.get('class') || window.AdvSoftRootInstance?.state?.adiantiControllerClass || 'SampleController';
            if (className === 'adianti_page' || !className) {
                className = window.AdvSoftRootInstance?.state?.adiantiControllerClass || 'SampleController';
            }
            const method = params.get('method') || window.AdvSoftRootInstance?.state?.adiantiControllerMethod || '';

            this.state.className = className;
            this.state.method = method;

            params.set('class', className);
            if (method) params.set('method', method);

            try {
                const url = '/engine.php?' + params.toString();
                const res = await fetch(url, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'text/html, application/json, */*'
                    }
                });

                if (!res.ok) {
                    throw new Error(`HTTP Error ${res.status}: Gagal mengeksekusi controller`);
                }

                const html = await res.text();
                this.state.htmlContent = html;
                this.state.loading = false;

                // Inject into DOM
                setTimeout(() => {
                    if (this.contentSlot.el) {
                        this.contentSlot.el.innerHTML = html;
                        // Execute any scripts embedded in the Adianti output
                        const scripts = this.contentSlot.el.querySelectorAll('script');
                        scripts.forEach(s => {
                            try {
                                const fn = new Function(s.textContent);
                                fn.call(window);
                            } catch (err) {
                                console.warn('[Adianti Script Eval Note]:', err);
                            }
                        });
                    }
                }, 50);
            } catch (e) {
                console.error('[AdiantiPageView] Error:', e);
                this.state.error = e.message || 'Gagal memuat halaman Adianti.';
                this.state.loading = false;
            }
        }

        reloadPage() {
            this.loadAdiantiController();
        }
    }

    window.AdvSoftPageRegistry = window.AdvSoftPageRegistry || {};
    window.AdvSoftPageRegistry['adianti_page'] = AdiantiPageView;
    window.AdvSoftPageRegistry['sample_controller'] = AdiantiPageView;
    window.AdiantiPageView = AdiantiPageView;
})();
