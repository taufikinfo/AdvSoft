<?php

namespace App\Advsoft\Core\Support;

/**
 * Pure Adianti Lightweight Logger.
 */
class Log
{
    protected static ?string $logFile = null;

    public static function getLogFile(): string
    {
        if (!self::$logFile) {
            $dir = __DIR__ . '/../../../storage/logs';
            if (!is_dir($dir)) {
                @mkdir($dir, 0777, true);
            }
            self::$logFile = $dir . '/adianti.log';
        }
        return self::$logFile;
    }

    public static function info(string $message, array $context = []): void
    {
        self::write('INFO', $message, $context);
    }

    public static function warning(string $message, array $context = []): void
    {
        self::write('WARNING', $message, $context);
    }

    public static function error(string $message, array $context = []): void
    {
        self::write('ERROR', $message, $context);
    }

    public static function debug(string $message, array $context = []): void
    {
        self::write('DEBUG', $message, $context);
    }

    protected static function write(string $level, string $message, array $context = []): void
    {
        $timestamp = date('Y-m-d H:i:s');
        $ctx = !empty($context) ? ' ' . json_encode($context) : '';
        $line = "[$timestamp] $level: $message$ctx\n";
        @file_put_contents(self::getLogFile(), $line, FILE_APPEND | LOCK_EX);
        error_log("[$level] $message$ctx");
    }
}
