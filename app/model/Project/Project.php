<?php

namespace App\Model\Project;

use App\Model\BaseModel;
use App\Model\Res\ResUser;
use App\Model\Res\ResPartner;
use App\Odoo\Core\Database\QueryBuilder;

/**
 * Project Model — Represents a workspace project.
 */
class Project extends BaseModel
{
    const TABLENAME  = 'projects';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';

    public function tasks(): QueryBuilder
    {
        return Task::where('project_id', '=', $this->id);
    }

    public function user(): ?ResUser
    {
        return $this->user_id ? ResUser::find($this->user_id) : null;
    }

    public function partner(): ?ResPartner
    {
        return $this->partner_id ? ResPartner::find($this->partner_id) : null;
    }

    public function tags(): QueryBuilder
    {
        return Tag::query();
    }
}
