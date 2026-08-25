<?php

namespace App\Advsoft\Core;

use Psr\Container\ContainerInterface;
use Closure;
use ReflectionClass;
use ReflectionMethod;
use ReflectionParameter;
use Exception;

/**
 * Application
 *
 * @version    2.0.0
 * @package    Advsoft
 * @author     Taufik
 * @author     AdvSoft Team
 * @copyright  Copyright (c) 2026 AdvSoft Technologies
 * @license    https://opensource.org/licenses/MIT MIT License
 */
class Application implements ContainerInterface
{
    protected string $basePath;
    protected array $instances = [];
    protected array $bindings = [];
    protected array $singletons = [];
    protected static ?Application $instance = null;

    public function __construct(?string $basePath = null)
    {
        if ($basePath) {
            $this->setBasePath($basePath);
        }
        self::$instance = $this;
        $this->instance(self::class, $this);
        $this->instance(ContainerInterface::class, $this);
    }

    public static function getInstance(): static
    {
        if (is_null(self::$instance)) {
            self::$instance = new static;
        }
        return self::$instance;
    }

    public static function setInstance(?Application $container = null): ?Application
    {
        return self::$instance = $container;
    }

    public function setBasePath(string $basePath): self
    {
        $this->basePath = rtrim($basePath, '\/');
        return $this;
    }

    public function basePath(string $path = ''): string
    {
        return $this->basePath . ($path ? DIRECTORY_SEPARATOR . ltrim($path, '\/') : '');
    }

    public function path(string $path = ''): string
    {
        return $this->basePath('app' . ($path ? DIRECTORY_SEPARATOR . ltrim($path, '\/') : ''));
    }

    public function publicPath(string $path = ''): string
    {
        return $this->basePath('public' . ($path ? DIRECTORY_SEPARATOR . ltrim($path, '\/') : ''));
    }

    public function storagePath(string $path = ''): string
    {
        return $this->basePath('storage' . ($path ? DIRECTORY_SEPARATOR . ltrim($path, '\/') : ''));
    }

    public function configPath(string $path = ''): string
    {
        return $this->basePath('app/config' . ($path ? DIRECTORY_SEPARATOR . ltrim($path, '\/') : ''));
    }

    public function databasePath(string $path = ''): string
    {
        return $this->basePath('database' . ($path ? DIRECTORY_SEPARATOR . ltrim($path, '\/') : ''));
    }

    public function resourcePath(string $path = ''): string
    {
        $appRes = $this->basePath('app/resources' . ($path ? DIRECTORY_SEPARATOR . ltrim($path, '\/') : ''));
        if (file_exists($appRes) || is_dir(dirname($appRes))) {
            return $appRes;
        }
        return $this->basePath('resources' . ($path ? DIRECTORY_SEPARATOR . ltrim($path, '\/') : ''));
    }

    public function environment(...$environments): string|bool
    {
        $env = null;
        
        // 1. Check app/config/application.php
        $configFile = $this->configPath('application.php');
        if (file_exists($configFile)) {
            $cfg = require $configFile;
            $env = $cfg['advsoft']['environment'] 
                ?? $cfg['advsoft']['assets']['mode'] 
                ?? $cfg['general']['environment'] 
                ?? null;
        }

        // 2. Check environment variables
        if (!$env) {
            $env = getenv('APP_ENV') ?: ($_ENV['APP_ENV'] ?? null);
        }
        
        // 3. Check .env file
        if (!$env) {
            $envFile = $this->basePath('.env');
            if (file_exists($envFile)) {
                $parsed = @parse_ini_file($envFile);
                if (is_array($parsed) && isset($parsed['APP_ENV'])) {
                    $env = $parsed['APP_ENV'];
                }
            }
        }

        $env = $env ?: 'development';

        if (count($environments) > 0) {
            $patterns = is_array($environments[0]) ? $environments[0] : $environments;
            return in_array($env, $patterns);
        }
        return $env;
    }

