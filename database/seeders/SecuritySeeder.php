<?php

namespace Database\Seeders;

use App\Models\Ir\IrModel;
use App\Models\Ir\IrModelAccess;
use App\Models\Ir\IrRule;
use App\Models\Res\ResCompany;
use App\Models\Res\ResGroup;
use App\Models\Res\ResGroupsCategory;
use App\Models\Res\ResPartner;
use App\Models\Res\ResUser;
use App\Advsoft\Core\Database\Seeder;

class SecuritySeeder extends Seeder
{
    public function run(): void
    {
        // ─────────────────────────────────────────────
        //  1. Company
        // ─────────────────────────────────────────────
        $company = ResCompany::firstOrCreate(
            ['name' => 'My Company'],
            ['code' => 'MC', 'currency_code' => 'USD', 'active' => true]
        );

        // ─────────────────────────────────────────────
        //  2. Group categories
        // ─────────────────────────────────────────────
        $catAdmin   = ResGroupsCategory::firstOrCreate(['name' => 'Administration'], ['sequence' => 1]);
        $catProject = ResGroupsCategory::firstOrCreate(['name' => 'Project'],        ['sequence' => 10]);
        $catUser    = ResGroupsCategory::firstOrCreate(['name' => 'User'],           ['sequence' => 99]);

        // ─────────────────────────────────────────────
        //  3. Groups
        // ─────────────────────────────────────────────
        $gAdmin = ResGroup::firstOrCreate(
            ['name' => 'Administration / System Admin'],
            ['category_id' => $catAdmin->id, 'description' => 'Full system access (superuser)']
        );
        $gManager = ResGroup::firstOrCreate(
            ['name' => 'Project / Manager'],
            ['category_id' => $catProject->id, 'description' => 'Manage all projects & tasks']
        );
        $gUser = ResGroup::firstOrCreate(
            ['name' => 'Project / User'],
            ['category_id' => $catProject->id, 'description' => 'Standard user: see/edit own tasks']
        );
        $gPortal = ResGroup::firstOrCreate(
            ['name' => 'User / Portal'],
            ['category_id' => $catUser->id, 'description' => 'External portal user (read-only)', 'share' => true]
        );

        // Group implication: Manager → User (manager can do everything user can)
        $gManager->syncImpliedGroups([$gUser->id]);

        // ─────────────────────────────────────────────
        //  4. Default users
        // ─────────────────────────────────────────────
        $adminPartner = ResPartner::firstOrCreate(
            ['email' => 'admin@advsoft.local'],
            ['name' => 'Administrator', 'is_company' => false, 'active' => true]
        );
        $admin = ResUser::firstOrCreate(
            ['login' => 'admin'],
            [
                'name'      => 'Administrator',
                'email'     => 'admin@advsoft.local',
                'password'  => password_hash('admin', PASSWORD_DEFAULT),
                'partner_id' => $adminPartner->id,
                'company_id' => $company->id,
                'active'    => true,
                'share'     => false,
            ]
        );
        $admin->syncGroups([$gAdmin->id, $gManager->id, $gUser->id]);

        $demoPartner = ResPartner::firstOrCreate(
            ['email' => 'demo@advsoft.local'],
            ['name' => 'Demo User', 'is_company' => false, 'active' => true]
        );
        $demo = ResUser::firstOrCreate(
            ['login' => 'demo'],
            [
                'name'      => 'Demo User',
                'email'     => 'demo@advsoft.local',
                'password'  => password_hash('demo', PASSWORD_DEFAULT),
                'partner_id' => $demoPartner->id,
                'company_id' => $company->id,
                'active'    => true,
                'share'     => false,
            ]
        );
        $demo->syncGroups([$gUser->id]);

        // ─────────────────────────────────────────────
        //  5. Register every AdvSoft model in ir_model
        // ─────────────────────────────────────────────
        $models = \App\Advsoft\Registry::all();
        foreach ($models as $name => $def) {
            $desc = $def->_description ?: class_basename($def);
            $module = method_exists($def, 'getModule') ? ($def->getModule() ?: 'advsoft') : 'advsoft';
            IrModel::firstOrCreate(
                ['model' => $name],
                ['name' => $desc, 'module' => $module]
            );
        }

        // ─────────────────────────────────────────────
        //  6. ir.model.access — default ACLs
        //     Admin: full CRUD on everything
        //     Manager: full on business, read on security
        //     User:  read on security, full on business
        // ─────────────────────────────────────────────
        $adminAcls   = [];
        $managerAcls = [];
        $userAcls    = [];

        foreach ($models as $name => $def) {
            $modelId = IrModel::where('model', $name)->value('id');
            if (!$modelId) continue;

            // Admin gets everything
            $adminAcls[] = [
                'name'        => "admin.full.$name",
                'model_id'    => $modelId,
                'group_id'    => $gAdmin->id,
                'perm_read'   => true,
                'perm_write'  => true,
                'perm_create' => true,
                'perm_unlink' => true,
                'active'      => true,
            ];

            $isSecurity = str_starts_with($name, 'res.') || str_starts_with($name, 'ir.');
            $isBusiness = !$isSecurity;

            $managerAcls[] = [
                'name'        => "manager.access.$name",
                'model_id'    => $modelId,
                'group_id'    => $gManager->id,
                'perm_read'   => true,
                'perm_write'  => $isBusiness,
                'perm_create' => $isBusiness,
                'perm_unlink' => $isBusiness,
                'active'      => true,
            ];

            $userAcls[] = [
                'name'        => "user.access.$name",
                'model_id'    => $modelId,
                'group_id'    => $gUser->id,
                'perm_read'   => true,
                'perm_write'  => $isBusiness,
                'perm_create' => $isBusiness,
                'perm_unlink' => $isBusiness,
                'active'      => true,
            ];
        }

        foreach ($adminAcls as $acl) {
            IrModelAccess::updateOrCreate(
                ['model_id' => $acl['model_id'], 'group_id' => $acl['group_id']],
                $acl
            );
        }
        foreach ($managerAcls as $acl) {
            IrModelAccess::updateOrCreate(
                ['model_id' => $acl['model_id'], 'group_id' => $acl['group_id']],
                $acl
            );
        }
        foreach ($userAcls as $acl) {
            IrModelAccess::updateOrCreate(
                ['model_id' => $acl['model_id'], 'group_id' => $acl['group_id']],
                $acl
            );
        }

        // ─────────────────────────────────────────────
        //  7. ir.rule — sample record rule for demo
        //     "User can only see their own tasks"
        //     (model = task — matches the existing TaskDef _name)
        // ─────────────────────────────────────────────
        foreach (['task', 'project.task'] as $candidate) {
            if (IrModel::where('model', $candidate)->exists()) {
                $rule = IrRule::firstOrCreate(
                    ['name' => "task.personal.{$candidate}", 'model_id' => IrModel::where('model', $candidate)->value('id')],
                    [
                        'domain_force' => "[('user_id','=',__user_id__)]",
                        'global'       => false,
                        'perm_read'    => true,
                        'perm_write'   => true,
                        'perm_create'  => true,
                        'perm_unlink'  => true,
                        'active'       => true,
                    ]
                );
                $rule->groups()->syncWithoutDetaching([$gUser->id]);
            }
        }

        if ($this->command) {
            $this->command->info('Security seeded: ' . count($modelClasses) . ' models, 4 groups, 2 default users (admin/admin, demo/demo).');
        }
    }

    /**
     * Discover all AdvSoft *Def model classes.
     * Mirrors Registry::boot() but reads from filesystem to avoid bootstrap order.
     */
    protected function discoverModels(): array
    {
        $map = [];
        $dir = __DIR__ . '/../../app/Advsoft/Models';
        if (!is_dir($dir)) return $map;
        $rii = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir));
        foreach ($rii as $file) {
            if ($file->getExtension() !== 'php') continue;
            $rel = str_replace([$dir, '/', '.php'], ['', '\\', ''], $file->getPathname());
            $cls = 'App\\Advsoft\\Models\\' . ltrim($rel, '\\');
            if (!class_exists($cls)) continue;
            $ref = new \ReflectionClass($cls);
            if ($ref->isAbstract()) continue;
            if (!$ref->hasProperty('_name')) continue;
            $prop = $ref->getProperty('_name');
            $prop->setAccessible(true);
            $inst = $ref->newInstanceWithoutConstructor();
            $name = $prop->getValue($inst);
            if ($name) $map[$name] = $cls;
        }
        return $map;
    }
}
