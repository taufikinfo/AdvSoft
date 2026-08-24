<?php

use App\Advsoft\Core\Database\Migration;
use App\Advsoft\Core\Database\Blueprint;
use App\Advsoft\Core\Database\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ────────────────────────────────────────────────
        //  ir_model — registry of every business model
        //  Populated at runtime by SecurityRegistry::sync()
        // ────────────────────────────────────────────────
        Schema::create('ir_model', function (Blueprint $table) {
            $table->id();
            $table->string('model')->unique();      // e.g. 'res.users', 'project.task'
            $table->string('name');                  // human label, e.g. 'Project Task'
            $table->string('module', 64)->nullable();
            $table->text('description')->nullable();
            $table->boolean('transient')->default(false);
            $table->timestamps();
        });

        // ────────────────────────────────────────────────
        //  ir_model_access — model-level ACL (ir.model.access.csv in Odoo)
        //  One row per (model, group, perm_*)
        //  No group = applies to everyone (e.g. res.partner public read)
        // ────────────────────────────────────────────────
        Schema::create('ir_model_access', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();      // human label
            $table->foreignId('model_id')
                ->constrained('ir_model')
                ->cascadeOnDelete();
            $table->foreignId('group_id')
                ->nullable()
                ->constrained('res_groups')
                ->nullOnDelete();
            $table->boolean('perm_read')->default(false);
            $table->boolean('perm_write')->default(false);
            $table->boolean('perm_create')->default(false);
            $table->boolean('perm_unlink')->default(false);
            $table->boolean('active')->default(true);
            $table->timestamps();

            // Odoo behavior: one ACL row per (model, group)
            $table->unique(['model_id', 'group_id'], 'ir_model_access_model_group_uniq');
        });

        // ────────────────────────────────────────────────
        //  ir_rule — record rules (ir.rule in Odoo)
        //  Filters records visible/operable via a domain expression
        //  global=true means applies to all users (no groups restriction)
        // ────────────────────────────────────────────────
        Schema::create('ir_rule', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('model_id')
                ->constrained('ir_model')
                ->cascadeOnDelete();
            $table->text('domain_force');            // e.g. [('user_id','=',__user_id__)]
            $table->boolean('global')->default(false);
            $table->boolean('perm_read')->default(true);
            $table->boolean('perm_write')->default(false);
            $table->boolean('perm_create')->default(false);
            $table->boolean('perm_unlink')->default(false);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['model_id', 'active']);
        });

        // M2M: ir_rule ↔ res_groups
        Schema::create('ir_rule_groups_rel', function (Blueprint $table) {
            $table->foreignId('rule_id')->constrained('ir_rule')->cascadeOnDelete();
            $table->foreignId('group_id')->constrained('res_groups')->cascadeOnDelete();
            $table->primary(['rule_id', 'group_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ir_rule_groups_rel');
        Schema::dropIfExists('ir_rule');
        Schema::dropIfExists('ir_model_access');
        Schema::dropIfExists('ir_model');
    }
};
