<?php

use Adianti\Widget\Form\TEntry;

class KSearchBox
{
    private $placeholder;

    public static function make($placeholder)
    {
        $instance = new self();
        $instance->placeholder = $placeholder;
        return $instance;
    }

    public function render()
    {
        $input = new TEntry('search');
        $input->placeholder = $this->placeholder;
        $input->class = 'form-control form-control-solid w-250px ps-12';
        $input->setProperty('data-kt-customer-table-filter', 'search');

        $icon = KIcon::make("magnifier")
                ->class("fs-3 position-absolute ms-5");

        $div = new TElement('div');
        $div->{'class'} = 'd-flex align-items-center position-relative my-1';
        $div->add($icon);
        $div->add($input);

        return $div;
    }
}