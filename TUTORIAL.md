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
- `POST /api/spreadsheet/apply_op` (alias `/publish`): Commits atomic cell changes, formatting, and row insertions. Revisions are assigned server-side (monotonic per spreadsheet).
- `POST /api/spreadsheet/batch_publish`: Commits up to 500 operations in one request.
- `POST /api/spreadsheet/longpoll`: Poll transport — returns all operations newer than `since_rev` as bus messages.
- `GET /api/spreadsheet/fetch_ops`: Same data as longpoll in structured `ops` format.
- `GET /api/spreadsheet/history`: Latest operations, newest first (`limit` up to 500).
- `POST /api/spreadsheet/cleanup`: Removes stale presence rows (> 5 min idle) and operations older than 7 days.

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
- [x] **Scenario 20**: Column-level statistical aggregation (`sum`, `avg`, `max`, `min`)

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
app(?string $abstract = null)            // Resolve service or singleton from IoC Container
app_path(string $path = '')              // Absolute path to app/ directory
base_path(string $path = '')             // Absolute path to project root
view(string $template, array $data = []) // Render Blade server-side template
response()                               // Create HTTP ResponseBuilder instance
abort(int $status, string $message = '') // Terminate request with HTTP error code
now()                                    // Return current DateTime object
```

### Registry API

```php
use App\Advsoft\Registry;

Registry::boot();                 // Scan, register, and resolve inheritance for all addon models
Registry::get('project.task');     // Get ModelDefinition instance by dot-notation name
Registry::has('project.task');     // Check if model is registered in registry
Registry::all();                  // Get array map of all registered ModelDefinitions
Registry::register($definition);  // Manually register custom ModelDefinition
```

### Collection Utilities (`App\Advsoft\Core\Support\Collection`)

```php
$collection = Task::where('active', '=', true)->get();

$collection->count();                     // Total item count
$collection->first();                     // First item or null
$collection->last();                      // Last item or null
$collection->isEmpty();                   // True if empty
$collection->isNotEmpty();                // True if has items
$collection->map(fn($t) => $t->name);     // Transform collection
$collection->filter(fn($t) => $t->hours > 10); // Filter items
$collection->pluck('name', 'id');         // Extract key-value or array of values
$collection->sortBy('deadline');          // Sort by attribute ascending
$collection->sortByDesc('deadline');      // Sort by attribute descending
$collection->groupBy('stage_id');         // Group into nested collections
$collection->sum('planned_hours');        // Compute numeric sum
$collection->avg('progress');             // Compute numeric average
$collection->min('deadline');             // Get minimum value
$collection->max('planned_hours');        // Get maximum value
$collection->toArray();                   // Convert to native array
$collection->toJson();                    // Encode to JSON string
```

---

## 22. Detailed Developer Cheat Sheet

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

### 🌟 Pillar 1: Create New Feature Workflow

Follow this standard 4-step workflow to add any new business entity to AdvSoft:

#### Step 1.1: Database Schema (DDL)
```sql
CREATE TABLE `helpdesk_tickets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `partner_id` INT NULL,
    `user_id` INT NULL,
    `stage_id` INT NOT NULL,
    `priority` VARCHAR(10) DEFAULT '1',
    `description` LONGTEXT NULL,
    `resolution_time` DECIMAL(8,2) DEFAULT 0,
    `active` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME NULL,
    `updated_at` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Step 1.2: Active Record Model (`app/model/Helpdesk/Ticket.php`)
```php
<?php
namespace App\Model\Helpdesk;

use App\Model\BaseModel;
use App\Model\Res\ResPartner;
use App\Model\Res\ResUser;

class Ticket extends BaseModel
{
    const TABLENAME  = 'helpdesk_tickets';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';

    public function customer(): ?ResPartner
    {
        return $this->partner_id ? ResPartner::find($this->partner_id) : null;
    }

    public function assigned_user(): ?ResUser
    {
        return $this->user_id ? ResUser::find($this->user_id) : null;
    }
}
```

#### Step 1.3: Model Definition (`app/control/helpdesk/Models/TicketDef.php`)
```php
<?php
namespace Addons\Helpdesk\Models;

use App\Advsoft\{ModelDefinition, Field};
use App\Model\Helpdesk\Ticket;

