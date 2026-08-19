<?php

class ChatPrivateService extends AdiantiRecordService
{
    const DATABASE = 'app';
    const ACTIVE_RECORD = 'ChatUser';
    private $chat_message_id;
    private $to_user_id;
    private $from_user_id;
    private $chat_message;
    private $chat_attachment;
    private $ticket_id;
    private $chat_type;
    private $timestamp;
    private $status;
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

    function setChatMessageId($chat_message_id)
    {
        $this->chat_message_id = $chat_message_id;
    }

    function getChatMessageId()
    {
        return $this->chat_message_id;
    }

    function setToUserId($to_user_id)
    {
        $this->to_user_id = $to_user_id;
    }

    function getToUserId()
    {
        return $this->to_user_id;
    }

    function setFromUserId($from_user_id)
    {
        $this->from_user_id = $from_user_id;
    }

    function getFromUserId()
    {
        return $this->from_user_id;
    }

    function setChatMessage($chat_message)
    {
        $this->chat_message = $chat_message;
    }

    function setChatAttachment($chat_attachment)
    {
        $this->chat_attachment = $chat_attachment;
    }

    public function setTicketId($ticket_id)
    {
        $this->ticket_id = $ticket_id;
    }
    function setChatType($chat_type)
    {
        $this->chat_type = $chat_type;
    }

    function getChatMessage()
    {
        return $this->chat_message;
    }

    function getChatAttachment()
    {
        return $this->chat_attachment;
    }

    function getTicketId()
    {
        return $this->ticket_id;
    }

    function getChatType()
    {
        return $this->chat_type;
    }

    function setTimestamp($timestamp)
    {
        $this->timestamp = $timestamp;
    }

    function getTimestamp()
    {
        return $this->timestamp;
    }

    function setStatus($status)
    {
        $this->status = $status;
    }

    function getStatus()
    {
        return $this->status;
    }

    function get_all_chat_data()
    {
        $query = "
		SELECT a.user_name as from_user_name, b.user_name as to_user_name,ticket_id, chat_message,chat_attachment,chat_type, timestamp, status, to_user_id, from_user_id  
			FROM chat_message 
		INNER JOIN chat_user_table a 
			ON chat_message.from_user_id = a.user_id 
		INNER JOIN chat_user_table b 
			ON chat_message.to_user_id = b.user_id 
		WHERE 
		(
		(chat_message.from_user_id = ? AND chat_message.to_user_id = ? ) 
		OR 
		(chat_message.from_user_id = ? AND chat_message.to_user_id = ?)
		)
		AND 
		    chat_message.ticket_id = ?
		";



        $statement = $this->connect->prepare($query);
        $statement->execute([ $this->from_user_id,
                              $this->to_user_id,
                              $this->to_user_id,
                              $this->from_user_id ,
                              $this->ticket_id ]);

        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }

    function save_chat()
    {
        $query = "
		INSERT INTO chat_message 
			(to_user_id, from_user_id, chat_message, chat_attachment,chat_type, timestamp, status,ticket_id) 
			VALUES (?, ?, ?, ?, ?, ? ,? ,?)
		";

        $statement = $this->connect->prepare($query);
        $statement->execute([$this->to_user_id, $this->from_user_id, $this->chat_message , $this->chat_attachment ,$this->chat_type, $this->timestamp, $this->status, $this->ticket_id]);
        return $this->connect->lastInsertId();
    }

    function update_chat_status()
    {
        $query = "
		UPDATE chat_message 
			SET status = ? 
			WHERE chat_message_id = ?
		";
        $statement = $this->connect->prepare($query);
        $statement->execute([$this->status, $this->chat_message_id]);
    }

    function change_chat_status()
    {
        $query = "
		UPDATE chat_message 
			SET status = 'Yes' 
			WHERE from_user_id = ?
			AND to_user_id = ? 
			AND status = 'No'
		";

        $statement = $this->connect->prepare($query);
        $statement->execute([$this->to_user_id, $this->from_user_id]);
    }

    public function onFetchData($param){
        $private_chat_object = new ChatPrivateService();
        $private_chat_object->setTicketId($param["ticket_id"]);
        $private_chat_object->setFromUserId($param["to_user_id"]);
        $private_chat_object->setToUserId($param["from_user_id"]);
        $private_chat_object->change_chat_status();
        return $private_chat_object->get_all_chat_data();
    }



}


