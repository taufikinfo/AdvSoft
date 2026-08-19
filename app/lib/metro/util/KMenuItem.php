<?php


use Adianti\Widget\Base\TElement;

class KMenuItem extends TElement
{
    private $label;
    private $action;
    private $image;
    private $menu;
    private $level;
    private $link;
    private $linkClass;
    private $classLink;
    private $menu_transformer;
    private $tagLabel;
    private $classIcon;
    private $side;

    /**
     * Class constructor
     * @param $label  The menu label
     * @param $action The menu action
     * @param $image  The menu image
     */
    public function __construct($label, $action, $image = NULL, $level = 0, $menu_transformer = null,$side=null)
    {
        parent::__construct('div');
        parent::setProperty("class", "menu-item");

        $this->label = $label;
        $this->action = $action;
        $this->level = $level;
        $this->side = $side;
        $this->link = new TElement('span');

        if($side) {
            $this->linkClass = 'menu-item here menu-accordion';
        } else {
            $this->linkClass = 'menu-sub menu-sub-lg-down-accordion menu-sub-lg-dropdown menu-rounded-0 py-lg-4 w-lg-225px';
        }


        $this->menu_transformer = $menu_transformer;

        if ($image) {
            $this->image = $image;
        }
    }

    /**
     * Returns the action
     */
    public function getAction()
    {
        return $this->action;
    }

    /**
     * Set the action
     */
    public function setAction($action)
    {
        $this->action = $action;
    }

    /**
     * Returns the label
     */
    public function getLabel()
    {
        return $this->label;
    }

    /**
     * Set the label
     */
    public function setLabel($label)
    {
        $this->label = $label;
    }

    /**
     * Returns the image
     */
    public function getImage()
    {
        return $this->image;
    }

    /**
     * Set the image
     */
    public function setImage($image)
    {
        $this->image = $image;
    }

    /**
     * Returns the menu
     */
    public function getMenu()
    {
        return $this->menu;
    }

    /**
     * Define the submenu for the item
     * @param $menu A TMenu object
     */
    public function setMenu(KMenu $menu, $side=null)
    {
        if($side){
            $this->{'data-kt-menu-trigger'} = "click";
            $this->{'class'} = 'menu-item menu-accordion';
        } else {
            $this->{'data-kt-menu-trigger'} = "{default: 'click', lg: 'hover'}";
            $this->{'data-kt-menu-placement'} = "bottom-start";
            $this->{'class'} = 'menu-item  menu-lg-down-accordion menu-sub-lg-down-indention me-0 me-lg-2';
        }

        $this->menu = $menu;
    }

    /**
     * Returns the level
     */
    public function getLevel()
    {
        return $this->level;
    }

    /**
     * Returns the link
     */
    public function getLink()
    {
        return $this->link;
    }

    /**
     * Set link class
     */
    public function setLinkClass($class)
    {
        $this->linkClass = $class;
    }

    /**
     * Set link class Item
     */
    public function setClassLink($class)
    {
        $this->classLink = $class;
    }

    /**
     * Set icon class Item
     */
    public function setClassIcon($class)
    {
        $this->classIcon = $class;
    }

    /**
     * Set tag label
     */
    public function setTagLabel($tag)
    {
        $this->tagLabel = $tag;
    }

    /**
     * Shows the widget at the screen
     */
    public function show()
    {
        if ($this->action) {
            $action = str_replace('#', '&', $this->action);

            if(!$this->side){
                $this->{'data-kt-menu-placement'} = "right-start";
            }

            // Controll if menu.xml contains a short url e.g. \home  -> back slash is the char controll

            if (substr($action, 0, 1) == '\\') {
                $this->link->{'href'} = substr($action, 1);
                $this->link->{'generator'} = 'adianti';
            } elseif ((substr($action, 0, 7) == 'http://') or (substr($action, 0, 8) == 'https://')) {
                $this->link->{'href'} = $action;
                $this->link->{'target'} = '_blank';
            } else {
                if ($router = AdiantiCoreApplication::getRouter()) {
                    $this->link->{'href'} = $router("class={$action}", true);
                } else {
                    $this->link->{'href'} = "index.php?class={$action}";
                }

                $this->link->{'generator'} = 'adianti';
                $this->link->{'class'} = 'menu-link';
            }


        } else {
            $this->link->{'href'} = '#';

        }

        if (isset($this->image)) {
            $menuImage = new TElement("span");
            $menuImage->{"class"} = "menu-icon ".$this->level;

            $startString = "ki-";
            if(strpos($this->image, $startString) === 0){
                $this->image = str_replace(" fa-fw","",$this->image);
                $this->image = str_replace("ki-","",$this->image);
                $image = KIcon::make($this->image)->class("fs-2 text-info")->type("duotone");
            } else {

                $image = new TImage($this->image);
                if ($this->classIcon) {
                    $image->{'class'} .= " {$this->classIcon} ";
                }

            }


            $menuImage->add($image);
            $this->link->add($menuImage);
        }

        $label = new TElement($this->tagLabel ?? 'span');
        $label->setProperty("class", "menu-title");

        if (substr($this->label, 0, 3) == '_t{') {
            $label->add( _t(substr($this->label, 3, -1)) );
        } else {
            $label->add($this->label);
        }

        if (!empty($this->label)) {
            $this->link->add($label);
            $this->add($this->link);
        }

        if ($this->classLink) {
            $this->link->{'class'} = $this->classLink;
        }


        if ($this->menu instanceof KMenu) {

            $arrow = new TElement("span");
            $arrow->{'class'} = 'menu-arrow';
            $this->link->add($arrow);

            $this->link->{'class'} = "menu-link py-3";

            if (strstr($this->linkClass, 'dropdown')) {
                $this->link->{'data-bs-toggle'} = "dropdown";
            }

            if ($this->level == 0) {
                $caret = new TElement('b');
                $caret->{'class'} = 'caret';
                $caret->add('');
                $this->link->add($caret);
            }

            if (!empty($this->menu_transformer)) {
                $this->link = call_user_func($this->menu_transformer, $this->link);
            }

            parent::add($this->menu);
        }

        parent::show();
    }
}
