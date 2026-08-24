<?php

namespace App\Model\Account;

use App\Model\BaseModel;

class AccountTax extends BaseModel
{
    const TABLENAME  = 'account_tax';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
