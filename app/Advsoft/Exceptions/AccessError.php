<?php

namespace App\Advsoft\Exceptions;

/**
 * AccessError
 *
 * @version    2.0.0
 * @package    Advsoft
 * @author     Taufik
 * @author     AdvSoft Team
 * @copyright  Copyright (c) 2026 AdvSoft Technologies
 * @license    https://opensource.org/licenses/MIT MIT License
 */
class AccessError extends \RuntimeException
{
    public function __construct(string $message = '', int $code = 403, ?\Throwable $previous = null)
    {
        parent::__construct($message ?: 'Access Error', $code, $previous);
    }
}
