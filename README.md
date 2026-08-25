# AdvSoft

<p align="center">
  <strong>Metadata-Driven Enterprise Business Application Platform</strong><br>
  <em>Built on pure Adianti PHP Framework Backend & modern OWL 2.0 SPA Web Client</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/PHP-8.1%2B-777BB4?style=flat-square&logo=php&logoColor=white" alt="PHP Version" />
  <img src="https://img.shields.io/badge/Database-MySQL%20%7C%20SQLite-00758F?style=flat-square&logo=mysql&logoColor=white" alt="Databases" />
  <img src="https://img.shields.io/badge/Framework-Adianti%20Core-blue?style=flat-square" alt="Framework" />
  <img src="https://img.shields.io/badge/UI-OWL%202.0%20SPA-orange?style=flat-square" alt="OWL" />
  <img src="https://img.shields.io/badge/i18n-Dynamic%20%2B%20XML-purple?style=flat-square" alt="i18n" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

<p align="center">
  <a href="#english">English</a> •
  <a href="#bahasa-indonesia">Bahasa Indonesia</a> •
  <a href="#português">Português</a> •
  <a href="TUTORIAL.md"><strong>Complete Tutorial (Zero to Hero)</strong></a>
</p>

---

## 📸 Screenshots Showcase

<p align="center">
  <img src="docs/screenshots/kanban_view.png" alt="Tasks Kanban View" width="100%" />
  <br><em>Interactive Drag-and-Drop Kanban View with Stage Management, Tags, Priority Stars, and Progress Bars</em>
</p>

<table width="100%">
  <tr>
    <td width="50%" align="center">
      <img src="docs/screenshots/list_view.png" alt="Tasks List View" width="100%" />
      <br><strong>Responsive List Grid View</strong><br>
      <em>Dynamic column aggregates (Sum, Avg), badges & row styling</em>
    </td>
    <td width="50%" align="center">
      <img src="docs/screenshots/form_view.png" alt="Task Form View" width="100%" />
      <br><strong>Document Form View</strong><br>
      <em>Interactive statusbar, 2-column layout & One2Many tabs</em>
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <img src="docs/screenshots/spreadsheet_view.png" alt="Spreadsheet View" width="100%" />
      <br><strong>Collaborative Spreadsheet Engine</strong><br>
      <em>Embedded spreadsheet grid for bulk data entry, formula calculation, and live reporting</em>
    </td>
  </tr>
</table>

---

<a name="english"></a>
## 🇬🇧 English

> **AdvSoft** is a modern, metadata-driven business application platform inspired by Odoo architecture, developed on top of the **Adianti PHP Framework** backend and the high-performance **OWL 2.0 (Odoo Web Library)** frontend SPA.

### 🚀 Key Features

- **Metadata-Driven ORM & Registry**: Declarative model definitions, relational fields (`many2one`, `one2many`, `many2many`), computed fields (`@api.depends`), constraints (`@api.constrains`), and domain filter expressions.
- **OWL 2.0 Multi-View UI**: Interactive web client featuring Form, List, Kanban, Calendar, Graph, Pivot, and Spreadsheet views.
- **Pure Adianti Framework Engine**: Built strictly on native PHP and Adianti architecture (`lib/adianti`, `app/config`, `app/control`, `app/model`, `app/Advsoft`, `init.php`).
- **Dynamic Internationalization (i18n & `ir.translation`)**: Odoo-style database translation table (`ir_translations`) + modular XML files (`app/control/{module}/i18n/{lang}.xml`) with zero-latency in-memory dictionary caching.
- **Centralized Configuration (`app/config/application.php`)**: Unified environment toggle (`development` vs `production`), asset bundler modes, i18n locales, multi-company, UI, and security settings.
- **Asset Pipeline & Bundler**: Switch between raw source JS/CSS scripts (development debugging) and minified single bundles `app.bundle.js` / `app.bundle.css` (production fast page load).
- **6-Layer Security Architecture**: Granular access control lists (ACLs via `ir.model.access`), record rules (`ir.rule` with dynamic domain tokens), group hierarchies, and sudo/super-user execution contexts.
- **Modular Addons**: Native business modules (`base`, `project`, `account`, `showcase`, `spreadsheet`) with standardized `advsoft.json` manifests.
- **Financial & Accounting Suite**: Complete double-entry accounting with Trial Balance, General Ledger, Balance Sheet, and Income Statements.
- **Visual Customization Tools**: Built-in visual View Builder and drag-and-drop Menu Editor.
- **QWeb Reporting Engine**: Embedded QWeb XML template rendering with PDF generation via Dompdf and HTML live preview.
- **Collaborative Spreadsheet**: Embedded spreadsheet engine with live formula calculations, pivot integration, and multi-user presence.

