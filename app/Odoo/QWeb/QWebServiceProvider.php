<?php

namespace App\Odoo\QWeb;

use Illuminate\Support\ServiceProvider;

/**
 * QWebServiceProvider – Registers the QWeb engine in the Laravel container.
 */
class QWebServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(QWeb::class, function ($app) {
            return new QWeb();
        });

        $this->app->singleton(QWebLoader::class, function ($app) {
            return new QWebLoader();
        });
    }

    public function boot(): void
    {
        // Publish QWeb config if needed
    }
}
