<?php

class KCardGroup
{
    private $columnSpan;
    private $schema = [];

    public static function make()
    {
        return new self();
    }

    public function class($span)
    {
        $this->columnSpan = $span;
        return $this;
    }

    public function schema($schema)
    {
        $this->schema = $schema;
        return $this;
    }

    public function render()
    {
        $groupElement = new TElement('div');
        $groupElement->{'class'} = $this->columnSpan;
        foreach ($this->schema as $section) {
            $groupElement->add($section->render());
        }
        return $groupElement;
    }

    public function getFields()
    {
        $fields = [];
        foreach ($this->schema as $section) {
            $fields = array_merge($fields, $section->getFields());
        }
        return $fields;
    }
}

