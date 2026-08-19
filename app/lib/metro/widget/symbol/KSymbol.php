<?php

use Adianti\Widget\Base\TElement;

class KSymbol
{
    private $schema;
    private $class;

    public static function make()
    {
        return new self();
    }

    public function schema(array $schema)
    {
        $this->schema = $schema;
        return $this;
    }

    public function class($class)
    {
        $this->class = $class;
        return $this;
    }

    public function render()
    {
        $wrapper = new TElement('div');
        $wrapper->{'class'} = 'symbol-group symbol-hover';

        foreach ($this->schema as $item) {
            $wrapper->add($item->render($this->class));
        }

        return $wrapper->getContents();
    }

    public function show()
    {
        echo $this->render();
    }
}