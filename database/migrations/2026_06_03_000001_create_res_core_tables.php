<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ────────────────────────────────────────────────
        //  res_partner — base partner (users, contacts, …)
        //  In Odoo: res.partner is the central contact table
        // ────────────────────────────────────────────────
        Schema::create('res_partner', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable()->index();
            $table->string('phone')->nullable();
            $table->string('image')->nullable();           // avatar / profile picture
            $table->boolean('active')->default(true);
            $table->boolean('is_company')->default(false);
            $table->foreignId('company_id')->nullable();
            $table->string('type')->default('contact');    // 'contact' | 'invoice' | 'delivery' | 'private'
            $table->string('parent_path')->nullable();     // for nested hierarchy
            $table->timestamps();
        });

        // ────────────────────────────────────────────────
        //  res_company — multi-company support
        // ────────────────────────────────────────────────
        Schema::create('res_company', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('code', 8)->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('logo')->nullable();
            $table->string('currency_code', 8)->default('USD');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // ────────────────────────────────────────────────
        //  res_groups_category — group category (folder)
        // ────────────────────────────────────────────────
        Schema::create('res_groups_category', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->integer('sequence')->default(10);
            $table->timestamps();
        });

        // ────────────────────────────────────────────────
        //  res_groups — security groups (roles)
        //  In Odoo: res.groups owns model_access and rule_groups
        // ────────────────────────────────────────────────
        Schema::create('res_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->foreignId('category_id')
                ->nullable()
                ->constrained('res_groups_category')
                ->nullOnDelete();
            $table->boolean('share')->default(false);  // portal/public users
            $table->timestamps();

            $table->index('category_id');
        });

        // ────────────────────────────────────────────────
        //  res_groups_implied — transitive inheritance
        //  If group A implies group B, members of A are also members of B
        // ────────────────────────────────────────────────
        Schema::create('res_groups_implied_rel', function (Blueprint $table) {
            $table->foreignId('group_id')->constrained('res_groups')->cascadeOnDelete();
            $table->foreignId('implied_id')->constrained('res_groups')->cascadeOnDelete();
            $table->primary(['group_id', 'implied_id']);
        });

        // ────────────────────────────────────────────────
        //  res_users — application users
        // ────────────────────────────────────────────────
        Schema::create('res_users', function (Blueprint $table) {
            $table->id();
            $table->string('login')->unique();
            $table->string('password');             // bcrypt hashed
            $table->string('name')->nullable();
            $table->string('email')->nullable()->index();
            $table->foreignId('partner_id')
                ->nullable()
                ->constrained('res_partner')
                ->nullOnDelete();
            $table->foreignId('company_id')
                ->nullable()
                ->constrained('res_company')
                ->nullOnDelete();
            $table->boolean('active')->default(true)->index();
            $table->boolean('share')->default(false);          // portal user
            $table->string('signature')->nullable();           // chatter signature
            $table->timestamp('last_login_at')->nullable();
            $table->string('last_login_ip', 45)->nullable();
            $table->string('remember_token', 100)->nullable();
            $table->timestamps();
        });

        // ────────────────────────────────────────────────
        //  res_users_groups_rel — M2M users ↔ groups
        // ────────────────────────────────────────────────
        Schema::create('res_users_groups_rel', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained('res_users')->cascadeOnDelete();
            $table->foreignId('group_id')->constrained('res_groups')->cascadeOnDelete();
            $table->primary(['user_id', 'group_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('res_users_groups_rel');
        Schema::dropIfExists('res_users');
        Schema::dropIfExists('res_groups_implied_rel');
        Schema::dropIfExists('res_groups');
        Schema::dropIfExists('res_groups_category');
        Schema::dropIfExists('res_company');
        Schema::dropIfExists('res_partner');
    }
};
