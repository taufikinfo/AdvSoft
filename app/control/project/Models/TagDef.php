<?php

namespace Addons\Project\Models;

use App\Model\Tag;
use App\Advsoft\{ModelDefinition, Field};

class TagDef extends ModelDefinition
{
    public string $_name = 'project.tag';
    public string $_description = 'Tag';
    public string $_table = 'tags';
    public string $_order = 'name asc';
    public string $_rec_name = 'name';
    public string $modelClass = Tag::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, [
            'string' => 'Tag Name', 'required' => true, 'searchable' => true,
        ]);
        $this->addField('color', Field::CHAR, [
            'string' => 'Color', 'default' => '#6366f1',
        ]);
    }
}
