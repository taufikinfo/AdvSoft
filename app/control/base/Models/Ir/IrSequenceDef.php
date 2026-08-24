<?php

namespace Addons\Base\Models\Ir;

use App\Model\Ir\IrSequence;
use App\Advsoft\{ModelDefinition, Field};

/**
 * IrSequenceDef — Sequence Generator (auto-incrementing codes).
 * 
 * AdvSoft equivalent: ir.sequence
 * Configurable from the UI — generates: INV/2026/0001, SO0001, PO0001, etc.
 * 
 * Usage in code:
 *   IrSequence::nextByCode('account.move');     → 'INV/2026/0001'
 *   IrSequence::nextByCode('sale.order');        → 'SO0001'
 */
class IrSequenceDef extends ModelDefinition
{
    public string $_name = 'ir.sequence';
    public string $_description = 'Sequences';
    public string $_table = 'ir_sequence';
    public string $_order = 'name asc';
    public string $_rec_name = 'name';
    public string $modelClass = IrSequence::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, [
            'string' => 'Sequence Name',
            'required' => true,
            'searchable' => true,
        ]);

        $this->addField('code', Field::CHAR, [
            'string' => 'Sequence Code',
            'required' => true,
            'searchable' => true,
            'help' => 'Unique identifier used in code: e.g. account.move, sale.order',
        ]);

        $this->addField('prefix', Field::CHAR, [
            'string' => 'Prefix',
            'help' => 'e.g. INV/{year}/ — Supports: {year}, {month}, {day}, {y}',
        ]);

        $this->addField('suffix', Field::CHAR, [
            'string' => 'Suffix',
            'help' => 'e.g. /{year} — Supports: {year}, {month}, {day}, {y}',
        ]);

        $this->addField('padding', Field::INTEGER, [
            'string' => 'Sequence Size',
            'default' => 4,
            'help' => 'Number of digits with zero-padding (4 → 0001)',
        ]);

        $this->addField('number_next', Field::INTEGER, [
            'string' => 'Next Number',
            'default' => 1,
        ]);

        $this->addField('number_increment', Field::INTEGER, [
            'string' => 'Step',
            'default' => 1,
        ]);

        $this->addField('company_id', Field::MANY2ONE, [
            'string' => 'Company',
            'relation' => 'res.company',
        ]);

        $this->addField('use_date_range', Field::BOOLEAN, [
            'string' => 'Use Date Range',
            'default' => false,
            'help' => 'If checked, sequence resets per fiscal year',
        ]);

        $this->addField('active', Field::BOOLEAN, [
            'string' => 'Active',
            'default' => true,
        ]);
    }

    protected function defineViews(): void
    {
        $this->listView = [
            'string' => 'Sequences',
            'fields' => ['name', 'code', 'prefix', 'suffix', 'padding', 'number_next', 'use_date_range'],
            'column_config' => [
                'code' => ['width' => '200px'],
                'padding' => ['width' => '80px'],
                'number_next' => ['width' => '100px'],
            ],
        ];

        $this->formView = [
            'title' => 'name',
            'groups' => [
                [
                    'string' => null,
                    'columns' => [
                        ['name', 'code', 'active'],
                        ['company_id', 'use_date_range'],
                    ],
                ],
                [
                    'string' => 'Numbering',
                    'columns' => [
                        ['prefix', 'suffix'],
                        ['padding', 'number_next', 'number_increment'],
                    ],
                ],
            ],
        ];

        $this->searchView = [
            'filters' => [
                ['name' => 'active', 'string' => 'Active', 'domain' => [['active', '=', true]]],
            ],
            'group_by' => [
                ['field' => 'company_id', 'string' => 'Company'],
            ],
        ];
    }

    protected function defineSecurity(): void
    {
        $this->setAccess(['read' => true, 'write' => true, 'create' => true, 'unlink' => true]);
    }
}
