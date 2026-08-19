<?php

use Adianti\Widget\Base\TElement;

class KTabBuilder
{
    private $type;
    private $style;
    private $schema = [];
    private $customClass = 'nav nav-tabs nav-line-tabs mb-5 fs-6';

    public static function make()
    {
        return new self();
    }

    public function type($type)
    {
        $this->type = $type;
        return $this;
    }

    public function style($style)
    {
        $this->style = $style;
        return $this;
    }

    public function class($class)
    {
        $this->customClass = $class;
        return $this;
    }

    public function schema($schema)
    {
        $this->schema = $schema;
        return $this;
    }

    public function render()
    {
        $ul = new TElement('ul');
        $ul->{'class'} = $this->customClass;
        $ul->{'style'} = $this->style;

        $tabContent = new TElement('div');
        $tabContent->{'class'} = 'tab-content';
        $tabContent->{'id'} = 'myTabContent';

        $tabIndex = 1;
        foreach ($this->schema as $tab) {
            if ($tab instanceof KTab) {
                $ul->add($tab->renderNavItem($tabIndex));
                $tabContent->add($tab->renderTabPane($tabIndex, $tabIndex === 1));
            } elseif ($tab instanceof KTabMenu) {
                $ul->add($tab->renderDropdown($tabIndex));
                foreach ($tab->getTabs() as $subTab) {
                    $tabContent->add($subTab->renderTabPane($tabIndex, false));
                    $tabIndex++;
                }
            }
            $tabIndex++;
        }

        $container = new TElement('div');
        $container->add($ul);
        $container->add($tabContent);

        return $container->getContents();
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
