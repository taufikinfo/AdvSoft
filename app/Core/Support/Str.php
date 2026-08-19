<?php

namespace App\Core\Support;

class Str
{
    public static function camel(string $value): string
    {
        return lcfirst(static::studly($value));
    }

    public static function studly(string $value): string
    {
        $words = explode(' ', str_replace(['-', '_'], ' ', $value));
        $studlyWords = array_map(fn($word) => ucfirst($word), $words);
        return implode('', $studlyWords);
    }

    public static function snake(string $value, string $delimiter = '_'): string
    {
        $key = $value;
        if (!ctype_lower($key)) {
            $value = preg_replace('/\s+/u', '', ucwords($value));
            $value = strtolower(preg_replace('/(.)(?=[A-Z])/u', '$1' . $delimiter, $value));
        }
        return $value;
    }

    public static function random(int $length = 16): string
    {
        return bin2hex(random_bytes((int)ceil($length / 2)));
    }
}
