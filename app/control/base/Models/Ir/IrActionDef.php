<?php

namespace Addons\Base\Models\Ir;

use App\Model\Action;
use App\Advsoft\Field;
use App\Advsoft\ModelDefinition;

/**
 * IrActionDef – Odoo ir.actions.act_window equivalent.
 *
 * Makes the actions table manageable through the ORM pipeline,
 * enabling dynamic action creation/editing from the Menu Editor.
 */
class IrActionDef extends ModelDefinition
{
    public string $_name = 'ir.action';
    public string $_description = 'Window Actions';
    public string $_table = 'actions';
    public string $_order = 'name asc';
    public string $_rec_name = 'name';
    public string $modelClass = Action::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, [
            'string' => 'Action Name',
            'required' => true,
            'searchable' => true,
        ]);

        $this->addField('type', Field::SELECTION, [
            'string' => 'Action Type',
            'selection' => [
                ['ir.actions.act_window', 'Window Action'],
                ['ir.actions.client', 'Client Action'],
                ['ir.actions.report', 'Report Action'],
            ],
            'default' => 'ir.actions.act_window',
        ]);

        $this->addField('res_model', Field::CHAR, [
            'string' => 'Target Model',
            'required' => true,
            'searchable' => true,
        ]);

        $this->addField('view_mode', Field::CHAR, [
            'string' => 'View Modes',
            'default' => 'list,form',
        ]);

        $this->addField('domain', Field::TEXT, [
            'string' => 'Domain Filter',
            'widget' => 'text',
        ]);

        $this->addField('context', Field::TEXT, [
            'string' => 'Context',
            'widget' => 'text',
        ]);

        $this->addField('target', Field::SELECTION, [
            'string' => 'Target',
            'selection' => [
                ['current', 'Current Window'],
                ['new', 'New Dialog'],
                ['inline', 'Inline'],
            ],
            'default' => 'current',
        ]);

        $this->addField('limit', Field::INTEGER, [
            'string' => 'Page Limit',
            'default' => 80,
        ]);

        $this->addField('help', Field::TEXT, [
            'string' => 'Help Text',
        ]);
    }

    protected function defineViews(): void
    {
        $this->listView = [
            'fields' => ['name', 'type', 'res_model', 'view_mode', 'target'],
        ];

        $this->formView = [
            'title' => 'name',
            'groups' => [
                [
                    ['name', 'type', 'res_model'],
                    ['view_mode', 'target', 'limit'],
                ],
                [
                    ['domain'],
                    ['context'],
                ],
            ],
            'tabs' => [
                [
                    'name' => 'help_tab',
                    'label' => 'Help / Description',
                    'type' => 'group',
                    'groups_content' => [
                        [['help']],
                    ],
                ],
            ],
        ];

        $this->searchView = [
            'filters' => [
                ['name' => 'window', 'string' => 'Window Actions', 'domain' => [['type', '=', 'ir.actions.act_window']]],
            ],
        ];
    }
}
