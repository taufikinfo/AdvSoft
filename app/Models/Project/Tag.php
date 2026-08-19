<?php

namespace App\Models\Project;

use App\Models\BaseModel;

/**
 * Tag Model — Represents project/task tags.
 */
class Tag extends BaseModel
{
    const TABLENAME  = 'tags';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
