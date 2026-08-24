<?php

namespace App\Model\Spreadsheet;

use App\Model\BaseModel;

/**
 * SpreadsheetOperation Model — Tracks operations history for spreadsheet undo/redo/sync.
 */
class SpreadsheetOperation extends BaseModel
{
    const TABLENAME  = 'spreadsheet_operations';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
