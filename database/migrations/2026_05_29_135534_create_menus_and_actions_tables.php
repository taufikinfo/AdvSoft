<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ir.actions.act_window equivalent
        Schema::create('actions', function (Blueprint $table) {
            $table->id();
            $table->string('name');                    // Human-readable action name
            $table->string('type')->default('ir.actions.act_window');
            $table->string('res_model');               // Target model name (registry key)
            $table->string('view_mode')->default('list,form'); // Available view modes
            $table->json('domain')->nullable();         // Default domain filter
            $table->json('context')->nullable();        // Default context
            $table->string('target')->default('current'); // current, new, inline
            $table->integer('limit')->default(80);      // Default page size
            $table->string('help')->nullable();         // Empty state help text
            $table->timestamps();
        });

        // ir.ui.menu equivalent
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->string('name');                     // Menu label
            $table->unsignedBigInteger('parent_id')->nullable(); // Parent menu (tree)
            $table->unsignedBigInteger('action_id')->nullable(); // Linked action
            $table->integer('sequence')->default(10);   // Sort order
            $table->string('icon')->nullable();          // Lucide icon name
            $table->string('web_icon')->nullable();      // App icon (for app switcher)
            $table->string('web_icon_color')->nullable(); // App icon bg color
            $table->boolean('active')->default(true);
            $table->string('groups')->nullable();        // Comma-separated group names for access
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('menus')->onDelete('cascade');
            $table->foreign('action_id')->references('id')->on('actions')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menus');
        Schema::dropIfExists('actions');
    }
};
