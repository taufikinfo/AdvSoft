<?php

namespace Addons\Project\Models;

use App\Model\Project\Project;
use App\Advsoft\{ModelDefinition, Field, Registry};

/**
 * ProjectDef – Project model with AdvSoft-style Computed Fields & Onchanges.
 *
 * Demonstrates:
 * - @api.depends computed fields (stored & non-stored)
 * - @api.onchange handlers (auto-fill, cascading updates)
 * - @api.constrains validations
 * - Full form/list/search view configuration
 */
class ProjectDef extends ModelDefinition
{
    public string $_name = 'project.project';
    public string $_description = 'Project';
    public string $_table = 'projects';
    public string $_order = 'name asc';
    public string $_rec_name = 'name';
    public string $modelClass = Project::class;

    // ── Field Definitions ────────────────────────────
    protected function defineFields(): void
    {
        // ── Core fields ──────────────────────────────
        $this->addField('name', Field::CHAR, [
            'string' => 'Project Name',
            'required' => true,
            'searchable' => true,
            'sortable' => true,
        ]);
        $this->addField('description', Field::TEXT, [
            'string' => 'Description',
        ]);
        $this->addField('status', Field::SELECTION, [
            'string' => 'Status',
            'selection' => [['draft', 'Draft'], ['active', 'Active'], ['cancelled', 'Cancelled'], ['archived', 'Archived']],
            'default' => 'draft',
            'groupable' => true,
            'searchable' => true,
        ]);
        $this->addField('color', Field::CHAR, [
            'string' => 'Color',
            'widget' => 'color_picker',
            'default' => '#6366f1',
        ]);

        // ── Relational fields ────────────────────────
        $this->addField('partner_id', Field::MANY2ONE, [
            'string' => 'Project Manager',
            'relation' => 'res.users',
            'searchable' => true,
            'sortable' => true,
            'help' => 'Person responsible for this project',
        ]);
        $this->addField('task_ids', Field::ONE2MANY, [
            'string' => 'Tasks',
            'relation' => 'task',
            'inverseField' => 'project_id',
        ]);

        // ── Date fields ──────────────────────────────
        $this->addField('date_start', Field::DATE, [
            'string' => 'Start Date',
            'sortable' => true,
            'searchable' => true,
        ]);
        $this->addField('date_end', Field::DATE, [
            'string' => 'End Date',
            'sortable' => true,
            'searchable' => true,
        ]);

        // ── Financial fields ─────────────────────────
        $this->addField('budget', Field::FLOAT, [
            'string' => 'Budget',
            'digits' => [12, 2],
            'sortable' => true,
            'help' => 'Planned budget for this project',
        ]);
        $this->addField('actual_cost', Field::FLOAT, [
            'string' => 'Actual Cost',
            'digits' => [12, 2],
            'sortable' => true,
            'help' => 'Actual costs incurred',
        ]);


        $this->addField('privacy_visibility', Field::SELECTION, [
            'string' => 'Visibility',
            'selection' => [
                ['portal', 'Invited Portal Users & All Internal Users'],
                ['employees', 'All Internal Users'],
                ['followers', 'Invited Internal Users Only'],
            ],
            'default' => 'portal',
            'help' => 'Who can see this project and its tasks',
        ]);

        // ══════════════════════════════════════════════
        //  COMPUTED FIELDS (store=true → stored, recomputed on write)
        //  (store=false → computed on-the-fly during read)
        // ══════════════════════════════════════════════

        // @api.depends('task_ids') - Stored computed: count of tasks
        $this->addField('task_count', Field::INTEGER, [
            'string' => 'Task Count',
            'store' => true,
            'compute' => 'computeTaskCount',
            'depends' => ['task_ids'],
            'readonly' => true,
            'help' => 'Number of tasks in this project',
        ]);

        // @api.depends('task_ids.progress') - Stored computed: average progress
        $this->addField('progress', Field::FLOAT, [
            'string' => 'Progress',
            'widget' => 'progressbar',
            'digits' => [5, 2],
            'store' => true,
            'compute' => 'computeProgress',
            'depends' => ['task_ids.progress'],
            'readonly' => true,
            'help' => 'Average progress across all tasks',
        ]);

        // @api.depends('budget', 'actual_cost') - Non-stored computed: remaining budget
        $this->addField('remaining_budget', Field::FLOAT, [
            'string' => 'Remaining Budget',
            'digits' => [12, 2],
            'store' => false,
            'compute' => 'computeRemainingBudget',
            'depends' => ['budget', 'actual_cost'],
            'readonly' => true,
            'help' => 'Budget minus actual costs',
        ]);

        // @api.depends('budget', 'actual_cost') - Non-stored: budget usage %
        $this->addField('budget_usage', Field::FLOAT, [
            'string' => 'Budget Usage (%)',
            'widget' => 'progressbar',
            'digits' => [5, 2],
            'store' => false,
            'compute' => 'computeBudgetUsage',
            'depends' => ['budget', 'actual_cost'],
            'readonly' => true,
            'help' => 'Percentage of budget consumed',
        ]);

        // @api.depends('date_start', 'date_end') - Non-stored: project duration in days
        $this->addField('duration_days', Field::INTEGER, [
            'string' => 'Duration (Days)',
            'store' => false,
            'compute' => 'computeDuration',
            'depends' => ['date_start', 'date_end'],
            'readonly' => true,
            'help' => 'Number of days between start and end dates',
        ]);

        // @api.depends('status') - Non-stored: display label
        $this->addField('status_label', Field::CHAR, [
            'string' => 'Status Label',
            'store' => false,
            'compute' => 'computeStatusLabel',
            'depends' => ['status'],
            'readonly' => true,
            'invisible' => true,
        ]);
    }

