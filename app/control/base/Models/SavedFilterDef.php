<?php

namespace Addons\Base\Models;

use App\Models\SavedFilter;
use App\Odoo\{ModelDefinition, Field};

class SavedFilterDef extends ModelDefinition
{
    public string $_name = 'saved_filter';
    public string $_description = 'Saved Filter';
    public string $_table = 'saved_filters';
    public string $_order = 'name asc';
    public string $_rec_name = 'name';
    public string $modelClass = SavedFilter::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, ['string' => 'Filter Name', 'required' => true]);
        $this->addField('model_name', Field::CHAR, ['string' => 'Model', 'required' => true]);
        $this->addField('domain', Field::TEXT, ['string' => 'Domain']);
        $this->addField('group_by', Field::TEXT, ['string' => 'Group By']);
        $this->addField('order_by', Field::TEXT, ['string' => 'Order By']);
        $this->addField('is_default', Field::BOOLEAN, ['string' => 'Default', 'default' => false]);
        $this->addField('is_shared', Field::BOOLEAN, ['string' => 'Shared', 'default' => false]);
    }
}
