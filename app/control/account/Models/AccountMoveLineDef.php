<?php

namespace Addons\Account\Models;

use App\Models\Account\AccountMoveLine;
use App\Odoo\{ModelDefinition, Field, Registry};

/**
 * AccountMoveLineDef — Journal Entry Lines (Double-Entry)
 *
 * Each line represents one leg of a double-entry journal:
 *   Debit:  Piutang Usaha (1200)    11,100,000
 *   Credit: Pendapatan (4100)       10,000,000
 *   Credit: PPN Keluaran (2300)      1,100,000
 */
class AccountMoveLineDef extends ModelDefinition
{
    public string $_name = 'account.move.line';
    public string $_description = 'Baris Jurnal';
    public string $_table = 'account_move_line';
    public string $_order = 'sequence asc, id asc';
    public string $_rec_name = 'name';
    public string $modelClass = AccountMoveLine::class;

    protected function defineFields(): void
    {
        $this->addField('move_id', Field::MANY2ONE, [
            'string'   => 'Jurnal Entry',
            'relation' => 'account.move',
            'required' => true,
        ]);

        $this->addField('account_id', Field::MANY2ONE, [
            'string'        => 'Akun',
            'relation'      => 'account.account',
            'required'      => true,
            'searchable'    => true,
            'sortable'      => true,
            'groupable'     => true,
            'displayFields' => ['id', 'name', 'code'],
        ]);

        $this->addField('partner_id', Field::MANY2ONE, [
            'string'     => 'Partner',
            'relation'   => 'res.partner',
            'searchable' => true,
            'groupable'  => true,
        ]);

        $this->addField('name', Field::CHAR, [
            'string'     => 'Label',
            'searchable' => true,
            'help'       => 'Deskripsi baris jurnal',
        ]);

        $this->addField('debit', Field::MONETARY, [
            'string'        => 'Debit',
            'digits'        => [16, 2],
            'currencyField' => 'currency_code',
            'currencySymbol' => 'Rp',
            'sortable'      => true,
        ]);

        $this->addField('credit', Field::MONETARY, [
            'string'        => 'Kredit',
            'digits'        => [16, 2],
            'currencyField' => 'currency_code',
            'currencySymbol' => 'Rp',
            'sortable'      => true,
        ]);

        $this->addField('balance', Field::MONETARY, [
            'string'        => 'Saldo',
            'digits'        => [16, 2],
            'readonly'      => true,
            'currencyField' => 'currency_code',
            'currencySymbol' => 'Rp',
            'help'          => 'Debit - Kredit',
        ]);

        $this->addField('tax_line_id', Field::MANY2ONE, [
            'string'   => 'Pajak',
            'relation' => 'account.tax',
            'help'     => 'Pajak yang menghasilkan baris ini',
        ]);

        $this->addField('quantity', Field::FLOAT, [
            'string'  => 'Kuantitas',
            'digits'  => [16, 4],
            'default' => 1,
        ]);

        $this->addField('price_unit', Field::MONETARY, [
            'string'        => 'Harga Satuan',
            'digits'        => [16, 2],
            'currencyField' => 'currency_code',
            'currencySymbol' => 'Rp',
        ]);

        $this->addField('discount', Field::FLOAT, [
            'string' => 'Diskon (%)',
            'digits' => [5, 2],
            'help'   => 'Persentase diskon',
        ]);

        $this->addField('price_subtotal', Field::MONETARY, [
            'string'        => 'Subtotal',
            'readonly'      => true,
            'digits'        => [16, 2],
            'currencyField' => 'currency_code',
            'currencySymbol' => 'Rp',
        ]);

        $this->addField('price_total', Field::MONETARY, [
            'string'        => 'Total',
            'readonly'      => true,
            'digits'        => [16, 2],
            'currencyField' => 'currency_code',
            'currencySymbol' => 'Rp',
        ]);

        $this->addField('amount_currency', Field::MONETARY, [
            'string'        => 'Jumlah Valas',
            'digits'        => [16, 2],
            'currencyField' => 'currency_code',
            'currencySymbol' => 'Rp',
            'help'          => 'Jumlah dalam mata uang asing',
        ]);

        $this->addField('currency_code', Field::CHAR, [
            'string'  => 'Mata Uang',
            'default' => 'IDR',
            'size'    => 8,
        ]);

        $this->addField('reconciled', Field::BOOLEAN, [
            'string'   => 'Terrekonsiliasi',
            'default'  => false,
            'readonly' => true,
        ]);

        $this->addField('full_reconcile_id', Field::MANY2ONE, [
            'string'   => 'Rekonsiliasi',
            'relation' => 'account.full.reconcile',
            'readonly' => true,
        ]);

        $this->addField('date', Field::DATE, [
            'string'   => 'Tanggal',
            'sortable' => true,
        ]);

        $this->addField('date_maturity', Field::DATE, [
            'string'   => 'Jatuh Tempo',
            'sortable' => true,
        ]);

        $this->addField('sequence', Field::INTEGER, [
            'string'  => 'Urutan',
            'default' => 10,
        ]);
    }

