<?php

use Adianti\Widget\Base\TElement;
use Adianti\Control\TAction;

class KLinkMenu extends TElement
{
    private $label;
    private $action;
    private $parameters = [];
    private $image;
    private $badgeClass;
    private $badgeValue;
    private $isActive = false;
    private $customClass = 'menu-item px-3';

    public static function make($label)
    {
        $instance = new self('div');
        $instance->label = $label;
        return $instance;
    }

    public function action($action, $parameters = [])
    {
        if (!($action instanceof TAction)) {
            $tAction = new TAction($action,$parameters);
        } else {
            $tAction = $action;
        }

        $this->parameters = $parameters;
        $this->action = $tAction;
        return $this;
    }

    public function getAction()
    {
        return $this->action;
    }

    public function getParameters()
    {
        return $this->parameters;
    }

    public function image($image)
    {
        if (is_string($image)) {
            $this->image = new TElement('i');
            $this->image->{'class'} = $image;
        } elseif ($image instanceof KIcon) {
            $this->image = $image;
        } else {
            throw new Exception('Invalid image parameter. Expected string or KIcon.');
        }
        return $this;
    }

    public function badge($class, $value)
    {
        $this->badgeClass = $class;
        $this->badgeValue = $value;
        return $this;
    }

    public function active($active)
    {
        $this->isActive = $active;
        return $this;
    }

    public function class($class)
    {
        $this->customClass = $class;
        return $this;
    }

    public function render()
    {
        $container = new TElement('div');
        $container->{'class'} = $this->customClass;

        $link = new TElement('a');
        $link->{'class'} = 'menu-link menu-gray-800 ' . ($this->isActive ? ' active' : '');
        $link->{'href'} = $this->action->serialize();


        if ($this->image) {
            $iconSpan = new TElement('span');
            $iconSpan->{'class'} = 'menu-icon';

            if ($this->image instanceof TElement) {
                $iconSpan->add($this->image);
            } else {
                $iconSpan->add($this->image->render(false));
            }

            $link->add($iconSpan);
        }

        $titleSpan = new TElement('span');
        $titleSpan->{'class'} = 'menu-title fw-bold';
        $titleSpan->add($this->label);
        $link->add($titleSpan);

        if ($this->badgeClass && $this->badgeValue) {
            $badgeSpan = new TElement('span');
            $badgeSpan->{'class'} = 'badge ' . $this->badgeClass;
            $badgeSpan->add($this->badgeValue);
            $link->add($badgeSpan);
        }

        $container->add($link);

        return $container;
    }

    public function __clone()
    {
        if ($this->action) {
            $this->action = clone $this->action;
        }
    }

    public function updateParameters($object)
    {
        foreach ($this->parameters as $key => $value) {
            $new_value = str_replace(['{', '}'], '', $value);
            if (isset($object->$new_value)) {
                $this->action->setParameter($key, $object->$new_value);
            }
        }
    }
}
