<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ir_ui_views', function (Blueprint $table) {
            $table->string('key')->nullable()->after('name');           // External XML ID (e.g. 'task.report_document')
            $table->text('arch')->nullable()->change();                 // Change JSON → TEXT for XML content
            $table->string('inherit_group')->nullable()->after('inherit_id'); // Group for inheritance ordering
            $table->boolean('primary')->default(false)->after('inherit_group'); // Primary template flag
        });
    }

    public function down(): void
    {
        Schema::table('ir_ui_views', function (Blueprint $table) {
            $table->dropColumn(['key', 'inherit_group', 'primary']);
            $table->json('arch')->nullable()->change();
        });
    }
};
