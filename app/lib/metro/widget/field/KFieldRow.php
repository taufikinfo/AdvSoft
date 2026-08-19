<?php

class KFieldRow
{
    private $schema = [];
    private $css;

    public static function make()
    {
        return new self();
    }

    public function schema($schema)
    {
        $this->schema = $schema;
        return $this;
    }

    public function render()
    {
        $element = new TElement('div');
        $element->{'class'} = $this->css;
        foreach ($this->schema as $row) {
            $rowElement = new TElement('div');
            $rowElement->{'class'} = 'row mb-2';
            foreach ($row as $field) {
                $rowElement->add($field->render());
            }
            $element->add($rowElement);
        }
        return $element;
    }

    public function getFields()
    {
        $fields = [];
        foreach ($this->schema as $elements) {
            foreach ($elements as $element) {
                if ($element instanceof KFieldset) {
                    $fields[] = $element;
                }
            }
        }
        return $fields;
    }

    public function class(string $css)
    {
        $this->css = $css;
        return $this;
    }

}