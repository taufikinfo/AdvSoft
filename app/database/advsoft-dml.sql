-- ========================================================
-- AdvSoft Initial & Core Data (DML)
-- Generated: 2026-08-24 04:26:24
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Dumping data for table `account_account` (76 rows)
-- --------------------------------------------------------
INSERT INTO `account_account` (`id`, `code`, `name`, `account_type`, `company_id`, `reconcile`, `deprecated`, `currency_code`, `group_name`, `note`, `active`, `created_at`, `updated_at`) VALUES
  (1, '1110', 'Kas', 'asset_cash', NULL, 0, 0, NULL, 'Aset Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (2, '1120', 'Bank BCA', 'asset_cash', NULL, 0, 0, NULL, 'Aset Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (3, '1121', 'Bank Mandiri', 'asset_cash', NULL, 0, 0, NULL, 'Aset Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (4, '1122', 'Bank BNI', 'asset_cash', NULL, 0, 0, NULL, 'Aset Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (5, '1130', 'Deposito Berjangka', 'asset_current', NULL, 0, 0, NULL, 'Aset Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (6, '1200', 'Piutang Usaha', 'asset_receivable', NULL, 1, 0, NULL, 'Aset Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (7, '1210', 'Piutang Belum Ditagih', 'asset_receivable', NULL, 1, 0, NULL, 'Aset Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (8, '1220', 'Cadangan Kerugian Piutang', 'asset_current', NULL, 0, 0, NULL, 'Aset Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (9, '1300', 'Persediaan Barang', 'asset_current', NULL, 0, 0, NULL, 'Aset Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (10, '1310', 'Persediaan Bahan Baku', 'asset_current', NULL, 0, 0, NULL, 'Aset Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (11, '1400', 'Beban Dibayar Dimuka', 'asset_prepayments', NULL, 0, 0, NULL, 'Aset Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (12, '1410', 'Uang Muka Pembelian', 'asset_prepayments', NULL, 0, 0, NULL, 'Aset Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (13, '1420', 'PPN Masukan', 'asset_current', NULL, 0, 0, NULL, 'Aset Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (14, '1430', 'PPh Dibayar Dimuka', 'asset_current', NULL, 0, 0, NULL, 'Aset Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (15, '1500', 'Tanah', 'asset_fixed', NULL, 0, 0, NULL, 'Aset Tetap', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (16, '1510', 'Bangunan', 'asset_fixed', NULL, 0, 0, NULL, 'Aset Tetap', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (17, '1511', 'Akum. Penyusutan Bangunan', 'asset_fixed', NULL, 0, 0, NULL, 'Aset Tetap', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (18, '1520', 'Kendaraan', 'asset_fixed', NULL, 0, 0, NULL, 'Aset Tetap', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (19, '1521', 'Akum. Penyusutan Kendaraan', 'asset_fixed', NULL, 0, 0, NULL, 'Aset Tetap', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (20, '1530', 'Peralatan Kantor', 'asset_fixed', NULL, 0, 0, NULL, 'Aset Tetap', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (21, '1531', 'Akum. Penyusutan Peralatan', 'asset_fixed', NULL, 0, 0, NULL, 'Aset Tetap', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (22, '1540', 'Perangkat Komputer', 'asset_fixed', NULL, 0, 0, NULL, 'Aset Tetap', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (23, '1541', 'Akum. Penyusutan Komputer', 'asset_fixed', NULL, 0, 0, NULL, 'Aset Tetap', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (24, '1600', 'Investasi Jangka Panjang', 'asset_non_current', NULL, 0, 0, NULL, 'Aset Tidak Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (25, '1700', 'Goodwill', 'asset_non_current', NULL, 0, 0, NULL, 'Aset Tidak Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (26, '2100', 'Hutang Usaha', 'liability_payable', NULL, 1, 0, NULL, 'Liabilitas Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (27, '2110', 'Hutang Lain-lain', 'liability_current', NULL, 0, 0, NULL, 'Liabilitas Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (28, '2200', 'Hutang Pajak', 'liability_current', NULL, 0, 0, NULL, 'Liabilitas Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (29, '2210', 'PPN Keluaran', 'liability_current', NULL, 0, 0, NULL, 'Liabilitas Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (30, '2220', 'PPh 21 Terutang', 'liability_current', NULL, 0, 0, NULL, 'Liabilitas Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (31, '2230', 'PPh 23 Terutang', 'liability_current', NULL, 0, 0, NULL, 'Liabilitas Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (32, '2240', 'PPh 25 Terutang', 'liability_current', NULL, 0, 0, NULL, 'Liabilitas Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (33, '2250', 'PPh 29 Terutang', 'liability_current', NULL, 0, 0, NULL, 'Liabilitas Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (34, '2260', 'PPh 4(2) Terutang', 'liability_current', NULL, 0, 0, NULL, 'Liabilitas Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (35, '2300', 'Hutang Gaji', 'liability_current', NULL, 0, 0, NULL, 'Liabilitas Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (36, '2310', 'Hutang BPJS', 'liability_current', NULL, 0, 0, NULL, 'Liabilitas Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (37, '2400', 'Pendapatan Diterima Dimuka', 'liability_current', NULL, 0, 0, NULL, 'Liabilitas Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (38, '2500', 'Hutang Kartu Kredit', 'liability_credit_card', NULL, 0, 0, NULL, 'Liabilitas Lancar', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (39, '2600', 'Hutang Bank', 'liability_non_current', NULL, 0, 0, NULL, 'Liabilitas Jk. Panjang', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (40, '2700', 'Hutang Obligasi', 'liability_non_current', NULL, 0, 0, NULL, 'Liabilitas Jk. Panjang', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (41, '3100', 'Modal Disetor', 'equity', NULL, 0, 0, NULL, 'Ekuitas', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (42, '3200', 'Tambahan Modal Disetor', 'equity', NULL, 0, 0, NULL, 'Ekuitas', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (43, '3300', 'Laba Ditahan', 'equity_unaffected', NULL, 0, 0, NULL, 'Ekuitas', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (44, '3400', 'Laba Tahun Berjalan', 'equity_unaffected', NULL, 0, 0, NULL, 'Ekuitas', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (45, '4100', 'Pendapatan Penjualan', 'income', NULL, 0, 0, NULL, 'Pendapatan', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (46, '4110', 'Pendapatan Jasa', 'income', NULL, 0, 0, NULL, 'Pendapatan', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (47, '4120', 'Pendapatan Konsultasi', 'income', NULL, 0, 0, NULL, 'Pendapatan', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (48, '4130', 'Pendapatan Lisensi', 'income', NULL, 0, 0, NULL, 'Pendapatan', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (49, '4140', 'Pendapatan Maintenance', 'income', NULL, 0, 0, NULL, 'Pendapatan', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (50, '4200', 'Diskon Penjualan', 'income', NULL, 0, 0, NULL, 'Pendapatan', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26');
INSERT INTO `account_account` (`id`, `code`, `name`, `account_type`, `company_id`, `reconcile`, `deprecated`, `currency_code`, `group_name`, `note`, `active`, `created_at`, `updated_at`) VALUES
  (51, '4300', 'Retur Penjualan', 'income', NULL, 0, 0, NULL, 'Pendapatan', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (52, '5100', 'Harga Pokok Penjualan', 'expense_direct_cost', NULL, 0, 0, NULL, 'Harga Pokok', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (53, '5110', 'HPP Barang Dagang', 'expense_direct_cost', NULL, 0, 0, NULL, 'Harga Pokok', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (54, '5120', 'HPP Jasa', 'expense_direct_cost', NULL, 0, 0, NULL, 'Harga Pokok', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (55, '5200', 'Biaya Bahan Baku', 'expense_direct_cost', NULL, 0, 0, NULL, 'Harga Pokok', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (56, '5300', 'Biaya TK Langsung', 'expense_direct_cost', NULL, 0, 0, NULL, 'Harga Pokok', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (57, '5400', 'Biaya Overhead Produksi', 'expense_direct_cost', NULL, 0, 0, NULL, 'Harga Pokok', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (58, '6100', 'Beban Gaji & Upah', 'expense', NULL, 0, 0, NULL, 'Beban Operasional', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (59, '6110', 'Beban Tunjangan', 'expense', NULL, 0, 0, NULL, 'Beban Operasional', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (60, '6120', 'Beban BPJS', 'expense', NULL, 0, 0, NULL, 'Beban Operasional', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (61, '6200', 'Beban Sewa', 'expense', NULL, 0, 0, NULL, 'Beban Operasional', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (62, '6210', 'Beban Listrik & Air', 'expense', NULL, 0, 0, NULL, 'Beban Operasional', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (63, '6220', 'Beban Telepon & Internet', 'expense', NULL, 0, 0, NULL, 'Beban Operasional', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (64, '6300', 'Beban Transportasi', 'expense', NULL, 0, 0, NULL, 'Beban Operasional', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (65, '6400', 'Beban Pemasaran', 'expense', NULL, 0, 0, NULL, 'Beban Operasional', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (66, '6500', 'Beban Administrasi', 'expense', NULL, 0, 0, NULL, 'Beban Operasional', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (67, '6600', 'Beban Penyusutan', 'expense_depreciation', NULL, 0, 0, NULL, 'Beban Operasional', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (68, '6700', 'Beban Asuransi', 'expense', NULL, 0, 0, NULL, 'Beban Operasional', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (69, '6900', 'Beban Operasional Lain', 'expense', NULL, 0, 0, NULL, 'Beban Operasional', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (70, '7100', 'Pendapatan Bunga', 'income_other', NULL, 0, 0, NULL, 'Pendapatan Lain', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (71, '7200', 'Keuntungan Selisih Kurs', 'income_other', NULL, 0, 0, NULL, 'Pendapatan Lain', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (72, '7900', 'Pendapatan Lain-lain', 'income_other', NULL, 0, 0, NULL, 'Pendapatan Lain', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (73, '8100', 'Beban Bunga', 'expense', NULL, 0, 0, NULL, 'Beban Lain-lain', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (74, '8200', 'Kerugian Selisih Kurs', 'expense', NULL, 0, 0, NULL, 'Beban Lain-lain', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (75, '8300', 'Beban Pajak Penghasilan', 'expense', NULL, 0, 0, NULL, 'Beban Lain-lain', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (76, '8900', 'Beban Lain-lain', 'expense', NULL, 0, 0, NULL, 'Beban Lain-lain', NULL, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26');

-- --------------------------------------------------------
-- Dumping data for table `account_journal` (8 rows)
-- --------------------------------------------------------
INSERT INTO `account_journal` (`id`, `name`, `code`, `type`, `default_account_id`, `company_id`, `currency_code`, `restrict_mode_hash_table`, `bank_account_number`, `bank_name`, `sequence`, `active`, `created_at`, `updated_at`) VALUES
  (1, 'Customer Invoices', 'INV', 'sale', 45, NULL, NULL, 0, NULL, NULL, 1, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (2, 'Vendor Bills', 'BILL', 'purchase', 52, NULL, NULL, 0, NULL, NULL, 2, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (3, 'Bank BCA', 'BCA', 'bank', 2, NULL, NULL, 0, NULL, NULL, 3, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (4, 'Bank Mandiri', 'MDR', 'bank', 3, NULL, NULL, 0, NULL, NULL, 4, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (5, 'Kas Kecil', 'CSH', 'cash', 1, NULL, NULL, 0, NULL, NULL, 5, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (6, 'Miscellaneous', 'MISC', 'general', NULL, NULL, NULL, 0, NULL, NULL, 10, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (7, 'Exchange Diff.', 'EXCH', 'general', NULL, NULL, NULL, 0, NULL, NULL, 11, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (8, 'Payroll', 'PAY', 'general', 58, NULL, NULL, 0, NULL, NULL, 12, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26');

-- --------------------------------------------------------
-- Dumping data for table `account_move` (4 rows)
-- --------------------------------------------------------
INSERT INTO `account_move` (`id`, `name`, `move_type`, `journal_id`, `partner_id`, `invoice_date`, `date`, `invoice_date_due`, `state`, `ref`, `narration`, `amount_untaxed`, `amount_tax`, `amount_total`, `amount_residual`, `payment_state`, `currency_id`, `currency_code`, `company_id`, `sequence_prefix`, `sequence_number`, `posted_before`, `created_at`, `updated_at`) VALUES
  (1, 'MISC/2026/06/0001', 'entry', 6, NULL, NULL, '2026-08-09', NULL, 'posted', 'REF-001', NULL, '0.00', '0.00', '500000000.00', '0.00', 'not_paid', NULL, 'IDR', NULL, 'MISC/2026/06/', 1, 0, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (2, 'INV/2026/06/0001', 'out_invoice', 1, NULL, '2026-08-14', '2026-08-14', '2026-09-13', 'posted', NULL, NULL, '28000000.00', '3080000.00', '31080000.00', '31080000.00', 'not_paid', NULL, 'IDR', NULL, 'INV/2026/06/', 1, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (3, 'BILL/2026/06/0001', 'in_invoice', 2, 2, '2026-08-16', '2026-08-16', '2026-09-15', 'posted', NULL, NULL, '15000000.00', '1650000.00', '16650000.00', '16650000.00', 'not_paid', NULL, 'IDR', NULL, 'BILL/2026/06/', 1, 0, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (4, '/', 'entry', 6, NULL, '2026-08-12', '2026-08-19', '2026-08-19', 'draft', 'Gaji Karyawan Juni 2026', NULL, '0.00', '0.00', '0.00', '0.00', 'not_paid', NULL, 'IDR', NULL, NULL, NULL, 0, '2026-08-19 00:34:26', '2026-08-19 00:34:26');

-- --------------------------------------------------------
-- Dumping data for table `account_move_line` (11 rows)
-- --------------------------------------------------------
INSERT INTO `account_move_line` (`id`, `move_id`, `account_id`, `partner_id`, `tax_line_id`, `name`, `debit`, `credit`, `balance`, `amount_currency`, `currency_code`, `quantity`, `price_unit`, `price_subtotal`, `price_total`, `discount`, `reconciled`, `full_reconcile_id`, `date`, `date_maturity`, `sequence`, `created_at`, `updated_at`) VALUES
  (1, 1, 2, NULL, NULL, 'Setoran Modal Awal', '500000000.00', '0.00', '500000000.00', '0.00', 'IDR', '1.00', '0.00', '0.00', '0.00', '0.00', 0, NULL, '2026-08-09', NULL, 10, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (2, 1, 41, NULL, NULL, 'Modal Disetor', '0.00', '500000000.00', '-500000000.00', '0.00', 'IDR', '1.00', '0.00', '0.00', '0.00', '0.00', 0, NULL, '2026-08-09', NULL, 10, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (3, 2, 6, NULL, NULL, 'Piutang - Jasa Konsultasi IT', '31080000.00', '0.00', '31080000.00', '0.00', 'IDR', '1.00', '28000000.00', '28000000.00', '0.00', '0.00', 0, NULL, '2026-08-14', NULL, 10, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (4, 2, 47, NULL, NULL, 'Pendapatan Konsultasi IT', '0.00', '28000000.00', '-28000000.00', '0.00', 'IDR', '1.00', '28000000.00', '28000000.00', '0.00', '0.00', 0, NULL, '2026-08-14', NULL, 10, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (5, 2, 29, NULL, NULL, 'PPN Keluaran 11%', '0.00', '3080000.00', '-3080000.00', '0.00', 'IDR', '1.00', '0.00', '0.00', '0.00', '0.00', 0, NULL, '2026-08-14', NULL, 10, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (6, 3, 61, NULL, NULL, 'Sewa Kantor Juni 2026', '15000000.00', '0.00', '15000000.00', '0.00', 'IDR', '1.00', '0.00', '0.00', '0.00', '0.00', 0, NULL, '2026-08-16', NULL, 10, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (7, 3, 13, NULL, 10, 'PPN Masukan 11%', '1650000.00', '0.00', '1650000.00', '0.00', 'IDR', '1.00', '0.00', '0.00', '0.00', '0.00', 0, NULL, '2026-08-16', NULL, 10, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (8, 3, 26, NULL, NULL, 'Hutang Sewa Kantor', '0.00', '16650000.00', '-16650000.00', '0.00', 'IDR', '1.00', '0.00', '0.00', '0.00', '0.00', 0, NULL, '2026-08-16', NULL, 10, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (9, 4, 58, NULL, NULL, 'Beban Gaji Juni', '45000000.00', '0.00', '45000000.00', '0.00', 'IDR', '1.00', '0.00', '0.00', '0.00', '0.00', 0, NULL, '2026-08-19', NULL, 10, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (10, 4, 35, NULL, NULL, 'Hutang Gaji Juni', '0.00', '42750000.00', '-42750000.00', '0.00', 'IDR', '1.00', '0.00', '0.00', '0.00', '0.00', 0, NULL, '2026-08-19', NULL, 10, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (11, 4, 30, NULL, NULL, 'PPh 21 Terutang', '0.00', '2250000.00', '-2250000.00', '0.00', 'IDR', '1.00', '0.00', '0.00', '0.00', '0.00', 0, NULL, '2026-08-19', NULL, 10, '2026-08-19 00:34:26', '2026-08-19 00:34:26');

-- --------------------------------------------------------
-- Dumping data for table `account_tax` (10 rows)
-- --------------------------------------------------------
INSERT INTO `account_tax` (`id`, `name`, `amount_type`, `amount`, `tax_group_id`, `price_include`, `include_base_amount`, `type_tax_use`, `account_id`, `refund_account_id`, `company_id`, `description`, `sequence`, `active`, `created_at`, `updated_at`) VALUES
  (1, 'PPN 11%', 'percent', '11.00', NULL, 0, 0, 'sale', 29, NULL, NULL, 'PPN Keluaran 11%', 1, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (2, 'PPN Masukan 11%', 'percent', '11.00', NULL, 0, 0, 'purchase', 13, NULL, NULL, 'PPN Masukan 11%', 2, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (3, 'PPh 21 (5%)', 'percent', '5.00', NULL, 0, 0, 'none', 30, NULL, NULL, 'PPh 21 tarif 5% (s.d. Rp60jt)', 10, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (4, 'PPh 21 (15%)', 'percent', '15.00', NULL, 0, 0, 'none', 30, NULL, NULL, 'PPh 21 tarif 15% (Rp60jt-Rp250jt)', 11, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (5, 'PPh 21 (25%)', 'percent', '25.00', NULL, 0, 0, 'none', 30, NULL, NULL, 'PPh 21 tarif 25% (Rp250jt-Rp500jt)', 12, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (6, 'PPh 23 (2%)', 'percent', '2.00', NULL, 0, 0, 'purchase', 31, NULL, NULL, 'PPh 23 Jasa 2%', 20, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (7, 'PPh 23 (15%)', 'percent', '15.00', NULL, 0, 0, 'purchase', 31, NULL, NULL, 'PPh 23 Dividen/Bunga/Royalti 15%', 21, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (8, 'PPh 4(2) Sewa (10%)', 'percent', '10.00', NULL, 0, 0, 'purchase', 34, NULL, NULL, 'PPh 4(2) Sewa Bangunan 10%', 30, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (9, 'PPh 4(2) Konstruksi (3%)', 'percent', '3.00', NULL, 0, 0, 'purchase', 34, NULL, NULL, 'PPh 4(2) Jasa Konstruksi 3%', 31, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (10, 'PPN 11% (Termasuk)', 'percent', '11.00', NULL, 1, 0, 'sale', 29, NULL, NULL, 'PPN 11% sudah termasuk harga', 40, 1, '2026-08-19 00:34:26', '2026-08-19 00:34:26');

-- --------------------------------------------------------
-- Dumping data for table `actions` (11 rows)
-- --------------------------------------------------------
INSERT INTO `actions` (`id`, `name`, `type`, `res_model`, `view_mode`, `domain`, `context`, `target`, `limit`, `help`, `created_at`, `updated_at`) VALUES
  (1, 'Projects', 'ir.actions.act_window', 'project.project', 'kanban,list,form,spreadsheet', NULL, NULL, 'current', 80, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (2, 'Tasks', 'ir.actions.act_window', 'project.task', 'list,kanban,form,calendar,graph,pivot,spreadsheet', NULL, NULL, 'current', 80, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (3, 'Showcase', 'ir.actions.act_window', 'showcase.model', 'form', NULL, NULL, 'current', 80, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (4, 'Journal Entries', 'ir.actions.act_window', 'account.move', 'list,form,graph,pivot,spreadsheet', NULL, NULL, 'current', 80, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (5, 'Customer Invoices', 'ir.actions.act_window', 'account.move', 'list,form,graph,pivot,spreadsheet', '\"[[\\\"move_type\\\",\\\"=\\\",\\\"out_invoice\\\"]]\"', '\"{\\\"default_move_type\\\":\\\"out_invoice\\\"}\"', 'current', 80, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (6, 'Vendor Bills', 'ir.actions.act_window', 'account.move', 'list,form,graph,pivot,spreadsheet', '\"[[\\\"move_type\\\",\\\"=\\\",\\\"in_invoice\\\"]]\"', '\"{\\\"default_move_type\\\":\\\"in_invoice\\\"}\"', 'current', 80, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (7, 'Journal Items', 'ir.actions.act_window', 'account.move.line', 'list,form,pivot,spreadsheet', NULL, NULL, 'current', 80, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (8, 'Chart of Accounts', 'ir.actions.act_window', 'account.account', 'list,form', NULL, NULL, 'current', 80, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (9, 'Journals', 'ir.actions.act_window', 'account.journal', 'list,form', NULL, NULL, 'current', 80, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (10, 'Taxes', 'ir.actions.act_window', 'account.tax', 'list,form', NULL, NULL, 'current', 80, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (11, 'Payments', 'ir.actions.act_window', 'account.payment', 'list,form', NULL, NULL, 'current', 80, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25');

-- --------------------------------------------------------
-- Dumping data for table `ir_model` (29 rows)
-- --------------------------------------------------------
INSERT INTO `ir_model` (`id`, `model`, `name`, `module`, `description`, `transient`, `created_at`, `updated_at`) VALUES
  (1, 'account.account', 'Chart of Accounts', 'advsoft', NULL, 0, NULL, NULL),
  (2, 'account.journal', 'Jurnal Akuntansi', 'advsoft', NULL, 0, NULL, NULL),
  (3, 'account.move', 'Jurnal Entry', 'advsoft', NULL, 0, NULL, NULL),
  (4, 'account.move.line', 'Baris Jurnal', 'advsoft', NULL, 0, NULL, NULL),
  (5, 'account.payment', 'Pembayaran', 'advsoft', NULL, 0, NULL, NULL),
  (6, 'account.tax', 'Pajak', 'advsoft', NULL, 0, NULL, NULL),
  (7, 'ir.action', 'Window Actions', 'advsoft', NULL, 0, NULL, NULL),
  (8, 'ir.actions.report', 'Report Action', 'advsoft', NULL, 0, NULL, NULL),
  (9, 'ir.config_parameter', 'System Parameters', 'advsoft', NULL, 0, NULL, NULL),
  (10, 'ir.model.access', 'Model Access (ACL)', 'advsoft', NULL, 0, NULL, NULL),
  (11, 'ir.model', 'Models Registry', 'advsoft', NULL, 0, NULL, NULL),
  (12, 'ir.module.module', 'Modules', 'advsoft', NULL, 0, NULL, NULL),
  (13, 'ir.rule', 'Record Rules', 'advsoft', NULL, 0, NULL, NULL),
  (14, 'ir.sequence', 'Sequences', 'advsoft', NULL, 0, NULL, NULL),
  (15, 'ir.ui.menu', 'Menu Items', 'advsoft', NULL, 0, NULL, NULL),
  (16, 'ir.ui.view', 'View Definitions', 'advsoft', NULL, 0, NULL, NULL),
  (17, 'res.company', 'Company', 'advsoft', NULL, 0, NULL, NULL),
  (18, 'res.groups', 'Security Groups', 'advsoft', NULL, 0, NULL, NULL),
  (19, 'res.groups.category', 'Security Group Category', 'advsoft', NULL, 0, NULL, NULL),
  (20, 'res.partner', 'Contact / Partner', 'advsoft', NULL, 0, NULL, NULL),
  (21, 'res.users', 'Users', 'advsoft', NULL, 0, NULL, NULL),
  (22, 'saved_filter', 'Saved Filter', 'advsoft', NULL, 0, NULL, NULL),
  (23, 'project.project', 'Project', 'advsoft', NULL, 0, NULL, NULL),
  (24, 'stage', 'Pipeline Stage', 'advsoft', NULL, 0, NULL, NULL),
  (25, 'project.tag', 'Tag', 'advsoft', NULL, 0, NULL, NULL),
  (26, 'task', 'Task', 'advsoft', NULL, 0, NULL, NULL),
  (27, 'task.timesheet', 'Timesheet', 'advsoft', NULL, 0, NULL, NULL),
  (28, 'showcase.model', 'Widgets Showcase — All Fields & Widgets', 'advsoft', NULL, 0, NULL, NULL),
  (29, 'spreadsheet.document', 'Spreadsheet Document', 'advsoft', NULL, 0, NULL, NULL);

-- --------------------------------------------------------
-- Dumping data for table `ir_model_access` (116 rows)
-- --------------------------------------------------------
INSERT INTO `ir_model_access` (`id`, `name`, `model_id`, `group_id`, `perm_read`, `perm_write`, `perm_create`, `perm_unlink`, `active`, `created_at`, `updated_at`) VALUES
  (1, 'Administration / System Admin on account.account', 1, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (2, 'Project / Manager on account.account', 1, 2, 1, 1, 1, 1, 1, NULL, NULL),
  (3, 'Project / User on account.account', 1, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (4, 'User / Portal on account.account', 1, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (5, 'Administration / System Admin on account.journal', 2, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (6, 'Project / Manager on account.journal', 2, 2, 1, 1, 1, 1, 1, NULL, NULL),
  (7, 'Project / User on account.journal', 2, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (8, 'User / Portal on account.journal', 2, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (9, 'Administration / System Admin on account.move', 3, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (10, 'Project / Manager on account.move', 3, 2, 1, 1, 1, 1, 1, NULL, NULL),
  (11, 'Project / User on account.move', 3, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (12, 'User / Portal on account.move', 3, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (13, 'Administration / System Admin on account.move.line', 4, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (14, 'Project / Manager on account.move.line', 4, 2, 1, 1, 1, 1, 1, NULL, NULL),
  (15, 'Project / User on account.move.line', 4, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (16, 'User / Portal on account.move.line', 4, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (17, 'Administration / System Admin on account.payment', 5, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (18, 'Project / Manager on account.payment', 5, 2, 1, 1, 1, 1, 1, NULL, NULL),
  (19, 'Project / User on account.payment', 5, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (20, 'User / Portal on account.payment', 5, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (21, 'Administration / System Admin on account.tax', 6, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (22, 'Project / Manager on account.tax', 6, 2, 1, 1, 1, 1, 1, NULL, NULL),
  (23, 'Project / User on account.tax', 6, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (24, 'User / Portal on account.tax', 6, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (25, 'Administration / System Admin on ir.action', 7, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (26, 'Project / Manager on ir.action', 7, 2, 1, 0, 0, 0, 1, NULL, NULL),
  (27, 'Project / User on ir.action', 7, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (28, 'User / Portal on ir.action', 7, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (29, 'Administration / System Admin on ir.actions.report', 8, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (30, 'Project / Manager on ir.actions.report', 8, 2, 1, 0, 0, 0, 1, NULL, NULL),
  (31, 'Project / User on ir.actions.report', 8, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (32, 'User / Portal on ir.actions.report', 8, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (33, 'Administration / System Admin on ir.config_parameter', 9, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (34, 'Project / Manager on ir.config_parameter', 9, 2, 1, 0, 0, 0, 1, NULL, NULL),
  (35, 'Project / User on ir.config_parameter', 9, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (36, 'User / Portal on ir.config_parameter', 9, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (37, 'Administration / System Admin on ir.model', 11, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (38, 'Project / Manager on ir.model', 11, 2, 1, 0, 0, 0, 1, NULL, NULL),
  (39, 'Project / User on ir.model', 11, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (40, 'User / Portal on ir.model', 11, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (41, 'Administration / System Admin on ir.model.access', 10, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (42, 'Project / Manager on ir.model.access', 10, 2, 1, 0, 0, 0, 1, NULL, NULL),
  (43, 'Project / User on ir.model.access', 10, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (44, 'User / Portal on ir.model.access', 10, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (45, 'Administration / System Admin on ir.module.module', 12, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (46, 'Project / Manager on ir.module.module', 12, 2, 1, 0, 0, 0, 1, NULL, NULL),
  (47, 'Project / User on ir.module.module', 12, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (48, 'User / Portal on ir.module.module', 12, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (49, 'Administration / System Admin on ir.rule', 13, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (50, 'Project / Manager on ir.rule', 13, 2, 1, 0, 0, 0, 1, NULL, NULL);
INSERT INTO `ir_model_access` (`id`, `name`, `model_id`, `group_id`, `perm_read`, `perm_write`, `perm_create`, `perm_unlink`, `active`, `created_at`, `updated_at`) VALUES
  (51, 'Project / User on ir.rule', 13, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (52, 'User / Portal on ir.rule', 13, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (53, 'Administration / System Admin on ir.sequence', 14, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (54, 'Project / Manager on ir.sequence', 14, 2, 1, 0, 0, 0, 1, NULL, NULL),
  (55, 'Project / User on ir.sequence', 14, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (56, 'User / Portal on ir.sequence', 14, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (57, 'Administration / System Admin on ir.ui.menu', 15, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (58, 'Project / Manager on ir.ui.menu', 15, 2, 1, 0, 0, 0, 1, NULL, NULL),
  (59, 'Project / User on ir.ui.menu', 15, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (60, 'User / Portal on ir.ui.menu', 15, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (61, 'Administration / System Admin on ir.ui.view', 16, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (62, 'Project / Manager on ir.ui.view', 16, 2, 1, 0, 0, 0, 1, NULL, NULL),
  (63, 'Project / User on ir.ui.view', 16, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (64, 'User / Portal on ir.ui.view', 16, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (65, 'Administration / System Admin on project.project', 23, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (66, 'Project / Manager on project.project', 23, 2, 1, 1, 1, 1, 1, NULL, NULL),
  (67, 'Project / User on project.project', 23, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (68, 'User / Portal on project.project', 23, 4, 1, 0, 0, 0, 1, NULL, NULL),
  (69, 'Administration / System Admin on project.tag', 25, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (70, 'Project / Manager on project.tag', 25, 2, 1, 1, 1, 1, 1, NULL, NULL),
  (71, 'Project / User on project.tag', 25, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (72, 'User / Portal on project.tag', 25, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (73, 'Administration / System Admin on res.company', 17, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (74, 'Project / Manager on res.company', 17, 2, 1, 0, 0, 0, 1, NULL, NULL),
  (75, 'Project / User on res.company', 17, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (76, 'User / Portal on res.company', 17, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (77, 'Administration / System Admin on res.groups', 18, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (78, 'Project / Manager on res.groups', 18, 2, 1, 0, 0, 0, 1, NULL, NULL),
  (79, 'Project / User on res.groups', 18, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (80, 'User / Portal on res.groups', 18, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (81, 'Administration / System Admin on res.groups.category', 19, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (82, 'Project / Manager on res.groups.category', 19, 2, 1, 0, 0, 0, 1, NULL, NULL),
  (83, 'Project / User on res.groups.category', 19, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (84, 'User / Portal on res.groups.category', 19, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (85, 'Administration / System Admin on res.partner', 20, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (86, 'Project / Manager on res.partner', 20, 2, 1, 0, 0, 0, 1, NULL, NULL),
  (87, 'Project / User on res.partner', 20, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (88, 'User / Portal on res.partner', 20, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (89, 'Administration / System Admin on res.users', 21, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (90, 'Project / Manager on res.users', 21, 2, 1, 0, 0, 0, 1, NULL, NULL),
  (91, 'Project / User on res.users', 21, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (92, 'User / Portal on res.users', 21, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (93, 'Administration / System Admin on saved_filter', 22, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (94, 'Project / Manager on saved_filter', 22, 2, 1, 1, 1, 1, 1, NULL, NULL),
  (95, 'Project / User on saved_filter', 22, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (96, 'User / Portal on saved_filter', 22, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (97, 'Administration / System Admin on showcase.model', 28, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (98, 'Project / Manager on showcase.model', 28, 2, 1, 1, 1, 1, 1, NULL, NULL),
  (99, 'Project / User on showcase.model', 28, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (100, 'User / Portal on showcase.model', 28, 4, 0, 0, 0, 0, 1, NULL, NULL);
INSERT INTO `ir_model_access` (`id`, `name`, `model_id`, `group_id`, `perm_read`, `perm_write`, `perm_create`, `perm_unlink`, `active`, `created_at`, `updated_at`) VALUES
  (101, 'Administration / System Admin on spreadsheet.document', 29, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (102, 'Project / Manager on spreadsheet.document', 29, 2, 1, 1, 1, 1, 1, NULL, NULL),
  (103, 'Project / User on spreadsheet.document', 29, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (104, 'User / Portal on spreadsheet.document', 29, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (105, 'Administration / System Admin on stage', 24, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (106, 'Project / Manager on stage', 24, 2, 1, 1, 1, 1, 1, NULL, NULL),
  (107, 'Project / User on stage', 24, 3, 1, 0, 0, 0, 1, NULL, NULL),
  (108, 'User / Portal on stage', 24, 4, 0, 0, 0, 0, 1, NULL, NULL),
  (109, 'Administration / System Admin on task', 26, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (110, 'Project / Manager on task', 26, 2, 1, 1, 1, 1, 1, NULL, NULL),
  (111, 'Project / User on task', 26, 3, 1, 1, 1, 0, 1, NULL, NULL),
  (112, 'User / Portal on task', 26, 4, 1, 0, 0, 0, 1, NULL, NULL),
  (113, 'Administration / System Admin on task.timesheet', 27, 1, 1, 1, 1, 1, 1, NULL, NULL),
  (114, 'Project / Manager on task.timesheet', 27, 2, 1, 1, 1, 1, 1, NULL, NULL),
  (115, 'Project / User on task.timesheet', 27, 3, 1, 1, 1, 0, 1, NULL, NULL),
  (116, 'User / Portal on task.timesheet', 27, 4, 0, 0, 0, 0, 1, NULL, NULL);

-- --------------------------------------------------------
-- Dumping data for table `ir_module_module` (1 rows)
-- --------------------------------------------------------
INSERT INTO `ir_module_module` (`id`, `name`, `display_name`, `version`, `category`, `state`, `depends`, `data_files`, `auto_install`, `installed_at`, `created_at`, `updated_at`) VALUES
  (1, 'project', 'Project Management', '1.0.0', 'Project', 'uninstalled', '[\"base\"]', '[\"security\\/ir.model.access.csv\",\"data\\/menu_items.json\",\"data\\/stages.json\"]', 0, NULL, NULL, NULL);

-- --------------------------------------------------------
-- Dumping data for table `menus` (17 rows)
-- --------------------------------------------------------
INSERT INTO `menus` (`id`, `name`, `parent_id`, `action_id`, `sequence`, `icon`, `web_icon`, `web_icon_color`, `active`, `groups`, `created_at`, `updated_at`, `group_ids`, `security_view`, `model`, `view_type`) VALUES
  (1, 'Project', NULL, NULL, 10, 'briefcase', 'briefcase', '#7C3AED', 1, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, NULL, NULL, NULL),
  (2, 'Projects', 1, 1, 10, 'folder', NULL, NULL, 1, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, NULL, NULL, NULL),
  (3, 'Tasks', 1, 2, 20, 'check-square', NULL, NULL, 1, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, NULL, NULL, NULL),
  (4, 'Custom Page', 1, NULL, 10, 'star', NULL, NULL, 1, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, 'my_custom_page', NULL, NULL),
  (5, 'Accounting', NULL, NULL, 15, 'book-open', 'book-open', '#0d9488', 1, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, NULL, NULL, NULL),
  (6, 'Journal Entries', 5, 4, 10, 'file-text', NULL, NULL, 1, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, NULL, NULL, NULL),
  (7, 'Customer Invoices', 5, 5, 20, 'send', NULL, NULL, 1, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, NULL, NULL, NULL),
  (8, 'Vendor Bills', 5, 6, 30, 'inbox', NULL, NULL, 1, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, NULL, NULL, NULL),
  (9, 'Payments', 5, 11, 40, 'credit-card', NULL, NULL, 1, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, NULL, NULL, NULL),
  (10, 'Journal Items', 5, 7, 50, 'list', NULL, NULL, 1, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, NULL, NULL, NULL),
  (11, 'Reporting', 5, NULL, 80, 'bar-chart-2', NULL, NULL, 1, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, NULL, NULL, NULL),
  (12, 'Financial Reports', 11, NULL, 10, 'file-text', NULL, NULL, 1, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, 'accounting_reports', NULL, NULL),
  (13, 'Configuration', 5, NULL, 90, 'settings', NULL, NULL, 1, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, NULL, NULL, NULL),
  (14, 'Chart of Accounts', 13, 8, 10, 'git-branch', NULL, NULL, 1, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, NULL, NULL, NULL),
  (15, 'Journals', 13, 9, 20, 'book', NULL, NULL, 1, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, NULL, NULL, NULL),
  (16, 'Taxes', 13, 10, 30, 'percent', NULL, NULL, 1, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, NULL, NULL, NULL),
  (17, 'Showcase', NULL, 3, 20, 'eye', 'eye', '#059669', 1, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------
-- Dumping data for table `projects` (5 rows)
-- --------------------------------------------------------
INSERT INTO `projects` (`id`, `name`, `description`, `status`, `color`, `created_at`, `updated_at`, `partner_id`, `date_start`, `date_end`, `budget`, `actual_cost`, `task_count`, `progress`, `allow_timesheets`, `privacy_visibility`) VALUES
  (1, 'Website Redesign', 'Complete website overhaul', 'active', '#6366f1', '2026-08-19 00:34:25', '2026-08-19 00:34:25', 1, '2026-01-01', '2026-06-30', '25000.00', '0.00', 0, '0.00', 1, 'portal'),
  (2, 'Mobile App', 'iOS and Android mobile application', 'active', '#ec4899', '2026-08-19 00:34:25', '2026-08-19 00:34:25', 2, '2026-02-15', '2026-08-31', '45000.00', '0.00', 0, '0.00', 1, 'portal'),
  (3, 'ERP Integration', 'Integrate with ERP system', 'active', '#f59e0b', '2026-08-19 00:34:25', '2026-08-19 00:38:57', 1, '2026-04-01', '2026-12-31', '60000.00', '0.00', 0, '0.00', 1, 'portal'),
  (4, 'Marketing Campaign', 'Q3 marketing push', 'cancelled', '#10b981', '2026-08-19 00:34:25', '2026-08-19 00:34:25', 2, '2026-03-01', '2026-05-31', '15000.00', '0.00', 0, '0.00', 1, 'portal'),
  (5, 'Legacy Migration', 'Migrate legacy infrastructure', 'archived', '#8b5cf6', '2026-08-19 00:34:25', '2026-08-19 00:34:25', 1, '2025-01-15', '2025-11-30', '12000.00', '0.00', 0, '0.00', 1, 'portal');

-- --------------------------------------------------------
-- Dumping data for table `res_company` (1 rows)
-- --------------------------------------------------------
INSERT INTO `res_company` (`id`, `name`, `code`, `email`, `phone`, `logo`, `currency_code`, `active`, `created_at`, `updated_at`) VALUES
  (1, 'My Company', 'MC', NULL, NULL, NULL, 'USD', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25');

-- --------------------------------------------------------
-- Dumping data for table `res_groups` (4 rows)
-- --------------------------------------------------------
INSERT INTO `res_groups` (`id`, `name`, `description`, `category_id`, `share`, `created_at`, `updated_at`) VALUES
  (1, 'Administration / System Admin', 'Full system access (superuser)', 1, 0, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (2, 'Project / Manager', 'Manage all projects & tasks', 2, 0, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (3, 'Project / User', 'Standard user: see/edit own tasks', 2, 0, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (4, 'User / Portal', 'External portal user (read-only)', 3, 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25');

-- --------------------------------------------------------
-- Dumping data for table `res_groups_category` (3 rows)
-- --------------------------------------------------------
INSERT INTO `res_groups_category` (`id`, `name`, `description`, `sequence`, `created_at`, `updated_at`) VALUES
  (1, 'Administration', NULL, 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (2, 'Project', NULL, 10, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (3, 'User', NULL, 99, '2026-08-19 00:34:25', '2026-08-19 00:34:25');

-- --------------------------------------------------------
-- Dumping data for table `res_groups_implied_rel` (1 rows)
-- --------------------------------------------------------
INSERT INTO `res_groups_implied_rel` (`group_id`, `implied_id`) VALUES
  (2, 3);

-- --------------------------------------------------------
-- Dumping data for table `res_partner` (2 rows)
-- --------------------------------------------------------
INSERT INTO `res_partner` (`id`, `name`, `email`, `phone`, `image`, `active`, `is_company`, `company_id`, `type`, `parent_path`, `created_at`, `updated_at`, `property_account_receivable_id`, `property_account_payable_id`) VALUES
  (1, 'Administrator', 'admin@advsoft.local', NULL, NULL, 1, 0, NULL, 'contact', NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, NULL),
  (2, 'Demo User', 'demo@advsoft.local', NULL, NULL, 1, 0, NULL, 'contact', NULL, '2026-08-19 00:34:26', '2026-08-19 00:34:26', NULL, NULL);

-- --------------------------------------------------------
-- Dumping data for table `res_users` (2 rows)
-- --------------------------------------------------------
INSERT INTO `res_users` (`id`, `login`, `password`, `name`, `email`, `partner_id`, `company_id`, `active`, `share`, `signature`, `last_login_at`, `last_login_ip`, `remember_token`, `created_at`, `updated_at`) VALUES
  (1, 'admin', '$2y$12$x4eM4BZoEWeSTjZwTCyE7.vgdH7ENT1IBtxpf47WShBTO6Q0o2rtC', 'Administrator', 'admin@advsoft.local', 1, 1, 1, 0, NULL, NULL, NULL, NULL, '2026-08-19 00:34:26', '2026-08-19 00:34:26'),
  (2, 'demo', '$2y$12$uq9p4vYKbgud/iT5kSNQpuKOJYW68z1n3BEYQ7f7w2RDS4qsx/mH.', 'Demo User', 'demo@advsoft.local', 2, 1, 1, 0, NULL, NULL, NULL, NULL, '2026-08-19 00:34:26', '2026-08-19 00:34:26');

-- --------------------------------------------------------
-- Dumping data for table `res_users_groups_rel` (4 rows)
-- --------------------------------------------------------
INSERT INTO `res_users_groups_rel` (`user_id`, `group_id`) VALUES
  (1, 1),
  (1, 2),
  (1, 3),
  (2, 3);

-- --------------------------------------------------------
-- Dumping data for table `showcases` (3 rows)
-- --------------------------------------------------------
INSERT INTO `showcases` (`id`, `name`, `email`, `website`, `phone`, `description`, `html_content`, `age`, `score`, `price`, `progress`, `is_active`, `is_favorite`, `start_date`, `end_date`, `deadline`, `status`, `priority`, `user_id`, `image_data`, `document_data`, `signature_data`, `color`, `image_url`, `domain_data`, `code_snippet`, `created_at`, `updated_at`, `ref_model`, `color_idx`, `json_data`, `countdown_time`, `note_section`, `stat_value`, `currency_code`, `monetary_full`, `barcode_user`, `sel_badge`, `factor_float`, `toggle_float`, `int_badge`, `lbl_sel`, `clipboard_text`, `emoji_text`, `percent_val`, `time_val`, `handle_val`, `bool_btn`, `date_range`, `radio_sel`, `badge_sel`, `datetime_val`, `binary_val`, `manager_id`, `char_badge_demo`, `is_checked`, `pct_pie`, `state_selection_demo`, `image_binary_demo`, `date_date`, `handle_sort`) VALUES
  (1, 'Demo Showcase A', 'admin@advsoft.com', NULL, NULL, NULL, NULL, 30, NULL, '199.99', 75, 1, 1, NULL, NULL, NULL, 'published', 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, 3, '{\"theme\": \"dark\", \"layout\": \"fluid\"}', '2026-08-24 00:34:25', '[SECTION]Primary Configuration', 42, 'USD', '1500.50', NULL, '1', 4.5, 0.5, 10, 'a', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0),
  (2, 'Legacy Module B', 'demo@example.com', NULL, NULL, NULL, NULL, 45, NULL, '49.50', 20, 1, 0, NULL, NULL, NULL, 'draft', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, 8, '{\"enabled\": false}', '2026-08-17 00:34:25', NULL, 42, 'EUR', '300.00', NULL, '0', 2.1, 1, 3, 'b', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0),
  (3, 'Upcoming Feature C', 'contact@test.net', NULL, NULL, NULL, NULL, 28, NULL, '0.00', 0, 1, 1, NULL, NULL, NULL, 'review', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-19 00:34:25', '2026-08-19 00:34:25', NULL, 10, '{\"beta\": true, \"users\": 50}', '2026-09-02 00:34:25', NULL, 42, 'GBP', '999.99', NULL, '1', 8, 0, 42, 'a', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0);

-- --------------------------------------------------------
-- Dumping data for table `spreadsheet_data` (5 rows)
-- --------------------------------------------------------
INSERT INTO `spreadsheet_data` (`id`, `name`, `spreadsheet_data`, `raw_data`, `user_id`, `parent_model`, `parent_id`, `is_template`, `is_favorite`, `thumbnail`, `created_at`, `updated_at`) VALUES
  (1, 'Updated name 1787545244', '{\"sheets\":[{\"name\":\"Sheet1\",\"cells\":[]}]}', NULL, 1, NULL, NULL, 0, 0, NULL, NULL, NULL),
  (2, 'Project Spreadsheet Test', '{\"sheets\":[{\"name\":\"Sheet1\",\"cells\":[]}]}', NULL, 1, NULL, NULL, 0, 0, NULL, NULL, NULL),
  (3, 'Project Spreadsheet Test', '{\"sheets\":[{\"name\":\"Sheet1\",\"cells\":[]}]}', NULL, 1, NULL, NULL, 0, 0, NULL, NULL, NULL),
  (4, 'Project Spreadsheet Test', '{\"sheets\":[{\"name\":\"Sheet1\",\"cells\":[]}]}', NULL, 1, NULL, NULL, 0, 0, NULL, NULL, NULL),
  (5, 'Project Spreadsheet Test', '{\"sheets\":[{\"name\":\"Sheet1\",\"cells\":[]}]}', NULL, 1, NULL, NULL, 0, 0, NULL, NULL, NULL);

-- --------------------------------------------------------
-- Dumping data for table `stages` (5 rows)
-- --------------------------------------------------------
INSERT INTO `stages` (`id`, `name`, `sequence`, `fold`, `created_at`, `updated_at`) VALUES
  (1, 'New', 1, 0, '2026-08-19 00:34:24', '2026-08-19 00:34:24'),
  (2, 'In Progress', 2, 0, '2026-08-19 00:34:24', '2026-08-19 00:34:24'),
  (3, 'Review', 3, 0, '2026-08-19 00:34:24', '2026-08-19 00:34:24'),
  (4, 'Done', 4, 1, '2026-08-19 00:34:24', '2026-08-19 00:34:24'),
  (5, 'Cancelled', 5, 1, '2026-08-19 00:34:24', '2026-08-19 00:34:24');

-- --------------------------------------------------------
-- Dumping data for table `tags` (8 rows)
-- --------------------------------------------------------
INSERT INTO `tags` (`id`, `name`, `color`, `created_at`, `updated_at`) VALUES
  (1, 'Bug', '#ef4444', '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (2, 'Feature', '#3b82f6', '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (3, 'Enhancement', '#8b5cf6', '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (4, 'Documentation', '#06b6d4', '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (5, 'Design', '#f43f5e', '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (6, 'Backend', '#f97316', '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (7, 'Frontend', '#84cc16', '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (8, 'Urgent', '#dc2626', '2026-08-19 00:34:25', '2026-08-19 00:34:25');

-- --------------------------------------------------------
-- Dumping data for table `task_tag` (36 rows)
-- --------------------------------------------------------
INSERT INTO `task_tag` (`task_id`, `tag_id`) VALUES
  (1, 5),
  (1, 7),
  (2, 7),
  (3, 5),
  (3, 7),
  (4, 2),
  (4, 7),
  (5, 3),
  (6, 4),
  (7, 1),
  (8, 2),
  (8, 6),
  (9, 2),
  (10, 2),
  (10, 6),
  (11, 5),
  (11, 7),
  (12, 6),
  (13, 4),
  (14, 6),
  (14, 8),
  (15, 2),
  (15, 6),
  (16, 2),
  (16, 6),
  (17, 2),
  (18, 4),
  (19, 4),
  (20, 5),
  (21, 5),
  (21, 7),
  (22, 2),
  (22, 7),
  (23, 2),
  (23, 6),
  (24, 4);

-- --------------------------------------------------------
-- Dumping data for table `task_timesheets` (6 rows)
-- --------------------------------------------------------
INSERT INTO `task_timesheets` (`id`, `task_id`, `user_id`, `date`, `name`, `unit_amount`, `created_at`, `updated_at`) VALUES
  (1, 1, 1, '2026-08-24', 'Developed new feature', '3.50', NULL, NULL),
  (2, 1, 1, '2026-08-24', 'Developed new feature', '3.50', NULL, NULL),
  (3, 1, 1, '2026-08-24', 'Developed new feature', '3.50', NULL, NULL),
  (4, 1, 1, '2026-08-24', 'Developed new feature', '3.50', NULL, NULL),
  (5, 1, 1, '2026-08-24', 'Developed new feature', '3.50', NULL, NULL),
  (6, 1, 1, '2026-08-24', 'Developed new feature', '3.50', NULL, NULL);

-- --------------------------------------------------------
-- Dumping data for table `tasks` (24 rows)
-- --------------------------------------------------------
INSERT INTO `tasks` (`id`, `name`, `description`, `project_id`, `stage_id`, `user_id`, `assignee`, `priority`, `deadline`, `planned_hours`, `progress`, `active`, `created_at`, `updated_at`) VALUES
  (1, 'Homepage Layout', NULL, 1, 1, NULL, 'Mitchell Admin', '0', '2026-08-24', '16.00', '0.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (2, 'Navigation Component', NULL, 1, 1, NULL, 'Sarah Connor', '1', '2026-08-26', '8.00', '0.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (3, 'Responsive CSS Grid', NULL, 1, 2, NULL, 'Mitchell Admin', '2', '2026-08-22', '12.00', '40.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (4, 'Contact Form', NULL, 1, 2, NULL, 'John Smith', '0', '2026-08-29', '6.00', '60.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (5, 'SEO Optimization', NULL, 1, 3, NULL, 'Alice Wong', '1', '2026-08-21', '10.00', '80.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (6, 'Performance Audit', NULL, 1, 4, NULL, 'Mitchell Admin', '0', '2026-08-18', '4.00', '100.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (7, 'Browser Compatibility', NULL, 1, 4, NULL, 'John Smith', '0', '2026-08-16', '8.00', '100.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (8, 'Authentication Flow', NULL, 2, 1, NULL, 'Marc Demo', '3', '2026-09-02', '20.00', '0.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (9, 'Push Notifications', NULL, 2, 1, NULL, 'Sarah Connor', '2', '2026-09-09', '16.00', '0.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (10, 'Offline Mode', NULL, 2, 2, NULL, 'Marc Demo', '2', '2026-08-29', '24.00', '30.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (11, 'UI Kit Components', NULL, 2, 2, NULL, 'Alice Wong', '1', '2026-08-24', '32.00', '55.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (12, 'API Integration', NULL, 2, 3, NULL, 'John Smith', '0', '2026-08-20', '12.00', '90.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (13, 'App Store Listing', NULL, 2, 4, NULL, 'Mitchell Admin', '0', '2026-08-14', '3.00', '100.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (14, 'Data Migration Script', NULL, 3, 1, NULL, 'John Smith', '3', '2026-08-26', '40.00', '0.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (15, 'Invoice Module', NULL, 3, 2, NULL, 'Marc Demo', '2', '2026-09-02', '30.00', '45.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (16, 'Inventory Sync', NULL, 3, 2, NULL, 'Mitchell Admin', '2', '2026-08-29', '20.00', '25.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (17, 'Report Generator', NULL, 3, 3, NULL, 'Sarah Connor', '1', '2026-08-22', '18.00', '75.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (18, 'User Training Docs', NULL, 3, 4, NULL, 'Alice Wong', '0', '2026-08-17', '12.00', '100.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (19, 'Campaign Strategy', NULL, 4, 1, NULL, 'Alice Wong', '1', '2026-09-18', '8.00', '0.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (20, 'Social Media Assets', NULL, 4, 2, NULL, 'Sarah Connor', '0', '2026-09-08', '16.00', '50.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (21, 'Email Templates', NULL, 4, 2, NULL, 'Mitchell Admin', '0', '2026-09-03', '10.00', '35.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (22, 'Landing Page A/B Test', NULL, 4, 1, NULL, 'John Smith', '2', '2026-08-31', '14.00', '0.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (23, 'Analytics Dashboard', NULL, 4, 3, NULL, 'Marc Demo', '0', '2026-08-23', '20.00', '85.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25'),
  (24, 'Budget Report 2026 Updated', '<p>Related to project: <strong>Marketing Campaign</strong></p>', 4, 4, NULL, 'Alice Wong', '0', '2026-08-12', '6.00', '100.00', 1, '2026-08-19 00:34:25', '2026-08-19 00:34:25');

SET FOREIGN_KEY_CHECKS = 1;
