<?php

use Adianti\Widget\Base\TElement;

class KDateRange extends TElement
{
    private $icon;
    private $placeholder;
    private $inputId;

    public function __construct()
    {
        parent::__construct('div');
        $this->{'class'} = 'd-flex align-items-center position-relative';
        $this->inputId = 'tdaterange_' . mt_rand(1000000000, 1999999999);
    }

    public static function make()
    {
        return new self();
    }

    public function image($icon)
    {
        if ($icon instanceof TElement) {
            $this->icon = $icon;
        } else {
            throw new Exception('Invalid icon parameter. Expected instance of TElement.');
        }
        return $this;
    }

    public function placeholder($placeholder)
    {
        $this->placeholder = $placeholder;
        return $this;
    }

    public function show()
    {


        $input = new TElement('input');
        $input->{'class'} = 'form-control form-control-solid';
        $input->{'placeholder'} = $this->placeholder ?? 'Pick date range';
        $input->{'id'} = $this->inputId;
        $this->add($input);

        if ($this->icon) {
            $icon = new TElement('div');
            $icon->{'class'} = 'position-absolute translate-middle-y top-50 end-0 me-3';
            $icon->add($this->icon);
            $this->add($icon);
        }

        parent::show();

        TScript::create( " kdaterange_enable_field( '{$this->inputId}' ); " );
    }
}
