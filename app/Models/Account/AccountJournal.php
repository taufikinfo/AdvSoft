<?php

namespace App\Models\Account;

use App\Models\BaseModel;

class AccountJournal extends BaseModel
{
    const TABLENAME  = 'account_journal';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
