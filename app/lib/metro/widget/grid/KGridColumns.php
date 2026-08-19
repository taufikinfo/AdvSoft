<?php

class KGridColumns
{
    private $columns = [];
    private $actions = [];
    private $actionGroups;
    private $instance;

    public static function make($instance)
    {
        $obj = new self();
        $obj->instance = $instance;
        return $obj;
    }

    public function schema(array $columns)
    {
        foreach ($columns as $column) {
            $this->columns[] = $column;
        }
        return $this;
    }

    public function action(array $actions)
    {
        foreach ($actions as $action) {
            $this->actions[] = $action;
        }
        return $this;
    }

    public function actionGroup(KAction $actionGroup)
    {
        $this->actionGroups = function($object) use ($actionGroup) {
            $clonedActionGroup = clone $actionGroup;
            foreach ($clonedActionGroup->triggerMenu->elements as $element) {
                if ($element instanceof KLinkMenu) {
                    $element->updateParameters($object);
                }
            }
            return $clonedActionGroup;
        };

        return $this;
    }

    public function getColumns()
    {
        return $this->columns;
    }

    public function getActions()
    {
        return $this->actions;
    }

    public function getActionGroups()
    {
        return $this->actionGroups;
    }

    public function getInstance()
    {
        return $this->instance;
    }
}
