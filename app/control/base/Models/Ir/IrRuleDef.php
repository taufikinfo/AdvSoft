<?php

namespace Addons\Base\Models\Ir;

use App\Model\Ir\IrRule;
use App\Odoo\Field;
use App\Odoo\ModelDefinition;

class IrRuleDef extends ModelDefinition
{
    public string $_name = 'ir.rule';
    public string $_description = 'Record Rules';
    public string $_table = 'ir_rule';
    public string $_rec_name = 'name';
    public string $modelClass = IrRule::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, ['string' => 'Name', 'required' => true]);
        $this->addField('model_id', Field::MANY2ONE, [
            'string' => 'Model',
            'relation' => 'ir.model',
            'required' => true,
        ]);
        $this->addField('domain_force', Field::CHAR, [
            'string' => 'Domain',
            'required' => true,
            'widget' => 'domain',
            'help' => "Odoo domain syntax e.g. [('user_id','=',__user_id__),('company_id','=',__company_id__)]",
        ]);
        $this->addField('global', Field::BOOLEAN, [
            'string' => 'Global',
            'default' => false,
            'help' => 'Applies to all users regardless of groups',
        ]);
        $this->addField('groups', Field::MANY2MANY, [
            'string' => 'Groups',
            'relation' => 'res.groups',
            'relation_table' => 'ir_rule_groups_rel',
            'column1' => 'rule_id',
            'column2' => 'group_id',
        ]);
        $this->addField('perm_read',   Field::BOOLEAN, ['string' => 'Read',   'default' => true]);
        $this->addField('perm_write',  Field::BOOLEAN, ['string' => 'Write',  'default' => false]);
        $this->addField('perm_create', Field::BOOLEAN, ['string' => 'Create', 'default' => false]);
        $this->addField('perm_unlink', Field::BOOLEAN, ['string' => 'Delete', 'default' => false]);
        $this->addField('active', Field::BOOLEAN, ['string' => 'Active', 'default' => true]);
    }

    protected function defineViews(): void
    {
        $this->listView = [
            'type' => 'list',
            'fields' => ['name', 'model_id', 'global', 'perm_read', 'perm_write', 'perm_create', 'perm_unlink', 'active'],
        ];
        $this->formView = [
            'type' => 'form',
            'groups' => [[
                ['name', 'model_id', 'active'],
                ['global', 'perm_read', 'perm_write', 'perm_create', 'perm_unlink'],
            ]],
            'tabs' => [
                ['name' => 'domain', 'label' => 'Domain', 'type' => 'field', 'field' => 'domain_force'],
                ['name' => 'groups', 'label' => 'Groups', 'type' => 'field', 'field' => 'groups'],
            ],
        ];
    }
}
