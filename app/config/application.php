<?php
return [
    'general' =>  [
        'timezone' => 'America/Sao_Paulo',
        'language' => 'en',
        'application' => 'tutor',
        'title' => 'Adianti Tutor 8.6',
        'theme' => 'metronic',
        'debug' => '1',
        'strict_request' => '1'
    ],
    /*
    |--------------------------------------------------------------------------
    | AdvSoft Environment & Asset Configuration
    |--------------------------------------------------------------------------
    | - 'environment': 'development' (Source JS asli) | 'production' (JS terkompilasi bundle)
    | - 'assets.mode': 'development' -> load script asli satu per satu
    |                  'production'  -> load bundle terkompilasi (js/app.bundle.js & css/app.bundle.css)
    */
    'advsoft' => [
        'environment' => 'development', // 'development' | 'production'
        'assets' => [
            'mode'        => 'development', // 'development' (source asli) | 'production' (terkompilasi)
            'bundle_js'   => 'js/app.bundle.js',
            'bundle_css'  => 'css/app.bundle.css',
            'auto_compile'=> true,
        ],
    ],
    'highlight' => [
        'comment' => '#808080',
        'default' => '#FFFFFF',
        'html' => '#C0C0C0',
        'keyword' => '#62d3ea',
        'string' => '#FFC472',
    ],
    'template' => [
        'navbar' => [
            'has_menu_mode_switch' => '1',
            'has_main_mode_switch' => '1'
        ],
        'dialogs' => [
            'use_swal' => '1'
        ],
        'theme' => [
            /*'menu_dark_color' => 'rgb(16 65 54)',*/
            'menu_mode' => 'dark',
            'main_mode' => 'light'
        ]
    ]
];
