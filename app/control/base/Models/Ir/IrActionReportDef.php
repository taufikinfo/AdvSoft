<?php

namespace Addons\Base\Models\Ir;

use App\Odoo\Field;
use App\Odoo\ModelDefinition;

class IrActionReportDef extends ModelDefinition
{
    public string $_name = 'ir.actions.report';
    public string $_description = 'Report Action';
    public string $_table = 'ir_act_report_xml';
    public string $modelClass = \App\Model\Ir\IrActionReport::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, [
            'string' => 'Name',
            'required' => true,
        ]);
        
        $this->addField('model', Field::CHAR, [
            'string' => 'Model',
            'required' => true,
        ]);
        
        $this->addField('report_type', Field::SELECTION, [
            'string' => 'Report Type',
            'selection' => [
                ['qweb-pdf', 'PDF'],
                ['qweb-html', 'HTML']
            ],
            'required' => true,
            'default' => 'qweb-pdf'
        ]);
        
        $this->addField('report_name', Field::CHAR, [
            'string' => 'Template Name',
            'required' => true,
        ]);
        
        $this->addField('print_report_name', Field::CHAR, [
            'string' => 'Printed Report Name',
        ]);
    }
}
