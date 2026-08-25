<?php

namespace App\Advsoft\Security;

use Adianti\Database\TTransaction;
use App\Advsoft\Core\Support\Log;
use App\Model\Ir\IrModel;
use App\Model\Res\ResGroup;
use PDO;

/**
 * ModuleSecurityLoader
 *
 * Handles per-module security definitions located in:
 * `app/control/{module}/security/ir.model.access.csv`
 * `app/control/{module}/security/ir.rule.csv`
 *
 * @version    2.0.0
 * @package    Advsoft
 * @author     Taufik
 * @author     AdvSoft Team
 * @copyright  Copyright (c) 2026 AdvSoft Technologies
 * @license    https://opensource.org/licenses/MIT MIT License
 */
class ModuleSecurityLoader
{
    /**
     * Scan and sync all modular security files across app/control/.
     */
    public static function syncAllModules(): array
    {
        $controlPath = app_path('control');
        $results = [];

        if (!is_dir($controlPath)) {
            return $results;
        }

        foreach (scandir($controlPath) as $addonDir) {
            if ($addonDir === '.' || $addonDir === '..') continue;
            $securityDir = $controlPath . DIRECTORY_SEPARATOR . $addonDir . DIRECTORY_SEPARATOR . 'security';

            if (is_dir($securityDir)) {
                $results[$addonDir] = self::importModuleSecurity($addonDir, $securityDir);
            }
        }

        return $results;
    }

    /**
     * Import security files for a single module.
     */
    public static function importModuleSecurity(string $module, string $securityDir): array
    {
        $result = ['acls' => 0, 'rules' => 0];

        // 1. Model Access CSV (ir.model.access.csv)
        $accessCsv = $securityDir . DIRECTORY_SEPARATOR . 'ir.model.access.csv';
        if (file_exists($accessCsv)) {
            $result['acls'] = self::importModelAccessCsv($module, $accessCsv);
        }

        // 2. Record Rules CSV (ir.rule.csv)
        $rulesCsv = $securityDir . DIRECTORY_SEPARATOR . 'ir.rule.csv';
        if (file_exists($rulesCsv)) {
            $result['rules'] = self::importRecordRulesCsv($module, $rulesCsv);
        }

        return $result;
    }

