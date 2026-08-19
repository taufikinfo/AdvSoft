<?php


use Adianti\Widget\Base\TElement;

class KGridToolbar
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
        $div = null;
        foreach ($this->components as $component) {
            $div .= $component->render();
        }
        return $div;
    }
}
