<?php

namespace App\Advsoft\Field\Html;

use DOMDocument;
use DOMElement;
use DOMXPath;

/**
 * MentionParser – AdvSoft-style @mention parser/extractor.
 *
 *  Mention link shape (in HTML):
 *      <a href="#" data-mention-id="42" data-mention-model="res.partner"
 *         class="o_mention">@John Doe</a>
 *
 *  This service:
 *   - Extract mentions from a sanitized HTML string
 *   - Resolve (replace) plain "@Name" with rich <a> mentions
 *   - Provide a JSON-friendly list of mentioned records (for chatter)
 */
class MentionParser
{
    /** Regex matching `@Display Name` sequences in plain text. */
    public const PLAIN_MENTION_REGEX = '/(?<![\w@])@([\p{L}\p{N}\._\-\ ]{1,60})/u';

    /**
     * Extract all mention entries from an HTML document.
     * @return array<int,array{model:string,id:int,name:string,raw:string}>
     */
    public function extract(string $html): array
    {
        if ($html === '') return [];
        $doc = $this->loadDoc($html);
        if (!$doc) return [];

        $xpath = new DOMXPath($doc);
        $mentions = [];

        $links = $xpath->query('//a[@data-mention-id and @data-mention-model]');
        if ($links === false) return [];

        foreach ($links as $a) {
            /** @var DOMElement $a */
            $id     = (int)   $a->getAttribute('data-mention-id');
            $model  = (string)$a->getAttribute('data-mention-model');
            $name   = trim($a->textContent);
            $raw    = $doc->saveHTML($a) ?: '';
            if (!$id || !$model) continue;
            $mentions[] = [
                'model' => $model,
                'id'    => $id,
                'name'  => ltrim($name, '@'),
                'raw'   => $raw,
            ];
        }
        return $mentions;
    }

    /**
     * Build mention links from text matches.
     *
     * @param  string $text     The input (HTML) to scan.
     * @param  array<int,array{model:string,id:int,name:string}>  $registry
     *                         List of known mentions (used to map "@Name" → record).
     * @return string           HTML with mentions converted to <a class="o_mention">.
     */
    public function inject(string $text, array $registry): string
    {
        if (empty($registry)) return $text;

        $names = [];
        foreach ($registry as $r) {
            $key = mb_strtolower($r['name']);
            $names[$key] = $r;
        }
        if (empty($names)) return $text;

        $callback = function ($m) use ($names) {
            $key = mb_strtolower($m[1]);
            if (!isset($names[$key])) return $m[0];
            $r = $names[$key];
            return sprintf(
                '<a href="#" class="o_mention" data-mention-id="%d" data-mention-model="%s" contenteditable="false">@%s</a>',
                (int) $r['id'],
                htmlspecialchars($r['model'], ENT_QUOTES),
                htmlspecialchars($r['name'], ENT_QUOTES)
            );
        };

        return preg_replace_callback(self::PLAIN_MENTION_REGEX, $callback, $text);
    }

    /**
     * Convert mentions in a plain text into structured mentions.
     * Used when the editor is in plain-text mode.
     * @return array<int,array{name:string,offset:int}>
     */
    public function findInText(string $text): array
    {
        $out = [];
        if (preg_match_all(self::PLAIN_MENTION_REGEX, $text, $m, PREG_OFFSET_CAPTURE)) {
            foreach ($m[1] as $i => $hit) {
                $out[] = [
                    'name'   => $hit[0],
                    'offset' => $m[0][$i][1],
                ];
            }
        }
        return $out;
    }

    /**
     * Wrap DOMDocument with HTML_NOIMPLIED so we don't get stray <html><body>.
     */
    protected function loadDoc(string $html)
    {
        $internal = libxml_use_internal_errors(true);
        $doc = new DOMDocument('1.0', 'UTF-8');
        $ok = $doc->loadHTML(
            '<?xml encoding="utf-8" ?>' . $html,
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_NONET
        );
        libxml_clear_errors();
        libxml_use_internal_errors($internal);
        return $ok ? $doc : null;
    }
}
