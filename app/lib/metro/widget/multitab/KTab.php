<?php

use Adianti\Widget\Base\TElement;

class KTab
{
    protected $label;
    protected $schema = [];
    protected $uniqueId;
    protected $customClass = 'nav-item';
    protected $imageClass = '';

    public static function make($label)
    {
        $instance = new self();
        $instance->label = $label;
        $instance->uniqueId = uniqid();
        return $instance;
    }

    public function schema($schema)
    {
        $this->schema = $schema;
        return $this;
    }

    public function getUniqueId()
    {
        return $this->uniqueId;
    }

    public function class($class)
    {
        $this->customClass = $class;
        return $this;
    }

    public function image($class)
    {
        $this->imageClass = $class;
        return $this;
    }

    public function renderNavItem($index)
    {
        $li = new TElement('li');
        $li->{'class'} = $this->customClass;

        $a = new TElement('a');
        $a->{'class'} = 'nav-link ' . ($index === 1 ? ' active' : '');
        $a->{'data-bs-toggle'} = 'tab';
        $a->{'href'} = "#kt_tab_pane_{$this->uniqueId}";


        if ($this->imageClass) {
            $iconSpan = new TElement('span');
            $iconSpan->{'class'} = 'nav-icon mb-3';
            if (is_string($this->imageClass)) {
                $icon = new TElement('i');
                $icon->{'class'} = $this->imageClass;
                $iconSpan->add($icon);
            } else {
                $iconSpan->add($this->imageClass);
            }

            $a->add($iconSpan);
        }

        $linkText = new TElement('span');
        $linkText->{'class'} = 'nav-text text-gray-800 fw-bold fs-6 lh-1';
        $linkText->add( $this->label );

        $a->add($linkText);


        $li->add($a);

        return $li;
    }

    public function renderTabPane($index, $isActive)
    {
        $div = new TElement('div');
        $div->{'class'} = 'tab-pane fade' . ($isActive ? ' show active' : '');
        $div->{'id'} = "kt_tab_pane_{$this->uniqueId}";
        $div->{'role'} = 'tabpanel';

        foreach ($this->schema as $item) {
            if (is_object($item) && method_exists($item, 'render')) {
                $div->add($item->render());
            } else {
                $div->add($item);
            }
        }

        return $div;
    }

    public function getFields()
    {
        $fields = [];
        foreach ($this->schema as $item) {
            if (is_object($item) && method_exists($item, 'getFields')) {
                $fields = array_merge($fields, $item->getFields());
            }
        }
        return $fields;
    }
}

?>
