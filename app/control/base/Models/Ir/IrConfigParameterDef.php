<?php

namespace Addons\Base\Models\Ir;

use App\Model\Ir\IrConfigParameter;
use App\Advsoft\{ModelDefinition, Field};

/**
 * IrConfigParameterDef — System Parameters (key-value store).
 * 
 * AdvSoft equivalent: ir.config_parameter
 * Provides centralized configuration accessible from:
 *   - Backend: IrConfigParameter::getParam('key')
 *   - Frontend: via Settings page
 *   - XML data files: <record model="ir.config_parameter">
 */
class IrConfigParameterDef extends ModelDefinition
{
    public string $_name = 'ir.config_parameter';
    public string $_description = 'System Parameters';
    public string $_table = 'ir_config_parameter';
    public string $_order = 'key asc';
    public string $_rec_name = 'key';
    public string $modelClass = IrConfigParameter::class;

    protected function defineFields(): void
    {
        $this->addField('key', Field::CHAR, [
            'string' => 'Key',
            'required' => true,
            'searchable' => true,
            'sortable' => true,
            'help' => 'Unique configuration key (e.g. web.base.url)',
        ]);

        $this->addField('value', Field::TEXT, [
            'string' => 'Value',
            'help' => 'Configuration value (stored as text)',
        ]);
    }

    protected function defineViews(): void
    {
        $this->listView = [
            'string' => 'System Parameters',
            'fields' => ['key', 'value'],
            'editable' => 'bottom',
            'column_config' => [
                'key' => ['width' => '300px'],
            ],
        ];

        $this->formView = [
            'title' => 'key',
            'groups' => [
                [
                    ['key'],
                    ['value'],
                ],
            ],
        ];

        $this->searchView = [
            'filters' => [
                ['name' => 'web_params', 'string' => 'Web Parameters', 'domain' => [['key', 'ilike', 'web.%']]],
                ['name' => 'report_params', 'string' => 'Report Parameters', 'domain' => [['key', 'ilike', 'report.%']]],
            ],
        ];
    }

    protected function defineSecurity(): void
    {
        $this->setAccess(['read' => true, 'write' => true, 'create' => true, 'unlink' => true]);
    }
}
