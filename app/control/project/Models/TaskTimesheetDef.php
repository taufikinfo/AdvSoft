<?php

namespace Addons\Project\Models;

use App\Odoo\ModelDefinition;

class TaskTimesheetDef extends ModelDefinition
{
    public string $_name = 'task.timesheet';
    public string $_description = 'Timesheet';
    public string $_table = 'task_timesheets';
    public string $_rec_name = 'name';
    public string $modelClass = \App\Models\TaskTimesheet::class;

    protected function defineFields(): void
    {
        $this->addField('id', \App\Odoo\Field::INTEGER, ['string' => 'ID', 'readonly' => true]);
        $this->addField('date', \App\Odoo\Field::DATE, [
            'string' => 'Date',
            'required' => true,
            'default' => fn() => date('Y-m-d'),
        ]);
        $this->addField('user_id', \App\Odoo\Field::MANY2ONE, [
            'string' => 'Employee',
            'relation' => 'res.users',
            'required' => true,
            'default' => 1,
        ]);
        $this->addField('name', \App\Odoo\Field::CHAR, [
            'string' => 'Description',
            'default' => 'Timesheet entry',
        ]);
        $this->addField('unit_amount', \App\Odoo\Field::FLOAT, [
            'string' => 'Hours Spent',
            'default' => 0.0,
        ]);
        $this->addField('task_id', \App\Odoo\Field::MANY2ONE, [
            'string' => 'Task',
            'relation' => 'task',
            'required' => true,
        ]);
    }

    protected function defineViews(): void
    {
        $this->listView = [
            'editable' => 'bottom', // Mengubah menjadi inline tree
            'columns' => [
                ['name' => 'date', 'label' => 'Date'],
                ['name' => 'user_id', 'label' => 'Employee'],
                ['name' => 'name', 'label' => 'Description'],
                ['name' => 'unit_amount', 'label' => 'Hours Spent'],
            ],
        ];

        $this->formView = [
            'groups' => [
                [
                    'name' => 'main',
                    'columns' => [
                        ['date', 'user_id', 'name', 'unit_amount']
                    ]
                ]
            ]
        ];
    }

    protected function defineBusinessLogic(): void
    {
        // Daftarkan event onchange untuk field user_id (Employee)
        $this->apiOnchange('onchangeEmployee', ['user_id']);
    }

    /** 
     * @api.onchange('user_id')
     * Otomatis mengisi Description saat Employee dipilih
     */
    public function onchangeEmployee(string $field, array $values): array
    {
        if (!empty($values['user_id'])) {
            $userId = is_array($values['user_id']) ? $values['user_id'][0] : $values['user_id'];

            // Ambil data user dari model User (res.users)
            $userDef = \App\Odoo\Registry::get('res.users');
            if ($userDef && $userId) {
                $user = $userDef->modelClass::find($userId);
                if ($user) {
                    // Jika description (name) masih kosong, isi otomatis
                    if (empty($values['name'])) {
                        $values['name'] = "Timesheet by " . $user->name;
                    }
                }
            }
        }

        // Auto-set tanggal ke hari ini jika kosong
        if (empty($values['date'])) {
            $values['date'] = now()->format('Y-m-d');
        }

        return $values;
    }
}
