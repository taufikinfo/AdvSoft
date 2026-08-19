<?php

namespace App\Http\Controllers;

use App\Models\Action;
use App\Models\Menu;
use App\Odoo\Registry;
use App\Odoo\Security\SecurityContext;
use App\Core\Http\JsonResponse;
use App\Core\Http\Request;

/**
 * MenuEditorController – Odoo-style Menu Editor API.
 *
 * Provides endpoints for the frontend MenuEditorView component:
 * - load_tree: Full menu tree with all metadata
 * - save_tree: Batch save reordered/modified tree
 * - create_menu: Create a new menu item
 * - update_menu: Update a single menu
 * - delete_menu: Delete a menu + cascade children
 * - move_menu: Move a menu to a new parent/position
 * - toggle_active: Enable/disable a menu
 * - available_models: List all registered models
 * - available_actions: List all actions for binding
 * - create_action: Create a new action inline
 */
class MenuEditorController extends Controller
{
    public function __construct(
        protected SecurityContext $ctx,
    ) {}

    /**
     * GET /api/menu-editor/tree
     * Load the full menu tree for editing.
     */
    public function loadTree(): JsonResponse
    {
        $this->requireAdmin();

        $menus = Menu::with(['action', 'children.action', 'children.children.action', 'children.children.children.action'])
            ->whereNull('parent_id')
            ->orderBy('sequence')
            ->get();

        return response()->json([
            'tree' => $this->buildEditorTree($menus),
            'stats' => [
                'total' => Menu::count(),
                'active' => Menu::where('active', true)->count(),
                'root' => Menu::whereNull('parent_id')->count(),
                'max_depth' => $this->calculateMaxDepth(),
            ],
        ]);
    }

    /**
     * POST /api/menu-editor/save-tree
     * Batch save the full menu tree (reorder + reparent).
     */
    public function saveTree(Request $request): JsonResponse
    {
        $this->requireAdmin();
        $tree = $request->input('tree', []);
        $this->persistTree($tree, null, 0);
        return response()->json(['success' => true, 'message' => 'Menu tree saved successfully']);
    }

    /**
     * POST /api/menu-editor/create
     * Create a new menu item.
     */
    public function createMenu(Request $request): JsonResponse
    {
        $this->requireAdmin();

        $data = $request->validate([
            'name'            => 'required|string|max:255',
            'parent_id'       => 'nullable|integer|exists:menus,id',
            'action_id'       => 'nullable|integer|exists:actions,id',
            'model'           => 'nullable|string|max:255',
            'view_type'       => 'nullable|string|max:50',
            'sequence'        => 'nullable|integer',
            'icon'            => 'nullable|string|max:100',
            'web_icon'        => 'nullable|string|max:100',
            'web_icon_color'  => 'nullable|string|max:50',
            'active'          => 'nullable|boolean',
            'groups'          => 'nullable|string',
            'group_ids'       => 'nullable|string',
            'security_view'   => 'nullable|string|max:100',
        ]);

        // Auto-assign sequence if not provided
        if (!isset($data['sequence'])) {
            $maxSeq = Menu::where('parent_id', $data['parent_id'] ?? null)->max('sequence');
            $data['sequence'] = ($maxSeq ?? 0) + 10;
        }

        $data['active'] = $data['active'] ?? true;

        $menu = Menu::create($data);
        $menu->load('action');

        return response()->json([
            'success' => true,
            'menu' => $this->formatMenuItem($menu),
        ]);
    }

    /**
     * PUT /api/menu-editor/update/{id}
     * Update a single menu item.
     */
    public function updateMenu(Request $request, int $id): JsonResponse
    {
        $this->requireAdmin();

        $menu = Menu::findOrFail($id);
        $data = $request->validate([
            'name'            => 'sometimes|string|max:255',
            'parent_id'       => 'nullable|integer',
            'action_id'       => 'nullable|integer',
            'model'           => 'nullable|string|max:255',
            'view_type'       => 'nullable|string|max:50',
            'sequence'        => 'nullable|integer',
            'icon'            => 'nullable|string|max:100',
            'web_icon'        => 'nullable|string|max:100',
            'web_icon_color'  => 'nullable|string|max:50',
            'active'          => 'nullable|boolean',
            'groups'          => 'nullable|string',
            'group_ids'       => 'nullable|string',
            'security_view'   => 'nullable|string|max:100',
        ]);

        // Prevent circular parent references
        if (isset($data['parent_id']) && $data['parent_id'] == $id) {
            return response()->json(['error' => 'A menu cannot be its own parent'], 422);
        }

        $menu->update($data);
        $menu->load('action');

        return response()->json([
            'success' => true,
            'menu' => $this->formatMenuItem($menu),
        ]);
    }

