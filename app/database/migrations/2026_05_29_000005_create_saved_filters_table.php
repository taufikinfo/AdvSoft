<?php

use App\Advsoft\Core\Database\Migration;
use App\Advsoft\Core\Database\Blueprint;
use App\Advsoft\Core\Database\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Equivalent to Odoo's ir.filters model – stores saved search queries (Favorites)
        Schema::create('saved_filters', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('model_name'); // e.g. 'task'
            $table->json('domain')->nullable();
            $table->json('group_by')->nullable();
            $table->json('order_by')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_shared')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_filters');
    }
};
