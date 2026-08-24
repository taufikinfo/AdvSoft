<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Make account_id nullable on account_move_line.
 *
 * Reason: When using inline tree "Add a line", a blank row is created first
 * and the user fills in the account afterwards. This is the same pattern
 * Odoo uses — lines are created as virtual/temporary records and only
 * validated when the parent entry is posted.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('account_move_line', function (Blueprint $table) {
            $table->foreignId('account_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('account_move_line', function (Blueprint $table) {
            $table->foreignId('account_id')->nullable(false)->change();
        });
    }
};
