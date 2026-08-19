<?php

use Adianti\Widget\Base\TElement;

class KCard
{
    private $title;
    private $description;
    private $style;
    private $columns;
    private $schema = [];
    private $collapsible = false;
    private $toolbar;
    private $form;
    private $footer = null;
    private $uniqueId;
    private $customClass = 'card mb-6';
    private $customBodyClass = 'card-body';
    private $ribbonHeader;
    private $ribbonLabel;
    private $ribbonContent;
    private $isSticky = false;

    public static function make($title = null, $description = null)
    {
        $instance = new self();
        $instance->title = $title;
        $instance->description = $description;
        $instance->uniqueId = uniqid('kcard_', true); // Generate a unique ID
        return $instance;
    }

    public function schema($schema)
    {
        $this->schema = $schema;
        return $this;
    }

    public function collapsible($collapsible)
    {
        $this->collapsible = $collapsible;
        return $this;
    }

    public function class($class)
    {
        $this->customClass = $class;
        return $this;
    }

    public function classbody($class)
    {
        $this->customBodyClass .= ' ' . $class;
        return $this;
    }

    public function ribbon($header, $label, $content)
    {
        $this->ribbonHeader = $header;
        $this->ribbonLabel = $label;
        $this->ribbonContent = $content;
        return $this;
    }

    public function sticky($sticky)
    {
        $this->isSticky = $sticky;
        return $this;
    }

    public function render()
    {
        $card = new TElement('div');
        $card->{'class'} = $this->customClass;
        $card->{'style'} = $this->style;
        $card->{'id'} = $this->uniqueId; // Set the unique ID

        if ($this->isSticky) {
            $card->{'data-kt-sticky'} = 'true';
            $card->{'data-kt-sticky-name'} = 'docs-sticky-summary';
            $card->{'data-kt-sticky-offset'} = '{default: false, xl: "200px"}';
            $card->{'data-kt-sticky-width'} = '{lg: "250px", xl: "300px"}';
            $card->{'data-kt-sticky-left'} = 'auto';
            $card->{'data-kt-sticky-top'} = '100px';
            $card->{'data-kt-sticky-animation'} = 'false';
            $card->{'data-kt-sticky-zindex'} = '95';
        }

        if (($this->title !== '' && !is_null($this->title)) || ($this->description !== '' && !is_null($this->description)) || $this->ribbonHeader) {
            $header = new TElement('div');
            $header->{'class'} = 'card-header ' . ($this->ribbonHeader ?: 'card-header');

            if ($this->collapsible) {
                $header->{'class'} .= ' collapsible cursor-pointer rotate';
                $header->{'data-bs-toggle'} = 'collapse';
                $header->{'data-bs-target'} = '#card_collapsible_' . md5($this->title);
            }

            if ($this->ribbonLabel && $this->ribbonContent) {
                $ribbon = new TElement('div');
                $ribbon->{'class'} = $this->ribbonLabel;
                $ribbon->add($this->ribbonContent);
                $header->add($ribbon);
            }

            $titleContainer = new TElement('div');
            $titleContainer->{'class'} = 'card-title flex-column';

            if ($this->title !== '' && !is_null($this->title)) {
                $title = new TElement('h4');
                $title->{'class'} = 'mb-1';
                $title->add($this->title);
                $titleContainer->add($title);
            }

            if ($this->description !== '' && !is_null($this->description)) {
                $description = new TElement('div');
                $description->{'class'} = 'fs-6 fw-semibold text-muted';
                $description->add($this->description);
                $titleContainer->add($description);
            }

            $header->add($titleContainer);

            $toolbar = new TElement('div');
            $toolbar->{'class'} = 'card-toolbar';

            if ($this->collapsible) {
                $toolbar->{'class'} .= ' rotate-180';
                $toolbar->add('<i class="ki-duotone ki-down fs-1"></i>');
            }

            if ($this->toolbar) {
                foreach ($this->toolbar as $toolbarElement) {
                    $toolbar->add($toolbarElement->render());
                }
            }

            $header->add($toolbar);
            $card->add($header);
        }

        if ($this->collapsible) {
            $collapse = new TElement('div');
            $collapse->{'class'} = $this->customBodyClass . ' collapse show';
            $collapse->{'id'} = 'card_collapsible_' . md5($this->title ?? '');
            $cardBody = $collapse;
        } else {
            $cardBody = new TElement('div');
            $cardBody->{'class'} = $this->customBodyClass;
        }

        foreach ($this->schema as $layout) {
            if ($layout instanceof KTabBuilder) {
                $cardBody->add($layout->render());
            } else {
                $cardBody->add($layout->render());
            }
        }

        if ($this->form) {
            $this->form->add($cardBody);
            $cardBody = $this->form;
        }

        $card->add($cardBody);

        if ($this->footer !== null) {
            $footerDiv = new TElement('div');
            $footerDiv->{'class'} = 'card-footer d-flex justify-content-end py-6 px-9';

            foreach ($this->footer as $footerElement) {
                $footerDiv->add($footerElement->render());
            }

            $card->add($footerDiv);
        }

        return $card->getContents();
    }

    public function columns(string $columns)
    {
        $this->columns = $columns;
        return $this;
    }

    public function style(string $style = "")
    {
        $this->style = $style;
        return $this;
    }

    public function getFields()
    {
        $fields = [];
        foreach ($this->schema as $layout) {
            if (is_object($layout) && method_exists($layout, 'getFields')) {
                $fields = array_merge($fields, $layout->getFields());
            }
        }
        return $fields;
    }

    public function toolbar($toolbar)
    {
        $this->toolbar = $toolbar;
        return $this;
    }

    public function makeform($formName)
    {
        $this->form = new TElement('form');
        $this->form->{'class'} = 'form-horizontal';
        $this->form->{'type'} = 'bootstrap';
        $this->form->{'novalidate'} = '';
        $this->form->{'enctype'} = 'multipart/form-data';
        $this->form->{'name'} = $formName;
        $this->form->{'id'} = $formName;
        $this->form->{'method'} = 'post';
        return $this;
    }

    public function footer($footer)
    {
        $this->footer = $footer;
        return $this;
    }
}
?>
