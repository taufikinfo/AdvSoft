<?php

use Adianti\Widget\Base\TElement;

class KTabMenu
{
    protected $label;
    protected $tabs = [];
    protected $uniqueId;
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
        $this->tabs = $schema;
        return $this;
    }

    public function image($class)
    {
        $this->imageClass = $class;
        return $this;
    }

    public function getTabs()
    {
        return $this->tabs;
    }

    public function getUniqueId()
    {
        return $this->uniqueId;
    }

    public function renderDropdown($index)
    {
        $li = new TElement('li');
        $li->{'class'} = 'nav-item dropdown';


        $a = new TElement('a');
        $a->{'class'} = 'nav-link dropdown-toggle';
        $a->{'data-bs-toggle'} = 'dropdown';
        $a->{'href'} = '#';
        $a->{'role'} = 'button';
        $a->{'aria-expanded'} = 'false';

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




        $ul = new TElement('ul');
        $ul->{'class'} = 'dropdown-menu';

        foreach ($this->tabs as $tabIndex => $tab) {
            $liTab = new TElement('li');
            $aTab = new TElement('a');
            $aTab->{'class'} = 'nav-link';
            $aTab->{'data-bs-toggle'} = 'tab';
            $aTab->{'href'} = "#kt_tab_pane_{$tab->getUniqueId()}";
            $aTab->add($tab->getLabel());

            $liTab->add($aTab);
            $ul->add($liTab);
        }

        $li->add($a);
        $li->add($ul);
        return $li;
    }
}