    public function isLocal(): bool { return $this->environment('local', 'development', 'dev'); }
    public function isProduction(): bool { return $this->environment('production', 'prod'); }
    public function runningInConsole(): bool { return php_sapi_name() === 'cli'; }

    public function bind(string $abstract, mixed $concrete = null, bool $shared = false): void
    {
        if (is_null($concrete)) {
            $concrete = $abstract;
        }
        $this->bindings[$abstract] = [
            'concrete' => $concrete,
            'shared'   => $shared,
        ];
    }

    public function singleton(string $abstract, mixed $concrete = null): void
    {
        $this->bind($abstract, $concrete, true);
    }

    public function instance(string $abstract, mixed $instance): mixed
    {
        $this->instances[$abstract] = $instance;
        return $instance;
    }

    public function has(string $id): bool
    {
        return isset($this->instances[$id]) || isset($this->bindings[$id]);
    }

    public function bound(string $abstract): bool
    {
        return $this->has($abstract);
    }

    public function get(string $id): mixed
    {
        return $this->make($id);
    }

    public function make(string $abstract, array $parameters = []): mixed
    {
        if (isset($this->instances[$abstract])) {
            return $this->instances[$abstract];
        }

        $concrete = $this->bindings[$abstract]['concrete'] ?? $abstract;

        if ($concrete instanceof Closure) {
            $object = $concrete($this, $parameters);
        } elseif (is_string($concrete)) {
            if ($concrete === $abstract && !class_exists($concrete)) {
                throw new Exception("Target class [$concrete] does not exist.");
            }
            $object = $this->build($concrete, $parameters);
        } else {
            $object = $concrete;
        }

        if (isset($this->bindings[$abstract]) && $this->bindings[$abstract]['shared']) {
            $this->instances[$abstract] = $object;
        }

        return $object;
    }

    protected function build(string $concrete, array $parameters = []): mixed
    {
        $reflector = new ReflectionClass($concrete);
        if (!$reflector->isInstantiable()) {
            throw new Exception("Target [$concrete] is not instantiable.");
        }

        $constructor = $reflector->getConstructor();
        if (is_null($constructor)) {
            return new $concrete;
        }

        $dependencies = $constructor->getParameters();
        $instances = $this->resolveDependencies($dependencies, $parameters);

        return $reflector->newInstanceArgs($instances);
    }

    protected function resolveDependencies(array $dependencies, array $parameters = []): array
    {
        $results = [];
        foreach ($dependencies as $dependency) {
            $name = $dependency->getName();
            if (array_key_exists($name, $parameters)) {
                $results[] = $parameters[$name];
                continue;
            }

            $type = $dependency->getType();
            if ($type && !$type->isBuiltin()) {
                $results[] = $this->make($type->getName());
            } elseif ($dependency->isDefaultValueAvailable()) {
                $results[] = $dependency->getDefaultValue();
            } else {
                $results[] = null;
            }
        }
        return $results;
    }

    public function call(callable|array|string $callback, array $parameters = [], ?string $defaultMethod = null): mixed
    {
        if (is_string($callback) && str_contains($callback, '@')) {
            $callback = explode('@', $callback);
        }
        if (is_array($callback)) {
            $class = is_object($callback[0]) ? $callback[0] : $this->make($callback[0]);
            $method = $callback[1];
            $reflector = new ReflectionMethod($class, $method);
            $dependencies = $reflector->getParameters();
            $instances = $this->resolveDependencies($dependencies, $parameters);
            return $reflector->invokeArgs($class, $instances);
        }
        return call_user_func_array($callback, $parameters);
    }

    public function abort($code, $message = '', array $headers = []): void
    {
        if ($code == 404) {
            throw new \Exception("404 Not Found: $message", 404);
        }
        if ($code == 403) {
            throw new \Exception("403 Forbidden: $message", 403);
        }
        throw new \Exception("$code HTTP Error: $message", (int)$code);
    }
}