---

### 📦 Quick Start

#### 1. Prerequisites
- **PHP** >= 8.1 (Extensions: `pdo_mysql` or `pdo_sqlite`, `mbstring`, `json`, `openssl`)
- **MySQL 5.7+ / 8.0+** or **SQLite 3**
- **Composer**

#### 2. Setup & Database Installation

```bash
# Clone the repository
git clone https://github.com/taufikinfo/AdvSoft.git
cd AdvSoft

# Install PHP dependencies
composer install

# Option A: MySQL (Production / Standard)
mysql -u root -p -e "CREATE DATABASE advsoft CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p advsoft < app/database/advsoft.sql

# Sync modular XML translations to database
php -r "require 'app/bootstrap.php'; \App\Advsoft\Translation\XmlTranslationLoader::syncAllModules();"
```

#### 3. Asset Compilation (Optional for Production)
```bash
# Compile single JS and CSS bundles for production
php compile_assets.php
```

#### 4. Run Test Suite
```bash
php test_api.php
```

#### 5. Start Local Development Server
```bash
php -S 127.0.0.1:8000 index.php
```
Open your browser at: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

### 🔑 Default Credentials

| Role | Username | Password |
|---|---|---|
| **System Administrator** | `admin` | `admin` |
| **Demo User** | `demo` | `demo` |

---

### 📁 Directory Structure

```
AdvSoft/
├── app/
│   ├── Advsoft/             # Core Engine (Registry, ModelDefinition, Field, Security, QWeb, Translation)
│   ├── config/              # Centralized Configs (application.php, advsoft.ini)
│   ├── control/             # Addons & Controllers (Controllers/, project, account, base, spreadsheet)
│   │   ├── account/i18n/    # Modular XML translations (en.xml, id.xml)
│   │   └── base/i18n/       # Modular XML translations (en.xml, id.xml)
│   ├── database/            # Database assets (database.sqlite, migrations/, seeders/, advsoft.sql)
│   ├── model/               # Active Record Models (BaseModel, Account, Project, Res, Ir)
│   └── resources/           # Blade views, templates, and UI assets (views, css, js)
├── docs/
│   └── screenshots/         # Application visual documentation
├── lib/
│   └── adianti/             # Adianti PHP Framework Core Library
├── public/
│   ├── css/                 # Modern stylesheets (adianti-design-system.css, app.bundle.css)
│   └── js/                  # OWL 2.0 Web Client (Core, Widgets, Views, Pages, app.bundle.js)
├── routes/
│   └── web.php              # Route definitions & API endpoints (ORM, Assets, Translations, Reports)
├── TUTORIAL.md              # 📖 Complete Developer Tutorial (From Zero to Hero)
├── index.php                # Front Controller & Application Gateway
├── init.php                 # Adianti Autoloader & Bootstrap
├── compile_assets.php       # Asset bundle compiler CLI (production mode)
└── composer.json            # Dependencies & PSR-4 Autoload configuration
```

---

<a name="bahasa-indonesia"></a>
## 🇮🇩 Bahasa Indonesia

> **AdvSoft** adalah platform aplikasi bisnis berbasis metadata (*metadata-driven*) yang terinspirasi dari arsitektur Odoo, dibangun di atas backend **Adianti PHP Framework** dan antarmuka modern **OWL 2.0 (Odoo Web Library)** SPA.

### 🚀 Fitur Unggulan

