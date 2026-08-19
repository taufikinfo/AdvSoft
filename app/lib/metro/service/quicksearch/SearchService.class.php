<?php

class SearchService extends AdiantiRecordService
{
    const DATABASE = 'app';
    const ACTIVE_RECORD = 'Perangkat';

    function get_user_all_data($searchTerm)
    {

        // Open a transaction with the database
        TTransaction::open('your_database'); // replace 'your_database' with your database configuration name

        // Get the database connection
        $conn = TTransaction::get();

        $query = "SELECT * FROM your_table WHERE your_column LIKE :searchTerm"; // replace 'your_table' and 'your_column' with actual names
        $statement = $conn->prepare($query);
        $statement->execute(['searchTerm' => '%' . $searchTerm . '%']);

        TTransaction::close();


        $data = $statement->fetchAll(PDO::FETCH_ASSOC);

        return $data;

//        if (empty($results)) {
//            echo json_encode(['status' => 'empty', 'results' => []]);
//        } else {
//            echo json_encode(['status' => 'success', 'results' => $results]);
//        }
    }
}