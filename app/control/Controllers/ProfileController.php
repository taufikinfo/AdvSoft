<?php

namespace App\Control\Controllers;

use App\Odoo\Security\SecurityContext;
use App\Odoo\Security\SecurityService;
use App\Odoo\Core\Http\Request;
use App\Odoo\Core\Http\JsonResponse;

class ProfileController extends Controller
{
    public function __construct(
        protected SecurityContext $ctx,
        protected SecurityService $security,
    ) {}

    public function show(Request $request): mixed
    {
        $user = $this->ctx->getUser();
        if (!$user) {
            header('Location: /login');
            exit;
        }

        // If accessed directly from browser URL bar, redirect to SPA user form
        if (!$request->expectsJson() && !str_contains($request->header('ACCEPT', ''), 'application/json')) {
            header('Location: /#class=ResUsersForm&method=onEdit&id=' . $user->id);
            exit;
        }

        return new JsonResponse([
            'user'    => $user->toArray(),
            'context' => $this->ctx->toArray(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $this->ctx->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Unauthenticated'], 401);
        }

        $data = $request->validate([
            'name'      => 'nullable',
            'email'     => 'nullable',
            'signature' => 'nullable',
        ]);

        if (isset($data['name'])) $user->name = $data['name'];
        if (isset($data['email'])) $user->email = $data['email'];
        if (isset($data['signature'])) $user->signature = $data['signature'];
        $user->save();

        return new JsonResponse([
            'success' => true,
            'user'    => $this->ctx->toArray(),
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $user = $this->ctx->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Unauthenticated'], 401);
        }

        $data = $request->validate([
            'current_password' => 'required',
            'password'         => 'required',
        ]);

        if (!password_verify($data['current_password'], $user->password)) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Current password is incorrect.',
                'errors'  => ['current_password' => ['Current password is incorrect.']]
            ], 422);
        }

        $user->password = password_hash($data['password'], PASSWORD_BCRYPT);
        $user->save();

        return new JsonResponse(['success' => true]);
    }
}
