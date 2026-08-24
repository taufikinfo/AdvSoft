<?php

namespace App\Model\Res;

use App\Model\BaseModel;
use Adianti\Database\TTransaction;

class ResUser extends BaseModel
{
    const TABLENAME  = 'res_users';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';

    protected ?array $groupCache = null;

    public function partner(): ?ResPartner
    {
        return $this->partner_id ? ResPartner::find($this->partner_id) : null;
    }

    public function company(): ?ResCompany
    {
        return $this->company_id ? ResCompany::find($this->company_id) : null;
    }

    /**
     * Get direct groups assigned to user
     */
    public function getDirectGroupIds(): array
    {
        self::openTransaction();
        $conn = TTransaction::get();
        $stmt = $conn->prepare("SELECT group_id FROM res_users_groups_rel WHERE user_id = :uid");
        $stmt->execute([':uid' => $this->id]);
        return $stmt->fetchAll(\PDO::FETCH_COLUMN) ?: [];
    }

    /**
     * Computed full group set (direct + transitively implied).
     */
    public function getAllGroups(): array
    {
        if ($this->groupCache !== null) {
            return $this->groupCache;
        }

        self::openTransaction();
        $conn = TTransaction::get();
        $visited = [];
        $stack = $this->getDirectGroupIds();

        while ($stack) {
            $gid = array_pop($stack);
            if (isset($visited[$gid])) continue;
            $visited[$gid] = true;

            $stmt = $conn->prepare("SELECT implied_id FROM res_groups_implied_rel WHERE group_id = :gid");
            $stmt->execute([':gid' => $gid]);
            $implied = $stmt->fetchAll(\PDO::FETCH_COLUMN) ?: [];

            foreach ($implied as $imp) {
                if (!isset($visited[$imp])) $stack[] = (int) $imp;
            }
        }

        $ids = array_keys($visited);
        if (empty($ids)) {
            return $this->groupCache = [];
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $conn->prepare("SELECT * FROM res_groups WHERE id IN ($placeholders)");
        $stmt->execute($ids);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $groups = [];
        foreach ($rows as $row) {
            $grp = new ResGroup;
            $grp->fromArray($row);
            $groups[] = $grp;
        }

        return $this->groupCache = $groups;
    }

    public function isAdmin(): bool
    {
        return $this->id === 1 || $this->hasGroup('base.group_system') || $this->hasGroup('Administration / System Admin');
    }

    public function getGroupIds(): array
    {
        return array_map(fn($g) => $g->id, $this->getAllGroups());
    }

    public function groups(): \App\Advsoft\Core\Support\Collection
    {
        return new \App\Advsoft\Core\Support\Collection($this->getAllGroups());
    }

    public function hasGroup(string $nameOrXmlId): bool
    {
        if ($this->id === 1) return true; // Superuser bypass
        foreach ($this->getAllGroups() as $group) {
            if ($group->name === $nameOrXmlId || ($group->xml_id ?? '') === $nameOrXmlId) {
                return true;
            }
        }
        return false;
    }

    public function syncGroups(array $groupIds): void
    {
        self::openTransaction();
        $conn = TTransaction::get();
        $stmt = $conn->prepare("DELETE FROM res_users_groups_rel WHERE user_id = :uid");
        $stmt->execute([':uid' => $this->id]);

        $driver = $conn->getAttribute(\PDO::ATTR_DRIVER_NAME);
        $insSql = ($driver === 'mysql')
            ? "INSERT IGNORE INTO res_users_groups_rel (user_id, group_id) VALUES (:uid, :gid)"
            : "INSERT OR IGNORE INTO res_users_groups_rel (user_id, group_id) VALUES (:uid, :gid)";

        $ins = $conn->prepare($insSql);
        foreach ($groupIds as $gid) {
            $ins->execute([':uid' => $this->id, ':gid' => $gid]);
        }
        $this->groupCache = null;
    }
}
