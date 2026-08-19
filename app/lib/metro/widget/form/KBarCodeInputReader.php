<?php

class KBarCodeInputReader extends TBarCodeInputReader
{
    public function show()
    {
        $this->class = 'form-control form-control-solid'; // Update CSS class attribute
        parent::show(); // Call the parent's show() method to render the input element
    }
}
