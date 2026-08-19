<?php
use Adianti\Widget\Form\TLabel;
use Adianti\Widget\Base\TElement;
use Adianti\Widget\Base\TStyle;
use Adianti\Widget\Base\TScript;

class KLabel extends TLabel
{
    protected $embedStyle;

    public function __construct($value, $color = null, $fontsize = null, $decoration = null, $size = null)
    {
        parent::__construct($value, $color, $fontsize, $decoration, $size);
        $this->tag->{'class'} = 'col-form-label fw-semibold fs-6'; // Set the class for the label
        $this->embedStyle = new TStyle('tlabel_style_'.$this->id); // Initialize embedStyle
    }

    public function show()
    {
        // Define the outer div
        $div = new TElement('div');
        $div->{'class'} = '';
        $div->{'style'} = '';

        // Set the value attribute for the label tag
        $this->tag->{'value'} = htmlspecialchars((string)$this->value, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Define the tag properties
        $this->tag->{'id'} = $this->id;

        if ($this->size)
        {
            if (strstr((string)$this->size, '%') !== FALSE)
            {
                $this->embedStyle->{'width'} = $this->size;
            }
            else
            {
                $this->embedStyle->{'width'} = $this->size . 'px';
            }
        }

        // if the embed style has any content
        if ($this->embedStyle && $this->embedStyle->hasContent())
        {
            $this->setProperty('style', $this->embedStyle->getInline() . $this->getProperty('style'), TRUE);
        }

        if ($this->toggleVisibility)
        {
            $icon = new TElement('i');
            $icon->{'class'} = 'fa fa-eye-slash';

            $span = new TElement('span');
            $span->add($this->value);
            $span->{'style'} = 'filter: blur(5px);';

            $this->tag->add($span);
            $this->tag->{'class'} .= ' label-toggle-visibilty ';
            $this->tag->add($icon);

            TScript::create(" tlabel_toggle_visibility( '{$this->id}' ); ");
        }
        else
        {
            // add content to the tag
            $this->tag->add($this->value);
        }

        // Add the label tag to the outer div
        $div->add($this->tag);

        // Show the outer div
        $div->show();
    }
}
?>
