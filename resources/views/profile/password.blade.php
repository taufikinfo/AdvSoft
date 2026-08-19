<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Change Password · Larasoft</title>
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
        .ls-topbar {
            background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%);
            color: #fff;
            padding: 12px 24px;
            display: flex; align-items: center; justify-content: space-between;
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

        .ls-card {
            background: var(--ls-card);
            border: 1px solid var(--ls-border);
            border-radius: 12px;
            padding: 28px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .ls-card-title { margin: 0 0 4px; font-size: 16px; font-weight: 600; }
        .ls-card-desc  { margin: 0 0 24px; font-size: 13px; color: var(--ls-muted); }

        .ls-form-row { margin-bottom: 16px; }
        .ls-form-row label {
            display: block;
            font-size: 12px; font-weight: 500;
            color: var(--ls-text);
            margin-bottom: 6px;
        }
        .ls-form-row label .req { color: var(--ls-danger); margin-left: 2px; }
        .ls-form-row input {
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
        .ls-form-row input:focus {
            border-color: var(--ls-primary);
            box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
        }
        .ls-form-row .help { font-size: 12px; color: var(--ls-muted); margin-top: 4px; }
        .ls-form-row .err  { font-size: 12px; color: var(--ls-danger); margin-top: 4px; }

        /* Password strength meter */
        .ls-strength {
            height: 4px;
            background: var(--ls-border);
            border-radius: 2px;
            overflow: hidden;
            margin-top: 6px;
        }
        .ls-strength-bar {
            height: 100%;
            width: 0;
            background: var(--ls-danger);
            transition: width 0.2s ease, background 0.2s ease;
        }
        .ls-strength-label {
            font-size: 11px;
            color: var(--ls-muted);
            margin-top: 4px;
            min-height: 14px;
        }

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

        .ls-alert {
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 13px;
            margin-bottom: 16px;
            display: flex; align-items: center; gap: 8px;
        }
        .ls-alert-success { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
        .ls-alert-error   { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

        .ls-security-tips {
            margin-top: 20px;
            padding: 14px 16px;
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            font-size: 12px;
            color: #075985;
        }
        .ls-security-tips strong { display: block; margin-bottom: 4px; color: #0c4a6e; }
        .ls-security-tips ul { margin: 4px 0 0; padding-left: 18px; }
        .ls-security-tips li { margin-bottom: 2px; }
    </style>
</head>
<body>
    <div class="ls-topbar">
        <a href="/" class="ls-topbar-brand">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            Larasoft
        </a>
        <div class="ls-topbar-right">
            <a href="/">← Back to apps</a>
            <a href="/logout">Logout</a>
        </div>
    </div>

    <div class="ls-profile-page">
        <div class="ls-page-header">
            <div class="ls-avatar-lg">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
            </div>
            <div>
                <h1 class="ls-page-title">Change Password</h1>
                <p class="ls-page-sub">Use a strong password you don't reuse elsewhere.</p>
            </div>
        </div>

        <div class="ls-tabs">
            <a href="{{ route('profile.show') }}" class="ls-tab">Profile</a>
            <a href="{{ route('profile.password.show') }}" class="ls-tab active">Password</a>
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

        <form method="POST" action="{{ route('profile.password.update') }}" class="ls-card" id="password-form" autocomplete="off">
            @csrf
            @method('POST')

            <h2 class="ls-card-title">Update your password</h2>
            <p class="ls-card-desc">Enter your current password, then choose a new one. Minimum 6 characters.</p>

            <div class="ls-form-row">
                <label for="current_password">Current password <span class="req">*</span></label>
                <input type="password" id="current_password" name="current_password" required autofocus autocomplete="current-password">
            </div>

            <div class="ls-form-row">
                <label for="password">New password <span class="req">*</span></label>
                <input type="password" id="password" name="password" required minlength="6" maxlength="128" autocomplete="new-password">
                <div class="ls-strength"><div class="ls-strength-bar" id="strength-bar"></div></div>
                <div class="ls-strength-label" id="strength-label">&nbsp;</div>
            </div>

            <div class="ls-form-row">
                <label for="password_confirmation">Confirm new password <span class="req">*</span></label>
                <input type="password" id="password_confirmation" name="password_confirmation" required minlength="6" maxlength="128" autocomplete="new-password">
                <p class="help" id="match-help" style="visibility:hidden;">✓ Passwords match</p>
            </div>

            <div class="ls-form-actions">
                <a href="{{ route('profile.show') }}" class="ls-btn">Cancel</a>
                <button type="submit" class="ls-btn ls-btn-primary" id="btn-change">Update password</button>
            </div>
        </form>

        <div class="ls-security-tips">
            <strong>Password tips</strong>
            <ul>
                <li>Use at least 8 characters (more is better).</li>
                <li>Mix upper- and lower-case letters, numbers, and symbols.</li>
                <li>Don't reuse passwords from other sites.</li>
                <li>Consider using a password manager.</li>
            </ul>
        </div>
    </div>

    <script>
        const pwd     = document.getElementById('password');
        const confirm = document.getElementById('password_confirmation');
        const bar     = document.getElementById('strength-bar');
        const label   = document.getElementById('strength-label');
        const matchH  = document.getElementById('match-help');

        function score(p) {
            let s = 0;
            if (!p) return 0;
            if (p.length >= 6)  s++;
            if (p.length >= 10) s++;
            if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
            if (/\d/.test(p)) s++;
            if (/[^A-Za-z0-9]/.test(p)) s++;
            return Math.min(s, 5);
        }
        function strengthColor(s) {
            return ['#dc2626', '#ea580c', '#ca8a04', '#65a30d', '#16a34a', '#059669'][s];
        }
        function strengthLabel(s) {
            return [' ', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][s];
        }

        pwd.addEventListener('input', () => {
            const s = score(pwd.value);
            bar.style.width = (s * 20) + '%';
            bar.style.background = strengthColor(s);
            label.textContent = pwd.value ? 'Strength: ' + strengthLabel(s) : '\u00a0';
            checkMatch();
        });
        confirm.addEventListener('input', checkMatch);

        function checkMatch() {
            if (!confirm.value) { matchH.style.visibility = 'hidden'; return; }
            if (pwd.value === confirm.value) {
                matchH.textContent = '✓ Passwords match';
                matchH.style.color = '#059669';
                matchH.style.visibility = 'visible';
            } else {
                matchH.textContent = '✗ Passwords do not match';
                matchH.style.color = '#dc2626';
                matchH.style.visibility = 'visible';
            }
        }

        document.getElementById('password-form').addEventListener('submit', function (e) {
            if (pwd.value !== confirm.value) {
                e.preventDefault();
                alert('Passwords do not match.');
                return;
            }
            const btn = document.getElementById('btn-change');
            btn.disabled = true; btn.textContent = 'Updating…';
        });
    </script>
</body>
</html>
