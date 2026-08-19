<?php

class KFormSeparator extends \Adianti\Widget\Form\TFormSeparator
{
    public function show()
    {
        $this->class = 'form-control form-control-solid'; // Update CSS class attribute
        parent::show(); // Call the parent's show() method to render the input element
    }
}
