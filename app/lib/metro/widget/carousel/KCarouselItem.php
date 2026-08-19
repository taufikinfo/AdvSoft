<?php

use Adianti\Widget\Base\TElement;

class KCarouselItem
{
    private $schema = [];

    public static function make()
    {
        return new self();
    }

    public function schema($schema)
    {
        $this->schema = $schema;
        return $this;
    }

    public function render()
    {
        $content = new TElement('div');

        foreach ($this->schema as $element) {
            if (is_string($element)) {
                $content->add($element);
            } elseif ($element instanceof TElement) {
                $content->add($element->getContents());
            }
        }

        return $content;
    }
}
?>
