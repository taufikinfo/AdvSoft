<?php

namespace App\Model\Base;

use App\Model\BaseModel;

/**
 * Action Model — Base representation of system actions (ir.action).
 */
class Action extends BaseModel
{
    const TABLENAME  = 'actions';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
