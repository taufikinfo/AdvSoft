<?php

namespace Database\Seeders;

use App\Odoo\Core\Database\Seeder;
use App\Models\Showcase;

class ShowcaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Showcase::create([
            'name' => 'Demo Showcase A',
            'email' => 'admin@larasoft.com',
            'age' => 30,
            'price' => 199.99,
            'progress' => 75,
            'status' => 'published',
            'priority' => 2,
            'is_favorite' => true,
            'color_idx' => 3,
            'countdown_time' => date('Y-m-d H:i:s', strtotime('+5 days')),
            'json_data' => '{"theme": "dark", "layout": "fluid"}',
            'monetary_full' => 1500.50,
            'currency_code' => 'USD',
            'sel_badge' => '1',
            'factor_float' => 4.5,
            'toggle_float' => 0.5,
            'int_badge' => 10,
            'lbl_sel' => 'a',
            'note_section' => '[SECTION]Primary Configuration',
        ]);

        Showcase::create([
            'name' => 'Legacy Module B',
            'email' => 'demo@example.com',
            'age' => 45,
            'price' => 49.50,
            'progress' => 20,
            'status' => 'draft',
            'priority' => 0,
            'is_favorite' => false,
            'color_idx' => 8,
            'countdown_time' => date('Y-m-d H:i:s', strtotime('-2 days')),
            'json_data' => '{"enabled": false}',
            'monetary_full' => 300.00,
            'currency_code' => 'EUR',
            'sel_badge' => '0',
            'factor_float' => 2.1,
            'toggle_float' => 1.0,
            'int_badge' => 3,
            'lbl_sel' => 'b',
        ]);
        
        Showcase::create([
            'name' => 'Upcoming Feature C',
            'email' => 'contact@test.net',
            'age' => 22,
            'price' => 0.00,
            'progress' => 100,
            'status' => 'published',
            'priority' => 3,
            'is_favorite' => true,
            'color_idx' => 1,
            'countdown_time' => date('Y-m-d H:i:s', strtotime('+30 days')),
            'json_data' => '{"beta": true}',
            'monetary_full' => 0.00,
            'currency_code' => 'USD',
            'sel_badge' => '2',
            'factor_float' => 10.0,
            'toggle_float' => 0.0,
            'int_badge' => 50,
            'lbl_sel' => 'c',
        ]);
    }
}