    // ══════════════════════════════════════════════════
    //  VIEW DEFINITIONS
    // ══════════════════════════════════════════════════

    protected function defineViews(): void
    {
        // List view
        $this->listView = [
            'string'        => 'Projects',
            'editable'      => null,
            'default_order' => 'name asc',
            'limit'         => 80,
            'fields' => [
                'name',
                'partner_id',
                'status',
                'task_count',
                'progress',
                'budget',
                'date_start',
                'date_end',
            ],
            'column_config' => [
                'budget' => [
                    'sum' => 'Total Budget',
                ],
                'task_count' => [
                    'sum' => 'Total Tasks',
                ],
                'progress' => [
                    'avg' => 'Avg Progress',
                    'widget' => 'progressbar',
                ],
                'status' => [
                    'widget' => 'badge',
                ],
            ],
            'decoration' => [
                'decoration-danger'  => "status == 'cancelled'",
                'decoration-success' => "status == 'active'",
                'decoration-muted'   => "status == 'archived'",
            ],
            'header_buttons' => [
                [
                    'name'    => 'action_confirm',
                    'type'    => 'object',
                    'string'  => 'Confirm',
                    'class'   => 'ls-btn-primary',
                    'confirm' => 'Confirm selected projects?',
                ],
            ],
        ];

        // Form view
        $this->formView = [
            'title' => 'name',
            'statusbar' => 'status',
            'groups' => [
                [
                    // Left column
                    ['partner_id', 'date_start', 'date_end', 'privacy_visibility'],
                    // Right column
                    ['status', 'color', 'task_count'],
                ],
                [
                    // Financial left
                    ['budget', 'actual_cost'],
                    // Financial right
                    ['remaining_budget', 'budget_usage'],
                ],
            ],
            'tabs' => [
                [
                    'name' => 'description',
                    'label' => 'Description',
                    'type' => 'field',
                    'field' => 'description',
                ],
                [
                    'name' => 'tasks',
                    'label' => 'Tasks',
                    'type' => 'one2many',
                    'field' => 'task_ids',
                    'tree_fields' => ['name', 'assignee', 'stage_id', 'progress', 'deadline'],
                    'sum_field' => 'progress',
                    'sum_label' => 'Avg Progress',
                ],
            ],
            'header_buttons' => [
                [
                    'name' => 'action_confirm',
                    'type' => 'object',
                    'string' => 'Confirm',
                    'class' => 'ls-btn-primary',
                    'invisible' => "status != 'draft'",
                ],
                [
                    'name' => 'action_cancel',
                    'type' => 'object',
                    'string' => 'Cancel',
                    'class' => 'ls-btn-secondary',
                    'confirm' => 'Are you sure you want to cancel this project?',
                    'invisible' => "status == 'cancelled'",
                ]
            ],
            'stat_buttons' => [
                [
                    'name' => 'action_view_tasks',
                    'type' => 'object',
                    'string' => 'Tasks',
                    'icon' => 'fa-tasks',
                    'field' => 'task_count',
                ]
            ]
        ];

        // Search view
        $this->searchView = [
            'filters' => [
                ['id' => 'active', 'label' => 'Active', 'domain' => [['status', '=', 'active']]],
                ['id' => 'archived', 'label' => 'Archived', 'domain' => [['status', '=', 'archived']]],
                ['id' => 'with_budget', 'label' => 'With Budget', 'domain' => [['budget', '>', 0]]],
            ],
            'group_by' => [
                ['field' => 'status', 'label' => 'Status'],
                ['field' => 'partner_id', 'label' => 'Project Manager'],
            ],
            'searchpanel' => [
                ['field' => 'status', 'type' => 'selection', 'label' => 'Status', 'icon' => 'activity'],
            ],
            'custom_filter_fields' => ['name', 'status', 'budget', 'date_start', 'date_end'],
        ];

        // Kanban view
        $this->kanbanView = [
            'default_group_by' => 'status',
            'quick_create' => true,
            'card_title' => 'name',
            'card_fields' => ['partner_id', 'task_count', 'progress', 'budget'],
            'color_field' => 'color',
            'progress_bar' => ['field' => 'progress'],
        ];

        // Calendar view
        $this->calendarView = [
            'date_start' => 'date_start',
            'date_stop' => 'date_end',
            'color' => 'status',
            'mode' => 'month',
            'all_day' => true,
            'event_display_fields' => ['name', 'partner_id'],
            'quick_create' => true,
            'create_name_field' => 'name',
            'color_legend' => true,
        ];

        // Graph view
        $this->graphView = [
            'type' => 'bar',
            'measure' => 'budget',
            'groupby' => ['status'],
            'stacked' => false,
            'measures' => ['budget', 'actual_cost', 'task_count', 'progress'],
            'dimensions' => ['status', 'partner_id'],
        ];

        // Pivot view
        $this->pivotView = [
            'row_groupby' => ['partner_id'],
            'col_groupby' => ['status'],
            'measures' => ['budget', 'actual_cost', 'task_count', 'progress'],
            'dimensions' => ['status', 'partner_id'],
        ];

        // Spreadsheet view
        $this->spreadsheetView = [
            'fields' => ['name', 'status', 'partner_id', 'date_start', 'date_end', 'budget', 'progress'],
            'column_width' => 130,
            'row_height' => 28,
            'limit' => 500,
            'aggregation' => 'sum',
            'readonly' => false,
        ];
    }

