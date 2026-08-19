<?php

use Adianti\Widget\Form\TField;
use Adianti\Widget\Form\TLabel;

class KFieldSet
{
    private $label;
    private $name;
    private $attributes = [];
    private $value;
    private $class;
    private $style;

    public static function make($label)
    {
        $instance = new self();
        $instance->label = $label;
        return $instance;
    }

    public function columnSpan($span)
    {
        $this->attributes['columnSpan'] = $span;
        return $this;
    }

    public function required()
    {
        $this->attributes['required'] = true;
        return $this;
    }

    public function disabled()
    {
        $this->attributes['disabled'] = true;
        return $this;
    }

    public function maxLength($length = null)
    {
        $this->attributes['maxLength'] = $length;
        return $this;
    }

    public function name($name)
    {
        $this->name = $name;
        return $this;
    }

    public function setValue($value)
    {
        $this->value = $value;
        return $this;
    }

    public function class($class)
    {
        $this->class = $class;
        return $this;
    }

    public function style($style)
    {
        $this->style = $style;
        return $this;
    }

    public function getField()
    {
        return $this;
    }

    public function render()
    {
        $element = new TElement('div');
        $element->{'class'} = $this->attributes['columnSpan'] ?? '';

        if ($this->class) {
            $element->{'class'} .= ' ' . $this->class;
        }

        if ($this->style) {
            $element->{'style'} = $this->style;
        }

        if ($this->label instanceof TLabel) {
            $this->label->{'class'} = 'col-form-label fw-semibold fs-6';
            $element->add($this->label);
        } else {
            if ($this->label instanceof TField) {
                $this->label->class = "form-control form-control-solid";
            }
            $element->add($this->label);
        }

        return $element;
    }

    public function getName()
    {
        return $this->name;
    }

    public function getLabel()
    {
        return $this->label;
    }

    public function html(?Closure $param)
    {
        $this->attributes['html'] = $param;
    }
}
