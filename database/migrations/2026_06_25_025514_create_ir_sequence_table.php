<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ir_sequence', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();          // e.g. 'account.move' 
            $table->string('prefix')->nullable();       // e.g. 'INV/'
            $table->string('suffix')->nullable();       // e.g. '/{year}'
            $table->integer('padding')->default(4);     // zero-padding → 0001
            $table->integer('number_next')->default(1); // next number to use
            $table->integer('number_increment')->default(1);
            $table->unsignedBigInteger('company_id')->nullable();
            $table->boolean('use_date_range')->default(false);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // Date range sub-sequences (for fiscal year resets)
        Schema::create('ir_sequence_date_range', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sequence_id');
            $table->date('date_from');
            $table->date('date_to');
            $table->integer('number_next')->default(1);
            $table->timestamps();
            $table->foreign('sequence_id')->references('id')->on('ir_sequence')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ir_sequence_date_range');
        Schema::dropIfExists('ir_sequence');
    }
};
