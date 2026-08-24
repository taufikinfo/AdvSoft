<?php

namespace App\Advsoft;

use App\Model\Ir\IrModuleModule;
use App\Advsoft\Core\Support\Log;

/**
 * ModuleInstaller — Odoo-style addon lifecycle manager.
 *
 * Handles:
 *   1. Discovery: scan addons/ directory for AdvSoft.json manifests
 *   2. Install: load data files, update module state
 *   3. Upgrade: re-load data files, update version
 *   4. Dependency resolution: install dependencies first
 *
 * Usage:
 *   $installer = app(ModuleInstaller::class);
 *   $installer->install('account');
 *   $installer->upgrade('account');
 *   $installer->discoverAll();
 */
class ModuleInstaller
{
    protected DataFileLoader $loader;

    public function __construct(DataFileLoader $loader)
    {
        $this->loader = $loader;
    }

    /**
     * Discover all addon modules from filesystem and sync to database.
     * This is like Odoo's "Update App List" button.
     */
    public function discoverAll(): array
    {
        $addonsPath = app_path('control');
        if (!is_dir($addonsPath)) return [];

        $discovered = [];
        foreach (scandir($addonsPath) as $dir) {
            if ($dir === '.' || $dir === '..') continue;
            $manifestPath = $addonsPath . DIRECTORY_SEPARATOR . $dir . DIRECTORY_SEPARATOR . 'advsoft.json';
            if (!file_exists($manifestPath)) {
                $manifestPath = $addonsPath . DIRECTORY_SEPARATOR . $dir . DIRECTORY_SEPARATOR . 'AdvSoft.json';
            }
            if (!file_exists($manifestPath)) continue;

            $manifest = json_decode(file_get_contents($manifestPath), true);
            if (!$manifest) continue;

            // Sync to ir_module_module
            $module = IrModuleModule::updateOrCreate(
                ['name' => $dir],
                [
                    'display_name' => $manifest['name'] ?? ucfirst($dir),
                    'version' => $manifest['version'] ?? '1.0.0',
                    'category' => $manifest['category'] ?? null,
                    'depends' => is_array($manifest['depends'] ?? null) ? json_encode($manifest['depends']) : ($manifest['depends'] ?? '[]'),
                    'data_files' => is_array($manifest['data'] ?? null) ? json_encode($manifest['data']) : ($manifest['data'] ?? '[]'),
                    'auto_install' => $manifest['auto_install'] ?? false,
                ]
            );

            $discovered[] = $module;
        }

        return $discovered;
    }

    /**
     * Install a module.
     *
     * Steps:
     *   1. Resolve dependencies (install them first)
     *   2. Load XML/CSV data files from manifest
     *   3. Update module state to 'installed'
     */
    public function install(string $moduleName): void
    {
        $module = IrModuleModule::getModule($moduleName);
        if (!$module) {
            // Try to discover first
            $this->discoverAll();
            $module = IrModuleModule::getModule($moduleName);
        }

        if (!$module) {
            throw new \RuntimeException("Module '{$moduleName}' not found.");
        }

        if ($module->state === 'installed') {
            Log::info("[ModuleInstaller] Module '{$moduleName}' is already installed.");
            return;
        }

        // Step 1: Install dependencies first
        $depends = $module->depends ?? [];
        foreach ($depends as $dep) {
            if (!IrModuleModule::isInstalled($dep)) {
                $this->install($dep);
            }
        }

        // Step 2: Ensure ir_model_data table exists
        $this->ensureModelDataTable();

        // Step 3: Load data files
        $dataFiles = $module->data_files ?? [];
        foreach ($dataFiles as $file) {
            Log::info("[ModuleInstaller] Loading data file: {$moduleName}/{$file}");
            $this->loader->loadFile($moduleName, $file);
        }

        // Step 4: Update module state
        $module->update([
            'state' => 'installed',
            'installed_at' => now(),
        ]);

        Log::info("[ModuleInstaller] Module '{$moduleName}' installed successfully.");
    }

    /**
     * Upgrade a module (re-run data files).
     */
    public function upgrade(string $moduleName): void
    {
        $module = IrModuleModule::getModule($moduleName);
        if (!$module) {
            throw new \RuntimeException("Module '{$moduleName}' not found.");
        }

        // Re-discover to pick up manifest changes
        $this->discoverAll();
        $module->refresh();

        // Ensure ir_model_data table exists
        $this->ensureModelDataTable();

        // Re-load data files (existing records updated, new ones created)
        $dataFiles = $module->data_files ?? [];
        foreach ($dataFiles as $file) {
            Log::info("[ModuleInstaller] Upgrading data file: {$moduleName}/{$file}");
            $this->loader->loadFile($moduleName, $file);
        }

        $module->update([
            'state' => 'installed',
        ]);

        Log::info("[ModuleInstaller] Module '{$moduleName}' upgraded successfully.");
    }

    /**
     * Install all modules that have auto_install=true.
     */
    public function installAutoInstall(): void
    {
        $modules = IrModuleModule::where('auto_install', true)
            ->where('state', '!=', 'installed')
            ->get();

        foreach ($modules as $module) {
            // Check if all dependencies are met
            $depends = $module->depends ?? [];
            $allMet = true;
            foreach ($depends as $dep) {
                if (!IrModuleModule::isInstalled($dep)) {
                    $allMet = false;
                    break;
                }
            }

            if ($allMet) {
                $this->install($module->name);
            }
        }
    }

    protected function ensureModelDataTable(): void
    {
        \Adianti\Database\TTransaction::open('advsoft');
        $conn = \Adianti\Database\TTransaction::get();
        $driver = $conn->getAttribute(\PDO::ATTR_DRIVER_NAME);
        $pkDef = ($driver === 'mysql') ? 'id INT AUTO_INCREMENT PRIMARY KEY' : 'id INTEGER PRIMARY KEY AUTOINCREMENT';
        $conn->exec("CREATE TABLE IF NOT EXISTS ir_model_data (
            {$pkDef},
            complete_name VARCHAR(255) UNIQUE,
            module VARCHAR(100),
            name VARCHAR(150),
            model VARCHAR(100),
            res_id INTEGER,
            noupdate INTEGER DEFAULT 0,
            created_at DATETIME,
            updated_at DATETIME
        )");
        \Adianti\Database\TTransaction::close();
    }
}
