<?php

class KQRCodeInputReader extends \Adianti\Widget\Form\TQRCodeInputReader
{
    public function show()
    {
        $this->class = 'form-control form-control-solid'; // Update CSS class attribute
        parent::show(); // Call the parent's show() method to render the input element
    }
}
