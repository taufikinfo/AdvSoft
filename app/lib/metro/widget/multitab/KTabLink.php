<?php

use Adianti\Widget\Base\TElement;

class KTabLink
{
    protected $label;
    protected $schema = [];
    protected $uniqueId;

    public static function make($label)
    {
        $instance = new self();
        $instance->label = $label;
        $instance->uniqueId = uniqid();
        return $instance;
    }

    public function schema($schema)
    {
        $this->schema = $schema;
        return $this;
    }

    public function getLabel()
    {
        return $this->label;
    }

    public function getUniqueId()
    {
        return $this->uniqueId;
    }

    public function renderTabPane($index, $isActive)
    {
        $div = new TElement('div');
        $div->{'class'} = 'tab-pane fade' . ($isActive ? ' show active' : '');
        $div->{'id'} = "kt_tab_pane_{$this->uniqueId}";
        $div->{'role'} = 'tabpanel';

        foreach ($this->schema as $item) {
            $div->add($item->render());
        }

        return $div;
    }

    public function getFields()
    {
        $fields = [];
        foreach ($this->schema as $item) {
            if (is_object($item) && method_exists($item, 'getFields')) {
                $fields = array_merge($fields, $item->getFields());
            }
        }
        return $fields;
    }
}
