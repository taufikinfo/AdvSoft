<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?= csrf_token() ?>">
    <title>Register · AdvSoft</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/odoo-menu.css?v=26">
    <style>
        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            font-family: 'Inter', system-ui, sans-serif;
            background:
                radial-gradient(900px circle at 0% 0%, #714B67 0%, transparent 50%),
                radial-gradient(700px circle at 100% 100%, #017E84 0%, transparent 50%),
                #1F1F1F;
            color: #fff;
        }
        .login-card {
            background: rgba(255, 255, 255, 0.06);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 16px;
            padding: 40px;
            width: 380px;
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
        }
        .login-card h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 4px;
        }
        .login-card p.subtitle {
            font-size: 13px;
            opacity: 0.65;
            margin: 0 0 28px;
        }
        .field {
            margin-bottom: 14px;
        }
        .field label {
            display: block;
            font-size: 12px;
            font-weight: 500;
            opacity: 0.8;
            margin-bottom: 4px;
        }
        .field input {
            width: 100%;
            box-sizing: border-box;
            padding: 11px 14px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            font-family: inherit;
            outline: none;
        }
        .field input:focus { border-color: #714B67; background: rgba(255,255,255,0.12); }
        .btn-login {
            width: 100%;
            padding: 12px;
            background: #714B67;
            color: #fff;
            border: 0;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 6px;
        }
        .btn-login:hover { background: #5d3d54; }
        .btn-login:disabled { opacity: 0.6; cursor: progress; }
        .error {
            background: rgba(255, 80, 80, 0.18);
            border: 1px solid rgba(255, 80, 80, 0.4);
            color: #ffb0b0;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 13px;
            margin-bottom: 12px;
            display: none;
        }
        .hint {
            text-align: center;
            font-size: 12px;
            opacity: 0.55;
            margin-top: 18px;
        }
        .hint a { color: #fff; text-decoration: underline; font-weight: 500; }
        .hint code { background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="login-card">
        <h1>AdvSoft</h1>
        <p class="subtitle">Join the AdvSoft platform</p>
        <div class="error" id="register-error"></div>
        <form id="register-form" autocomplete="on">
            <div class="field">
                <label for="name">Full Name</label>
                <input type="text" id="name" name="name" required autofocus>
            </div>
            <div class="field">
                <label for="login">Username / Login</label>
                <input type="text" id="login" name="login" required>
            </div>
            <div class="field">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="btn-login" id="btn-register">Sign up</button>
        </form>
        <p class="hint">Already have an account? <a href="/login">Sign in</a></p>
    </div>

    <script>
        window.__CSRF_TOKEN__ = document.querySelector('meta[name="csrf-token"]').content;
        const form = document.getElementById('register-form');
        const err  = document.getElementById('register-error');
        const btn  = document.getElementById('btn-register');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            err.style.display = 'none';
            btn.disabled = true; btn.textContent = 'Creating account…';
            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': window.__CSRF_TOKEN__ },
                    body: JSON.stringify({
                        name: form.name.value,
                        login: form.login.value,
                        password: form.password.value,
                    }),
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || data.errors?.login?.[0] || 'Registration failed');
                }
                window.location.href = '/';
            } catch (e) {
                err.textContent = e.message;
                err.style.display = 'block';
                btn.disabled = false; btn.textContent = 'Sign up';
            }
        });
    </script>
</body>
</html>
