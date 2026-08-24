// ══════════════════════════════════════════════════════════════════
//  AdvSoft Layout Service — Odoo Enterprise Presentation Layer
//  Manages: Theme, Layout Mode, Device Detection, Density, Brand
// ══════════════════════════════════════════════════════════════════
(function () {
    const STORAGE_KEY = 'AdvSoft_layout';

    const BRAND_COLORS = [
        { id: 'purple', label: 'Purple', color: '#714B67' },
        { id: 'blue',   label: 'Blue',   color: '#3B82F6' },
        { id: 'indigo', label: 'Indigo', color: '#6366F1' },
        { id: 'green',  label: 'Green',  color: '#059669' },
        { id: 'teal',   label: 'Teal',   color: '#0D9488' },
        { id: 'red',    label: 'Red',    color: '#DC2626' },
        { id: 'amber',  label: 'Amber',  color: '#D97706' },
        { id: 'slate',  label: 'Slate',  color: '#475569' },
    ];

    // ── Defaults ─────────────────────────────────────
    const DEFAULTS = {
        theme: 'light',          // light | dark | auto
        brandColor: 'purple',    // id from BRAND_COLORS
        density: 'default',      // compact | default | comfortable
        settingsOpen: false,
        mobileMenuOpen: false,
    };

    // ── Load persisted preferences ───────────────────
    function loadPrefs() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
        } catch (e) {
            return { ...DEFAULTS };
        }
    }

    function savePrefs(prefs) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                theme: prefs.theme,
                brandColor: prefs.brandColor,
                density: prefs.density,
            }));
        } catch (e) { /* quota exceeded – ignore */ }
    }

    // ── Device detection ─────────────────────────────
    function detectDevice() {
        const w = window.innerWidth;
        if (w <= 768) return 'mobile';
        if (w <= 1024) return 'tablet';
        return 'desktop';
    }

    // ── Apply theme to DOM ───────────────────────────
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    function applyBrandColor(brandId) {
        const brand = BRAND_COLORS.find(b => b.id === brandId) || BRAND_COLORS[0];
        const r = document.documentElement;
        r.style.setProperty('--ls-primary', brand.color);
        r.style.setProperty('--ls-navbar-bg', brand.color);
        // Generate lighter/darker variants
        r.style.setProperty('--ls-primary-light', adjustBrightness(brand.color, 20));
        r.style.setProperty('--ls-primary-dark', adjustBrightness(brand.color, -15));
    }

    function applyDensity(density) {
        document.documentElement.setAttribute('data-density', density);
    }

    // ── Color utility ────────────────────────────────
    function adjustBrightness(hex, percent) {
        hex = hex.replace('#', '');
        let r = parseInt(hex.substr(0, 2), 16);
        let g = parseInt(hex.substr(2, 2), 16);
        let b = parseInt(hex.substr(4, 2), 16);
        r = Math.min(255, Math.max(0, r + Math.round(r * percent / 100)));
        g = Math.min(255, Math.max(0, g + Math.round(g * percent / 100)));
        b = Math.min(255, Math.max(0, b + Math.round(b * percent / 100)));
        return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    }

    // ── LayoutService Singleton ──────────────────────
    class LayoutService {
        constructor() {
            this.prefs = loadPrefs();
            this.device = detectDevice();
            this._listeners = [];

            // Apply on load
            applyTheme(this.prefs.theme);
            applyBrandColor(this.prefs.brandColor);
            applyDensity(this.prefs.density);

            // Respond to window resize
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    const newDevice = detectDevice();
                    if (newDevice !== this.device) {
                        this.device = newDevice;
                        this._notify();
                    }
                }, 150);
            });

            // Respond to system theme change
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                    if (this.prefs.theme === 'auto') {
                        this._notify();
                    }
                });
            }
        }

        // ── Getters ──────────────────────────────────
        get theme() { return this.prefs.theme; }
        get brandColor() { return this.prefs.brandColor; }
        get density() { return this.prefs.density; }
        get isMobile() { return this.device === 'mobile'; }
        get isTablet() { return this.device === 'tablet'; }
        get isDesktop() { return this.device === 'desktop'; }
        get settingsOpen() { return this.prefs.settingsOpen; }
        get mobileMenuOpen() { return this.prefs.mobileMenuOpen; }
        get brandColors() { return BRAND_COLORS; }

        get effectiveTheme() {
            if (this.prefs.theme !== 'auto') return this.prefs.theme;
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark' : 'light';
        }

        // ── Setters ──────────────────────────────────
        setTheme(theme) {
            this.prefs.theme = theme;
            applyTheme(theme);
            savePrefs(this.prefs);
            this._notify();
        }

        setBrandColor(brandId) {
            this.prefs.brandColor = brandId;
            applyBrandColor(brandId);
            savePrefs(this.prefs);
            this._notify();
        }

        setDensity(density) {
            this.prefs.density = density;
            applyDensity(density);
            savePrefs(this.prefs);
            this._notify();
        }

        toggleSettings() {
            this.prefs.settingsOpen = !this.prefs.settingsOpen;
            if (this.prefs.settingsOpen) this.prefs.mobileMenuOpen = false;
            this._notify();
        }

        closeSettings() {
            this.prefs.settingsOpen = false;
            this._notify();
        }

        toggleMobileMenu() {
            this.prefs.mobileMenuOpen = !this.prefs.mobileMenuOpen;
            if (this.prefs.mobileMenuOpen) this.prefs.settingsOpen = false;
            this._notify();
        }

        closeMobileMenu() {
            this.prefs.mobileMenuOpen = false;
            this._notify();
        }

        // ── Observer pattern ─────────────────────────
        onChange(fn) {
            this._listeners.push(fn);
            return () => {
                this._listeners = this._listeners.filter(f => f !== fn);
            };
        }

        _notify() {
            for (const fn of this._listeners) {
                try { fn(this); } catch (e) { console.error('[LayoutService]', e); }
            }
        }

        // ── Get state snapshot for Owl ────────────────
        toState() {
            return {
                theme: this.prefs.theme,
                effectiveTheme: this.effectiveTheme,
                brandColor: this.prefs.brandColor,
                density: this.prefs.density,
                device: this.device,
                isMobile: this.isMobile,
                isTablet: this.isTablet,
                isDesktop: this.isDesktop,
                settingsOpen: this.prefs.settingsOpen,
                mobileMenuOpen: this.prefs.mobileMenuOpen,
                brandColors: BRAND_COLORS,
            };
        }
    }

    // Create singleton and expose globally
    window.AdvSoftLayout = new LayoutService();
    window.AdvsoftLayout = window.AdvSoftLayout;
    window.LarasoftLayout = window.AdvSoftLayout;

})();
