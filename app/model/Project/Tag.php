<?php

namespace App\Model\Project;

use App\Model\BaseModel;

/**
 * Tag Model — Represents project/task tags.
 */
class Tag extends BaseModel
{
    const TABLENAME  = 'tags';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
