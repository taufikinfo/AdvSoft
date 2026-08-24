<?php

namespace App\Model\Project;

use App\Model\BaseModel;
use App\Model\Res\ResUser;

/**
 * Task Model — Represents a project task / work item.
 */
class Task extends BaseModel
{
    const TABLENAME  = 'tasks';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';

    public function project(): ?Project
    {
        return $this->project_id ? Project::find($this->project_id) : null;
    }

    public function stage(): ?Stage
    {
        return $this->stage_id ? Stage::find($this->stage_id) : null;
    }

    public function user(): ?ResUser
    {
        return $this->user_id ? ResUser::find($this->user_id) : null;
    }

    public function timesheets(): \App\Odoo\Core\Database\QueryBuilder
    {
        return TaskTimesheet::where('task_id', '=', $this->id);
    }
}
