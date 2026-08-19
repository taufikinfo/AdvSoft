<?php

class KContainerRow
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

    public function schema(array $schema)
    {
        $this->schema = $schema;
        return $this;
    }

    public function render()
    {
        $div = new TElement('div');
        $div->{'class'} = $this->columnSpan;

        foreach ($this->schema as $element) {
            $div->add($element->render());
        }

        return $div;
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

?>
