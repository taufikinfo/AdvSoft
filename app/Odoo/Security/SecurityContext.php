<?php

namespace App\Odoo\Security;

use App\Model\Res\ResUser;
use App\Model\Res\ResGroup;
use App\Model\Res\ResCompany;

/**
 * SecurityContext — request-scoped security state.
 *
 * Mirrors Odoo's `request.env` and `recordset.env`:
 *  - $env.user          → getUser() / setUser()
 *  - $env.su            → isSuperuser() (set by sudo())
 *  - $env.company       → getCompany()
 *  - $env['res.company']→ forCompany()
 *  - record.with_user(u)→ withUser()
 *  - record.sudo()      → sudo()
 *  - record.sudo(flag)  → sudo(bool) — toggleable
 *
 * Stored on the ServiceContainer so every part of the request
 * (controllers, models, jobs) sees the same user.
 */
class SecurityContext
{
    protected ?ResUser $user = null;
    protected ?ResCompany $company = null;

    /** @var int[]|null cached group id set for current user */
    protected ?array $groupIds = null;

    /** @var string[]|null cached group name set for current user */
    protected ?array $groupNames = null;

    /** @var bool superuser flag (bypasses ACL) — separate name to avoid method collision */
    protected bool $_isSuperuser = false;

    public function __construct()
    {
        // Try to restore from session
        try {
            $session = $this->session();
            if ($session && $session->has('res_user_id')) {
                $u = ResUser::find($session->get('res_user_id'));
                if ($u && $u->active) {
                    $this->user = $u;
                    if ($u->company_id) {
                        $this->company = $u->company;
                    }
                }
            }
            if (!$this->company) {
                $this->company = ResCompany::first() ?? ResCompany::create([
                    'name' => 'My Company',
                ]);
            }
        } catch (\Throwable) {
            // Table might not exist yet (during migrations, tests); defer.
            $this->company = null;
        }
    }

    // ──────────────── User ────────────────────
    public function getUser(): ?ResUser { return $this->user; }
    public function getUserId(): ?int    { return $this->user?->id; }

    public function setUser(ResUser $user): self
    {
        $this->user = $user;
        $this->groupIds = null;
        $this->groupNames = null;
        $sess = $this->session();
        if ($sess) {
            $sess->put('res_user_id', $user->id);
            $sess->put('res_company_id', $user->company_id);
        }
        if ($user->company_id) {
            try {
                $this->company = $user->company;
            } catch (\Throwable) {}
        }
        app()->instance(SecurityContext::class, $this);
        return $this;
    }

    public function logout(): self
    {
        $this->user = null;
        $this->company = ResCompany::first();
        $this->_isSuperuser = false;
        $this->groupIds = null;
        $this->groupNames = null;
        $sess = $this->session();
        if ($sess) {
            $sess->forget('res_user_id');
            $sess->forget('res_company_id');
        }
        app()->instance(SecurityContext::class, $this);
        return $this;
    }

    // ──────────────── Company ────────────────
    public function getCompany(): ?ResCompany
    {
        if ($this->company === null) {
            try {
                $this->company = ResCompany::first();
            } catch (\Throwable) {
                return null;
            }
        }
        return $this->company;
    }
    public function getCompanyId(): ?int { return $this->getCompany()?->id; }

    public function forCompany(int|ResCompany $company): self
    {
        $clone = clone $this;
        $clone->company = is_int($company) ? ResCompany::find($company) : $company;
        $clone->_isSuperuser = $this->_isSuperuser;  // sudo persists
        app()->instance(SecurityContext::class, $clone);
        return $clone;
    }

    // ──────────────── sudo ────────────────────
    public function isSuperuser(): bool
    {
        if ($this->_isSuperuser) return true;
        if (!$this->user) return false;
        return $this->user->isAdmin();
    }

    public function sudo(bool $flag = true): self
    {
        $clone = clone $this;
        $clone->_isSuperuser = $flag;
        // Rebind the container singleton so SecurityService.live() sees the new state
        app()->instance(SecurityContext::class, $clone);
        return $clone;
    }

    // ──────────────── with_user ──────────────
    public function withUser(ResUser $user): self
    {
        $clone = clone $this;
        $clone->setUser($user);
        $clone->_isSuperuser = false;
        $clone->_companyId = $user->company_id;
        app()->instance(SecurityContext::class, $clone);
        return $clone;
    }

    // ──────────────── Group membership ────────
    /** @return int[] */
    public function getGroupIds(): array
    {
        if ($this->isSuperuser()) {
            // sudo sees all groups
            if ($this->groupIds === null) {
                $this->groupIds = ResGroup::pluck('id')->all();
            }
            return $this->groupIds;
        }
        if ($this->groupIds === null) {
            $this->groupIds = $this->user
                ? $this->user->getGroupIds()
                : [];
        }
        return $this->groupIds;
    }

    /** @return string[] */
    public function getGroupNames(): array
    {
        if ($this->groupNames === null) {
            $names = [];
            if ($this->user) {
                foreach ($this->getGroupIds() as $gid) {
                    $g = ResGroup::find($gid);
                    if ($g) $names[] = $g->name;
                }
            }
            $this->groupNames = $names;
        }
        return $this->groupNames;
    }

    public function hasGroup(string|int|array $needle): bool
    {
        $ids = $this->getGroupIds();
        $names = $this->getGroupNames();

        $needles = is_array($needle) ? $needle : [$needle];
        foreach ($needles as $n) {
            if (is_int($n) && in_array($n, $ids, true)) return true;
            if (is_string($n) && in_array($n, $names, true)) return true;
        }
        return false;
    }

    // ──────────────── Snapshot for client ─────
    public function toArray(): array
    {
        $u = $this->user;
        return [
            'uid'         => $u?->id,
            'login'       => $u?->login,
            'name'        => $u?->name,
            'email'       => $u?->email,
            'image'       => $u?->partner?->image ?? null,
            'company_id'  => $this->company?->id,
            'company'     => $this->company?->name,
            'is_superuser'=> $this->isSuperuser(),
            'group_ids'   => $this->getGroupIds(),
            'group_names' => $this->getGroupNames(),
        ];
    }

    protected function session(): ?object
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            @session_start();
        }
        return new class {
            public function get(string $key, mixed $default = null): mixed {
                return $_SESSION[$key] ?? $default;
            }
            public function set(string $key, mixed $val): void {
                $_SESSION[$key] = $val;
            }
            public function put(string $key, mixed $val): void {
                $_SESSION[$key] = $val;
            }
            public function has(string $key): bool {
                return isset($_SESSION[$key]);
            }
            public function forget(string $key): void {
                unset($_SESSION[$key]);
            }
        };
    }
}
