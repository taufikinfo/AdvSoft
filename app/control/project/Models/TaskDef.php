<?php

namespace Addons\Project\Models;

use App\Models\Task;
use App\Odoo\{ModelDefinition, Field};
use App\Core\Support\Log;

/**
 * TaskDef – Full Odoo-style configurable model definition for project.task.
 * Demonstrates all concepts: Fields, Views, Security, Computed, Onchange, Constraints.
 */
class TaskDef extends ModelDefinition
{
    public string $_name = 'task';
    public string $_description = 'Task';
    public string $_table = 'tasks';
    public string $_order = 'id desc';
    public string $_rec_name = 'name';
    public array $_inherit = [];
    public string $modelClass = Task::class;

    // ── Field definitions (like Python class body) ───
    protected function defineFields(): void
    {
        // Scalar fields
        $this->addField('name', Field::CHAR, [
            'string' => 'Task Name',
            'required' => true,
            'size' => 255,
            'searchable' => true,
            'sortable' => true,
        ]);
        $this->addField('description', Field::HTML, [
            'string' => 'Description',
            'help' => 'Detailed task description (rich text)',
            'htmlPreset' => 'full',                // toolbar = full Odoo-style
            'htmlPlaceholder' => 'Describe this task…',
            'htmlMinHeight' => '220px',
            // 'htmlPlugins' => ['history', 'heading', 'list', 'link', 'image', 'table',
            //                    'code', 'quote', 'color', 'mention', 'embed', 'emoji',
            //                    'clean', 'source', 'fullscreen'],
        ]);
        $this->addField('priority', Field::SELECTION, [
            'string' => 'Priority',
            'widget' => 'priority',
            'selection' => [['0', 'Normal'], ['1', 'Low'], ['2', 'High'], ['3', 'Urgent']],
            'default' => '0',
            'groupable' => true,
            'searchable' => true,
        ]);
        $this->addField('assignee', Field::CHAR, [
            'string' => 'Assignee',
            'searchable' => true,
            'sortable' => true,
            'groupable' => true,
        ]);
        $this->addField('deadline', Field::DATE, [
            'string' => 'Deadline',
            'sortable' => true,
            'searchable' => true,
        ]);
        $this->addField('remaining_days', Field::INTEGER, [
            'string' => 'Remaining Days',
            'compute' => 'computeRemainingDays',
            'store' => false,
            'help' => 'Automatically computed from deadline',
        ]);
        $this->addField('planned_hours', Field::FLOAT, [
            'string' => 'Planned Hours',
            'digits' => [8, 2],
            'sortable' => true,
            'help' => 'Estimated hours for this task',
        ]);
        $this->addField('progress', Field::FLOAT, [
            'string' => 'Progress',
            'widget' => 'progressbar',
            'digits' => [5, 2],
            'sortable' => true,
            'help' => 'Completion percentage (0-100)',
        ]);
        $this->addField('active', Field::BOOLEAN, [
            'string' => 'Active',
            'default' => true,
            'invisible' => true,
        ]);

        // Extra fields to demonstrate widgets (store=false so no DB migration needed)
        $this->addField('is_favorite', Field::BOOLEAN, [
            'string' => 'Favorite',
            'widget' => 'boolean_favorite',
            'store' => false,
        ]);
        $this->addField('color', Field::CHAR, [
            'string' => 'Color',
            'widget' => 'color_picker',
            'store' => false,
        ]);
        $this->addField('email', Field::CHAR, [
            'string' => 'Email',
            'widget' => 'email',
            'store' => false,
        ]);
        $this->addField('website', Field::CHAR, [
            'string' => 'Website',
            'widget' => 'url',
            'store' => false,
        ]);

        // Relational fields
        $this->addField('project_id', Field::MANY2ONE, [
            'string' => 'Project',
            'relation' => 'project.project',
            'required' => true,
            'searchable' => true,
            'sortable' => true,
            'groupable' => true,
            'displayFields' => ['id', 'name', 'color'],
        ]);
        $this->addField('user_id', Field::MANY2ONE, [
            'string' => 'Assigned User',
            'relation' => 'res.users',
            'searchable' => true,
            'sortable' => true,
            'groupable' => true,
        ]);
        $this->addField('stage_id', Field::MANY2ONE, [
            'string' => 'Stage',
            'relation' => 'stage',
            'required' => true,
            'searchable' => true,
            'sortable' => true,
            'groupable' => true,
            'widget' => 'statusbar',
            'displayFields' => ['id', 'name', 'sequence'],
        ]);
        $this->addField('tag_ids', Field::MANY2MANY, [
            'string' => 'Tags',
            'relation' => 'project.tag',
            'pivot' => 'task_tag',
            'widget' => 'many2many_tags',
        ]);
        $this->addField('timesheet_ids', Field::ONE2MANY, [
            'string' => 'Timesheets',
            'relation' => 'task.timesheet',
            'inverse_field' => 'task_id',
        ]);
    }

