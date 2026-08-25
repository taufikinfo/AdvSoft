<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?= csrf_token() ?>">
    <title>AdvSoft — All-in-One Business Applications Platform</title>
    <meta name="description" content="AdvSoft is a modern, unified ERP platform with Odoo-style views, collaborative spreadsheets, and multi-database support.">
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        :root {
            --odoo-purple: #714B67;
            --odoo-purple-dark: #58334E;
            --odoo-purple-light: #8E6583;
            --odoo-teal: #017E84;
            --odoo-teal-dark: #006368;
            --odoo-teal-light: #00A09D;
            --odoo-coral: #E46F78;
            --odoo-amber: #EAA83B;
            --odoo-blue: #3B82F6;
            --odoo-green: #10B981;
            --bg-dark: #121214;
            --bg-card-dark: rgba(255, 255, 255, 0.04);
            --border-dark: rgba(255, 255, 255, 0.1);
            --text-main: #0F172A;
            --text-muted: #64748B;
            --font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            font-family: var(--font-family);
            background-color: #FAFAFB;
            color: var(--text-main);
            line-height: 1.6;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
        }

        /* ── Header & Navbar ────────────────────────────────────────── */
        .navbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 72px;
            background: rgba(255, 255, 255, 0.88);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 48px;
            z-index: 1000;
            transition: all 0.3s ease;
        }

        .navbar.scrolled {
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
            background: rgba(255, 255, 255, 0.96);
        }

        .brand-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            color: var(--text-main);
        }

        .brand-icon {
            width: 38px;
            height: 38px;
            background: linear-gradient(135deg, var(--odoo-purple) 0%, var(--odoo-teal) 100%);
            border-radius: 10px;
            display: grid;
            place-items: center;
            color: #fff;
            font-size: 18px;
            font-weight: 800;
            box-shadow: 0 4px 14px rgba(113, 75, 103, 0.35);
        }

        .brand-text {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.5px;
            background: linear-gradient(135deg, #1E293B, var(--odoo-purple));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .brand-badge {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: rgba(1, 126, 132, 0.1);
            color: var(--odoo-teal);
            padding: 3px 8px;
            border-radius: 20px;
            border: 1px solid rgba(1, 126, 132, 0.2);
        }

        .nav-menu {
            display: flex;
            align-items: center;
            gap: 32px;
            list-style: none;
        }

        .nav-link {
            text-decoration: none;
            color: var(--text-muted);
            font-size: 14px;
            font-weight: 600;
            transition: color 0.2s ease;
            position: relative;
        }

        .nav-link:hover {
            color: var(--odoo-purple);
        }

        .nav-actions {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 20px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 10px;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid transparent;
            font-family: inherit;
        }

        .btn-ghost {
            color: var(--text-main);
            background: transparent;
        }

        .btn-ghost:hover {
            background: rgba(0, 0, 0, 0.04);
            color: var(--odoo-purple);
        }

        .btn-primary {
            background: var(--odoo-purple);
            color: #fff;
            box-shadow: 0 4px 14px rgba(113, 75, 103, 0.3);
        }

        .btn-primary:hover {
            background: var(--odoo-purple-dark);
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(113, 75, 103, 0.4);
        }

        .btn-secondary {
            background: var(--odoo-teal);
            color: #fff;
            box-shadow: 0 4px 14px rgba(1, 126, 132, 0.3);
        }

        .btn-secondary:hover {
            background: var(--odoo-teal-dark);
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(1, 126, 132, 0.4);
        }

        .btn-outline {
            background: #fff;
            border-color: #E2E8F0;
            color: #1E293B;
        }

        .btn-outline:hover {
            border-color: var(--odoo-purple);
            color: var(--odoo-purple);
            background: rgba(113, 75, 103, 0.04);
        }

        .btn-lg {
            padding: 14px 28px;
            font-size: 15px;
            border-radius: 12px;
        }

        /* ── Hero Section ───────────────────────────────────────────── */
        .hero {
            position: relative;
            padding: 150px 24px 100px;
            background:
                radial-gradient(900px circle at 15% 15%, rgba(113, 75, 103, 0.08) 0%, transparent 60%),
                radial-gradient(750px circle at 85% 85%, rgba(1, 126, 132, 0.08) 0%, transparent 60%),
                #FAFAFB;
            text-align: center;
            overflow: hidden;
        }

        .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #fff;
            padding: 6px 16px;
            border-radius: 30px;
            border: 1px solid rgba(113, 75, 103, 0.2);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            font-size: 13px;
            font-weight: 600;
            color: var(--odoo-purple);
            margin-bottom: 24px;
            animation: floatBadge 3s ease-in-out infinite alternate;
        }

        @keyframes floatBadge {
            0% { transform: translateY(0); }
            100% { transform: translateY(-4px); }
        }

        .hero-badge span.pulse-dot {
            width: 8px;
            height: 8px;
            background: var(--odoo-teal);
            border-radius: 50%;
            display: inline-block;
            box-shadow: 0 0 0 0 rgba(1, 126, 132, 0.7);
            animation: pulseDot 2s infinite;
        }

        @keyframes pulseDot {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(1, 126, 132, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(1, 126, 132, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(1, 126, 132, 0); }
        }

        .hero h1 {
            font-size: 56px;
            font-weight: 800;
            line-height: 1.15;
            letter-spacing: -1.5px;
            max-width: 880px;
            margin: 0 auto 20px;
            color: #0F172A;
        }

        .hero h1 .highlight-purple {
            background: linear-gradient(135deg, var(--odoo-purple) 0%, #A26B93 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .hero h1 .highlight-teal {
            background: linear-gradient(135deg, var(--odoo-teal) 0%, #00B4B0 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .hero p.lead {
            font-size: 18px;
            color: var(--text-muted);
            max-width: 660px;
            margin: 0 auto 36px;
            font-weight: 400;
            line-height: 1.6;
        }

        .hero-cta {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-bottom: 56px;
        }

        /* ── Interactive Hero Showcase Mockup ───────────────────────── */
        .hero-mockup-wrapper {
            max-width: 1140px;
            margin: 0 auto;
            position: relative;
        }

        .hero-mockup-card {
            background: #fff;
            border-radius: 20px;
            border: 1px solid rgba(0, 0, 0, 0.08);
            box-shadow: 0 30px 90px rgba(113, 75, 103, 0.12), 0 10px 30px rgba(0, 0, 0, 0.04);
            overflow: hidden;
            text-align: left;
        }

        .mockup-header {
            background: #F8F9FA;
            border-bottom: 1px solid #E9ECEF;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .mockup-dots {
            display: flex;
            gap: 6px;
        }

        .mockup-dots span {
            width: 11px;
            height: 11px;
            border-radius: 50%;
            display: inline-block;
        }

        .mockup-dots span.dot-red { background: #FF5F56; }
        .mockup-dots span.dot-yellow { background: #FFBD2E; }
        .mockup-dots span.dot-green { background: #27C93F; }

        .mockup-title-bar {
            font-size: 13px;
            font-weight: 600;
            color: #64748B;
            display: flex;
            align-items: center;
            gap: 8px;
            background: #fff;
            padding: 4px 16px;
            border-radius: 20px;
            border: 1px solid #E2E8F0;
        }

        .mockup-app-bar {
            background: var(--odoo-purple);
            color: #fff;
            padding: 10px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .app-bar-left {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .app-bar-grid-icon {
            font-size: 16px;
            cursor: pointer;
            opacity: 0.9;
        }

        .app-bar-brand {
            font-weight: 700;
            font-size: 15px;
            letter-spacing: -0.2px;
        }

        .app-bar-nav {
            display: flex;
            gap: 16px;
            font-size: 13px;
            font-weight: 500;
            opacity: 0.85;
        }

        .app-bar-nav span.active {
            opacity: 1;
            font-weight: 700;
            border-bottom: 2px solid #fff;
            padding-bottom: 2px;
        }

        .mockup-content {
            padding: 24px;
            background: #FFFFFF;
        }

        .mockup-kanban-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
        }

        .kanban-col {
            background: #F8F9FA;
            border-radius: 12px;
            padding: 14px;
            border: 1px solid #E9ECEF;
        }

        .kanban-col-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #334155;
        }

        .kanban-badge {
            background: #E2E8F0;
            color: #475569;
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 12px;
            font-weight: 700;
        }

        .kanban-card {
            background: #fff;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
            border: 1px solid #E2E8F0;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
            transition: all 0.2s ease;
        }

        .kanban-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
            border-color: var(--odoo-purple-light);
        }

        .kanban-card-title {
            font-size: 13px;
            font-weight: 600;
            color: #1E293B;
            margin-bottom: 6px;
        }

        .kanban-tags {
            display: flex;
            gap: 6px;
            margin-bottom: 8px;
        }

        .tag-pill {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
        }

        .tag-teal { background: #E0F2F1; color: var(--odoo-teal-dark); }
        .tag-purple { background: #F3E8FF; color: var(--odoo-purple); }
        .tag-amber { background: #FEF3C7; color: #92400E; }

        .kanban-card-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 11px;
            color: #94A3B8;
        }

        .avatar-group {
            display: flex;
        }

        .avatar-sm {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: var(--odoo-purple);
            color: #fff;
            display: grid;
            place-items: center;
            font-size: 10px;
            font-weight: 700;
            border: 2px solid #fff;
        }

        /* ── Apps Launcher Ecosystem Section ───────────────────────── */
        .section {
            padding: 100px 24px;
            max-width: 1200px;
            margin: 0 auto;
        }

        .section-header {
            text-align: center;
            max-width: 700px;
            margin: 0 auto 60px;
        }

        .section-tag {
            display: inline-block;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--odoo-teal);
            margin-bottom: 12px;
        }

        .section-title {
            font-size: 40px;
            font-weight: 800;
            letter-spacing: -1px;
            color: #0F172A;
            margin-bottom: 16px;
            line-height: 1.2;
        }

        .section-subtitle {
            font-size: 16px;
            color: var(--text-muted);
            line-height: 1.6;
        }

        .apps-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
        }

        .app-card {
            background: #fff;
            border-radius: 16px;
            border: 1px solid #E2E8F0;
            padding: 28px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .app-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.07);
            border-color: rgba(113, 75, 103, 0.3);
        }

        .app-icon-wrap {
            width: 56px;
            height: 56px;
            border-radius: 14px;
            display: grid;
            place-items: center;
            font-size: 24px;
            color: #fff;
            margin-bottom: 20px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        .icon-accounting { background: linear-gradient(135deg, #714B67 0%, #8E6583 100%); }
        .icon-project    { background: linear-gradient(135deg, #017E84 0%, #00A09D 100%); }
        .icon-sheet      { background: linear-gradient(135deg, #10B981 0%, #059669 100%); }
        .icon-crm        { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); }
        .icon-inventory  { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); }
        .icon-studio     { background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%); }

        .app-card h3 {
            font-size: 19px;
            font-weight: 700;
            color: #1E293B;
            margin-bottom: 8px;
        }

        .app-card p {
            font-size: 14px;
            color: var(--text-muted);
            line-height: 1.5;
            margin-bottom: 20px;
        }

        .app-card-features {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 24px;
        }

        .app-card-features li {
            font-size: 13px;
            color: #475569;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .app-card-features li i {
            color: var(--odoo-teal);
            font-size: 12px;
        }

        .app-card-link {
            font-size: 13px;
            font-weight: 700;
            color: var(--odoo-purple);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: gap 0.2s ease;
        }

        .app-card:hover .app-card-link {
            gap: 10px;
        }

        /* ── Feature Highlights (Dark Glass Section) ────────────────── */
        .dark-section-bg {
            background:
                radial-gradient(800px circle at 0% 0%, #714B67 0%, transparent 60%),
                radial-gradient(700px circle at 100% 100%, #017E84 0%, transparent 60%),
                #18181B;
            color: #fff;
            padding: 110px 24px;
            position: relative;
        }

        .dark-section-inner {
            max-width: 1200px;
            margin: 0 auto;
        }

        .dark-section-header {
            text-align: center;
            max-width: 760px;
            margin: 0 auto 70px;
        }

        .dark-section-header h2 {
            font-size: 42px;
            font-weight: 800;
            letter-spacing: -1px;
            margin-bottom: 18px;
            line-height: 1.2;
        }

        .dark-section-header p {
            font-size: 16px;
            opacity: 0.75;
            line-height: 1.6;
        }

        .glass-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
        }

        .glass-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 18px;
            padding: 32px;
            transition: all 0.3s ease;
        }

        .glass-card:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.25);
            transform: translateY(-4px);
        }

        .glass-card-icon {
            width: 48px;
            height: 48px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            display: grid;
            place-items: center;
            font-size: 20px;
            color: #A26B93;
            margin-bottom: 20px;
        }

        .glass-card h3 {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 10px;
        }

        .glass-card p {
            font-size: 14px;
            opacity: 0.7;
            line-height: 1.6;
        }

        /* ── Multi-Database Engine Banner ───────────────────────────── */
        .db-banner {
            background: #FFFFFF;
            border-radius: 20px;
            border: 1px solid #E2E8F0;
            padding: 40px;
            margin-top: 60px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
        }

        .db-banner-info h3 {
            font-size: 22px;
            font-weight: 800;
            color: #0F172A;
            margin-bottom: 8px;
        }

        .db-banner-info p {
            font-size: 14px;
            color: var(--text-muted);
            max-width: 560px;
        }

        .db-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            max-width: 450px;
        }

        .db-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            background: #F1F5F9;
            border: 1px solid #CBD5E1;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            color: #334155;
        }

        .db-pill i {
            color: var(--odoo-purple);
        }

        /* ── Final Call to Action ───────────────────────────────────── */
        .cta-section {
            padding: 100px 24px;
            text-align: center;
            background: #FAFAFB;
        }

        .cta-card {
            background: linear-gradient(135deg, var(--odoo-purple) 0%, var(--odoo-purple-dark) 50%, var(--odoo-teal) 100%);
            border-radius: 28px;
            padding: 70px 40px;
            max-width: 1040px;
            margin: 0 auto;
            color: #fff;
            box-shadow: 0 30px 80px rgba(113, 75, 103, 0.35);
            position: relative;
            overflow: hidden;
        }

        .cta-card h2 {
            font-size: 44px;
            font-weight: 800;
            margin-bottom: 16px;
            letter-spacing: -1px;
        }

        .cta-card p {
            font-size: 17px;
            opacity: 0.9;
            max-width: 580px;
            margin: 0 auto 36px;
        }

        .cta-buttons {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
        }

        .btn-white {
            background: #fff;
            color: var(--odoo-purple);
            font-weight: 700;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .btn-white:hover {
            background: #F8F9FA;
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .btn-outline-white {
            background: transparent;
            color: #fff;
            border: 2px solid rgba(255, 255, 255, 0.4);
        }

        .btn-outline-white:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: #fff;
        }

        /* ── Footer ─────────────────────────────────────────────────── */
        .footer {
            background: #FFFFFF;
            border-top: 1px solid #E2E8F0;
            padding: 60px 48px 30px;
            color: var(--text-muted);
            font-size: 14px;
        }

        .footer-grid {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 48px;
            margin-bottom: 48px;
        }

        .footer-brand h4 {
            font-size: 18px;
            font-weight: 800;
            color: #0F172A;
            margin-bottom: 12px;
        }

        .footer-brand p {
            max-width: 320px;
            line-height: 1.6;
        }

        .footer-col h5 {
            font-size: 14px;
            font-weight: 700;
            color: #0F172A;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .footer-col ul {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .footer-col a {
            text-decoration: none;
            color: var(--text-muted);
            transition: color 0.2s ease;
        }

        .footer-col a:hover {
            color: var(--odoo-purple);
        }

        .footer-bottom {
            max-width: 1200px;
            margin: 0 auto;
            padding-top: 24px;
            border-top: 1px solid #F1F5F9;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
        }

        /* ── Responsive Mobile ──────────────────────────────────────── */
        @media (max-width: 1024px) {
            .hero h1 { font-size: 42px; }
            .apps-grid, .glass-grid { grid-template-columns: repeat(2, 1fr); }
            .mockup-kanban-grid { grid-template-columns: repeat(2, 1fr); }
            .db-banner { flex-direction: column; gap: 24px; text-align: center; }
            .footer-grid { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 768px) {
            .navbar { padding: 0 20px; }
            .nav-menu { display: none; }
            .hero { padding: 110px 16px 60px; }
            .hero h1 { font-size: 32px; }
            .hero-cta { flex-direction: column; }
            .apps-grid, .glass-grid { grid-template-columns: 1fr; }
            .mockup-kanban-grid { grid-template-columns: 1fr; }
            .footer-grid { grid-template-columns: 1fr; gap: 32px; }
            .footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
        }
    </style>
</head>
<body>

    <!-- ── 1. Navbar ──────────────────────────────────────────────── -->
    <nav class="navbar" id="navbar">
        <a href="/" class="brand-logo">
            <div class="brand-icon">
                <i class="fa-solid fa-cube"></i>
            </div>
            <div>
                <span class="brand-text">AdvSoft</span>
                <span class="brand-badge">Enterprise</span>
            </div>
        </a>

        <ul class="nav-menu">
            <li><a href="#apps" class="nav-link">Applications</a></li>
            <li><a href="#features" class="nav-link">Features</a></li>
            <li><a href="#architecture" class="nav-link">Architecture</a></li>
            <li><a href="#databases" class="nav-link">Databases</a></li>
        </ul>

        <div class="nav-actions">
            <?php $user = app(\App\Advsoft\Security\SecurityContext::class)->getUser(); ?>
            <?php if ($user): ?>
                <a href="/logout" class="btn btn-ghost">Sign Out</a>
                <a href="/" class="btn btn-primary">
                    <i class="fa-solid fa-gauge-high"></i> Open Dashboard
                </a>
            <?php else: ?>
                <a href="/login" class="btn btn-ghost">Sign In</a>
                <a href="/login" class="btn btn-primary">
                    <i class="fa-solid fa-rocket"></i> Try Live Demo
                </a>
            <?php endif; ?>
        </div>
    </nav>

    <!-- ── 2. Hero Section ────────────────────────────────────────── -->
    <header class="hero">
        <div class="hero-badge">
            <span class="pulse-dot"></span>
            Unified Business Applications Platform
        </div>

        <h1>
            All your business apps. <br>
            <span class="highlight-purple">Unified</span>, <span class="highlight-teal">Lightning Fast</span> & Customizable.
        </h1>

        <p class="lead">
            AdvSoft combines the modular flexibility of Odoo with the raw speed of Pure Adianti Framework. Experience declarative QWeb views, real-time spreadsheets, and multi-database compatibility.
        </p>

        <div class="hero-cta">
            <a href="/login" class="btn btn-primary btn-lg">
                <i class="fa-solid fa-play"></i> Start Live Demo
            </a>
            <a href="#apps" class="btn btn-outline btn-lg">
                <i class="fa-solid fa-layer-group"></i> Explore Applications
            </a>
        </div>

        <!-- Hero Mockup Interactive Preview -->
        <div class="hero-mockup-wrapper">
            <div class="hero-mockup-card">
                <!-- Browser bar -->
                <div class="mockup-header">
                    <div class="mockup-dots">
                        <span class="dot-red"></span>
                        <span class="dot-yellow"></span>
                        <span class="dot-green"></span>
                    </div>
                    <div class="mockup-title-bar">
                        <i class="fa-solid fa-lock" style="font-size:11px; color:#10B981;"></i>
                        advsoft.local / web / project / tasks
                    </div>
                    <div style="width: 50px;"></div>
                </div>

                <!-- Odoo App Nav bar -->
                <div class="mockup-app-bar">
                    <div class="app-bar-left">
                        <i class="fa-solid fa-grip app-bar-grid-icon"></i>
                        <span class="app-bar-brand">Project & Agile</span>
                        <div class="app-bar-nav">
                            <span class="active">Tasks</span>
                            <span>Kanban</span>
                            <span>Timesheets</span>
                            <span>Reporting</span>
                        </div>
                    </div>
                    <div>
                        <i class="fa-regular fa-bell" style="margin-right: 14px; opacity:0.8;"></i>
                        <span style="font-size: 13px; font-weight:600;">Administrator</span>
                    </div>
                </div>

                <!-- Mockup Content (Kanban View) -->
                <div class="mockup-content">
                    <div class="mockup-kanban-grid">
                        <!-- Column 1: New -->
                        <div class="kanban-col">
                            <div class="kanban-col-header">
                                <span>New / Backlog</span>
                                <span class="kanban-badge">2</span>
                            </div>
                            <div class="kanban-card">
                                <div class="kanban-tags">
                                    <span class="tag-pill tag-purple">Design</span>
                                </div>
                                <div class="kanban-card-title">Homepage Redesign & QWeb XML</div>
                                <div class="kanban-card-footer">
                                    <span><i class="fa-regular fa-clock"></i> 4h</span>
                                    <div class="avatar-group">
                                        <div class="avatar-sm">AD</div>
                                    </div>
                                </div>
                            </div>
                            <div class="kanban-card">
                                <div class="kanban-tags">
                                    <span class="tag-pill tag-teal">Accounting</span>
                                </div>
                                <div class="kanban-card-title">Fiscal Year 2026 Chart of Accounts</div>
                                <div class="kanban-card-footer">
                                    <span><i class="fa-regular fa-clock"></i> 8h</span>
                                    <div class="avatar-group">
                                        <div class="avatar-sm" style="background:#017E84;">FA</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Column 2: In Progress -->
                        <div class="kanban-col">
                            <div class="kanban-col-header">
                                <span>In Progress</span>
                                <span class="kanban-badge">3</span>
                            </div>
                            <div class="kanban-card">
                                <div class="kanban-tags">
                                    <span class="tag-pill tag-teal">Engine</span>
                                    <span class="tag-pill tag-amber">Priority</span>
                                </div>
                                <div class="kanban-card-title">PostgreSQL & Oracle Multi-DB Driver</div>
                                <div class="kanban-card-footer">
                                    <span><i class="fa-regular fa-clock"></i> 12h</span>
                                    <div class="avatar-group">
                                        <div class="avatar-sm">AD</div>
                                    </div>
                                </div>
                            </div>
                            <div class="kanban-card">
                                <div class="kanban-tags">
                                    <span class="tag-pill tag-purple">Spreadsheet</span>
                                </div>
                                <div class="kanban-card-title">Collaborative Formula Calculation</div>
                                <div class="kanban-card-footer">
                                    <span><i class="fa-regular fa-clock"></i> 6h</span>
                                    <div class="avatar-group">
                                        <div class="avatar-sm" style="background:#10B981;">SP</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Column 3: Review -->
                        <div class="kanban-col">
                            <div class="kanban-col-header">
                                <span>Quality Review</span>
                                <span class="kanban-badge">1</span>
                            </div>
                            <div class="kanban-card">
                                <div class="kanban-tags">
                                    <span class="tag-pill tag-teal">Optimization</span>
                                </div>
                                <div class="kanban-card-title">Batch Transform N+1 Query Elimination</div>
                                <div class="kanban-card-footer">
                                    <span><i class="fa-solid fa-check-double" style="color:#10B981;"></i> Ready</span>
                                    <div class="avatar-group">
                                        <div class="avatar-sm">AD</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Column 4: Done -->
                        <div class="kanban-col">
                            <div class="kanban-col-header">
                                <span>Deployed</span>
                                <span class="kanban-badge" style="background:#DCFCE7; color:#166534;">8</span>
                            </div>
                            <div class="kanban-card" style="opacity:0.9;">
                                <div class="kanban-tags">
                                    <span class="tag-pill tag-purple">Core</span>
                                </div>
                                <div class="kanban-card-title">Pure Adianti Security & ACL Matrix</div>
                                <div class="kanban-card-footer">
                                    <span style="color:#10B981;"><i class="fa-solid fa-circle-check"></i> Passed</span>
                                    <div class="avatar-group">
                                        <div class="avatar-sm">AD</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- ── 3. Applications Ecosystem ──────────────────────────────── -->
    <section class="section" id="apps">
        <div class="section-header">
            <span class="section-tag">Modular Ecosystem</span>
            <h2 class="section-title">Built-In Enterprise Applications</h2>
            <p class="section-subtitle">Seamlessly integrated business tools sharing a single database, ACL model, and fluid user interface.</p>
        </div>

        <div class="apps-grid">
            <!-- App 1: Accounting -->
            <div class="app-card">
                <div>
                    <div class="app-icon-wrap icon-accounting">
                        <i class="fa-solid fa-file-invoice-dollar"></i>
                    </div>
                    <h3>Accounting & Invoicing</h3>
                    <p>Double-entry bookkeeping, multi-currency journal entries, automatic tax calculation, and real-time trial balance reports.</p>
                    <ul class="app-card-features">
                        <li><i class="fa-solid fa-circle-check"></i> Interactive General Ledger & Balance Sheet</li>
                        <li><i class="fa-solid fa-circle-check"></i> Customer Invoices & Vendor Bills</li>
                        <li><i class="fa-solid fa-circle-check"></i> Configurable Tax & Fiscal Positions</li>
                    </ul>
                </div>
                <a href="/login" class="app-card-link">Launch Accounting <i class="fa-solid fa-arrow-right"></i></a>
            </div>

            <!-- App 2: Project -->
            <div class="app-card">
                <div>
                    <div class="app-icon-wrap icon-project">
                        <i class="fa-solid fa-diagram-project"></i>
                    </div>
                    <h3>Project & Agile Kanban</h3>
                    <p>Visual stage pipelines, interactive drag-and-drop Kanban, burndown metrics, and sub-task hierarchies.</p>
                    <ul class="app-card-features">
                        <li><i class="fa-solid fa-circle-check"></i> Stage-based customizable workflow</li>
                        <li><i class="fa-solid fa-circle-check"></i> Timesheets & Employee Worklogs</li>
                        <li><i class="fa-solid fa-circle-check"></i> Task priority badges and deadlines</li>
                    </ul>
                </div>
                <a href="/login" class="app-card-link">Launch Projects <i class="fa-solid fa-arrow-right"></i></a>
            </div>

            <!-- App 3: Spreadsheet -->
            <div class="app-card">
                <div>
                    <div class="app-icon-wrap icon-sheet">
                        <i class="fa-solid fa-table-cells"></i>
                    </div>
                    <h3>Collaborative Spreadsheet</h3>
                    <p>Live collaborative workbook engine directly embedded in your ERP data with formula parsing and live charts.</p>
                    <ul class="app-card-features">
                        <li><i class="fa-solid fa-circle-check"></i> Full SUM, AVG, VLOOKUP Formula support</li>
                        <li><i class="fa-solid fa-circle-check"></i> Dynamic Pivot tables from ORM data</li>
                        <li><i class="fa-solid fa-circle-check"></i> XLSX Export & Import compatibility</li>
                    </ul>
                </div>
                <a href="/login" class="app-card-link">Launch Spreadsheet <i class="fa-solid fa-arrow-right"></i></a>
            </div>

            <!-- App 4: CRM -->
            <div class="app-card">
                <div>
                    <div class="app-icon-wrap icon-crm">
                        <i class="fa-solid fa-handshake"></i>
                    </div>
                    <h3>CRM & Contacts</h3>
                    <p>Track leads, sales opportunities, partner directories, customer activity timelines, and communication history.</p>
                    <ul class="app-card-features">
                        <li><i class="fa-solid fa-circle-check"></i> Opportunity Pipeline stages</li>
                        <li><i class="fa-solid fa-circle-check"></i> Contact ledger with commercial entities</li>
                        <li><i class="fa-solid fa-circle-check"></i> Activity schedules and reminders</li>
                    </ul>
                </div>
                <a href="/login" class="app-card-link">Launch CRM <i class="fa-solid fa-arrow-right"></i></a>
            </div>

            <!-- App 5: Inventory -->
            <div class="app-card">
                <div>
                    <div class="app-icon-wrap icon-inventory">
                        <i class="fa-solid fa-boxes-stacked"></i>
                    </div>
                    <h3>Inventory & Operations</h3>
                    <p>Warehouse management, stock moves, serial tracking, inventory valuation, and automated reordering rules.</p>
                    <ul class="app-card-features">
                        <li><i class="fa-solid fa-circle-check"></i> Multi-location stock tracking</li>
                        <li><i class="fa-solid fa-circle-check"></i> Product variants and barcode scanner ready</li>
                        <li><i class="fa-solid fa-circle-check"></i> Real-time valuation updates</li>
                    </ul>
                </div>
                <a href="/login" class="app-card-link">Launch Inventory <i class="fa-solid fa-arrow-right"></i></a>
            </div>

            <!-- App 6: Studio -->
            <div class="app-card">
                <div>
                    <div class="app-icon-wrap icon-studio">
                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <h3>Studio & View Builder</h3>
                    <p>Design and customize QWeb XML templates, add custom fields, configure Kanban cards, and build menus visually.</p>
                    <ul class="app-card-features">
                        <li><i class="fa-solid fa-circle-check"></i> Visual XML View Editor & Preview</li>
                        <li><i class="fa-solid fa-circle-check"></i> Custom model generator without code changes</li>
                        <li><i class="fa-solid fa-circle-check"></i> Interactive Menu Hierarchy manager</li>
                    </ul>
                </div>
                <a href="/login" class="app-card-link">Launch Studio <i class="fa-solid fa-arrow-right"></i></a>
            </div>
        </div>

        <!-- ── Database Compatibility Banner ──────────────────────── -->
        <div class="db-banner" id="databases">
            <div class="db-banner-info">
                <div style="font-size:12px; font-weight:800; color:var(--odoo-purple); text-transform:uppercase; margin-bottom:4px;">
                    Enterprise Database Engine
                </div>
                <h3>Native Multi-Database Support</h3>
                <p>AdvSoft runs seamlessly across your enterprise database infrastructure with dynamic dialect adjustment and zero code rewrites.</p>
            </div>
            <div class="db-pills">
                <span class="db-pill"><i class="fa-solid fa-database"></i> PostgreSQL</span>
                <span class="db-pill"><i class="fa-solid fa-database"></i> MariaDB</span>
                <span class="db-pill"><i class="fa-solid fa-database"></i> MySQL</span>
                <span class="db-pill"><i class="fa-solid fa-database"></i> SQL Server</span>
                <span class="db-pill"><i class="fa-solid fa-database"></i> Oracle DB</span>
                <span class="db-pill"><i class="fa-solid fa-database"></i> SQLite</span>
                <span class="db-pill"><i class="fa-solid fa-database"></i> Firebird</span>
            </div>
        </div>
    </section>

    <!-- ── 4. Technical Architecture (Dark Section) ───────────────── -->
    <section class="dark-section-bg" id="architecture">
        <div class="dark-section-inner">
            <div class="dark-section-header">
                <div style="font-size:12px; font-weight:800; color:#A26B93; text-transform:uppercase; margin-bottom:8px;">
                    Architecture & Power
                </div>
                <h2>Engineered for Extreme Speed & Reliability</h2>
                <p>Designed with clean separations: Declarative metadata models on the backend and an ultra-responsive reactive UI on the frontend.</p>
            </div>

            <div class="glass-grid" id="features">
                <div class="glass-card">
                    <div class="glass-card-icon">
                        <i class="fa-solid fa-bolt"></i>
                    </div>
                    <h3>Eliminated N+1 Queries</h3>
                    <p>Optimized relational preloading aggregates Many2one and Many2many foreign keys into single-query batches, ensuring instant page rendering.</p>
                </div>

                <div class="glass-card">
                    <div class="glass-card-icon">
                        <i class="fa-solid fa-shield-halved"></i>
                    </div>
                    <h3>Multi-Level Security & ACL</h3>
                    <p>Built-in 7-layer security system featuring Model ACL, Field-level permissions, and row-level dynamic record filtering rules.</p>
                </div>

                <div class="glass-card">
                    <div class="glass-card-icon">
                        <i class="fa-solid fa-code"></i>
                    </div>
                    <h3>Declarative QWeb XML</h3>
                    <p>Define forms, trees, and search filters with intuitive Odoo-compatible XML tags like &lt;sheet&gt;, &lt;notebook&gt;, and &lt;field&gt;.</p>
                </div>

                <div class="glass-card">
                    <div class="glass-card-icon">
                        <i class="fa-solid fa-layer-group"></i>
                    </div>
                    <h3>Multiple Connections</h3>
                    <p>Connect and switch across multiple databases within the same request using transaction stacking and per-model database binding.</p>
                </div>

                <div class="glass-card">
                    <div class="glass-card-icon">
                        <i class="fa-solid fa-chart-pie"></i>
                    </div>
                    <h3>Pivot & Graph Analytics</h3>
                    <p>Instantly aggregate measures and dimensions with built-in multi-level grouping, sum, average, min, and max aggregators.</p>
                </div>

                <div class="glass-card">
                    <div class="glass-card-icon">
                        <i class="fa-solid fa-mobile-screen-button"></i>
                    </div>
                    <h3>Responsive & Modern</h3>
                    <p>Works smoothly across desktops, tablets, and mobile screens with dark mode support and modern Tailwind/Shadcn inspired design tokens.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- ── 5. Final Call to Action ────────────────────────────────── -->
    <section class="cta-section">
        <div class="cta-card">
            <h2>Transform Your Business Operations Today</h2>
            <p>Experience the simplicity of unified applications. Get started in seconds with our fully functional live demo environment.</p>
            <div class="cta-buttons">
                <a href="/login" class="btn btn-white btn-lg">
                    <i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In to Demo
                </a>
                <a href="/register" class="btn btn-outline-white btn-lg">
                    <i class="fa-solid fa-user-plus"></i> Create Account
                </a>
            </div>
        </div>
    </section>

    <!-- ── 6. Footer ──────────────────────────────────────────────── -->
    <footer class="footer">
        <div class="footer-grid">
            <div class="footer-brand">
                <div class="brand-logo" style="margin-bottom: 14px;">
                    <div class="brand-icon" style="width:32px; height:32px; font-size:15px;">
                        <i class="fa-solid fa-cube"></i>
                    </div>
                    <span class="brand-text" style="font-size: 18px;">AdvSoft</span>
                </div>
                <p>The modern, metadata-driven business application platform combining Odoo aesthetics with Pure Adianti Framework reliability.</p>
            </div>

            <div class="footer-col">
                <h5>Applications</h5>
                <ul>
                    <li><a href="/login">Accounting & Tax</a></li>
                    <li><a href="/login">Project & Tasks</a></li>
                    <li><a href="/login">Spreadsheet Docs</a></li>
                    <li><a href="/login">CRM & Partners</a></li>
                    <li><a href="/login">Inventory Control</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h5>Architecture</h5>
                <ul>
                    <li><a href="#databases">Multi-DB Engine</a></li>
                    <li><a href="#architecture">QWeb XML Engine</a></li>
                    <li><a href="#features">Security & ACL</a></li>
                    <li><a href="#features">ORM QueryBuilder</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h5>Get Started</h5>
                <ul>
                    <li><a href="/login">Sign In</a></li>
                    <li><a href="/register">Register</a></li>
                    <li><a href="/engine.php?class=LoginForm">Standard Adianti</a></li>
                </ul>
            </div>
        </div>

        <div class="footer-bottom">
            <p>&copy; <?= date('Y') ?> AdvSoft ERP. All rights reserved. Powered by Pure Adianti PHP Framework.</p>
            <p style="display:flex; gap:16px;">
                <a href="#navbar" style="color:inherit; text-decoration:none;">Back to top <i class="fa-solid fa-arrow-up"></i></a>
            </p>
        </div>
    </footer>

    <script>
        // Navbar scroll effect
        window.addEventListener('scroll', function() {
            const nav = document.getElementById('navbar');
            if (window.scrollY > 20) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
    </script>
</body>
</html>
