<?php

use Adianti\Widget\Base\TElement;

class KCarousel
{
    private $title;
    private $schema = [];
    private $customClass = 'carousel carousel-custom slide';
    private $uniqueId;

    public static function make($title = null)
    {
        $instance = new self();
        $instance->title = $title;
        $instance->uniqueId = uniqid('kt_carousel_', true); // Generate a unique ID
        return $instance;
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
        $carousel = new TElement('div');
        $carousel->{'id'} = $this->uniqueId;
        $carousel->{'class'} = $this->customClass;
        $carousel->{'data-bs-ride'} = 'carousel';
        $carousel->{'data-bs-interval'} = '8000';

        // Heading
        $heading = new TElement('div');
        $heading->{'class'} = 'd-flex align-items-center justify-content-between flex-wrap';

        $label = new TElement('span');
        $label->{'class'} = 'fs-4 fw-bold pe-2';
        $label->add($this->title);

        $indicators = new TElement('ol');
        $indicators->{'class'} = 'p-0 m-0 carousel-indicators carousel-indicators-bullet carousel-indicators-active-primary';

        $heading->add($label);
        $heading->add($indicators);

        $carousel->add($heading);

        // Carousel inner
        $carouselInner = new TElement('div');
        $carouselInner->{'class'} = 'carousel-inner pt-8';

        foreach ($this->schema as $index => $item) {
            if ($item instanceof KCarouselItem) {
                $carouselItem = new TElement('div');
                $carouselItem->{'class'} = 'carousel-item' . ($index === 0 ? ' active' : '');
                $carouselItem->add($item->render());

                $carouselInner->add($carouselItem);

                $indicator = new TElement('li');
                $indicator->{'data-bs-target'} = '#' . $this->uniqueId;
                $indicator->{'data-bs-slide-to'} = $index;
                $indicator->{'class'} = 'ms-1' . ($index === 0 ? ' active' : '');

                $indicators->add($indicator);
            }
        }

        $carousel->add($carouselInner);

        return $carousel;
    }

    public function show()
    {
        $this->render()->show();
    }
}
?>
