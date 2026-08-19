<?php

class KTextColumn
{
    private $field;
    private $label;
    private $searchable = false;
    private $sortable = false;
    private $transformer;
    private $attributes = [];

    public static function make($field)
    {
        $instance = new self();
        $instance->field = $field;
        return $instance;
    }

    public function label($label)
    {
        $this->label = $label;
        return $this;
    }

    public function searchable()
    {
        $this->searchable = true;
        return $this;
    }

    public function sortable()
    {
        $this->sortable = true;
        return $this;
    }

    public function transform(callable $transformer)
    {
        $this->transformer = $transformer;
        return $this;
    }

    public function attr($name, $value)
    {
        $this->attributes[$name] = $value;
        return $this;
    }

    public function getAttributes()
    {
        return $this->attributes;
    }

    public function getField()
    {
        return $this->field;
    }

    public function getLabel()
    {
        return $this->label;
    }

    public function isSearchable()
    {
        return $this->searchable;
    }

    public function isSortable()
    {
        return $this->sortable;
    }

    public function getTransformedValue($value, $object, $row)
    {
        if ($this->transformer) {
            return call_user_func($this->transformer, $value, $object, $row);
        }
        return $value;
    }

    public function render()
    {
        return [
            'field' => $this->field,
            'label' => $this->label,
            'searchable' => $this->searchable,
            'sortable' => $this->sortable,
            'attributes' => $this->attributes
        ];
    }


}
