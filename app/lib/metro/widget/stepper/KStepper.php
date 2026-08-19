<?php

use Adianti\Widget\Base\TElement;
use Adianti\Control\TAction;

class KStepper
{
    private $id;
    private $schema;
    private $actions;
    private $class;

    public static function make($id = null)
    {
        return new self($id);
    }

    public function __construct($id = null)
    {
        $this->id = $id ?? 'kt_stepper_' . mt_rand(1000000000, 1999999999);
        $this->class = 'stepper stepper-pills'; // Default class
    }

    public function schema(array $schema)
    {
        $this->schema = $schema;
        return $this;
    }

    public function actions($previous, $next, $submit)
    {
        $this->actions = compact('previous', 'next', 'submit');
        return $this;
    }

    public function class($class)
    {
        $this->class = $class;
        return $this;
    }

    public function render()
    {
        $wrapper = new TElement('div');
        $wrapper->{'class'} = $this->class;
        $wrapper->{'id'} = $this->id;

        $nav = new TElement('div');
        $nav->{'class'} = 'stepper-nav flex-center flex-wrap mb-10';

        foreach ($this->schema as $index => $step) {
            $nav->add($step->renderNav($index + 1));
        }

        $wrapper->add($nav);

        $form = new TElement('form');
        $form->{'class'} = 'form w-lg-500px mx-auto';
        $form->{'novalidate'} = 'novalidate';
        $form->{'id'} = $this->id . '_form';

        $group = new TElement('div');
        $group->{'class'} = 'mb-5';

        foreach ($this->schema as $index => $step) {
            $group->add($step->renderContent($index + 1));
        }

        $form->add($group);

        $actionsWrapper = new TElement('div');
        $actionsWrapper->{'class'} = 'd-flex flex-stack';

        $backWrapper = new TElement('div');
        $backWrapper->{'class'} = 'me-2';
        $backWrapper->add($this->actions['previous']->render());

        $nextSubmitWrapper = new TElement('div');
        $nextSubmitWrapper->add($this->actions['submit']->render());
        $nextSubmitWrapper->add($this->actions['next']->render());

        $actionsWrapper->add($backWrapper);
        $actionsWrapper->add($nextSubmitWrapper);

        $form->add($actionsWrapper);
        $wrapper->add($form);

        return $wrapper->getContents();
    }

    public function show()
    {
        echo $this->render();
        TScript::create("kstepper_enable_field('{$this->id}');");
    }
}