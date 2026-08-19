<?php

class KTableRow
{
    private $attributes = [];
    private $class;
    private $schema = [];

    public static function make()
    {
        return new self();
    }

    public function class($class)
    {
        $this->class = $class;
        return $this;
    }

    public function attr($name, $value)
    {
        $this->attributes[$name] = $value;
        return $this;
    }

    public function schema($schema)
    {
        $this->schema = $schema;
        return $this;
    }

    public function render()
    {
        $tr = new TElement('tr');
        $tr->{'class'} = $this->class;

        foreach ($this->attributes as $name => $value) {
            $tr->{$name} = $value;
        }

        foreach ($this->schema as $element) {
            $tr->add($element->render());
        }

        return $tr->getContents();
    }
}
?>