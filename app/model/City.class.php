<?php
/**
 * City
 *
 * @version    1.0
 * @package    samples
 * @subpackage tutor
 * @author     Pablo Dall'Oglio
 * @copyright  Copyright (c) 2006 Adianti Solutions Ltd. (http://www.adianti.com.br)
 * @license    https://adiantiframework.com.br/license-tutor
 */
class City extends TRecord
{
    const TABLENAME = 'city';
    const PRIMARYKEY= 'id';
    const IDPOLICY =  'max'; // {max, serial}
    
    
    /**
     * Constructor method
     */
    public function __construct($id = NULL)
    {
        parent::__construct($id);
        parent::addAttribute('name');
        parent::addAttribute('state_id');
    }
    
    /**
     * Returns the state
     */
    public function get_state()
    {
        return State::find($this->state_id);
        //return State::findCache($this->state_id);
    }
    
    /**
     * Method getCustomers
     */
    public function getCustomers()
    {
        $criteria = new TCriteria;
        $criteria->add(new TFilter('city_id', '=', $this->id));
        return Customer::getObjects( $criteria );
    }
    
    /**
     * Delete
     */
    public function delete($id = NULL)
    {
        $id = isset($id) ? $id : $this->id;
        
        // check dependencies
        parent::checkDependencies('Customer', 'city_id', $id, 'Customer');
        
        // delete this object
        parent::delete($id);
    }
}
