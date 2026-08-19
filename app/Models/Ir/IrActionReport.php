<?php

namespace App\Models\Ir;

use App\Models\BaseModel;

class IrActionReport extends BaseModel
{
    const TABLENAME  = 'ir_act_report_xml';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
