<?php

use App\Advsoft\Core\Database\Migration;
use App\Advsoft\Core\Database\Blueprint;
use App\Advsoft\Core\Database\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ir_module_module', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();          // addon directory name (e.g. 'account')
            $table->string('display_name');             // from advsoft.json → name
            $table->string('version')->default('1.0.0');
            $table->string('category')->nullable();
            $table->string('state')->default('uninstalled'); // uninstalled, installed, to_upgrade
            $table->text('depends')->nullable();         // JSON array of dependency names
            $table->text('data_files')->nullable();      // JSON array of loaded data files
            $table->boolean('auto_install')->default(false);
            $table->timestamp('installed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ir_module_module');
    }
};
