<?php

namespace App\Odoo\Field\Html;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMXPath;

/**
 * HtmlSanitizer – Odoo-style HTML sanitizer.
 *
 * Mirrors Odoo's `odoo.tools.html_sanitize()` pipeline:
 *   1.  Parse HTML with DOMDocument (libxml)
 *   2.  Walk the tree, dropping disallowed tags
 *   3.  For allowed tags, strip disallowed attributes
 *   4.  Whitelist CSS classes (supports `prefix-*` wildcards)
 *   5.  Whitelist inline styles
 *   6.  Whitelist URL schemes (http, https, mailto, tel, …)
 *   7.  Forbid event-handler attributes (onclick, onerror, …)
 *   8.  Forbid <script>, <style>, <iframe>, <object>, <embed> (or allow if listed)
 *   9.  Normalize <a> links — strip javascript: pseudo-URLs
 *  10.  Return sanitized HTML string
 *
 *  Usage:
 *      $san = new HtmlSanitizer($config);
 *      $clean = $san->sanitize($dirtyHtml);
 */
class HtmlSanitizer
{
    /** @var HtmlFieldConfig */
    protected HtmlFieldConfig $config;

    /**
     * Per-tag attribute allowlist (built dynamically from config).
     * @var array<string,string[]>
     */
    protected array $attrAllowlist = [
        'a'    => ['href', 'title', 'rel', 'target'],
        'img'  => ['src', 'alt', 'title', 'width', 'height'],
        'th'   => ['colspan', 'rowspan', 'scope'],
        'td'   => ['colspan', 'rowspan'],
        'col'  => ['span', 'style'],
        'colgroup' => ['span', 'style'],
        'ol'   => ['start', 'type', 'reversed'],
        'ul'   => ['type'],
        'li'   => ['value'],
        'hr'   => ['size', 'width'],
        'pre'  => ['spellcheck'],
        'code' => ['spellcheck'],
    ];

    /** Globally forbidden tags (always stripped even if user adds them). */
    protected array $forbiddenTags = [
        'script', 'style', 'iframe', 'object', 'embed',
        'applet', 'frame', 'frameset', 'noframes', 'noscript',
        'base', 'meta', 'link', 'form', 'input', 'button', 'select', 'textarea',
        'xml', 'svg', 'math', 'foreignobject',
    ];

    public function __construct(HtmlFieldConfig $config)
    {
        $this->config = $config;

        // Merge extraAttributes from config into the static allowlist.
        foreach ($config->extraAttributes as $tag => $attrs) {
            $tag = strtolower($tag);
            if (!isset($this->attrAllowlist[$tag])) {
                $this->attrAllowlist[$tag] = [];
            }
            $this->attrAllowlist[$tag] = array_values(array_unique(
                array_merge($this->attrAllowlist[$tag], $attrs)
            ));
        }
    }

    /**
     * Sanitize an HTML string.
     */
    public function sanitize(string $html): string
    {
        if ($html === '' || $html === null) return '';

        // Pre-clean: drop null bytes & BOM
        $html = str_replace(["\0", "\xEF\xBB\xBF"], '', $html);

        // Wrap in a root element so DOMDocument doesn't auto-add <html><body>
        $wrapped = '<div id="ls-rte-root">' . $html . '</div>';

        // Use internal errors so malformed HTML doesn't spam warnings
        $internal = libxml_use_internal_errors(true);
        $doc = new DOMDocument('1.0', 'UTF-8');
        $doc->preserveWhiteSpace = true;
        $doc->formatOutput = false;

        // Force UTF-8
        $loaded = $doc->loadHTML(
            '<?xml encoding="utf-8" ?>' . $wrapped,
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_NONET
        );
        libxml_clear_errors();
        libxml_use_internal_errors($internal);

        if (!$loaded) {
            // Fallback: strip all tags
            return strip_tags($html);
        }

        $root = $doc->getElementById('ls-rte-root');
        if (!$root) {
            return strip_tags($html);
        }

        // Process tree
        $this->processNode($root);

        // Serialize back
        $out = $doc->saveHTML($root);
        // Strip the wrapping marker
        $out = preg_replace(
            ['#^\s*<div id="ls-rte-root">#i', '#</div>\s*$#i'],
            '',
            (string) $out
        );

        return trim($out);
    }

