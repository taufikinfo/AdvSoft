<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('showcases', function (Blueprint $table) {
            $table->string('clipboard_text')->nullable();
            $table->string('emoji_text')->nullable();
            $table->decimal('percent_val', 8, 2)->nullable();
            $table->decimal('time_val', 8, 2)->nullable();
            $table->integer('handle_val')->default(0);
            $table->boolean('bool_btn')->default(false);
            $table->date('date_range')->nullable();
            $table->string('radio_sel')->nullable();
            $table->string('badge_sel')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('showcases', function (Blueprint $table) {
            $table->dropColumn([
                'clipboard_text',
                'emoji_text',
                'percent_val',
                'time_val',
                'handle_val',
                'bool_btn',
                'date_range',
                'radio_sel',
                'badge_sel'
            ]);
        });
    }
};
