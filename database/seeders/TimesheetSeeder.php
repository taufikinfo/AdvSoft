<?php

namespace Database\Seeders;

use App\Advsoft\Core\Database\Seeder;
use App\Models\TaskTimesheet;
use App\Models\Task;
use App\Models\Res\ResUser;

class TimesheetSeeder extends Seeder
{
    public function run(): void
    {
        $tasks = Task::limit(5)->get();
        $user = ResUser::first();

        if (!$user) {
            return;
        }

        foreach ($tasks as $task) {
            TaskTimesheet::create([
                'task_id' => $task->id,
                'date' => date('Y-m-d', strtotime('-' . rand(1, 10) . ' days')),
                'user_id' => $user->id,
                'name' => 'Worked on ' . $task->name,
                'unit_amount' => rand(1, 8) + (rand(0, 1) ? 0.5 : 0),
            ]);
            
            TaskTimesheet::create([
                'task_id' => $task->id,
                'date' => date('Y-m-d', strtotime('-' . rand(1, 10) . ' days')),
                'user_id' => $user->id,
                'name' => 'Code review for ' . $task->name,
                'unit_amount' => rand(1, 3) + (rand(0, 1) ? 0.5 : 0),
            ]);
        }
    }
}
