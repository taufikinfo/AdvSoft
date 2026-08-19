<?php



class KAccordionItem
{
    private $header;
    private $toolbar = [];
    private $schema = [];
    private $accordionId;
    private $itemId;

    public static function make()
    {
        return new self();
    }

    public function header($title)
    {
        $this->header = $title;
        return $this;
    }

    public function toolbar(array $toolbar)
    {
        if (is_array($toolbar)) {
            foreach ($toolbar as $tool) {
                if ($tool instanceof KAction || $tool instanceof KCard || $tool instanceof KFieldRow || $tool instanceof KFieldSet || $tool instanceof KTable) {
                    $this->toolbar[] = $tool;
                }
            }
        } else {
            $this->toolbar[] = $toolbar;
        }
        return $this;
    }

    public function schema(array $schema)
    {
        if (is_array($schema)) {
            foreach ($schema as $item) {
                if ($item instanceof KAction || $item instanceof KCard || $item instanceof KFieldRow || $item instanceof KFieldSet || $item instanceof KTable) {
                    $this->schema[] = $item;
                } else {
                    $this->schema[] = (string)$item;
                }
            }
        } else {
            $this->schema[] = (string)$schema;
        }
        return $this;
    }

    public function setAccordionId($id)
    {
        $this->accordionId = $id;
    }

    public function setItemId($id)
    {
        $this->itemId = $id;
    }

    public function render()
    {
        $item = new TElement('div');
        $item->{'class'} = 'py-0';
        $item->{'data-kt-customer-payment-method'} = 'row';

        // Header
        $header = new TElement('div');
        $header->{'class'} = 'py-3 d-flex flex-stack flex-wrap';

        $toggle = new TElement('div');
        $toggle->{'class'} = 'accordion-header d-flex align-items-center collapsed';
        $toggle->{'data-bs-toggle'} = 'collapse';
        $toggle->{'href'} = '#kt_accordion_pane_' . $this->itemId;
        $toggle->{'role'} = 'button';
        $toggle->{'aria-expanded'} = 'false';
        $toggle->{'aria-controls'} = 'kt_accordion_pane_' . $this->itemId;

        $icon = new TElement('div');
        $icon->{'class'} = 'accordion-icon me-2';
        $icon->add('<i class="ki-duotone ki-right fs-4"></i>');

        $toggle->add($icon);
        $toggle->add($this->header);

        $header->add($toggle);

        // Toolbar
        if (!empty($this->toolbar)) {
            $toolbar = new TElement('div');
            $toolbar->{'class'} = 'd-flex my-3 ms-9';
            foreach ($this->toolbar as $tool) {
                $toolbar->add($tool->render());
            }
            $header->add($toolbar);
        }

        $item->add($header);

        // Body
        $body = new TElement('div');
        $body->{'id'} = 'kt_accordion_pane_' . $this->itemId;
        $body->{'class'} = 'fs-6 ps-10 collapse';
        $body->{'data-bs-parent'} = '#' . $this->accordionId;

        foreach ($this->schema as $content) {
            if ( $content instanceof KHtml || $content instanceof KAction || $content instanceof KCard || $content instanceof KFieldRow || $content instanceof KFieldSet || $content instanceof KTable) {
                $body->add($content->render());
            } else {
                $body->add($content);
            }
        }

        $item->add($body);

        return $item->getContents();
    }
}