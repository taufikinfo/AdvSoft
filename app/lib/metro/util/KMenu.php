<?php

class KMenu extends TElement
{
    private $items;
    private $menu_class;
    private $item_class;
    private $menu_level;
    private $link_class;
    private $item_transformer;
    private $menu_transformer;
    private $side;

    /**
     * Class Constructor
     * @param $xml SimpleXMLElement parsed from XML Menu
     */
    public function __construct(
        $xml,
        $permission_callback = NULL,
        $menu_level = 1,
        $menu_class = 'dropdown-menu',
        $item_class = '',
        $link_class = 'dropdown-toggle',
        $item_transformer = null,
        $menu_transformer = null,
        $side = null)
    {
        parent::__construct('div');
        $this->items = array();
        $this->{'class'} = $menu_class . " level-{$menu_level}";
        $this->menu_class = $menu_class;
        $this->menu_level = $menu_level;
        $this->item_class = $item_class;
        $this->link_class = $link_class;
        $this->item_transformer = $item_transformer;
        $this->menu_transformer = $menu_transformer;
        $this->side = $side;

        if ($xml instanceof SimpleXMLElement) {
            $this->parse($xml, $permission_callback);
        }
    }

    /**
     * Parse a XMLElement reading menu entries
     * @param $xml A SimpleXMLElement Object
     * @param $permission_callback check permission callback
     */
    public function parse($xml, $permission_callback = NULL)
    {
        $i = 0;
        // $log = new Logger('my_logger');
        // $log->pushHandler(new StreamHandler('logfile.log', Logger::DEBUG));

        foreach ($xml as $xmlElement) {
            $atts = $xmlElement->attributes();
            $label = (string)$atts['label'];
            $action = (string)$xmlElement->action;
            $icon = (string)$xmlElement->icon;
            $menu = NULL;
            $menuItem = new KMenuItem($label, $action, $icon, $this->menu_level, $this->menu_transformer, $this->side);
            $menuItem->setLinkClass($this->link_class);

            if ($xmlElement->menu) {
                $menu_atts = $xmlElement->menu->attributes();
                $menu_class = !empty($menu_atts['class']) ? $menu_atts['class'] : $this->menu_class;
                $menu = new KMenu(
                    $xmlElement->menu->menuitem,
                    $permission_callback,
                    $this->menu_level + 1,
                    $menu_class,
                    $this->item_class,
                    $this->link_class,
                    $this->item_transformer,
                    $this->menu_transformer,
                    $this->side
                );

                foreach (parent::getProperties() as $property => $value) {
                    $menu->setProperty($property, $value);
                }

                //$log->info('This is an informational message.' .   print_r($menu , true )  );
                //$log->info('This is an informational message.' .   print_r($menu_class , true )  );

                $menuItem->setMenu($menu, $this->side);
                if ($this->item_class) {
                    $menuItem->{'class'} = $this->item_class;
                }
            }

            // just child nodes have actions
            if ($action) {
                if (!empty($action) and $permission_callback and (substr($action, 0, 7) !== 'http://') and (substr($action, 0, 8) !== 'https://')) {
                    // check permission
                    $parts = explode('#', $action);
                    $className = $parts[0];
                    if (call_user_func($permission_callback, $className)) {
                        $this->addMenuItem($menuItem);
                    }
                } else {
                    // menus without permission check
                    $this->addMenuItem($menuItem);
                }
            } // parent nodes are shown just when they have valid children (with permission)
            else if (isset($menu) and count($menu->getMenuItems()) > 0) {
                $this->addMenuItem($menuItem);
            }

            $i++;
        }
    }

    /**
     * Add a MenuItem
     * @param $menuitem A TMenuItem Object
     */
    public function addMenuItem(KMenuItem $menuitem)
    {
        if (!empty($this->item_transformer)) {
            call_user_func($this->item_transformer, $menuitem);
        }
        $this->items[] = $menuitem;
    }

    /**
     * Return the menu items
     */
    public function getMenuItems()
    {
        return $this->items;
    }

    /**
     * Shows the widget at the screen
     */
    public function show()
    {
        if ($this->items) {
            foreach ($this->items as $item) {
                parent::add($item);
            }
        }
        parent::show();
    }
}
