<?php

namespace Database\Seeders;

use App\Core\Database\Seeder;
use App\Models\Res\ResUser;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(TaskSeeder::class);
        $this->call(MenuSeeder::class);
        $this->call(SecuritySeeder::class);
        $this->call(AccountingSeeder::class);
        $this->call(ShowcaseSeeder::class);
        $this->call(TimesheetSeeder::class);
    }
}
