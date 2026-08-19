<?php

namespace App\Core\Http;

use App\Core\Support\Collection;

/**
 * Lightweight HTTP Request implementation for Adianti Backend.
 */
class Request
{
    protected array $get;
    protected array $post;
    protected array $json;
    protected array $cookies;
    protected array $server;
    protected array $headers;
    protected string $rawBody;
    protected static ?Request $instance = null;

    public function __construct(array $get = [], array $post = [], array $cookies = [], array $server = [], string $rawBody = '')
    {
        $this->get = $get;
        $this->post = $post;
        $this->cookies = $cookies;
        $this->server = $server;
        $this->rawBody = $rawBody;

        $json = json_decode($rawBody, true);
        $this->json = is_array($json) ? $json : [];
        $this->headers = $this->parseHeaders($server);
    }

    public static function capture(): self
    {
        $raw = file_get_contents('php://input') ?: '';
        self::$instance = new self($_GET, $_POST, $_COOKIE, $_SERVER, $raw);
        return self::$instance;
    }

    public static function create(string $uri, string $method = 'GET', array $parameters = [], array $cookies = [], array $files = [], array $server = [], ?string $content = null): self
    {
        $server['REQUEST_METHOD'] = strtoupper($method);
        $server['REQUEST_URI'] = $uri;
        $get = strtoupper($method) === 'GET' ? $parameters : [];
        $post = strtoupper($method) === 'POST' ? $parameters : [];
        $raw = $content ?? (strtoupper($method) === 'POST' && !empty($parameters) ? json_encode($parameters) : '');

        return new self($get, $post, $cookies, $server, $raw);
    }

    public static function getInstance(): self
    {
        if (!self::$instance) {
            self::$instance = self::capture();
        }
        return self::$instance;
    }

    protected function parseHeaders(array $server): array
    {
        $headers = [];
        foreach ($server as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = strtolower(str_replace('_', '-', substr($key, 5)));
                $headers[$name] = $value;
            } elseif (in_array($key, ['CONTENT_TYPE', 'CONTENT_LENGTH'])) {
                $name = strtolower(str_replace('_', '-', $key));
                $headers[$name] = $value;
            }
        }
        return $headers;
    }

    public function method(): string
    {
        return strtoupper($this->server['REQUEST_METHOD'] ?? 'GET');
    }

    public function getMethod(): string
    {
        return $this->method();
    }

    public function isMethod(string $method): bool
    {
        return $this->method() === strtoupper($method);
    }

    public function path(): string
    {
        $uri = $this->server['REQUEST_URI'] ?? '/';
        $pos = strpos($uri, '?');
        return $pos === false ? $uri : substr($uri, 0, $pos);
    }

    public function getPathInfo(): string
    {
        return $this->path();
    }

    public function header(string $name, ?string $default = null): ?string
    {
        $key = strtolower(str_replace('_', '-', $name));
        return $this->headers[$key] ?? $default;
    }

    public function input(?string $key = null, mixed $default = null): mixed
    {
        $all = $this->all();
        if ($key === null) return $all;
        return $all[$key] ?? $default;
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->get[$key] ?? $default;
    }

    public function post(string $key, mixed $default = null): mixed
    {
        return $this->post[$key] ?? $default;
    }

    public function json(?string $key = null, mixed $default = null): mixed
    {
        if ($key === null) return $this->json;
        return $this->json[$key] ?? $default;
    }

    public function cookie(string $name, ?string $default = null): ?string
    {
        return $this->cookies[$name] ?? $default;
    }

    public function has(string $key): bool
    {
        $all = $this->all();
        return array_key_exists($key, $all);
    }

    public function filled(string $key): bool
    {
        $val = $this->input($key);
        return !empty($val) || $val === '0' || $val === 0;
    }

    public function only(array|string $keys): array
    {
        $keys = is_array($keys) ? $keys : func_get_args();
        $all = $this->all();
        $result = [];
        foreach ($keys as $k) {
            if (array_key_exists($k, $all)) {
                $result[$k] = $all[$k];
            }
        }
        return $result;
    }

    public function except(array|string $keys): array
    {
        $keys = is_array($keys) ? $keys : func_get_args();
        $all = $this->all();
        foreach ($keys as $k) {
            unset($all[$k]);
        }
        return $all;
    }

    public function all(): array
    {
        return array_merge($this->get, $this->post, $this->json);
    }

    public function validate(array $rules): array
    {
        $data = $this->all();
        $errors = [];
        $validated = [];

        foreach ($rules as $field => $ruleList) {
            $ruleArray = is_string($ruleList) ? explode('|', $ruleList) : $ruleList;
            $value = $data[$field] ?? null;

            foreach ($ruleArray as $rule) {
                if ($rule === 'required' && ($value === null || $value === '')) {
                    $errors[$field][] = "The {$field} field is required.";
                }
                if ($rule === 'integer' && $value !== null && !is_numeric($value)) {
                    $errors[$field][] = "The {$field} must be an integer.";
                }
                if ($rule === 'array' && $value !== null && !is_array($value)) {
                    $errors[$field][] = "The {$field} must be an array.";
                }
            }

            if (empty($errors[$field]) && array_key_exists($field, $data)) {
                $validated[$field] = $value;
            }
        }

        if (!empty($errors)) {
            $firstMsg = reset($errors)[0] ?? 'Validation error';
            $jsonResp = new JsonResponse([
                'message' => $firstMsg,
                'errors'  => $errors,
            ], 422);
            $jsonResp->send();
            exit;
        }

        return $validated;
    }

    public function boolean(string $key, bool $default = false): bool
    {
        $val = $this->input($key, $default);
        return filter_var($val, FILTER_VALIDATE_BOOLEAN);
    }

    public function query(?string $key = null, mixed $default = null): mixed
    {
        if ($key === null) return $this->get;
        return $this->get[$key] ?? $default;
    }

    public function file(string $key): mixed
    {
        return $_FILES[$key] ?? null;
    }

    public function ajax(): bool
    {
        return strtolower($this->header('X-Requested-With', '')) === 'xmlhttprequest';
    }

    public function expectsJson(): bool
    {
        $accept = $this->header('accept', '');
        return str_contains($accept, 'json') || str_starts_with($this->path(), '/api/');
    }
}