    /**
     * Recursively process a DOM node, dropping disallowed tags/attrs.
     */
    protected function processNode(DOMNode $node): void
    {
        if (!$node->hasChildNodes()) return;

        // Collect children first (we'll be mutating the list)
        $children = [];
        foreach ($node->childNodes as $child) {
            $children[] = $child;
        }

        foreach ($children as $child) {
            if ($child->nodeType === XML_TEXT_NODE
                || $child->nodeType === XML_CDATA_SECTION_NODE) {
                continue;
            }

            if ($child->nodeType !== XML_ELEMENT_NODE) {
                // Comments, PIs, etc. — drop
                $node->removeChild($child);
                continue;
            }

            /** @var DOMElement $child */
            $tag = strtolower($child->nodeName);

            // Always strip forbidden tags (drop content)
            if (in_array($tag, $this->forbiddenTags, true)) {
                $node->removeChild($child);
                continue;
            }

            // Tag not in allowlist? unwrap (keep its children)
            if (!in_array($tag, $this->config->allowedTags, true)) {
                $this->unwrap($child);
                continue;
            }

            // Clean attributes
            $this->cleanAttributes($child, $tag);

            // Special per-tag processing
            $this->processSpecial($child, $tag);

            // Recurse
            $this->processNode($child);
        }
    }

    /**
     * Strip disallowed attributes and event-handlers from an element.
     */
    protected function cleanAttributes(DOMElement $el, string $tag): void
    {
        if (!$el->hasAttributes()) return;

        $keep = $this->attrAllowlist[$tag] ?? [];
        $toRemove = [];

        foreach ($el->attributes as $attr) {
            $name = strtolower($attr->nodeName);
            $value = $attr->nodeValue;

            // 1. Drop ALL event handlers (onclick, onerror, onload, onmouseover, ...)
            if (str_starts_with($name, 'on')) {
                $toRemove[] = $attr->nodeName;
                continue;
            }

            // 2. Drop ALL xml:* / xmlns:* (XSS / namespace injection)
            if (str_starts_with($name, 'xmlns:') || str_starts_with($name, 'xml:')) {
                $toRemove[] = $attr->nodeName;
                continue;
            }

            // 3. Drop class/style if config.stripUnknown is true and they have no allowlist match
            if ($name === 'class') {
                if (!$this->isClassAllowed($value)) $toRemove[] = $attr->nodeName;
                continue;
            }
            if ($name === 'style') {
                if (!$this->isStyleAllowed($value, $tag)) $toRemove[] = $attr->nodeName;
                continue;
            }

            // 4. Drop href/src that use a forbidden scheme
            if (in_array($name, ['href', 'src', 'xlink:href', 'action', 'formaction'], true)) {
                if (!$this->isUrlAllowed($value)) $toRemove[] = $attr->nodeName;
                continue;
            }

            // 5. Drop data-* unless explicitly in the per-tag allowlist
            if (str_starts_with($name, 'data-')) {
                $isExtra = in_array($name, $keep, true);
                if (!$isExtra) $toRemove[] = $attr->nodeName;
                continue;
            }

            // 6. Drop aria-* unless explicitly allowed
            if (str_starts_with($name, 'aria-')) {
                if (!in_array($name, $keep, true)) $toRemove[] = $attr->nodeName;
                continue;
            }

            // 7. Drop id unless explicitly allowed
            if ($name === 'id') {
                if (!in_array('id', $keep, true)) $toRemove[] = $attr->nodeName;
                continue;
            }

            // 8. Not in keep list?
            if (!in_array($name, $keep, true)) {
                $toRemove[] = $attr->nodeName;
                continue;
            }

            // 9. target="_blank" needs rel="noopener noreferrer"
            if ($name === 'target' && strtolower($value) === '_blank' && $this->config->allowBlankTarget) {
                $rel = strtolower($el->getAttribute('rel') ?? '');
                if (!str_contains($rel, 'noopener')) {
                    $el->setAttribute('rel', trim($rel . ' noopener noreferrer'));
                }
            }
        }

        foreach ($toRemove as $attrName) {
            $el->removeAttribute($attrName);
        }
    }

