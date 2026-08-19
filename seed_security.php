<?php
require_once __DIR__ . '/app/bootstrap.php';

use App\Models\Ir\IrModel;
use App\Models\Ir\IrModelAccess;
use App\Models\Res\ResGroup;
use App\Odoo\Registry;
use Adianti\Database\TTransaction;

TTransaction::open('adiantisoft');
$conn = TTransaction::get();

$models = Registry::all();
echo "Booted models in registry: " . count($models) . "\n";

foreach ($models as $name => $def) {
    $desc = $def->_description ?: class_basename($def);
    $stmt = $conn->prepare("INSERT OR REPLACE INTO ir_model (model, name, module) VALUES (:m, :n, :mod)");
    $stmt->execute([':m' => $name, ':n' => $desc, ':mod' => 'larasoft']);
}

$mCount = $conn->query("SELECT COUNT(*) FROM ir_model")->fetchColumn();
echo "ir_model count: $mCount\n";

$groups = $conn->query("SELECT id, name FROM res_groups")->fetchAll(\PDO::FETCH_ASSOC);
echo "res_groups count: " . count($groups) . "\n";

$modelRows = $conn->query("SELECT id, model FROM ir_model")->fetchAll(\PDO::FETCH_ASSOC);

$insAcl = $conn->prepare("INSERT OR REPLACE INTO ir_model_access (name, model_id, group_id, perm_read, perm_write, perm_create, perm_unlink, active) VALUES (:name, :mid, :gid, :r, :w, :c, :u, 1)");

foreach ($modelRows as $m) {
    foreach ($groups as $g) {
        $isSystem = $g['name'] === 'Administration / System Admin';
        $isManager = $g['name'] === 'Project / Manager';
        $isUser = $g['name'] === 'Project / User';
        $isPortal = $g['name'] === 'User / Portal';

        $isSecModel = str_starts_with($m['model'], 'res.') || str_starts_with($m['model'], 'ir.');

        if ($isSystem) {
            $r = 1; $w = 1; $c = 1; $u = 1;
        } elseif ($isManager) {
            $r = 1;
            $w = !$isSecModel ? 1 : 0;
            $c = !$isSecModel ? 1 : 0;
            $u = !$isSecModel ? 1 : 0;
        } elseif ($isUser) {
            $r = 1;
            $w = in_array($m['model'], ['task', 'task.timesheet']) ? 1 : 0;
            $c = in_array($m['model'], ['task', 'task.timesheet']) ? 1 : 0;
            $u = 0;
        } else {
            // Portal
            $r = in_array($m['model'], ['task', 'project.project']) ? 1 : 0;
            $w = 0; $c = 0; $u = 0;
        }

        $insAcl->execute([
            ':name' => $g['name'] . ' on ' . $m['model'],
            ':mid'  => $m['id'],
            ':gid'  => $g['id'],
            ':r'    => $r,
            ':w'    => $w,
            ':c'    => $c,
            ':u'    => $u,
        ]);
    }
}

$aCount = $conn->query("SELECT COUNT(*) FROM ir_model_access")->fetchColumn();
echo "ir_model_access count: $aCount\n";

TTransaction::close();
echo "Seeding committed successfully!\n";
