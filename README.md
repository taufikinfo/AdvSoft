# AdvSoft

<p align="center">
  <strong>Metadata-Driven Enterprise Business Application Platform</strong><br>
  <em>Built on pure Adianti PHP Framework Backend & modern OWL 2.0 SPA Web Client</em>
</p>

<p align="center">
  <a href="#english">English</a> •
  <a href="#português">Português</a>
</p>

---

<a name="english"></a>
## 🇬🇧 English

> **AdvSoft** is a modern, metadata-driven business application platform inspired by Odoo architecture, developed on top of the **Adianti PHP Framework** backend and the high-performance **OWL 2.0 (Odoo Web Library)** frontend SPA.

### 🚀 Key Features

- **Metadata-Driven ORM & Registry**: Dynamic model definitions, relational fields (`many2one`, `one2many`, `many2many`), computed fields, and domain filter expressions.
- **OWL 2.0 Rich UI**: Interactive multi-view web client featuring Form, List, Kanban, Calendar, Graph, Pivot, and Spreadsheet views.
- **Pure Adianti Framework Engine**: Built strictly according to Adianti architecture (`lib/adianti`, `app/config`, `app/control`, `app/model`, `app/resources`, `init.php`).
- **Security & Multi-Company**: Granular access control lists (ACLs via `ir.model.access`), record rules (`ir.rule`), group hierarchies, and sudo/super-user execution contexts.
- **Modular Addons**: Native business modules (`base`, `project`, `account`, `showcase`, `spreadsheet`) with automated manifest discovery (`advsoft.json`).
- **Financial & Accounting Reports**: Dynamic financial statements including Trial Balance, General Ledger, Balance Sheet, and Income Statement.
- **Visual Customization Tools**: Built-in visual View Builder and drag-and-drop Menu Editor.
- **Modern Dialog & Notification System**: Native glassmorphism alert, confirm, error modals, and toast notifications stack with dark mode support.
- **Collaborative Spreadsheet**: Embedded spreadsheet engine with live formula calculations, pivot integration, and chart plugins.

---

### 📦 Quick Start

#### 1. Prerequisites
- **PHP** >= 8.3 (Required extensions: `pdo_sqlite`, `mbstring`, `fileinfo`, `dom`)
- **Composer** (optional, for dependency updates)

#### 2. Database Migration & Seed
The SQLite database is pre-configured at `database/database.sqlite`. To reset or run seeders:
```bash
php test_api.php
```