    /**
     * DELETE /api/menu-editor/delete/{id}
     * Delete a menu item and cascade children.
     */
    public function deleteMenu(int $id): JsonResponse
    {
        $this->requireAdmin();

        $menu = Menu::findOrFail($id);
        $childCount = $this->countDescendants($menu);

        // Cascade delete
        $menu->delete();

        return response()->json([
            'success' => true,
            'deleted' => 1 + $childCount,
        ]);
    }

    /**
     * POST /api/menu-editor/move
     * Move a menu to a new parent/position.
     */
    public function moveMenu(Request $request): JsonResponse
    {
        $this->requireAdmin();

        $menuId = $request->input('menu_id');
        $newParentId = $request->input('parent_id');
        $newSequence = $request->input('sequence', 10);

        $menu = Menu::findOrFail($menuId);

        // Prevent circular
        if ($newParentId == $menuId) {
            return response()->json(['error' => 'Cannot move menu to itself'], 422);
        }
        if ($newParentId && $this->isDescendant($menuId, $newParentId)) {
            return response()->json(['error' => 'Cannot move to a descendant'], 422);
        }

        $menu->update([
            'parent_id' => $newParentId,
            'sequence' => $newSequence,
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * POST /api/menu-editor/toggle-active
     * Toggle active/inactive state.
     */
    public function toggleActive(Request $request): JsonResponse
    {
        $this->requireAdmin();
        $id = $request->input('id');
        $menu = Menu::findOrFail($id);
        $menu->update(['active' => !$menu->active]);
        return response()->json([
            'success' => true,
            'active' => $menu->active,
        ]);
    }

    /**
     * POST /api/menu-editor/reorder
     * Reorder siblings after drag-drop.
     */
    public function reorder(Request $request): JsonResponse
    {
        $this->requireAdmin();

        $parentId = $request->input('parent_id');
        $orderedIds = $request->input('ordered_ids', []);

        $seq = 10;
        foreach ($orderedIds as $id) {
            Menu::where('id', $id)->update(['sequence' => $seq]);
            $seq += 10;
        }

        return response()->json(['success' => true]);
    }

    /**
     * GET /api/menu-editor/available-models
     * List all registered models for the action binding dropdown.
     */
    public function availableModels(): JsonResponse
    {
        $this->requireAdmin();
        $models = [];
        foreach (Registry::all() as $name => $def) {
            $models[] = [
                'value' => $name,
                'label' => $def->_description ?: ucfirst(str_replace('.', ' ', $name)),
            ];
        }
        usort($models, fn($a, $b) => strcmp($a['label'], $b['label']));
        return response()->json($models);
    }

    /**
     * GET /api/menu-editor/available-actions
     * List all actions for the menu-action binding.
     */
    public function availableActions(): JsonResponse
    {
        $this->requireAdmin();
        $actions = Action::orderBy('name')->get()->map(fn($a) => [
            'id' => $a->id,
            'name' => $a->name,
            'res_model' => $a->res_model,
            'view_mode' => $a->view_mode,
            'type' => $a->type,
        ]);
        return response()->json($actions);
    }

    /**
     * POST /api/menu-editor/create-action
     * Create a new action inline (from the menu editor).
     */
    public function createAction(Request $request): JsonResponse
    {
        $this->requireAdmin();

        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'res_model' => 'required|string|max:255',
            'view_mode' => 'nullable|string',
            'target'    => 'nullable|string',
            'limit'     => 'nullable|integer',
        ]);

        $data['view_mode'] = $data['view_mode'] ?? 'list,form';
        $data['type'] = 'ir.actions.act_window';
        $data['target'] = $data['target'] ?? 'current';
        $data['limit'] = $data['limit'] ?? 80;

        $action = Action::create($data);

        return response()->json([
            'success' => true,
            'action' => [
                'id' => $action->id,
                'name' => $action->name,
                'res_model' => $action->res_model,
                'view_mode' => $action->view_mode,
            ],
        ]);
    }

    /**
     * GET /api/menu-editor/export
     * Export menu tree as JSON (for backup/import).
     */
    public function exportTree(): JsonResponse
    {
        $this->requireAdmin();

        $menus = Menu::with(['action'])
            ->orderBy('parent_id')
            ->orderBy('sequence')
            ->get()
            ->map(fn($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'parent_id' => $m->parent_id,
                'action_name' => $m->action?->name,
                'action_model' => $m->action?->res_model,
                'action_view_mode' => $m->action?->view_mode,
                'model' => $m->model,
                'view_type' => $m->view_type,
                'sequence' => $m->sequence,
                'icon' => $m->icon,
                'web_icon' => $m->web_icon,
                'web_icon_color' => $m->web_icon_color,
                'active' => $m->active,
                'groups' => $m->groups,
                'security_view' => $m->security_view,
            ]);

        return response()->json($menus);
    }

    /**
     * POST /api/menu-editor/import
     * Import menus from exported JSON.
     */
    public function importTree(Request $request): JsonResponse
    {
        $this->requireAdmin();

        $items = $request->input('menus', []);
        $idMap = [];
        $created = 0;

        foreach ($items as $item) {
            // Create action if needed
            $actionId = null;
            if (!empty($item['action_model'])) {
                $action = Action::firstOrCreate(
                    ['name' => $item['action_name'] ?? $item['action_model'], 'res_model' => $item['action_model']],
                    ['view_mode' => $item['action_view_mode'] ?? 'list,form', 'type' => 'ir.actions.act_window']
                );
                $actionId = $action->id;
            }

            $parentId = null;
            if (!empty($item['parent_id']) && isset($idMap[$item['parent_id']])) {
                $parentId = $idMap[$item['parent_id']];
            }

            $menu = Menu::create([
                'name' => $item['name'],
                'parent_id' => $parentId,
                'action_id' => $actionId,
                'model' => $item['model'] ?? null,
                'view_type' => $item['view_type'] ?? null,
                'sequence' => $item['sequence'] ?? 10,
                'icon' => $item['icon'] ?? null,
                'web_icon' => $item['web_icon'] ?? null,
                'web_icon_color' => $item['web_icon_color'] ?? null,
                'active' => $item['active'] ?? true,
                'groups' => $item['groups'] ?? null,
                'security_view' => $item['security_view'] ?? null,
            ]);

            $idMap[$item['id']] = $menu->id;
            $created++;
        }

        return response()->json(['success' => true, 'created' => $created]);
    }

    // ════════════════════════════════════════════════
    //  Private helpers
    // ════════════════════════════════════════════════

    private function requireAdmin(): void
    {
        $user = $this->ctx->getUser();
        if (!$user || (!$user->isAdmin() && !$this->ctx->isSuperuser())) {
            abort(403, 'Admin access required for Menu Editor');
        }
    }

    private function buildEditorTree($menus): array
    {
        return $menus->map(fn($m) => $this->formatMenuItem($m))->values()->toArray();
    }

    private function formatMenuItem(Menu $menu): array
    {
        $item = [
            'id' => $menu->id,
            'name' => $menu->name,
            'parent_id' => $menu->parent_id,
            'sequence' => $menu->sequence,
            'icon' => $menu->icon,
            'web_icon' => $menu->web_icon,
            'web_icon_color' => $menu->web_icon_color,
            'active' => $menu->active,
            'groups' => $menu->groups,
            'group_ids' => $menu->group_ids,
            'security_view' => $menu->security_view,
            'model' => $menu->model,
            'view_type' => $menu->view_type,
            'action_id' => $menu->action_id,
            'action' => null,
        ];

        if ($menu->action) {
            $item['action'] = [
                'id' => $menu->action->id,
                'name' => $menu->action->name,
                'res_model' => $menu->action->res_model,
                'view_mode' => $menu->action->view_mode,
                'type' => $menu->action->type,
            ];
        }

        if ($menu->children && $menu->children->count() > 0) {
            $item['children'] = $this->buildEditorTree($menu->children);
        } else {
            $item['children'] = [];
        }

        return $item;
    }

    private function persistTree(array $items, ?int $parentId, int $baseSeq): void
    {
        foreach ($items as $i => $item) {
            $seq = $baseSeq + (($i + 1) * 10);
            Menu::where('id', $item['id'])->update([
                'parent_id' => $parentId,
                'sequence' => $seq,
                'name' => $item['name'] ?? null,
                'icon' => $item['icon'] ?? null,
                'web_icon' => $item['web_icon'] ?? null,
                'web_icon_color' => $item['web_icon_color'] ?? null,
                'active' => $item['active'] ?? true,
            ]);

            if (!empty($item['children'])) {
                $this->persistTree($item['children'], $item['id'], 0);
            }
        }
    }

    private function countDescendants(Menu $menu): int
    {
        $count = 0;
        foreach ($menu->children as $child) {
            $count += 1 + $this->countDescendants($child);
        }
        return $count;
    }

    private function isDescendant(int $ancestorId, int $candidateId): bool
    {
        $current = Menu::find($candidateId);
        $limit = 20;
        while ($current && --$limit > 0) {
            if ($current->parent_id == $ancestorId) return true;
            $current = $current->parent;
        }
        return false;
    }

    private function calculateMaxDepth(): int
    {
        $roots = Menu::whereNull('parent_id')->pluck('id');
        $maxDepth = 0;
        foreach ($roots as $rootId) {
            $depth = $this->treeDepth($rootId, 0);
            $maxDepth = max($maxDepth, $depth);
        }
        return $maxDepth;
    }

    private function treeDepth(int $id, int $current): int
    {
        $children = Menu::where('parent_id', $id)->pluck('id');
        if ($children->isEmpty()) return $current;
        $max = $current;
        foreach ($children as $childId) {
            $max = max($max, $this->treeDepth($childId, $current + 1));
        }
        return $max;
    }
}
