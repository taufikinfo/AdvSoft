<?php

class KTableFooter
{
    private $components = [];

    public static function make()
    {
        return new self();
    }

    public function schema(array $components)
    {
        foreach ($components as $component) {
            $this->components[] = $component;
        }
        return $this;
    }

    public function getComponents()
    {
        return $this->components;
    }

    public function render()
    {
        $footer = new TElement('div');
        foreach ($this->components as $component) {
            if (method_exists($component, 'render')) {
                $footer->add($component->render());
            } else {
                $footer->add($component->show());
            }
        }
        return $footer;
    }
}