    /**
     * Parse and import ir.model.access.csv
     */
    public static function importModelAccessCsv(string $module, string $filePath): int
    {
        $handle = fopen($filePath, 'r');
        if (!$handle) return 0;

        $headers = fgetcsv($handle, 0, ',', '"', "\\");
        if (!$headers) {
            fclose($handle);
            return 0;
        }

        // Trim headers
        $headers = array_map('trim', $headers);

        TTransaction::open('advsoft');
        $pdo = TTransaction::get();
        $count = 0;

        try {
            while (($row = fgetcsv($handle, 0, ',', '"', "\\")) !== false) {
                if (count($row) !== count($headers)) continue;
                $data = array_combine($headers, array_map('trim', $row));

                $name      = $data['name'] ?? ($data['id'] ?? 'ACL');
                $modelName = $data['model'] ?? ($data['model_id'] ?? null);
                $groupName = $data['group'] ?? ($data['group_id'] ?? null);

                // Strip standard Odoo prefixes if present (e.g. model_account_account -> account.account)
                if ($modelName && str_starts_with($modelName, 'model_')) {
                    $modelName = str_replace('_', '.', substr($modelName, 6));
                }

                if (!$modelName) continue;

                // Resolve model_id
                $stmtM = $pdo->prepare("SELECT id FROM ir_model WHERE model = ?");
                $stmtM->execute([$modelName]);
                $modelId = $stmtM->fetchColumn();

                if (!$modelId) {
                    $stmtInsM = $pdo->prepare("INSERT INTO ir_model (model, name, module, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
                    $stmtInsM->execute([$modelName, $modelName, $module]);
                    $modelId = $pdo->lastInsertId();
                }

                // Resolve group_id
                $groupId = null;
                if ($groupName) {
                    if (is_numeric($groupName)) {
                        $groupId = (int)$groupName;
                    } else {
                        $stmtG = $pdo->prepare("SELECT id FROM res_groups WHERE name = ? OR name LIKE ? LIMIT 1");
                        $stmtG->execute([$groupName, "%{$groupName}%"]);
                        $groupId = $stmtG->fetchColumn() ?: null;
                    }
                }

                $permR = isset($data['perm_read']) ? (int)$data['perm_read'] : 1;
                $permW = isset($data['perm_write']) ? (int)$data['perm_write'] : 1;
                $permC = isset($data['perm_create']) ? (int)$data['perm_create'] : 1;
                $permU = isset($data['perm_unlink']) ? (int)$data['perm_unlink'] : 1;

                // Check existing ACL
                if ($groupId) {
                    $stmtCheck = $pdo->prepare("SELECT id FROM ir_model_access WHERE model_id = ? AND group_id = ?");
                    $stmtCheck->execute([$modelId, $groupId]);
                } else {
                    $stmtCheck = $pdo->prepare("SELECT id FROM ir_model_access WHERE model_id = ? AND group_id IS NULL");
                    $stmtCheck->execute([$modelId]);
                }
                $existingId = $stmtCheck->fetchColumn();

                if ($existingId) {
                    $stmtUpd = $pdo->prepare("
                        UPDATE ir_model_access 
                        SET name = ?, perm_read = ?, perm_write = ?, perm_create = ?, perm_unlink = ?, active = 1, updated_at = NOW()
                        WHERE id = ?
                    ");
                    $stmtUpd->execute([$name, $permR, $permW, $permC, $permU, $existingId]);
                } else {
                    $stmtIns = $pdo->prepare("
                        INSERT INTO ir_model_access (name, model_id, group_id, perm_read, perm_write, perm_create, perm_unlink, active, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
                    ");
                    $stmtIns->execute([$name, $modelId, $groupId, $permR, $permW, $permC, $permU]);
                }

                $count++;
            }
            TTransaction::close();
        } catch (\Throwable $e) {
            TTransaction::rollback();
            Log::error("[ModuleSecurityLoader] Error importing {$filePath}: " . $e->getMessage());
            throw $e;
        } finally {
            fclose($handle);
        }

        return $count;
    }

    /**
     * Parse and import ir.rule.csv
     */
    public static function importRecordRulesCsv(string $module, string $filePath): int
    {
        $handle = fopen($filePath, 'r');
        if (!$handle) return 0;

        $headers = fgetcsv($handle, 0, ',', '"', "\\");
        if (!$headers) {
            fclose($handle);
            return 0;
        }

        $headers = array_map('trim', $headers);

        TTransaction::open('advsoft');
        $pdo = TTransaction::get();
        $count = 0;

        try {
            while (($row = fgetcsv($handle, 0, ',', '"', "\\")) !== false) {
                if (count($row) !== count($headers)) continue;
                $data = array_combine($headers, array_map('trim', $row));

                $name        = $data['name'] ?? ($data['id'] ?? 'Record Rule');
                $modelName   = $data['model'] ?? ($data['model_id'] ?? null);
                $domainForce = $data['domain_force'] ?? ($data['domain'] ?? '[]');
                $isGlobal    = isset($data['global']) ? (int)$data['global'] : 1;

                if ($modelName && str_starts_with($modelName, 'model_')) {
                    $modelName = str_replace('_', '.', substr($modelName, 6));
                }

                if (!$modelName) continue;

                // Resolve model_id
                $stmtM = $pdo->prepare("SELECT id FROM ir_model WHERE model = ?");
                $stmtM->execute([$modelName]);
                $modelId = $stmtM->fetchColumn();

                if (!$modelId) continue;

                $permR = isset($data['perm_read']) ? (int)$data['perm_read'] : 1;
                $permW = isset($data['perm_write']) ? (int)$data['perm_write'] : 1;
                $permC = isset($data['perm_create']) ? (int)$data['perm_create'] : 1;
                $permU = isset($data['perm_unlink']) ? (int)$data['perm_unlink'] : 1;

                $stmtCheck = $pdo->prepare("SELECT id FROM ir_rule WHERE name = ? AND model_id = ?");
                $stmtCheck->execute([$name, $modelId]);
                $existingId = $stmtCheck->fetchColumn();

                if ($existingId) {
                    $stmtUpd = $pdo->prepare("
                        UPDATE ir_rule 
                        SET domain_force = ?, `global` = ?, perm_read = ?, perm_write = ?, perm_create = ?, perm_unlink = ?, active = 1, updated_at = NOW()
                        WHERE id = ?
                    ");
                    $stmtUpd->execute([$domainForce, $isGlobal, $permR, $permW, $permC, $permU, $existingId]);
                } else {
                    $stmtIns = $pdo->prepare("
                        INSERT INTO ir_rule (name, model_id, domain_force, `global`, perm_read, perm_write, perm_create, perm_unlink, active, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
                    ");
                    $stmtIns->execute([$name, $modelId, $domainForce, $isGlobal, $permR, $permW, $permC, $permU]);
                }

                $count++;
            }
            TTransaction::close();
        } catch (\Throwable $e) {
            TTransaction::rollback();
            Log::error("[ModuleSecurityLoader] Error importing record rules {$filePath}: " . $e->getMessage());
            throw $e;
        } finally {
            fclose($handle);
        }

        return $count;
    }

    /**
     * Export database ACLs of a module into security/ir.model.access.csv.
     */
    public static function exportModuleAccessToCsv(string $module, ?string $outputPath = null): string
    {
        TTransaction::open('advsoft');
        $pdo = TTransaction::get();

        $sql = "
            SELECT MIN(a.id) as acl_id, MIN(a.name) as acl_name, m.model as model_name, g.name as group_name,
                   MAX(a.perm_read) as perm_read, MAX(a.perm_write) as perm_write, 
                   MAX(a.perm_create) as perm_create, MAX(a.perm_unlink) as perm_unlink
            FROM ir_model_access a
            JOIN ir_model m ON a.model_id = m.id
            LEFT JOIN res_groups g ON a.group_id = g.id
            WHERE m.module = :module OR m.model LIKE :module_prefix
            GROUP BY m.model, g.id, g.name
            ORDER BY m.model, g.id
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':module' => $module,
            ':module_prefix' => "{$module}.%",
        ]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        TTransaction::close();

        $lines = ["id,name,model,group,perm_read,perm_write,perm_create,perm_unlink"];
        foreach ($rows as $r) {
            $id = 'access_' . str_replace('.', '_', $r['model_name']) . '_' . strtolower(preg_replace('/[^a-z0-9]/i', '_', $r['group_name'] ?? 'all'));
            $lines[] = sprintf(
                "%s,\"%s\",%s,\"%s\",%d,%d,%d,%d",
                $id,
                $r['acl_name'],
                $r['model_name'],
                $r['group_name'] ?? '',
                $r['perm_read'],
                $r['perm_write'],
                $r['perm_create'],
                $r['perm_unlink']
            );
        }

        $csvContent = implode("\n", $lines) . "\n";

        if ($outputPath === null) {
            $outputPath = app_path("control/{$module}/security/ir.model.access.csv");
        }

        $dir = dirname($outputPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        file_put_contents($outputPath, $csvContent);
        return $csvContent;
    }
}
