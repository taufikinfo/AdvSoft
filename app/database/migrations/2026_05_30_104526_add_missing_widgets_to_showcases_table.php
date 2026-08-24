<?php

use App\Advsoft\Core\Database\Migration;
use App\Advsoft\Core\Database\Blueprint;
use App\Advsoft\Core\Database\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('showcases', function (Blueprint $table) {
            $table->integer('color_idx')->nullable();
            $table->text('json_data')->nullable();
            $table->datetime('countdown_time')->nullable();
            $table->text('note_section')->nullable();
            $table->integer('stat_value')->nullable()->default(42);
            $table->string('currency_code')->nullable()->default('EUR');
            $table->decimal('monetary_full', 15, 2)->nullable();
            $table->foreignId('barcode_user')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sel_badge')->nullable()->default('1');
            $table->float('factor_float')->nullable();
            $table->float('toggle_float')->nullable()->default(0.5);
            $table->integer('int_badge')->nullable()->default(5);
            $table->string('lbl_sel')->nullable()->default('b');
        });

        Schema::create('activity_showcase', function (Blueprint $table) {
            $table->id();
            $table->foreignId('showcase_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_showcase');
        
        Schema::table('showcases', function (Blueprint $table) {
            $table->dropForeign(['barcode_user']);
            $table->dropColumn([
                'color_idx', 'json_data', 'countdown_time', 'note_section',
                'stat_value', 'currency_code', 'monetary_full', 'barcode_user',
                'sel_badge', 'factor_float', 'toggle_float', 'int_badge', 'lbl_sel'
            ]);
        });
    }
};
