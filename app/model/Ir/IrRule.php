<?php

namespace App\Model\Ir;

use App\Model\BaseModel;
use App\Model\Res\ResGroup;

class IrRule extends BaseModel
{
    const TABLENAME  = 'ir_rule';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';

    public function getGroupIds(): array
    {
        self::openTransaction();
        $conn = \Adianti\Database\TTransaction::get();
        $stmt = $conn->prepare("SELECT group_id FROM ir_rule_groups_rel WHERE rule_id = :rid");
        $stmt->execute([':rid' => $this->id]);
        return $stmt->fetchAll(\PDO::FETCH_COLUMN) ?: [];
    }
}
