<?php

namespace App\Odoo\Exceptions;

class AccessError extends \RuntimeException
{
    public function __construct(string $message = '', int $code = 403, ?\Throwable $previous = null)
    {
        parent::__construct($message ?: 'Access Error', $code, $previous);
    }
}
