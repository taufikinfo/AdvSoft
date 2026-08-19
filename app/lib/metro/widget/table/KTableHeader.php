<?php

class KTableHeader
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
        $tbody = new TElement('theader');
        $tbody->{'class'} = $this->class;

        foreach ($this->attributes as $name => $value) {
            $tbody->{$name} = $value;
        }

        foreach ($this->schema as $element) {
            $tbody->add($element->render());
        }

        return $tbody->getContents();
    }
}
?>