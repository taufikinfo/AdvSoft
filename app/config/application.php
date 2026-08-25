<?php

return [
    /*
    |--------------------------------------------------------------------------
    | General Application Configuration (Adianti Core Standard)
    |--------------------------------------------------------------------------
    */
    'general' => [
        'timezone'        => 'Asia/Jakarta',
        'language'        => 'id', // 'id' (Indonesian), 'en' (English), 'ar' (Arabic), 'pt' (Portuguese), 'es' (Spanish)
        'application'     => 'advsoft',
        'title'           => 'AdvSoft — All-in-One Business Applications Platform',
        'theme'           => 'metronic',
        'debug'           => '1',
        'strict_request'  => '1',
    ],

    /*
    |--------------------------------------------------------------------------
    | AdvSoft Extended Architecture Configuration
    |--------------------------------------------------------------------------
    | Centralized configuration for the modern AdvSoft platform:
    | - Environment & Asset Compiler
    | - Internationalization (i18n) & Dynamic Database Translations
    | - Multi-Company & Database Connection Settings
    | - UI / OWL Views Engine & Component Parameters
    */
    'advsoft' => [
        // ── Application Information & Branding ───────────────────────
        'app' => [
            'name'        => 'AdvSoft',
            'version'     => '2.0.0',
            'description' => 'Modern Business Suite with Odoo-style Views, Spreadsheets & Dynamic Translations',
            'company'     => 'AdvSoft Technologies',
            'support_url' => 'https://advsoft.local',
        ],


        // ── Asset Pipeline & JS/CSS Bundler ──────────────────────────
        'assets' => [
            // 'development' -> loads original individual JS/CSS files (easier debugging)
            // 'production'  -> loads single pre-compiled bundles (app.bundle.js & app.bundle.css)
            'mode'         => 'development',
            'bundle_js'    => 'js/app.bundle.js',
            'bundle_css'   => 'css/app.bundle.css',
            'auto_compile' => true,  // Automatically compile bundle if missing
            'versioning'   => true,  // Append timestamp query string to prevent stale browser cache
        ],

        // ── International Translation (i18n & ir_translation) ────────
        'i18n' => [
            'default_locale'    => 'id',      // Default user interface locale
            'fallback_locale'   => 'en',      // Fallback locale if translation is missing
            'available_locales' => [
                'id' => 'Bahasa Indonesia',
                'en' => 'English (US)',
                'ar' => 'العربية (Arabic)',
                'es' => 'Español',
                'pt' => 'Português',
            ],
            'xml_i18n_path'     => 'i18n',    // Subdirectory for module XML translations: app/control/{module}/i18n/
            'auto_sync_xml'     => true,      // Automatically sync module XML files into ir_translations table
        ],

        // ── Multi-Company & Database ─────────────────────────────────
        'database' => [
            'default_connection' => 'advsoft',
            'multi_company'      => true,
            'multi_branch'       => true,
        ],

        // ── UI, OWL Components & Views Engine ────────────────────────
        'ui' => [
            'default_view'   => 'list',  // Default view type: 'list' | 'kanban' | 'form'
            'page_limit'     => 80,      // Default pagination record limit per page
            'theme_mode'     => 'light', // Theme mode: 'light' | 'dark'
            'dialog_system'  => 'owl',   // Dialog renderer: 'owl' | 'sweetalert'
            'animations'     => true,
        ],

        // ── Security & Request Handling ──────────────────────────────
        'security' => [
            'csrf_protection'   => true,
            'strict_request'    => true,
            'session_lifetime'  => 7200, // Session lifetime in seconds (2 hours)
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Code Highlighting Styles
    |--------------------------------------------------------------------------
    */
    'highlight' => [
        'comment' => '#808080',
        'default' => '#FFFFFF',
        'html'    => '#C0C0C0',
        'keyword' => '#62d3ea',
        'string'  => '#FFC472',
    ],

    /*
    |--------------------------------------------------------------------------
    | Template & Layout Configuration
    |--------------------------------------------------------------------------
    */
    'template' => [
        'navbar' => [
            'has_menu_mode_switch' => '1',
            'has_main_mode_switch' => '1',
        ],
        'dialogs' => [
            'use_swal' => '1',
        ],
        'theme' => [
            'menu_mode' => 'dark',
            'main_mode' => 'light',
        ],
    ],
];
