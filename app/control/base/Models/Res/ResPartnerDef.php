<?php

namespace Addons\Base\Models\Res;

use App\Model\Res\ResPartner;
use App\Advsoft\Field;
use App\Advsoft\ModelDefinition;

class ResPartnerDef extends ModelDefinition
{
    public string $_name = 'res.partner';
    public string $_description = 'Contact / Partner';
    public string $_table = 'res_partner';
    public string $_rec_name = 'name';
    public string $modelClass = ResPartner::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, ['string' => 'Name', 'required' => true]);
        $this->addField('email', Field::CHAR, ['string' => 'Email', 'widget' => 'email']);
        $this->addField('phone', Field::CHAR, ['string' => 'Phone', 'widget' => 'phone']);
        $this->addField('image', Field::CHAR, ['string' => 'Avatar', 'widget' => 'image_url']);
        $this->addField('is_company', Field::BOOLEAN, ['string' => 'Is a Company']);
        $this->addField('active', Field::BOOLEAN, ['string' => 'Active', 'default' => true]);
        $this->addField('type', Field::SELECTION, [
            'string' => 'Address Type',
            'selection' => [
                ['contact', 'Contact'],
                ['invoice', 'Invoice Address'],
                ['delivery', 'Delivery Address'],
                ['private', 'Private Address'],
            ],
            'default' => 'contact',
        ]);
    }

    protected function defineViews(): void
    {
        $this->listView = [
            'type' => 'list',
            'fields' => ['name', 'email', 'phone', 'is_company', 'type', 'active'],
        ];
        $this->formView = [
            'type' => 'form',
            'groups' => [[
                ['name', 'image', 'type'],
                ['email', 'phone', 'is_company', 'active'],
            ]],
        ];
    }
}
