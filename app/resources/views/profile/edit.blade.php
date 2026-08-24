<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>My Profile · AdvSoft</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/odoo-menu.css?v=26">
    <style>
        :root {
            --ls-primary: #7C3AED;
            --ls-bg:      #f8f9fb;
            --ls-card:    #ffffff;
            --ls-text:    #111827;
            --ls-muted:   #6b7280;
            --ls-border:  #e5e7eb;
            --ls-hover:   #f3f4f6;
            --ls-danger:  #dc2626;
            --ls-success: #059669;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: 'Inter', system-ui, sans-serif;
            background: var(--ls-bg);
            color: var(--ls-text);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        /* Top bar */
        .ls-topbar {
            background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%);
            color: #fff;
            padding: 12px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .ls-topbar-brand {
            display: flex; align-items: center; gap: 8px;
            font-weight: 700; font-size: 16px;
            text-decoration: none; color: #fff;
        }
        .ls-topbar-right { display: flex; align-items: center; gap: 16px; font-size: 13px; }
        .ls-topbar-right a { color: rgba(255,255,255,0.85); text-decoration: none; }
        .ls-topbar-right a:hover { color: #fff; }

        /* Layout */
        .ls-profile-page {
            flex: 1;
            max-width: 720px;
            width: 100%;
            margin: 0 auto;
            padding: 32px 24px;
        }
        .ls-page-header {
            display: flex; align-items: center; gap: 16px;
            margin-bottom: 24px;
        }
        .ls-avatar-lg {
            width: 72px; height: 72px;
            border-radius: 50%;
            display: grid; place-items: center;
            background: linear-gradient(135deg, #7C3AED 0%, #4c1d95 100%);
            color: #fff; font-size: 28px; font-weight: 700;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
        }
        .ls-page-title { margin: 0; font-size: 22px; font-weight: 700; }
        .ls-page-sub  { margin: 2px 0 0; font-size: 13px; color: var(--ls-muted); }

        /* Tabs */
        .ls-tabs {
            display: flex; gap: 4px;
            border-bottom: 1px solid var(--ls-border);
            margin-bottom: 20px;
        }
        .ls-tab {
            padding: 10px 16px;
            font-size: 13px; font-weight: 500;
            color: var(--ls-muted);
            text-decoration: none;
            border-bottom: 2px solid transparent;
            margin-bottom: -1px;
            transition: all 0.15s ease;
        }
        .ls-tab:hover { color: var(--ls-text); }
        .ls-tab.active { color: var(--ls-primary); border-bottom-color: var(--ls-primary); font-weight: 600; }

        /* Card */
        .ls-card {
            background: var(--ls-card);
            border: 1px solid var(--ls-border);
            border-radius: 12px;
            padding: 28px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .ls-card-title {
            margin: 0 0 4px;
            font-size: 16px; font-weight: 600;
        }
        .ls-card-desc {
            margin: 0 0 24px;
            font-size: 13px; color: var(--ls-muted);
        }

        /* Form */
        .ls-form-row { margin-bottom: 16px; }
        .ls-form-row label {
            display: block;
            font-size: 12px; font-weight: 500;
            color: var(--ls-text);
            margin-bottom: 6px;
        }
        .ls-form-row label .req { color: var(--ls-danger); margin-left: 2px; }
        .ls-form-row input, .ls-form-row textarea {
            width: 100%;
            padding: 10px 12px;
            font-size: 14px;
            font-family: inherit;
            border: 1px solid var(--ls-border);
            border-radius: 8px;
            background: #fff;
            color: var(--ls-text);
            outline: none;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .ls-form-row input:focus, .ls-form-row textarea:focus {
            border-color: var(--ls-primary);
            box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
        }
        .ls-form-row input[disabled], .ls-form-row input[readonly] {
            background: var(--ls-hover); color: var(--ls-muted); cursor: not-allowed;
        }
        .ls-form-row textarea { resize: vertical; min-height: 100px; font-family: inherit; }
        .ls-form-row .help { font-size: 12px; color: var(--ls-muted); margin-top: 4px; }
        .ls-form-row .err  { font-size: 12px; color: var(--ls-danger); margin-top: 4px; }

        .ls-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 560px) { .ls-grid-2 { grid-template-columns: 1fr; } }

        /* Buttons */
        .ls-form-actions {
            margin-top: 20px;
            display: flex; align-items: center; gap: 10px;
            justify-content: flex-end;
        }
        .ls-btn {
            padding: 9px 18px;
            font-size: 13px; font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            border: 1px solid var(--ls-border);
            background: #fff;
            color: var(--ls-text);
            transition: all 0.12s ease;
            text-decoration: none;
            display: inline-flex; align-items: center; gap: 6px;
        }
        .ls-btn:hover { background: var(--ls-hover); }
        .ls-btn-primary {
            background: var(--ls-primary);
            color: #fff;
            border-color: var(--ls-primary);
        }
        .ls-btn-primary:hover { background: #6d28d9; }
        .ls-btn:disabled { opacity: 0.6; cursor: progress; }

        /* Alerts */
        .ls-alert {
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 13px;
            margin-bottom: 16px;
            display: flex; align-items: center; gap: 8px;
        }
        .ls-alert-success { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
        .ls-alert-error   { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    </style>
</head>
<body>
    <!-- Top bar -->
    <div class="ls-topbar">
        <a href="/" class="ls-topbar-brand">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            AdvSoft
        </a>
        <div class="ls-topbar-right">
            <a href="/">← Back to apps</a>
            <a href="/logout">Logout</a>
        </div>
    </div>

    <div class="ls-profile-page">
        <!-- Header -->
        <div class="ls-page-header">
            <div class="ls-avatar-lg">{{ strtoupper(substr($user->name ?? $user->login ?? '?', 0, 1)) }}</div>
            <div>
                <h1 class="ls-page-title">{{ $user->name ?? $user->login }}</h1>
                <p class="ls-page-sub">@{{ $user->login }} · {{ $user->email ?? 'no email' }}</p>
            </div>
        </div>

        <!-- Tabs -->
        <div class="ls-tabs">
            <a href="{{ route('profile.show') }}" class="ls-tab {{ request()->routeIs('profile.show') ? 'active' : '' }}">Profile</a>
            <a href="{{ route('profile.password.show') }}" class="ls-tab {{ request()->routeIs('profile.password.*') ? 'active' : '' }}">Password</a>
        </div>

        @if (session('status'))
            <div class="ls-alert ls-alert-success">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                {{ session('status') }}
            </div>
        @endif

        @if ($errors->any())
            <div class="ls-alert ls-alert-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {{ $errors->first() }}
            </div>
        @endif

        <!-- Form -->
        <form method="POST" action="{{ route('profile.update') }}" class="ls-card" id="profile-form">
            @csrf
            @method('POST')

            <h2 class="ls-card-title">Personal Information</h2>
            <p class="ls-card-desc">Update your public details. Login and company are managed by the administrator.</p>

            <div class="ls-grid-2">
                <div class="ls-form-row">
                    <label for="name">Name</label>
                    <input type="text" id="name" name="name" value="{{ old('name', $user->name) }}" maxlength="120" placeholder="Your full name">
                </div>
                <div class="ls-form-row">
                    <label for="login">Login</label>
                    <input type="text" id="login" name="login" value="{{ $user->login }}" disabled>
                    <p class="help">Cannot be changed here.</p>
                </div>
            </div>

            <div class="ls-form-row">
                <label for="email">Email <span class="req">*</span></label>
                <input type="email" id="email" name="email" value="{{ old('email', $user->email) }}" maxlength="160" placeholder="you@example.com" required>
                <p class="help">Used for notifications and password recovery.</p>
            </div>

            <div class="ls-form-row">
                <label for="signature">Email signature</label>
                <textarea id="signature" name="signature" maxlength="2000" placeholder="Kind regards,&#10;{{ $user->name ?? $user->login }}">{{ old('signature', $user->signature) }}</textarea>
                <p class="help">Appended at the end of outgoing messages. Plain text only.</p>
            </div>

            <div class="ls-form-actions">
                <a href="/" class="ls-btn">Cancel</a>
                <button type="submit" class="ls-btn ls-btn-primary" id="btn-save">Save changes</button>
            </div>
        </form>
    </div>

    <script>
        document.getElementById('profile-form').addEventListener('submit', function () {
            const btn = document.getElementById('btn-save');
            btn.disabled = true; btn.textContent = 'Saving…';
        });
    </script>
</body>
</html>
