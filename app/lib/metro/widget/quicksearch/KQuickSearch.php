<?php

use Adianti\Widget\Base\TElement;
use Adianti\Widget\Wrapper\TQuickSearch;
use Adianti\Control\TAction;

class KQuickSearch
{
    private $id;
    private $placeholder;
    private $toolbar;
    private $preferences;

    public function __construct($id)
    {
        $this->id = $id;
        $this->toolbar = [];
        $this->preferences = [];
    }

    public function placeholder($text)
    {
        $this->placeholder = $text;
        return $this;
    }

    public function toolbar($actions)
    {
        $this->toolbar = $actions;
        return $this;
    }

    public function preference($preferences)
    {
        $this->preferences = $preferences;
        return $this;
    }

    public function show()
    {
        $element = $this->get();
        $element->show();
        TScript::create("kquicksearch_enable_field('{$this->id}');");
    }

    public function get()
    {
        $wrapper = new TElement('div');
        $wrapper->id = $this->id;
        $wrapper->{'class'} = "d-flex align-items-center w-lg-600px";
        $wrapper->{'data-kt-search-keypress'} = "true";
        $wrapper->{'data-kt-search-min-length'} = "2";
        $wrapper->{'data-kt-search-enter'} = "enter";
        $wrapper->{'data-kt-search-layout'} = "menu";
        $wrapper->{'data-kt-search-responsive'} = "lg";
        $wrapper->{'data-kt-menu-trigger'} = "auto";
        $wrapper->{'data-kt-menu-permanent'} = "true";
        $wrapper->{'data-kt-menu-placement'} = "bottom-start";

        // Tablet and mobile search toggle
        $toggle = new TElement('div');
        $toggle->{'data-kt-search-element'} = "toggle";
        $toggle->{'class'} = "d-flex d-lg-none align-items-center";
        $toggleIcon = new TElement('div');
        $toggleIcon->{'class'} = "btn btn-icon btn-active-light-primary";
        $toggleIcon->add(KIcon::make("magnifier")->class("fs-1"));
        $toggle->add($toggleIcon);
        $wrapper->add($toggle);

        // Form
        $form = new TElement('form');
        $form->{'data-kt-search-element'} = "form";
        $form->{'class'} = "d-none d-lg-block w-100 position-relative mb-5 mb-lg-0";
        $form->{'autocomplete'} = "off";

        // Hidden input
        $hiddenInput = new TElement('input');
        $hiddenInput->type = "hidden";
        $form->add($hiddenInput);

        // Icon
        $form->add(KIcon::make("magnifier")->class("fs-2 fs-lg-1 text-gray-500 position-absolute top-50 translate-middle-y ms-5"));

        // Input
        $input = new TElement('input');
        $input->type = "text";
        $input->{'class'} = "form-control form-control-solid ps-14";
        $input->name = "search";
        $input->value = "";
        $input->placeholder = $this->placeholder;
        $input->{'data-kt-search-element'} = "input";
        $form->add($input);

        // Spinner
        $spinnerWrapper = new TElement('span');
        $spinnerWrapper->{'class'} = "position-absolute top-50 end-0 translate-middle-y lh-0 d-none me-6";
        $spinnerWrapper->{'data-kt-search-element'} = "spinner";
        $spinner = new TElement('span');
        $spinner->{'class'} = "spinner-border h-15px w-15px align-middle text-gray-500";
        $spinnerWrapper->add($spinner);
        $form->add($spinnerWrapper);

        // Reset
        $reset = new TElement('span');
        $reset->{'class'} = "btn btn-flush btn-active-color-primary position-absolute top-50 end-0 translate-middle-y lh-0 me-5 d-none";
        $reset->{'data-kt-search-element'} = "clear";
        $reset->add(KIcon::make("cross")->class("fs-2 fs-lg-1 me-0"));
        $form->add($reset);

        // Toolbar
        $toolbarWrapper = new TElement('div');
        $toolbarWrapper->{'class'} = "position-absolute top-50 end-0 translate-middle-y";
        $toolbarWrapper->{'data-kt-search-element'} = "toolbar";

        foreach ($this->toolbar as $action) {
            $actionWrapper = new TElement('div');
            $actionWrapper->{'data-kt-search-element'} = $action['data-kt-search-element'];
            $actionWrapper->{'class'} = "btn btn-icon w-20px btn-sm btn-active-color-primary me-1";
            $actionWrapper->{'data-bs-toggle'} = "tooltip";
            $actionWrapper->title = $action['title'];
            $actionWrapper->add($action['icon']);
            $toolbarWrapper->add($actionWrapper);
        }

        $form->add($toolbarWrapper);
        $wrapper->add($form);

        // Menu
        $menu = new TElement('div');
        $menu->{'data-kt-search-element'} = "content";
        $menu->{'class'} = "menu menu-sub menu-sub-dropdown w-300px w-md-600px py-7 px-7 overflow-hidden";

        // Wrapper
        $menuWrapper = new TElement('div');
        $menuWrapper->{'data-kt-search-element'} = "wrapper";

        // Categories
        $categories = new TElement('div');
        $categories->{'data-kt-search-element'} = "categories";
        $categories->add('categories...');  // Add categories content
        $menuWrapper->add($categories);

        // Search results
        $results = new TElement('div');
        $results->{'data-kt-search-element'} = "results";
        $results->{'class'} = "d-none";
        $results->add('results...');  // Add search results content
        $menuWrapper->add($results);

        // Recently viewed
        $recentlyViewed = new TElement('div');
        $recentlyViewed->{'data-kt-search-element'} = "recently-viewed";
        $recentlyViewed->add('recently-viewed...');  // Add recently viewed content
        $menuWrapper->add($recentlyViewed);

        $empty = new TElement('div');
        $empty->{'data-kt-search-element'} = "main";
        $empty->{'class'} = "mb-4";
        $empty->add('main..');  // Add empty search content
        $menuWrapper->add($empty);

        // Empty search
        $emptyElement = new TElement('div');
        $emptyElement->{'class'} = 'text-center d-none';
        $emptyElement->{'data-kt-search-element'} = 'empty';
        $iconDiv = new TElement('div');
        $iconDiv->{'class'} = 'pt-10 pb-10';
        $icon = KIcon::make("search-list")->class("fs-4x opacity-50");
        $iconDiv->add($icon);
        $messageDiv = new TElement('div');
        $messageDiv->{'class'} = 'pb-15 fw-semibold';
        $header = new TElement('h3');
        $header->{'class'} = 'text-gray-600 fs-5 mb-2';
        $header->add('No result found');
        $messageText = new TElement('div');
        $messageText->{'class'} = 'text-muted fs-7';
        $messageText->add('Please try again with a different query');
        $messageDiv->add($header);
        $messageDiv->add($messageText);
        $emptyElement->add($iconDiv);
        $emptyElement->add($messageDiv);
        $menuWrapper->add($emptyElement);


        $empty = new TElement('div');
        $empty->{'data-kt-search-element'} = "advanced-options-form";
        $empty->{'class'} = "pt-1 d-none";
        $mainDiv = new TElement('div');
        $mainDiv->{'class'} = 'd-flex justify-content-end';

        // Create the cancel button element
        $cancelButton = new TElement('button');
        $cancelButton->type = 'reset';
        $cancelButton->{'class'} = 'btn btn-sm btn-white fw-bold btn-active-light-primary me-2';
        $cancelButton->{'data-kt-search-element'} = 'advanced-options-form-cancel';
        $cancelButton->add('Cancel');  // Add the text 'Cancel' inside the button

        // Create the search anchor element
        $searchAnchor = new TElement('a');
        $searchAnchor->href = 'pages/search/horizontal.html';
        $searchAnchor->{'class'} = 'btn btn-sm fw-bold btn-primary';
        $searchAnchor->{'data-kt-search-element'} = 'advanced-options-form-search';
        $searchAnchor->add('Search');  // Add the text 'Search' inside the anchor

        // Add the cancel button and search anchor to the main div
        $mainDiv->add($cancelButton);
        $mainDiv->add($searchAnchor);

        $empty->add($mainDiv);  // Add empty search content
        $menu->add($empty);



        // Preferences
        $preferences = new TElement('div');
        $preferences->{'data-kt-search-element'} = "preferences";
        $preferences->{'class'} = "pt-1 d-none";

        $mainDiv = new TElement('div');
        $mainDiv->{'class'} = 'd-flex justify-content-end pt-7';

        // Create the cancel button element
        $cancelButton = new TElement('button');
        $cancelButton->type = 'reset';
        $cancelButton->{'class'} = 'btn btn-sm btn-white fw-bold btn-active-light-primary me-2';
        $cancelButton->{'data-kt-search-element'} = 'preferences-dismiss';
        $cancelButton->add('Cancel');  // Add the text 'Cancel' inside the button

        // Create the save changes button element
        $saveButton = new TElement('button');
        $saveButton->type = 'submit';
        $saveButton->{'class'} = 'btn btn-sm fw-bold btn-primary';
        $saveButton->add('Save Changes');  // Add the text 'Save Changes' inside the button

        // Add the cancel button and save changes button to the main div
        $mainDiv->add($cancelButton);
        $mainDiv->add($saveButton);


        $preferences->add($mainDiv);  // Add empty search content

        $menu->add($preferences);

        $menu->add($menuWrapper);

        $wrapper->add($menu);

        return $wrapper;
    }

    public static function make($id)
    {
        return new self($id);
    }
}

?>
