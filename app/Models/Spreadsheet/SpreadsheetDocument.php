<?php

namespace App\Models\Spreadsheet;

use App\Models\BaseModel;
use App\Models\Res\ResUser;

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
