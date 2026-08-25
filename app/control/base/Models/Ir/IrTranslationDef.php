<?php

namespace Addons\Base\Models\Ir;

use App\Model\Ir\IrTranslation;
use App\Advsoft\{ModelDefinition, Field};

/**
 * IrTranslationDef — Dynamic Translation Table.
 *
 * AdvSoft equivalent: ir.translation
 * Provides international translation dictionary for:
 *   - Model, Field, View, and Code labels
 *   - Multilingual UI support
 *   - XML synchronization per module
 */
class IrTranslationDef extends ModelDefinition
{
    public string $_name = 'ir.translation';
    public string $_description = 'Translation Dictionary';
    public string $_table = 'ir_translations';
    public string $_order = 'name asc, lang asc';
    public string $_rec_name = 'src';
    public string $modelClass = IrTranslation::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, [
            'string' => 'Name Identifier',
            'required' => true,
            'searchable' => true,
            'sortable' => true,
            'help' => 'Translation target identifier (e.g. account.move.line,string or code)',
        ]);

        $this->addField('lang', Field::SELECTION, [
            'string' => 'Language',
            'required' => true,
            'searchable' => true,
            'sortable' => true,
            'selection' => [
                ['id', 'Indonesian (id_ID)'],
                ['en', 'English (en_US)'],
                ['ar', 'Arabic (ar_AA)'],
                ['es', 'Spanish (es_ES)'],
                ['pt', 'Portuguese (pt_BR)'],
            ],
            'help' => 'Target language code',
        ]);

        $this->addField('type', Field::SELECTION, [
            'string' => 'Type',
            'required' => true,
            'searchable' => true,
            'sortable' => true,
            'selection' => [
                ['code', 'Code / Text'],
                ['field', 'Field Label'],
                ['view', 'View Label / Title'],
                ['model', 'Model Description'],
                ['selection', 'Selection Option'],
                ['help', 'Field Help Text'],
                ['constraint', 'Validation / Constraint'],
            ],
            'default' => 'code',
            'help' => 'Category of translated element',
        ]);

        $this->addField('src', Field::TEXT, [
            'string' => 'Source Term',
            'required' => true,
            'searchable' => true,
            'help' => 'Original text to be translated',
        ]);

        $this->addField('value', Field::TEXT, [
            'string' => 'Translation Value',
            'searchable' => true,
            'help' => 'Translated text in target language',
        ]);

        $this->addField('module', Field::CHAR, [
            'string' => 'Module',
            'searchable' => true,
            'sortable' => true,
            'help' => 'Origin module (e.g. account, base, project)',
        ]);

        $this->addField('state', Field::SELECTION, [
            'string' => 'Status',
            'selection' => [
                ['translated', 'Translated'],
                ['to_translate', 'To Translate'],
                ['draft', 'Draft'],
            ],
            'default' => 'translated',
        ]);

        $this->addField('res_id', Field::INTEGER, [
            'string' => 'Record ID',
            'help' => 'ID of specific record if data translation',
        ]);

        $this->addField('comments', Field::TEXT, [
            'string' => 'Translator Notes',
            'help' => 'Contextual notes for translators',
        ]);
    }

    protected function defineViews(): void
    {
        $this->listView = [
            'string' => 'Translations',
            'fields' => ['name', 'lang', 'type', 'src', 'value', 'module', 'state'],
            'editable' => 'bottom',
            'column_config' => [
                'name'   => ['width' => '220px'],
                'lang'   => ['width' => '100px'],
                'type'   => ['width' => '120px'],
                'src'    => ['width' => '250px'],
                'value'  => ['width' => '250px'],
                'module' => ['width' => '110px'],
                'state'  => [
                    'width' => '110px',
                    'widget' => 'badge',
                    'badge_colors' => [
                        'translated'   => 'success',
                        'to_translate' => 'warning',
                        'draft'        => 'secondary',
                    ],
                ],
            ],
        ];

        $this->formView = [
            'title' => 'src',
            'groups' => [
                [
                    'string' => 'General Information',
                    'col' => 2,
                    'columns' => [
                        ['name', 'lang', 'type', 'module'],
                        ['state', 'res_id'],
                    ],
                ],
                [
                    'string' => 'Translation Content',
                    'col' => 1,
                    'columns' => [
                        ['src', 'value', 'comments'],
                    ],
                ],
            ],
        ];

        $this->searchView = [
            'filters' => [
                ['id' => 'en_translations', 'label' => 'English', 'domain' => [['lang', '=', 'en']]],
                ['id' => 'id_translations', 'label' => 'Indonesian', 'domain' => [['lang', '=', 'id']]],
                ['id' => 'to_translate',     'label' => 'To Translate', 'domain' => [['state', '=', 'to_translate']]],
            ],
            'group_by' => [
                ['field' => 'lang', 'label' => 'Language'],
                ['field' => 'type', 'label' => 'Type'],
                ['field' => 'module', 'label' => 'Module'],
                ['field' => 'state', 'label' => 'Status'],
            ],
            'custom_filter_fields' => ['name', 'src', 'value', 'lang', 'module'],
        ];
    }
}
