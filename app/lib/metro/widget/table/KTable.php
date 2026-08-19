<?php

use Adianti\Widget\Base\TElement;

class KTable
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
        $table = new TElement('table');
        $table->{'class'} = $this->class;

        foreach ($this->attributes as $name => $value) {
            $table->{$name} = $value;
        }

        foreach ($this->schema as $element) {
            $table->add($element->render());
        }

        return $table->getContents();
    }

    public function show()
    {
        echo $this->render();
    }
}

?>