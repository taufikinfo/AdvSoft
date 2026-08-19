<?php

use Adianti\Control\TAction;

class KGridAction
{
    private $action;
    private $icon;
    private $label;

    public static function make()
    {
        return new self();
    }

    public function action($callback, $parameters = [])
    {
        $this->action = new TAction($callback);

        foreach ($parameters as $key => $value) {
            $this->action->setParameter($key, $value);
        }

        return $this;
    }

    public function image($icon)
    {
        $this->icon = $icon;
        return $this;
    }

    public function label($label)
    {
        $this->label = $label;
        return $this;
    }

    public function getAction()
    {
        return $this->action;
    }

    public function getParameter()
    {
        return $this->action->getFieldParameters();
    }

    public function getImage()
    {
        return $this->icon;
    }

    public function getLabel()
    {
        return $this->label;
    }

    public function render()
    {
        $actionElement = new TElement('a');
        $actionElement->{'href'} = $this->action->serialize();
        $actionElement->{'class'} = 'btn btn-sm';

        if ($this->icon) {
            $iconSpan = new TElement('span');
            $iconSpan->{'class'} = 'menu-icon';
            if (is_string($this->icon)) {
                $icon = new TElement('i');
                $icon->{'class'} = $this->icon;
                $iconSpan->add($icon);
            } else {
                $iconSpan->add($this->icon);
            }
            $actionElement->add($iconSpan);
        }



        return $actionElement;
    }
}
?>
