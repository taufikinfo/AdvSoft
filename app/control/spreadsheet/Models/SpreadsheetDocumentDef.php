<?php

namespace Addons\Spreadsheet\Models;

use App\Model\Spreadsheet\SpreadsheetDocument;
use App\Advsoft\Field;
use App\Advsoft\ModelDefinition;

class SpreadsheetDocumentDef extends ModelDefinition
{
    public string $_name = 'spreadsheet.document';
    public string $_description = 'Spreadsheet Document';
    public string $_table = 'spreadsheet_data';
    public string $_order = 'updated_at desc';
    public string $_rec_name = 'name';
    public string $modelClass = SpreadsheetDocument::class;

    protected function defineFields(): void
    {
        $this->addField('name', Field::CHAR, [
            'string' => 'Name',
            'required' => true,
            'trim' => true,
        ]);

        $this->addField('spreadsheet_data', Field::TEXT, [
            'string' => 'Spreadsheet Data',
            'help' => 'JSON blob containing spreadsheet state (cells, formats, charts, etc.)',
        ]);

        $this->addField('raw_data', Field::JSON, [
            'string' => 'Raw Data',
            'help' => 'Parsed JSON data for direct access',
        ]);

        $this->addField('user_id', Field::MANY2ONE, [
            'string' => 'Owner',
            'relation' => 'res.users',
            'required' => true,
            'default' => 'currentUserId',
        ]);

        $this->addField('parent_model', Field::CHAR, [
            'string' => 'Parent Model',
            'help' => 'Model name if spreadsheet is linked to a record',
        ]);

        $this->addField('parent_id', Field::INTEGER, [
            'string' => 'Parent ID',
            'help' => 'Record ID if spreadsheet is linked to a record',
        ]);

        $this->addField('is_template', Field::BOOLEAN, [
            'string' => 'Is Template',
            'default' => false,
        ]);

        $this->addField('is_favorite', Field::BOOLEAN, [
            'string' => 'Is Favorite',
            'default' => false,
        ]);

        $this->addField('thumbnail', Field::TEXT, [
            'string' => 'Thumbnail',
            'help' => 'Base64 encoded thumbnail image',
        ]);

        $this->addField('create_date', Field::DATETIME, [
            'string' => 'Created',
            'readonly' => true,
        ]);

        $this->addField('write_date', Field::DATETIME, [
            'string' => 'Modified',
            'readonly' => true,
        ]);
    }

    protected function defineViews(): void
    {
        $this->spreadsheetView = [
            'fields' => ['name', 'spreadsheet_data', 'user_id', 'is_template', 'is_favorite'],
            'column_width' => 150,
            'row_height' => 28,
            'limit' => 100,
        ];

        $this->listView = [
            'fields' => ['name', 'user_id', 'parent_model', 'is_template', 'is_favorite', 'write_date'],
        ];

        $this->formView = [
            'fields' => ['name', 'spreadsheet_data', 'user_id', 'parent_model', 'parent_id', 'is_template', 'is_favorite'],
            'grouping' => [
                ['name', 'user_id'],
                ['parent_model', 'parent_id'],
                ['is_template', 'is_favorite'],
            ],
        ];

        $this->searchView = [
            'fields' => ['name', 'user_id', 'parent_model', 'is_template', 'is_favorite'],
        ];
    }

    protected function defineSecurity(): void
    {
        $this->setAccess([
            'group' => 'base.group_user',
            'perm' => ['create', 'read', 'write', 'unlink'],
        ]);

        $this->addRecordRule(
            'Spreadsheet: User Own',
            [['user_id', '=', '__user_id__']],
            ['read', 'write', 'create', 'unlink'],
            ['base.group_user']
        );
    }

    protected function defineBusinessLogic(): void
    {
        // No custom business logic needed for now
    }

    public function nameGet(object $record): string
    {
        return $record->name ?? 'Untitled Spreadsheet';
    }

    public function performCreate(array $values): object
    {
        if (empty($values['user_id'])) {
            $ctx = app(\App\Advsoft\Security\SecurityContext::class);
            $values['user_id'] = $ctx->getUserId() ?: 1;
        }

        if (isset($values['spreadsheet_data']) && is_array($values['spreadsheet_data'])) {
            $values['raw_data'] = $values['spreadsheet_data'];
        }

        return parent::performCreate($values);
    }

    public function performWrite(array $ids, array $values): array
    {
        if (isset($values['spreadsheet_data']) && is_string($values['spreadsheet_data'])) {
            $decoded = json_decode($values['spreadsheet_data'], true);
            if ($decoded) {
                $values['raw_data'] = $decoded;
            }
        }

        return parent::performWrite($ids, $values);
    }
}