    // ── View definitions (configurable, not hardcoded) ──
    protected function defineViews(): void
    {
        // ═══════════════════════════════════════════════════
        //  List View — Full Odoo <tree> arch configuration
        //  <tree editable="top" decoration-danger="...">
        // ═══════════════════════════════════════════════════
        $this->listView = [
            // <tree string="Tasks" editable="top" default_order="deadline asc" limit="80">
            'string'        => 'Tasks',
            // 'editable'      => 'top',        // 'top' = new row at top, 'bottom' = at bottom, null = no inline edit
            // 'multi_edit'    => true,          // multi_edit="1" — edit multiple records at once
            'default_order' => 'id desc',
            'limit'         => 80,

            // <field> columns — order and visible fields
            'fields' => [
                'name',
                'assignee',
                'project_id',
                'planned_hours',
                'progress',
                'tag_ids',
                'deadline',
                'stage_id',
            ],

            // Column-level config (per-field overrides in <field> tag)
            'column_config' => [
                'planned_hours' => [
                    'sum'      => 'Total',           // <field name="planned_hours" sum="Total"/>
                    'widget'   => 'float_time',
                ],
                'progress' => [
                    'avg'      => 'Avg Progress',    // <field name="progress" avg="Avg Progress"/>
                ],
                'stage_id' => [
                    'optional' => 'show',            // <field name="stage_id" optional="show"/>
                    'widget'   => 'badge',
                ],
                'tag_ids' => [
                    'optional' => 'show',
                ],
                'deadline' => [
                    'optional' => 'show',
                    'widget'   => 'remaining_days',
                ],
            ],

            // decoration rules — conditional row coloring (boolean expressions)
            // <tree decoration-danger="progress == 0" decoration-success="progress >= 100">
            'decoration' => [
                'decoration-danger'  => 'progress == 0 and deadline != false',   // merah: no progress + has deadline
                'decoration-success' => 'progress >= 100',                        // hijau: completed
                'decoration-warning' => 'progress > 0 and progress < 50',         // kuning: low progress
                'decoration-info'    => 'progress >= 50 and progress < 100',      // biru: medium progress
            ],

            // <header> buttons — multi-record actions
            'header_buttons' => [
                [
                    'name'    => 'action_mark_done',
                    'type'    => 'object',
                    'string'  => 'Mark Done',
                    'class'   => 'ls-btn-primary',
                    'icon'    => 'check-circle',
                    'confirm' => 'Mark selected tasks as done?',
                ],
                [
                    'name'    => 'action_archive',
                    'type'    => 'object',
                    'string'  => 'Archive',
                    'class'   => 'ls-btn-secondary',
                    'icon'    => 'archive',
                ],
            ],
        ];

        // ═══════════════════════════════════════════════════
        //  Form View — Full Odoo <form> arch configuration
        //  <form> → <header> → <sheet> → <div.oe_chatter>
        // ═══════════════════════════════════════════════════
        $this->formView = [
            // <form string="Task" create="1" edit="1" delete="1">
            'string' => 'Task',

            // ── <header> ─────────────────────────────────
            // Statusbar field (widget="statusbar", clickable)
            'statusbar' => 'stage_id',
            'statusbar_clickable' => true,

            // <header> buttons with states-based visibility
            'header_buttons' => [
                [
                    'name'    => 'action_confirm',
                    'type'    => 'object',
                    'string'  => 'Confirm',
                    'class'   => 'ls-btn-primary',
                    'invisible' => "progress > 0",
                ],
                [
                    'name'    => 'action_start_progress',
                    'type'    => 'object',
                    'string'  => 'Start Progress',
                    'class'   => 'ls-btn-primary',
                    'invisible' => "progress != 0 or stage_id == 4",
                ],
                [
                    'name'    => 'action_mark_done',
                    'type'    => 'object',
                    'string'  => 'Mark Done',
                    'class'   => 'ls-btn-success',
                    'confirm' => 'Mark this task as done?',
                    'invisible' => "progress >= 100",
                ],
                [
                    'name'    => 'action_reset_draft',
                    'type'    => 'object',
                    'string'  => 'Reset to Draft',
                    'class'   => 'ls-btn-secondary',
                    'invisible' => "progress < 100",
                ],
            ],

            // ── <sheet> title + priority ──────────────────
            'title'    => 'name',
            'priority' => 'priority',

            // ── <sheet> → <group> with attrs ─────────────
            // Groups support both simple string fields and dict with attrs
            'groups' => [
                // Group 1: Main info (2-column layout)
                [
                    'string' => null,  // unnamed group
                    'col' => 2,
                    'columns' => [
                        // Left column
                        [
                            ['name' => 'project_id', 'options' => ['no_create' => true, 'no_create_edit' => true]],
                            'assignee',
                            ['name' => 'planned_hours', 'widget' => 'float_time'],
                            // Field with attrs: readonly when progress >= 100
                            ['name' => 'email', 'attrs' => ['readonly' => "progress >= 100"]],
                            'website',
                        ],
                        // Right column
                        [
                            'tag_ids',
                            'deadline',
                            'remaining_days',
                            'progress',
                            'is_favorite',
                            ['name' => 'color', 'widget' => 'color_picker'],
                        ],
                    ],
                ],
            ],

            // ── <notebook> → <page> tabs ─────────────────
            'tabs' => [
                // Page 1: My Timesheets (One2many tree view)
                [
                    'name' => 'timesheets',
                    'label' => 'My Timesheets',
                    'type' => 'one2many',
                    'field' => 'timesheet_ids',
                    'child_model' => 'task.timesheet',
                    'tree_fields' => ['date', 'user_id', 'name', 'unit_amount'],
                ],
                // Page 2: Description (text/html field)
                [
                    'name'  => 'description',
                    'label' => 'Description',
                    'type'  => 'field',
                    'field' => 'description',
                ],
            ],
        ];

        // Search view: predefined filters and group by options
        $this->searchView = [
            'filters' => [
                ['id' => 'my_tasks', 'label' => 'My Tasks', 'domain' => [['assignee', '=', 'Mitchell Admin']]],
                ['id' => 'unassigned', 'label' => 'Unassigned', 'domain' => [['assignee', '=', '']]],
                ['id' => 'high_priority', 'label' => 'High Priority', 'domain' => [['priority', 'in', ['2', '3']]]],
                ['id' => 'overdue', 'label' => 'Overdue', 'domain_func' => 'getOverdueDomain'],
                ['id' => 'in_progress', 'label' => 'In Progress', 'domain_func' => 'getInProgressDomain'],
                ['id' => 'done', 'label' => 'Done', 'domain_func' => 'getDoneDomain'],
            ],
            'group_by' => [
                ['field' => 'stage_id', 'label' => 'Stage'],
                ['field' => 'project_id', 'label' => 'Project'],
                ['field' => 'assignee', 'label' => 'Assignee'],
                ['field' => 'priority', 'label' => 'Priority'],
            ],
            'searchpanel' => [
                ['field' => 'project_id', 'type' => 'many2one', 'label' => 'Project', 'icon' => 'folder'],
                ['field' => 'stage_id', 'type' => 'many2one', 'label' => 'Stage', 'icon' => 'columns'],
            ],
            'custom_filter_fields' => ['name', 'assignee', 'priority', 'planned_hours', 'progress', 'deadline'],
        ];

        // Kanban view: card layout with drag-and-drop columns
        $this->kanbanView = [
            'default_group_by' => 'stage_id',
            'quick_create' => true,
            'card_title' => 'name',
            'card_fields' => ['assignee', 'planned_hours', 'progress', 'deadline'],
            'card_tags' => 'tag_ids',
            'card_footer' => ['priority', 'progress', 'assignee'],
            'color_field' => 'priority',
            'progress_bar' => [
                'field' => 'progress',
                'colors' => ['low' => '#3b82f6', 'medium' => '#f59e0b', 'high' => '#10b981'],
            ],
            'decoration' => [
                'overdue' => "deadline < today() and stage_id != 4",
                'done' => "stage_id == 4",
            ],
            'aggregates' => [
                'planned_hours' => ['label' => 'hours', 'decimals' => 1],
            ],
        ];

        // Calendar view: shows tasks by deadline
        $this->calendarView = [
            'date_start' => 'deadline',
            'date_stop' => null,
            'color' => 'project_id',
            'mode' => 'month',
            'all_day' => true,
            'event_display_fields' => ['name', 'assignee'],
            'quick_create' => true,
            'create_name_field' => 'name',
            'date_delay' => 'planned_hours',
            'color_legend' => true,
        ];

        // Graph view: visualize task metrics
        $this->graphView = [
            'type' => 'bar',
            'measure' => 'planned_hours',
            'groupby' => ['stage_id'],
            'stacked' => false,
            'measures' => ['planned_hours', 'progress'],
            'dimensions' => ['project_id', 'stage_id', 'assignee', 'priority'],
        ];

        // Pivot view: cross-tab analysis
        $this->pivotView = [
            'row_groupby' => ['project_id'],
            'col_groupby' => ['stage_id'],
            'measures' => ['planned_hours', 'progress'],
            'dimensions' => ['project_id', 'stage_id', 'assignee', 'priority'],
        ];

        // Spreadsheet view: editable grid for bulk data entry
        $this->spreadsheetView = [
            'fields' => ['name', 'project_id', 'assignee', 'priority', 'deadline', 'planned_hours', 'progress'],
            'column_width' => 130,
            'row_height' => 28,
            'limit' => 500,
            'aggregation' => 'sum',
            'readonly' => false,
        ];
    }

