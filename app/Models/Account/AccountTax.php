<?php

namespace App\Models\Account;

use App\Models\BaseModel;

class AccountTax extends BaseModel
{
    const TABLENAME  = 'account_tax';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
