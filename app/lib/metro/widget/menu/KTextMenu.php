<?php

class KTextMenu extends TElement
{
    private $text;

    public static function make($text)
    {
        $instance = new self('div');
        $instance->text = $text;
        return $instance;
    }

    public function render()
    {
        $container = new TElement('div');
        $container->{'class'} = 'menu-item px-3';

        $content = new TElement('div');
        $content->{'class'} = 'menu-content fs-6 text-gray-900 fw-bold px-3 py-4';
        $content->add($this->text);

        $container->add($content);

        return $container;
    }
}