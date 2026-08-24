<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Aligns spreadsheet_operations with the revision-based collaboration sync:
 * - renames `sequence` to `revision`
 * - adds `applied_at`
 * Idempotent: safe to run on databases already using `revision`.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('spreadsheet_operations')) {
            return;
        }

        if (Schema::hasColumn('spreadsheet_operations', 'sequence') && !Schema::hasColumn('spreadsheet_operations', 'revision')) {
            Schema::table('spreadsheet_operations', function ($table) {
                $table->renameColumn('sequence', 'revision');
            });
        } elseif (!Schema::hasColumn('spreadsheet_operations', 'revision')) {
            Schema::table('spreadsheet_operations', function ($table) {
                $table->bigInteger('revision')->default(0);
            });
        }

        if (!Schema::hasColumn('spreadsheet_operations', 'applied_at')) {
            Schema::table('spreadsheet_operations', function ($table) {
                $table->timestamp('applied_at')->nullable();
            });
        }

        if (Schema::hasTable('spreadsheet_collaborations') && !Schema::hasTable('spreadsheet_collaboration')) {
            Schema::rename('spreadsheet_collaborations', 'spreadsheet_collaboration');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('spreadsheet_operations')) {
            if (Schema::hasColumn('spreadsheet_operations', 'revision') && !Schema::hasColumn('spreadsheet_operations', 'sequence')) {
                Schema::table('spreadsheet_operations', function ($table) {
                    $table->renameColumn('revision', 'sequence');
                });
            }
            if (Schema::hasColumn('spreadsheet_operations', 'applied_at')) {
                Schema::table('spreadsheet_operations', function ($table) {
                    $table->dropColumn('applied_at');
                });
            }
        }
    }
};
