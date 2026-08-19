<?php

use Adianti\Widget\Base\TElement;
use Twig\Environment;
use Twig\Loader\ArrayLoader;

class KRadioAdvanced
{
    private $name;
    private $data;
    private $switchDisplayTemplate;
    private $selectedValue;
    private $twig;

    public function __construct($name)
    {
        $this->name = $name;
        $this->twig = new Environment(new ArrayLoader());
    }

    public static function make($name)
    {
        return new self($name);
    }

    public function data(array $data)
    {
        $this->data = $data;
        return $this;
    }

    public function setValue($value)
    {
        $this->selectedValue = $value;
        return $this;
    }

    public function switchDisplay($template)
    {
        $this->switchDisplayTemplate = $template;
        return $this;
    }

    public function render()
    {
        $wrapper = new TElement('div');
        $wrapper->{'data-kt-buttons'} = 'true';

        foreach ($this->data as $item) {
            $html = $this->switchDisplayTemplate;

            // Determine if this item is the selected value
            $item['checked'] = (isset($this->selectedValue) && $this->selectedValue === $item[$this->name]) ? 'checked="checked"' : '';
            $item['active'] = (isset($this->selectedValue) && $this->selectedValue === $item[$this->name]) ? 'active' : '';

            foreach ($item as $key => $value) {
                $html = str_replace('{' . $key . '}', $value ?? '', $html);
            }
            $wrapper->add($html);
        }

        return $wrapper->getContents();
    }

    public function show()
    {
        echo $this->render();
    }
}

