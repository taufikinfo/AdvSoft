<?php

namespace App\Models\Project;

use App\Models\BaseModel;
use App\Models\Res\ResUser;

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

    public function timesheets(): \App\Core\Database\QueryBuilder
    {
        return TaskTimesheet::where('task_id', '=', $this->id);
    }
}
