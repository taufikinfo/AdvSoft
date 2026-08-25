<?php

namespace App\Advsoft\Translation;

use App\Model\Ir\IrTranslation;
use Adianti\Database\TTransaction;
use SimpleXMLElement;
use Exception;
use PDO;

/**
 * XmlTranslationLoader — Modular XML Translation File Parser, Importer, and Exporter.
 *
 * Handles per-module XML translations in `app/control/{module}/i18n/{lang}.xml`.
 */
class XmlTranslationLoader
{
    /**
     * Parse and import a specific translation XML file into the database.
     *
     * @param string $filePath Full path to XML file
     * @return int Number of entries imported/updated
     */
    public static function importXmlFile(string $filePath): int
    {
        if (!file_exists($filePath)) {
            return 0;
        }

        $content = file_get_contents($filePath);
        if (empty(trim($content))) {
            return 0;
        }

        $xml = @simplexml_load_string($content);
        if (!$xml) {
            return 0;
        }

        $defaultLang = (string)($xml['lang'] ?? pathinfo($filePath, PATHINFO_FILENAME));
        $defaultModule = (string)($xml['module'] ?? self::detectModuleFromPath($filePath));

        $count = 0;

        // Support Format 1: <translations><entry name="..." type="..."><src>...</src><value>...</value></entry></translations>
        if (isset($xml->entry)) {
            foreach ($xml->entry as $entry) {
                $name = (string)($entry['name'] ?? 'code');
                $type = (string)($entry['type'] ?? 'code');
                $src = (string)($entry->src ?? $entry['src'] ?? '');
                $value = (string)($entry->value ?? $entry['value'] ?? '');
                $lang = (string)($entry['lang'] ?? $defaultLang);
                $module = (string)($entry['module'] ?? $defaultModule);
                $state = (string)($entry['state'] ?? 'translated');
                $resId = isset($entry['res_id']) ? (int)$entry['res_id'] : null;

                if (!empty($src) || !empty($name)) {
                    IrTranslation::setTranslation($name, $src, $value, $lang, $type, $module, $resId, $state);
                    $count++;
                }
            }
        }

        // Support Format 2: Odoo style <advsoft><data><record model="ir.translation">...</record></data></advsoft>
        if (isset($xml->data) && isset($xml->data->record)) {
            foreach ($xml->data->record as $record) {
                if ((string)$record['model'] === 'ir.translation' || (string)$record['model'] === 'ir_translation') {
                    $name = '';
                    $src = '';
                    $value = '';
                    $type = 'code';
                    $lang = $defaultLang;
                    $module = $defaultModule;

                    foreach ($record->field as $f) {
                        $fName = (string)$f['name'];
                        $fVal = (string)$f;
                        if ($fName === 'name') $name = $fVal;
                        elseif ($fName === 'src') $src = $fVal;
                        elseif ($fName === 'value') $value = $fVal;
                        elseif ($fName === 'type') $type = $fVal;
                        elseif ($fName === 'lang') $lang = $fVal;
                        elseif ($fName === 'module') $module = $fVal;
                    }

                    if (!empty($src) || !empty($name)) {
                        IrTranslation::setTranslation($name, $src, $value, $lang, $type, $module);
                        $count++;
                    }
                }
            }
        }

        IrTranslation::clearCache();
        return $count;
    }

    /**
     * Auto-discover and sync all modular XML translations across `app/control/`.
     *
     * @return array [module => [lang => imported_count]]
     */
    public static function syncAllModules(): array
    {
        $baseDir = app_path('control');
        $results = [];

        if (!is_dir($baseDir)) {
            return $results;
        }

        $modules = scandir($baseDir);
        foreach ($modules as $module) {
            if ($module === '.' || $module === '..' || !is_dir($baseDir . '/' . $module)) {
                continue;
            }

            $i18nDir = $baseDir . '/' . $module . '/i18n';
            if (is_dir($i18nDir)) {
                $files = scandir($i18nDir);
                foreach ($files as $file) {
                    if (str_ends_with(strtolower($file), '.xml')) {
                        $lang = pathinfo($file, PATHINFO_FILENAME);
                        $filePath = $i18nDir . '/' . $file;
                        $imported = self::importXmlFile($filePath);
                        $results[$module][$lang] = $imported;
                    }
                }
            }
        }

        return $results;
    }

    /**
     * Export translations for a specific module and language to an XML file.
     *
     * @param string $module Module name (e.g. 'account', 'base')
     * @param string $lang Target language code (e.g. 'en', 'id')
     * @param string|null $outputPath Destination file path (defaults to app/control/{module}/i18n/{lang}.xml)
     * @return string Generated XML content
     */
    public static function exportDatabaseToXml(string $module, string $lang, ?string $outputPath = null): string
    {
        $normalizedLang = IrTranslation::normalizeLang($lang);

        $hasActiveTx = false;
        try {
            TTransaction::get();
            $hasActiveTx = true;
        } catch (\Throwable $e) {
            TTransaction::open('advsoft');
        }

        $conn = TTransaction::get();
        $stmt = $conn->prepare("SELECT name, type, src, value, state, res_id FROM ir_translations WHERE module = :m AND (lang = :l1 OR lang LIKE :l2) ORDER BY type ASC, name ASC");
        $stmt->execute([
            ':m'  => $module,
            ':l1' => $normalizedLang,
            ':l2' => $normalizedLang . '_%',
        ]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$hasActiveTx) {
            TTransaction::close();
        }

        $xml = new SimpleXMLElement('<?xml version="1.0" encoding="utf-8"?><translations/>');
        $xml->addAttribute('lang', $normalizedLang);
        $xml->addAttribute('module', $module);

        foreach ($rows as $row) {
            $entry = $xml->addChild('entry');
            $entry->addAttribute('name', htmlspecialchars($row['name']));
            $entry->addAttribute('type', htmlspecialchars($row['type']));
            if (!empty($row['res_id'])) {
                $entry->addAttribute('res_id', (string)$row['res_id']);
            }
            if (!empty($row['state']) && $row['state'] !== 'translated') {
                $entry->addAttribute('state', htmlspecialchars($row['state']));
            }

            $srcNode = $entry->addChild('src', htmlspecialchars($row['src']));
            $valNode = $entry->addChild('value', htmlspecialchars($row['value'] ?? ''));
        }

        $dom = dom_import_simplexml($xml)->ownerDocument;
        $dom->formatOutput = true;
        $formattedXml = $dom->saveXML();

        if ($outputPath === null) {
            $i18nDir = app_path("control/{$module}/i18n");
            if (!is_dir($i18nDir)) {
                @mkdir($i18nDir, 0777, true);
            }
            $outputPath = "{$i18nDir}/{$normalizedLang}.xml";
        }

        file_put_contents($outputPath, $formattedXml);
        return $formattedXml;
    }

    /**
     * Detect module name from file path.
     */
    protected static function detectModuleFromPath(string $path): string
    {
        $normalized = str_replace('\\', '/', $path);
        if (preg_match('#control/([^/]+)/i18n/#', $normalized, $matches)) {
            return $matches[1];
        }
        return 'base';
    }
}
