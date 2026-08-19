<?php

use Adianti\Control\TAction;
use Adianti\Widget\Form\TButton;
use Adianti\Widget\Base\TElement;

class KSubmitMenu
{
    private $label;
    private $action;
    private $parameters = [];
    private $button;

    public static function make($label)
    {
        $instance = new self();
        $instance->label = $label;
        return $instance;
    }

    public function action(TAction $action, $parameters = [])
    {
        $this->action = $action;
        foreach ($parameters as $key => $value) {
            $this->action->setParameter($key, $value);
        }
        return $this;
    }

    public function render()
    {
        $this->button = new TButton($this->label);
        $this->button->setAction($this->action, $this->label);
        $this->button->{'class'} = 'btn btn-primary';
        return $this->button;
    }

    public function getButton()
    {
        return $this->button;
    }

    public function show()
    {
        $button = $this->render();
        return $button->show();
    }

    public function __toString()
    {
        return (string) $this->render();
    }
}
