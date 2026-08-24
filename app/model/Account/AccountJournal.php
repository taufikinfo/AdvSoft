<?php

namespace App\Model\Account;

use App\Model\BaseModel;

class AccountJournal extends BaseModel
{
    const TABLENAME  = 'account_journal';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
