<?php

namespace Addons\Base\Models\Res;

use App\Model\Res\ResUser;
use App\Advsoft\Field;
use App\Advsoft\ModelDefinition;

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

    public function transformRecord(object $record, ?array $fieldNames = null): array
    {
        $data = parent::transformRecord($record, $fieldNames);
        $data['password'] = ''; // Never expose password hash to frontend
        return $data;
    }

    protected function beforeCreate(array &$vals): void
    {
        if (!empty($vals['password'])) {
            $vals['password'] = password_hash($vals['password'], PASSWORD_BCRYPT);
        }
    }

    protected function beforeWrite(object $record, array &$vals): void
    {
        if (array_key_exists('password', $vals)) {
            if (empty($vals['password']) || $vals['password'] === $record->password) {
                unset($vals['password']);
            } else if (!str_starts_with($vals['password'], '$2y$')) {
                $vals['password'] = password_hash($vals['password'], PASSWORD_BCRYPT);
            }
        }
    }

    public function action_change_password(ResUser $record): array
    {
        return [
            'type' => 'ir.actions.client',
            'tag' => 'change_password_dialog',
            'params' => [
                'user_id' => $record->id,
                'user_name' => $record->name,
                'user_login' => $record->login,
            ]
        ];
    }

    protected function defineViews(): void
    {
        $this->listView = ['type' => 'list', 'fields' => ['name', 'login', 'email', 'company_id', 'active']];
        $this->formView = [
            'type' => 'form',
            'header_buttons' => [
                [
                    'name'   => 'action_change_password',
                    'type'   => 'object',
                    'string' => 'Change Password',
                    'class'  => 'ls-btn-secondary',
                    'icon'   => 'key',
                ],
            ],
            'groups' => [[
                ['name', 'login', 'email'],
                ['company_id', 'partner_id', 'active', 'share'],
            ]],
            'tabs' => [
                ['name' => 'groups',   'label' => 'Groups',   'type' => 'field', 'field' => 'groups_id'],
                ['name' => 'security', 'label' => 'Security', 'type' => 'field', 'field' => 'password'],
                ['name' => 'history',  'label' => 'History',  'type' => 'field', 'field' => 'last_login_at'],
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
