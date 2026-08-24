<?php

namespace App\Model\Project;

use App\Model\BaseModel;

/**
 * TaskTimesheet Model — Represents logged timesheet entries for tasks.
 */
class TaskTimesheet extends BaseModel
{
    const TABLENAME  = 'task_timesheets';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';

    public function user(): ?\App\Model\Res\ResUser
    {
        return $this->user_id ? \App\Model\Res\ResUser::find($this->user_id) : null;
    }

    public function task(): ?Task
    {
        return $this->task_id ? Task::find($this->task_id) : null;
    }
}
