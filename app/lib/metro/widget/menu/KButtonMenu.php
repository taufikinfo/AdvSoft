<?php

use Adianti\Widget\Base\TElement;
use Adianti\Control\TAction;

class KButtonMenu extends TElement
{
    private $label;
    private $action;
    private $customClass = 'btn btn-primary btn-sm px-4';
    private $image;
    private $badgeClass;
    private $badgeValue;

    public static function make($label)
    {
        $instance = new self('a');
        $instance->label = $label;
        return $instance;
    }

    public function action($action, $parameters = [])
    {
        // Create a TAction object
        $tAction = new TAction($action);

        // Add parameters to the TAction
        foreach ($parameters as $key => $value) {
            $tAction->setParameter($key, $value);
        }

        // Generate URL
        $this->action = $tAction->serialize();
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

    public function render()
    {
        $container = new TElement('div');
        $container->{'class'} = 'menu-item px-3';

        $content = new TElement('div');
        $content->{'class'} = 'menu-content px-3 py-3';

        $button = new TElement('a');
        $button->{'class'} = $this->customClass;
        $button->{'href'} = $this->action;

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
            $button->add($iconSpan);
        }

        $button->add($this->label);

        if ($this->badgeClass && $this->badgeValue) {
            $badgeSpan = new TElement('span');
            $badgeSpan->{'class'} = 'badge ' . $this->badgeClass;
            $badgeSpan->add($this->badgeValue);
            $button->add($badgeSpan);
        }

        $content->add($button);
        $container->add($content);

        return $container;
    }
}
?>
