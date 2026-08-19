<?php

use Adianti\Widget\Base\TElement;

class KCountUp
{
    private $class;
    private $icon;
    private $prefix;
    private $value;
    private $label;

    public static function make()
    {
        return new self();
    }

    public function class($class)
    {
        $this->class = $class;
        return $this;
    }

    public function icon($icon)
    {
        $this->icon = $icon;
        return $this;
    }

    public function prefix($prefix)
    {
        $this->prefix = $prefix;
        return $this;
    }

    public function value($value)
    {
        $this->value = $value;
        return $this;
    }

    public function label($label)
    {
        $this->label = $label;
        return $this;
    }

    public function render()
    {
        $wrapper = new TElement('div');
        $wrapper->{'class'} = $this->class ?? 'border border-gray-300';

        // Number section
        $numberWrapper = new TElement('div');
        $numberWrapper->{'class'} = 'd-flex align-items-center';

        // Icon
        if ($this->icon) {

            $numberWrapper->add($this->icon);
        }

        // Value
        $valueElement = new TElement('div');
        $valueElement->{'class'} = 'fs-2 fw-bold';
        $valueElement->{'data-kt-countup'} = 'true';
        $valueElement->{'data-kt-countup-value'} = $this->value;
        $valueElement->{'data-kt-countup-prefix'} = $this->prefix;
        $valueElement->add('0');
        $numberWrapper->add($valueElement);

        $wrapper->add($numberWrapper);

        // Label
        $labelElement = new TElement('div');
        $labelElement->{'class'} = 'fw-semibold fs-6';
        $labelElement->add($this->label);
        $wrapper->add($labelElement);

        return $wrapper->getContents();
    }

    public function show()
    {
        echo $this->render();
    }
}