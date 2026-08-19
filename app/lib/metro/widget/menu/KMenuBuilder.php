<?php

use Adianti\Widget\Base\TElement;
use Adianti\Control\TAction;
use Adianti\Widget\Form\TForm;

class KMenuBuilder extends TElement
{
    private $mode;
    private $cssClasses = [];
    private $styles = [];
    public $elements = [];
    private $triggeredByAction = false;
    private $uuid;
    private $form;
    private $formAction;
    private $defaultClass = "menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg-light-primary fw-semibold ";

    public static function make()
    {
        return new self('div');
    }

    public function schema(array $elements)
    {
        $this->elements = $elements;
        $this->class = $this->defaultClass;
        $this->{'data-kt-menu'} = "true";
        $this->{'data-popper-placement'} = "bottom-end";
        return $this;
    }

    public function class($class, $mode = "append")
    {
        if ($mode === "replace") {
            $this->cssClasses = [$class];
        } elseif ($mode === "append") {
            $this->cssClasses[] = $class;
        }

        $this->mode = $mode;

        return $this;
    }

    public function style($style)
    {
        $this->styles[] = $style;
        return $this;
    }

    public function triggeredByAction($trigger, $uuid)
    {
        $this->triggeredByAction = $trigger;
        $this->uuid = $uuid;
        return $this;
    }

    public function makeform($name, TAction $action)
    {
        $this->form = new TForm($name);
        $this->formAction = $action;
        return $this;
    }

    public function show($show = true): void
    {
        $this->render($show);

        parent::show();
    }

    public function render($show = true)
    {
        if (empty($this->triggeredByAction)) {
            $this->cssClasses[] = "show";
        }

        if ($this->mode == 'replace') {
            $this->class = implode(' ', $this->cssClasses);
        } else {
            $this->class = $this->defaultClass . implode(' ', $this->cssClasses);
            if (empty($this->class)) {
                $this->class = $this->defaultClass;
            }
        }

        $this->style = implode('; ', $this->styles);
        $this->id = $this->uuid;

        if ($this->form) {
            foreach ($this->elements as $element) {
                if ($element instanceof KSubmitMenu) {
                    $this->form->addField($element->getButton());
                }
            }
            $this->form->setFields(array_map(function ($element) {
                return $element instanceof KSubmitMenu ? $element->getButton() : null;
            }, $this->elements));

            $formWrapper = new TElement('form');
            $formWrapper->{'name'} = $this->form->getName();
            $formWrapper->{'id'} = $this->form->getName();
            $formWrapper->{'method'} = 'post';
            $formWrapper->{'action'} = $this->formAction->serialize();

            foreach ($this->elements as $element) {
                $formWrapper->add($element->render());
            }

            $this->add($formWrapper);
        } else {
            foreach ($this->elements as $element) {
                $this->add($element->render());
            }
        }

        return $this;
    }

    public function __clone()
    {
        $this->elements = array_map(function ($item) {
            return clone $item;
        }, $this->elements);
    }
}


?>
