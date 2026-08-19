<?php

use Adianti\Widget\Base\TElement;

class KActionBulk
{
    private $label;
    private $action;

    public static function make($label)
    {
        $instance = new self();
        $instance->label = $label;
        return $instance;
    }

    public function action($action)
    {
        $this->action = $action;
        return $this;
    }

    public function render()
    {
        $button = new TElement('button');
        $button->{'class'} = 'btn btn-primary';
        $button->{'onclick'} = $this->action;
        $button->add($this->label);
        return $button;
    }
}
