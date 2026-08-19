<?php

namespace App\Core\Http;

use Closure;
use Exception;

/**
 * Pure Adianti HTTP Router with support for:
 *  - get, post, put, delete, patch, any
 *  - Route groups, prefixes, and middleware
 *  - Named parameters: /api/security/groups/{id}/users
 *  - Controller dispatching: [Controller::class, 'method'] or 'Controller@method'
 */
class Router
{
    protected array $routes = [];
    protected array $groupStack = [];
    protected static ?Router $instance = null;

    public function __construct()
    {
        self::$instance = $this;
    }

    public static function getInstance(): self
    {
        if (!self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function get(string $uri, mixed $action): self
    {
        return $this->addRoute(['GET', 'HEAD'], $uri, $action);
    }

    public function post(string $uri, mixed $action): self
    {
        return $this->addRoute(['POST'], $uri, $action);
    }

    public function put(string $uri, mixed $action): self
    {
        return $this->addRoute(['PUT'], $uri, $action);
    }

    public function delete(string $uri, mixed $action): self
    {
        return $this->addRoute(['DELETE'], $uri, $action);
    }

    public function patch(string $uri, mixed $action): self
    {
        return $this->addRoute(['PATCH'], $uri, $action);
    }

    public function any(string $uri, mixed $action): self
    {
        return $this->addRoute(['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'], $uri, $action);
    }

    public function prefix(string $prefix): self
    {
        $this->groupStack[] = ['prefix' => trim($prefix, '/')];
        return $this;
    }

    public function group(Closure $callback): void
    {
        $callback($this);
        array_pop($this->groupStack);
    }

    protected function addRoute(array $methods, string $uri, mixed $action): self
    {
        $prefix = '';
        foreach ($this->groupStack as $group) {
            if (!empty($group['prefix'])) {
                $prefix .= '/' . $group['prefix'];
            }
        }

        $fullUri = rtrim($prefix . '/' . ltrim($uri, '/'), '/');
        if ($fullUri === '') {
            $fullUri = '/';
        }

        $regex = preg_replace('#\{([a-zA-Z0-9_]+)\}#', '(?P<$1>[^/]+)', $fullUri);
        $regex = '#^' . $regex . '$#';

        $route = [
            'methods' => $methods,
            'uri'     => $fullUri,
            'regex'   => $regex,
            'action'  => $action,
            'name'    => null,
        ];

        $this->routes[] = $route;
        return $this;
    }

    public function name(string $name): self
    {
        if (!empty($this->routes)) {
            $this->routes[count($this->routes) - 1]['name'] = $name;
        }
        return $this;
    }

    public function dispatch(Request $request): mixed
    {
        $method = $request->getMethod();
        $path = '/' . trim($request->getPathInfo(), '/');
        if ($path === '//') $path = '/';

        foreach ($this->routes as $route) {
            if (!in_array($method, $route['methods'], true)) {
                continue;
            }

            if (preg_match($route['regex'], $path, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                return $this->runAction($route['action'], $request, $params);
            }
        }

        throw new Exception("404 Not Found: Cannot route $method $path", 404);
    }

    protected function runAction(mixed $action, Request $request, array $params): mixed
    {
        if ($action instanceof Closure) {
            return $action($request, ...$params);
        }

        if (is_array($action)) {
            [$controllerClass, $methodName] = $action;
            $controller = app($controllerClass);
            return $controller->$methodName($request, ...$params);
        }

        if (is_string($action) && str_contains($action, '@')) {
            [$controllerClass, $methodName] = explode('@', $action);
            $controller = app($controllerClass);
            return $controller->$methodName($request, ...$params);
        }

        return $action;
    }

    public function getRoutes(): array
    {
        return $this->routes;
    }
}
