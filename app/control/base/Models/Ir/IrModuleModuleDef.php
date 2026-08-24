<?php

namespace Addons\Base\Models\Ir;

use App\Model\Ir\IrModuleModule;
use App\Advsoft\{ModelDefinition, Field};

/**
 * IrModuleModuleDef — Module Manager.
 * 
 * AdvSoft equivalent: ir.module.module
 * Displays installed/available addon modules and their state.
 */
class IrModuleModuleDef extends ModelDefinition
{
    public string $_name = 'ir.module.module';
    public string $_description = 'Modules';
    public string $_table = 'ir_module_module';
    public string $_order = 'name asc';
    public string $_rec_name = 'display_name';
    public string $modelClass = IrModuleModule::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, [
            'string' => 'Technical Name',
            'required' => true,
            'searchable' => true,
            'sortable' => true,
            'readonly' => true,
        ]);

        $this->addField('display_name', Field::CHAR, [
            'string' => 'Module Name',
            'required' => true,
            'searchable' => true,
        ]);

        $this->addField('version', Field::CHAR, [
            'string' => 'Version',
            'readonly' => true,
        ]);

        $this->addField('category', Field::CHAR, [
            'string' => 'Category',
            'searchable' => true,
            'groupable' => true,
        ]);

        $this->addField('state', Field::SELECTION, [
            'string' => 'State',
            'selection' => [
                ['uninstalled', 'Not Installed'],
                ['installed', 'Installed'],
                ['to_upgrade', 'To Upgrade'],
                ['to_remove', 'To Remove'],
            ],
            'default' => 'uninstalled',
            'widget' => 'badge',
        ]);

        $this->addField('auto_install', Field::BOOLEAN, [
            'string' => 'Auto Install',
            'default' => false,
            'readonly' => true,
        ]);

        $this->addField('installed_at', Field::DATETIME, [
            'string' => 'Installed On',
            'readonly' => true,
        ]);
    }

    protected function defineViews(): void
    {
        $this->listView = [
            'string' => 'Apps & Modules',
            'fields' => ['display_name', 'name', 'version', 'category', 'state', 'installed_at'],
            'column_config' => [
                'state' => ['widget' => 'badge'],
                'name' => ['width' => '180px'],
            ],
            'decoration' => [
                'decoration-success' => "state == 'installed'",
                'decoration-muted' => "state == 'uninstalled'",
            ],
        ];

        $this->formView = [
            'title' => 'display_name',
            'statusbar' => 'state',
            'statusbar_clickable' => false,
            'statusbar_visible' => 'uninstalled,installed',
            'header_buttons' => [
                [
                    'name' => 'action_install',
                    'string' => 'Install',
                    'type' => 'object',
                    'class' => 'ls-btn-primary',
                    'invisible' => "state != 'uninstalled'",
                ],
                [
                    'name' => 'action_upgrade',
                    'string' => 'Upgrade',
                    'type' => 'object',
                    'class' => 'ls-btn-secondary',
                    'invisible' => "state != 'installed'",
                ],
            ],
            'groups' => [
                [
                    'columns' => [
                        ['display_name', 'name', 'category'],
                        ['version', 'state', 'auto_install'],
                    ],
                ],
            ],
        ];

        $this->searchView = [
            'filters' => [
                ['name' => 'installed', 'string' => 'Installed', 'domain' => [['state', '=', 'installed']]],
                ['name' => 'not_installed', 'string' => 'Not Installed', 'domain' => [['state', '=', 'uninstalled']]],
            ],
            'group_by' => [
                ['field' => 'category', 'string' => 'Category'],
                ['field' => 'state', 'string' => 'State'],
            ],
        ];
    }

    protected function defineSecurity(): void
    {
        $this->setAccess(['read' => true, 'write' => true, 'create' => false, 'unlink' => false]);
    }

    /**
     * Button action: Install module.
     */
    public function action_install($record, $values): array
    {
        // Trigger the module installer
        $installer = app(\App\Advsoft\ModuleInstaller::class);
        $installer->install($record->name);
        
        return ['success' => true, 'message' => "Module '{$record->display_name}' installed successfully."];
    }

    /**
     * Button action: Upgrade module (re-run data files).
     */
    public function action_upgrade($record, $values): array
    {
        $installer = app(\App\Advsoft\ModuleInstaller::class);
        $installer->upgrade($record->name);
        
        return ['success' => true, 'message' => "Module '{$record->display_name}' upgraded successfully."];
    }
}