    /**
     * Per-tag specific logic.
     */
    protected function processSpecial(DOMElement $el, string $tag): void
    {
        // Force external links to open in new tab with safe rel
        if ($tag === 'a' && $this->config->allowBlankTarget) {
            $href = $el->getAttribute('href') ?? '';
            if ($href && (str_starts_with($href, 'http://') || str_starts_with($href, 'https://'))) {
                $existingTarget = strtolower($el->getAttribute('target') ?? '');
                if ($existingTarget === '') {
                    $el->setAttribute('target', '_blank');
                    $rel = strtolower($el->getAttribute('rel') ?? '');
                    if (!str_contains($rel, 'noopener')) {
                        $el->setAttribute('rel', trim($rel . ' noopener noreferrer'));
                    }
                }
            }
        }

        // Empty <a> → drop
        if ($tag === 'a' && trim($el->textContent) === '' && !$el->getAttribute('href')) {
            $this->unwrap($el);
        }

        // Images without src → drop
        if ($tag === 'img' && !$el->getAttribute('src')) {
            $el->parentNode->removeChild($el);
        }
    }

    /**
     * Check whether a CSS class string is allowlisted.
     * Supports `prefix-*` wildcards.
     */
    protected function isClassAllowed(string $classAttr): bool
    {
        if (empty($this->config->allowedClasses)) {
            // No allowlist configured → allow all (caller controls via stripUnknown)
            return !$this->config->stripUnknown;
        }

        $classes = preg_split('/\s+/', trim($classAttr));
        foreach ($classes as $cls) {
            if ($cls === '') continue;
            $matched = false;
            foreach ($this->config->allowedClasses as $pattern) {
                if ($pattern === $cls) { $matched = true; break; }
                if (str_ends_with($pattern, '*') && str_starts_with($cls, substr($pattern, 0, -1))) {
                    $matched = true; break;
                }
            }
            if (!$matched) {
                if ($this->config->stripUnknown) return false;
            }
        }
        return true;
    }

    /**
     * Check whether a style string is allowlisted.
     */
    protected function isStyleAllowed(string $style, string $tag): bool
    {
        if (empty($this->config->allowedStyles) && empty($this->config->styleAttributes[$tag] ?? [])) {
            return !$this->config->stripUnknown;
        }

        $allowed = array_merge(
            $this->config->allowedStyles,
            $this->config->styleAttributes[$tag] ?? []
        );

        $declarations = explode(';', $style);
        foreach ($declarations as $decl) {
            $decl = trim($decl);
            if ($decl === '') continue;
            [$prop, $val] = array_pad(explode(':', $decl, 2), 2, '');
            $prop = strtolower(trim($prop));
            $val  = trim($val);
            if ($prop === '' || $val === '') continue;

            if (!in_array($prop, $allowed, true)) {
                if ($this->config->stripUnknown) return false;
            }

            // Block url() / expression() / javascript:
            if (preg_match('/(url\s*\(|expression\s*\(|javascript\s*:)/i', $val)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check whether a URL is safe to keep.
     */
    protected function isUrlAllowed(string $url): bool
    {
        $url = trim($url);
        if ($url === '') return true;

        // Strip whitespace and control chars
        $url = preg_replace('/[\s\x00-\x1F\x7F]/', '', $url) ?? $url;

        // Detect scheme
        if (preg_match('/^([a-z][a-z0-9+.\-]*):/i', $url, $m)) {
            $scheme = strtolower($m[1]);
            if (!in_array($scheme, $this->config->allowedSchemes, true)) {
                return false;
            }
        } else {
            // Relative URL — allowed
            return true;
        }

        // Block javascript:/data: regardless of allowlist (defense in depth)
        if (in_array($scheme, ['javascript', 'data', 'vbscript'], true)) {
            return false;
        }

        return true;
    }

    /**
     * Unwrap an element (replace it with its children in its parent).
     */
    protected function unwrap(DOMNode $el): void
    {
        if (!$el->parentNode) return;
        $parent = $el->parentNode;
        while ($el->firstChild) {
            $parent->insertBefore($el->firstChild, $el);
        }
        $parent->removeChild($el);
    }

    // ══════════════════════════════════════════════════════
    //  Static helper
    // ══════════════════════════════════════════════════════

    /**
     * Quick sanitize: build a config from a list of allowed tags and run.
     */
    public static function sanitizeWith(string $html, array $allowedTags = [], array $allowedClasses = []): string
    {
        $cfg = new HtmlFieldConfig([
            'preset'         => HtmlFieldConfig::PRESET_STANDARD,
            'allowedTags'    => $allowedTags,
            'allowedClasses' => $allowedClasses,
        ]);
        return (new self($cfg))->sanitize($html);
    }
}
