<?php

namespace App\Model\Account;

use App\Model\BaseModel;

class AccountPayment extends BaseModel
{
    const TABLENAME  = 'account_payment';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
