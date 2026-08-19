<?php

class KSymbolItem
{
    private $image;
    private $label;
    private $class;
    private $badgeClass;
    private $badgeValue;

    public static function make()
    {
        return new self();
    }

    public function image($image)
    {
        $this->image = $image;
        return $this;
    }

    public function label($label)
    {
        $this->label = $label;
        return $this;
    }

    public function class($class)
    {
        $this->class = $class;
        return $this;
    }

    public function badge($badgeClass, $badgeValue)
    {
        $this->badgeClass = $badgeClass;
        $this->badgeValue = $badgeValue;
        return $this;
    }

    public function render($symbolClass = '')
    {
        $symbol = new TElement('div');
        $symbol->{'class'} = 'symbol symbol-circle ' . $symbolClass . ($this->class ? ' ' . $this->class : '');

        if ($this->image) {
            $img = new TElement('img');
            $img->{'src'} = $this->image;
            $img->{'alt'} = '';
            $symbol->add($img);
        } elseif ($this->label) {
            $symbolLabel = new TElement('div');
            $symbolLabel->{'class'} = 'symbol-label' . ($this->class ? ' ' . $this->class : '');
            $symbolLabel->add($this->label);
            $symbol->add($symbolLabel);
        }

        if ($this->badgeClass && $this->badgeValue) {
            $badge = new TElement('span');
            $badge->{'class'} = $this->badgeClass;
            $badge->add($this->badgeValue);
            $symbol->add($badge);
        }

        return $symbol;
    }
}