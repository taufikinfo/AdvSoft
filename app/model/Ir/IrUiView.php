<?php

namespace App\Model\Ir;

use App\Model\BaseModel;

class IrUiView extends BaseModel
{
    const TABLENAME  = 'ir_ui_views';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
