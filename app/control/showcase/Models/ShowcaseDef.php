<?php

namespace Addons\Showcase\Models;

use App\Model\Showcase;
use App\Odoo\Field;
use App\Odoo\ModelDefinition;

class ShowcaseDef extends ModelDefinition
{
    public string $_name = 'showcase.model';
    public string $_description = 'Widgets Showcase — All Fields & Widgets';
    public string $_table = 'showcases';
    public string $_rec_name = 'name';
    public string $modelClass = Showcase::class;

    protected function defineFields(): void
    {
        // ═══════════════════════════════════════════════════════
        //  1. CHAR / TEXT FAMILY
        // ═══════════════════════════════════════════════════════
        $this->addField('name', Field::CHAR, ['string' => 'Name', 'required' => true]);
        $this->addField('email', Field::CHAR, ['string' => 'Email', 'widget' => 'email']);
        $this->addField('website', Field::CHAR, ['string' => 'Website', 'widget' => 'url']);
        $this->addField('phone', Field::CHAR, ['string' => 'Phone', 'widget' => 'phone']);
        $this->addField('clipboard_text', Field::CHAR, ['string' => 'Clipboard', 'widget' => 'copy_clipboard', 'default' => 'Copy me!']);
        $this->addField('emoji_text', Field::CHAR, ['string' => 'Emoji Text', 'widget' => 'char_emojis']);
        $this->addField('char_badge_demo', Field::CHAR, ['string' => 'Char Badge', 'widget' => 'char_badge', 'default' => 'Tag Label', 'options' => ['badge_color' => '#3b82f6']]);
        $this->addField('image_url', Field::CHAR, ['string' => 'Image URL', 'widget' => 'char_image', 'options' => ['size' => [120, 120]]]);

        // Text / Multiline
        $this->addField('description', Field::TEXT, ['string' => 'Description']);
        $this->addField('html_content', Field::HTML, ['string' => 'HTML Notes']);

        // ═══════════════════════════════════════════════════════
        //  2. NUMERIC FAMILY
        // ═══════════════════════════════════════════════════════
        $this->addField('age', Field::INTEGER, ['string' => 'Age']);
        $this->addField('score', Field::FLOAT, ['string' => 'Score', 'digits' => [10, 2]]);
        $this->addField('price', Field::FLOAT, ['string' => 'Price', 'widget' => 'monetary']);
        $this->addField('progress', Field::INTEGER, ['string' => 'Progress', 'widget' => 'progressbar']);
        $this->addField('percent_val', Field::FLOAT, ['string' => 'Percentage', 'widget' => 'percentage', 'default' => 0.75]);
        $this->addField('time_val', Field::FLOAT, ['string' => 'Time Float', 'widget' => 'float_time', 'default' => 8.5]);
        $this->addField('factor_float', Field::FLOAT, ['string' => 'Factor (×10)', 'widget' => 'float_factor', 'options' => ['factor' => 10]]);
        $this->addField('toggle_float', Field::FLOAT, ['string' => 'Float Toggle', 'widget' => 'float_toggle', 'options' => ['range' => [0, 0.5, 1]], 'default' => 0.5]);
        $this->addField('int_badge', Field::INTEGER, ['string' => 'Integer Badge', 'widget' => 'integer_badge', 'default' => 5]);
        $this->addField('handle_val', Field::INTEGER, ['string' => 'Handle (Drag)', 'widget' => 'handle']);
        $this->addField('currency_code', Field::CHAR, ['string' => 'Currency', 'default' => 'EUR']);
        $this->addField('monetary_full', Field::FLOAT, ['string' => 'Monetary Full', 'widget' => 'monetary_field', 'options' => ['currency_field' => 'currency_code']]);
        $this->addField('pct_pie', Field::INTEGER, ['string' => 'Percent Pie', 'widget' => 'percentage_pie', 'default' => 65]);

        // ═══════════════════════════════════════════════════════
        //  3. BOOLEAN FAMILY
        // ═══════════════════════════════════════════════════════
        $this->addField('is_active', Field::BOOLEAN, ['string' => 'Active (Toggle)', 'widget' => 'boolean_toggle']);
        $this->addField('is_favorite', Field::BOOLEAN, ['string' => 'Favorite (Star)', 'widget' => 'boolean_favorite']);
        $this->addField('bool_btn', Field::BOOLEAN, ['string' => 'Bool Button', 'widget' => 'boolean_button']);
        $this->addField('is_checked', Field::BOOLEAN, ['string' => 'Checkbox', 'widget' => 'boolean']);

        // ═══════════════════════════════════════════════════════
        //  4. DATE / DATETIME FAMILY
        // ═══════════════════════════════════════════════════════
        $this->addField('start_date', Field::DATE, ['string' => 'Start Date', 'widget' => 'date']);
        $this->addField('end_date', Field::DATE, ['string' => 'End Date']);
        $this->addField('date_range', Field::DATE, ['string' => 'Date Range', 'widget' => 'daterange', 'options' => ['related_end_date' => 'end_date']]);
        $this->addField('deadline', Field::DATETIME, ['string' => 'Deadline (Days)', 'widget' => 'remaining_days']);
        $this->addField('datetime_val', Field::DATETIME, ['string' => 'Date & Time', 'widget' => 'datetime']);
        $this->addField('countdown_time', Field::DATETIME, ['string' => 'Countdown', 'widget' => 'countdown']);

        // ═══════════════════════════════════════════════════════
        //  5. SELECTION FAMILY
        // ═══════════════════════════════════════════════════════
        $this->addField('status', Field::SELECTION, [
            'string' => 'Status',
            'selection' => [
                ['draft', 'Draft'],
                ['review', 'Review'],
                ['published', 'Published'],
                ['done', 'Done'],
                ['cancelled', 'Cancelled'],
            ],
            'default' => 'draft',
        ]);
        $this->addField('priority', Field::SELECTION, [
            'string' => 'Priority (Stars)',
            'selection' => [
                ['0', 'Low'],
                ['1', 'Normal'],
                ['2', 'High'],
                ['3', 'Urgent'],
            ],
            'widget' => 'priority',
            'default' => '0',
        ]);
        $this->addField('radio_sel', Field::SELECTION, [
            'string' => 'Radio Selection',
            'selection' => [['1', 'Option 1'], ['2', 'Option 2'], ['3', 'Option 3']],
            'widget' => 'radio',
        ]);
        $this->addField('badge_sel', Field::SELECTION, [
            'string' => 'Status Badge',
            'selection' => [['draft', 'Draft'], ['done', 'Done'], ['cancelled', 'Cancelled'], ['pending', 'Pending']],
            'widget' => 'badge',
            'default' => 'draft',
        ]);
        $this->addField('sel_badge', Field::SELECTION, [
            'string' => 'Selection Badges',
            'selection' => [['1', 'Active'], ['0', 'Inactive']],
            'widget' => 'selection_badge',
            'default' => '1',
        ]);
        $this->addField('lbl_sel', Field::SELECTION, [
            'string' => 'Label Only',
            'selection' => [['a', 'Option A'], ['b', 'Option B']],
            'widget' => 'label_selection',
            'default' => 'b',
        ]);

        // ═══════════════════════════════════════════════════════
        //  6. RELATIONAL FAMILY
        // ═══════════════════════════════════════════════════════
        $this->addField('user_id', Field::MANY2ONE, [
            'string' => 'Assigned User',
            'relation' => 'res.users',
            'widget' => 'many2one_avatar',
        ]);
        $this->addField('barcode_user', Field::MANY2ONE, [
            'string' => 'Scan User (Barcode)',
            'relation' => 'res.users',
            'widget' => 'many2one_barcode',
        ]);
        $this->addField('manager_id', Field::MANY2ONE, [
            'string' => 'Manager',
            'relation' => 'res.users',
            'widget' => 'many2one',
        ]);

        $this->addField('tags', Field::MANY2MANY, [
            'string' => 'Tags (M2M Tags)',
            'relation' => 'project.tag',
            'widget' => 'many2many_tags',
        ]);
        $this->addField('tag_checkboxes', Field::MANY2MANY, [
            'string' => 'Tags (Checkboxes)',
            'relation' => 'project.tag',
            'widget' => 'many2many_checkboxes',
        ]);
        $this->addField('tag_list', Field::MANY2MANY, [
            'string' => 'Tags (List)',
            'relation' => 'project.tag',
            'widget' => 'many2many',
        ]);

        $this->addField('activities', Field::MANY2MANY, [
            'string' => 'Activities',
            'relation' => 'project.tag',
            'widget' => 'activity_ids',
            'pivot' => 'activity_showcase',
        ]);

        // ═══════════════════════════════════════════════════════
        //  7. BINARY FAMILY
        // ═══════════════════════════════════════════════════════
        $this->addField('image_data', Field::BINARY, ['string' => 'Image', 'widget' => 'image']);
        $this->addField('document_data', Field::BINARY, ['string' => 'Document PDF', 'widget' => 'pdf_viewer']);
        $this->addField('signature_data', Field::BINARY, ['string' => 'Signature', 'widget' => 'signature']);
        $this->addField('binary_val', Field::BINARY, ['string' => 'Binary File', 'widget' => 'binary']);

        // ═══════════════════════════════════════════════════════
        //  8. COLOR / VISUAL WIDGETS
        // ═══════════════════════════════════════════════════════
        $this->addField('color', Field::CHAR, ['string' => 'Color Picker', 'widget' => 'color_picker']);
        $this->addField('color_idx', Field::INTEGER, ['string' => 'Color Index (0-11)', 'widget' => 'color']);

        // ═══════════════════════════════════════════════════════
        //  9. CODE / DATA WIDGETS
        // ═══════════════════════════════════════════════════════
        $this->addField('code_snippet', Field::TEXT, ['string' => 'Code (ACE)', 'widget' => 'ace', 'options' => ['mode' => 'python', 'filename' => '.env']]);
        $this->addField('json_data', Field::TEXT, ['string' => 'JSON Config', 'widget' => 'json']);
        $this->addField('domain_data', Field::CHAR, ['string' => 'Domain Filter', 'widget' => 'domain']);

        // ═══════════════════════════════════════════════════════
        //  10. META / SPECIAL WIDGETS
        // ═══════════════════════════════════════════════════════
        $this->addField('note_section', Field::TEXT, ['string' => 'Note Section', 'widget' => 'section_and_note', 'default' => '[SECTION]Important Notes']);
        $this->addField('stat_value', Field::INTEGER, ['string' => 'Stat Count', 'widget' => 'stat_info', 'default' => 42]);

        // ═══════════════════════════════════════════════════════
        //  11. REFERENCE FIELD (dynamic FK)
        // ═══════════════════════════════════════════════════════
        $this->addField('ref_model', Field::REFERENCE, [
            'string' => 'Reference',
            'referenceSelection' => [
                ['task', 'Task'],
                ['project', 'Project'],
                ['res.users', 'User'],
            ],
        ]);

        // ═══════════════════════════════════════════════════════
        //  12. RELATED / COMPUTED FIELDS
        // ═══════════════════════════════════════════════════════
        $this->addField('user_name', Field::RELATED, [
            'string' => 'User Name (Related)',
            'relatedField' => 'user_id.name',
            'store' => false,
            'readonly' => true,
        ]);
        $this->addField('full_title', Field::COMPUTED, [
            'string' => 'Full Title (Computed)',
            'compute' => 'computeFullTitle',
            'depends' => ['name', 'status'],
            'store' => false,
            'readonly' => true,
        ]);
    }

