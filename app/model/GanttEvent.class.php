<?php
/**
 * GanttEvent
 *
 * @version    1.0
 * @package    samples
 * @subpackage tutor
 * @author     Pablo Dall'Oglio
 * @copyright  Copyright (c) 2006 Adianti Solutions Ltd. (http://www.adianti.com.br)
 * @license    https://adiantiframework.com.br/license-tutor
 */
class GanttEvent extends TRecord
{
    const TABLENAME = 'gantt_event';
    const PRIMARYKEY= 'id';
    const IDPOLICY =  'max'; // {max, serial}
    
    
    /**
     * Constructor method
     */
    public function __construct($id = NULL, $callObjectLoad = TRUE)
    {
        parent::__construct($id, $callObjectLoad);
        parent::addAttribute('group_id');
        parent::addAttribute('start_time');
        parent::addAttribute('end_time');
        parent::addAttribute('title');
        parent::addAttribute('description');
        parent::addAttribute('color');
        parent::addAttribute('percent');
    }
}
