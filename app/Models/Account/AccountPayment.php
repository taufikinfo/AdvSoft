<?php

namespace App\Models\Account;

use App\Models\BaseModel;

class AccountPayment extends BaseModel
{
    const TABLENAME  = 'account_payment';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