    /** @api.depends('name', 'status') */
    public function computeFullTitle($record, $data): string
    {
        $name = $record->name ?? '';
        $status = $record->status ?? 'draft';
        return "[{$status}] {$name}";
    }

    protected function defineViews(): void
    {
        $this->listView = [
            'type' => 'list',
            'fields' => [
                'name', 'email', 'status', 'priority', 'price', 'progress',
                'user_id', 'is_favorite', 'is_active',
                'color_idx', 'pct_pie', 'char_badge_demo', 'badge_sel',
                'deadline', 'countdown_time', 'json_data', 'activities',
                'monetary_full', 'int_badge', 'lbl_sel', 'sel_badge',
            ],
        ];

        $this->formView = [
            'type' => 'form',
            'title' => 'name',
            'statusbar' => 'status',
            'header_buttons' => [
                ['name' => 'dummy_action', 'string' => 'Print Badge', 'type' => 'object', 'class' => 'ls-btn-primary'],
                ['name' => 'dummy_action2', 'string' => 'Cancel', 'type' => 'object'],
            ],
            'stat_buttons' => [
                ['name' => 'stat_views', 'string' => 'Views', 'icon' => 'fa-eye', 'field' => 'stat_value'],
                ['name' => 'stat_progress', 'string' => 'Progress %', 'icon' => 'fa-percent', 'field' => 'progress'],
            ],
            'chatter' => true,
            'groups' => [
                // ── Group 1: Basic Info ──
                [
                    'string' => 'Basic Information',
                    'columns' => [
                        [
                            'name',
                            'email',
                            'website',
                            'phone',
                            'clipboard_text',
                            'emoji_text',
                        ],
                        [
                            'age',
                            'score',
                            'price',
                            'progress',
                            'percent_val',
                            'time_val',
                        ],
                    ],
                ],
                // ── Group 2: Dates & Times ──
                [
                    'string' => 'Dates & Times',
                    'columns' => [
                        [
                            'start_date',
                            'end_date',
                            'date_range',
                        ],
                        [
                            'deadline',
                            'datetime_val',
                            'countdown_time',
                        ],
                    ],
                ],
                // ── Group 3: Boolean & Selection ──
                [
                    'string' => 'Boolean & Selections',
                    'columns' => [
                        [
                            'is_active',
                            'is_favorite',
                            'bool_btn',
                            'is_checked',
                            'radio_sel',
                        ],
                        [
                            'priority',
                            'badge_sel',
                            'sel_badge',
                            'lbl_sel',
                        ],
                    ],
                ],
                // ── Group 4: Numeric Widgets ──
                [
                    'string' => 'Numeric & Display Widgets',
                    'columns' => [
                        [
                            'factor_float',
                            'toggle_float',
                            'int_badge',
                            'handle_val',
                            'pct_pie',
                        ],
                        [
                            'currency_code',
                            'monetary_full',
                            'stat_value',
                            'char_badge_demo',
                            'image_url',
                        ],
                    ],
                ],
                // ── Group 5: Relations ──
                [
                    'string' => 'Relational Fields',
                    'columns' => [
                        [
                            'user_id',
                            'barcode_user',
                            'manager_id',
                            'user_name',       // Related field
                            'full_title',      // Computed field
                            'ref_model',       // Reference field
                        ],
                        [
                            'tags',
                            'tag_checkboxes',
                            'tag_list',
                            'activities',
                        ],
                    ],
                ],
                // ── Group 6: Visual & Color ──
                [
                    'string' => 'Visual & Color Widgets',
                    'columns' => [
                        [
                            'color',
                            'color_idx',
                            'image_data',
                        ],
                        [
                            'signature_data',
                            'document_data',
                            'binary_val',
                        ],
                    ],
                ],
                // ── Group 7: Code & Config ──
                [
                    'string' => 'Code & Configuration',
                    'columns' => [
                        [
                            'code_snippet',
                        ],
                        [
                            'json_data',
                            'domain_data',
                        ],
                    ],
                ],
            ],
            'tabs' => [
                ['name' => 'description', 'label' => 'Description', 'type' => 'field', 'field' => 'description'],
                ['name' => 'html', 'label' => 'HTML Content', 'type' => 'field', 'field' => 'html_content'],
                ['name' => 'code', 'label' => 'Code Snippet', 'type' => 'field', 'field' => 'code_snippet'],
                ['name' => 'json', 'label' => 'JSON Config', 'type' => 'field', 'field' => 'json_data'],
                ['name' => 'notes', 'label' => 'Notes', 'type' => 'field', 'field' => 'note_section'],
                ['name' => 'image_full', 'label' => 'Image Full', 'type' => 'field', 'field' => 'image_data'],
            ],
        ];

        $this->searchView = [
            'filters' => [
                ['name' => 'Active', 'domain' => ['is_active', '=', true]],
                ['name' => 'Favorites', 'domain' => ['is_favorite', '=', true]],
                ['name' => 'Draft', 'domain' => ['status', '=', 'draft']],
                ['name' => 'Published', 'domain' => ['status', '=', 'published']],
            ],
            'group_by' => [
                ['name' => 'Status', 'context' => ['group_by' => 'status']],
                ['name' => 'User', 'context' => ['group_by' => 'user_id']],
                ['name' => 'Priority', 'context' => ['group_by' => 'priority']],
            ],
        ];
    }

    public function dummy_action($recordId, $context = [])
    {
        return [
            'type' => 'ir.actions.client',
            'tag' => 'display_notification',
            'params' => [
                'title' => 'Success',
                'message' => 'Badge printed successfully!',
                'type' => 'success',
            ],
        ];
    }

    public function dummy_action2($recordId, $context = [])
    {
        return [
            'type' => 'ir.actions.client',
            'tag' => 'display_notification',
            'params' => [
                'title' => 'Cancelled',
                'message' => 'Action cancelled.',
                'type' => 'warning',
            ],
        ];
    }
}
