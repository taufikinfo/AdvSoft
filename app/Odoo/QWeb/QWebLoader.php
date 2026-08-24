<?php

namespace App\Odoo\QWeb;

use Adianti\Database\TTransaction;

/**
 * QWebLoader - Loads QWeb templates from DB (ir_ui_views) and addon files.
 */
class QWebLoader
{
    private string $addonsPath;
    private array $inheritCache = [];

    public function __construct()
    {
        $this->addonsPath = app_path('control');
    }

    protected function getPdo(): \PDO
    {
        if (!TTransaction::get()) {
            TTransaction::open('advsoft');
        }
        return TTransaction::get();
    }

    public function loadFromDb(string $templateName): ?string
    {
        $opened = false;
        if (!TTransaction::get()) {
            TTransaction::open('advsoft');
            $opened = true;
        }
        $pdo = TTransaction::get();
        $stmt = $pdo->prepare("SELECT * FROM ir_ui_views WHERE type = 'qweb' AND active = 1 AND (key = :k OR name = :n) ORDER BY priority ASC LIMIT 1");
        $stmt->execute([':k' => $templateName, ':n' => $templateName]);
        $record = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$record) {
            if ($opened) TTransaction::close();
            return null;
        }

        if (!empty($record['inherit_id']) && empty($record['primary'])) {
            $stmtP = $pdo->prepare("SELECT * FROM ir_ui_views WHERE id = :id LIMIT 1");
            $stmtP->execute([':id' => $record['inherit_id']]);
            $parent = $stmtP->fetch(\PDO::FETCH_ASSOC);

            if ($opened) TTransaction::close();
            if ($parent && ($parent['type'] ?? '') === 'qweb') {
                return $parent['arch'];
            }
        }

        if ($opened) TTransaction::close();
        return $record['arch'];
    }

    public function loadFromAddonFiles(string $templateName): ?string
    {
        if (!is_dir($this->addonsPath)) {
            return null;
        }

        foreach (scandir($this->addonsPath) as $addonDir) {
            if ($addonDir === '.' || $addonDir === '..') continue;

            $dataPath = $this->addonsPath . DIRECTORY_SEPARATOR . $addonDir . DIRECTORY_SEPARATOR . 'data';
            if (!is_dir($dataPath)) continue;

            $files = glob($dataPath . '/*.xml') ?: [];
            $files = array_unique($files);

            foreach ($files as $file) {
                if (pathinfo($file, PATHINFO_EXTENSION) !== 'xml') continue;

                $xml = @simplexml_load_file($file);
                if (!$xml) continue;

                foreach ($xml->children() as $element) {
                    $tag = $element->getName();
                    $id = (string) ($element['id'] ?? '');
                    $tId = (string) ($element['t-id'] ?? '');

                    if ($id === $templateName || $tId === $templateName) {
                        return $this->extractTemplateXml($element);
                    }

                    if ($tag === 'record' && (string) ($element['model'] ?? '') === 'ir.ui.view') {
                        $name = '';
                        $key = '';
                        foreach ($element->children() as $field) {
                            $fieldName = (string) ($field['name'] ?? '');
                            if ($fieldName === 'name') $name = (string) $field;
                            if ($fieldName === 'key') $key = (string) $field;
                        }
                        if ($name === $templateName || $key === $templateName) {
                            foreach ($element->children() as $field) {
                                if ((string) ($field['name'] ?? '') === 'arch') {
                                    return trim((string) $field);
                                }
                            }
                        }
                    }
                }

                foreach ($xml->xpath('//template') ?: [] as $tpl) {
                    $id = (string) ($tpl['id'] ?? '');
                    if ($id === $templateName) {
                        return $this->extractTemplateXml($tpl);
                    }
                }
            }
        }

        return null;
    }

    private function extractTemplateXml(\SimpleXMLElement $element): string
    {
        $dom = dom_import_simplexml($element)->ownerDocument;
        $dom->formatOutput = true;
        return $dom->saveXML();
    }

    public function getInheritChildren(string $parentName): array
    {
        if (isset($this->inheritCache[$parentName])) {
            return $this->inheritCache[$parentName];
        }

        $pdo = $this->getPdo();
        $stmt = $pdo->prepare("SELECT * FROM ir_ui_views WHERE type = 'qweb' AND (key = :k OR name = :n) LIMIT 1");
        $stmt->execute([':k' => $parentName, ':n' => $parentName]);
        $parent = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$parent) {
            $this->inheritCache[$parentName] = [];
            return [];
        }

        $stmtC = $pdo->prepare("SELECT * FROM ir_ui_views WHERE type = 'qweb' AND inherit_id = :pid AND active = 1 ORDER BY priority ASC");
        $stmtC->execute([':pid' => $parent['id']]);
        $children = $stmtC->fetchAll(\PDO::FETCH_OBJ) ?: [];

        $this->inheritCache[$parentName] = $children;
        return $children;
    }

    public function saveTemplate(
        string $name,
        string $xml,
        ?string $key = null,
        int $priority = 16,
        ?int $inheritId = null,
        bool $primary = false
    ): int {
        $pdo = $this->getPdo();
        $stmt = $pdo->prepare("SELECT id FROM ir_ui_views WHERE type = 'qweb' AND name = :name LIMIT 1");
        $stmt->execute([':name' => $name]);
        $existing = $stmt->fetch(\PDO::FETCH_ASSOC);

        $now = date('Y-m-d H:i:s');
        if ($existing) {
            $stmtU = $pdo->prepare("UPDATE ir_ui_views SET arch = :arch, key = :key, priority = :priority, inherit_id = :inherit_id, primary = :primary, updated_at = :updated_at WHERE id = :id");
            $stmtU->execute([
                ':id'         => $existing['id'],
                ':arch'       => $xml,
                ':key'        => $key,
                ':priority'   => $priority,
                ':inherit_id' => $inheritId,
                ':primary'    => $primary ? 1 : 0,
                ':updated_at' => $now,
            ]);
            return (int)$existing['id'];
        }

        $stmtI = $pdo->prepare("INSERT INTO ir_ui_views (name, model, type, arch, key, priority, inherit_id, primary, active, created_at, updated_at) VALUES (:name, '', 'qweb', :arch, :key, :priority, :inherit_id, :primary, 1, :created_at, :updated_at)");
        $stmtI->execute([
            ':name'       => $name,
            ':arch'       => $xml,
            ':key'        => $key,
            ':priority'   => $priority,
            ':inherit_id' => $inheritId,
            ':primary'    => $primary ? 1 : 0,
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);
        return (int)$pdo->lastInsertId();
    }

    public function deleteTemplate(string $name): bool
    {
        $pdo = $this->getPdo();
        $stmt = $pdo->prepare("DELETE FROM ir_ui_views WHERE type = 'qweb' AND name = :name");
        $stmt->execute([':name' => $name]);
        return $stmt->rowCount() > 0;
    }

    public function listTemplates(): array
    {
        $pdo = $this->getPdo();
        $stmt = $pdo->query("SELECT * FROM ir_ui_views WHERE type = 'qweb' AND active = 1 ORDER BY name ASC");
        return $stmt->fetchAll(\PDO::FETCH_OBJ) ?: [];
    }
}
