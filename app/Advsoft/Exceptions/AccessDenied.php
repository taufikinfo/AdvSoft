<?php

namespace App\Advsoft\Exceptions;

/**
 * AccessDenied
 *
 * @version    2.0.0
 * @package    Advsoft
 * @author     Taufik
 * @author     AdvSoft Team
 * @copyright  Copyright (c) 2026 AdvSoft Technologies
 * @license    https://opensource.org/licenses/MIT MIT License
 */
class AccessDenied extends \RuntimeException
{
    public function __construct(string $message = '', int $code = 403, ?\Throwable $previous = null)
    {
        parent::__construct($message ?: 'Access Denied', $code, $previous);
    }
}
