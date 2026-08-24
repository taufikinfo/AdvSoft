<?php

namespace Addons\Account\Models;

use App\Model\Account\AccountAccount;
use App\Advsoft\{ModelDefinition, Field};

/**
 * AccountAccountDef — Chart of Accounts (Bagan Akun / CoA)
 *
 * Configurable, dynamic CoA following SAK Indonesia standards.
 * Account types map to financial report positions.
 */
class AccountAccountDef extends ModelDefinition
{
    public string $_name = 'account.account';
    public string $_description = 'Chart of Accounts';
    public string $_table = 'account_account';
    public string $_order = 'code asc';
    public string $_rec_name = 'name';
    public string $modelClass = AccountAccount::class;

    protected function defineFields(): void
    {
        $this->addField('code', Field::CHAR, [
            'string'     => 'Kode Akun',
            'required'   => true,
            'size'       => 20,
            'searchable' => true,
            'sortable'   => true,
        ]);

        $this->addField('name', Field::CHAR, [
            'string'     => 'Nama Akun',
            'required'   => true,
            'searchable' => true,
            'sortable'   => true,
        ]);

        $this->addField('account_type', Field::SELECTION, [
            'string'    => 'Tipe Akun',
            'required'  => true,
            'selection' => [
                // Aset
                ['asset_receivable', 'Piutang'],
                ['asset_cash', 'Kas & Bank'],
                ['asset_current', 'Aset Lancar'],
                ['asset_non_current', 'Aset Tidak Lancar'],
                ['asset_prepayments', 'Beban Dibayar Dimuka'],
                ['asset_fixed', 'Aset Tetap'],
                // Liabilitas
                ['liability_payable', 'Hutang'],
                ['liability_credit_card', 'Kartu Kredit'],
                ['liability_current', 'Liabilitas Lancar'],
                ['liability_non_current', 'Liabilitas Jangka Panjang'],
                // Ekuitas
                ['equity', 'Ekuitas'],
                ['equity_unaffected', 'Laba Ditahan'],
                // Pendapatan & Beban
                ['income', 'Pendapatan'],
                ['income_other', 'Pendapatan Lain-lain'],
                ['expense', 'Beban'],
                ['expense_depreciation', 'Depresiasi'],
                ['expense_direct_cost', 'Harga Pokok Penjualan'],
                // Off-balance
                ['off_balance', 'Off-Balance Sheet'],
            ],
            'groupable'  => true,
            'searchable' => true,
        ]);

        $this->addField('group_name', Field::CHAR, [
            'string'    => 'Grup Akun',
            'help'      => 'Pengelompokan untuk laporan keuangan',
            'groupable' => true,
        ]);

        $this->addField('reconcile', Field::BOOLEAN, [
            'string'  => 'Rekonsiliasi',
            'default' => false,
            'help'    => 'Aktifkan untuk akun piutang/hutang yang butuh rekonsiliasi',
        ]);

        $this->addField('deprecated', Field::BOOLEAN, [
            'string'  => 'Tidak Aktif',
            'default' => false,
            'help'    => 'Akun yang sudah tidak digunakan',
        ]);

        $this->addField('currency_code', Field::CHAR, [
            'string' => 'Mata Uang',
            'size'   => 8,
            'help'   => 'Override mata uang (kosong = mata uang perusahaan)',
        ]);

        $this->addField('company_id', Field::MANY2ONE, [
            'string'   => 'Perusahaan',
            'relation' => 'res.company',
        ]);

        $this->addField('note', Field::TEXT, [
            'string' => 'Catatan',
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
            'string'        => 'Bagan Akun',
            'default_order' => 'code asc',
            'limit'         => 200,
            'fields'        => ['code', 'name', 'account_type', 'group_name', 'reconcile', 'deprecated'],
            'column_config' => [
                'code' => ['width' => '120px'],
                'account_type' => ['widget' => 'badge'],
                'reconcile' => ['widget' => 'boolean_toggle'],
                'deprecated' => ['optional' => 'hide'],
            ],
            'decoration' => [
                'decoration-muted' => 'deprecated == true',
            ],
        ];

        // ═══════════ Form View ═══════════
        $this->formView = [
            'string' => 'Akun',
            'title'  => 'name',
            'groups' => [
                [
                    'string'  => null,
                    'col'     => 2,
                    'columns' => [
                        ['code', 'name', 'account_type', 'group_name'],
                        ['reconcile', 'deprecated', 'currency_code', 'company_id'],
                    ],
                ],
            ],
            'tabs' => [
                ['name' => 'note', 'label' => 'Catatan', 'type' => 'field', 'field' => 'note'],
            ],
        ];

        // ═══════════ Search View ═══════════
        $this->searchView = [
            'filters' => [
                ['id' => 'receivable', 'label' => 'Piutang', 'domain' => [['account_type', '=', 'asset_receivable']]],
                ['id' => 'payable', 'label' => 'Hutang', 'domain' => [['account_type', '=', 'liability_payable']]],
                ['id' => 'revenue', 'label' => 'Pendapatan', 'domain' => [['account_type', '=', 'income']]],
                ['id' => 'expense', 'label' => 'Beban', 'domain' => [['account_type', '=', 'expense']]],
                ['id' => 'bank_cash', 'label' => 'Kas & Bank', 'domain' => [['account_type', '=', 'asset_cash']]],
            ],
            'group_by' => [
                ['field' => 'account_type', 'label' => 'Tipe Akun'],
                ['field' => 'group_name', 'label' => 'Grup'],
            ],
            'custom_filter_fields' => ['code', 'name', 'account_type', 'group_name'],
        ];
    }

    protected function defineSecurity(): void
    {
        $this->setAccess(['read' => true, 'write' => true, 'create' => true, 'unlink' => true]);
        $this->addAccessRule('account_manager', ['read', 'write', 'create', 'unlink']);
        $this->addAccessRule('account_user', ['read']);
    }

    /** name_get — Custom display name: "[CODE] Name" */
    public function nameGet(object $record): string
    {
        return "[{$record->code}] {$record->name}";
    }
}
