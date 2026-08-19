<?php

class KCardToolbar
{
    private $actions = [];

    public static function make()
    {
        return new self();
    }

    public function schema(array $actions)
    {
        $this->actions = $actions;
        return $this;
    }

    public function render()
    {
        $div = new TElement('div');
        $div->{'class'} = 'card-toolbar';

        foreach ($this->actions as $action) {
            $div->add($action->render());
        }

        return $div->getContents();
    }

    public function show(){
        echo $this->render();
    }


}