class TicketDef extends ModelDefinition
{
    public string $_name        = 'helpdesk.ticket';
    public string $_description = 'Helpdesk Ticket';
    public string $_table       = 'helpdesk_tickets';
    public string $_order       = 'id desc';
    public string $_rec_name    = 'name';
    public string $modelClass   = Ticket::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, ['string' => 'Subject', 'required' => true, 'searchable' => true]);
        $this->addField('partner_id', Field::MANY2ONE, ['string' => 'Customer', 'relation' => 'res.partner']);
        $this->addField('user_id', Field::MANY2ONE, ['string' => 'Assigned To', 'relation' => 'res.users']);
        $this->addField('priority', Field::SELECTION, [
            'string' => 'Priority',
            'widget' => 'priority',
            'selection' => [['0', 'Low'], ['1', 'Normal'], ['2', 'High'], ['3', 'Urgent']],
            'default' => '1',
        ]);
        $this->addField('description', Field::HTML, ['string' => 'Problem Description', 'htmlPreset' => 'full']);
        $this->addField('active', Field::BOOLEAN, ['string' => 'Active', 'default' => true]);
    }

    protected function defineViews(): void
    {
        $this->listView = [
            'fields' => ['name', 'partner_id', 'user_id', 'priority'],
            'column_config' => ['priority' => ['widget' => 'priority']],
        ];

        $this->formView = [
            'title' => 'name',
            'priority' => 'priority',
            'groups' => [
                ['col' => 2, 'columns' => [
                    ['name', 'partner_id'],
                    ['user_id', 'priority'],
                ]],
            ],
            'tabs' => [
                ['name' => 'desc', 'label' => 'Description', 'type' => 'field', 'field' => 'description'],
            ],
        ];

        $this->searchView = [
            'filters' => [
                ['id' => 'my_tickets', 'label' => 'My Tickets', 'domain' => [['user_id', '=', '__user_id__']]],
                ['id' => 'urgent', 'label' => 'Urgent', 'domain' => [['priority', '=', '3']]],
            ],
            'group_by' => [
                ['field' => 'user_id', 'label' => 'Assigned User'],
                ['field' => 'priority', 'label' => 'Priority'],
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

#### Step 1.4: Navigation Menu Insertion
```sql
INSERT INTO menus (name, label, controller, icon, parent_id, `order`, module)
VALUES ('helpdesk_root', 'Helpdesk', NULL, 'life-buoy', NULL, 70, 'helpdesk');

INSERT INTO menus (name, label, controller, icon, parent_id, `order`, module)
VALUES ('helpdesk_tickets', 'All Tickets', 'helpdesk.ticket', 'ticket', (SELECT id FROM menus WHERE name='helpdesk_root'), 10, 'helpdesk');
```

---

### 🌟 Pillar 2: Field Types & Attributes Matrix

| Field Type Constant | Storage Column | Primary Options & Configurations | Example |
|---------------------|----------------|----------------------------------|---------|
| `Field::CHAR` | `VARCHAR(size)` | `'size'`, `'trim'`, `'required'`, `'widget'` (`'email'`, `'url'`, `'phone'`, `'color_picker'`) | `$this->addField('sku', Field::CHAR, ['size' => 64]);` |
| `Field::TEXT` | `LONGTEXT` | `'rows'`, `'placeholder'`, `'help'` | `$this->addField('remarks', Field::TEXT);` |
| `Field::HTML` | `LONGTEXT` | `'htmlPreset'` (`'full'`, `'standard'`, `'minimal'`), `'htmlMinHeight'`, `'htmlPlaceholder'` | `$this->addField('body', Field::HTML, ['htmlPreset' => 'full']);` |
| `Field::INTEGER` | `INT` | `'default'`, `'min'`, `'max'`, `'unsigned'` | `$this->addField('quantity', Field::INTEGER, ['default' => 1]);` |
| `Field::FLOAT` | `DECIMAL(d0,d1)` | `'digits' => [precision, scale]`, `'widget' => 'progressbar'` | `$this->addField('rate', Field::FLOAT, ['digits' => [5, 2]]);` |
| `Field::MONETARY` | `DECIMAL(12,2)` | `'currency_id'` (points to currency field) | `$this->addField('price', Field::MONETARY, ['currency_id' => 'currency_id']);` |
| `Field::DATE` | `DATE` | `'default' => 'today'`, `'widget' => 'remaining_days'` | `$this->addField('due_date', Field::DATE, ['default' => 'today']);` |
| `Field::DATETIME` | `DATETIME` | `'default' => 'now'`, `'readonly'` | `$this->addField('logged_at', Field::DATETIME);` |
| `Field::BOOLEAN` | `TINYINT(1)` | `'default' => true/false`, `'widget' => 'boolean_favorite'` | `$this->addField('is_starred', Field::BOOLEAN, ['widget' => 'boolean_favorite']);` |
| `Field::SELECTION` | `VARCHAR(32)` | `'selection' => [['val', 'Label']]`, `'widget' => 'badge'` / `'priority'` | `$this->addField('status', Field::SELECTION, ['selection' => [['a','A'],['b','B']]]);` |
| `Field::JSON` | `LONGTEXT` / `JSON` | Stores serialized associative JSON arrays or objects | `$this->addField('configs', Field::JSON);` |
| `Field::MANY2ONE` | `INT (FK)` | `'relation'` (model name), `'displayFields'`, `'ondelete'`, `'widget' => 'statusbar'` | `$this->addField('customer_id', Field::MANY2ONE, ['relation' => 'res.partner']);` |
| `Field::ONE2MANY` | *Virtual (None)* | `'relation'`, `'inverse_field'`, `'child_model'` | `$this->addField('line_ids', Field::ONE2MANY, ['relation' => 'inv.line', 'inverse_field' => 'invoice_id']);` |
| `Field::MANY2MANY` | *Pivot Table* | `'relation'`, `'pivot'`, `'widget' => 'many2many_tags'` | `$this->addField('tag_ids', Field::MANY2MANY, ['relation' => 'tag', 'pivot' => 'rel_table']);` |
| `Field::COMPUTED` | *None / Store* | `'compute' => 'methodName'`, `'store' => false` | `$this->addField('total', Field::FLOAT, ['compute' => 'calcTotal', 'store' => false]);` |

---

### 🌟 Pillar 3: View Configurations Master Template

```php
protected function defineViews(): void
{
    // 1. List View (Tree Grid)
    $this->listView = [
        'string'        => 'Records',
        'default_order' => 'id desc',
        'limit'         => 80,
        'fields'        => ['name', 'amount', 'progress', 'status', 'deadline'],
        'column_config' => [
            'amount'   => ['sum' => 'Total Amount', 'widget' => 'monetary'],
            'progress' => ['avg' => 'Average Progress', 'widget' => 'progressbar'],
            'status'   => ['widget' => 'badge', 'optional' => 'show'],
            'deadline' => ['widget' => 'remaining_days', 'optional' => 'show'],
        ],
        'decoration' => [
            'decoration-danger'  => 'status == "rejected" or progress == 0',
            'decoration-success' => 'status == "approved" or progress >= 100',
            'decoration-warning' => 'progress > 0 and progress < 50',
            'decoration-muted'   => 'active == false',
        ],
        'header_buttons' => [
            [
                'name'    => 'action_bulk_approve',
                'string'  => 'Approve Selected',
                'class'   => 'ls-btn-success',
                'icon'    => 'check',
                'confirm' => 'Approve all selected records?',
            ],
        ],
    ];

    // 2. Form View (Document & Inspector)
    $this->formView = [
        'string'              => 'Document Form',
        'statusbar'           => 'stage_id',
        'statusbar_clickable' => true,
        'title'               => 'name',
        'priority'            => 'priority',
        'header_buttons' => [
            [
                'name'      => 'action_post',
                'type'      => 'object',
                'string'    => 'Post Entry',
                'class'     => 'ls-btn-primary',
                'invisible' => "status != 'draft'",
            ],
            [
                'name'      => 'action_draft',
                'type'      => 'object',
                'string'    => 'Reset to Draft',
                'class'     => 'ls-btn-secondary',
                'invisible' => "status == 'draft'",
            ],
        ],
        'groups' => [
            [
                'string'  => 'Primary Information',
                'col'     => 2,
                'columns' => [
                    ['name', 'partner_id', ['name' => 'amount', 'widget' => 'monetary']],
                    ['date', 'user_id', ['name' => 'status', 'widget' => 'badge']],
                ],
            ],
        ],
        'tabs' => [
            [
                'name'        => 'lines',
                'label'       => 'Order Lines',
                'type'        => 'one2many',
                'field'       => 'line_ids',
                'child_model' => 'sale.order.line',
                'tree_fields' => ['product_id', 'quantity', 'price_unit', 'subtotal'],
            ],
            [
                'name'  => 'notes',
                'label' => 'Terms & Notes',
                'type'  => 'field',
                'field' => 'notes',
            ],
        ],
    ];

    // 3. Search View (Filters, Group By, Searchpanel)
    $this->searchView = [
        'filters' => [
            ['id' => 'my_records', 'label' => 'My Records', 'domain' => [['user_id', '=', '__user_id__']]],
            ['id' => 'draft',      'label' => 'Draft Only',  'domain' => [['status', '=', 'draft']]],
            ['id' => 'open_tasks', 'label' => 'In Progress', 'domain_func' => 'getInProgressDomain'],
        ],
        'group_by' => [
            ['field' => 'stage_id',   'label' => 'Stage'],
            ['field' => 'partner_id', 'label' => 'Customer'],
            ['field' => 'date:month', 'label' => 'Month Created'],
        ],
        'searchpanel' => [
            ['field' => 'stage_id',   'type' => 'many2one',   'label' => 'Stage',    'icon' => 'columns'],
            ['field' => 'partner_id', 'type' => 'many2one',   'label' => 'Customer', 'icon' => 'user'],
        ],
        'custom_filter_fields' => ['name', 'amount', 'status', 'date', 'user_id'],
    ];

    // 4. Kanban View (Card Deck)
    $this->kanbanView = [
        'default_group_by' => 'stage_id',
        'quick_create'     => true,
        'card_title'       => 'name',
        'card_fields'      => ['partner_id', 'amount', 'user_id'],
        'card_tags'        => 'tag_ids',
        'card_footer'      => ['priority', 'user_id', 'amount'],
        'color_field'      => 'stage_id',
        'progress_bar'     => [
            'field'  => 'progress',
            'colors' => ['low' => '#3b82f6', 'medium' => '#f59e0b', 'high' => '#10b981'],
        ],
    ];

    // 5. Analytics Views: Graph & Pivot
    $this->graphView = [
        'type'       => 'bar', // 'bar', 'line', 'pie'
        'measure'    => 'amount',
        'groupby'    => ['stage_id'],
        'measures'   => ['amount', 'quantity'],
        'dimensions' => ['stage_id', 'partner_id'],
    ];

    $this->pivotView = [
        'row_groupby' => ['partner_id'],
        'col_groupby' => ['stage_id'],
        'measures'    => ['amount', 'quantity'],
    ];

    // 6. Interactive Spreadsheet View
    $this->spreadsheetView = [
        'fields'       => ['name', 'partner_id', 'quantity', 'amount', 'status'],
        'column_width' => 140,
        'row_height'   => 28,
        'limit'        => 500,
        'aggregation'  => 'sum',
    ];
}
```

---

### 🌟 Pillar 4: Security & Access Control Declarations

```php
protected function defineSecurity(): void
{
    // 1. Model Level Base CRUD Rights
    $this->setAccess([
        'read'   => true,
        'write'  => true,
        'create' => true,
        'unlink' => true,
    ]);

    // 2. Role/Group Level CRUD Overrides
    $this->addAccessRule('sales_manager', ['read', 'write', 'create', 'unlink']);
    $this->addAccessRule('sales_user',    ['read', 'write', 'create']);
    $this->addAccessRule('portal_user',   ['read']);

    // 3. Record-Level Rules (Dynamic Domain Expressions)
    // Dynamic Tokens: __user_id__, __company_id__, __user_dept__
    $this->addRecordRule(
        'sales_user_own_orders_only',
        [['user_id', '=', '__user_id__']],
        ['read', 'write', 'unlink'],
        ['sales_user']
    );

    $this->addRecordRule(
        'company_isolation_rule',
        [['company_id', '=', '__company_id__']],
        ['read', 'write', 'create', 'unlink']
    );

    // 4. Field-Level Access Stripping
    $this->setFieldAccess('margin_profit', [
        'read'  => false, // Hidden from standard users
        'write' => false,
    ]);
}
```

---

### 🌟 Pillar 5: Business Logic, Decorators & Lifecycle Hooks

```php
protected function defineBusinessLogic(): void
{
    // @api.depends: Recalculate computed field when dependencies change
    $this->apiDepends('computeTotalAmount', ['line_ids', 'tax_id']);

    // @api.constrains: Execute validation assertion
    $this->apiConstrains('validateDates', ['start_date', 'end_date']);

    // @api.onchange: Reactive UI calculation (UI state only, not saved directly)
    $this->apiOnchange('onchangeCustomer', ['partner_id']);

    // @api.model: Class-level defaults generator
    $this->apiModel('_default_get');
}

/**
 * @api.depends implementation
 */
public function computeTotalAmount(object $record, array $values): array
{
    $total = 0.0;
    if ($record->id) {
        $lines = \App\Model\Sale\OrderLine::where('order_id', '=', $record->id)->get();
        foreach ($lines as $line) {
            $total += ($line->quantity * $line->price_unit);
        }
    }
    return ['amount_total' => $total];
}

/**
 * @api.constrains implementation: return error message string on failure or null on pass
 */
public function validateDates(object $record, array $values): ?string
{
    $start = $values['start_date'] ?? $record->start_date;
    $end   = $values['end_date']   ?? $record->end_date;

    if ($start && $end && strtotime($start) > strtotime($end)) {
        return 'The start date cannot be later than the completion end date.';
    }
    return null;
}

/**
 * @api.onchange implementation: return modified $values payload to client
 */
public function onchangeCustomer(string $field, array $values): array
{
    if (!empty($values['partner_id'])) {
        $customer = \App\Model\Res\ResPartner::find($values['partner_id']);
        if ($customer) {
            $values['payment_term'] = $customer->payment_term ?? 'immediate';
            $values['billing_address'] = $customer->address;
        }
    }
    return $values;
}

/**
 * Default values generator for new form records
 */
public function _default_get(array $defaults): array
{
    $defaults['date']   = date('Y-m-d');
    $defaults['status'] = 'draft';
    $defaults['active'] = true;
    return $defaults;
}

// ── CRUD Lifecycle Hooks ──────────────────────────────────────────

/** Before INSERT into database */
protected function beforeCreate(array &$vals): void
{
    if (empty($vals['code'])) {
        $vals['code'] = 'SO/' . date('Y') . '/' . strtoupper(bin2hex(random_bytes(3)));
    }
}

/** After INSERT into database */
protected function afterCreate(object $record, array $vals): void
{
    \App\Advsoft\Core\Support\Log::info("Created sale order ID #{$record->id} [{$record->code}]");
}

/** Before UPDATE in database */
protected function beforeWrite(object $record, array &$vals): void
{
    if ($record->status === 'locked' && !isset($vals['unlock_override'])) {
        throw new \RuntimeException("Locked records cannot be edited.");
    }
}

/** After UPDATE in database */
protected function afterWrite(object $record, array $vals): void
{
    \App\Advsoft\Core\Support\Log::info("Updated record ID #{$record->id}");
}

/** Before DELETE from database: return error string to abort delete */
protected function beforeUnlink(object $record): ?string
{
    if ($record->status === 'posted') {
        return "Posted entries cannot be deleted. Please cancel or reset to draft first.";
    }
    return null; // Allow deletion
}

/** Custom Record Display Name Resolver */
public function nameGet(object $record): string
{
    return "[{$record->code}] {$record->name}";
}

// ── Action Button Handlers ────────────────────────────────────────

public function action_confirm(object $record): array
{
    $record->status = 'confirmed';
    $record->save();

    return [
        'type'   => 'ir.actions.client',
        'tag'    => 'display_notification',
        'params' => [
            'title'   => 'Order Confirmed',
            'message' => "Order {$record->name} is now confirmed and ready for dispatch.",
            'type'    => 'success', // 'success', 'info', 'warning', 'danger'
        ],
    ];
}
```

---

### 🌟 Pillar 6: Domain Expression Syntax Reference

AdvSoft domain expressions filter datasets cleanly using Polish prefix notation and standard arrays:

| Domain Example | SQL Equivalent | Description |
|----------------|----------------|-------------|
| `[['status', '=', 'active']]` | `WHERE status = 'active'` | Simple equality comparison |
| `[['amount', '>=', 1000]]` | `WHERE amount >= 1000` | Numeric comparison |
| `[['name', 'like', '%adv%']]` | `WHERE name LIKE '%adv%'` | String pattern matching |
| `[['stage_id', 'in', [1, 2, 3]]]` | `WHERE stage_id IN (1, 2, 3)` | Inclusion in array |
| `[['deadline', '!=', false]]` | `WHERE deadline IS NOT NULL` | Null check |
| `['&', ['a', '=', 1], ['b', '=', 2]]` | `WHERE (a = 1 AND b = 2)` | Explicit AND logic |
| `['\|', ['a', '=', 1], ['b', '=', 2]]` | `WHERE (a = 1 OR b = 2)` | Explicit OR logic |
| `['!', ['status', '=', 'done']]` | `WHERE NOT (status = 'done')` | Logical NOT inversion |

---

> **AdvSoft** — The Pure PHP Business Applications Platform  
> Built on Adianti Framework · Zero Laravel Dependency · Open Source  
> Repository: [https://github.com/taufikinfo/AdvSoft](https://github.com/taufikinfo/AdvSoft)

