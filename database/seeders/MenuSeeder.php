<?php

namespace Database\Seeders;

use App\Advsoft\Core\Database\Seeder;
use App\Models\Action;
use App\Models\Menu;

/**
 * MenuSeeder — Creates the initial menu structure with actions.
 * Mirrors Odoo's init data for ir.ui.menu + ir.actions.act_window.
 */
class MenuSeeder extends Seeder
{
    public function run(): void
    {
        // ── Actions ─────────────────────────────────────
        $actions = [
            'project' => Action::updateOrCreate(
                ['res_model' => 'project.project'],
                ['name' => 'Projects', 'view_mode' => 'kanban,list,form,spreadsheet', 'type' => 'ir.actions.act_window']
            ),
            'task' => Action::updateOrCreate(
                ['res_model' => 'project.task'],
                ['name' => 'Tasks', 'view_mode' => 'list,kanban,form,calendar,graph,pivot,spreadsheet', 'type' => 'ir.actions.act_window']
            ),
            'showcase' => Action::updateOrCreate(
                ['res_model' => 'showcase.model'],
                ['name' => 'Showcase', 'view_mode' => 'form', 'type' => 'ir.actions.act_window']
            ),

            // ── Accounting Actions ──────────────────────
            'account_move' => Action::updateOrCreate(
                ['name' => 'Journal Entries', 'res_model' => 'account.move'],
                ['view_mode' => 'list,form,graph,pivot,spreadsheet', 'type' => 'ir.actions.act_window', 'domain' => null, 'context' => null]
            ),
            'account_move_out' => Action::updateOrCreate(
                ['name' => 'Customer Invoices', 'res_model' => 'account.move'],
                [
                    'view_mode' => 'list,form,graph,pivot,spreadsheet',
                    'type' => 'ir.actions.act_window',
                    'domain' => json_encode([['move_type', '=', 'out_invoice']]),
                    'context' => json_encode(['default_move_type' => 'out_invoice'])
                ]
            ),
            'account_move_in' => Action::updateOrCreate(
                ['name' => 'Vendor Bills', 'res_model' => 'account.move'],
                [
                    'view_mode' => 'list,form,graph,pivot,spreadsheet',
                    'type' => 'ir.actions.act_window',
                    'domain' => json_encode([['move_type', '=', 'in_invoice']]),
                    'context' => json_encode(['default_move_type' => 'in_invoice'])
                ]
            ),
            'account_move_line' => Action::updateOrCreate(
                ['name' => 'Journal Items', 'res_model' => 'account.move.line'],
                ['view_mode' => 'list,form,pivot,spreadsheet', 'type' => 'ir.actions.act_window']
            ),
            'account_account' => Action::updateOrCreate(
                ['name' => 'Chart of Accounts', 'res_model' => 'account.account'],
                ['view_mode' => 'list,form', 'type' => 'ir.actions.act_window']
            ),
            'account_journal' => Action::updateOrCreate(
                ['name' => 'Journals', 'res_model' => 'account.journal'],
                ['view_mode' => 'list,form', 'type' => 'ir.actions.act_window']
            ),
            'account_tax' => Action::updateOrCreate(
                ['name' => 'Taxes', 'res_model' => 'account.tax'],
                ['view_mode' => 'list,form', 'type' => 'ir.actions.act_window']
            ),
            'account_payment' => Action::updateOrCreate(
                ['name' => 'Payments', 'res_model' => 'account.payment'],
                ['view_mode' => 'list,form', 'type' => 'ir.actions.act_window']
            ),
        ];

        // ── Root App: Project ───────────────────────────
        $projectApp = Menu::updateOrCreate(
            ['name' => 'Project', 'parent_id' => null],
            [
                'sequence' => 10,
                'icon' => 'briefcase',
                'web_icon' => 'briefcase',
                'web_icon_color' => '#7C3AED',
                'active' => true,
            ]
        );

        Menu::updateOrCreate(
            ['name' => 'Projects', 'parent_id' => $projectApp->id],
            ['action_id' => $actions['project']->id, 'sequence' => 10, 'icon' => 'folder']
        );
        Menu::updateOrCreate(
            ['name' => 'Tasks', 'parent_id' => $projectApp->id],
            ['action_id' => $actions['task']->id, 'sequence' => 20, 'icon' => 'check-square']
        );

        Menu::updateOrCreate([
            'name' => 'Custom Page',
            'parent_id' =>  $projectApp->id,
            'security_view' => 'my_custom_page', // <--- Harus sama persis dengan string di owl-root-tpl.js
            'sequence' => 10,
            'icon' => 'star'
        ]);

        // ── Root App: Accounting ────────────────────────
        $accountingApp = Menu::updateOrCreate(
            ['name' => 'Accounting', 'parent_id' => null],
            [
                'sequence' => 15,
                'icon' => 'book-open',
                'web_icon' => 'book-open',
                'web_icon_color' => '#0d9488',
                'active' => true,
            ]
        );

        // Accounting submenus
        Menu::updateOrCreate(
            ['name' => 'Journal Entries', 'parent_id' => $accountingApp->id],
            ['action_id' => $actions['account_move']->id, 'sequence' => 10, 'icon' => 'file-text']
        );
        Menu::updateOrCreate(
            ['name' => 'Customer Invoices', 'parent_id' => $accountingApp->id],
            ['action_id' => $actions['account_move_out']->id, 'sequence' => 20, 'icon' => 'send']
        );
        Menu::updateOrCreate(
            ['name' => 'Vendor Bills', 'parent_id' => $accountingApp->id],
            ['action_id' => $actions['account_move_in']->id, 'sequence' => 30, 'icon' => 'inbox']
        );
        Menu::updateOrCreate(
            ['name' => 'Payments', 'parent_id' => $accountingApp->id],
            ['action_id' => $actions['account_payment']->id, 'sequence' => 40, 'icon' => 'credit-card']
        );
        Menu::updateOrCreate(
            ['name' => 'Journal Items', 'parent_id' => $accountingApp->id],
            ['action_id' => $actions['account_move_line']->id, 'sequence' => 50, 'icon' => 'list']
        );

        // Reporting submenu group
        $accountingReporting = Menu::updateOrCreate(
            ['name' => 'Reporting', 'parent_id' => $accountingApp->id],
            ['sequence' => 80, 'icon' => 'bar-chart-2', 'action_id' => null]
        );
        Menu::updateOrCreate(
            ['name' => 'Financial Reports', 'parent_id' => $accountingReporting->id],
            ['security_view' => 'accounting_reports', 'sequence' => 10, 'icon' => 'file-text']
        );

        // Configuration submenu group
        $accountingConfig = Menu::updateOrCreate(
            ['name' => 'Configuration', 'parent_id' => $accountingApp->id],
            ['sequence' => 90, 'icon' => 'settings', 'action_id' => null]
        );
        Menu::updateOrCreate(
            ['name' => 'Chart of Accounts', 'parent_id' => $accountingConfig->id],
            ['action_id' => $actions['account_account']->id, 'sequence' => 10, 'icon' => 'git-branch']
        );
        Menu::updateOrCreate(
            ['name' => 'Journals', 'parent_id' => $accountingConfig->id],
            ['action_id' => $actions['account_journal']->id, 'sequence' => 20, 'icon' => 'book']
        );
        Menu::updateOrCreate(
            ['name' => 'Taxes', 'parent_id' => $accountingConfig->id],
            ['action_id' => $actions['account_tax']->id, 'sequence' => 30, 'icon' => 'percent']
        );




        // ── Root App: Showcase ──────────────────────────
        $showcaseApp = Menu::updateOrCreate(
            ['name' => 'Showcase', 'parent_id' => null],
            [
                'action_id' => $actions['showcase']->id,
                'sequence' => 20,
                'icon' => 'eye',
                'web_icon' => 'eye',
                'web_icon_color' => '#059669',
                'active' => true,
            ]
        );

        // ── Root App: Security ──────────────────────────
        $securityApp = Menu::updateOrCreate(
            ['name' => 'Security', 'parent_id' => null],
            [
                'sequence' => 30,
                'icon' => 'shield',
                'web_icon' => 'shield',
                'web_icon_color' => '#dc2626',
                'active' => true,
            ]
        );

        Menu::updateOrCreate(
            ['name' => 'Overview', 'parent_id' => $securityApp->id],
            ['security_view' => 'security_overview', 'sequence' => 10, 'icon' => 'shield']
        );
        Menu::updateOrCreate(
            ['name' => 'Access Rights', 'parent_id' => $securityApp->id],
            ['security_view' => 'security_access', 'sequence' => 20, 'icon' => 'key']
        );
        Menu::updateOrCreate(
            ['name' => 'Record Rules', 'parent_id' => $securityApp->id],
            ['security_view' => 'security_rules', 'sequence' => 30, 'icon' => 'filter']
        );
        Menu::updateOrCreate(
            ['name' => 'Groups', 'parent_id' => $securityApp->id],
            ['security_view' => 'security_groups', 'sequence' => 40, 'icon' => 'users']
        );
        Menu::updateOrCreate(
            ['name' => 'Users', 'parent_id' => $securityApp->id],
            ['security_view' => 'security_users', 'sequence' => 50, 'icon' => 'user']
        );
        Menu::updateOrCreate(
            ['name' => 'Menu Items', 'parent_id' => $securityApp->id],
            ['security_view' => 'menu_editor', 'sequence' => 60, 'icon' => 'layout-list']
        );
        Menu::updateOrCreate(
            ['name' => 'View Builder', 'parent_id' => $securityApp->id],
            ['security_view' => 'view_builder', 'sequence' => 70, 'icon' => 'layout-template']
        );
        Menu::updateOrCreate(
            ['name' => 'Actions', 'parent_id' => $securityApp->id],
            ['model' => 'ir.action', 'view_type' => 'list', 'sequence' => 80, 'icon' => 'zap']
        );
        Menu::updateOrCreate(
            ['name' => 'Companies', 'parent_id' => $securityApp->id],
            ['model' => 'res.company', 'view_type' => 'list', 'sequence' => 90, 'icon' => 'building']
        );
        Menu::updateOrCreate(
            ['name' => 'Models Registry', 'parent_id' => $securityApp->id],
            ['model' => 'ir.model', 'view_type' => 'list', 'sequence' => 100, 'icon' => 'database']
        );

        $this->command?->info('Menu tree seeded: ' . Menu::count() . ' items, ' . Action::count() . ' actions');
    }
}
