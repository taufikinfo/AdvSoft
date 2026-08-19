<?php

use Adianti\Widget\Wrapper\TDBUniqueSearch;

class KDBUniqueSearch extends TDBUniqueSearch
{

    public function prepare()
    {
        // Call the parent's prepare() method to set up the component
        parent::prepare();

        // Update CSS class attribute
        $this->setProperty('style', 'width: 100%');
        $this->{'style'} .= ';width:100%;border: 1px solid #ccc;';
        $this->class = 'select2-selection select2-selection--single form-select form-select-solid';
    }

//    public function show()
//    {
//        $this->class = 'select2-selection select2-selection--single form-select form-select-solid'; // Update CSS class attribute
//        parent::show(); // Call the parent's show() method to render the input element
//    }
}
