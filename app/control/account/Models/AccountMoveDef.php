<?php

namespace Addons\Account\Models;

use App\Model\Account\AccountMove;
use App\Advsoft\{ModelDefinition, Field, Registry};
use App\Advsoft\Core\Support\Log;

/**
 * AccountMoveDef — Journal Entries / Invoices
 *
 * The core accounting document. Implements:
 *   - Double-entry bookkeeping with inline lines (One2Many)
 *   - State machine: draft → posted → cancel
 *   - Auto-sequence numbering (INV/2026/06/0001)
 *   - Amount computation (untaxed, tax, total, residual)
 *   - Integration-ready for Sale, Purchase, Inventory, HR modules
 */
class AccountMoveDef extends ModelDefinition
{
    public string $_name = 'account.move';
    public string $_description = 'Jurnal Entry';
    public string $_table = 'account_move';
    public string $_order = 'date desc, id desc';
    public string $_rec_name = 'name';
    public string $modelClass = AccountMove::class;

    // ── Field Definitions ────────────────────────────

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, [
            'string'     => 'Nomor',
            'required'   => true,
            'default'    => '/',
            'readonly'   => true,
            'searchable' => true,
            'sortable'   => true,
            'help'       => 'Nomor auto-generated saat posting',
        ]);

        $this->addField('move_type', Field::SELECTION, [
            'string'    => 'Tipe',
            'required'  => true,
            'selection' => [
                ['entry', 'Jurnal Entry'],
                ['out_invoice', 'Customer Invoice'],
                ['out_refund', 'Credit Note'],
                ['in_invoice', 'Vendor Bill'],
                ['in_refund', 'Vendor Credit Note'],
            ],
            'default'   => 'entry',
            'groupable' => true,
            'searchable' => true,
        ]);

        $this->addField('journal_id', Field::MANY2ONE, [
            'string'        => 'Jurnal',
            'relation'      => 'account.journal',
            'required'      => true,
            'searchable'    => true,
            'sortable'      => true,
            'groupable'     => true,
            'displayFields' => ['id', 'name', 'code', 'type'],
        ]);

        $this->addField('partner_id', Field::MANY2ONE, [
            'string'     => 'Partner',
            'relation'   => 'res.partner',
            'searchable' => true,
            'sortable'   => true,
            'groupable'  => true,
        ]);

        $this->addField('date', Field::DATE, [
            'string'     => 'Tanggal Akuntansi',
            'required'   => true,
            'sortable'   => true,
            'searchable' => true,
        ]);

        $this->addField('invoice_date', Field::DATE, [
            'string'   => 'Tanggal Invoice',
            'sortable' => true,
        ]);

        $this->addField('invoice_date_due', Field::DATE, [
            'string'   => 'Jatuh Tempo',
            'sortable' => true,
        ]);

        $this->addField('ref', Field::CHAR, [
            'string'     => 'Referensi',
            'searchable' => true,
            'help'       => 'Nomor referensi eksternal',
        ]);

        $this->addField('narration', Field::TEXT, [
            'string' => 'Catatan Internal',
        ]);

        $this->addField('state', Field::SELECTION, [
            'string'    => 'Status',
            'selection' => [
                ['draft', 'Draft'],
                ['posted', 'Posted'],
                ['cancel', 'Cancelled'],
            ],
            'default'   => 'draft',
            'readonly'  => true,
            'groupable' => true,
            'searchable' => true,
        ]);

        // ── Monetary Fields ──────────────────────────
        $this->addField('amount_untaxed', Field::MONETARY, [
            'string'        => 'Subtotal',
            'readonly'      => true,
            'currencyField' => 'currency_code',
            'currencySymbol' => 'Rp',
            'digits'        => [16, 2],
        ]);

        $this->addField('amount_tax', Field::MONETARY, [
            'string'        => 'Pajak',
            'readonly'      => true,
            'currencyField' => 'currency_code',
            'currencySymbol' => 'Rp',
            'digits'        => [16, 2],
        ]);

        $this->addField('amount_total', Field::MONETARY, [
            'string'        => 'Total',
            'readonly'      => true,
            'currencyField' => 'currency_code',
            'currencySymbol' => 'Rp',
            'digits'        => [16, 2],
        ]);

        $this->addField('amount_residual', Field::MONETARY, [
            'string'        => 'Sisa Bayar',
            'readonly'      => true,
            'currencyField' => 'currency_code',
            'currencySymbol' => 'Rp',
            'digits'        => [16, 2],
        ]);

        $this->addField('payment_state', Field::SELECTION, [
            'string'    => 'Status Pembayaran',
            'selection' => [
                ['not_paid', 'Belum Dibayar'],
                ['partial', 'Dibayar Sebagian'],
                ['paid', 'Lunas'],
                ['reversed', 'Reversed'],
                ['in_payment', 'Dalam Proses'],
            ],
            'default'   => 'not_paid',
            'readonly'  => true,
            'groupable' => true,
        ]);

        $this->addField('currency_code', Field::CHAR, [
            'string'  => 'Mata Uang',
            'default' => 'IDR',
            'size'    => 8,
        ]);

        $this->addField('company_id', Field::MANY2ONE, [
            'string'   => 'Perusahaan',
            'relation' => 'res.company',
        ]);

        // ── One2Many: Journal Lines ──────────────────
        $this->addField('line_ids', Field::ONE2MANY, [
            'string'       => 'Baris Jurnal',
            'relation'     => 'account.move.line',
            'inverseField' => 'move_id',
        ]);

        // Invisible sequence fields for auto-numbering
        $this->addField('sequence_prefix', Field::CHAR, [
            'string'    => 'Sequence Prefix',
            'invisible' => true,
        ]);
        $this->addField('sequence_number', Field::INTEGER, [
            'string'    => 'Sequence Number',
            'invisible' => true,
        ]);
        $this->addField('posted_before', Field::BOOLEAN, [
            'string'    => 'Posted Before',
            'invisible' => true,
        ]);
    }

    // ── View Definitions ─────────────────────────────

    protected function defineViews(): void
    {
        // ═══════════ List View ═══════════
        $this->listView = [
            'string'        => 'Jurnal Entry',
            'default_order' => 'date desc, id desc',
            'limit'         => 80,
            'fields'        => [
                'name',
                'date',
                'move_type',
                'journal_id',
                'partner_id',
                'ref',
                'amount_total',
                'payment_state',
                'state',
            ],
            'column_config' => [
                'name' => ['width' => '180px'],
                'state' => ['widget' => 'badge'],
                'payment_state' => ['widget' => 'badge'],
                'move_type' => ['widget' => 'badge'],
                'amount_total' => [
                    'sum' => 'Total',
                    'widget' => 'monetary',
                ],
            ],
            'decoration' => [
                'decoration-info'    => "state == 'draft'",
                'decoration-success' => "payment_state == 'paid'",
                'decoration-danger'  => "payment_state == 'not_paid' and state == 'posted'",
                'decoration-muted'   => "state == 'cancel'",
            ],
            'header_buttons' => [
                [
                    'name'    => 'action_post',
                    'type'    => 'object',
                    'string'  => 'Post',
                    'class'   => 'ls-btn-primary',
                    'icon'    => 'check-circle',
                    'confirm' => 'Post selected entries?',
                ],
            ],
        ];

        // ═══════════ Form View ═══════════
        $this->formView = [
            'string' => 'Jurnal Entry',
            'title'  => 'name',

            // Statusbar
            'statusbar'           => 'state',
            'statusbar_clickable' => false,

            // Header buttons with state-based visibility
            'header_buttons' => [
                [
                    'name'      => 'action_post',
                    'type'      => 'object',
                    'string'    => 'Confirm',
                    'class'     => 'ls-btn-primary',
                    'icon'      => 'check',
                    'invisible' => "state != 'draft'",
                ],
                [
                    'name'      => 'action_draft',
                    'type'      => 'object',
                    'string'    => 'Reset to Draft',
                    'class'     => 'ls-btn-secondary',
                    'invisible' => "state != 'cancel'",
                ],
                [
                    'name'      => 'action_cancel',
                    'type'      => 'object',
                    'string'    => 'Cancel Entry',
                    'class'     => 'ls-btn-danger',
                    'confirm'   => 'Are you sure you want to cancel this entry?',
                    'invisible' => "state != 'posted' and state != 'draft'",
                ],
                [
                    'name'      => 'action_register_payment',
                    'type'      => 'object',
                    'string'    => 'Register Payment',
                    'class'     => 'ls-btn-success',
                    'icon'      => 'dollar-sign',
                    'invisible' => "state != 'posted' or payment_state == 'paid' or move_type == 'entry'",
                ],
            ],

            // Stat buttons
            'stat_buttons' => [
                [
                    'name'   => 'action_view_payments',
                    'string' => 'Pembayaran',
                    'icon'   => 'credit-card',
                    'field'  => 'amount_residual',
                ],
            ],

            // Form groups
            'groups' => [
                [
                    'string'  => null,
                    'col'     => 2,
                    'columns' => [
                        [
                            ['name' => 'move_type', 'attrs' => ['readonly' => "state != 'draft'"]],
                            ['name' => 'journal_id', 'attrs' => ['readonly' => "state == 'posted'"]],
                            'partner_id',
                            'ref',
                        ],
                        [
                            'date',
                            'invoice_date',
                            'invoice_date_due',
                            'currency_code',
                        ],
                    ],
                ],
            ],

            // Notebook tabs
            'tabs' => [
                // Tab 1: Journal Lines (One2Many inline editable)
                [
                    'name'     => 'line_ids',
                    'label'    => 'Baris Jurnal',
                    'type'     => 'one2many',
                    'field'    => 'line_ids',
                    'editable' => 'bottom',
                    'sequence_field' => 'sequence',
                    'tree_fields' => [
                        'sequence',
                        'account_id',
                        'partner_id',
                        'name',
                        'debit',
                        'credit',
                        'tax_line_id',
                    ],
                    'tree_column_config' => [
                        'debit' => [
                            'sum' => 'Total Debit',
                            'widget' => 'monetary',
                        ],
                        'credit' => [
                            'sum' => 'Total Kredit',
                            'widget' => 'monetary',
                        ],
                        'sequence' => [
                            'width' => '60px',
                            'optional' => 'hide',
                        ],
                    ],
                    'tree_field_attrs' => [
                        'account_id' => ['required' => true],
                    ],
                    'decoration' => [
                        'decoration-info' => "debit > 0",
                    ],
                    // ── AdvSoft parity: debit/credit mutual exclusion ──
                    'exclusive_fields' => [
                        ['debit', 'credit'],
                    ],
                    // ── Lock lines when entry is posted (Gap 6) ──
                    'readonly_when' => "state == 'posted' or state == 'cancel'",
                    // ── Propagate parent fields to new lines (Gap 7) ──
                    'propagate_fields' => ['partner_id', 'date', 'currency_code'],
                ],

                // Tab 2: Monetary Summary
                [
                    'name'  => 'amounts',
                    'label' => 'Ringkasan',
                    'type'  => 'group',
                    'groups_content' => [
                        [
                            'string'  => 'Total',
                            'col'     => 2,
                            'columns' => [
                                ['amount_untaxed', 'amount_tax'],
                                ['amount_total', 'amount_residual', 'payment_state'],
                            ],
                        ],
                    ],
                ],

                // Tab 3: Notes
                [
                    'name'  => 'narration',
                    'label' => 'Catatan',
                    'type'  => 'field',
                    'field' => 'narration',
                ],
            ],
        ];

        // ═══════════ Search View ═══════════
        $this->searchView = [
            'filters' => [
                ['id' => 'draft', 'label' => 'Draft', 'domain' => [['state', '=', 'draft']]],
                ['id' => 'posted', 'label' => 'Posted', 'domain' => [['state', '=', 'posted']]],
                ['id' => 'invoices', 'label' => 'Invoices', 'domain' => [['move_type', 'in', ['out_invoice', 'in_invoice']]]],
                ['id' => 'customer_inv', 'label' => 'Customer Invoice', 'domain' => [['move_type', '=', 'out_invoice']]],
                ['id' => 'vendor_bill', 'label' => 'Vendor Bill', 'domain' => [['move_type', '=', 'in_invoice']]],
                ['id' => 'entries', 'label' => 'Journal Entry', 'domain' => [['move_type', '=', 'entry']]],
                ['id' => 'unpaid', 'label' => 'Belum Dibayar', 'domain' => [['payment_state', '=', 'not_paid'], ['state', '=', 'posted']]],
                ['id' => 'overdue', 'label' => 'Jatuh Tempo', 'domain_func' => 'getOverdueDomain'],
            ],
            'group_by' => [
                ['field' => 'journal_id', 'label' => 'Jurnal'],
                ['field' => 'partner_id', 'label' => 'Partner'],
                ['field' => 'move_type', 'label' => 'Tipe'],
                ['field' => 'state', 'label' => 'Status'],
                ['field' => 'payment_state', 'label' => 'Status Bayar'],
            ],
            'searchpanel' => [
                ['field' => 'journal_id', 'type' => 'many2one', 'label' => 'Jurnal', 'icon' => 'book'],
                ['field' => 'move_type', 'type' => 'selection', 'label' => 'Tipe Dokumen', 'icon' => 'file-text'],
                // TAMBAHAN BARU search panel kiri
                ['field' => 'state', 'type' => 'selection', 'label' => 'Status', 'icon' => 'activity'],
            ],
            'custom_filter_fields' => ['name', 'ref', 'partner_id', 'date', 'amount_total', 'state'],
        ];

        // ═══════════ Graph View ═══════════
        $this->graphView = [
            'type'    => 'bar',
            'measure' => 'amount_total',
            'groupby' => ['journal_id'],
        ];

        // ═══════════ Pivot View ═══════════
        $this->pivotView = [
            'row_groupby' => ['partner_id'],
            'col_groupby' => ['move_type'],
            'measures'     => ['amount_total', 'amount_residual'],
        ];
    }

    // ── Security ─────────────────────────────────────

    protected function defineSecurity(): void
    {
        $this->setAccess(['read' => true, 'write' => true, 'create' => true, 'unlink' => true]);
        $this->addAccessRule('account_manager', ['read', 'write', 'create', 'unlink']);
        $this->addAccessRule('account_user', ['read', 'write', 'create']);
    }

    // ── Business Logic ───────────────────────────────

    protected function defineBusinessLogic(): void
    {
        $this->apiConstrains('checkBalanced', ['line_ids']);
        $this->apiOnchange('onchangeJournal', ['journal_id']);
        $this->apiOnchange('onchangeMoveType', ['move_type']);
        $this->apiOnchange('onchangePartner', ['partner_id']);
        $this->apiModel('_default_get');
    }

    // ── Constraints ──────────────────────────────────

    /** @api.constrains('line_ids') — Validate debit == credit */
    public function checkBalanced(object $record, array $values): ?string
    {
        if ($record instanceof AccountMove && $record->state === 'posted') {
            if (!$record->isBalanced()) {
                return 'Total Debit harus sama dengan Total Kredit.';
            }
        }
        return null;
    }

    // ── Onchange ─────────────────────────────────────

    /** @api.onchange('journal_id') */
    public function onchangeJournal(string $field, array $values): array
    {
        if (!empty($values['journal_id'])) {
            $journalDef = Registry::get('account.journal');
            if ($journalDef) {
                $journal = $journalDef->modelClass::find($values['journal_id']);
                if ($journal) {
                    // Auto-set move_type based on journal type
                    if (empty($values['move_type']) || $values['move_type'] === 'entry') {
                        $values['move_type'] = match ($journal->type) {
                            'sale'     => 'out_invoice',
                            'purchase' => 'in_invoice',
                            default    => 'entry',
                        };
                    }
                }
            }
        }
        return $values;
    }

    /** @api.onchange('move_type') */
    public function onchangeMoveType(string $field, array $values): array
    {
        if (!empty($values['move_type'])) {
            // Auto-select appropriate journal
            $journalType = match ($values['move_type']) {
                'out_invoice', 'out_refund' => 'sale',
                'in_invoice', 'in_refund'   => 'purchase',
                default                     => 'general',
            };

            $journal = \App\Model\Account\AccountJournal::where('type', $journalType)->first();
            if ($journal) {
                $values['journal_id'] = $journal->id;
            }
        }
        return $values;
    }

    /** @api.onchange('partner_id') */
    public function onchangePartner(string $field, array $values): array
    {
        return $values;
    }

    /** @api.model — Default values */
    public function _default_get(array $defaults): array
    {
        $defaults['date'] = now()->format('Y-m-d');
        $defaults['state'] = 'draft';
        $defaults['currency_code'] = 'IDR';
        $defaults['move_type'] = 'entry';
        $defaults['name'] = '/';

        // Default journal (general)
        $journal = \App\Model\Account\AccountJournal::where('type', 'general')->first();
        if ($journal) {
            $defaults['journal_id'] = $journal->id;
        }

        return $defaults;
    }

    // ── Domain resolvers ─────────────────────────────

    public function getOverdueDomain(): array
    {
        return [
            ['invoice_date_due', '<', now()->format('Y-m-d')],
            ['payment_state', '!=', 'paid'],
            ['state', '=', 'posted'],
        ];
    }

    // ── Lifecycle Hooks ──────────────────────────────

    protected function beforeCreate(array &$vals): void
    {
        if (empty($vals['date'])) {
            $vals['date'] = now()->format('Y-m-d');
        }
    }

    protected function afterCreate(object $record, array $vals): void
    {
        Log::info("Account Move created: {$record->name} (ID: {$record->id})");
    }

    protected function beforeUnlink(object $record): ?string
    {
        if ($record->state === 'posted') {
            return 'Tidak bisa menghapus entry yang sudah diposting. Batalkan (Cancel) terlebih dahulu.';
        }
        // Cascade delete child lines (line_ids)
        \App\Model\Account\AccountMoveLine::where('move_id', '=', $record->id)->delete();
        return null;
    }

    // ── Action Methods ───────────────────────────────

    /** Post journal entry */
    public function action_post(object $record): array
    {
        if (!($record instanceof AccountMove)) {
            return ['error' => 'Invalid record type.'];
        }

        $result = $record->actionPost();

        if (isset($result['error'])) {
            return [
                'type' => 'ir.actions.client',
                'tag'  => 'display_notification',
                'params' => [
                    'title'   => 'Error',
                    'message' => $result['error'],
                    'type'    => 'danger',
                ],
            ];
        }

        return [
            'type' => 'ir.actions.client',
            'tag'  => 'display_notification',
            'params' => [
                'title'   => 'Entry Posted',
                'message' => $result['message'],
                'type'    => 'success',
            ],
        ];
    }

    /** Reset to draft */
    public function action_draft(object $record): array
    {
        if ($record instanceof AccountMove) {
            $record->actionDraft();
        }

        return [
            'type' => 'ir.actions.client',
            'tag'  => 'display_notification',
            'params' => [
                'title'   => 'Reset to Draft',
                'message' => "Entry '{$record->name}' reset to draft.",
                'type'    => 'info',
            ],
        ];
    }

    /** Cancel entry */
    public function action_cancel(object $record): array
    {
        if (!($record instanceof AccountMove)) {
            return ['error' => 'Invalid record type.'];
        }

        $result = $record->actionCancel();

        if (isset($result['error'])) {
            return [
                'type' => 'ir.actions.client',
                'tag'  => 'display_notification',
                'params' => [
                    'title'   => 'Error',
                    'message' => $result['error'],
                    'type'    => 'danger',
                ],
            ];
        }

        return [
            'type' => 'ir.actions.client',
            'tag'  => 'display_notification',
            'params' => [
                'title'   => 'Entry Cancelled',
                'message' => $result['message'],
                'type'    => 'warning',
            ],
        ];
    }

    /** Register payment (placeholder) */
    public function action_register_payment(object $record): array
    {
        return [
            'type' => 'ir.actions.client',
            'tag'  => 'display_notification',
            'params' => [
                'title'   => 'Register Payment',
                'message' => 'Payment registration dialog coming soon.',
                'type'    => 'info',
            ],
        ];
    }

    /** View linked payments */
    public function action_view_payments(object $record): array
    {
        return [
            'type' => 'ir.actions.client',
            'tag'  => 'display_notification',
            'params' => [
                'title'   => 'Payments',
                'message' => "Viewing payments for {$record->name}.",
                'type'    => 'info',
            ],
        ];
    }

    /** name_get */
    public function nameGet(object $record): string
    {
        $name = $record->name ?? '/';
        return $name === '/' ? "Draft Entry #{$record->id}" : $name;
    }
}
