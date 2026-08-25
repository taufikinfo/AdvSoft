<?php

namespace App\Advsoft\Core\Http;

/**
 * JsonResponse
 *
 * @version    2.0.0
 * @package    Advsoft
 * @author     Taufik
 * @author     AdvSoft Team
 * @copyright  Copyright (c) 2026 AdvSoft Technologies
 * @license    https://opensource.org/licenses/MIT MIT License
 */
class JsonResponse extends Response
{
    protected mixed $data;

    public function __construct(mixed $data = null, int $status = 200, array $headers = [])
    {
        $this->data = $data;
        $headers['Content-Type'] = 'application/json; charset=utf-8';
        $content = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        parent::__construct($content ?: '{}', $status, $headers);
    }

    public function getData(): mixed
    {
        return $this->data;
    }

    public function setData(mixed $data): self
    {
        $this->data = $data;
        $this->content = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}';
        return $this;
    }
}
