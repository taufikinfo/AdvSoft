<?php

use Ratchet\ConnectionInterface;
use Ratchet\MessageComponentInterface;

class Chat implements MessageComponentInterface
{
    protected $clients;

    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
        echo 'Server Started';
    }

    public function onOpen(ConnectionInterface $conn)
    {

        // Store the new connection to send messages to later
        echo 'Server Started';

        $this->clients->attach($conn);
        $querystring = $conn->httpRequest->getUri()->getQuery();
        parse_str($querystring, $queryarray);

        if (isset($queryarray['token'])) {

            $user_object = new ChatUserService();
            $user_object->setUserToken($queryarray['token']);
            $user_object->setUserConnectionId($conn->resourceId);
            $user_object->update_user_connection_id();
            $user_data = $user_object->get_user_id_from_token();


            $user_id = $user_data['user_id'];
            $data['status_type'] = 'Online';
            $data['user_id_status'] = $user_id;
            // first, you are sending to all existing users message of 'new'
            foreach ($this->clients as $client) {
                $client->send(json_encode($data)); //here we are sending a status-message
            }
        }

        echo "New connection! ({$conn->resourceId})\n";
    }

    private function isValidFileType($fileName)
    {
        $allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'text/plain'];

        // Construct the absolute file path based on your file storage location
        $filePath = 'files/chat-documents/' . $fileName; // Update with your file path

        // Check if the file exists before checking its MIME type
        if (file_exists($filePath)) {
            $fileType = mime_content_type($filePath); // Get the file's MIME type
            return in_array($fileType, $allowedTypes);
        } else {
            // File does not exist, return false or handle accordingly
            return false;
        }
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {

        $numRecv = count($this->clients) - 1;
        $data = json_decode($msg, true);

        if (($data['type'] ?? "type") === 'attachment') {
            echo sprintf('Connection %d sending attachments message  to %d other connection%s' . "\n", $from->resourceId, $numRecv, $numRecv == 1 ? '' : 's');

            $fileName = $data['name'];
            $fileContent = $data['content'];
            $filePath = 'files/chat-documents/' . $fileName; // Set your desired file path
            // $base64_image = preg_replace('/^data:image\/(png|jpg|jpeg|gif);base64,/', '', $fileContent);

            $base64Data = $fileContent;
            // Check if it's an image or other type of file
            if (preg_match('/^data:image\/(\w+);base64,/', $fileContent, $type)) {
                $extension = strtolower($type[1]); // Get the file extension
                $base64Data = preg_replace('/^data:image\/\w+;base64,/', '', $fileContent);
            } elseif (preg_match('/^data:application\/(\w+);base64,/', $fileContent, $type)) {
                $extension = strtolower($type[1]); // Get the file extension
                $base64Data = preg_replace('/^data:application\/\w+;base64,/', '', $fileContent);
            } else {
                $from->send(json_encode(['error' => 'Unsupported data URI format']));
            }

            $binaryData = base64_decode($base64Data);
            if ($binaryData === false) {
                $from->send(json_encode(['error' => 'Base64 decoding failed']));
            }

            file_put_contents($filePath, $binaryData); // Create an empty file for demonstration
            $mimeType = finfo_file(finfo_open(FILEINFO_MIME_TYPE), $filePath);

            if ($this->isValidFileType($fileName)) {
                // File type is valid, process the attachment
                $data['content'] = $fileName; // Update content to file name
                $from->send(json_encode(['success' => 'Attachment processed successfully']));
                echo sprintf('Attachment processed successfully');

            } else {
                // Invalid file type, send error message back to client
                $from->send(json_encode(['error' => 'Invalid file type X']));
            }

        } else {
            echo sprintf('Connection %d sending message "%s" to %d other connection%s' . "\n", $from->resourceId, $msg, $numRecv, $numRecv == 1 ? '' : 's');

        }


        if ($data['command'] == 'private') {
            //private chat

            $private_chat_object = new ChatPrivateService();

            $private_chat_object->setTicketId($data['ticket_id']);
            $private_chat_object->setToUserId($data['receiver_userid']);
            $private_chat_object->setFromUserId($data['userId']);
            $private_chat_object->setChatMessage($data['chat_message']);
            $private_chat_object->setChatAttachment($data['content'] ?? null);
            $private_chat_object->setChatType($data['fileType'] ?? null);
            $timestamp = date('Y-m-d h:i:s');
            $private_chat_object->setTimestamp($timestamp);
            $private_chat_object->setStatus('Yes');
            $chat_message_id = $private_chat_object->save_chat();

            $user_object = new ChatUserService();
            $user_object->setUserId($data['userId']);
            $sender_user_data = $user_object->get_user_data_by_id();
            $user_object->setUserId($data['receiver_userid']);
            $receiver_user_data = $user_object->get_user_data_by_id();
            $sender_user_name = $sender_user_data['user_name'];
            $data['timestamp'] = $timestamp;
            $receiver_user_connection_id = $receiver_user_data['user_connection_id'];

            foreach ($this->clients as $client) {
                if ($from == $client) {
                    $data['from'] = 'Me';
                    $data['from_user_name'] = 'Me';
                } else {
                    $data['from'] = $sender_user_name;
                    $data['from_user_name'] = $sender_user_name;
                }

                if ($client->resourceId == $receiver_user_connection_id || $from == $client) {
                    $client->send(json_encode($data));
                } else {
                    $private_chat_object->setStatus('No');
                    $private_chat_object->setChatMessageId($chat_message_id);
                    $private_chat_object->update_chat_status();
                }
            }


        } else {
            //group chat

            $chat_object = new ChatRooms();
            $chat_object->setUserId($data['userId']);
            $chat_object->setMessage($data['chat_message']);
            $chat_object->setCreatedOn(date("Y-m-d h:i:s"));
            $chat_object->save_chat();

            $user_object = new ChatUserService();
            $user_object->setUserId($data['userId']);
            $user_data = $user_object->get_user_data_by_id();
            $user_name = $user_data['user_name'];
            $data['timestamp'] =  date('Y-m-d h:i:s');

            foreach ($this->clients as $client) {
                /*if ($from !== $client) {
                    // The sender is not the receiver, send to each client connected
                    $client->send($msg);
                }*/

                if ($from == $client) {
                    $data['from'] = 'Me';
                } else {
                    $data['from'] = $user_name;
                }

                $client->send(json_encode($data));
            }


        }
    }

    public function onClose(ConnectionInterface $conn)
    {

        $querystring = $conn->httpRequest->getUri()->getQuery();
        parse_str($querystring, $queryarray);
        if (isset($queryarray['token'])) {

            $user_object = new ChatUserService();
            $user_object->setUserToken($queryarray['token']);
            $user_data = $user_object->get_user_id_from_token();
            $user_id = $user_data['user_id'];
            $data['status_type'] = 'Offline';
            $data['user_id_status'] = $user_id;
            foreach ($this->clients as $client) {
                $client->send(json_encode($data));
            }
        }
        // The connection is closed, remove it, as we can no longer send it messages
        $this->clients->detach($conn);

        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }
}