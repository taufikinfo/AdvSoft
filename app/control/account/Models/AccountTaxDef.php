<?php

namespace Addons\Account\Models;

use App\Model\Account\AccountTax;
use App\Odoo\{ModelDefinition, Field};

/**
 * AccountTaxDef — Tax Templates
 *
 * Indonesian taxes: PPN 11%, PPh 21/22/23/25/26/29/4(2).
 * Configurable amount types: percent, fixed, group, division.
 */
class AccountTaxDef extends ModelDefinition
{
    public string $_name = 'account.tax';
    public string $_description = 'Pajak';
    public string $_table = 'account_tax';
    public string $_order = 'sequence asc, id asc';
    public string $_rec_name = 'name';
    public string $modelClass = AccountTax::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, [
            'string'     => 'Nama Pajak',
            'required'   => true,
            'searchable' => true,
            'sortable'   => true,
        ]);

        $this->addField('amount_type', Field::SELECTION, [
            'string'    => 'Tipe Perhitungan',
            'required'  => true,
            'selection' => [
                ['percent', 'Persentase'],
                ['fixed', 'Nominal Tetap'],
                ['group', 'Grup Pajak'],
                ['division', 'Pembagian'],
            ],
            'default' => 'percent',
        ]);

        $this->addField('amount', Field::FLOAT, [
            'string'   => 'Tarif / Nominal',
            'required' => true,
            'digits'   => [16, 4],
            'help'     => 'Tarif pajak (misal: 11 untuk PPN 11%)',
        ]);

        $this->addField('type_tax_use', Field::SELECTION, [
            'string'    => 'Penggunaan',
            'selection' => [
                ['sale', 'Penjualan'],
                ['purchase', 'Pembelian'],
                ['none', 'Tidak Ada'],
            ],
            'default'   => 'sale',
            'groupable' => true,
        ]);

        $this->addField('price_include', Field::BOOLEAN, [
            'string'  => 'Termasuk Harga',
            'default' => false,
            'help'    => 'Jika aktif, harga sudah termasuk pajak',
        ]);

        $this->addField('include_base_amount', Field::BOOLEAN, [
            'string'  => 'Sertakan Dalam Dasar',
            'default' => false,
            'help'    => 'Jika aktif, nilai pajak dimasukkan ke dasar perhitungan pajak berikutnya',
        ]);

        $this->addField('account_id', Field::MANY2ONE, [
            'string'   => 'Akun Pajak',
            'relation' => 'account.account',
            'help'     => 'Akun untuk posting pajak penjualan',
        ]);

        $this->addField('refund_account_id', Field::MANY2ONE, [
            'string'   => 'Akun Retur',
            'relation' => 'account.account',
            'help'     => 'Akun untuk posting retur pajak',
        ]);

        $this->addField('tax_group_id', Field::INTEGER, [
            'string' => 'Grup Pajak',
            'help'   => 'Pengelompokan untuk pelaporan',
        ]);

        $this->addField('description', Field::CHAR, [
            'string' => 'Deskripsi Label',
            'size'   => 100,
            'help'   => 'Label yang muncul di invoice (misal: "PPN 11%")',
        ]);

        $this->addField('company_id', Field::MANY2ONE, [
            'string'   => 'Perusahaan',
            'relation' => 'res.company',
        ]);

        $this->addField('sequence', Field::INTEGER, [
            'string'  => 'Urutan',
            'default' => 1,
        ]);

        $this->addField('active', Field::BOOLEAN, [
            'string'    => 'Aktif',
            'default'   => true,
            'invisible' => true,
        ]);
    }

    protected function defineViews(): void
    {
        // ═══════════ List View ═══════════
        $this->listView = [
            'string'        => 'Pajak',
            'default_order' => 'sequence asc',
            'fields'        => ['name', 'amount_type', 'amount', 'type_tax_use', 'price_include', 'description'],
            'column_config' => [
                'amount_type'   => ['widget' => 'badge'],
                'type_tax_use'  => ['widget' => 'badge'],
                'price_include' => ['widget' => 'boolean_toggle'],
            ],
        ];

        // ═══════════ Form View ═══════════
        $this->formView = [
            'string' => 'Pajak',
            'title'  => 'name',
            'groups' => [
                [
                    'string'  => 'Definisi Pajak',
                    'col'     => 2,
                    'columns' => [
                        ['name', 'amount_type', 'amount', 'type_tax_use'],
                        ['price_include', 'include_base_amount', 'description', 'sequence'],
                    ],
                ],
                [
                    'string'  => 'Akun Pajak',
                    'col'     => 2,
                    'columns' => [
                        ['account_id'],
                        ['refund_account_id'],
                    ],
                ],
            ],
        ];

        // ═══════════ Search View ═══════════
        $this->searchView = [
            'filters' => [
                ['id' => 'sale_tax', 'label' => 'Pajak Penjualan', 'domain' => [['type_tax_use', '=', 'sale']]],
                ['id' => 'purchase_tax', 'label' => 'Pajak Pembelian', 'domain' => [['type_tax_use', '=', 'purchase']]],
            ],
            'group_by' => [
                ['field' => 'type_tax_use', 'label' => 'Penggunaan'],
                ['field' => 'amount_type', 'label' => 'Tipe'],
            ],
        ];
    }

    /** name_get — "Name (Amount%)" */
    public function nameGet(object $record): string
    {
        $suffix = match ($record->amount_type) {
            'percent'  => "{$record->amount}%",
            'fixed'    => "Rp " . number_format($record->amount, 0, ',', '.'),
            default    => (string) $record->amount,
        };
        return "{$record->name} ({$suffix})";
    }
}
