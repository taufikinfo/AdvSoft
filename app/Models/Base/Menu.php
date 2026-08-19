<?php

namespace App\Models\Base;

use App\Models\BaseModel;

/**
 * Menu Model — Base representation of UI menus (ir.ui.menu).
 */
class Menu extends BaseModel
{
    const TABLENAME  = 'menus';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';

    public function parent(): ?Menu
    {
        return $this->parent_id ? Menu::find($this->parent_id) : null;
    }

    public function action(): ?Action
    {
        return $this->action_id ? Action::find($this->action_id) : null;
    }

    public function children(): \App\Core\Database\QueryBuilder
    {
        return Menu::where('parent_id', '=', $this->id)->orderBy('sequence', 'asc');
    }
}
