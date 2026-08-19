<?php


class ChatUserService extends AdiantiRecordService
{
    public $connect;
    private $user_id;
    private $user_name;
    private $user_email;
    private $user_password;
    private $user_profile;
    private $user_status;
    private $user_created_on;
    private $user_verification_code;
    private $user_login_status;
    private $user_token;
    private $user_connection_id;

    public function __construct()
    {
        TTransaction::open('app');
        $this->connect = TTransaction::get();
    }

    function getUserId()
    {
        return $this->user_id;
    }

    function setUserId($user_id)
    {
        $this->user_id = $user_id;
    }

    function getUserName()
    {
        return $this->user_name;
    }

    function setUserName($user_name)
    {
        $this->user_name = $user_name;
    }

    function getUserEmail()
    {
        return $this->user_email;
    }

    function setUserEmail($user_email)
    {
        $this->user_email = $user_email;
    }

    function getUserPassword()
    {
        return $this->user_password;
    }

    function setUserPassword($user_password)
    {
        $this->user_password = $user_password;
    }

    function getUserProfile()
    {
        return $this->user_profile;
    }

    function setUserProfile($user_profile)
    {
        $this->user_profile = $user_profile;
    }

    function getUserStatus()
    {
        return $this->user_status;
    }

    function setUserStatus($user_status)
    {
        $this->user_status = $user_status;
    }

    function getUserCreatedOn()
    {
        return $this->user_created_on;
    }

    function setUserCreatedOn($user_created_on)
    {
        $this->user_created_on = $user_created_on;
    }

    function getUserVerificationCode()
    {
        return $this->user_verification_code;
    }

    function setUserVerificationCode($user_verification_code)
    {
        $this->user_verification_code = $user_verification_code;
    }

    function getUserLoginStatus()
    {
        return $this->user_login_status;
    }

    function setUserLoginStatus($user_login_status)
    {
        $this->user_login_status = $user_login_status;
    }

    function getUserToken()
    {
        return $this->user_token;
    }

    function setUserToken($user_token)
    {
        $this->user_token = $user_token;
    }

    function getUserConnectionId()
    {
        return $this->user_connection_id;
    }

    function setUserConnectionId($user_connection_id)
    {
        $this->user_connection_id = $user_connection_id;
    }

    function make_avatar($character)
    {
        $path = "images/" . time() . ".png";
        $image = imagecreate(200, 200);
        $red = rand(0, 255);
        $green = rand(0, 255);
        $blue = rand(0, 255);
        imagecolorallocate($image, $red, $green, $blue);
        $textcolor = imagecolorallocate($image, 255, 255, 255);

        $font = dirname(__FILE__) . '/font/arial.ttf';

        imagettftext($image, 100, 0, 55, 150, $textcolor, $font, $character);
        imagepng($image, $path);
        imagedestroy($image);
        return $path;
    }

    function get_user_data_by_email()
    {
        $query = "
		SELECT * FROM chat_user_table 
		WHERE user_email = ?
		";

        $statement = $this->connect->prepare($query);
        if ($statement->execute([$this->user_email])) {
            $user_data = $statement->fetch(PDO::FETCH_ASSOC);
        }
        return $user_data;
    }

    function save_data()
    {
        $query = "
		INSERT INTO chat_user_table (user_name, user_email, user_password, user_profile, user_status, user_created_on, user_verification_code) 
		VALUES (?, ?, ?, ?, ?,?, ?) ";
        $statement = $this->connect->prepare($query);
        if ($statement->execute([$this->user_name, $this->user_email, $this->user_password,
            $this->user_profile, $this->user_status, $this->user_created_on, $this->user_verification_code])) {
            return true;
        } else {
            return false;
        }
    }

    function is_valid_email_verification_code()
    {
        $query = "
		SELECT * FROM chat_user_table 
		WHERE user_verification_code = ?
		";

        $statement = $this->connect->prepare($query);
        $statement->execute([$this->user_verification_code]);

        if ($statement->rowCount() > 0) {
            return true;
        } else {
            return false;
        }
    }

    function enable_user_account()
    {
        $query = "
		UPDATE chat_user_table 
		SET user_status = ?
		WHERE user_verification_code = ?
		";

        $statement = $this->connect->prepare($query);
        if ($statement->execute([$this->user_status, $this->user_verification_code])) {
            return true;
        } else {
            return false;
        }
    }

    function update_user_login_data()
    {
        $query = "
		UPDATE chat_user_table 
		SET user_login_status = ?, user_token = ?  
		WHERE user_id = ?
		";

        $statement = $this->connect->prepare($query);
        if ($statement->execute([$this->user_login_status, $this->user_token, $this->user_id])) {
            return true;
        } else {
            return false;
        }
    }

    function get_user_data_by_id()
    {
        $query = '
		SELECT * FROM chat_user_table 
		WHERE user_id = ? ';

        $statement = $this->connect->prepare($query);
        try {
            if ($statement->execute([$this->user_id])) {
                $user_data = $statement->fetch(PDO::FETCH_ASSOC);
            } else {
                $user_data = array();
            }

        } catch (Exception $error) {
            echo $error->getMessage();
        }
        return $user_data;
    }

    function upload_image($user_profile)
    {
        $extension = explode('.', $user_profile['name']);
        $new_name = rand() . '.' . $extension[1];
        $destination = 'images/' . $new_name;
        move_uploaded_file($user_profile['tmp_name'], $destination);
        return $destination;
    }

    function update_data()
    {
        $query = "
		UPDATE chat_user_table 
		SET user_name = ?, 
		user_email = ?, 
		user_password = ?, 
		user_profile = ?  
		WHERE user_id = ?
		";

        $statement = $this->connect->prepare($query);
        if ($statement->execute([$this->user_name, $this->user_email, $this->user_password, $this->user_profile, $this->user_id])) {
            return true;
        } else {
            return false;
        }
    }

    function get_user_all_data()
    {
        $query = "
		SELECT * FROM chat_user_table 
		";

        $statement = $this->connect->prepare($query);
        $statement->execute();
        $data = $statement->fetchAll(PDO::FETCH_ASSOC);

        return $data;
    }

    function get_user_all_data_with_status_count()
    {
        $query = "
		SELECT user_id, user_name, user_profile, user_login_status, (SELECT COUNT(*) FROM chat_message WHERE to_user_id = ? AND from_user_id = chat_user_table.user_id AND status = 'No') AS count_status FROM chat_user_table
		";

        $statement = $this->connect->prepare($query);
        $statement->execute([$this->user_id]);

        $data = $statement->fetchAll(PDO::FETCH_ASSOC);

        return $data;
    }

    function update_user_connection_id()
    {
        $query = "
		UPDATE chat_user_table 
		SET user_connection_id = ? 
		WHERE user_token = ?
		";
        $statement = $this->connect->prepare($query);
        $statement->execute([$this->user_connection_id, $this->user_token]);
    }

    function get_user_id_from_token()
    {
        $query = "
		SELECT user_id FROM chat_user_table 
		WHERE user_token = ?
		";

        $statement = $this->connect->prepare($query);
        $statement->execute([$this->user_token]);
        $user_id = $statement->fetch(PDO::FETCH_ASSOC);
        return $user_id;
    }

    function __destruct()
    {
        TTransaction::close();
    }
}


?>