    // ══════════════════════════════════════════════════════
    //  Security — ir.model.access + ir.rule
    // ══════════════════════════════════════════════════════
    protected function defineSecurity(): void
    {
        // Layer 1: ir.model.access (CRUD per group)
        $this->setAccess([
            'read'   => true,
            'write'  => true,
            'create' => true,
            'unlink' => true,
        ]);

        // Group-based overrides (like ir.model.access CSV)
        $this->addAccessRule('project_manager', ['read', 'write', 'create', 'unlink']);
        $this->addAccessRule('project_user', ['read', 'write', 'create']);

        // Field-level access
        $this->setFieldAccess('create_date', ['read' => true, 'write' => false]);
        $this->setFieldAccess('write_date', ['read' => true, 'write' => false]);

        // Layer 2: ir.rule (domain-based record filtering)
        $this->addRecordRule(
            'active_filter',
            [['active', '=', true]],
            ['read']
        );
    }

    // ══════════════════════════════════════════════════════
    //  Business Logic — @api.depends / @api.constrains / @api.onchange / @api.model
    // ══════════════════════════════════════════════════════
    protected function defineBusinessLogic(): void
    {
        // @api.depends('deadline')
        $this->apiDepends('computeRemainingDays', ['deadline']);

        // @api.constrains('progress', 'planned_hours')
        $this->apiConstrains('checkProgress', ['progress']);
        $this->apiConstrains('checkPlannedHours', ['planned_hours']);

        // @api.onchange('stage_id', 'project_id', 'deadline')
        $this->apiOnchange('onchangeStage', ['stage_id']);
        $this->apiOnchange('onchangeProject', ['project_id']);
        $this->apiOnchange('onchangeDeadline', ['deadline']);

        // @api.model (class-level methods)
        $this->apiModel('_default_get');
    }

