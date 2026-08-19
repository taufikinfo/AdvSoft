# Adiantisoft

> **Adiantisoft** adalah platform aplikasi bisnis berbasis metadata (*metadata-driven*) dengan arsitektur Odoo/Larasoft yang dibangun dengan backend **Adianti PHP Framework** dan frontend modern **OWL 2.0 Web Client**.

---

## 🚀 Fitur Utama

- **Metadata-Driven ORM & Registry**: Mendukung definisi model dinamis, relasi (`many2one`, `one2many`, `many2many`), computed fields, dan domain filters.
- **OWL 2.0 Rich UI**: Tampilan Form, List, Kanban, Calendar, Graph, Pivot, dan Spreadsheet interaktif.
- **Adianti Framework Engine**: Menggunakan struktur dan pustaka inti Adianti PHP Framework (`lib/adianti`, `app/config`, `app/control`, `init.php`).
- **Security & Multi-Company**: ACL berbasis `ir.model.access`, `ir.rule`, Group permissions, dan impersonasi/sudo context.
- **Addon/Module System**: Modul bawaan (`base`, `project`, `account`, `showcase`, `spreadsheet`) dengan parsing data XML otomatis.
- **Financial Reports & Accounting**: Trial Balance, General Ledger, Balance Sheet, Income Statement.
- **Visual Tools**: View Builder & Menu Editor terintegrasi.
- **Collaborative Spreadsheet**: Engine spreadsheet mandiri dengan formula, pivot, dan chart plugin.

---

## 📦 Menjalankan Aplikasi

### 1. Prasyarat
- PHP >= 8.3 / 8.4 (ekstensi: `pdo_sqlite`, `mbstring`, `fileinfo`, `dom`)
- Composer (opsional untuk update vendor)

### 2. Migrasi & Seed Database
Database SQLite sudah otomatis disiapkan di `database/database.sqlite`. Untuk me-reset atau menjalankan ulang migrasi & seeder:
```bash
php app/database/run_migrations_and_seeders.php
```

### 3. Menjalankan Server Lokal
Jalankan server PHP bawaan:
```bash
php -S 127.0.0.1:8000 index.php
```
Buka browser di: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 🔑 Akun Default

| Role | Username | Password |
|---|---|---|
| **System Administrator** | `admin` | `admin` |
| **Demo User** | `demo` | `demo` |

---

## 📁 Struktur Direktori

```
adiantisoft/
├── addons/                  # Modul & Addon (base, project, account, showcase, spreadsheet)
├── app/
│   ├── config/              # Konfigurasi aplikasi & database (adiantisoft.ini, application.php)
│   ├── control/             # Controller & Service Adianti
│   ├── database/            # Skrip migrasi & database runner
│   ├── Http/Controllers/    # API Controllers (ORM, Auth, ViewBuilder, Reports, dll.)
│   ├── Models/              # Eloquent & Adianti Model Classes
│   └── Odoo/                # Engine Odoo (Registry, ModelDefinition, Field, Domain, Security)
├── database/
│   ├── database.sqlite      # Database SQLite
│   ├── migrations/          # Definisi skema tabel
│   └── seeders/             # Data awal / fixtures
├── lib/
│   └── adianti/             # Pustaka Inti Adianti Framework
├── public/
│   ├── css/                 # Stylesheet OWL & Odoo Layout
│   └── js/                  # Script OWL UI (Core, Widgets, Views, Pages)
├── resources/
│   └── views/               # Template login, register, dan SPA shell
├── index.php                # Front Controller & API Gateway
├── init.php                 # Autoloader & Bootstrap Adianti
└── composer.json            # Manifest dependensi & PSR-4 Autoload
```
