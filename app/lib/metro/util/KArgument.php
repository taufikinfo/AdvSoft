<?php

class KArgument
{
    public $value;
    public $quotation = true;

    public function __construct($value, $quotation = true)
    {
        $this->value = $value;
        $this->quotation = $quotation;
    }
}