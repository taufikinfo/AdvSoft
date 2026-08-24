<?php

namespace App\Model\Spreadsheet;

use App\Model\BaseModel;
use App\Model\Res\ResUser;

/**
 * SpreadsheetDocument Model — Stores spreadsheet data and metadata.
 */
class SpreadsheetDocument extends BaseModel
{
    const TABLENAME  = 'spreadsheet_data';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';

    public function user(): ?ResUser
    {
        return $this->user_id ? ResUser::find($this->user_id) : null;
    }
}
