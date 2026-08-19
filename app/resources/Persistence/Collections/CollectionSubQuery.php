<?php
class CollectionSubQuery extends TPage
{
    public function __construct()
    {
        parent::__construct();
        try
        {
            TTransaction::open('samples');
            
            $skill_id = 1;
        	$customers = Customer::where('id', 'in',
        	    "(SELECT customer_id FROM customer_skill WHERE skill_id = :[{$skill_id}]:)")->load();
        	
        	if ($customers)
        	{
        	    foreach ($customers as $customer)
        	    {
        	        print $customer->id . '-' . $customer->name . "\n<br>";
        	    }
        	}
        	
            TTransaction::close();
        }
        catch (Exception $e)
        {
            new TMessage('error', $e->getMessage());
        }
    }
}
