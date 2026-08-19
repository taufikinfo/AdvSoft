<?php

use Adianti\Widget\Datagrid\TPageNavigation;
use Adianti\Control\TAction;

class KNavigation extends TPageNavigation
{
    private $countersEnabled;
    private $action;
    private $width;
    private $style;

    public static function make()
    {
        return new self();
    }

    public function enableCounters()
    {
        $this->countersEnabled = true;
        return $this;
    }

    // Remove the type hint to match the parent method signature
    public function setAction($action)
    {
        parent::setAction($action);
        $this->action = $action;
        return $this;
    }

    public function setWidth($width)
    {
        $this->width = $width;
        parent::setWidth($width);
        return $this;
    }

    public function setStyle($style)
    {
        $this->style = $style;
        return $this;
    }

    public function render()
    {
        ob_start();
        $this->show();
        $output = ob_get_contents();
        ob_end_clean();
        return $output;
    }

    public function show()
    {
        if ($this->countersEnabled) {
            parent::enableCounters();
        }

        if ($this->width) {
            parent::setWidth($this->width);
        }

        parent::show();
    }
}
