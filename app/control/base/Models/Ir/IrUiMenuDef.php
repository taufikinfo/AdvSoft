<?php

namespace Addons\Base\Models\Ir;

use App\Models\Menu;
use App\Odoo\Field;
use App\Odoo\ModelDefinition;

/**
 * IrUiMenuDef – Odoo ir.ui.menu equivalent.
 *
 * This model definition makes the menus table editable through the
 * standard ORM/ListView/FormView pipeline, enabling a fully dynamic
 * Menu Editor (Settings → Technical → Menu Items).
 */
class IrUiMenuDef extends ModelDefinition
{
    public string $_name = 'ir.ui.menu';
    public string $_description = 'Menu Items';
    public string $_table = 'menus';
    public string $_order = 'sequence asc, id asc';
    public string $_rec_name = 'name';
    public string $modelClass = Menu::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, [
            'string' => 'Menu Name',
            'required' => true,
            'searchable' => true,
        ]);

        $this->addField('parent_id', Field::MANY2ONE, [
            'string' => 'Parent Menu',
            'relation' => 'ir.ui.menu',
            'searchable' => true,
            'sortable' => true,
        ]);

        $this->addField('action_id', Field::MANY2ONE, [
            'string' => 'Action',
            'relation' => 'ir.action',
            'sortable' => true,
        ]);

        $this->addField('model', Field::CHAR, [
            'string' => 'Model',
            'searchable' => true,
        ]);

        $this->addField('view_type', Field::SELECTION, [
            'string' => 'View Type',
            'selection' => [
                ['list', 'List'],
                ['form', 'Form'],
                ['kanban', 'Kanban'],
                ['calendar', 'Calendar'],
                ['graph', 'Graph'],
                ['pivot', 'Pivot'],
            ],
            'default' => 'list',
        ]);

        $this->addField('sequence', Field::INTEGER, [
            'string' => 'Sequence',
            'default' => 10,
            'sortable' => true,
        ]);

        $this->addField('icon', Field::CHAR, [
            'string' => 'Icon (Lucide)',
        ]);

        $this->addField('web_icon', Field::CHAR, [
            'string' => 'App Icon',
        ]);

        $this->addField('web_icon_color', Field::CHAR, [
            'string' => 'Icon Color',
            'widget' => 'color',
        ]);

        $this->addField('active', Field::BOOLEAN, [
            'string' => 'Active',
            'default' => true,
            'sortable' => true,
        ]);

        $this->addField('groups', Field::CHAR, [
            'string' => 'Groups (names)',
        ]);

        $this->addField('group_ids', Field::CHAR, [
            'string' => 'Group IDs',
        ]);

        $this->addField('security_view', Field::CHAR, [
            'string' => 'Security View',
        ]);

        // Computed: full path breadcrumb
        $this->addField('complete_name', Field::COMPUTED, [
            'string' => 'Full Path',
            'compute' => 'computeCompleteName',
            'store' => false,
            'searchable' => false,
        ]);
    }

    /**
     * Compute the complete hierarchical name (e.g. "Project / Tasks").
     */
    public function computeCompleteName($record, $result): string
    {
        $parts = [$record->name];
        $current = $record;
        $limit = 10; // safety
        while ($current->parent_id && --$limit > 0) {
            $parent = Menu::find($current->parent_id);
            if (!$parent) break;
            array_unshift($parts, $parent->name);
            $current = $parent;
        }
        return implode(' / ', $parts);
    }

    protected function defineViews(): void
    {
        $this->listView = [
            'fields' => ['sequence', 'complete_name', 'name', 'parent_id', 'action_id', 'model', 'icon', 'active'],
            'default_order' => 'sequence asc',
            'column_config' => [
                'sequence' => ['width' => '60px'],
                'complete_name' => ['width' => '300px'],
                'active' => ['width' => '70px'],
            ],
        ];

        $this->formView = [
            'title' => 'name',
            'groups' => [
                [
                    ['name', 'parent_id', 'sequence'],
                    ['action_id', 'model', 'view_type'],
                ],
                [
                    ['icon', 'web_icon', 'web_icon_color'],
                    ['active', 'groups', 'group_ids'],
                ],
            ],
        ];

        $this->searchView = [
            'filters' => [
                ['name' => 'active', 'string' => 'Active', 'domain' => [['active', '=', true]]],
                ['name' => 'inactive', 'string' => 'Inactive', 'domain' => [['active', '=', false]]],
                ['name' => 'root_menus', 'string' => 'Root Menus', 'domain' => [['parent_id', '=', null]]],
            ],
            'group_by' => [
                ['name' => 'parent_id', 'string' => 'Parent Menu'],
            ],
        ];
    }
}
