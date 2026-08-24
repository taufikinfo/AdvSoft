<?php

use App\Advsoft\Core\Database\Migration;
use App\Advsoft\Core\Database\Blueprint;
use App\Advsoft\Core\Database\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menus', function (Blueprint $table) {
            // Add group_ids for Many2many group-based access (comma-separated group IDs)
            if (!Schema::hasColumn('menus', 'group_ids')) {
                $table->string('group_ids')->nullable()->after('groups');
            }
            // Add security_view column for custom SPA views
            if (!Schema::hasColumn('menus', 'security_view')) {
                $table->string('security_view')->nullable()->after('active');
            }
            // Add model + view for simple menu items (without a full action)
            if (!Schema::hasColumn('menus', 'model')) {
                $table->string('model')->nullable()->after('action_id');
            }
            if (!Schema::hasColumn('menus', 'view_type')) {
                $table->string('view_type')->nullable()->after('model');
            }
        });
    }

    public function down(): void
    {
        Schema::table('menus', function (Blueprint $table) {
            $table->dropColumn(['group_ids', 'security_view', 'model', 'view_type']);
        });
    }
};