- **Arsitektur Multi-Bahasa Dinamis (i18n & `ir.translation`)**: Tabel translasi dinamis database (`ir_translations`) + file XML modular per modul (`app/control/{module}/i18n/{lang}.xml`) dengan in-memory caching untuk performa tinggi tanpa query berulang.
- **Konfigurasi Terpusat (`app/config/application.php`)**: Manajemen mode environment (`development` vs `production`), asset bundler, multi-bahasa, multi-company, dan keamanan dalam satu file terstruktur.
- **Asset Pipeline & Bundler**: Pilihan pemuatan script JS/CSS asli per file saat development, atau bundle tunggal terminifikasi (`app.bundle.js` & `app.bundle.css`) untuk produksi.
- **ORM & Model Definition Berbasis Metadata**: Deklarasi model dinamis, field relasional (`many2one`, `one2many`, `many2many`), computed fields (`@api.depends`), validasi (`@api.constrains`), dan domain filter.
- **Multi-View UI Lengkap (OWL 2.0)**: Form View, List View, Kanban (drag & drop), Calendar, Graph, Pivot, dan Spreadsheet interaktif.
- **Sistem Keamanan 6 Layer**: ACL (`ir.model.access`), Record Rules (`ir.rule`), hierarki grup pengguna, dan superuser mode (`sudo()`).
- **Mesin Pelaporan QWeb**: Render template XML QWeb dengan export PDF dan preview live HTML.
- **Spreadsheet Kolaboratif**: Grid spreadsheet terintegrasi dengan formula dinamis, pivot, dan sinkronisasi multi-pengguna.

---

<a name="português"></a>
## 🇵🇹 Português

> **AdvSoft** é uma plataforma de aplicativos empresariais orientada a metadados (*metadata-driven*), inspirada na arquitetura Odoo, construída com backend sobre o **Adianti PHP Framework** e frontend moderno em **OWL 2.0 (Odoo Web Library)**.

### 🚀 Recursos Principais

- **Internacionalização Dinâmica (i18n & `ir.translation`)**: Tabela de tradução em banco de dados (`ir_translations`) + arquivos XML modulares (`app/control/{module}/i18n/{lang}.xml`) com cache em memória de alta performance.
- **Configuração Centralizada (`app/config/application.php`)**: Alternância de ambiente (`development` / `production`), pipeline de assets, idiomas disponíveis, multi-empresa e segurança.
- **Pipeline de Assets**: Carregamento de scripts individuais em desenvolvimento ou pacotes únicos minificados (`app.bundle.js` / `app.bundle.css`) em produção.
- **ORM Orientado a Metadados & Registry**: Definições dinâmicas de modelos, relacionamentos (`many2one`, `one2many`, `many2many`), campos computados (`@api.depends`), validações (`@api.constrains`) e filtros de domínio.
- **Interface Rica com OWL 2.0**: Cliente web SPA com suporte a múltiplas visualizações: Form, List, Kanban, Calendar, Graph, Pivot e Spreadsheet.
- **Segurança em 6 Camadas**: Controle de acesso detalhado (ACLs via `ir.model.access`), regras de registro (`ir.rule`), hierarquia de grupos e contexto de superusuário (`sudo()`).
- **Motor de Relatórios QWeb**: Renderização de templates XML/QWeb com exportação para PDF via Dompdf e pré-visualização em HTML.
- **Planilhas Colaborativas Integradas**: Mecanismo de planilha eletrônica autônomo com fórmulas dinâmicas, tabelas dinâmicas e colaboração multiusuário.

---

### 📚 Documentasi & Tutorial Lengkap

Lihat file [**TUTORIAL.md**](TUTORIAL.md) untuk panduan komprehensif *From Zero to Hero*, meliputi:
- Panduan pembuatan modul & tabel baru dari nol
- Konfigurasi Multi-Bahasa Dinamis (Database `ir_translations` & File XML `i18n/*.xml`)
- Konfigurasi Environment & Asset Pipeline Produksi
- Matriks lengkap tipe Field dan Widget OWL
- Konfigurasi List, Form, Kanban, Search, Graph, Pivot, dan Spreadsheet
- Mesin pelaporan QWeb & cetak PDF
- Arsitektur keamanan, ACL, dan Record Rules

---

<p align="center">
  <sub>AdvSoft &copy; 2026. Powered by Adianti PHP Framework & OWL 2.0. MIT License.</sub>
</p>
