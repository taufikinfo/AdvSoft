<?php

namespace Addons\Base\Models\Res;

use App\Model\Res\ResGroupsCategory;
use App\Advsoft\Field;
use App\Advsoft\ModelDefinition;

class ResGroupsCategoryDef extends ModelDefinition
{
    public string $_name = 'res.groups.category';
    public string $_description = 'Security Group Category';
    public string $_table = 'res_groups_category';
    public string $_rec_name = 'name';
    public string $modelClass = ResGroupsCategory::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, ['string' => 'Name', 'required' => true]);
        $this->addField('description', Field::CHAR, ['string' => 'Description']);
        $this->addField('sequence', Field::INTEGER, ['string' => 'Sequence', 'default' => 10]);
    }

    protected function defineViews(): void
    {
        $this->listView = ['type' => 'list', 'fields' => ['name', 'sequence']];
        $this->formView = ['type' => 'form', 'groups' => [[['name', 'sequence'], ['description']]]];
    }
}
