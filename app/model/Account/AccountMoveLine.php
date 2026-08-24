<?php

namespace App\Model\Account;

use App\Model\BaseModel;

class AccountMoveLine extends BaseModel
{
    const TABLENAME  = 'account_move_line';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';

    public function move(): ?AccountMove
    {
        return $this->move_id ? AccountMove::find($this->move_id) : null;
    }

    public function account(): ?AccountAccount
    {
        return $this->account_id ? AccountAccount::find($this->account_id) : null;
    }
}
