<?php

namespace App\Model\Ir;

use App\Model\BaseModel;

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
