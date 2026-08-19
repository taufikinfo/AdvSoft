<?php
/*
 *  Copyright (c) 2022.
 *  @version    7.4
 *  @package    Session.php
 *  @author     Taufik Rahman <taufik.info@gmail.com>
 *  @lastModified  10/03/23 22.59
 *
 */

class KSession
{
    const setting = "";
    public static $item;
    public $setting;

    public static function setPath($path)
    {
        $path = self::makeSafeFileName($path);
        $setting = new \Filebase\Database(['dir' => 'tmp']);
        self::$item = $setting->get("sess_" . $path);
    }

    public static function makeSafeFileName($string)
    {
        // Replace spaces with underscores
        $string = str_replace(' ', '_', $string);
        // Remove any characters that are not alphanumeric, underscore, or dot
        $string = preg_replace('/[^A-Za-z0-9_.-]/', '', $string);
        // Ensure the filename doesn't start with a dot or underscore
        $string = ltrim($string, '._');
        return $string;
    }

    public static function setValue($key, $data)
    {
        $session = session_id();
        if ($session !== '') {
            $setting = new \Filebase\Database(['dir' => 'tmp']);
            self::$item = $setting->get("sess_" . session_id());
            self::$item->{$key} = $data;
            self::$item->save();
        }
    }

    public static function getValue($key)
    {
        $session = session_id();
        if ($session !== '') {
            $setting = new \Filebase\Database(['dir' => 'tmp']);
            self::$item = $setting->get("sess_" . session_id());
            return (self::$item->{$key});
        }
    }

    public static function delValue($key)
    {
        $session = session_id();
        if ($session !== '') {
            $setting = new \Filebase\Database(['dir' => 'tmp']);
            self::$item = $setting->get("sess_" . session_id());
            self::$item->{$key} = null;
            self::$item->save();
        }
    }


    public static function setValueGlobal($path, $key, $data)
    {
        $session = session_id();
        if ($session !== '') {
            $setting = new \Filebase\Database(['dir' => 'tmp']);
            self::$item = $setting->get("global_" . $path);
            self::$item->{$key} = $data;
            self::$item->save();
        }

    }

    public static function getValueGlobal($path, $key)
    {
        $session = session_id();
        if ($session !== '') {
            $setting = new \Filebase\Database(['dir' => 'tmp']);
            self::$item = $setting->get("global_" . $path);
            return (self::$item->{$key});
        }
    }

    public static function delValueGlobal($path, $key)
    {
        $session = session_id();
        if ($session !== '') {
            $setting = new \Filebase\Database(['dir' => 'tmp']);
            self::$item = $setting->get("global_" . $path);
            self::$item->{$key} = null;
            self::$item->save();
        }
    }

    public static function clear()
    {
        $session = session_id();
        if ($session !== '') {
            $setting = new \Filebase\Database(['dir' => 'tmp']);
            self::$item = $setting->get("sess_" . session_id());
            return (self::$item->delete());
        }
    }

    public static function clearGlobal($path, $key)
    {
        $session = session_id();
        if ($session !== '') {
            $setting = new \Filebase\Database(['dir' => 'tmp']);
            self::$item = $setting->get("global_" . $path);
            return (self::$item->delete());
        }
    }
}