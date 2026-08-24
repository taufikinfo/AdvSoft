<?php

namespace Database\Seeders;

use App\Odoo\Core\Database\Seeder;
use App\Models\Account\{AccountAccount, AccountJournal, AccountTax, AccountMove, AccountMoveLine, AccountPayment};

/**
 * AccountingSeeder — Indonesian Localization (l10n_id)
 *
 * Seeds:
 *   1. Chart of Accounts (SAK Indonesia standard)
 *   2. Default Journals (Sale, Purchase, Bank, Cash, Miscellaneous)
 *   3. Tax templates (PPN 11%, PPh 21/22/23/25/26/4(2))
 *   4. Sample journal entries (capital, invoice, bill, payment)
 *
 * Account code structure (SAK):
 *   1xxx → Aset
 *   2xxx → Liabilitas
 *   3xxx → Ekuitas
 *   4xxx → Pendapatan
 *   5xxx → Harga Pokok Penjualan
 *   6xxx → Beban Operasional
 *   7xxx → Pendapatan Lain-lain
 *   8xxx → Beban Lain-lain
 */
class AccountingSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = $this->seedChartOfAccounts();
        $journals = $this->seedJournals($accounts);
        $this->seedTaxes($accounts);
        $this->seedSampleEntries($accounts, $journals);

        $this->command?->info('Accounting data seeded: '
            . AccountAccount::count() . ' accounts, '
            . AccountJournal::count() . ' journals, '
            . AccountTax::count() . ' taxes, '
            . AccountMove::count() . ' entries');
    }

    /**
     * Seed Indonesian Chart of Accounts (SAK standard).
     */
    private function seedChartOfAccounts(): array
    {
        $data = [
            // ── 1xxx: ASET ──────────────────────────────
            // Aset Lancar
            ['1110', 'Kas',                         'asset_cash',        'Aset Lancar',              false],
            ['1120', 'Bank BCA',                    'asset_cash',        'Aset Lancar',              false],
            ['1121', 'Bank Mandiri',                'asset_cash',        'Aset Lancar',              false],
            ['1122', 'Bank BNI',                    'asset_cash',        'Aset Lancar',              false],
            ['1130', 'Deposito Berjangka',          'asset_current',     'Aset Lancar',              false],
            ['1200', 'Piutang Usaha',               'asset_receivable',  'Aset Lancar',              true],
            ['1210', 'Piutang Belum Ditagih',       'asset_receivable',  'Aset Lancar',              true],
            ['1220', 'Cadangan Kerugian Piutang',   'asset_current',     'Aset Lancar',              false],
            ['1300', 'Persediaan Barang',           'asset_current',     'Aset Lancar',              false],
            ['1310', 'Persediaan Bahan Baku',       'asset_current',     'Aset Lancar',              false],
            ['1400', 'Beban Dibayar Dimuka',        'asset_prepayments', 'Aset Lancar',              false],
            ['1410', 'Uang Muka Pembelian',         'asset_prepayments', 'Aset Lancar',              false],
            ['1420', 'PPN Masukan',                 'asset_current',     'Aset Lancar',              false],
            ['1430', 'PPh Dibayar Dimuka',          'asset_current',     'Aset Lancar',              false],

            // Aset Tetap
            ['1500', 'Tanah',                       'asset_fixed',       'Aset Tetap',               false],
            ['1510', 'Bangunan',                    'asset_fixed',       'Aset Tetap',               false],
            ['1511', 'Akum. Penyusutan Bangunan',   'asset_fixed',       'Aset Tetap',               false],
            ['1520', 'Kendaraan',                   'asset_fixed',       'Aset Tetap',               false],
            ['1521', 'Akum. Penyusutan Kendaraan',  'asset_fixed',       'Aset Tetap',               false],
            ['1530', 'Peralatan Kantor',            'asset_fixed',       'Aset Tetap',               false],
            ['1531', 'Akum. Penyusutan Peralatan',  'asset_fixed',       'Aset Tetap',               false],
            ['1540', 'Perangkat Komputer',          'asset_fixed',       'Aset Tetap',               false],
            ['1541', 'Akum. Penyusutan Komputer',   'asset_fixed',       'Aset Tetap',               false],

            // Aset Tidak Lancar
            ['1600', 'Investasi Jangka Panjang',    'asset_non_current', 'Aset Tidak Lancar',        false],
            ['1700', 'Goodwill',                    'asset_non_current', 'Aset Tidak Lancar',        false],

            // ── 2xxx: LIABILITAS ────────────────────────
            ['2100', 'Hutang Usaha',                'liability_payable',     'Liabilitas Lancar',    true],
            ['2110', 'Hutang Lain-lain',            'liability_current',     'Liabilitas Lancar',    false],
            ['2200', 'Hutang Pajak',                'liability_current',     'Liabilitas Lancar',    false],
            ['2210', 'PPN Keluaran',                'liability_current',     'Liabilitas Lancar',    false],
            ['2220', 'PPh 21 Terutang',             'liability_current',     'Liabilitas Lancar',    false],
            ['2230', 'PPh 23 Terutang',             'liability_current',     'Liabilitas Lancar',    false],
            ['2240', 'PPh 25 Terutang',             'liability_current',     'Liabilitas Lancar',    false],
            ['2250', 'PPh 29 Terutang',             'liability_current',     'Liabilitas Lancar',    false],
            ['2260', 'PPh 4(2) Terutang',           'liability_current',     'Liabilitas Lancar',    false],
            ['2300', 'Hutang Gaji',                 'liability_current',     'Liabilitas Lancar',    false],
            ['2310', 'Hutang BPJS',                 'liability_current',     'Liabilitas Lancar',    false],
            ['2400', 'Pendapatan Diterima Dimuka',  'liability_current',     'Liabilitas Lancar',    false],
            ['2500', 'Hutang Kartu Kredit',         'liability_credit_card', 'Liabilitas Lancar',    false],
            ['2600', 'Hutang Bank',                 'liability_non_current', 'Liabilitas Jk. Panjang', false],
            ['2700', 'Hutang Obligasi',             'liability_non_current', 'Liabilitas Jk. Panjang', false],

            // ── 3xxx: EKUITAS ───────────────────────────
            ['3100', 'Modal Disetor',               'equity',            'Ekuitas',                  false],
            ['3200', 'Tambahan Modal Disetor',       'equity',            'Ekuitas',                  false],
            ['3300', 'Laba Ditahan',                'equity_unaffected', 'Ekuitas',                  false],
            ['3400', 'Laba Tahun Berjalan',         'equity_unaffected', 'Ekuitas',                  false],

            // ── 4xxx: PENDAPATAN ────────────────────────
            ['4100', 'Pendapatan Penjualan',        'income',            'Pendapatan',               false],
            ['4110', 'Pendapatan Jasa',             'income',            'Pendapatan',               false],
            ['4120', 'Pendapatan Konsultasi',       'income',            'Pendapatan',               false],
            ['4130', 'Pendapatan Lisensi',          'income',            'Pendapatan',               false],
            ['4140', 'Pendapatan Maintenance',      'income',            'Pendapatan',               false],
            ['4200', 'Diskon Penjualan',            'income',            'Pendapatan',               false],
            ['4300', 'Retur Penjualan',             'income',            'Pendapatan',               false],

            // ── 5xxx: HPP ───────────────────────────────
            ['5100', 'Harga Pokok Penjualan',       'expense_direct_cost', 'Harga Pokok',            false],
            ['5110', 'HPP Barang Dagang',           'expense_direct_cost', 'Harga Pokok',            false],
            ['5120', 'HPP Jasa',                    'expense_direct_cost', 'Harga Pokok',            false],
            ['5200', 'Biaya Bahan Baku',            'expense_direct_cost', 'Harga Pokok',            false],
            ['5300', 'Biaya TK Langsung',           'expense_direct_cost', 'Harga Pokok',            false],
            ['5400', 'Biaya Overhead Produksi',     'expense_direct_cost', 'Harga Pokok',            false],

            // ── 6xxx: BEBAN OPERASIONAL ─────────────────
            ['6100', 'Beban Gaji & Upah',           'expense',           'Beban Operasional',        false],
            ['6110', 'Beban Tunjangan',             'expense',           'Beban Operasional',        false],
            ['6120', 'Beban BPJS',                  'expense',           'Beban Operasional',        false],
            ['6200', 'Beban Sewa',                  'expense',           'Beban Operasional',        false],
            ['6210', 'Beban Listrik & Air',         'expense',           'Beban Operasional',        false],
            ['6220', 'Beban Telepon & Internet',    'expense',           'Beban Operasional',        false],
            ['6300', 'Beban Transportasi',          'expense',           'Beban Operasional',        false],
            ['6400', 'Beban Pemasaran',             'expense',           'Beban Operasional',        false],
            ['6500', 'Beban Administrasi',          'expense',           'Beban Operasional',        false],
            ['6600', 'Beban Penyusutan',            'expense_depreciation', 'Beban Operasional',     false],
            ['6700', 'Beban Asuransi',              'expense',           'Beban Operasional',        false],
            ['6900', 'Beban Operasional Lain',      'expense',           'Beban Operasional',        false],

            // ── 7xxx: PENDAPATAN LAIN-LAIN ──────────────
            ['7100', 'Pendapatan Bunga',            'income_other',      'Pendapatan Lain',          false],
            ['7200', 'Keuntungan Selisih Kurs',     'income_other',      'Pendapatan Lain',          false],
            ['7900', 'Pendapatan Lain-lain',        'income_other',      'Pendapatan Lain',          false],

            // ── 8xxx: BEBAN LAIN-LAIN ───────────────────
            ['8100', 'Beban Bunga',                 'expense',           'Beban Lain-lain',          false],
            ['8200', 'Kerugian Selisih Kurs',       'expense',           'Beban Lain-lain',          false],
            ['8300', 'Beban Pajak Penghasilan',     'expense',           'Beban Lain-lain',          false],
            ['8900', 'Beban Lain-lain',             'expense',           'Beban Lain-lain',          false],
        ];

        $accounts = [];
        foreach ($data as [$code, $name, $type, $group, $reconcile]) {
            $accounts[$code] = AccountAccount::updateOrCreate(
                ['code' => $code],
                [
                    'name'         => $name,
                    'account_type' => $type,
                    'group_name'   => $group,
                    'reconcile'    => $reconcile,
                    'active'       => true,
                ]
            );
        }
        return $accounts;
    }

    /**
     * Seed default Accounting Journals.
     */
    private function seedJournals(array $accounts): array
    {
        $data = [
            ['Customer Invoices', 'INV',  'sale',    '4100', 1],
            ['Vendor Bills',      'BILL', 'purchase', '5100', 2],
            ['Bank BCA',          'BCA',  'bank',    '1120', 3],
            ['Bank Mandiri',      'MDR',  'bank',    '1121', 4],
            ['Kas Kecil',         'CSH',  'cash',    '1110', 5],
            ['Miscellaneous',     'MISC', 'general', null,   10],
            ['Exchange Diff.',    'EXCH', 'general', null,   11],
            ['Payroll',           'PAY',  'general', '6100', 12],
        ];

        $journals = [];
        foreach ($data as [$name, $code, $type, $acctCode, $seq]) {
            $defaultId = $acctCode ? ($accounts[$acctCode]?->id ?? null) : null;
            $journals[$code] = AccountJournal::updateOrCreate(
                ['code' => $code],
                [
                    'name'               => $name,
                    'type'               => $type,
                    'default_account_id' => $defaultId,
                    'sequence'           => $seq,
                    'active'             => true,
                ]
            );
        }
        return $journals;
    }

    /**
     * Seed Indonesian Tax Templates (PPN & PPh).
     */
    private function seedTaxes(array $accounts): void
    {
        $ppnOut  = $accounts['2210']?->id ?? null;
        $ppnIn   = $accounts['1420']?->id ?? null;
        $pph21   = $accounts['2220']?->id ?? null;
        $pph23   = $accounts['2230']?->id ?? null;
        $pph42   = $accounts['2260']?->id ?? null;

        $taxes = [
            ['PPN 11%',                'percent', 11,   'sale',     $ppnOut, 'PPN Keluaran 11%',                         1],
            ['PPN Masukan 11%',        'percent', 11,   'purchase', $ppnIn,  'PPN Masukan 11%',                          2],
            ['PPh 21 (5%)',            'percent', 5,    'none',     $pph21,  'PPh 21 tarif 5% (s.d. Rp60jt)',             10],
            ['PPh 21 (15%)',           'percent', 15,   'none',     $pph21,  'PPh 21 tarif 15% (Rp60jt-Rp250jt)',        11],
            ['PPh 21 (25%)',           'percent', 25,   'none',     $pph21,  'PPh 21 tarif 25% (Rp250jt-Rp500jt)',       12],
            ['PPh 23 (2%)',            'percent', 2,    'purchase', $pph23,  'PPh 23 Jasa 2%',                           20],
            ['PPh 23 (15%)',           'percent', 15,   'purchase', $pph23,  'PPh 23 Dividen/Bunga/Royalti 15%',         21],
            ['PPh 4(2) Sewa (10%)',    'percent', 10,   'purchase', $pph42,  'PPh 4(2) Sewa Bangunan 10%',               30],
            ['PPh 4(2) Konstruksi (3%)', 'percent', 3,  'purchase', $pph42,  'PPh 4(2) Jasa Konstruksi 3%',             31],
            ['PPN 11% (Termasuk)',     'percent', 11,   'sale',     $ppnOut, 'PPN 11% sudah termasuk harga',             40],
        ];

        foreach ($taxes as [$name, $amtType, $amt, $use, $acctId, $desc, $seq]) {
            $data = [
                'amount_type'   => $amtType,
                'amount'        => $amt,
                'type_tax_use'  => $use,
                'account_id'    => $acctId,
                'description'   => $desc,
                'sequence'      => $seq,
                'active'        => true,
            ];
            if ($name === 'PPN 11% (Termasuk)') {
                $data['price_include'] = true;
            }
            AccountTax::updateOrCreate(['name' => $name], $data);
        }
    }

    /**
     * Seed sample journal entries to demonstrate the double-entry system.
     */
    private function seedSampleEntries(array $accounts, array $journals): void
    {
        // Skip if entries already exist
        if (AccountMove::count() > 0) return;

        // a. Initial Capital Investment
        $move1 = AccountMove::create([
            'name'      => 'MISC/2026/06/0001',
            'date'      => Carbon::today()->subDays(10),
            'journal_id' => $journals['MISC']->id,
            'state'     => 'posted',
            'move_type' => 'entry',
            'amount_total' => 500000000,
            'sequence_prefix' => 'MISC/2026/06/',
            'sequence_number' => 1,
            'posted_before'   => true,
        ]);
        AccountMoveLine::create([
            'move_id'    => $move1->id,
            'account_id' => $accounts['1120']->id,
            'name'       => 'Setoran Modal Awal',
            'debit'      => 500000000, 'credit' => 0, 'balance' => 500000000,
            'date'       => $move1->date,
        ]);
        AccountMoveLine::create([
            'move_id'    => $move1->id,
            'account_id' => $accounts['3100']->id,
            'name'       => 'Modal Disetor',
            'debit'      => 0, 'credit' => 500000000, 'balance' => -500000000,
            'date'       => $move1->date,
        ]);

        // b. Customer Invoice (with PPN)
        $move2 = AccountMove::create([
            'name'           => 'INV/2026/06/0001',
            'date'           => Carbon::today()->subDays(5),
            'invoice_date'   => Carbon::today()->subDays(5),
            'invoice_date_due' => Carbon::today()->addDays(25),
            'journal_id'     => $journals['INV']->id,
            'state'          => 'posted',
            'move_type'      => 'out_invoice',
            'amount_untaxed' => 28000000,
            'amount_tax'     => 3080000,
            'amount_total'   => 31080000,
            'amount_residual' => 31080000,
            'payment_state'  => 'not_paid',
            'currency_code'  => 'IDR',
            'sequence_prefix' => 'INV/2026/06/',
            'sequence_number' => 1,
            'posted_before'   => true,
        ]);
        // Debit: Piutang Usaha
        AccountMoveLine::create([
            'move_id' => $move2->id, 'account_id' => $accounts['1200']->id,
            'name' => 'Piutang - Jasa Konsultasi IT',
            'debit' => 31080000, 'credit' => 0, 'balance' => 31080000,
            'quantity' => 1, 'price_unit' => 28000000, 'price_subtotal' => 28000000,
            'date' => $move2->date,
        ]);
        // Credit: Pendapatan Konsultasi
        AccountMoveLine::create([
            'move_id' => $move2->id, 'account_id' => $accounts['4120']->id,
            'name' => 'Pendapatan Konsultasi IT',
            'debit' => 0, 'credit' => 28000000, 'balance' => -28000000,
            'quantity' => 1, 'price_unit' => 28000000, 'price_subtotal' => 28000000,
            'date' => $move2->date,
        ]);
        // Credit: PPN Keluaran
        AccountMoveLine::create([
            'move_id' => $move2->id, 'account_id' => $accounts['2210']->id,
            'name' => 'PPN Keluaran 11%',
            'debit' => 0, 'credit' => 3080000, 'balance' => -3080000,
            'date' => $move2->date,
        ]);

        // c. Vendor Bill (Sewa Kantor)
        $move3 = AccountMove::create([
            'name'           => 'BILL/2026/06/0001',
            'date'           => Carbon::today()->subDays(3),
            'invoice_date'   => Carbon::today()->subDays(3),
            'invoice_date_due' => Carbon::today()->addDays(27),
            'journal_id'     => $journals['BILL']->id,
            'state'          => 'posted',
            'move_type'      => 'in_invoice',
            'amount_untaxed' => 15000000,
            'amount_tax'     => 1650000,
            'amount_total'   => 16650000,
            'amount_residual' => 16650000,
            'payment_state'  => 'not_paid',
            'currency_code'  => 'IDR',
            'sequence_prefix' => 'BILL/2026/06/',
            'sequence_number' => 1,
            'posted_before'   => true,
        ]);
        // Debit: Beban Sewa
        AccountMoveLine::create([
            'move_id' => $move3->id, 'account_id' => $accounts['6200']->id,
            'name' => 'Sewa Kantor Juni 2026',
            'debit' => 15000000, 'credit' => 0, 'balance' => 15000000,
            'date' => $move3->date,
        ]);
        // Debit: PPN Masukan
        AccountMoveLine::create([
            'move_id' => $move3->id, 'account_id' => $accounts['1420']->id,
            'name' => 'PPN Masukan 11%',
            'debit' => 1650000, 'credit' => 0, 'balance' => 1650000,
            'date' => $move3->date,
        ]);
        // Credit: Hutang Usaha
        AccountMoveLine::create([
            'move_id' => $move3->id, 'account_id' => $accounts['2100']->id,
            'name' => 'Hutang Sewa Kantor',
            'debit' => 0, 'credit' => 16650000, 'balance' => -16650000,
            'date' => $move3->date,
        ]);

        // d. Draft Journal Entry (Beban Gaji)
        $move4 = AccountMove::create([
            'name'      => '/',
            'date'      => Carbon::today(),
            'journal_id' => $journals['PAY']->id,
            'state'     => 'draft',
            'move_type' => 'entry',
            'ref'       => 'Gaji Karyawan Juni 2026',
        ]);
        AccountMoveLine::create([
            'move_id' => $move4->id, 'account_id' => $accounts['6100']->id,
            'name' => 'Beban Gaji Juni',
            'debit' => 45000000, 'credit' => 0, 'balance' => 45000000,
            'date' => $move4->date,
        ]);
        AccountMoveLine::create([
            'move_id' => $move4->id, 'account_id' => $accounts['2300']->id,
            'name' => 'Hutang Gaji Juni',
            'debit' => 0, 'credit' => 42750000, 'balance' => -42750000,
            'date' => $move4->date,
        ]);
        AccountMoveLine::create([
            'move_id' => $move4->id, 'account_id' => $accounts['2220']->id,
            'name' => 'PPh 21 Terutang',
            'debit' => 0, 'credit' => 2250000, 'balance' => -2250000,
            'date' => $move4->date,
        ]);
    }
}
