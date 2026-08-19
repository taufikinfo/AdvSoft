<?php

use Adianti\Widget\Base\TElement;

class KSeparatorMenu extends TElement
{
    private $customClass = 'separator mb-3 opacity-75';

    public static function make()
    {
        return new self('div');
    }

    public function class($class)
    {
        $this->customClass = $class;
        return $this;
    }

    public function render()
    {
        $separator = new TElement('div');
        $separator->{'class'} = $this->customClass;

        return $separator->getContents();
    }
}