<?php

namespace App\Models\Base;

use App\Models\BaseModel;

/**
 * Showcase Model — Showcase model demonstrating all Odoo/Adianti field types.
 */
class Showcase extends BaseModel
{
    const TABLENAME  = 'showcases';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