    // ══════════════════════════════════════════════════════
    //  Computed — @api.depends
    // ══════════════════════════════════════════════════════

    /** @api.depends('deadline') */
    public function computeRemainingDays(object $record, array $values): array
    {
        $deadline = $values['deadline'] ?? ($record->deadline ?? null);
        if ($deadline) {
            try {
                $target = new \DateTime($deadline);
                $today = new \DateTime('today');
                $diff = $today->diff($target);
                $days = $diff->invert ? -$diff->days : $diff->days;
                return ['remaining_days' => (int) $days];
            } catch (\Throwable $e) {
                return ['remaining_days' => 0];
            }
        }
        return ['remaining_days' => 0];
    }

    // ══════════════════════════════════════════════════════
    //  Constraints — @api.constrains
    // ══════════════════════════════════════════════════════

    /** @api.constrains('progress') */
    public function checkProgress(object $record, array $values): ?string
    {
        $progress = $values['progress'] ?? $record->progress;
        if ($progress !== null && ($progress < 0 || $progress > 100)) {
            return 'Progress must be between 0 and 100.';
        }
        return null;
    }

    /** @api.constrains('planned_hours') */
    public function checkPlannedHours(object $record, array $values): ?string
    {
        $hours = $values['planned_hours'] ?? $record->planned_hours;
        if ($hours !== null && $hours < 0) {
            return 'Planned hours cannot be negative.';
        }
        return null;
    }

