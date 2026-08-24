<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Stage;
use App\Models\Tag;
use App\Models\Task;
use App\Advsoft\Core\Database\Seeder;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        // Create stages (like Odoo project stages)
        $stages = [
            Stage::create(['name' => 'New', 'sequence' => 1]),
            Stage::create(['name' => 'In Progress', 'sequence' => 2]),
            Stage::create(['name' => 'Review', 'sequence' => 3]),
            Stage::create(['name' => 'Done', 'sequence' => 4, 'fold' => true]),
            Stage::create(['name' => 'Cancelled', 'sequence' => 5, 'fold' => true]),
        ];

        // Create projects
        $projects = [
            Project::create([
                'name' => 'Website Redesign',
                'color' => '#6366f1',
                'description' => 'Complete website overhaul',
                'status' => 'active',
                'partner_id' => 1,
                'budget' => 25000,
                'date_start' => date('Y-01-01'),
                'date_end' => date('Y-06-30'),
            ]),
            Project::create([
                'name' => 'Mobile App',
                'color' => '#ec4899',
                'description' => 'iOS and Android mobile application',
                'status' => 'active',
                'partner_id' => 2,
                'budget' => 45000,
                'date_start' => date('Y-02-15'),
                'date_end' => date('Y-08-31'),
            ]),
            Project::create([
                'name' => 'ERP Integration',
                'color' => '#f59e0b',
                'description' => 'Integrate with ERP system',
                'status' => 'draft',
                'partner_id' => 1,
                'budget' => 60000,
                'date_start' => date('Y-04-01'),
                'date_end' => date('Y-12-31'),
            ]),
            Project::create([
                'name' => 'Marketing Campaign',
                'color' => '#10b981',
                'description' => 'Q3 marketing push',
                'status' => 'cancelled',
                'partner_id' => 2,
                'budget' => 15000,
                'date_start' => date('Y-03-01'),
                'date_end' => date('Y-05-31'),
            ]),
            Project::create([
                'name' => 'Legacy Migration',
                'color' => '#8b5cf6',
                'description' => 'Migrate legacy infrastructure',
                'status' => 'archived',
                'partner_id' => 1,
                'budget' => 12000,
                'date_start' => date('Y-01-15', strtotime('-1 year')),
                'date_end' => date('Y-11-30', strtotime('-1 year')),
            ]),
        ];

        // Create tags
        $tags = [
            Tag::create(['name' => 'Bug', 'color' => '#ef4444']),
            Tag::create(['name' => 'Feature', 'color' => '#3b82f6']),
            Tag::create(['name' => 'Enhancement', 'color' => '#8b5cf6']),
            Tag::create(['name' => 'Documentation', 'color' => '#06b6d4']),
            Tag::create(['name' => 'Design', 'color' => '#f43f5e']),
            Tag::create(['name' => 'Backend', 'color' => '#f97316']),
            Tag::create(['name' => 'Frontend', 'color' => '#84cc16']),
            Tag::create(['name' => 'Urgent', 'color' => '#dc2626']),
        ];

        $assignees = ['Mitchell Admin', 'Marc Demo', 'John Smith', 'Sarah Connor', 'Alice Wong'];

        $tasks = [
            // Website Redesign tasks
            ['name' => 'Homepage Layout', 'project' => 0, 'stage' => 0, 'assignee' => 0, 'priority' => '0', 'hours' => 16, 'progress' => 0, 'tags' => [4, 6], 'deadline' => '+5 days'],
            ['name' => 'Navigation Component', 'project' => 0, 'stage' => 0, 'assignee' => 3, 'priority' => '1', 'hours' => 8, 'progress' => 0, 'tags' => [6], 'deadline' => '+7 days'],
            ['name' => 'Responsive CSS Grid', 'project' => 0, 'stage' => 1, 'assignee' => 0, 'priority' => '2', 'hours' => 12, 'progress' => 40, 'tags' => [4, 6], 'deadline' => '+3 days'],
            ['name' => 'Contact Form', 'project' => 0, 'stage' => 1, 'assignee' => 2, 'priority' => '0', 'hours' => 6, 'progress' => 60, 'tags' => [1, 6], 'deadline' => '+10 days'],
            ['name' => 'SEO Optimization', 'project' => 0, 'stage' => 2, 'assignee' => 4, 'priority' => '1', 'hours' => 10, 'progress' => 80, 'tags' => [2], 'deadline' => '+2 days'],
            ['name' => 'Performance Audit', 'project' => 0, 'stage' => 3, 'assignee' => 0, 'priority' => '0', 'hours' => 4, 'progress' => 100, 'tags' => [3], 'deadline' => '-1 days'],
            ['name' => 'Browser Compatibility', 'project' => 0, 'stage' => 3, 'assignee' => 2, 'priority' => '0', 'hours' => 8, 'progress' => 100, 'tags' => [0], 'deadline' => '-3 days'],

            // Mobile App tasks
            ['name' => 'Authentication Flow', 'project' => 1, 'stage' => 0, 'assignee' => 1, 'priority' => '3', 'hours' => 20, 'progress' => 0, 'tags' => [1, 5], 'deadline' => '+14 days'],
            ['name' => 'Push Notifications', 'project' => 1, 'stage' => 0, 'assignee' => 3, 'priority' => '2', 'hours' => 16, 'progress' => 0, 'tags' => [1], 'deadline' => '+21 days'],
            ['name' => 'Offline Mode', 'project' => 1, 'stage' => 1, 'assignee' => 1, 'priority' => '2', 'hours' => 24, 'progress' => 30, 'tags' => [1, 5], 'deadline' => '+10 days'],
            ['name' => 'UI Kit Components', 'project' => 1, 'stage' => 1, 'assignee' => 4, 'priority' => '1', 'hours' => 32, 'progress' => 55, 'tags' => [4, 6], 'deadline' => '+5 days'],
            ['name' => 'API Integration', 'project' => 1, 'stage' => 2, 'assignee' => 2, 'priority' => '0', 'hours' => 12, 'progress' => 90, 'tags' => [5], 'deadline' => '+1 days'],
            ['name' => 'App Store Listing', 'project' => 1, 'stage' => 3, 'assignee' => 0, 'priority' => '0', 'hours' => 3, 'progress' => 100, 'tags' => [3], 'deadline' => '-5 days'],

            // ERP Integration tasks
            ['name' => 'Data Migration Script', 'project' => 2, 'stage' => 0, 'assignee' => 2, 'priority' => '3', 'hours' => 40, 'progress' => 0, 'tags' => [5, 7], 'deadline' => '+7 days'],
            ['name' => 'Invoice Module', 'project' => 2, 'stage' => 1, 'assignee' => 1, 'priority' => '2', 'hours' => 30, 'progress' => 45, 'tags' => [1, 5], 'deadline' => '+14 days'],
            ['name' => 'Inventory Sync', 'project' => 2, 'stage' => 1, 'assignee' => 0, 'priority' => '2', 'hours' => 20, 'progress' => 25, 'tags' => [1, 5], 'deadline' => '+10 days'],
            ['name' => 'Report Generator', 'project' => 2, 'stage' => 2, 'assignee' => 3, 'priority' => '1', 'hours' => 18, 'progress' => 75, 'tags' => [1], 'deadline' => '+3 days'],
            ['name' => 'User Training Docs', 'project' => 2, 'stage' => 3, 'assignee' => 4, 'priority' => '0', 'hours' => 12, 'progress' => 100, 'tags' => [3], 'deadline' => '-2 days'],

            // Marketing Campaign tasks
            ['name' => 'Campaign Strategy', 'project' => 3, 'stage' => 0, 'assignee' => 4, 'priority' => '1', 'hours' => 8, 'progress' => 0, 'tags' => [3], 'deadline' => '+30 days'],
            ['name' => 'Social Media Assets', 'project' => 3, 'stage' => 1, 'assignee' => 3, 'priority' => '0', 'hours' => 16, 'progress' => 50, 'tags' => [4], 'deadline' => '+20 days'],
            ['name' => 'Email Templates', 'project' => 3, 'stage' => 1, 'assignee' => 0, 'priority' => '1', 'hours' => 10, 'progress' => 35, 'tags' => [4, 6], 'deadline' => '+15 days'],
            ['name' => 'Landing Page A/B Test', 'project' => 3, 'stage' => 0, 'assignee' => 2, 'priority' => '2', 'hours' => 14, 'progress' => 0, 'tags' => [1, 6], 'deadline' => '+12 days'],
            ['name' => 'Analytics Dashboard', 'project' => 3, 'stage' => 2, 'assignee' => 1, 'priority' => '0', 'hours' => 20, 'progress' => 85, 'tags' => [1, 5], 'deadline' => '+4 days'],
            ['name' => 'Budget Report', 'project' => 3, 'stage' => 3, 'assignee' => 4, 'priority' => '0', 'hours' => 6, 'progress' => 100, 'tags' => [3], 'deadline' => '-7 days'],
        ];

        foreach ($tasks as $taskData) {
            $task = Task::create([
                'name' => $taskData['name'],
                'project_id' => $projects[$taskData['project']]->id,
                'stage_id' => $stages[$taskData['stage']]->id,
                'assignee' => $assignees[$taskData['assignee']],
                'priority' => $taskData['priority'],
                'planned_hours' => $taskData['hours'],
                'progress' => $taskData['progress'],
                'deadline' => now()->modify($taskData['deadline'])->format('Y-m-d'),
                'active' => true,
            ]);

            $tagIds = array_map(fn($i) => $tags[$i]->id, $taskData['tags']);
            try {
                \Adianti\Database\TTransaction::open('advsoft');
                $conn = \Adianti\Database\TTransaction::get();
                if ($conn instanceof \PDO) {
                    $stmt = $conn->prepare("INSERT INTO task_tag (task_id, tag_id) VALUES (?, ?)");
                    foreach ($tagIds as $tagId) {
                        try {
                            $stmt->execute([$task->id, $tagId]);
                        } catch (\Throwable $e) {}
                    }
                }
                \Adianti\Database\TTransaction::close();
            } catch (\Throwable $e) {}
        }
    }
}
