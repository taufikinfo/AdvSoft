<?php

class KStepperItem
{
    private $title;
    private $description;
    private $schema;

    public static function make($title, $description)
    {
        return new self($title, $description);
    }

    public function __construct($title, $description)
    {
        $this->title = $title;
        $this->description = $description;
    }

    public function schema(array $schema)
    {
        $this->schema = $schema;
        return $this;
    }

    public function renderNav($index)
    {
        $step = new TElement('div');
        $step->{'class'} = 'stepper-item mx-8 my-4' . ($index === 1 ? ' current' : '');
        $step->{'data-kt-stepper-element'} = 'nav';

        $wrapper = new TElement('div');
        $wrapper->{'class'} = 'stepper-wrapper d-flex align-items-center';

        $icon = new TElement('div');
        $icon->{'class'} = 'stepper-icon w-40px h-40px';

        $check = new TElement('i');
        $check->{'class'} = 'stepper-check fas fa-check';

        $number = new TElement('span');
        $number->{'class'} = 'stepper-number';
        $number->add($index);

        $icon->add($check);
        $icon->add($number);

        $label = new TElement('div');
        $label->{'class'} = 'stepper-label';

        $title = new TElement('h3');
        $title->{'class'} = 'stepper-title';
        $title->add($this->title);

        $desc = new TElement('div');
        $desc->{'class'} = 'stepper-desc';
        $desc->add($this->description);

        $label->add($title);
        $label->add($desc);

        $wrapper->add($icon);
        $wrapper->add($label);

        $step->add($wrapper);

        $line = new TElement('div');
        $line->{'class'} = 'stepper-line h-40px';

        $step->add($line);

        return $step;
    }

    public function renderContent($index)
    {
        $content = new TElement('div');
        $content->{'class'} = 'flex-column' . ($index === 1 ? ' current' : '');
        $content->{'data-kt-stepper-element'} = 'content';

        foreach ($this->schema as $component) {
            $content->add($component->render());
        }

        return $content;
    }
}
