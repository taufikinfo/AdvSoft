# AdvSoft — Complete Developer Tutorial

> **From Zero to Hero: The Definitive Guide to Building Enterprise Business Applications with Pure PHP**

AdvSoft is an enterprise-grade business application framework built on top of **Adianti Framework** (PHP 8.1+). It features an architecture inspired by Odoo — declarative **Model Definitions**, **Rich Field Types**, **Multi-View UI Engine (List, Form, Kanban, Calendar, Graph, Pivot, Spreadsheet)**, **6-Layer Security Engine**, **QWeb Reporting**, **Realtime Collaborative Spreadsheets**, and **Active Record ORM** — all without requiring Laravel, Symfony, or external frontend framework builds.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites & Quick Start](#2-prerequisites--quick-start)
3. [Project Structure](#3-project-structure)
4. [Configuration & Environment](#4-configuration--environment)
5. [The Three Pillars: Model · Definition · Controller](#5-the-three-pillars-model--definition--controller)
6. [Active Record Model (`app/model`)](#6-active-record-model-appmodel)
7. [Model Definition (`app/control/*/Models`)](#7-model-definition-appcontrolmodels)
8. [Complete Field Types Reference](#8-complete-field-types-reference)
9. [View Engine & Configurations](#9-view-engine--configurations)
   - [List View (Tree)](#91-list-view-tree)
   - [Form View](#92-form-view)
   - [Search View & Filters](#93-search-view--filters)
   - [Kanban View](#94-kanban-view)
   - [Calendar, Graph & Pivot Views](#95-calendar-graph--pivot-views)
   - [Spreadsheet Grid View](#96-spreadsheet-grid-view)
10. [Model Inheritance Engine](#10-model-inheritance-engine)
11. [Security Architecture (6 Layers)](#11-security-architecture-6-layers)
12. [Business Logic & API Decorators](#12-business-logic--api-decorators)
13. [QWeb Report Engine & Document Printing](#13-qweb-report-engine--document-printing)
14. [Realtime Collaborative Spreadsheet Engine](#14-realtime-collaborative-spreadsheet-engine)
15. [Routing & Generic ORM Controller](#15-routing--generic-orm-controller)
16. [Building a Complete Module from Zero to Hero](#16-building-a-complete-module-from-zero-to-hero)
17. [Database Migration, Seeding & DDL/DML](#17-database-migration-seeding--ddldml)
18. [Frontend Integration & Design System](#18-frontend-integration--design-system)
19. [Testing & Quality Assurance](#19-testing--quality-assurance)
20. [Deployment & Production Tuning](#20-deployment--production-tuning)
21. [Complete API & Helper Reference](#21-complete-api--helper-reference)

---

## 1. Architecture Overview

AdvSoft bridges the gap between high-productivity low-code declarative models and high-performance native PHP execution.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           BROWSER CLIENT (OWL SPA)                       │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐ ┌─────────┐  │
│  │ List View │  │ Form View │  │  Kanban  │  │Spreadsheet │ │ Reports │  │
│  └─────┬─────┘  └─────┬─────┘  └────┬─────┘  └─────┬──────┘ └────┬────┘  │
│        └──────────────┼─────────────┼──────────────┼───────────┘         │
│                       ▼             ▼              ▼                     │
│                             JSON REST API / RPC                          │
└───────────────────────────────────────┬──────────────────────────────────┘
                                        │ HTTP POST / GET
┌───────────────────────────────────────▼──────────────────────────────────┐
│                         ADVSOFT BACKEND (PHP 8.1+)                       │
│                                                                          │
│  ┌─────────────────┐       ┌─────────────────┐    ┌───────────────────┐  │
│  │  Router / HTTP  │──────▶│ OrmController / │───▶│   ModelRegistry   │  │
│  │ (routes/web.php)│       │ Custom Handlers │    │  Auto-Discovery   │  │
│  └─────────────────┘       └────────┬────────┘    └─────────┬─────────┘  │
│                                     │                       │            │
│                       ┌─────────────▼─────────────┐         │            │
│                       │      ModelDefinition      │◀────────┘            │
│                       │  ┌─────────────────────┐  │                      │
│                       │  │ Field Definitions   │  │                      │
│                       │  │ View Declarations   │  │                      │
│                       │  │ Security Context    │  │                      │
│                       │  │ Business Logic API  │  │                      │
│                       │  │ @depends/@constrains│  │                      │
│                       │  └─────────────────────┘  │                      │
│                       └─────────────┬─────────────┘                      │
│                                     │ Delegates persistence              │
│                       ┌─────────────▼─────────────┐                      │
│                       │    ActiveRecord Model     │                      │
│                       │    (App\Model\BaseModel)  │                      │
│                       │   extends Adianti TRecord │                      │
│                       └─────────────┬─────────────┘                      │
│                                     │ SQL Transaction                    │
│                       ┌─────────────▼─────────────┐                      │
│                       │ MySQL / MariaDB / SQLite  │                      │
│                       └───────────────────────────┘                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Prerequisites & Quick Start

### System Requirements

- **PHP**: 8.1 or higher (Extensions: `pdo`, `pdo_mysql`, `pdo_sqlite`, `mbstring`, `json`, `openssl`, `gd`)
- **Database**: MySQL 5.7+ / 8.0+ / MariaDB 10.3+ (or SQLite 3 for local dev)
- **Composer**: PHP Dependency Manager
- **Web Server**: Built-in PHP CLI server, Nginx, or Apache

### 5-Minute Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/taufikinfo/AdvSoft.git
cd AdvSoft

# 2. Install PHP Composer dependencies
composer install

# 3. Setup MySQL Database
mysql -u root -p -e "CREATE DATABASE advsoft CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p advsoft < app/database/advsoft.sql

# 4. Verify Configuration (app/config/advsoft.ini)
# Ensure your user/pass match your local MySQL configuration

# 5. Run Built-in Server
php -S localhost:8000 -t .

# 6. Access in Browser
# URL: http://localhost:8000
# Default Login: admin / admin
```

---

## 3. Project Structure

AdvSoft follows a modular structure where domain modules (addons) contain both their Model Definitions and View logic:

```
AdvSoft/
├── app/
│   ├── Advsoft/                          # 🚀 Core Framework Engine
│   │   ├── Concerns/                     # Reusable Traits
│   │   │   ├── HasAccessControl.php      # Security, ACL & domain rules
│   │   │   ├── HasApiDecorators.php      # @api decorators (@depends, @constrains)
│   │   │   ├── HasInheritance.php        # Model extension & delegation
│   │   │   └── HasLifecycleHooks.php     # create, write, unlink hooks
│   │   ├── Core/                         # Foundation Infrastructure
│   │   │   ├── Application.php           # Service Container / IoC
│   │   │   ├── Database/                 # QueryBuilder, SchemaManager, Seeder
│   │   │   ├── Http/                     # Request, Response, JsonResponse, Router
│   │   │   ├── Support/                  # Collection, Str, Log, Route, AssetCompiler
│   │   │   ├── View/                     # Blade View Engine
│   │   │   └── helpers.php               # Global helper functions
│   │   ├── QWeb/                         # QWeb XML Template & PDF Report Compiler
│   │   ├── Security/                     # SecurityContext & SecurityService
│   │   ├── DataFileLoader.php            # XML/CSV/JSON Module Data Loader
│   │   ├── Domain.php                    # Domain expression parser ([['x','=',1]])
│   │   ├── Field.php                     # Complete Field Definitions & Widgets
│   │   ├── ModelDefinition.php           # 🌟 Declarative Base Model Definition
│   │   ├── ModuleInstaller.php           # Module discovery & migration manager
│   │   └── Registry.php                  # 🌟 Central Model Registry (Auto-discovery)
│   │
│   ├── config/
│   │   └── advsoft.ini                   # Database Connection Profile
│   │
│   ├── control/                          # 💼 Application Addons & Controllers
│   │   ├── Controllers/                  # REST API Controllers
│   │   │   ├── OrmController.php         # Generic CRUD API for all models
│   │   │   ├── AuthController.php        # Authentication & session
│   │   │   ├── ReportController.php      # QWeb & PDF report generator
│   │   │   ├── SpreadsheetCollaborationController.php # Live multi-user sheet
│   │   │   ├── SecurityController.php    # User, Group & ACL management
│   │   │   └── MenuEditorController.php  # Menu structure manager
│   │   ├── base/Models/                  # System models (ir.model, res.users, etc.)
│   │   ├── project/Models/               # Project module (tasks, stages, tags)
│   │   ├── account/Models/               # Accounting module (moves, lines, taxes)
│   │   └── spreadsheet/Models/           # Spreadsheet documents & cells
│   │
│   ├── database/                         # 🗄️ SQL Schema & Migration Dumps
│   │   ├── advsoft.sql                   # Full database dump (DDL + DML)
│   │   ├── advsoft-ddl.sql               # Clean table structures
│   │   ├── advsoft-dml.sql               # Seed data & initial setup
│   │   └── migrate_to_mysql.php          # Migration automation utility
│   │
│   ├── model/                            # 📦 Active Record Classes (TRecord)
│   │   ├── BaseModel.php                 # Base TRecord with QueryBuilder bridge
│   │   ├── Base/                         # System TRecords
│   │   ├── Project/                      # Project, Task, Stage, Tag TRecords
│   │   ├── Account/                      # AccountMove, AccountMoveLine TRecords
│   │   ├── Res/                          # ResUser, ResGroup, ResPartner TRecords
│   │   └── Spreadsheet/                  # Spreadsheet document TRecords
│   │
│   ├── bootstrap.php                     # Application Bootstrapper
│   └── resources/views/                  # Server-side Blade templates
│
├── database/                             # SQLite dev db, migrations & seeders
├── public/                               # Public assets (compiled JS/CSS, icons)
├── routes/
│   └── web.php                           # Application HTTP Route declarations
├── test_api.php                          # Automated 19-Scenario Test Suite
└── composer.json                         # Autoload & Dependencies
```

---

## 4. Configuration & Environment

The database connection is defined in `app/config/advsoft.ini`:

```ini
; MySQL / MariaDB (Production & Standard Development)
host   = "127.0.0.1"
port   = "3306"
name   = "advsoft"
user   = "root"
pass   = ""
type   = "mysql"
prep   = "1"

; SQLite (Alternative Local Development)
; host   = ""
; port   = ""
; name   = "database/database.sqlite"
; user   = ""
; pass   = ""
; type   = "sqlite"
; prep   = "1"
```

The system initializes transactions via Adianti `TTransaction::open('advsoft')`, which automatically configures PDO parameter binding and charset settings.

---

## 5. The Three Pillars: Model · Definition · Controller

Every business feature in AdvSoft is cleanly decoupled into three cooperative layers:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. Active Record (app/model/...)                                        │
│    Extends: App\Model\BaseModel (Adianti TRecord)                       │
│    Role: Low-level database persistence, relations, and table mapping.  │
├─────────────────────────────────────────────────────────────────────────┤
│ 2. Model Definition (app/control/.../Models/...)                        │
│    Extends: App\Advsoft\ModelDefinition                                 │
│    Role: Fields, widgets, views (list/form/kanban), ACL permissions,    │
│          business constraints, lifecycle hooks, and computations.       │
├─────────────────────────────────────────────────────────────────────────┤
│ 3. Generic Controller (App\Control\Controllers\OrmController)           │
│    Role: Standardized JSON-RPC/REST API serving CRUD, search_read,      │
│          onchange events, action buttons, and views to the frontend.    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Active Record Model (`app/model`)

The Active Record model extends `App\Model\BaseModel`, inheriting high-performance querying and transaction handling.

```php
<?php
namespace App\Model\Fleet;

use App\Model\BaseModel;
use App\Model\Res\ResPartner;

class Vehicle extends BaseModel
{
    const TABLENAME  = 'fleet_vehicles';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';

    /**
     * Relationship: Many2One (Driver / Partner)
     */
    public function driver(): ?ResPartner
    {
        return $this->driver_id ? ResPartner::find($this->driver_id) : null;
    }

    /**
     * Relationship: One2Many (Service Logs)
     */
    public function service_logs(): \App\Advsoft\Core\Database\QueryBuilder
    {
        return VehicleLogService::where('vehicle_id', '=', $this->id);
    }
}
```

### BaseModel Query API Examples

```php
// Find record
$vehicle = Vehicle::find(1);
$vehicle = Vehicle::findOrFail(1); // Throws 404 if missing

// Fluent Query Builder
$activeTrucks = Vehicle::where('type', '=', 'truck')
    ->where('active', '=', true)
    ->whereIn('status', ['available', 'on_trip'])
    ->orderBy('license_plate', 'ASC')
    ->limit(25)
    ->get();

// Aggregate helpers
$totalCount = Vehicle::count();
$sumCost    = VehicleLogService::where('vehicle_id', '=', 1)->sum('amount');
$maxOdo     = Vehicle::max('odometer');

// Plucking key-value pairs
$lookup = Vehicle::where('active', '=', true)->pluck('license_plate', 'id');
```

---

## 7. Model Definition (`app/control/*/Models`)

Create a class extending `ModelDefinition` inside `app/control/<addon>/Models/`:

```php
<?php
namespace Addons\Fleet\Models;

use App\Advsoft\{ModelDefinition, Field};
use App\Model\Fleet\Vehicle;

class VehicleDef extends ModelDefinition
{
    public string $_name        = 'fleet.vehicle';
    public string $_description = 'Fleet Vehicle';
    public string $_table       = 'fleet_vehicles';
    public string $_order       = 'license_plate asc';
    public string $_rec_name    = 'license_plate';
    public string $modelClass   = Vehicle::class;

    protected function defineFields(): void
    {
        // Field declarations
    }

    protected function defineViews(): void
    {
        // View configurations
    }

    protected function defineSecurity(): void
    {
        // ACL & Record rules
    }

    protected function defineBusinessLogic(): void
    {
        // @api decorators & hooks
    }
}
```

---

## 8. Complete Field Types Reference

AdvSoft provides a full suite of scalar, relational, and computed field types:

```php
protected function defineFields(): void
{
    // ── Scalar Text ───────────────────────────────────────────────
    $this->addField('license_plate', Field::CHAR, [
        'string'     => 'License Plate',
        'required'   => true,
        'size'       => 32,
        'searchable' => true,
        'sortable'   => true,
        'trim'       => true,
    ]);

    $this->addField('notes', Field::TEXT, [
        'string' => 'Internal Notes',
    ]);

    $this->addField('description', Field::HTML, [
        'string'          => 'Vehicle Specs',
        'htmlPreset'      => 'full', // 'full', 'standard', 'minimal'
        'htmlMinHeight'   => '180px',
        'htmlPlaceholder' => 'Enter vehicle technical specs...',
    ]);

    // ── Numeric & Monetary ─────────────────────────────────────────
    $this->addField('seats', Field::INTEGER, [
        'string'  => 'Seats Number',
        'default' => 5,
    ]);

    $this->addField('odometer', Field::FLOAT, [
        'string' => 'Last Odometer (km)',
        'digits' => [10, 2],
    ]);

    $this->addField('acquisition_cost', Field::MONETARY, [
        'string'      => 'Acquisition Cost',
        'currency_id' => 'currency_id',
    ]);

    // ── Date & Time ────────────────────────────────────────────────
    $this->addField('acquisition_date', Field::DATE, [
        'string'  => 'Acquisition Date',
        'default' => 'today',
    ]);

    $this->addField('last_service_at', Field::DATETIME, [
        'string' => 'Last Service Timestamp',
    ]);

    // ── Boolean & Selection (Enum) ─────────────────────────────────
    $this->addField('active', Field::BOOLEAN, [
        'string'  => 'Active',
        'default' => true,
    ]);

    $this->addField('state', Field::SELECTION, [
        'string'    => 'Status',
        'selection' => [
            ['new',         'New Order'],
            ['registered',  'Registered'],
            ['in_service',  'In Service'],
            ['maintenance', 'Under Maintenance'],
            ['decommissioned', 'Decommissioned'],
        ],
        'default'   => 'new',
        'groupable' => true,
        'searchable'=> true,
    ]);

    $this->addField('metadata', Field::JSON, [
        'string' => 'Telemetry Payload',
    ]);

    // ── Relational Fields ──────────────────────────────────────────
    $this->addField('driver_id', Field::MANY2ONE, [
        'string'        => 'Driver',
        'relation'      => 'res.partner',
        'searchable'    => true,
        'groupable'     => true,
        'displayFields' => ['id', 'name', 'email', 'phone'],
    ]);

    $this->addField('service_log_ids', Field::ONE2MANY, [
        'string'        => 'Service Logs',
        'relation'      => 'fleet.vehicle.log.service',
        'inverse_field' => 'vehicle_id',
    ]);

    $this->addField('tag_ids', Field::MANY2MANY, [
        'string'   => 'Tags',
        'relation' => 'fleet.vehicle.tag',
        'pivot'    => 'fleet_vehicle_tag_rel',
        'widget'   => 'many2many_tags',
    ]);

    // ── Computed Field (Non-stored) ────────────────────────────────
    $this->addField('service_overdue', Field::BOOLEAN, [
        'string'  => 'Service Overdue',
        'compute' => 'computeServiceOverdue',
        'store'   => false,
    ]);
}
```

---

## 9. View Engine & Configurations

### 9.1 List View (Tree)

Configures the responsive grid with dynamic column formatting, aggregation, and conditional row styling:

```php
$this->listView = [
    'string'        => 'Vehicles',
    'default_order' => 'license_plate asc',
    'limit'         => 80,
    'fields'        => [
        'license_plate',
        'driver_id',
        'odometer',
        'acquisition_cost',
        'state',
        'tag_ids',
    ],
    'column_config' => [
        'acquisition_cost' => [
            'sum'    => 'Total Cost',
            'widget' => 'monetary',
        ],
        'odometer' => [
            'avg'    => 'Average Km',
        ],
        'state' => [
            'widget'   => 'badge',
            'optional' => 'show',
        ],
    ],
    // Conditional row coloring
    'decoration' => [
        'decoration-danger'  => 'state == "maintenance"',
        'decoration-success' => 'state == "registered"',
        'decoration-warning' => 'state == "new"',
        'decoration-muted'   => 'active == false',
    ],
    'header_buttons' => [
        [
            'name'    => 'action_service_maintenance',
            'string'  => 'Send to Maintenance',
            'class'   => 'ls-btn-primary',
            'icon'    => 'tool',
            'confirm' => 'Send all selected vehicles to maintenance?',
        ],
    ],
];
```

### 9.2 Form View

Complete layout engine featuring statusbars, smart header buttons, multi-column field groups, and notebook tabs:

```php
$this->formView = [
    'string'              => 'Vehicle Details',
    'statusbar'           => 'state',
    'statusbar_clickable' => true,
    'title'               => 'license_plate',

    'header_buttons' => [
        [
            'name'      => 'action_register',
            'type'      => 'object',
            'string'    => 'Register Vehicle',
            'class'     => 'ls-btn-primary',
            'invisible' => "state != 'new'",
        ],
        [
            'name'      => 'action_send_maintenance',
            'type'      => 'object',
            'string'    => 'Maintenance',
            'class'     => 'ls-btn-warning',
            'invisible' => "state == 'maintenance' or state == 'decommissioned'",
        ],
    ],

    'groups' => [
        [
            'string'  => 'General Specifications',
            'col'     => 2,
            'columns' => [
                // Left Column
                [
                    ['name' => 'license_plate'],
                    ['name' => 'driver_id', 'options' => ['no_create' => false]],
                    ['name' => 'seats'],
                ],
                // Right Column
                [
                    ['name' => 'acquisition_date'],
                    ['name' => 'acquisition_cost'],
                    ['name' => 'odometer', 'widget' => 'float'],
                    ['name' => 'tag_ids', 'widget' => 'many2many_tags'],
                ],
            ],
        ],
    ],

    'tabs' => [
        [
            'name'        => 'services',
            'label'       => 'Service History',
            'type'        => 'one2many',
            'field'       => 'service_log_ids',
            'child_model' => 'fleet.vehicle.log.service',
            'tree_fields' => ['date', 'service_type', 'amount', 'vendor'],
        ],
        [
            'name'  => 'specs',
            'label' => 'Technical Specs',
            'type'  => 'field',
            'field' => 'description',
        ],
    ],
];
```

### 9.3 Search View & Filters

```php
$this->searchView = [
    'filters' => [
        ['id' => 'active_vehicles', 'label' => 'Active Fleet',   'domain' => [['active', '=', true]]],
        ['id' => 'maintenance',     'label' => 'In Maintenance', 'domain' => [['state', '=', 'maintenance']]],
        ['id' => 'high_mileage',    'label' => 'Odo > 100k',     'domain' => [['odometer', '>', 100000]]],
    ],
    'group_by' => [
        ['field' => 'state',     'label' => 'Status'],
        ['field' => 'driver_id', 'label' => 'Driver'],
    ],
    'searchpanel' => [
        ['field' => 'state', 'type' => 'selection', 'label' => 'Status', 'icon' => 'tag'],
    ],
    'custom_filter_fields' => ['license_plate', 'driver_id', 'odometer', 'acquisition_cost'],
];
```

### 9.4 Kanban View

```php
$this->kanbanView = [
    'default_group_by' => 'state',
    'quick_create'     => true,
    'card_title'       => 'license_plate',
    'card_fields'      => ['driver_id', 'odometer', 'acquisition_cost'],
    'card_tags'        => 'tag_ids',
    'card_footer'      => ['odometer', 'driver_id'],
    'color_field'      => 'state',
];
```

### 9.5 Calendar, Graph & Pivot Views

```php
// Calendar View
$this->calendarView = [
    'date_start'           => 'acquisition_date',
    'color'                => 'state',
    'mode'                 => 'month',
    'event_display_fields' => ['license_plate', 'driver_id'],
];

// Graph View (Analytics)
$this->graphView = [
    'type'       => 'bar', // 'bar', 'line', 'pie'
    'measure'    => 'acquisition_cost',
    'groupby'    => ['state'],
    'measures'   => ['acquisition_cost', 'odometer'],
    'dimensions' => ['state', 'driver_id'],
];

// Pivot Cross-Table View
$this->pivotView = [
    'row_groupby' => ['state'],
    'col_groupby' => ['driver_id'],
    'measures'    => ['acquisition_cost', 'odometer'],
];
```

### 9.6 Spreadsheet Grid View

```php
$this->spreadsheetView = [
    'fields'       => ['license_plate', 'driver_id', 'odometer', 'acquisition_cost', 'state'],
    'column_width' => 140,
    'row_height'   => 28,
    'limit'        => 200,
    'aggregation'  => 'sum',
];
```

---

## 10. Model Inheritance Engine

AdvSoft provides three inheritance patterns matching enterprise ORM paradigms:

### Pattern 1: Class Extension (`_inherit = "model.name"`)
Extends an existing model and table with new fields, views, or business logic.

```php
class CustomTaskDef extends ModelDefinition
{
    public string $_name    = 'project.task';
    public array $_inherit = ['project.task'];

    protected function defineFields(): void
    {
        $this->addField('custom_qa_approver_id', Field::MANY2ONE, [
            'string'   => 'QA Approver',
            'relation' => 'res.users',
        ]);
    }
}
```

### Pattern 2: Delegation (`_inherits = ['model.parent' => 'fk_field']`)
Composition where the child model stores additional data in its own table while proxying parent fields transparently.

```php
class ResUserDef extends ModelDefinition
{
    public string $_name     = 'res.users';
    public array $_inherits = ['res.partner' => 'partner_id'];
    // Fields from res.partner (name, email, phone) are accessible directly on res.users!
}
```

---

## 11. Security Architecture (6 Layers)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. res.users & res.groups                                   │
│    Identify authenticated user & role memberships           │
├─────────────────────────────────────────────────────────────┤
│ 2. ir.model.access (setAccess / addAccessRule)              │
│    Model-level permissions (read, write, create, unlink)    │
├─────────────────────────────────────────────────────────────┤
│ 3. ir.rule (addRecordRule)                                  │
│    Record-level domain filtering (e.g., own company only)   │
├─────────────────────────────────────────────────────────────┤
│ 4. sudo() & with_user() Context Switching                   │
│    Elevate permissions for automated system processes       │
├─────────────────────────────────────────────────────────────┤
│ 5. Field-Level Access Control (setFieldAccess)              │
│    Restrict read/write on sensitive fields (e.g., salary)   │
├─────────────────────────────────────────────────────────────┤
│ 6. Database Enforcement                                     │
│    Injected parameterized WHERE clauses prevent data leaks  │
└─────────────────────────────────────────────────────────────┘
```

### Declaring Security in `defineSecurity()`

```php
protected function defineSecurity(): void
{
    // Layer 2: Model CRUD Base Permissions
    $this->setAccess([
        'read'   => true,
        'write'  => true,
        'create' => true,
        'unlink' => false, // No direct deletion by default
    ]);

    // Group-based CRUD Overrides
    $this->addAccessRule('fleet_manager', ['read', 'write', 'create', 'unlink']);
    $this->addAccessRule('fleet_driver',  ['read', 'write']);

    // Layer 3: Record-Level Rule (Dynamic User & Department Context)
    $this->addRecordRule(
        'driver_own_vehicle_only',
        [['driver_id.user_id', '=', '__user_id__']],
        ['read', 'write'],
        ['fleet_driver']
    );

    // Layer 5: Field-Level Access Control
    $this->setFieldAccess('acquisition_cost', [
        'read'  => true,
        'write' => false, // Only fleet_manager can edit cost
    ]);
}
```

---

## 12. Business Logic & API Decorators

### `@api.depends` (Computed Fields)

```php
protected function defineBusinessLogic(): void
{
    $this->apiDepends('computeServiceOverdue', ['odometer', 'last_service_at']);
}

public function computeServiceOverdue(object $record, array $values): array
{
    $odo = $values['odometer'] ?? ($record->odometer ?? 0);
    return ['service_overdue' => ($odo > 100000)];
}
```

### `@api.constrains` (Business Validation)

```php
protected function defineBusinessLogic(): void
{
    $this->apiConstrains('checkOdometer', ['odometer']);
}

public function checkOdometer(object $record, array $values): ?string
{
    $odo = $values['odometer'] ?? $record->odometer;
    if ($odo !== null && $odo < 0) {
        return 'Odometer reading cannot be negative.';
    }
    return null; // Valid
}
```

### `@api.onchange` (Interactive UI Changes)

```php
protected function defineBusinessLogic(): void
{
    $this->apiOnchange('onchangeDriver', ['driver_id']);
}

public function onchangeDriver(string $field, array $values): array
{
    if (!empty($values['driver_id'])) {
        $partner = \App\Model\Res\ResPartner::find($values['driver_id']);
        if ($partner && !empty($partner->phone)) {
            $values['notes'] = "Assigned driver phone: {$partner->phone}";
        }
    }
    return $values;
}
```

### Lifecycle Hooks & Action Buttons

```php
protected function beforeCreate(array &$vals): void
{
    if (empty($vals['acquisition_date'])) {
        $vals['acquisition_date'] = date('Y-m-d');
    }
}

protected function afterCreate(object $record, array $vals): void
{
    \App\Advsoft\Core\Support\Log::info("Vehicle registered: {$record->license_plate}");
}

public function action_register(object $record): array
{
    $record->state = 'registered';
    $record->save();

    return [
        'type'   => 'ir.actions.client',
        'tag'    => 'display_notification',
        'params' => [
            'title'   => 'Success',
            'message' => "Vehicle '{$record->license_plate}' has been registered.",
            'type'    => 'success',
        ],
    ];
}
```

---

## 13. QWeb Report Engine & Document Printing

AdvSoft includes an embedded QWeb XML rendering engine with Dompdf integration.

### Defining a Report Action (`ir.actions.report`)

```sql
INSERT INTO ir_actions_report (name, model, report_name, report_type)
VALUES ('Vehicle Dossier', 'fleet.vehicle', 'reports.fleet_vehicle_dossier', 'qweb-pdf');
```

### Creating the QWeb Template

In `app/resources/views/reports/fleet_vehicle_dossier.blade.php` (or QWeb XML):

```html
<div class="report-container">
    <div class="header">
        <h2>Vehicle Specification Sheet</h2>
        <p>Generated on: <?= date('d/m/Y H:i') ?></p>
    </div>

    <table class="table-report">
        <tr>
            <th>License Plate</th>
            <td><?= htmlspecialchars($doc->license_plate) ?></td>
            <th>Status</th>
            <td><?= htmlspecialchars($doc->state) ?></td>
        </tr>
        <tr>
            <th>Driver</th>
            <td><?= htmlspecialchars($doc->driver?->name ?? 'None') ?></td>
            <th>Odometer</th>
            <td><?= number_format($doc->odometer, 2) ?> km</td>
        </tr>
    </table>
</div>
```

Endpoints for preview and PDF export:
- HTML Preview: `GET /api/reports/preview/{report_id}?ids=1,2,3`
- PDF Download: `GET /api/reports/pdf/{report_id}?ids=1,2,3`

---

## 14. Realtime Collaborative Spreadsheet Engine

AdvSoft provides a collaborative spreadsheet feature with multi-cursor broadcasting and operation transform (OT).

```
Browser A (Edit Cell A1) ──▶ POST /api/spreadsheet/apply_op ──▶ Store Operation
                                       │
                                       ▼ Broadcast Presence
Browser B (Live Cursor)  ◀── GET  /api/spreadsheet/presence ──◀ Return Other Users
```

Endpoints:
- `POST /api/spreadsheet/presence`: Updates user cursor coordinates and returns online collaborator positions.
- `POST /api/spreadsheet/apply_op`: Commits atomic cell changes, formatting, and row insertions.

---

## 15. Routing & Generic ORM Controller

All registered models automatically gain a full JSON-RPC/REST API via `OrmController`:

```php
// routes/web.php
Route::post('/api/orm/search_read', [OrmController::class, 'searchRead']);
Route::post('/api/orm/read',        [OrmController::class, 'read']);
Route::post('/api/orm/create',      [OrmController::class, 'create']);
Route::post('/api/orm/write',       [OrmController::class, 'write']);
Route::post('/api/orm/unlink',      [OrmController::class, 'unlink']);
Route::post('/api/orm/load_views',  [OrmController::class, 'loadViews']);
Route::post('/api/orm/onchange',    [OrmController::class, 'onchange']);
Route::post('/api/orm/call_button', [OrmController::class, 'callButton']);
```

### JSON Request Payload Examples

#### `POST /api/orm/search_read`
```json
{
    "model": "fleet.vehicle",
    "domain": [["state", "=", "registered"], ["odometer", "<", 50000]],
    "fields": ["license_plate", "driver_id", "odometer", "state"],
    "order": "license_plate asc",
    "limit": 20,
    "offset": 0
}
```

#### `POST /api/orm/create`
```json
{
    "model": "fleet.vehicle",
    "values": {
        "license_plate": "B 1234 ADV",
        "seats": 5,
        "state": "new"
    }
}
```

---

## 16. Building a Complete Module from Zero to Hero

Here is the step-by-step procedure to build the **Fleet Management** module:

### Step 1: SQL Schema

```sql
CREATE TABLE `fleet_vehicles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `license_plate` VARCHAR(32) NOT NULL,
    `driver_id` INT NULL,
    `seats` INT DEFAULT 5,
    `odometer` DECIMAL(10,2) DEFAULT 0,
    `acquisition_date` DATE NULL,
    `acquisition_cost` DECIMAL(12,2) DEFAULT 0,
    `state` VARCHAR(32) DEFAULT 'new',
    `active` TINYINT(1) DEFAULT 1,
    `description` LONGTEXT NULL,
    `created_at` DATETIME NULL,
    `updated_at` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `fleet_vehicle_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `vehicle_id` INT NOT NULL,
    `date` DATE NOT NULL,
    `service_type` VARCHAR(64) NOT NULL,
    `amount` DECIMAL(10,2) DEFAULT 0,
    `vendor` VARCHAR(128) NULL,
    `created_at` DATETIME NULL,
    `updated_at` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Step 2: Active Record Classes

```php
// app/model/Fleet/Vehicle.php
namespace App\Model\Fleet;
use App\Model\BaseModel;

class Vehicle extends BaseModel {
    const TABLENAME  = 'fleet_vehicles';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
```

```php
// app/model/Fleet/VehicleLogService.php
namespace App\Model\Fleet;
use App\Model\BaseModel;

class VehicleLogService extends BaseModel {
    const TABLENAME  = 'fleet_vehicle_logs';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
}
```

### Step 3: Model Definition

```php
// app/control/fleet/Models/VehicleDef.php
namespace Addons\Fleet\Models;

use App\Advsoft\{ModelDefinition, Field};
use App\Model\Fleet\Vehicle;

class VehicleDef extends ModelDefinition
{
    public string $_name        = 'fleet.vehicle';
    public string $_description = 'Vehicle';
    public string $_table       = 'fleet_vehicles';
    public string $_order       = 'license_plate asc';
    public string $_rec_name    = 'license_plate';
    public string $modelClass   = Vehicle::class;

    protected function defineFields(): void
    {
        $this->addField('license_plate', Field::CHAR, ['string' => 'Plate Number', 'required' => true]);
        $this->addField('driver_id', Field::MANY2ONE, ['string' => 'Driver', 'relation' => 'res.partner']);
        $this->addField('seats', Field::INTEGER, ['string' => 'Seats', 'default' => 5]);
        $this->addField('odometer', Field::FLOAT, ['string' => 'Odometer (km)']);
        $this->addField('state', Field::SELECTION, [
            'string' => 'State',
            'selection' => [['new', 'New'], ['registered', 'Registered'], ['maintenance', 'Maintenance']],
            'default' => 'new',
        ]);
        $this->addField('active', Field::BOOLEAN, ['string' => 'Active', 'default' => true]);
    }

    protected function defineViews(): void
    {
        $this->listView = [
            'fields' => ['license_plate', 'driver_id', 'seats', 'odometer', 'state'],
        ];
        $this->formView = [
            'title' => 'license_plate',
            'statusbar' => 'state',
            'groups' => [
                ['col' => 2, 'columns' => [
                    ['license_plate', 'driver_id'],
                    ['seats', 'odometer', 'state'],
                ]],
            ],
        ];
    }

    protected function defineSecurity(): void
    {
        $this->setAccess(['read' => true, 'write' => true, 'create' => true, 'unlink' => true]);
    }

    protected function defineBusinessLogic(): void {}
}
```

### Step 4: Add Navigation Menus

```sql
INSERT INTO menus (name, label, controller, icon, parent_id, `order`, module)
VALUES ('fleet_root', 'Fleet', NULL, 'truck', NULL, 60, 'fleet');

INSERT INTO menus (name, label, controller, icon, parent_id, `order`, module)
VALUES ('fleet_vehicles', 'Vehicles', 'fleet.vehicle', 'car', (SELECT id FROM menus WHERE name='fleet_root'), 10, 'fleet');
```

---

## 17. Database Migration, Seeding & DDL/DML

AdvSoft includes complete SQL dumps in `app/database/`:

```bash
# 1. Full Database Restore
mysql -u root -p advsoft < app/database/advsoft.sql

# 2. DDL Only (Tables, Foreign Keys, Indexes)
mysql -u root -p advsoft < app/database/advsoft-ddl.sql

# 3. DML Only (Core Records, Groups, Menus, Sample Data)
mysql -u root -p advsoft < app/database/advsoft-dml.sql

# 4. Migrate from SQLite to MySQL Automatically
php app/database/migrate_to_mysql.php
```

---

## 18. Frontend Integration & Design System

AdvSoft's frontend is powered by **OWL (Odoo Web Library)** and standard vanilla CSS tokens (`adianti-design-system.css`). It operates with zero external CDN dependencies:

- **Theme**: Clean zinc/slate dark and light mode.
- **Micro-Interactions**: Smooth dropdowns, responsive drawer modals, and drag-and-drop kanban columns.
- **Assets Bundling**:
  ```bash
  php compile_assets.php
  ```
  Generates `public/js/app.bundle.js` and `public/css/app.bundle.css`.

---

## 19. Testing & Quality Assurance

Run the automated integration test suite:

```bash
php test_api.php
```

### Test Coverage Checklist:

- [x] **Scenario 1**: Model Registry Discovery (29+ models verified)
- [x] **Scenario 2**: Auth Controller & Token-based Sessions
- [x] **Scenario 3**: Generic ORM `search_read` with Complex Domains
- [x] **Scenario 4**: Accounting Engine & Trial Balance Aggregation
- [x] **Scenario 5**: Menu Hierarchy & Navigation Trees
- [x] **Scenario 6**: View Builder Introspection
- [x] **Scenario 7**: Atomic ORM `write` operations
- [x] **Scenario 8**: State machine transitions (`draft` → `posted`)
- [x] **Scenario 9**: Multi-model transactional integrity
- [x] **Scenario 10**: Dynamic table creation
- [x] **Scenario 11**: Module discovery & installer
- [x] **Scenario 12**: Many2Many relational pivot sync
- [x] **Scenario 13**: Batch `load_views` definitions
- [x] **Scenario 14**: Legacy Adianti controller dispatching
- [x] **Scenario 15**: Multi-level navigation hierarchy
- [x] **Scenario 16**: One2Many child record creation
- [x] **Scenario 17**: Nested parent-child data retrieval
- [x] **Scenario 18**: Dynamic relation loading (`loadO2m`)
- [x] **Scenario 19**: Collaborative spreadsheet document persistence

---

## 20. Deployment & Production Tuning

### Production Optimization Checklist

```bash
# 1. Optimize Composer Autoloader
composer dump-autoload -o --no-dev

# 2. Compile Frontend Bundles
php compile_assets.php

# 3. Seed Security & Initial Permissions
php seed_security.php

# 4. Set Directory Permissions (Linux)
chmod -R 775 app/output storage database
```

### Sample Nginx Configuration

```nginx
server {
    listen 80;
    server_name advsoft.yourdomain.com;
    root /var/www/advsoft;
    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(env|ini|git|sqlite) {
        deny all;
    }
}
```

---

## 21. Complete API & Helper Reference

### Global Helper Functions

```php
app(?string $abstract = null) // Resolve dependency from container
app_path(string $path = '')   // Absolute path to app/ directory
base_path(string $path = '')  // Absolute path to project root
view(string $template, array $data = []) // Render template
response()                    // Create HTTP response builder
abort(int $status, string $message = '') // Terminate with error
now()                         // Return current DateTime object
```

### Registry API

```php
use App\Advsoft\Registry;

Registry::boot();                 // Scan and register all addon models
Registry::get('project.task');     // Get ModelDefinition instance
Registry::has('project.task');     // Check if model is registered
Registry::all();                  // Get array of all registered ModelDefinitions
```

### Collection Utilities

```php
$collection = Task::where('active', '=', true)->get();

$collection->count();
$collection->first();
$collection->last();
$collection->map(fn($t) => $t->name);
$collection->filter(fn($t) => $t->planned_hours > 10);
$collection->pluck('name', 'id');
$collection->sortBy('deadline');
$collection->groupBy('stage_id');
$collection->sum('planned_hours');
```

---

## Summary Cheat Sheet

```
╔══════════════════════════════════════════════════════════════════════════╗
║                       ADVSOFT DEVELOPER CHEAT SHEET                      ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  1. Create New Feature:                                                  ║
║     a. Write table schema in MySQL                                       ║
║     b. Create App\Model\X\Record extending BaseModel                     ║
║     c. Create Addons\X\Models\RecordDef extending ModelDefinition        ║
║     d. Registry boots & handles all CRUD, Views & APIs automatically!    ║
║                                                                          ║
║  2. Field Types:                                                         ║
║     CHAR · TEXT · HTML · INTEGER · FLOAT · MONETARY · DATE · DATETIME    ║
║     BOOLEAN · SELECTION · JSON · MANY2ONE · ONE2MANY · MANY2MANY         ║
║                                                                          ║
║  3. Views:                                                               ║
║     listView · formView · searchView · kanbanView · calendarView        ║
║     graphView · pivotView · spreadsheetView                              ║
║                                                                          ║
║  4. Security:                                                            ║
║     setAccess() · addAccessRule() · addRecordRule() · setFieldAccess()   ║
║                                                                          ║
║  5. Logic Decorators:                                                    ║
║     apiDepends() · apiConstrains() · apiOnchange()                       ║
║     beforeCreate() · afterCreate() · beforeWrite() · afterWrite()        ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

> **AdvSoft** — The Pure PHP Business Applications Platform  
> Built on Adianti Framework · Zero Laravel Dependency · Open Source  
> Repository: [https://github.com/taufikinfo/AdvSoft](https://github.com/taufikinfo/AdvSoft)
