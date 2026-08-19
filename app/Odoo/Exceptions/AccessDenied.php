<?php

namespace App\Odoo\Exceptions;

class AccessDenied extends \RuntimeException
{
    public function __construct(string $message = '', int $code = 403, ?\Throwable $previous = null)
    {
        parent::__construct($message ?: 'Access Denied', $code, $previous);
    }
}
