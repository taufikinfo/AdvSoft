<?php

namespace Addons\Base\Models\Ir;

use App\Model\Ir\IrUiView;
use App\Advsoft\Field;
use App\Advsoft\ModelDefinition;

/**
 * IrUiViewDef – Odoo ir.ui.view equivalent for views storage and customization.
 */
class IrUiViewDef extends ModelDefinition
{
    public string $_name = 'ir.ui.view';
    public string $_description = 'View Definitions';
    public string $_table = 'ir_ui_views';
    public string $_order = 'priority asc, id asc';
    public string $_rec_name = 'name';
    public string $modelClass = IrUiView::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, [
            'string' => 'View Name',
            'required' => true,
            'searchable' => true,
        ]);

        $this->addField('model', Field::CHAR, [
            'string' => 'Model',
            'required' => true,
            'searchable' => true,
        ]);

        $this->addField('type', Field::SELECTION, [
            'string' => 'View Type',
            'selection' => [
                ['list', 'List'],
                ['form', 'Form'],
                ['kanban', 'Kanban'],
                ['calendar', 'Calendar'],
                ['graph', 'Graph'],
                ['pivot', 'Pivot'],
                ['qweb', 'QWeb'],
                ['spreadsheet', 'Spreadsheet'],
            ],
            'default' => 'list',
        ]);

        $this->addField('arch', Field::TEXT, [
            'string' => 'Architecture',
        ]);

        $this->addField('priority', Field::INTEGER, [
            'string' => 'Priority',
            'default' => 16,
            'sortable' => true,
        ]);

        $this->addField('active', Field::BOOLEAN, [
            'string' => 'Active',
            'default' => true,
            'sortable' => true,
        ]);

        $this->addField('key', Field::CHAR, [
            'string' => 'Key',
        ]);

        $this->addField('inherit_id', Field::INTEGER, [
            'string' => 'Inherit ID',
        ]);

        $this->addField('primary', Field::BOOLEAN, [
            'string' => 'Primary',
            'default' => false,
        ]);
    }

    protected function defineViews(): void
    {
        $this->listView = [
            'fields' => ['name', 'model', 'type', 'priority', 'active'],
            'default_order' => 'priority asc',
        ];

        $this->formView = [
            'title' => 'name',
            'groups' => [
                [
                    ['name', 'model', 'type', 'priority'],
                    ['active', 'key', 'inherit_id', 'primary'],
                ],
                [
                    ['arch'],
                ],
            ],
        ];
    }
}
