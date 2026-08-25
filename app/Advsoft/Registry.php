<?php

namespace App\Advsoft;

/**
 * Registry
 *
 * @version    2.0.0
 * @package    Advsoft
 * @author     Taufik
 * @author     AdvSoft Team
 * @copyright  Copyright (c) 2026 AdvSoft Technologies
 * @license    https://opensource.org/licenses/MIT MIT License
 */
class Registry
{
    /** @var ModelDefinition[] */
    private static array $models = [];
    private static bool $booted = false;

    /**
     * Register a model definition.
     */
    public static function register(ModelDefinition $def): void
    {
        self::$models[$def->_name] = $def;
    }

    /**
     * Get a model definition by name.
     */
    public static function get(string $name): ?ModelDefinition
    {
        self::bootIfNeeded();
        if (isset(self::$models[$name])) {
            return self::$models[$name];
        }

        $cleanTarget = strtolower(str_replace(['.', '_', ' '], '', $name));

        $aliases = [
            'project.task'    => 'task',
            'projecttask'     => 'task',
            'task'            => 'task',
            'project.project' => 'project.project',
            'projectproject'  => 'project.project',
            'project'         => 'project.project',
            'project.tag'     => 'project.tag',
            'projecttag'      => 'project.tag',
            'tag'             => 'project.tag',
            'tasktimesheet'   => 'task.timesheet',
            'projectstage'    => 'stage',
        ];

        if (isset($aliases[$name]) && isset(self::$models[$aliases[$name]])) {
            return self::$models[$aliases[$name]];
        }
        if (isset($aliases[$cleanTarget]) && isset(self::$models[$aliases[$cleanTarget]])) {
            return self::$models[$aliases[$cleanTarget]];
        }

        // Normalized match against all registered model names
        foreach (self::$models as $mName => $def) {
            $clean = strtolower(str_replace(['.', '_', ' '], '', $mName));
            if ($clean === $cleanTarget) {
                return $def;
            }
        }

        return null;
    }

    /**
     * Get all registered model names.
     */
    public static function all(): array
    {
        self::bootIfNeeded();
        return self::$models;
    }

    /**
     * Check if model is registered.
     */
    public static function has(string $name): bool
    {
        return self::get($name) !== null;
    }

    /**
     * Auto-discover and boot all model definitions from App\Advsoft\Models namespace.
     * After registration, resolves all inheritance chains.
     */
    public static function boot(): void
    {
        if (self::$booted) return;
        self::$booted = true;

        // Phase 1a: Discover core models if directory exists
        $modelsPath = app_path('Advsoft/Models');
        if (is_dir($modelsPath)) {
            self::discoverModels($modelsPath, 'App\\Advsoft\\Models\\', 'base');
        }

        // Phase 1b: Discover control/addon models
        $controlPath = app_path('control');
        if (is_dir($controlPath)) {
            foreach (scandir($controlPath) as $addonDir) {
                if ($addonDir === '.' || $addonDir === '..') continue;
                $addonModelsPath = $controlPath . DIRECTORY_SEPARATOR . $addonDir . DIRECTORY_SEPARATOR . 'Models';
                if (is_dir($addonModelsPath)) {
                    $namespace = 'Addons\\' . \App\Advsoft\Core\Support\Str::studly($addonDir) . '\\Models\\';
                    self::discoverModels($addonModelsPath, $namespace, $addonDir);
                }
            }
        }

        // Phase 2: Resolve inheritance chains for all registered models
        foreach (self::$models as $def) {
            if (method_exists($def, 'resolveInheritance')) {
                $def->resolveInheritance();
            }
        }
    }

    private static function discoverModels(string $path, string $baseNamespace, ?string $module = null): void
    {
        if (!is_dir($path)) return;
        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($path));
        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $relativePath = str_replace($path . DIRECTORY_SEPARATOR, '', $file->getPathname());
                $className = $baseNamespace . str_replace('/', '\\', str_replace('.php', '', str_replace('\\', '/', $relativePath)));
                require_once $file->getPathname();
                if (class_exists($className) && is_subclass_of($className, ModelDefinition::class)) {
                    $instance = new $className();
                    if (empty($instance->_module) && !empty($module)) {
                        $instance->_module = $module;
                    }
                    self::register($instance);
                }
            }
        }
    }

    private static function bootIfNeeded(): void
    {
        if (!self::$booted) self::boot();
    }

    /**
     * Reset registry (useful for testing).
     */
    public static function reset(): void
    {
        self::$models = [];
        self::$booted = false;
    }

    /**
     * Get all model metadata for introspection.
     */
    public static function getModelInfoAll(): array
    {
        self::bootIfNeeded();
        $info = [];
        foreach (self::$models as $name => $def) {
            $info[$name] = $def->getModelInfo();
        }
        return $info;
    }
}
