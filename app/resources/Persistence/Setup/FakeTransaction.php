<?php 
class FakeTransaction extends TPage 
{ 
    public function __construct() 
    { 
        parent::__construct(); 
        try 
        { 
            TTransaction::openFake('samples'); // abre uma transação sem begin/commit
            // ...
            TTransaction::close(); // fecha a transação. 
        } 
        catch (Exception $e) 
        { 
            new TMessage('error', $e->getMessage()); 
        } 
    } 
} 