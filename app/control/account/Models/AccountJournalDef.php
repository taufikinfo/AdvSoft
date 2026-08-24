<?php

namespace Addons\Account\Models;

use App\Model\Account\AccountJournal;
use App\Odoo\{ModelDefinition, Field};

/**
 * AccountJournalDef — Accounting Journals
 *
 * Journal types: sale, purchase, bank, cash, general.
 * Each journal generates its own sequence for move names.
 */
class AccountJournalDef extends ModelDefinition
{
    public string $_name = 'account.journal';
    public string $_description = 'Jurnal Akuntansi';
    public string $_table = 'account_journal';
    public string $_order = 'sequence asc, id asc';
    public string $_rec_name = 'name';
    public string $modelClass = AccountJournal::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, [
            'string'     => 'Nama Jurnal',
            'required'   => true,
            'searchable' => true,
            'sortable'   => true,
        ]);

        $this->addField('code', Field::CHAR, [
            'string'   => 'Kode',
            'required' => true,
            'size'     => 5,
            'help'     => 'Kode singkat jurnal (maks 5 karakter)',
        ]);

        $this->addField('type', Field::SELECTION, [
            'string'    => 'Tipe',
            'required'  => true,
            'selection' => [
                ['sale', 'Penjualan'],
                ['purchase', 'Pembelian'],
                ['bank', 'Bank'],
                ['cash', 'Kas'],
                ['general', 'Umum'],
            ],
            'groupable' => true,
        ]);

        $this->addField('default_account_id', Field::MANY2ONE, [
            'string'   => 'Akun Default',
            'relation' => 'account.account',
            'help'     => 'Akun default untuk transaksi di jurnal ini',
        ]);

        $this->addField('company_id', Field::MANY2ONE, [
            'string'   => 'Perusahaan',
            'relation' => 'res.company',
        ]);

        $this->addField('currency_code', Field::CHAR, [
            'string' => 'Mata Uang',
            'size'   => 8,
        ]);

        $this->addField('restrict_mode_hash_table', Field::BOOLEAN, [
            'string'  => 'Lock Posted Entries',
            'default' => false,
            'help'    => 'Jika aktif, entri yang sudah diposting tidak bisa diedit',
        ]);

        $this->addField('bank_account_number', Field::CHAR, [
            'string' => 'No. Rekening',
            'size'   => 64,
        ]);

        $this->addField('bank_name', Field::CHAR, [
            'string' => 'Nama Bank',
            'size'   => 100,
        ]);

        $this->addField('sequence', Field::INTEGER, [
            'string'  => 'Urutan',
            'default' => 10,
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
            'string'        => 'Jurnal Akuntansi',
            'default_order' => 'sequence asc',
            'fields'        => ['name', 'code', 'type', 'default_account_id'],
            'column_config' => [
                'type' => ['widget' => 'badge'],
                'code' => ['width' => '80px'],
            ],
        ];

        // ═══════════ Form View ═══════════
        $this->formView = [
            'string' => 'Jurnal',
            'title'  => 'name',
            'groups' => [
                [
                    'string'  => 'Informasi Jurnal',
                    'col'     => 2,
                    'columns' => [
                        ['name', 'code', 'type', 'default_account_id'],
                        ['company_id', 'currency_code', 'sequence', 'restrict_mode_hash_table'],
                    ],
                ],
                [
                    'string'  => 'Informasi Bank',
                    'col'     => 2,
                    'columns' => [
                        ['bank_name'],
                        ['bank_account_number'],
                    ],
                ],
            ],
        ];

        // ═══════════ Search View ═══════════
        $this->searchView = [
            'filters' => [
                ['id' => 'sale', 'label' => 'Penjualan', 'domain' => [['type', '=', 'sale']]],
                ['id' => 'purchase', 'label' => 'Pembelian', 'domain' => [['type', '=', 'purchase']]],
                ['id' => 'bank', 'label' => 'Bank', 'domain' => [['type', '=', 'bank']]],
                ['id' => 'cash', 'label' => 'Kas', 'domain' => [['type', '=', 'cash']]],
                ['id' => 'general', 'label' => 'Umum', 'domain' => [['type', '=', 'general']]],
            ],
            'group_by' => [
                ['field' => 'type', 'label' => 'Tipe'],
            ],
        ];
    }

    /** name_get — "[CODE] Name" */
    public function nameGet(object $record): string
    {
        return "{$record->name} ({$record->code})";
    }
}
