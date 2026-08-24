<?php

namespace App\Odoo\Core\Support;

use App\Odoo\Core\Http\Router;

/**
 * Route static facade for pure Adianti router.
 */
class Route
{
    public static function get(string $uri, mixed $action): Router
    {
        return Router::getInstance()->get($uri, $action);
    }

    public static function post(string $uri, mixed $action): Router
    {
        return Router::getInstance()->post($uri, $action);
    }

    public static function put(string $uri, mixed $action): Router
    {
        return Router::getInstance()->put($uri, $action);
    }

    public static function delete(string $uri, mixed $action): Router
    {
        return Router::getInstance()->delete($uri, $action);
    }

    public static function patch(string $uri, mixed $action): Router
    {
        return Router::getInstance()->patch($uri, $action);
    }

    public static function any(string $uri, mixed $action): Router
    {
        return Router::getInstance()->any($uri, $action);
    }

    public static function prefix(string $prefix): Router
    {
        return Router::getInstance()->prefix($prefix);
    }

    public static function group(mixed $attributes, ?\Closure $callback = null): void
    {
        if ($attributes instanceof \Closure) {
            $callback = $attributes;
            Router::getInstance()->group($callback);
            return;
        }

        if (is_array($attributes) && isset($attributes['prefix'])) {
            Router::getInstance()->prefix($attributes['prefix'])->group($callback);
            return;
        }

        if ($callback) {
            Router::getInstance()->group($callback);
        }
    }
}
