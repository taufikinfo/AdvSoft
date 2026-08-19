<?php

namespace App\Models\Ir;

use App\Models\BaseModel;

class IrSequenceDateRange extends BaseModel
{
    const TABLENAME = 'ir_sequence_date_range';
    const PRIMARYKEY = 'id';
    const IDPOLICY = 'serial';

    public function get_sequence()
    {
        return IrSequence::find($this->sequence_id);
    }
}
