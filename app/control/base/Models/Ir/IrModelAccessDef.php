<?php

namespace Addons\Base\Models\Ir;

use App\Model\Ir\IrModelAccess;
use App\Odoo\Field;
use App\Odoo\ModelDefinition;

class IrModelAccessDef extends ModelDefinition
{
    public string $_name = 'ir.model.access';
    public string $_description = 'Model Access (ACL)';
    public string $_table = 'ir_model_access';
    public string $_rec_name = 'name';
    public string $modelClass = IrModelAccess::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, ['string' => 'Name']);
        $this->addField('model_id', Field::MANY2ONE, [
            'string' => 'Model',
            'relation' => 'ir.model',
            'required' => true,
        ]);
        $this->addField('group_id', Field::MANY2ONE, [
            'string' => 'Group',
            'relation' => 'res.groups',
            'help' => 'Leave empty to apply to everyone',
        ]);
        $this->addField('perm_read',   Field::BOOLEAN, ['string' => 'Read',   'default' => false]);
        $this->addField('perm_write',  Field::BOOLEAN, ['string' => 'Write',  'default' => false]);
        $this->addField('perm_create', Field::BOOLEAN, ['string' => 'Create', 'default' => false]);
        $this->addField('perm_unlink', Field::BOOLEAN, ['string' => 'Delete', 'default' => false]);
        $this->addField('active', Field::BOOLEAN, ['string' => 'Active', 'default' => true]);
    }

    protected function defineViews(): void
    {
        $this->listView = [
            'type' => 'list',
            'fields' => ['model_id', 'group_id', 'perm_read', 'perm_write', 'perm_create', 'perm_unlink', 'active'],
        ];
        $this->formView = [
            'type' => 'form',
            'groups' => [[
                ['model_id', 'group_id', 'active'],
                ['perm_read', 'perm_write', 'perm_create', 'perm_unlink'],
            ]],
        ];
    }
}
