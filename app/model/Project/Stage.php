<?php

namespace App\Model\Project;

use App\Model\BaseModel;

/**
 * Stage Model — Represents task Kanban stage / status.
 */
class Stage extends BaseModel
{
    const TABLENAME  = 'stages';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