    // ══════════════════════════════════════════════════
    //  SECURITY
    // ══════════════════════════════════════════════════

    protected function defineSecurity(): void
    {
        $this->access = [
            'read' => true,
            'write' => true,
            'create' => true,
            'unlink' => true,
        ];
    }

    // =========================================================================
    //  Action Methods (Button callbacks)
    // =========================================================================

    public function action_confirm(Project $record)
    {
        if ($record->status !== 'draft') {
            throw new \Exception("Only draft projects can be confirmed!");
        }

        $record->status = 'active';
        $record->save();

        return [
            'type' => 'ir.actions.client',
            'tag' => 'display_notification',
            'params' => [
                'title' => 'Project Confirmed',
                'message' => 'The project has been successfully activated.',
                'type' => 'success'
            ]
        ];
    }

    public function action_cancel(Project $record)
    {
        $record->status = 'cancelled';
        $record->save();

        return [
            'type' => 'ir.actions.client',
            'tag' => 'display_notification',
            'params' => [
                'title' => 'Project Cancelled',
                'message' => 'The project has been marked as cancelled.',
                'type' => 'warning'
            ]
        ];
    }

    public function action_view_tasks(Project $record)
    {
        return [
            'type' => 'ir.actions.act_window',
            'name' => 'Project Tasks',
            'res_model' => 'task',
            'view_mode' => 'list,form',
            'domain' => [['project_id', '=', $record->id]],
            'context' => ['default_project_id' => $record->id]
        ];
    }

