<?php

use App\Advsoft\Core\Database\Migration;
use App\Advsoft\Core\Database\Blueprint;
use App\Advsoft\Core\Database\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('showcases', function (Blueprint $table) {
            // New fields added by ShowcaseDef update (2026-06-10)
            if (!Schema::hasColumn('showcases', 'manager_id')) {
                $table->foreignId('manager_id')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('showcases', 'char_badge_demo')) {
                $table->string('char_badge_demo')->nullable()->after('emoji_text');
            }
            if (!Schema::hasColumn('showcases', 'is_checked')) {
                $table->boolean('is_checked')->default(false)->after('bool_btn');
            }
            if (!Schema::hasColumn('showcases', 'pct_pie')) {
                $table->integer('pct_pie')->default(0)->after('toggle_float');
            }
            if (!Schema::hasColumn('showcases', 'state_selection_demo')) {
                $table->string('state_selection_demo')->nullable()->after('badge_sel');
            }
            if (!Schema::hasColumn('showcases', 'image_binary_demo')) {
                $table->binary('image_binary_demo')->nullable()->after('image_data');
            }
            if (!Schema::hasColumn('showcases', 'date_date')) {
                $table->date('date_date')->nullable()->after('end_date');
            }
            if (!Schema::hasColumn('showcases', 'handle_sort')) {
                $table->integer('handle_sort')->default(0)->after('handle_val');
            }
        });

        // Pivot tables for new many2many demo fields
        if (!Schema::hasTable('showcase_m2m_check')) {
            Schema::create('showcase_m2m_check', function (Blueprint $table) {
                $table->id();
                $table->foreignId('showcase_id')->constrained()->cascadeOnDelete();
                $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('showcase_m2m_all')) {
            Schema::create('showcase_m2m_all', function (Blueprint $table) {
                $table->id();
                $table->foreignId('showcase_id')->constrained()->cascadeOnDelete();
                $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('showcase_m2m_bin')) {
            Schema::create('showcase_m2m_bin', function (Blueprint $table) {
                $table->id();
                $table->foreignId('showcase_id')->constrained()->cascadeOnDelete();
                $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('showcase_m2m_bin');
        Schema::dropIfExists('showcase_m2m_all');
        Schema::dropIfExists('showcase_m2m_check');

        Schema::table('showcases', function (Blueprint $table) {
            $table->dropColumnIfExists([
                'manager_id', 'char_badge_demo', 'is_checked', 'pct_pie',
                'state_selection_demo', 'image_binary_demo', 'date_date', 'handle_sort',
            ]);
        });
    }
};
