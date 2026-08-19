<?php

namespace Addons\Project\Models;

use App\Models\Stage;
use App\Odoo\{ModelDefinition, Field};

class StageDef extends ModelDefinition
{
    public string $_name = 'stage';
    public string $_description = 'Pipeline Stage';
    public string $_table = 'stages';
    public string $_order = 'sequence asc';
    public string $_rec_name = 'name';
    public string $modelClass = Stage::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, [
            'string' => 'Stage Name', 'required' => true, 'searchable' => true,
        ]);
        $this->addField('sequence', Field::INTEGER, [
            'string' => 'Sequence', 'default' => 10, 'sortable' => true,
        ]);
        $this->addField('fold', Field::BOOLEAN, [
            'string' => 'Folded in Kanban', 'default' => false,
        ]);
    }
}