    // =========================================================================
    //  Constraints and Checks
    // =========================================================================

    protected function defineBusinessLogic(): void
    {
        // @api.constrains
        $this->constraintMethods = [
            'checkDates' => ['date_start', 'date_end'],
            'checkBudget' => ['budget', 'actual_cost'],
        ];

        // @api.onchange
        $this->onchangeMethods = [
            'onchangeStatus' => ['status'],
            'onchangeDateStart' => ['date_start'],
            'onchangePartner' => ['partner_id'],
            'onchangeBudget' => ['budget', 'actual_cost'],
        ];
    }

    // ══════════════════════════════════════════════════
    //  COMPUTED FIELD METHODS
    //  Signature: public function methodName(object $record, array $data): mixed
    // ══════════════════════════════════════════════════

    /**
     * @api.depends('task_ids')
     * Compute the total number of tasks in this project.
     */
    public function computeTaskCount(object $record, array $data): int
    {
        if ($record->relationLoaded('tasks')) {
            return $record->tasks->count();
        }
        return $record->tasks()->count();
    }

    /**
     * @api.depends('task_ids.progress')
     * Compute the average progress across all tasks.
     */
    public function computeProgress(object $record, array $data): float
    {
        if ($record->relationLoaded('tasks')) {
            $tasks = $record->tasks;
            return $tasks->count() > 0
                ? round($tasks->avg('progress'), 2)
                : 0;
        }
        return round($record->tasks()->avg('progress') ?: 0, 2);
    }

    /**
     * @api.depends('budget', 'actual_cost')
     * Compute remaining budget = budget - actual_cost.
     */
    public function computeRemainingBudget(object $record, array $data): float
    {
        $budget = (float) ($data['budget'] ?? $record->budget ?? 0);
        $cost = (float) ($data['actual_cost'] ?? $record->actual_cost ?? 0);
        return round($budget - $cost, 2);
    }

    /**
     * @api.depends('budget', 'actual_cost')
     * Compute budget usage as a percentage.
     */
    public function computeBudgetUsage(object $record, array $data): float
    {
        $budget = (float) ($data['budget'] ?? $record->budget ?? 0);
        $cost = (float) ($data['actual_cost'] ?? $record->actual_cost ?? 0);
        if ($budget <= 0) return 0;
        return round(min(($cost / $budget) * 100, 100), 2);
    }

    /**
     * @api.depends('date_start', 'date_end')
     * Compute the project duration in days.
     */
    public function computeDuration(object $record, array $data): int
    {
        $start = $data['date_start'] ?? $record->date_start;
        $end = $data['date_end'] ?? $record->date_end;
        if (!$start || !$end) return 0;

        try {
            $s = $start instanceof \DateTimeInterface ? $start : new \DateTime($start);
            $e = $end instanceof \DateTimeInterface ? $end : new \DateTime($end);
            return max(0, $e->diff($s)->days);
        } catch (\Exception) {
            return 0;
        }
    }

    /**
     * @api.depends('status')
     * Compute a display label for the status.
     */
    public function computeStatusLabel(object $record, array $data): string
    {
        $status = $data['status'] ?? $record->status ?? 'active';
        return match ($status) {
            'active' => '🟢 Active',
            'archived' => '📦 Archived',
            default => ucfirst($status),
        };
    }

    // ══════════════════════════════════════════════════
    //  CONSTRAINT METHODS
    //  Signature: public function methodName(object $record, array $values): ?string
    //  Return null if OK, error message string if validation fails.
    // ══════════════════════════════════════════════════

