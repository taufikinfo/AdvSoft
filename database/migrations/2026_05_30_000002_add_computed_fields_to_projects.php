<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->unsignedBigInteger('partner_id')->nullable()->after('color');
            $table->date('date_start')->nullable()->after('status');
            $table->date('date_end')->nullable()->after('date_start');
            $table->decimal('budget', 12, 2)->default(0)->after('date_end');
            $table->decimal('actual_cost', 12, 2)->default(0)->after('budget');
            $table->integer('task_count')->default(0)->after('actual_cost');
            $table->decimal('progress', 5, 2)->default(0)->after('task_count');
            $table->boolean('allow_timesheets')->default(true)->after('progress');
            $table->string('privacy_visibility')->default('portal')->after('allow_timesheets');

            $table->foreign('partner_id')->references('id')->on('users')->nullOnDelete();
        });

        // Recompute stored task_count and progress for existing projects
        $projects = \App\Models\Project::all();
        foreach ($projects as $project) {
            $taskCount = \App\Models\Task::where('project_id', $project->id)->count();
            $avgProgress = \App\Models\Task::where('project_id', $project->id)->avg('progress') ?: 0;
            $project->update([
                'task_count' => $taskCount,
                'progress' => round($avgProgress, 2),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['partner_id']);
            $table->dropColumn([
                'partner_id', 'date_start', 'date_end', 'budget',
                'actual_cost', 'task_count', 'progress', 'allow_timesheets',
                'privacy_visibility',
            ]);
        });
    }
};
