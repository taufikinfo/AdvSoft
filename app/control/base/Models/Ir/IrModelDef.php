<?php

namespace Addons\Base\Models\Ir;

use App\Model\Ir\IrModel;
use App\Odoo\Field;
use App\Odoo\ModelDefinition;

class IrModelDef extends ModelDefinition
{
    public string $_name = 'ir.model';
    public string $_description = 'Models Registry';
    public string $_table = 'ir_model';
    public string $_rec_name = 'name';
    public string $modelClass = IrModel::class;

    protected function defineFields(): void
    {
        $this->addField('model', Field::CHAR, ['string' => 'Model Name', 'required' => true, 'unique' => true]);
        $this->addField('name', Field::CHAR, ['string' => 'Label', 'required' => true]);
        $this->addField('module', Field::CHAR, ['string' => 'Module', 'default' => 'AdvSoft']);
        $this->addField('description', Field::TEXT, ['string' => 'Description']);
        $this->addField('transient', Field::BOOLEAN, ['string' => 'Transient', 'default' => false]);
    }

    protected function defineViews(): void
    {
        $this->listView = ['type' => 'list', 'fields' => ['name', 'model', 'module', 'transient']];
        $this->formView = [
            'type' => 'form',
            'groups' => [[[ 'name', 'model', 'module'], ['description', 'transient']]],
        ];
    }
}
