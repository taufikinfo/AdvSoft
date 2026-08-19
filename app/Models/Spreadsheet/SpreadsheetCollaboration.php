<?php

namespace App\Models\Spreadsheet;

use App\Models\BaseModel;

/**
 * SpreadsheetCollaboration Model — Tracks collaborative presence in spreadsheets.
 */
class SpreadsheetCollaboration extends BaseModel
{
    const TABLENAME  = 'spreadsheet_collaborations';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