    /**
     * @api.constrains('date_start', 'date_end')
     * End date must be after start date.
     */
    public function checkDates(object $record, array $values): ?string
    {
        $start = $values['date_start'] ?? $record->date_start;
        $end = $values['date_end'] ?? $record->date_end;

        if ($start && $end) {
            $s = is_string($start) ? new \DateTime($start) : $start;
            $e = is_string($end) ? new \DateTime($end) : $end;
            if ($e < $s) {
                return 'End date must be after or equal to the start date.';
            }
        }
        return null;
    }

    /**
     * @api.constrains('budget', 'actual_cost')
     * Budget and actual cost cannot be negative.
     */
    public function checkBudget(object $record, array $values): ?string
    {
        $budget = $values['budget'] ?? $record->budget;
        if ($budget !== null && $budget < 0) {
            return 'Budget cannot be negative.';
        }
        $cost = $values['actual_cost'] ?? $record->actual_cost;
        if ($cost !== null && $cost < 0) {
            return 'Actual cost cannot be negative.';
        }
        return null;
    }

    // ══════════════════════════════════════════════════
    //  ONCHANGE METHODS
    //  Signature: public function methodName(string $field, array $values): array
    //  Returns the modified $values array with any auto-filled fields.
    //  The frontend receives these updated values and patches the form.
    // ══════════════════════════════════════════════════

    /**
     * @api.onchange('status')
     * When status changes to 'archived':
     *   - Auto-clear the end date if not set
     * When status changes to 'active':
     *   - Auto-set start date to today if not set
     */
    public function onchangeStatus(string $field, array $values): array
    {
        $status = $values['status'] ?? null;
        if ($status === 'archived') {
            if (empty($values['date_end'])) {
                $values['date_end'] = now()->format('Y-m-d');
            }
        } elseif ($status === 'active') {
            if (empty($values['date_start'])) {
                $values['date_start'] = now()->format('Y-m-d');
            }
        }
        return $values;
    }

    /**
     * @api.onchange('date_start')
     * When start date is set:
     *   - If end date is empty, auto-set to start + 30 days
     *   - If end date < start date, reset end date to start + 30 days
     */
    public function onchangeDateStart(string $field, array $values): array
    {
        $start = $values['date_start'] ?? null;
        if ($start) {
            try {
                $startDate = new \DateTime($start);
                $endDate = !empty($values['date_end']) ? new \DateTime($values['date_end']) : null;

                if (!$endDate || $endDate < $startDate) {
                    $defaultEnd = clone $startDate;
                    $defaultEnd->modify('+30 days');
                    $values['date_end'] = $defaultEnd->format('Y-m-d');
                }
            } catch (\Exception) {
            }
        }
        return $values;
    }

    /**
     * @api.onchange('partner_id')
     * When a project manager is assigned:
     *   - Could auto-set visibility to 'employees' for external partners
     */
    public function onchangePartner(string $field, array $values): array
    {
        return $values;
    }

    /**
     * @api.onchange('budget', 'actual_cost')
     * When budget or cost changes:
     *   - Recompute remaining_budget and budget_usage on the fly
     */
    public function onchangeBudget(string $field, array $values): array
    {
        $budget = (float) ($values['budget'] ?? 0);
        $cost = (float) ($values['actual_cost'] ?? 0);
        $values['remaining_budget'] = round($budget - $cost, 2);
        $values['budget_usage'] = $budget > 0
            ? round(min(($cost / $budget) * 100, 100), 2)
            : 0;
        return $values;
    }

    // ══════════════════════════════════════════════════
    //  RECOMPUTE STORED FIELDS (called after write)
    // ══════════════════════════════════════════════════

    /**
     * Recompute stored computed fields after a write.
     * In Odoo, this is triggered by the ORM when dependent fields change.
     */
    public function recomputeStoredFields(object $record): void
    {
        $record->load('tasks');
        $record->task_count = $this->computeTaskCount($record, []);
        $record->progress = $this->computeProgress($record, []);
        $record->saveQuietly();
    }
}
