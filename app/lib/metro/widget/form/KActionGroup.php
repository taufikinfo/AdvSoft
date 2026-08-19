
<?php

use Adianti\Widget\Base\TElement;
use Adianti\Widget\Util\TDropDown;

class KActionGroup
{
    private $actions;
    private $headers;
    private $separators;
    private $label;
    private $icon;
    private $index;
    private $name;

    /**
     * Constructor
     * @param $label Action KGroup label
     * @param $icon  Action KGroup icon
     */
    public function __construct( $label, $icon = NULL)
    {
        $this->index = 0;
        $this->actions = array();
        $this->label = $label;
        $this->icon = $icon;
    }

    /**
     * Returns the Action KGroup label
     */
    public function getLabel()
    {
        return $this->label;
    }

    public function getName()
    {
        return $this->name;
    }

    /**
     * Returns the Action KGroup icon
     */
    public function getIcon()
    {
        return $this->icon;
    }

    /**
     * Add an action to the actions group
     * @param $action TAction object
     */
    public function addAction(TActionLink $action)
    {
        $this->actions[ $this->index ] = $action;
        $this->index ++;
    }

    /**
     * Add a separator
     */
    public function addSeparator()
    {
        $this->separators[ $this->index ] = TRUE;
        $this->index ++;
    }

    /**
     * Add a header
     * @param $header Options header
     */
    public function addHeader($header)
    {
        $this->headers[ $this->index ] = $header;
        $this->index ++;
    }

    /**
     * Returns the actions
     */
    public function getActions()
    {
        return $this->actions;
    }

    /**
     * Returns the headers
     */
    public function getHeaders()
    {
        return $this->headers;
    }

    /**
     * Returns the separators
     */
    public function getSeparators()
    {
        return $this->separators;
    }

    public function show(){

        foreach ($this->actions as $action){
            $action->show();
        }
       /* if ($this->action_groups)
        {
            foreach ($this->action_groups as $action_group)
            {
                $actions    = $action_group->getActions();
                $headers    = $action_group->getHeaders();
                $separators = $action_group->getSeparators();

                if ($actions)
                {
                    $dropdown = new TDropDown($action_group->getLabel(), $action_group->getIcon());
                    $last_index = 0;
                    foreach ($actions as $index => $action_template)
                    {
                        $action = $action_template->prepare($object);

                        // add intermediate headers and separators
                        for ($n=$last_index; $n<$index; $n++)
                        {
                            if (isset($headers[$n]))
                            {
                                $dropdown->addHeader($headers[$n]);
                            }
                            if (isset($separators[$n]))
                            {
                                $dropdown->addSeparator();
                            }
                        }

                        // get the action properties
                        $label  = $action->getLabel();
                        $image  = $action->getImage();
                        $condition = $action->getDisplayCondition();

                        if (empty($condition) OR call_user_func($condition, $object))
                        {
                            $url       = $action->serialize(TRUE, TRUE);
                            $first_url = isset($first_url) ? $first_url : $url;

                            if ($url !== '#disabled')
                            {
                                $dropdown->addAction($label, $action, $image);
                            }
                        }
                        $last_index = $index;
                    }
                    // add the cell to the row
                    $cell = new TElement('td');
                    $row->add($cell);
                    $cell->add($dropdown);
                    $cell->{'class'} = 'tdatagrid_cell action';
                }
            }
        }*/
    }
}
