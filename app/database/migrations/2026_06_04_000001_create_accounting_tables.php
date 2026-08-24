<?php

use App\Advsoft\Core\Database\Migration;
use App\Advsoft\Core\Database\Blueprint;
use App\Advsoft\Core\Database\Schema;

/**
 * Accounting Module — Core PostgreSQL tables
 *
 * Implements the Odoo accounting data model:
 *   account_account  → Chart of Accounts (SAK Indonesia)
 *   account_journal  → Journals (sale, purchase, bank, cash, misc)
 *   account_tax      → Tax templates (PPN, PPh)
 *   account_move     → Journal entries / invoices (header)
 *   account_move_line→ Double-entry journal lines (debit/credit)
 *   account_payment  → Payment records
 *   account_full_reconcile → Reconciliation groups
 */
return new class extends Migration
{
    public function up(): void
    {
        // ────────────────────────────────────────────────
        //  account_account — Chart of Accounts
        //  SAK Indonesia: 1xxx Aset, 2xxx Liabilitas, 3xxx Ekuitas,
        //  4xxx Pendapatan, 5xxx HPP, 6xxx Beban, 7xxx Pendapatan Lain,
        //  8xxx Beban Lain, 9xxx Laba/Rugi
        // ────────────────────────────────────────────────
        Schema::create('account_account', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->index();
            $table->string('name');
            $table->string('account_type', 50);       // asset_receivable, asset_bank, liability_payable, equity, income, expense, etc.
            $table->foreignId('company_id')->nullable()->constrained('res_company')->nullOnDelete();
            $table->boolean('reconcile')->default(false);
            $table->boolean('deprecated')->default(false);
            $table->string('currency_code', 8)->nullable(); // Override currency
            $table->string('group_name', 100)->nullable();   // Account group (Aset Lancar, Aset Tetap, etc.)
            $table->text('note')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['code', 'company_id']);
        });

        // ────────────────────────────────────────────────
        //  account_journal — Accounting Journals
        //  Types: sale, purchase, bank, cash, general
        // ────────────────────────────────────────────────
        Schema::create('account_journal', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 5)->index();         // e.g. INV, BILL, BNK1, CSH1, MISC
            $table->string('type', 20);                 // sale, purchase, bank, cash, general
            $table->foreignId('default_account_id')->nullable()->constrained('account_account')->nullOnDelete();
            $table->foreignId('company_id')->nullable()->constrained('res_company')->nullOnDelete();
            $table->string('currency_code', 8)->nullable();
            $table->boolean('restrict_mode_hash_table')->default(false);
            $table->string('bank_account_number', 64)->nullable();
            $table->string('bank_name', 100)->nullable();
            $table->integer('sequence')->default(10);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['code', 'company_id']);
        });

        // ────────────────────────────────────────────────
        //  account_tax — Tax Definitions
        //  Indonesian: PPN 11%, PPh 21/22/23/25/26/29/4(2)
        // ────────────────────────────────────────────────
        Schema::create('account_tax', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('amount_type', 20)->default('percent'); // percent, fixed, group, division
            $table->decimal('amount', 16, 4)->default(0);          // Tax rate / amount
            $table->foreignId('tax_group_id')->nullable();          // Group for reporting
            $table->boolean('price_include')->default(false);       // Tax included in price
            $table->boolean('include_base_amount')->default(false); // Include in base for next tax
            $table->string('type_tax_use', 20)->default('sale');    // sale, purchase, none
            $table->foreignId('account_id')->nullable()->constrained('account_account')->nullOnDelete(); // Tax account
            $table->foreignId('refund_account_id')->nullable()->constrained('account_account')->nullOnDelete();
            $table->foreignId('company_id')->nullable()->constrained('res_company')->nullOnDelete();
            $table->string('description', 100)->nullable();
            $table->integer('sequence')->default(1);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // ────────────────────────────────────────────────
        //  account_full_reconcile — Reconciliation Groups
        //  Groups fully reconciled move lines
        // ────────────────────────────────────────────────
        Schema::create('account_full_reconcile', function (Blueprint $table) {
            $table->id();
            $table->string('name');                      // Auto-generated name
            $table->foreignId('exchange_move_id')->nullable(); // Exchange rate difference entry
            $table->timestamps();
        });

        // ────────────────────────────────────────────────
        //  account_move — Journal Entries / Invoices
        //  move_type: entry, out_invoice, out_refund, in_invoice, in_refund
        //  state: draft → posted → cancel
        // ────────────────────────────────────────────────
        Schema::create('account_move', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('/');         // e.g. INV/2026/06/0001
            $table->string('move_type', 20)->default('entry'); // entry, out_invoice, out_refund, in_invoice, in_refund
            $table->foreignId('journal_id')->constrained('account_journal');
            $table->foreignId('partner_id')->nullable()->constrained('res_partner')->nullOnDelete();
            $table->date('invoice_date')->nullable();
            $table->date('date');                          // Accounting date
            $table->date('invoice_date_due')->nullable();  // Due date
            $table->string('state', 20)->default('draft'); // draft, posted, cancel
            $table->string('ref')->nullable();             // Reference / Memo
            $table->string('narration')->nullable();       // Internal notes
            $table->decimal('amount_untaxed', 16, 2)->default(0);
            $table->decimal('amount_tax', 16, 2)->default(0);
            $table->decimal('amount_total', 16, 2)->default(0);
            $table->decimal('amount_residual', 16, 2)->default(0); // Remaining to pay
            $table->string('payment_state', 20)->default('not_paid'); // not_paid, partial, paid, reversed
            $table->foreignId('currency_id')->nullable();
            $table->string('currency_code', 8)->default('IDR');
            $table->foreignId('company_id')->nullable()->constrained('res_company')->nullOnDelete();
            $table->string('sequence_prefix', 30)->nullable(); // e.g. INV/2026/06/
            $table->integer('sequence_number')->nullable();
            $table->boolean('posted_before')->default(false);
            $table->timestamps();

            $table->index(['state', 'move_type']);
            $table->index('partner_id');
            $table->index('journal_id');
            $table->index('date');
        });

        // ────────────────────────────────────────────────
        //  account_move_line — Journal Entry Lines
        //  Double-entry: each line has debit XOR credit
        //  sum(debit) must == sum(credit) per move
        // ────────────────────────────────────────────────
        Schema::create('account_move_line', function (Blueprint $table) {
            $table->id();
            $table->foreignId('move_id')->constrained('account_move')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('account_account');
            $table->foreignId('partner_id')->nullable()->constrained('res_partner')->nullOnDelete();
            $table->foreignId('tax_line_id')->nullable()->constrained('account_tax')->nullOnDelete();
            $table->string('name')->nullable();            // Label / description
            $table->decimal('debit', 16, 2)->default(0);
            $table->decimal('credit', 16, 2)->default(0);
            $table->decimal('balance', 16, 2)->default(0); // debit - credit
            $table->decimal('amount_currency', 16, 2)->default(0);
            $table->string('currency_code', 8)->default('IDR');
            $table->decimal('quantity', 16, 4)->default(1);
            $table->decimal('price_unit', 16, 2)->default(0);
            $table->decimal('price_subtotal', 16, 2)->default(0);
            $table->decimal('price_total', 16, 2)->default(0);
            $table->decimal('discount', 5, 2)->default(0);
            $table->boolean('reconciled')->default(false);
            $table->foreignId('full_reconcile_id')->nullable()->constrained('account_full_reconcile')->nullOnDelete();
            $table->date('date')->nullable();
            $table->date('date_maturity')->nullable();      // Due date for this line
            $table->integer('sequence')->default(10);
            $table->timestamps();

            $table->index('move_id');
            $table->index('account_id');
            $table->index('partner_id');
            $table->index('reconciled');
        });

        // ────────────────────────────────────────────────
        //  account_payment — Payment Records
        //  Creates account.move with type=entry for payment journal entries
        // ────────────────────────────────────────────────
        Schema::create('account_payment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('move_id')->nullable()->constrained('account_move')->nullOnDelete();
            $table->foreignId('partner_id')->nullable()->constrained('res_partner')->nullOnDelete();
            $table->string('payment_type', 20);           // inbound (receive), outbound (send)
            $table->string('partner_type', 20)->nullable(); // customer, supplier
            $table->decimal('amount', 16, 2)->default(0);
            $table->string('currency_code', 8)->default('IDR');
            $table->foreignId('journal_id')->nullable()->constrained('account_journal')->nullOnDelete();
            $table->foreignId('destination_account_id')->nullable()->constrained('account_account')->nullOnDelete();
            $table->string('payment_method', 50)->nullable(); // manual, check, electronic
            $table->string('payment_reference')->nullable();
            $table->date('date');
            $table->string('state', 20)->default('draft'); // draft, posted, cancelled
            $table->boolean('is_reconciled')->default(false);
            $table->boolean('is_matched')->default(false);
            $table->foreignId('company_id')->nullable()->constrained('res_company')->nullOnDelete();
            $table->timestamps();

            $table->index(['state', 'payment_type']);
        });

        // ────────────────────────────────────────────────
        //  Add accounting FK to res_partner
        //  property_account_receivable_id, property_account_payable_id
        // ────────────────────────────────────────────────
        Schema::table('res_partner', function (Blueprint $table) {
            $table->foreignId('property_account_receivable_id')->nullable()->constrained('account_account')->nullOnDelete();
            $table->foreignId('property_account_payable_id')->nullable()->constrained('account_account')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('res_partner', function (Blueprint $table) {
            $table->dropConstrainedForeignId('property_account_receivable_id');
            $table->dropConstrainedForeignId('property_account_payable_id');
        });

        Schema::dropIfExists('account_payment');
        Schema::dropIfExists('account_move_line');
        Schema::dropIfExists('account_move');
        Schema::dropIfExists('account_full_reconcile');
        Schema::dropIfExists('account_tax');
        Schema::dropIfExists('account_journal');
        Schema::dropIfExists('account_account');
    }
};
