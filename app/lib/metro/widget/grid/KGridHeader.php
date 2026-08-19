<?php


use Adianti\Widget\Base\TElement;

class KGridHeader
{
    private $components = [];

    public static function make()
    {
        return new self();
    }

    public function schema(array $components)
    {
        $this->components = $components;
        return $this;
    }

    public function render()
    {
        $div = new TElement('div');
        foreach ($this->components as $component) {
            $div->add($component->render());
        }
        return $div;
    }
}
