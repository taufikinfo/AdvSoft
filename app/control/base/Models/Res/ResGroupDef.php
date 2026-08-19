<?php

namespace Addons\Base\Models\Res;

use App\Models\Res\ResGroup;
use App\Odoo\Field;
use App\Odoo\ModelDefinition;

class ResGroupDef extends ModelDefinition
{
    public string $_name = 'res.groups';
    public string $_description = 'Security Groups';
    public string $_table = 'res_groups';
    public string $_rec_name = 'name';
    public string $modelClass = ResGroup::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, ['string' => 'Name', 'required' => true, 'unique' => true]);
        $this->addField('description', Field::CHAR, ['string' => 'Description']);
        $this->addField('category_id', Field::MANY2ONE, [
            'string' => 'Category',
            'relation' => 'res.groups.category',
        ]);
        $this->addField('share', Field::BOOLEAN, [
            'string' => 'Portal / Public',
            'help'  => 'External/portal users group',
            'default' => false,
        ]);
        $this->addField('implied_ids', Field::MANY2MANY, [
            'string'   => 'Implied Groups',
            'relation' => 'res.groups',
            'relation_table' => 'res_groups_implied_rel',
            'column1'  => 'group_id',
            'column2'  => 'implied_id',
            'help'     => 'Users in this group are automatically added to these groups',
        ]);
        $this->addField('users', Field::MANY2MANY, [
            'string'   => 'Users',
            'relation' => 'res.users',
            'relation_table' => 'res_users_groups_rel',
            'column1'  => 'group_id',
            'column2'  => 'user_id',
        ]);
    }

    protected function defineViews(): void
    {
        $this->listView = ['type' => 'list', 'fields' => ['name', 'category_id', 'share']];
        $this->formView = [
            'type' => 'form',
            'groups' => [[
                ['name', 'category_id', 'share'],
                ['description'],
            ]],
            'tabs' => [
                ['name' => 'implied', 'label' => 'Implied Groups', 'type' => 'field', 'field' => 'implied_ids'],
                ['name' => 'users',   'label' => 'Users',          'type' => 'field', 'field' => 'users'],
            ],
        ];
    }
}
