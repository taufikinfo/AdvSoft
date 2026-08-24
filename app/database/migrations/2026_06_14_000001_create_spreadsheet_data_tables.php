<?php

use App\Advsoft\Core\Database\Migration;
use App\Advsoft\Core\Database\Blueprint;
use App\Advsoft\Core\Database\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spreadsheet_data', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->longText('spreadsheet_data')->nullable();
            $table->json('raw_data')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('parent_model', 100)->nullable();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->boolean('is_template')->default(false);
            $table->boolean('is_favorite')->default(false);
            $table->text('thumbnail')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index(['parent_model', 'parent_id']);
            $table->index('is_template');
            $table->index('is_favorite');
            $table->foreign('user_id')->references('id')->on('res_users')->nullOnDelete();
        });

        Schema::create('spreadsheet_collaboration', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('spreadsheet_id');
            $table->unsignedBigInteger('user_id');
            $table->string('cursor_color', 7)->default('#6366f1');
            $table->integer('cursor_col')->nullable();
            $table->integer('cursor_row')->nullable();
            $table->json('selection')->nullable();
            $table->timestamp('last_active_at')->nullable();
            $table->timestamps();

            $table->index('spreadsheet_id');
            $table->index('user_id');
            $table->unique(['spreadsheet_id', 'user_id']);
            $table->foreign('spreadsheet_id')->references('id')->on('spreadsheet_data')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('res_users')->cascadeOnDelete();
        });

        Schema::create('spreadsheet_operations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('spreadsheet_id');
            $table->unsignedBigInteger('user_id');
            $table->string('operation_type', 50);
            $table->json('operation_data');
            $table->bigInteger('revision')->default(0);
            $table->timestamp('applied_at')->nullable();
            $table->timestamps();

            $table->index('spreadsheet_id');
            $table->index('user_id');
            $table->index(['spreadsheet_id', 'revision']);
            $table->foreign('spreadsheet_id')->references('id')->on('spreadsheet_data')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('res_users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spreadsheet_operations');
        Schema::dropIfExists('spreadsheet_collaboration');
        Schema::dropIfExists('spreadsheet_data');
    }
};
