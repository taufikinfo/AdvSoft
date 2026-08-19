<?php
class AdiantiMenuBuilder
{
    const CHECK_PERMISSION = null;
    
    /**
     * Parse main menu and converts into HTML
     */
    public static function parse($file, $theme)
    {
        if (!extension_loaded('SimpleXML'))
        {
            throw new Exception(_t('Extension not found: ^1', 'SimpleXML'));
        }
        
        if (!file_exists($file))
        {
            throw new Exception(_t('File not found').': ' . $file);
        }
        
        if ($theme == 'adminbs5')
        {
            $xml  = new SimpleXMLElement(file_get_contents($file));
            $menu = new TMenu($xml, self::CHECK_PERMISSION, 1, 'sidebar-dropdown list-unstyled collapse', 'sidebar-item', 'sidebar-link collapsed', [__class__, 'prepareItem']);
            $menu->class = 'sidebar-nav';
            $menu->id    = 'side-menu';

            ob_start();
            $menu->show();
            return ob_get_clean();
        }
        else if ($theme == 'metronic')
        {
            $xml  = new SimpleXMLElement(file_get_contents($file));
            return self::parseMetronicMenu($xml);
        }
        else
        {
            throw new Exception(_t('Theme not supported').': ' . $theme);
        }
    }
    
    /**
     * Parse Metronic Menu
     */
    public static function parseMetronicMenu($xml, $level = 1)
    {
        $html = '';
        if ($level == 1)
        {
            $html .= '<div class="menu menu-column menu-rounded menu-sub-indention px-3 fw-semibold fs-6" id="#kt_app_sidebar_menu" data-kt-menu="true" data-kt-menu-expand="false">';
        }

        foreach ($xml->menuitem as $xmlElement)
        {
            $atts     = $xmlElement->attributes();
            $label    = (string) $atts['label'];
            $action   = (string) $xmlElement->action;
            $icon     = (string) $xmlElement->icon;
            
            $translated_label = $label;
            if (substr($label, 0, 3) == '_t{')
            {
                $translated_label = _t(substr($label, 3, -1));
            }
            else if (substr($label, 0, 4) == '_tf{')
            {
                $ini = AdiantiApplicationConfig::get();
                $translated_label = _tf(substr($label, 4, -1), $ini['general']['source_language']);
            }

            $icon_html = '';
            if (!empty($icon) && $icon !== 'far:circle fa-fw' && $icon !== 'far:circle')
            {
                $icon_html = self::getIconHtml($icon);
            }
            else
            {
                $icon_html = '<span class="menu-bullet"><span class="bullet bullet-dot"></span></span>';
            }

            if ($xmlElement->menu)
            {
                // Has submenus
                $html .= '<div class="menu-item menu-accordion" data-kt-menu-trigger="click">';
                $html .= '  <span class="menu-link">';
                $html .= '    ' . $icon_html;
                $html .= '    <span class="menu-title">' . htmlspecialchars($translated_label) . '</span>';
                $html .= '    <span class="menu-arrow"></span>';
                $html .= '  </span>';
                $html .= '  <div class="menu-sub menu-sub-accordion">';
                $html .= self::parseMetronicMenu($xmlElement->menu, $level + 1);
                $html .= '  </div>';
                $html .= '</div>';
            }
            else
            {
                // Leaf item
                $link = '#';
                if (!empty($action))
                {
                    $action = str_replace('#', '&', $action);
                    if (substr($action, 0, 1) == '\\')
                    {
                        $link = substr($action, 1);
                    }
                    elseif ((substr($action, 0, 7) == 'http://') or (substr($action, 0, 8) == 'https://'))
                    {
                        $link = $action;
                    }
                    else
                    {
                        $link = "index.php?class={$action}";
                    }
                }

                $html .= '<div class="menu-item">';
                $html .= '  <a class="menu-link" href="' . htmlspecialchars($link) . '" generator="adianti">';
                $html .= '    ' . $icon_html;
                $html .= '    <span class="menu-title">' . htmlspecialchars($translated_label) . '</span>';
                $html .= '  </a>';
                $html .= '</div>';
            }
        }

        if ($level == 1)
        {
            $html .= '</div>';
        }

        return $html;
    }

