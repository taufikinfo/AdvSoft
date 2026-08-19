<?php

class KQuickNotebookForm extends \Adianti\Widget\Wrapper\TQuickNotebookForm
{
    public function show()
    {
        $this->class = 'form-control form-control-solid'; // Update CSS class attribute
        parent::show(); // Call the parent's show() method to render the input element
    }
}
