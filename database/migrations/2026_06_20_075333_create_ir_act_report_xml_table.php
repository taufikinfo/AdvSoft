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
        Schema::create('ir_act_report_xml', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('model');
            $table->string('report_type')->default('qweb-pdf');
            $table->string('report_name');
            $table->string('print_report_name')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ir_act_report_xml');
    }
};
