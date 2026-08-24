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
            $table->dateTime('datetime_val')->nullable();
            $table->longText('binary_val')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('showcases', function (Blueprint $table) {
            $table->dropColumn(['datetime_val', 'binary_val']);
        });
    }
};
