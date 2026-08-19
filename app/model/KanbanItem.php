<?php
/**
 * KanbanItem
 *
 * @version    1.0
 * @package    samples
 * @subpackage tutor
 * @author     Pablo Dall'Oglio
 * @copyright  Copyright (c) 2006 Adianti Solutions Ltd. (http://www.adianti.com.br)
 * @license    https://adiantiframework.com.br/license-tutor
 */
class KanbanItem extends TRecord
{
    const TABLENAME  = 'kanban_item';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';
    
    /**
     * Constructor method
     */
    public function __construct($id = NULL, $callObjectLoad = TRUE)
    {
        parent::__construct($id, $callObjectLoad);
        parent::addAttribute('title');
        parent::addAttribute('content');
        parent::addAttribute('color');
        parent::addAttribute('item_order');
        parent::addAttribute('stage_id');
    }
}
