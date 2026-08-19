<?php

namespace Addons\Base\Models\Res;

use App\Models\Res\ResCompany;
use App\Odoo\Field;
use App\Odoo\ModelDefinition;

class ResCompanyDef extends ModelDefinition
{
    public string $_name = 'res.company';
    public string $_description = 'Company';
    public string $_table = 'res_company';
    public string $_rec_name = 'name';
    public string $modelClass = ResCompany::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, ['string' => 'Company Name', 'required' => true]);
        $this->addField('code', Field::CHAR, ['string' => 'Code', 'size' => 8]);
        $this->addField('email', Field::CHAR, ['string' => 'Email', 'widget' => 'email']);
        $this->addField('phone', Field::CHAR, ['string' => 'Phone', 'widget' => 'phone']);
        $this->addField('logo', Field::CHAR, ['string' => 'Logo URL', 'widget' => 'image_url']);
        $this->addField('currency_code', Field::CHAR, ['string' => 'Currency', 'default' => 'USD', 'size' => 8]);
        $this->addField('active', Field::BOOLEAN, ['string' => 'Active', 'default' => true]);
    }

    protected function defineViews(): void
    {
        $this->listView = [
            'type' => 'list',
            'fields' => ['name', 'code', 'currency_code', 'active'],
        ];
        $this->formView = [
            'type' => 'form',
            'groups' => [[
                ['name', 'code', 'currency_code'],
                ['email', 'phone', 'logo', 'active'],
            ]],
        ];
    }
}
