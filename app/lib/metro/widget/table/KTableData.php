<?php

class KTableData
{
    private $attributes = [];
    private $content;
    private $class;

    public static function make($content)
    {
        $instance = new self();
        $instance->content = $content;
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

    public function render()
    {
        $td = new TElement('td');
        $td->{'class'} = $this->class;

        foreach ($this->attributes as $name => $value) {
            $td->{$name} = $value;
        }

        $td->add($this->content);

        return $td->getContents();
    }
}

?>