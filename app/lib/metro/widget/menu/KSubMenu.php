<?php

class KSubMenu extends TElement
{
    private $label;
    private $elements = [];

    public static function make($label)
    {
        $instance = new self('div');
        $instance->label = $label;
        return $instance;
    }

    public function schema(array $elements)
    {
        $this->elements = $elements;
        return $this;
    }

    public function render()
    {
        $container = new TElement('div');
        $container->{'class'} = 'menu-item px-3';
        $container->{'data-kt-menu-trigger'} = 'hover';
        $container->{'data-kt-menu-placement'} = 'right-start';

        $link = new TElement('a');
        $link->{'class'} = 'menu-link px-3';
        $link->{'href'} = '#';

        $title = new TElement('span');
        $title->{'class'} = 'menu-title';
        $title->add($this->label);

        $arrow = new TElement('span');
        $arrow->{'class'} = 'menu-arrow';

        $link->add($title);
        $link->add($arrow);

        $container->add($link);

        $subMenu = new TElement('div');
        $subMenu->{'class'} = 'menu-sub menu-sub-dropdown w-175px py-4';

        foreach ($this->elements as $element) {
            $subMenu->add($element->render());
        }

        $container->add($subMenu);

        return $container;
    }
}