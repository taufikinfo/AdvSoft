<?php

namespace Addons\Base\Models\Res;

use App\Model\Res\ResUser;
use App\Odoo\Field;
use App\Odoo\ModelDefinition;

class ResUserDef extends ModelDefinition
{
    public string $_name = 'res.users';
    public string $_description = 'Users';
    public string $_table = 'res_users';
    public string $_rec_name = 'name';
    public string $modelClass = ResUser::class;

    protected function defineFields(): void
    {
        $this->addField('login', Field::CHAR, ['string' => 'Login', 'required' => true, 'unique' => true]);
        $this->addField('name', Field::CHAR, ['string' => 'Name']);
        $this->addField('email', Field::CHAR, ['string' => 'Email', 'widget' => 'email']);
        $this->addField('password', Field::CHAR, ['string' => 'Password', 'widget' => 'password']);
        $this->addField('partner_id', Field::MANY2ONE, [
            'string' => 'Partner',
            'relation' => 'res.partner',
        ]);
        $this->addField('company_id', Field::MANY2ONE, [
            'string' => 'Company',
            'relation' => 'res.company',
        ]);
        $this->addField('active', Field::BOOLEAN, ['string' => 'Active', 'default' => true]);
        $this->addField('share', Field::BOOLEAN, ['string' => 'Portal User', 'default' => false]);
        $this->addField('signature', Field::TEXT, ['string' => 'Signature']);
        $this->addField('last_login_at', Field::DATETIME, ['string' => 'Last Login', 'readonly' => true]);
        $this->addField('last_login_ip', Field::CHAR, ['string' => 'Last IP', 'readonly' => true]);
        $this->addField('groups_id', Field::MANY2MANY, [
            'string' => 'Groups',
            'relation' => 'res.groups',
            'relation_table' => 'res_users_groups_rel',
            'column1' => 'user_id',
            'column2' => 'group_id',
        ]);
    }

    protected function defineViews(): void
    {
        $this->listView = ['type' => 'list', 'fields' => ['name', 'login', 'email', 'company_id', 'active']];
        $this->formView = [
            'type' => 'form',
            'groups' => [[
                ['name', 'login', 'email'],
                ['company_id', 'partner_id', 'active', 'share'],
            ]],
            'tabs' => [
                ['name' => 'groups',  'label' => 'Groups',     'type' => 'field', 'field' => 'groups_id'],
                ['name' => 'security','label' => 'Security',   'type' => 'field', 'field' => 'password'],
                ['name' => 'history', 'label' => 'History',    'type' => 'field', 'field' => 'last_login_at'],
            ],
        ];
        $this->searchView = [
            'filters' => [
                ['name' => 'Active',   'domain' => ['active', '=', true]],
                ['name' => 'Inactive', 'domain' => ['active', '=', false]],
                ['name' => 'Portal',   'domain' => ['share', '=', true]],
            ],
        ];
    }
}
