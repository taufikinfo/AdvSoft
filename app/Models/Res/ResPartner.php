<?php

namespace App\Models\Res;

use App\Models\BaseModel;

class ResPartner extends BaseModel
{
    const TABLENAME  = 'res_partner';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
