<?php

use Adianti\Widget\Form\TCheckButton;
use Adianti\Widget\Base\TElement;

class KCheckButton extends TCheckButton
{
    protected $label;

    public function setLabel($label)
    {
        $this->label = $label;
        return $this;
    }

    public function show()
    {
        $div = new TElement('div');
        $div->{'class'} = 'form-check form-switch form-check-custom form-check-solid';

        $input = new TElement('input');
        $input->{'class'} = 'form-check-input';
        $input->{'type'} = 'checkbox';
        $input->{'name'} = $this->name;
        $input->{'id'} = $this->id;
        $input->{'value'} = $this->indexValue;

        if ($this->indexValue == $this->value AND !(is_null($this->value)) AND strlen((string) $this->value) > 0)
        {
            $input->{'checked'} = 'checked';
        }

        // check whether the widget is non-editable
        if (!parent::getEditable())
        {
            // make the widget read-only
            $input->{'onclick'} = "return false;";
            $input->{'style'} = 'pointer-events:none';
            $input->{'tabindex'} = '-1';
        }

        $label = new TElement('label');
        $label->{'class'} = 'form-check-label fw-semibold text-gray-500 ms-3';
        $label->{'for'} = $this->id;
        $label->add($this->label);

        $div->add($input);
        $div->add($label);

        $div->show();
    }
}
?>
