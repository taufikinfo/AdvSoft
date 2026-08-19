<?php

namespace App\Models\Ir;

use App\Models\BaseModel;

class IrUiView extends BaseModel
{
    const TABLENAME  = 'ir_ui_views';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
