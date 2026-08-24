<?php

namespace Addons\Account\Models;

use App\Model\Account\AccountPayment;
use App\Advsoft\{ModelDefinition, Field};

/**
 * AccountPaymentDef — Payment Records
 *
 * Manages inbound (receive) and outbound (send) payments.
 * Each payment creates a corresponding account.move for journal entries.
 */
class AccountPaymentDef extends ModelDefinition
{
    public string $_name = 'account.payment';
    public string $_description = 'Pembayaran';
    public string $_table = 'account_payment';
    public string $_order = 'date desc, id desc';
    public string $_rec_name = 'payment_reference';
    public string $modelClass = AccountPayment::class;

    protected function defineFields(): void
    {
        $this->addField('payment_type', Field::SELECTION, [
            'string'    => 'Tipe Pembayaran',
            'required'  => true,
            'selection' => [
                ['inbound', 'Terima Uang'],
                ['outbound', 'Kirim Uang'],
            ],
            'groupable' => true,
        ]);

        $this->addField('partner_type', Field::SELECTION, [
            'string'    => 'Tipe Partner',
            'selection' => [
                ['customer', 'Pelanggan'],
                ['supplier', 'Vendor'],
            ],
            'groupable' => true,
        ]);

        $this->addField('partner_id', Field::MANY2ONE, [
            'string'     => 'Partner',
            'relation'   => 'res.partner',
            'searchable' => true,
            'sortable'   => true,
            'groupable'  => true,
        ]);

        $this->addField('amount', Field::MONETARY, [
            'string'        => 'Jumlah',
            'required'      => true,
            'digits'        => [16, 2],
            'currencyField' => 'currency_code',
            'currencySymbol' => 'Rp',
        ]);

        $this->addField('currency_code', Field::CHAR, [
            'string'  => 'Mata Uang',
            'default' => 'IDR',
            'size'    => 8,
        ]);

        $this->addField('journal_id', Field::MANY2ONE, [
            'string'   => 'Jurnal',
            'relation' => 'account.journal',
            'required' => true,
        ]);

        $this->addField('destination_account_id', Field::MANY2ONE, [
            'string'   => 'Akun Tujuan',
            'relation' => 'account.account',
        ]);

        $this->addField('move_id', Field::MANY2ONE, [
            'string'   => 'Jurnal Entry',
            'relation' => 'account.move',
            'readonly' => true,
        ]);

        $this->addField('payment_method', Field::SELECTION, [
            'string'    => 'Metode Bayar',
            'selection' => [
                ['manual', 'Manual'],
                ['check', 'Cek/Giro'],
                ['electronic', 'Transfer Elektronik'],
            ],
            'default' => 'manual',
        ]);

        $this->addField('payment_reference', Field::CHAR, [
            'string'     => 'Referensi',
            'searchable' => true,
            'help'       => 'Nomor referensi pembayaran',
        ]);

        $this->addField('date', Field::DATE, [
            'string'     => 'Tanggal',
            'required'   => true,
            'sortable'   => true,
            'searchable' => true,
        ]);

        $this->addField('state', Field::SELECTION, [
            'string'    => 'Status',
            'selection' => [
                ['draft', 'Draft'],
                ['posted', 'Posted'],
                ['cancelled', 'Dibatalkan'],
            ],
            'default'   => 'draft',
            'readonly'  => true,
            'groupable' => true,
        ]);

        $this->addField('is_reconciled', Field::BOOLEAN, [
            'string'   => 'Terrekonsiliasi',
            'default'  => false,
            'readonly' => true,
        ]);

        $this->addField('is_matched', Field::BOOLEAN, [
            'string'   => 'Matched',
            'default'  => false,
            'readonly' => true,
        ]);

        $this->addField('company_id', Field::MANY2ONE, [
            'string'   => 'Perusahaan',
            'relation' => 'res.company',
        ]);
    }

    protected function defineViews(): void
    {
        // ═══════════ List View ═══════════
        $this->listView = [
            'string'        => 'Pembayaran',
            'default_order' => 'date desc',
            'fields'        => [
                'date', 'payment_reference', 'partner_id', 'payment_type',
                'journal_id', 'amount', 'state',
            ],
            'column_config' => [
                'amount' => ['sum' => 'Total', 'widget' => 'monetary'],
                'state'  => ['widget' => 'badge'],
                'payment_type' => ['widget' => 'badge'],
            ],
            'decoration' => [
                'decoration-success' => "state == 'posted'",
                'decoration-muted'   => "state == 'cancelled'",
            ],
        ];

        // ═══════════ Form View ═══════════
        $this->formView = [
            'string' => 'Pembayaran',
            'title'  => 'payment_reference',

            'statusbar'           => 'state',
            'statusbar_clickable' => false,

            'header_buttons' => [
                [
                    'name'      => 'action_post_payment',
                    'type'      => 'object',
                    'string'    => 'Confirm',
                    'class'     => 'ls-btn-primary',
                    'invisible' => "state != 'draft'",
                ],
                [
                    'name'      => 'action_cancel_payment',
                    'type'      => 'object',
                    'string'    => 'Cancel',
                    'class'     => 'ls-btn-danger',
                    'invisible' => "state != 'posted'",
                ],
            ],

            'groups' => [
                [
                    'string'  => null,
                    'col'     => 2,
                    'columns' => [
                        ['payment_type', 'partner_type', 'partner_id', 'amount'],
                        ['journal_id', 'date', 'payment_method', 'payment_reference'],
                    ],
                ],
                [
                    'string'  => 'Informasi Akuntansi',
                    'col'     => 2,
                    'columns' => [
                        ['destination_account_id', 'move_id'],
                        ['is_reconciled', 'is_matched', 'currency_code'],
                    ],
                ],
            ],
        ];

        // ═══════════ Search View ═══════════
        $this->searchView = [
            'filters' => [
                ['id' => 'inbound', 'label' => 'Terima', 'domain' => [['payment_type', '=', 'inbound']]],
                ['id' => 'outbound', 'label' => 'Kirim', 'domain' => [['payment_type', '=', 'outbound']]],
                ['id' => 'customer', 'label' => 'Pelanggan', 'domain' => [['partner_type', '=', 'customer']]],
                ['id' => 'vendor', 'label' => 'Vendor', 'domain' => [['partner_type', '=', 'supplier']]],
            ],
            'group_by' => [
                ['field' => 'payment_type', 'label' => 'Tipe'],
                ['field' => 'journal_id', 'label' => 'Jurnal'],
                ['field' => 'partner_id', 'label' => 'Partner'],
                ['field' => 'state', 'label' => 'Status'],
            ],
        ];
    }

    // ── Actions ──────────────────────────────────────

    public function action_post_payment(object $record): array
    {
        $record->state = 'posted';
        $record->save();

        return [
            'type' => 'ir.actions.client',
            'tag'  => 'display_notification',
            'params' => [
                'title'   => 'Pembayaran Dikonfirmasi',
                'message' => "Pembayaran {$record->payment_reference} berhasil diposting.",
                'type'    => 'success',
            ],
        ];
    }

    public function action_cancel_payment(object $record): array
    {
        $record->state = 'cancelled';
        $record->save();

        return [
            'type' => 'ir.actions.client',
            'tag'  => 'display_notification',
            'params' => [
                'title'   => 'Pembayaran Dibatalkan',
                'message' => "Pembayaran {$record->payment_reference} dibatalkan.",
                'type'    => 'warning',
            ],
        ];
    }

    public function nameGet(object $record): string
    {
        return $record->payment_reference ?: "Payment #{$record->id}";
    }
}
