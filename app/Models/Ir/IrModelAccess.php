<?php

namespace App\Models\Ir;

use App\Models\BaseModel;

class IrModelAccess extends BaseModel
{
    const TABLENAME  = 'ir_model_access';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
