<?php

namespace App\Control\Controllers;

use App\Advsoft\Security\SecurityContext;
use App\Advsoft\Security\SecurityService;
use App\Advsoft\Core\Http\Request;
use App\Advsoft\Core\Http\JsonResponse;
use App\Model\Res\ResUser;

class AuthController extends Controller
{
    public function __construct(
        protected SecurityContext $ctx,
        protected SecurityService $security,
    ) {}

    /**
     * POST /api/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'login'    => 'required',
            'password' => 'required',
        ]);

        $user = $this->security->authenticate($data['login'], $data['password']);
        if (!$user) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Invalid login or password.',
                'errors'  => ['login' => ['Invalid credentials']],
            ], 401);
        }

        $this->ctx->setUser($user);

        if (php_sapi_name() !== 'cli') {
            if (session_status() !== PHP_SESSION_ACTIVE) {
                @session_start();
            }
            if (session_status() === PHP_SESSION_ACTIVE) {
                @session_regenerate_id(true);
                $_SESSION['res_user_id'] = $user->id;
                $_SESSION['res_company_id'] = $user->company_id ?: 1;
            }
        }

        return new JsonResponse([
            'success' => true,
            'user'    => $this->ctx->toArray(),
        ]);
    }

    /**
     * POST /api/auth/register
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required',
            'login'    => 'required',
            'password' => 'required',
        ]);

        $existing = ResUser::firstWhere('login', $data['login']);
        if ($existing) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Login is already taken.',
                'errors'  => ['login' => ['Login is already taken.']],
            ], 422);
        }

        $user = ResUser::create([
            'name'       => $data['name'],
            'login'      => $data['login'],
            'password'   => password_hash($data['password'], PASSWORD_BCRYPT),
            'company_id' => 1,
            'active'     => 1,
        ]);

        $this->ctx->setUser($user);
        if (session_status() !== PHP_SESSION_ACTIVE) {
            @session_start();
        }
        $_SESSION['res_user_id'] = $user->id;
        $_SESSION['res_company_id'] = 1;

        return new JsonResponse([
            'success' => true,
            'user'    => $this->ctx->toArray(),
        ]);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $this->ctx->logout();
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
        return new JsonResponse(['success' => true]);
    }

    /**
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $this->ctx->getUser();
        return new JsonResponse([
            'authenticated' => $user !== null,
            'user'          => $this->ctx->toArray(),
        ]);
    }

    /**
     * GET /api/auth/menu
     */
    public function menu(Request $request): JsonResponse
    {
        $user = $this->ctx->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Unauthenticated'], 401);
        }
        $menus = \App\Model\Menu::where('parent_id', null);
        return new JsonResponse(['menus' => $menus->toArray()]);
    }
}