    protected function defineViews(): void
    {
        // ═══════════ List View ═══════════
        $this->listView = [
            'string'        => 'Baris Jurnal',
            'default_order' => 'date desc, id desc',
            'limit'         => 100,
            'fields'        => [
                'date', 'move_id', 'account_id', 'partner_id', 'name',
                'debit', 'credit', 'balance', 'reconciled',
            ],
            'column_config' => [
                'debit'  => ['sum' => 'Total Debit', 'widget' => 'monetary'],
                'credit' => ['sum' => 'Total Kredit', 'widget' => 'monetary'],
                'balance' => ['sum' => 'Saldo', 'widget' => 'monetary'],
                'reconciled' => ['widget' => 'boolean_toggle'],
            ],
            'decoration' => [
                'decoration-info'    => 'debit > 0',
                'decoration-success' => 'reconciled == true',
            ],
        ];

        // ═══════════ Form View ═══════════
        $this->formView = [
            'string' => 'Detail Baris Jurnal',
            'title'  => 'name',
            'groups' => [
                [
                    'string'  => null,
                    'col'     => 2,
                    'columns' => [
                        ['move_id', 'account_id', 'partner_id', 'name', 'tax_line_id'],
                        ['debit', 'credit', 'balance', 'quantity', 'price_unit', 'discount'],
                    ],
                ],
                [
                    'string'  => 'Rekonsiliasi',
                    'col'     => 2,
                    'columns' => [
                        ['reconciled', 'full_reconcile_id'],
                        ['date', 'date_maturity'],
                    ],
                ],
            ],
        ];

        // ═══════════ Search View ═══════════
        $this->searchView = [
            'filters' => [
                ['id' => 'debit_lines', 'label' => 'Debit', 'domain' => [['debit', '>', 0]]],
                ['id' => 'credit_lines', 'label' => 'Kredit', 'domain' => [['credit', '>', 0]]],
                ['id' => 'unreconciled', 'label' => 'Belum Rekonsiliasi', 'domain' => [['reconciled', '=', false]]],
            ],
            'group_by' => [
                ['field' => 'account_id', 'label' => 'Akun'],
                ['field' => 'partner_id', 'label' => 'Partner'],
                ['field' => 'move_id', 'label' => 'Jurnal Entry'],
            ],
            'custom_filter_fields' => ['name', 'debit', 'credit', 'date', 'account_id'],
        ];

        // ═══════════ Pivot View ═══════════
        $this->pivotView = [
            'row_groupby' => ['account_id'],
            'col_groupby' => [],
            'measures'     => ['debit', 'credit', 'balance'],
        ];
    }

    protected function defineBusinessLogic(): void
    {
        $this->apiOnchange('onchangeDebitCredit', ['debit', 'credit']);
        $this->apiOnchange('onchangePrice', ['quantity', 'price_unit', 'discount']);
    }

    /** @api.onchange('debit', 'credit') — Zero out opposite when entering value */
    public function onchangeDebitCredit(string $field, array $values): array
    {
        if ($field === 'debit' && ($values['debit'] ?? 0) > 0) {
            $values['credit'] = 0;
        } elseif ($field === 'credit' && ($values['credit'] ?? 0) > 0) {
            $values['debit'] = 0;
        }
        $values['balance'] = ($values['debit'] ?? 0) - ($values['credit'] ?? 0);
        return $values;
    }

    /** @api.onchange('quantity', 'price_unit', 'discount') */
    public function onchangePrice(string $field, array $values): array
    {
        $qty = $values['quantity'] ?? 1;
        $price = $values['price_unit'] ?? 0;
        $discount = $values['discount'] ?? 0;

        $subtotal = $qty * $price * (1 - $discount / 100);
        $values['price_subtotal'] = round($subtotal, 2);
        $values['price_total'] = round($subtotal, 2);

        return $values;
    }

    /** name_get */
    public function nameGet(object $record): string
    {
        $label = $record->name ?: 'Line';
        $account = $record->relationLoaded('account') ? $record->account : null;
        if ($account) {
            return "[{$account->code}] {$label}";
        }
        return $label;
    }
}
