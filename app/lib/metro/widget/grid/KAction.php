<?php

use Adianti\Control\TAction;
use Adianti\Widget\Base\TElement;

class KAction
{
    private $label;
    private $url;
    private $uuid;
    public $triggerMenu;
    private $isTriggered = false;
    private $customClass = 'btn btn-light-primary me-3';
    private $image;
    private $badgeClass;
    private $badgeValue;
    private $type = 'button'; // Default type
    private $attributes = []; // Custom attributes

    public static function make($label = '')
    {
        $instance = new self();
        $instance->label = $label;
        return $instance;
    }

    public function action($action, $parameters = [])
    {
        if ($this->isTriggered) {
            $this->url = '#';
            return $this;
        }

        $tAction = new TAction($action);

        foreach ($parameters as $key => $value) {
            $tAction->setParameter($key, $value);
        }

        $this->url = $tAction->serialize();
        return $this;
    }

    public function trigger(KMenuBuilder $menu)
    {
        $this->uuid = substr(bin2hex(random_bytes(10)), 0, 10);
        $this->triggerMenu = clone $menu;
        $this->triggerMenu->triggeredByAction(true, $this->uuid);
        $this->isTriggered = true;
        return $this;
    }

    public function class($class)
    {
        $this->customClass = $class;
        return $this;
    }

    public function image($image)
    {
        $this->image = $image;
        return $this;
    }

    public function badge($class, $value)
    {
        $this->badgeClass = $class;
        $this->badgeValue = $value;
        return $this;
    }

    public function type($type)
    {
        $this->type = $type;
        return $this;
    }

    public function attr($name, $value)
    {
        $this->attributes[$name] = $value;
        return $this;
    }

    public function render()
    {
        if ($this->type === 'button') {
            $element = new TElement('button');
            $element->{'type'} = 'button';
            $element->{'data-bs-target'} = '#' . $this->uuid;
            $element->{'data-kt-menu-trigger'} = 'click';
            $element->{'data-kt-menu-placement'} = 'bottom-end';
            $element->{'data-kt-menu-overflow'} = 'true';
            $element->{'onclick'} = $this->isTriggered ? null : "location.href='{$this->url}'";
        } else  if ($this->type === 'stepper') {
            $element = new TElement('button');
            $element->{'type'} = 'button';
        } elseif ($this->type === 'link') {
            $element = new TElement('a');
            $element->{'href'} = $this->url;
            $element->{'generator'} = "adianti";
        } elseif ($this->type === 'submit') {
            $element = new TElement('button');
            $element->{'type'} = 'submit';
        } else {
            throw new Exception("Invalid type: {$this->type}");
        }

        $element->{'class'} = $this->customClass;


        foreach ($this->attributes as $name => $value) {
            $element->$name = $value;
        }

        if ($this->image) {
            $iconSpan = new TElement('span');
            $iconSpan->{'class'} = 'menu-icon';
            if (is_string($this->image)) {
                $icon = new TElement('i');
                $icon->{'class'} = $this->image;
                $iconSpan->add($icon);
            } else {
                $iconSpan->add($this->image);
            }
            $element->add($iconSpan);
        }

        $element->add($this->label);

        if ($this->badgeClass && $this->badgeValue) {
            $badgeSpan = new TElement('span');
            $badgeSpan->{'class'} = 'badge ' . $this->badgeClass;
            $badgeSpan->add($this->badgeValue);
            $element->add($badgeSpan);
        }

        $containerDiv = new TElement('div');
        $containerDiv->{'class'} = 'my-0';
        $containerDiv->add($element->getContents());

        if ($this->triggerMenu) {
            $containerDiv->add($this->triggerMenu);
        }

        return $containerDiv->getContents();
    }

    public function __clone()
    {
        $this->uuid = substr(bin2hex(random_bytes(10)), 0, 10);
        $this->triggerMenu = clone $this->triggerMenu;
        $this->triggerMenu->triggeredByAction(true, $this->uuid);
    }

    public function show()
    {
        $element = $this->render();
        if ($element instanceof TElement) {
            $element->show();
        } else {
            echo $element;
        }
    }
}
?>
