<?php

use Adianti\Database\TTransaction;

class ChatRooms
{
    private $chat_id;
    private $user_id;
    private $message;
    private $created_on;
    protected $connect;

    public function __construct()
    {

        TTransaction::open('app');
        $this->connect = TTransaction::get();
    }

    public function __destruct()
    {

        TTransaction::close();
    }

    public function setChatId($chat_id)
    {
        $this->chat_id = $chat_id;
    }

    function getChatId()
    {
        return $this->chat_id;
    }

    function setUserId($user_id)
    {
        $this->user_id = $user_id;
    }

    function getUserId()
    {
        return $this->user_id;
    }

    function setMessage($message)
    {
        $this->message = $message;
    }

    function getMessage()
    {
        return $this->message;
    }

    function setCreatedOn($created_on)
    {
        $this->created_on = $created_on;
    }

    function getCreatedOn()
    {
        return $this->created_on;
    }


    function save_chat()
    {
        $query = "
		INSERT INTO chatrooms 
			(userid, msg, created_on) 
			VALUES (?, ?, ?)
		";

        $statement = $this->connect->prepare($query);
        $statement->execute([$this->user_id, $this->message, $this->created_on]);
    }

    function get_all_chat_data()
    {
        $query = "
		SELECT * FROM chatrooms 
			INNER JOIN chat_user_table 
			ON chat_user_table.user_id = chatrooms.userid 
			ORDER BY chatrooms.id ASC
		";

        $statement = $this->connect->prepare($query);
        $statement->execute();
        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }
}

?>