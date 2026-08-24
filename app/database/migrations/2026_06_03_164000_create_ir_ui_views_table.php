<?php

use App\Advsoft\Core\Database\Migration;
use App\Advsoft\Core\Database\Blueprint;
use App\Advsoft\Core\Database\Schema;

/**
 * ir_ui_views — Stores custom view definitions (overrides).
 * Equivalent to Odoo's ir.ui.view table.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('ir_ui_views', function (Blueprint $table) {
            $table->id();
            $table->string('name');                   // View name (e.g. "task.list.custom")
            $table->string('model');                   // Target model (e.g. "task")
            $table->string('type');                    // View type: list, form, kanban, calendar, pivot, graph
            $table->json('arch')->nullable();          // The view architecture (JSON)
            $table->integer('priority')->default(16);  // Lower = higher priority
            $table->boolean('active')->default(true);
            $table->unsignedBigInteger('inherit_id')->nullable(); // Parent view
            $table->timestamps();

            $table->index(['model', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ir_ui_views');
    }
};
