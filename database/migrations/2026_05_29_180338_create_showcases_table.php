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
        Schema::create('showcases', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->string('phone')->nullable();
            $table->text('description')->nullable();
            $table->text('html_content')->nullable();
            $table->integer('age')->nullable();
            $table->decimal('score', 10, 2)->nullable();
            $table->decimal('price', 15, 2)->nullable();
            $table->integer('progress')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_favorite')->default(false);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->datetime('deadline')->nullable();
            $table->string('status')->default('draft');
            $table->integer('priority')->default(0);
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->longText('image_data')->nullable(); // for binary image
            $table->longText('document_data')->nullable(); // for pdf
            $table->longText('signature_data')->nullable(); // for signature
            $table->string('color')->nullable();
            $table->string('image_url')->nullable();
            $table->text('domain_data')->nullable();
            $table->text('code_snippet')->nullable();
            $table->timestamps();
        });

        Schema::create('showcase_tag', function (Blueprint $table) {
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
        Schema::dropIfExists('showcase_tag');
        Schema::dropIfExists('showcases');
    }
};
