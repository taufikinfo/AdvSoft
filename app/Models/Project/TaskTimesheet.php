<?php

namespace App\Models\Project;

use App\Models\BaseModel;

/**
 * TaskTimesheet Model — Represents logged timesheet entries for tasks.
 */
class TaskTimesheet extends BaseModel
{
    const TABLENAME  = 'task_timesheets';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';

    public function user(): ?\App\Models\Res\ResUser
    {
        return $this->user_id ? \App\Models\Res\ResUser::find($this->user_id) : null;
    }

    public function task(): ?Task
    {
        return $this->task_id ? Task::find($this->task_id) : null;
    }
}
