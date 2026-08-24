<?php

namespace App\Model\Res;

use App\Model\BaseModel;
use Adianti\Database\TTransaction;

class ResGroup extends BaseModel
{
    const TABLENAME  = 'res_groups';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';

    public function category(): ?ResGroupsCategory
    {
        return $this->category_id ? ResGroupsCategory::find($this->category_id) : null;
    }

    public function syncImpliedGroups(array $impliedIds): void
    {
        self::openTransaction();
        $conn = TTransaction::get();
        $stmt = $conn->prepare("DELETE FROM res_groups_implied_rel WHERE group_id = :gid");
        $stmt->execute([':gid' => $this->id]);

        $ins = $conn->prepare("INSERT INTO res_groups_implied_rel (group_id, implied_id) VALUES (:gid, :iid)");
        foreach ($impliedIds as $iid) {
            try {
                $ins->execute([':gid' => $this->id, ':iid' => $iid]);
            } catch (\Throwable $e) {}
        }
    }
}