    // ══════════════════════════════════════════════════════
    //  Onchange — @api.onchange (UI-only, not stored)
    // ══════════════════════════════════════════════════════

    /** @api.onchange('stage_id') - Auto set progress when moved to Done */
    public function onchangeStage(string $field, array $values): array
    {
        if (isset($values['stage_id'])) {
            $stageId = is_array($values['stage_id']) ? $values['stage_id'][0] : $values['stage_id'];
            $stageDef = \App\Odoo\Registry::get('stage');
            if ($stageDef && $stageId) {
                $stage = $stageDef->modelClass::find($stageId);
                if ($stage && strtolower($stage->name) === 'done') {
                    $values['progress'] = 100;
                }
            }
        }
        return $values;
    }

    /** @api.onchange('project_id') */
    public function onchangeProject(string $field, array $values): array
    {
        if (isset($values['project_id'])) {
            $projectId = is_array($values['project_id']) ? $values['project_id'][0] : $values['project_id'];
            $projectDef = \App\Odoo\Registry::get('project.project');
            
            if ($projectDef && $projectId) {
                $project = $projectDef->modelClass::find($projectId);
                if ($project) {
                    // Auto-set planned hours to 8 if not already set
                    if (empty($values['planned_hours'])) {
                        $values['planned_hours'] = 8.0;
                    }
                    // Auto-fill description with a template if empty or just <br>
                    $desc = trim(strip_tags($values['description'] ?? ''));
                    
                    // Timpa (overwrite) jika kosong ATAU jika isinya masih berupa template bawaan "Related to project:"
                    if (empty($desc) || strpos($values['description'] ?? '', 'Related to project:') !== false) {
                        $values['description'] = "<p>Related to project: <strong>{$project->name}</strong></p>";
                    }
                }
            }
        }
        return $values;
    }

    /** 
     * @api.onchange('deadline') 
     * If deadline is changed to today, auto set priority to Urgent and color to Red.
     */
    public function onchangeDeadline(string $field, array $values): array
    {
        if (!empty($values['deadline'])) {
            try {
                $deadlineDate = date('Y-m-d', strtotime($values['deadline']));
                $todayDate = date('Y-m-d');
                
                if ($deadlineDate === $todayDate) {
                    $values['priority'] = '3'; // Urgent
                    $values['color'] = '#ef4444'; // Merah
                }
            } catch (\Exception $e) {
                // Abaikan jika format tidak valid
            }
        }
        return $values;
    }

    // ══════════════════════════════════════════════════════
    //  @api.model — Class-level methods
    // ══════════════════════════════════════════════════════

    /** @api.model — Custom default values for new tasks */
    public function _default_get(array $defaults): array
    {
        $defaults['priority'] = '0';
        $defaults['progress'] = 0;
        $defaults['active'] = true;
        return $defaults;
    }

    // ══════════════════════════════════════════════════════
    //  Lifecycle hooks — override ORM for business logic
    // ══════════════════════════════════════════════════════

    /** Hook: before create — set defaults that depend on context */
    protected function beforeCreate(array &$vals): void
    {
        // Auto-set deadline to 7 days from now if not provided
        if (empty($vals['deadline'])) {
            $vals['deadline'] = now()->addDays(7)->format('Y-m-d');
        }
    }

    /** Hook: after create — trigger side effects */
    protected function afterCreate(object $record, array $vals): void
    {
        // Could send notification, log activity, etc.
        Log::info("Task created: {$record->name} (ID: {$record->id})");
    }

    /** Hook: before write — validate state transitions */
    protected function beforeWrite(object $record, array &$vals): void
    {
    }

