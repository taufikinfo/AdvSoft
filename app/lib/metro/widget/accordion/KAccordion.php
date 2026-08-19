<?php

use Adianti\Widget\Base\TElement;

class KAccordion
{
    private $attributes = [];
    private $class;
    private $schema = [];
    private $uniqueId;

    public static function make()
    {
        $instance = new self();
        $instance->uniqueId = uniqid('kt_accordion_', true);
        return $instance;
    }

    public function class($class)
    {
        $this->class = $class;
        return $this;
    }

    public function attr($name, $value)
    {
        $this->attributes[$name] = $value;
        return $this;
    }

    public function schema($schema)
    {
        $this->schema = $schema;
        return $this;
    }

    public function render()
    {
        $accordion = new TElement('div');
        $accordion->{'class'} = $this->class;
        $accordion->{'id'} = $this->uniqueId;

        foreach ($this->attributes as $name => $value) {
            $accordion->{$name} = $value;
        }

        foreach ($this->schema as $index => $element) {
            if ($element instanceof KAccordionItem) {
                $element->setAccordionId($this->uniqueId);
                $element->setItemId($index + 1);
                $accordion->add($element->render());
            } elseif ($element instanceof KSeparatorMenu) {
                $accordion->add($element->render());
            }
        }

        return $accordion->getContents();
    }

    public function show()
    {
        echo $this->render();
    }
}


