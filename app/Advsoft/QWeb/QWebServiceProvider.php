<?php

namespace App\Advsoft\QWeb;

use Illuminate\Support\ServiceProvider;

/**
 * QWebServiceProvider
 *
 * @version    2.0.0
 * @package    Advsoft
 * @author     Taufik
 * @author     AdvSoft Team
 * @copyright  Copyright (c) 2026 AdvSoft Technologies
 * @license    https://opensource.org/licenses/MIT MIT License
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