#### 3. Start Local Development Server
Run the built-in PHP development server:
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
│   ├── config/              # Application & database configurations (adiantisoft.ini, application.php)
│   ├── control/             # Adianti Page & Action Controllers (app/control/Controllers/)
│   ├── database/            # Database runners & schema migrations
│   ├── model/               # Active Record Models (BaseModel, Account, Project, Res, Ir, etc.)
│   ├── Odoo/                # Core Odoo/AdvSoft Engine & Security (Core, Registry, ModelDefinition, Field, Domain)
│   └── resources/           # Blade views, templates, and UI assets (views, css, js)
├── database/
│   ├── database.sqlite      # SQLite Database
│   ├── migrations/          # Table schema definitions
│   └── seeders/             # Initial fixtures & seeders
├── lib/
│   └── adianti/             # Adianti PHP Framework Core Library
├── public/
│   ├── css/                 # Modern stylesheets (odoo-layout.css, odoo-dialog.css, app.bundle.css)
│   └── js/                  # OWL 2.0 Web Client (Core, Widgets, Views, Pages, Dialog System)
├── routes/
│   └── web.php              # Route definitions & API endpoints
├── index.php                # Front Controller & Application Gateway
├── init.php                 # Adianti Autoloader & Bootstrap
├── compile_assets.php       # Asset bundle compiler (production mode)
└── composer.json            # Dependencies & PSR-4 Autoload configuration
```

---

<a name="português"></a>
## 🇵🇹 Português

> **AdvSoft** é uma plataforma de aplicativos empresariais orientada a metadados (*metadata-driven*), inspirada na arquitetura Odoo, construída com backend sobre o **Adianti PHP Framework** e frontend moderno em **OWL 2.0 (Odoo Web Library)**.

### 🚀 Recursos Principais

- **ORM Orientado a Metadados & Registry**: Definições dinâmicas de modelos, relacionamentos (`many2one`, `one2many`, `many2many`), campos computados e expressões de filtro de domínio.
- **Interface Rica com OWL 2.0**: Cliente web SPA com suporte a múltiplas visualizações interativas: Formulário (Form), Lista (List), Kanban, Calendário (Calendar), Gráfico (Graph), Tabela Dinâmica (Pivot) e Planilha (Spreadsheet).
- **Estrutura Pura Adianti Framework**: Desenvolvido em total conformidade com a convenção do Adianti Framework (`lib/adianti`, `app/config`, `app/control`, `app/model`, `app/resources`, `init.php`).
- **Segurança & Multi-Empresa**: Controle de acesso detalhado (ACLs via `ir.model.access`), regras de registro (`ir.rule`), hierarquia de grupos e contexto de superusuário/sudo.
- **Sistema Modular de Addons**: Módulos empresariais integrados (`base`, `project`, `account`, `showcase`, `spreadsheet`) com descoberta automática de manifesto (`advsoft.json`).
- **Relatórios Contábeis & Financeiros**: Balancete de Verificação (Trial Balance), Livro Razão (General Ledger), Balanço Patrimonial (Balance Sheet) e DRE (Income Statement).
- **Ferramentas Visuais Integradas**: View Builder (construtor visual de visões) e Menu Editor (gerenciador visual de menus arrastar e soltar).
- **Sistema Moderno de Diálogos & Notificações**: Modais de alerta, confirmação e erro com design Glassmorphism e notificações toast com suporte a modo escuro/claro.
- **Planilhas Integradas**: Mecanismo de planilha eletrônica autônomo com fórmulas dinâmicas, tabelas dinâmicas e integração com gráficos.

---

### 📦 Instalação e Execução

#### 1. Pré-requisitos
- **PHP** >= 8.3 (Extensões necessárias: `pdo_sqlite`, `mbstring`, `fileinfo`, `dom`)
- **Composer** (opcional, para atualização de dependências)

#### 2. Migração do Banco de Dados & Seeders
O banco de dados SQLite já está configurado em `database/database.sqlite`. Para executar ou redefinir:
```bash
php test_api.php
```

#### 3. Iniciar o Servidor Local
Execute o servidor embutido do PHP:
```bash
php -S 127.0.0.1:8000 index.php
```
Acesse no seu navegador: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

### 🔑 Credenciais Padrão

| Perfil | Usuário | Senha |
|---|---|---|
| **Administrador do Sistema** | `admin` | `admin` |
| **Usuário de Demonstração** | `demo` | `demo` |

---

### 📁 Estrutura de Diretórios

```
AdvSoft/
├── app/
│   ├── config/              # Configurações do aplicativo e banco de dados (adiantisoft.ini, application.php)
│   ├── control/             # Controladores de Página e Ação Adianti (app/control/Controllers/)
│   ├── database/            # Scripts de execução e migrações do banco de dados
│   ├── model/               # Modelos Active Record (BaseModel, Account, Project, Res, Ir, etc.)
│   ├── Odoo/                # Motor Odoo/AdvSoft e Segurança (Core, Registry, ModelDefinition, Field, Domain)
│   └── resources/           # Visões Blade, templates e recursos (views, css, js)
├── database/
│   ├── database.sqlite      # Banco de dados SQLite
│   ├── migrations/          # Definições de esquema das tabelas
│   └── seeders/             # Dados iniciais e fixtures
├── lib/
│   └── adianti/             # Biblioteca Central do Adianti PHP Framework
├── public/
│   ├── css/                 # Estilos CSS modernos (odoo-layout.css, odoo-dialog.css, app.bundle.css)
│   └── js/                  # Cliente Web OWL 2.0 (Core, Widgets, Views, Pages, Dialog System)
├── routes/
│   └── web.php              # Definições de rotas e endpoints da API
├── index.php                # Front Controller e Gateway da Aplicação
├── init.php                 # Autoloader e Inicialização do Adianti
├── compile_assets.php       # Compilador de bundles de assets (modo de produção)
└── composer.json            # Dependências e configuração de Autoload PSR-4
```

---

<p align="center">
  <sub>AdvSoft &copy; 2026. Powered by Adianti PHP Framework & OWL 2.0.</sub>
</p>
