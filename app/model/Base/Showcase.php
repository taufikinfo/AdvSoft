<?php

namespace App\Model\Base;

use App\Model\BaseModel;

/**
 * Showcase Model — Showcase model demonstrating all Odoo/Adianti field types.
 */
class Showcase extends BaseModel
{
    const TABLENAME  = 'showcases';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
