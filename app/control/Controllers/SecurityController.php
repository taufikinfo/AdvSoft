<?php

namespace App\Control\Controllers;

use App\Model\Ir\IrModel;
use App\Model\Ir\IrModelAccess;
use App\Model\Ir\IrRule;
use App\Model\Res\ResCompany;
use App\Model\Res\ResGroup;
use App\Model\Res\ResGroupsCategory;
use App\Model\Res\ResUser;
use App\Advsoft\Registry;
use App\Advsoft\Security\SecurityContext;
use App\Advsoft\Security\SecurityService;
use App\Advsoft\Core\Http\Request;
use App\Advsoft\Core\Http\JsonResponse;
use Adianti\Database\TTransaction;

/**
 * SecurityController — admin UI for Odoo-style access rights management.
 */
class SecurityController extends Controller
{
    public function __construct(
        protected SecurityContext $ctx,
        protected SecurityService $security,
    ) {}

    private function authorizeAdmin(): void
    {
        $user = $this->ctx->getUser();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }
        if ($user->id !== 1 && !$user->hasGroup('base.group_system')) {
            abort(403, 'Only Security Administrators may use this endpoint.');
        }
    }

    /**
     * GET /api/security/overview
     */
    public function overview(): JsonResponse
    {
        $this->authorizeAdmin();

        $users = ResUser::all();
        $topUsers = [];
        foreach ($users as $u) {
            $groupCount = count($u->getDirectGroupIds());
            $topUsers[] = [
                'id'          => $u->id,
                'name'        => $u->name ?: $u->login,
                'login'       => $u->login,
                'email'       => $u->email,
                'group_count' => $groupCount,
                'is_admin'    => (bool) $u->isAdmin(),
            ];
        }

        $modelsCount = IrModel::count();
        $aclsCount = IrModelAccess::count();
        $rulesCount = IrRule::count();
        $groupsCount = ResGroup::count();
        $usersCount = count($users);

        return new JsonResponse([
            'counts' => [
                'users'        => $usersCount,
                'groups'       => $groupsCount,
                'models'       => $modelsCount,
                'acl_rules'    => $aclsCount,
                'record_rules' => $rulesCount,
            ],
            'top_users'    => $topUsers,
            'models_count' => $modelsCount,
            'acls_count'   => $aclsCount,
            'rules_count'  => $rulesCount,
            'groups_count' => $groupsCount,
            'users_count'  => $usersCount,
        ]);
    }

    /**
     * GET /api/security/acl/matrix
     */
    public function aclMatrix(Request $request): JsonResponse
    {
        $this->authorizeAdmin();

        $models = IrModel::all()->sortBy('name')->values();
        $groups = ResGroup::all()->sortBy('name')->values();
        $acls   = IrModelAccess::all();

        $cells = [];
        foreach ($acls as $acl) {
            $key = ($acl->model_id ?? 0) . ':' . ($acl->group_id ?? 0);
            $cells[$key] = [
                'id'       => $acl->id,
                'group_id' => $acl->group_id,
                'model_id' => $acl->model_id,
                'r'        => (bool) $acl->perm_read,
                'w'        => (bool) $acl->perm_write,
                'c'        => (bool) $acl->perm_create,
                'u'        => (bool) $acl->perm_unlink,
                'active'   => (bool) $acl->active,
            ];
        }

        return new JsonResponse([
            'models' => $models->toArray(),
            'groups' => $groups->toArray(),
            'cells'  => (object) $cells,
            'matrix' => (object) $cells,
        ]);
    }

    /**
     * POST /api/security/acl/toggle
     */
    public function toggleAcl(Request $request): JsonResponse
    {
        $this->authorizeAdmin();

        $data = $request->validate([
            'model_id' => 'required',
            'group_id' => 'present',
            'perm'     => 'required',
        ]);

        $modelId = $data['model_id'];
        $groupId = $data['group_id'] ?: null;
        $perm    = $data['perm'];

        $query = IrModelAccess::where('model_id', '=', $modelId);
        if ($groupId) {
            $query->where('group_id', '=', $groupId);
        } else {
            $query->where(function ($q) {
                $q->whereNull('group_id')->orWhere('group_id', '=', 0);
            });
        }
        $acl = $query->first();

        if (!$acl) {
            $acl = new IrModelAccess();
            $acl->model_id = $modelId;
            $acl->group_id = $groupId;
            $acl->name = 'ACL ' . $modelId . '/' . ($groupId ?: 'all');
            $acl->active = 1;
            $acl->perm_read = 0;
            $acl->perm_write = 0;
            $acl->perm_create = 0;
            $acl->perm_unlink = 0;
        }

        $col = match ($perm) {
            'r' => 'perm_read',
            'w' => 'perm_write',
            'c' => 'perm_create',
            'u' => 'perm_unlink',
            default => 'perm_read',
        };

        $acl->$col = $acl->$col ? 0 : 1;
        $acl->save();

        return new JsonResponse([
            'success' => true,
            'acl_id'  => $acl->id,
            'perm'    => $perm,
            'value'   => (bool) $acl->$col,
            'cell'    => [
                'id'       => $acl->id,
                'group_id' => $acl->group_id,
                'model_id' => $acl->model_id,
                'r'        => (bool) $acl->perm_read,
                'w'        => (bool) $acl->perm_write,
                'c'        => (bool) $acl->perm_create,
                'u'        => (bool) $acl->perm_unlink,
                'active'   => (bool) $acl->active,
            ],
        ]);
    }

    /**
     * POST /api/security/sync-models
     */
    public function syncModels(): JsonResponse
    {
        $this->authorizeAdmin();

        $models = Registry::all();
        $gAdmin = ResGroup::where('name', 'Administration / System Admin')->first();
        $gManager = ResGroup::where('name', 'Project / Manager')->first();
        $gUser = ResGroup::where('name', 'Project / User')->first();

        foreach ($models as $name => $def) {
            $desc = $def->_description ?: class_basename($def);
            $module = method_exists($def, 'getModule') ? $def->getModule() : ($def->_module ?? 'AdvSoft');
            $irModel = IrModel::where('model', $name)->first();
            if (!$irModel) {
                $irModel = IrModel::create([
                    'model'  => $name,
                    'name'   => $desc,
                    'module' => $module,
                ]);
            }

            // Admin default full access
            if ($gAdmin) {
                $acl = IrModelAccess::where('model_id', $irModel->id)->where('group_id', $gAdmin->id)->first();
                if (!$acl) {
                    IrModelAccess::create([
                        'name'        => "admin.full.$name",
                        'model_id'    => $irModel->id,
                        'group_id'    => $gAdmin->id,
                        'perm_read'   => 1,
                        'perm_write'  => 1,
                        'perm_create' => 1,
                        'perm_unlink' => 1,
                        'active'      => 1,
                    ]);
                }
            }

            // Manager default business access
            if ($gManager) {
                $isSecurity = str_starts_with($name, 'res.') || str_starts_with($name, 'ir.');
                $isBusiness = !$isSecurity;
                $acl = IrModelAccess::where('model_id', $irModel->id)->where('group_id', $gManager->id)->first();
                if (!$acl) {
                    IrModelAccess::create([
                        'name'        => "manager.access.$name",
                        'model_id'    => $irModel->id,
                        'group_id'    => $gManager->id,
                        'perm_read'   => 1,
                        'perm_write'  => $isBusiness ? 1 : 0,
                        'perm_create' => $isBusiness ? 1 : 0,
                        'perm_unlink' => $isBusiness ? 1 : 0,
                        'active'      => 1,
                    ]);
                }
            }

            // User default business access
            if ($gUser) {
                $isSecurity = str_starts_with($name, 'res.') || str_starts_with($name, 'ir.');
                $isBusiness = !$isSecurity;
                $acl = IrModelAccess::where('model_id', $irModel->id)->where('group_id', $gUser->id)->first();
                if (!$acl) {
                    IrModelAccess::create([
                        'name'        => "user.access.$name",
                        'model_id'    => $irModel->id,
                        'group_id'    => $gUser->id,
                        'perm_read'   => 1,
                        'perm_write'  => $isBusiness ? 1 : 0,
                        'perm_create' => $isBusiness ? 1 : 0,
                        'perm_unlink' => $isBusiness ? 1 : 0,
                        'active'      => 1,
                    ]);
                }
            }
        }

        return new JsonResponse([
            'success'     => true,
            'discovered'  => count($models),
            'in_database' => IrModel::count(),
        ]);
    }

    /**
     * GET /api/security/groups/{id}/users
     */
    public function groupUsers(int $id): JsonResponse
    {
        $this->authorizeAdmin();
        $group = ResGroup::findOrFail($id);

        TTransaction::open('advsoft');
        $conn = TTransaction::get();
        $stmt = $conn->prepare("SELECT user_id FROM res_users_groups_rel WHERE group_id = :gid");
        $stmt->execute([':gid' => $id]);
        $directIds = $stmt->fetchAll(\PDO::FETCH_COLUMN) ?: [];

        $stmt = $conn->prepare("SELECT implied_id FROM res_groups_implied_rel WHERE group_id = :gid");
        $stmt->execute([':gid' => $id]);
        $impliedIds = $stmt->fetchAll(\PDO::FETCH_COLUMN) ?: [];

        $allUserIds = array_unique(array_merge($directIds, $impliedIds));
        $users = [];
        foreach ($allUserIds as $uid) {
            $u = ResUser::find($uid);
            if ($u) {
                $users[] = [
                    'id'       => $u->id,
                    'login'    => $u->login,
                    'name'     => $u->name,
                    'email'    => $u->email,
                    'active'   => (bool) $u->active,
                    'via'      => in_array($u->id, $directIds) ? 'direct' : 'implied',
                ];
            }
        }

        return new JsonResponse([
            'group' => ['id' => $group->id, 'name' => $group->name],
            'users' => $users,
            'direct_count'  => count($directIds),
            'implied_count' => count($impliedIds),
        ]);
    }

    /**
     * POST /api/security/users/{id}/password
     */
    public function resetPassword(Request $request, int $id): JsonResponse
    {
        $this->authorizeAdmin();
        $target = ResUser::findOrFail($id);

        $data = $request->validate([
            'password' => 'required',
        ]);

        $target->password = password_hash($data['password'], PASSWORD_BCRYPT);
        $target->save();

        error_log("Admin password reset: admin_id=" . $this->ctx->getUserId() . " target_id=" . $target->id);

        return new JsonResponse(['success' => true]);
    }

    /**
     * POST /api/security/users/{id}/groups
     */
    public function setUserGroups(Request $request, int $id): JsonResponse
    {
        $this->authorizeAdmin();
        $target = ResUser::findOrFail($id);

        $data = $request->validate([
            'group_ids' => 'present',
        ]);

        TTransaction::open('advsoft');
        $conn = TTransaction::get();
        $stmt = $conn->prepare("DELETE FROM res_users_groups_rel WHERE user_id = :uid");
        $stmt->execute([':uid' => $target->id]);
        
        $stmt = $conn->prepare("INSERT INTO res_users_groups_rel (user_id, group_id) VALUES (:uid, :gid)");
        foreach ($data['group_ids'] ?? [] as $gid) {
            $stmt->execute([':uid' => $target->id, ':gid' => (int)$gid]);
        }

        return new JsonResponse([
            'success'   => true,
            'group_ids' => $data['group_ids'],
        ]);
    }

    /**
     * POST /api/security/users
     */
    public function createUser(Request $request): JsonResponse
    {
        $this->authorizeAdmin();

        $data = $request->validate([
            'login'    => 'required',
            'password' => 'required',
        ]);

        $user = ResUser::create([
            'login'      => $data['login'],
            'name'       => $data['name'] ?? $data['login'],
            'email'      => $data['email'] ?? null,
            'password'   => password_hash($data['password'], PASSWORD_BCRYPT),
            'company_id' => $data['company_id'] ?? 1,
            'active'     => 1,
        ]);

        if (!empty($data['group_ids'])) {
            TTransaction::open('advsoft');
            $conn = TTransaction::get();
            $stmt = $conn->prepare("INSERT INTO res_users_groups_rel (user_id, group_id) VALUES (:uid, :gid)");
            foreach ($data['group_ids'] as $gid) {
                $stmt->execute([':uid' => $user->id, ':gid' => (int)$gid]);
            }
        }

        return response()->json(['success' => true, 'id' => $user->id]);
    }

    // ════════════════════════════════════════════════════════════════
    //  DIAGNOSTICS — what access does a user effectively have?
    // ════════════════════════════════════════════════════════════════

    /**
     * GET /api/security/diagnostics?user_id=1
     * Returns: { user, groups, model_access: { model: {r,w,c,u} } }
     */
    public function diagnostics(Request $request)
    {
        $this->authorizeAdmin();

        $data = $request->validate([
            'user_id' => 'required|integer|exists:res_users,id',
        ]);

        $user = ResUser::findOrFail($data['user_id']);
        $userGroups = $user->getAllGroups();
        $userGroupIds = $user->getGroupIds();
        $isSuper = $user->isAdmin();

        TTransaction::open('advsoft');
        $models = IrModel::all();
        $acls = IrModelAccess::all();
        $userGroupIds = $user->getDirectGroupIds();

        $modelAccess = [];
        foreach ($models as $m) {
            $effective = ['r' => false, 'w' => false, 'c' => false, 'u' => false];
            foreach ($acls as $a) {
                if ($a->model_id == $m->id && (empty($a->group_id) || in_array($a->group_id, $userGroupIds))) {
                    if ($a->perm_read)   $effective['r'] = true;
                    if ($a->perm_write)  $effective['w'] = true;
                    if ($a->perm_create) $effective['c'] = true;
                    if ($a->perm_unlink) $effective['u'] = true;
                }
            }
            $modelAccess[$m->model] = $effective;
        }

        return new JsonResponse([
            'user' => [
                'id'     => $user->id,
                'login'  => $user->login,
                'name'   => $user->name,
                'email'  => $user->email,
                'active' => (bool) $user->active,
                'is_superuser' => $user->id === 1,
            ],
            'groups' => array_map(fn($g) => ['id' => $g->id, 'name' => $g->name], $userGroups),
            'model_access' => $modelAccess,
            'record_rules' => [],
        ]);
    }
}
