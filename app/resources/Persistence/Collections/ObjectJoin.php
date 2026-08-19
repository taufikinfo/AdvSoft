<?php
class ObjectJoin extends TPage
{
    public function __construct()
    {
        parent::__construct();
        try
        {
            TTransaction::open('samples');
            TTransaction::dump();
            echo '<pre>';
            
            // Load Customer + City + State
            var_dump(Customer::select('customer.id', 'customer.name', 'city.id as city_id', 'city.name as city_name')
                             -> join('city', ['customer.city_id' => 'city.id'])
                             ->join('state', ['city.state_id' => 'state.id'])
                             ->load(null, false)); // turn off object load
            
            // count customers by city
            var_dump(Customer::join('city', ['customer.city_id' => 'city.id'])
                             ->join('state', ['city.state_id' => 'state.id'])
                             ->groupBy(['city.id', 'city.name'])
                             ->countBy('customer.id', 'count_alias'));
            
            echo '</pre>';
            TTransaction::close();
        }
        catch (Exception $e)
        {
            new TMessage('error', $e->getMessage());
        }
    }
}
