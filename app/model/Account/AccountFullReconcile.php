<?php

namespace App\Model\Account;

use App\Model\BaseModel;

class AccountFullReconcile extends BaseModel
{
    const TABLENAME  = 'account_full_reconcile';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
