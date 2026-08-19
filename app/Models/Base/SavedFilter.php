<?php

namespace App\Models\Base;

use App\Models\BaseModel;

/**
 * SavedFilter Model — User-saved custom search & group filters.
 */
class SavedFilter extends BaseModel
{
    const TABLENAME  = 'saved_filters';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
