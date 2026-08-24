<?php

namespace App\Advsoft\Field\Html;

/**
 * EmbedExtractor – AdvSoft-style URL metadata / oEmbed extraction.
 *
 *  Used by the RTE to render link previews (cards) for:
 *   - YouTube / Vimeo  → rich player embed
 *   - Twitter / X     → tweet card
 *   - Generic URLs    → OpenGraph preview (og:title / og:image / og:description)
 *
 *  This service never executes remote JavaScript and only fetches metadata,
 *  making it safe to call server-side.
 */
class EmbedExtractor
{
    /** @var array<string,string> */
    protected array $providers = [
        'youtube.com'  => 'youtube',
        'youtu.be'     => 'youtube',
        'vimeo.com'    => 'vimeo',
        'twitter.com'  => 'twitter',
        'x.com'        => 'twitter',
    ];

    /** Network timeout in seconds. */
    protected int $timeout = 4;

    /** User agent string. */
    protected string $userAgent = 'AdvSoftEmbedBot/1.0 (+https://AdvSoft.local)';

    /**
     * Extract embed metadata for a URL.
     * Returns a normalized array. The RTE renders the result as a card.
     *
     * @return array{type:string,url:string,provider:string,title:string,description:string,image:string,html:string,raw:array}
     */
    public function extract(string $url): array
    {
        $url = trim($url);
        if ($url === '') {
            return $this->emptyEmbed($url);
        }

        $provider = $this->detectProvider($url);
        $meta = $this->fetchOpenGraph($url);

        // Special-case: YouTube → build the embed URL
        if ($provider === 'youtube' && !empty($meta['video_id'])) {
            $meta['html'] = sprintf(
                '<iframe class="ls-embed-iframe" src="https://www.youtube.com/embed/%s" '
                . 'frameborder="0" allowfullscreen></iframe>',
                htmlspecialchars($meta['video_id'], ENT_QUOTES)
            );
            $meta['type'] = 'video';
        } elseif ($provider === 'vimeo' && !empty($meta['video_id'])) {
            $meta['html'] = sprintf(
                '<iframe class="ls-embed-iframe" src="https://player.vimeo.com/video/%s" '
                . 'frameborder="0" allowfullscreen></iframe>',
                htmlspecialchars($meta['video_id'], ENT_QUOTES)
            );
            $meta['type'] = 'video';
        } else {
            $meta['html'] = '';
            $meta['type'] = 'link';
        }

        $meta['provider'] = $provider;
        $meta['url']      = $url;

        return $meta;
    }

    /**
     * Check whether a URL is an embeddable provider.
     */
    public function isEmbeddable(string $url): bool
    {
        return $this->detectProvider($url) !== 'generic';
    }

    /**
     * Convert a YouTube / Vimeo URL to its embed form.
     */
    public function toEmbedUrl(string $url): ?string
    {
        $p = $this->detectProvider($url);
        if ($p === 'youtube') {
            if (preg_match('#(?:youtube\.com/watch\?v=|youtu\.be/)([\w-]{6,})#', $url, $m)) {
                return 'https://www.youtube.com/embed/' . $m[1];
            }
        }
        if ($p === 'vimeo') {
            if (preg_match('#vimeo\.com/(\d+)#', $url, $m)) {
                return 'https://player.vimeo.com/video/' . $m[1];
            }
        }
        return null;
    }

    // ──────────────────────────────────────────────────────
    //  Internals
    // ──────────────────────────────────────────────────────

    /**
     * @return string provider key
     */
    protected function detectProvider(string $url): string
    {
        $host = strtolower(parse_url($url, PHP_URL_HOST) ?? '');
        foreach ($this->providers as $needle => $provider) {
            if (str_contains($host, $needle)) return $provider;
        }
        return 'generic';
    }

    /**
     * Fetch OpenGraph / Twitter card metadata from a URL.
     * Uses cURL with a strict timeout and a safe user-agent.
     */
    protected function fetchOpenGraph(string $url): array
    {
        $meta = [
            'title'       => '',
            'description' => '',
            'image'       => '',
            'site_name'   => '',
            'video_id'    => '',
        ];

        if (!function_exists('curl_init')) {
            return $meta; // Fall back to empty if cURL is not available.
        }

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS      => 3,
            CURLOPT_TIMEOUT        => $this->timeout,
            CURLOPT_CONNECTTIMEOUT => $this->timeout,
            CURLOPT_USERAGENT      => $this->userAgent,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($body === false || $code >= 400) {
            return $meta;
        }

        // Detect video id for known providers
        if (preg_match('#(?:youtube\.com/watch\?v=|youtu\.be/)([\w-]{6,})#', $url, $m)) {
            $meta['video_id'] = $m[1];
        } elseif (preg_match('#vimeo\.com/(\d+)#', $url, $m)) {
            $meta['video_id'] = $m[1];
        }

        // Pull OG/Twitter tags via regex (no DOM parsing here for speed).
        $patterns = [
            'title'       => '/<meta[^>]+(?:property|name)=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']/i',
            'title_alt'   => '/<meta[^>]+(?:property|name)=["\']twitter:title["\'][^>]+content=["\']([^"\']+)["\']/i',
            'description' => '/<meta[^>]+(?:property|name)=["\']og:description["\'][^>]+content=["\']([^"\']+)["\']/i',
            'image'       => '/<meta[^>]+(?:property|name)=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/i',
            'site_name'   => '/<meta[^>]+(?:property|name)=["\']og:site_name["\'][^>]+content=["\']([^"\']+)["\']/i',
        ];

        foreach ($patterns as $key => $re) {
            if (preg_match($re, (string) $body, $m)) {
                $meta[$key === 'title_alt' ? 'title' : $key] = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
            }
        }

        // Fallback: <title> if no og:title
        if (empty($meta['title']) && preg_match('/<title>([^<]+)<\/title>/i', (string) $body, $m)) {
            $meta['title'] = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }

        return $meta;
    }

    /**
     * @return array{type:string,url:string,provider:string,title:string,description:string,image:string,html:string,raw:array}
     */
    protected function emptyEmbed(string $url): array
    {
        return [
            'type'        => 'link',
            'url'         => $url,
            'provider'    => 'generic',
            'title'       => $url,
            'description' => '',
            'image'       => '',
            'html'        => '',
            'raw'         => [],
        ];
    }
}
