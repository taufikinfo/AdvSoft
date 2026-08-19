<?php

class KDBMultiSearch extends TDBMultiSearch
{
    public function show()
    {
        $this->class = 'form-select form-select-solid'; // Update CSS class attribute
        parent::show(); // Call the parent's show() method to render the input element
    }
}
