<?php

namespace App\Model\Spreadsheet;

use App\Model\BaseModel;

/**
 * SpreadsheetCollaboration Model — Tracks collaborative presence in spreadsheets.
 */
class SpreadsheetCollaboration extends BaseModel
{
    const TABLENAME  = 'spreadsheet_collaboration';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
