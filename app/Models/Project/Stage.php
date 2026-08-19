<?php

namespace App\Models\Project;

use App\Models\BaseModel;

/**
 * Stage Model — Represents task Kanban stage / status.
 */
class Stage extends BaseModel
{
    const TABLENAME  = 'stages';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
