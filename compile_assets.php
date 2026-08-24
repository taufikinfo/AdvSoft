<?php
/**
 * CLI Asset Compiler for Adiantisoft
 * Compiles all JS & CSS into production bundles:
 *   - public/js/app.bundle.js
 *   - public/css/app.bundle.css
 *
 * Usage: php compile_assets.php
 */

require_once __DIR__ . '/app/bootstrap.php';

use App\Odoo\Core\Support\AssetCompiler;

echo "=== Compiling Adiantisoft Production Assets ===\n";

$result = AssetCompiler::compileAll();

$jsKb = round($result['js_size'] / 1024, 2);
$cssKb = round($result['css_size'] / 1024, 2);

echo "[JS]  Bundle created: public/js/app.bundle.js ({$jsKb} KB)\n";
echo "[CSS] Bundle created: public/css/app.bundle.css ({$cssKb} KB)\n";
echo "Version Hash: " . $result['version'] . "\n";
echo "=== Production Compilation Complete! ===\n";