    /**
     * Get Icon HTML
     */
    public static function getIconHtml($source)
    {
        if (empty($source))
        {
            return '';
        }

        $class = '';
        $style = '';

        if (substr($source, 0, 3) == 'fa:')
        {
            $fa_class = substr($source, 3);
            if (strstr($source, '#') !== FALSE)
            {
                $parts = explode('#', $fa_class);
                $fa_color   = trim(substr($parts[1], 0, 7));
                $fa_bgcolor = !empty($parts[2]) ? substr($parts[2], 0, 7) : null;
                $fa_class   = trim(str_replace( ['#'.$fa_color, '#'.$fa_bgcolor], ['', ''], $fa_class));
            }
            $class = 'fa fa-' . $fa_class;
            if (!empty($fa_color))
            {
                $style .= "color: #{$fa_color};";
            }
            if (!empty($fa_bgcolor))
            {
                $style .= "background-color: #{$fa_bgcolor};";
            }
        }
        else if ( ( substr($source,0,4) == 'far:') || (substr($source,0,4) == 'fas:') || (substr($source,0,4) == 'fab:') || (substr($source,0,4) == 'fal:') || (substr($source,0,4) == 'fad:'))
        {
            $fa_class = substr($source, 4);
            if (strstr($source, '#') !== FALSE)
            {
                $parts = explode('#', $fa_class);
                $fa_color   = trim(substr($parts[1], 0, 7));
                $fa_bgcolor = !empty($parts[2]) ? substr($parts[2], 0, 7) : null;
                $fa_class   = trim(str_replace( ['#'.$fa_color, '#'.$fa_bgcolor], ['', ''], $fa_class));
            }
            $class = substr($source, 0, 3) . ' fa-' . $fa_class;
            if (!empty($fa_color))
            {
                $style .= "color: #{$fa_color};";
            }
            if (!empty($fa_bgcolor))
            {
                $style .= "background-color: #{$fa_bgcolor};";
            }
        }
        else if (substr($source, 0, 3) == 'mi:')
        {
            $mi_class = substr($source, 3);
            if (strstr($source, '#') !== FALSE)
            {
                $pieces = explode('#', $mi_class);
                $mi_class = $pieces[0];
                $mi_color = $pieces[1];
            }
            $class = 'material-icons';
            $pieces = explode(' ', $mi_class);
            if (count($pieces) > 1)
            {
                $mi_class = array_shift($pieces);
                $class = 'material-icons ' . implode(' ', $pieces);
            }
            if (isset($mi_color))
            {
                $style .= "color: #{$mi_color};";
            }
        }
        else
        {
            $class = $source;
        }

        $style_attr = !empty($style) ? ' style="' . htmlspecialchars($style) . '"' : '';
        return '<span class="menu-icon"><i class="' . htmlspecialchars($class) . '"' . $style_attr . '></i></span>';
    }
    
    /**
     *
     */
    public static function prepareItem($menuitem)
    {
        $ini = AdiantiApplicationConfig::get();
        if (!empty($ini['template']['navbar']['allow_page_tabs']))
        {
            $action = $menuitem->getAction();
            if (!$menuitem->getMenu() && strpos($action, 'LoginForm#method=onLogout') === false)
            {
                $open_tab = new TElement('div');
                $open_tab->title = _t('Open in new tab');
                $open_tab->onclick = "event.stopPropagation();Template.createPageTabFromMenu(this);return false;";
                $open_tab->style = 'width: 15px;height: var(--ad-font-size-menu);position: relative;float: right;';
                $open_tab->add('<i class="fa-solid fa-up-right-from-square" style="font-size:9pt"></i>');
                $menuitem->setRightWidget($open_tab);
            }
        }
    }
    
    /**
     *
     */
    public static function parseNavBar($file, $theme)
    {
        if (file_exists($file))
        {
            return AdiantiNavBarParser::parse($file);
        }
        
        return '';
    }
}