    /** Hook: after write — recalculate dependent data */
    protected function afterWrite(object $record, array $vals): void
    {
        Log::info("Task updated: {$record->name} (ID: {$record->id})");
    }

    /** Hook: before unlink — check if task can be deleted */
    protected function beforeUnlink(object $record): ?string
    {
        return null;
    }

    /** name_get — Custom display name */
    public function nameGet(object $record): string
    {
        $name = $record->{$this->_rec_name} ?? '';
        if ($record->project_id && $record->relationLoaded('project')) {
            return "[{$record->project->name}] {$name}";
        }
        return $name;
    }

    // ── Domain function resolvers for search filters ──
    public function getOverdueDomain(): array
    {
        return [['deadline', '<', now()->format('Y-m-d')]];
    }

    public function getInProgressDomain(): array
    {
        $stage = \App\Models\Stage::where('name', 'In Progress')->first();
        return [['stage_id', '=', $stage?->id ?? 2]];
    }

    public function getDoneDomain(): array
    {
        $stage = \App\Models\Stage::where('name', 'Done')->first();
        return [['stage_id', '=', $stage?->id ?? 4]];
    }

    // ══════════════════════════════════════════════════════
    //  Header Button Actions (multi-record from <header>)
    // ══════════════════════════════════════════════════════

    /**
     * Mark selected tasks as done.
     * Called from <header> <button name="action_mark_done">.
     */
    public function action_mark_done(object $record): array
    {
        $doneStage = \App\Models\Stage::where('name', 'Done')->first();
        $record->progress = 100;
        if ($doneStage) $record->stage_id = $doneStage->id;
        $record->save();

        return [
            'type' => 'ir.actions.client',
            'tag'  => 'display_notification',
            'params' => [
                'title'   => 'Task Completed',
                'message' => "Task '{$record->name}' has been marked as done.",
                'type'    => 'success',
            ],
        ];
    }

    /**
     * Confirm a task — moves it out of draft state.
     * Called from <header> <button name="action_confirm">.
     */
    public function action_confirm(object $record): array
    {
        $inProgressStage = \App\Models\Stage::where('name', 'In Progress')->first();
        if ($record->progress == 0) {
            $record->progress = 1; // Mark as started
        }
        if ($inProgressStage) {
            $record->stage_id = $inProgressStage->id;
        }
        $record->save();

        return [
            'type' => 'ir.actions.client',
            'tag'  => 'display_notification',
            'params' => [
                'title'   => 'Task Confirmed',
                'message' => "Task '{$record->name}' has been confirmed and is now in progress.",
                'type'    => 'info',
            ],
        ];
    }

    /**
     * Start progress on a task.
     * Called from <header> <button name="action_start_progress">.
     */
    public function action_start_progress(object $record): array
    {
        $inProgressStage = \App\Models\Stage::where('name', 'In Progress')->first();
        if ($record->progress == 0) {
            $record->progress = 10; // Set initial progress
        }
        if ($inProgressStage) {
            $record->stage_id = $inProgressStage->id;
        }
        $record->save();

        return [
            'type' => 'ir.actions.client',
            'tag'  => 'display_notification',
            'params' => [
                'title'   => 'Progress Started',
                'message' => "Task '{$record->name}' is now in progress.",
                'type'    => 'info',
            ],
        ];
    }

    /**
     * Reset task back to draft state.
     * Called from <header> <button name="action_reset_draft">.
     */
    public function action_reset_draft(object $record): array
    {
        $newStage = \App\Models\Stage::where('name', 'New')->first();
        $record->progress = 0;
        if ($newStage) {
            $record->stage_id = $newStage->id;
        }
        $record->save();

        return [
            'type' => 'ir.actions.client',
            'tag'  => 'display_notification',
            'params' => [
                'title'   => 'Reset to Draft',
                'message' => "Task '{$record->name}' has been reset to draft.",
                'type'    => 'warning',
            ],
        ];
    }

    /**
    /**
     * Archive selected tasks.
     * Called from <header> <button name="action_archive">.
     */
    public function action_archive(object $record): array
    {
        $record->active = false;
        $record->save();

        return [
            'type' => 'ir.actions.client',
            'tag'  => 'display_notification',
            'params' => [
                'title'   => 'Task Archived',
                'message' => "Task '{$record->name}' has been archived.",
                'type'    => 'warning',
            ],
        ];
    }
}
