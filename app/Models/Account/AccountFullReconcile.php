<?php

namespace App\Models\Account;

use App\Models\BaseModel;

class AccountFullReconcile extends BaseModel
{
    const TABLENAME  = 'account_full_reconcile';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
