<?php

namespace App\Odoo\Field\Html;

/**
 * HtmlFieldConfig – Odoo-style configuration for HTML/Rich-Text fields.
 *
 * Mirrors Odoo's `ir.fields.html` configuration pipeline:
 *   - Define allowed tags / attributes (CSS classes whitelist)
 *   - Configure toolbar buttons (bold/italic/.../table/.../mention)
 *   - Enable / disable plugins (link, image, mention, code-view, source, ...)
 *   - Set image upload endpoint and constraints
 *   - Set sanitization policy and CSP-like sandbox
 *   - Configure placeholder, height, and read-only mode
 *
 * The class is intentionally immutable: `with*` helpers return a NEW instance,
 * making it safe to share base configs across fields.
 *
 *  ┌──────────────────────────────────────────────────────────────┐
 *  │  HtmlField (UI/Owl widget)  ──driven by──►  HtmlFieldConfig   │
 *  │  HtmlFieldController  (image upload, embeds, mentions)        │
 *  │  Sanitizer                (server-side html_sanitize)         │
 *  └──────────────────────────────────────────────────────────────┘
 */
class HtmlFieldConfig
{
    // ══════════════════════════════════════════════════════
    //  Built-in presets (mirror Odoo's standard HTML configs)
    // ══════════════════════════════════════════════════════

    /** Minimal config — plain text + bold/italic/lists/links (Odoo default for "html_text"). */
    const PRESET_TEXT = 'text';

    /** Standard config — text + headings + tables + images + code. */
    const PRESET_STANDARD = 'standard';

    /** Full config — everything: media, mentions, code, math, source view. */
    const PRESET_FULL = 'full';

    /** Compact — only inline formatting (chat-like). */
    const PRESET_INLINE = 'inline';

    /** Knowledge-base style — headings, callouts, code, tables, embeds. */
    const PRESET_KB = 'knowledge';

    // ══════════════════════════════════════════════════════
    //  Fields
    // ══════════════════════════════════════════════════════

    public string $name = 'body';

    /** Preset key used to seed this config. */
    public string $preset = self::PRESET_STANDARD;

    /** Editor display label. */
    public string $string = 'HTML';

    /** Placeholder text when editor is empty. */
    public ?string $placeholder = 'Write something…';

    /** Minimum / maximum content height (CSS). */
    public ?string $minHeight = '160px';
    public ?string $maxHeight = null;

    /** Read-only mode. */
    public bool $readonly = false;

    /** Allow compact toolbar (icon-only). */
    public bool $compact = false;

    /** Auto-focus on mount. */
    public bool $autofocus = false;

    /** Show word / character count. */
    public bool $showStats = true;

    /** Show fullscreen toggle. */
    public bool $allowFullscreen = true;

    /** Toolbar layout. */
    public string $toolbarLayout = 'multi-row'; // 'multi-row' | 'single-row' | 'scrollable'

    /** Ordered list of toolbar groups (each group is an array of button keys). */
    public array $toolbar = [];

    /** Enabled plugin keys. */
    public array $plugins = [];

    /** Allowed HTML tags (server-side allowlist). */
    public array $allowedTags = [];

    /** Allowed CSS classes (server-side allowlist). */
    public array $allowedClasses = [];

    /** Allowed inline styles (very limited set). */
    public array $allowedStyles = [];

    /** Allowed URL schemes (links / images). */
    public array $allowedSchemes = ['http', 'https', 'mailto', 'tel'];

    /** Image upload endpoint route name (or null = disabled). */
    public ?string $imageUploadRoute = '/api/html-field/image-upload';

    /** Max image size in bytes. */
    public int $imageMaxSize = 5 * 1024 * 1024; // 5 MB

    /** Allowed image MIME types. */
    public array $imageAllowedMimes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];

    /** Mention endpoint route name (or null = disabled). */
    public ?string $mentionRoute = '/api/html-field/mentions';

    /** Mention model that the mention will resolve to (e.g. 'res.partner'). */
    public ?string $mentionModel = null;

    /** Embed / oEmbed endpoint route name (or null = disabled). */
    public ?string $embedRoute = '/api/html-field/embeds';

    /** Whether to render embeds (YouTube, Twitter, etc.) as cards. */
    public bool $renderEmbeds = true;

    /** Whether to convert image URLs through the server (proxying). */
    public bool $proxyImages = false;

    /** Strip all classes/ids/styles that aren't in the allowlist. */
    public bool $stripUnknown = true;

    /** Strip all scripts / event handlers. */
    public bool $stripScripts = true;

    /** Allow target="_blank" on links. */
    public bool $allowBlankTarget = true;

    /** Custom sanitization options array (passed to Sanitizer). */
    public array $sanitizeOptions = [];

    /** Extra inline styles allowed on specific tags. */
    public array $styleAttributes = [
        'p'    => ['text-align'],
        'span' => ['color', 'background-color'],
        'td'   => ['text-align', 'background-color'],
        'th'   => ['text-align', 'background-color'],
    ];

    /** Extra attributes allowed on specific tags. */
    public array $extraAttributes = [
        'a'    => ['rel', 'target', 'data-mention-id', 'data-mention-model', 'data-embed-id', 'data-embed-url'],
        'img'  => ['data-id', 'data-original-src'],
        'div'  => ['data-embed', 'data-callout', 'data-snippet'],
    ];

    // ══════════════════════════════════════════════════════
    //  Constructor
    // ══════════════════════════════════════════════════════

    public function __construct(array $attrs = [])
    {
        foreach ($attrs as $key => $value) {
            if (property_exists($this, $key)) {
                $this->$key = $value;
            }
        }

        // If a preset is given, seed defaults BEFORE applying the override
        if (isset($attrs['preset'])) {
            $this->applyPreset($attrs['preset']);
        } else {
            $this->applyPreset($this->preset);
        }

        // Re-apply user overrides (preset may have overwritten)
        foreach ($attrs as $key => $value) {
            if (property_exists($this, $key) && $key !== 'preset') {
                $this->$key = $value;
            }
        }
    }

    // ══════════════════════════════════════════════════════
    //  Static factory: preset()
    // ══════════════════════════════════════════════════════

    public static function preset(string $name, array $overrides = []): self
    {
        $cfg = new self(['preset' => $name]);
        foreach ($overrides as $k => $v) {
            if (property_exists($cfg, $k)) {
                $cfg->$k = $v;
            }
        }
        return $cfg;
    }

    // ══════════════════════════════════════════════════════
    //  Immutable `with*` helpers
    // ══════════════════════════════════════════════════════

    public function withToolbar(array $toolbar): self
    {
        $clone = clone $this;
        $clone->toolbar = $toolbar;
        return $clone;
    }

    public function withPlugin(string $plugin, bool $enabled = true): self
    {
        $clone = clone $this;
        $set = array_flip($clone->plugins);
        if ($enabled) $set[$plugin] = true;
        else unset($set[$plugin]);
        $clone->plugins = array_keys($set);
        return $clone;
    }

    public function withAllowedTag(string $tag, bool $enabled = true): self
    {
        $clone = clone $this;
        if ($enabled && !in_array($tag, $clone->allowedTags)) {
            $clone->allowedTags[] = $tag;
        } elseif (!$enabled) {
            $clone->allowedTags = array_values(array_diff($clone->allowedTags, [$tag]));
        }
        return $clone;
    }

    public function readonly(bool $value = true): self
    {
        $clone = clone $this;
        $clone->readonly = $value;
        return $clone;
    }

    public function compact(bool $value = true): self
    {
        $clone = clone $this;
        $clone->compact = $value;
        return $clone;
    }

    // ══════════════════════════════════════════════════════
    //  Preset application
    // ══════════════════════════════════════════════════════

    protected function applyPreset(string $name): void
    {
        switch ($name) {
            case self::PRESET_TEXT:
                $this->applyTextPreset();
                break;
            case self::PRESET_INLINE:
                $this->applyInlinePreset();
                break;
            case self::PRESET_KB:
                $this->applyKnowledgePreset();
                break;
            case self::PRESET_FULL:
                $this->applyFullPreset();
                break;
            case self::PRESET_STANDARD:
            default:
                $this->applyStandardPreset();
                break;
        }
    }

    protected function applyTextPreset(): void
    {
        $this->preset = self::PRESET_TEXT;
        $this->toolbar = [
            ['history-undo', 'history-redo'],
            ['format-bold', 'format-italic', 'format-underline', 'format-strike'],
            ['list-ul', 'list-ol'],
            ['link', 'unlink'],
            ['clean-format'],
        ];
        $this->plugins = ['history', 'list', 'link', 'clean'];
        $this->allowedTags = [
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
            'ul', 'ol', 'li', 'a', 'span',
        ];
        $this->allowedClasses = [];
        $this->allowedStyles = [];
        $this->minHeight = '100px';
    }

    protected function applyInlinePreset(): void
    {
        $this->preset = self::PRESET_INLINE;
        $this->toolbar = [
            ['format-bold', 'format-italic', 'format-underline'],
            ['link', 'mention'],
            ['emoji'],
        ];
        $this->plugins = ['link', 'mention', 'emoji', 'history'];
        $this->allowedTags = ['strong', 'b', 'em', 'i', 'u', 'a', 'span', 'br'];
        $this->minHeight = '40px';
        $this->compact = true;
        $this->showStats = false;
    }

    protected function applyStandardPreset(): void
    {
        $this->preset = self::PRESET_STANDARD;
        $this->toolbar = [
            ['history-undo', 'history-redo'],
            ['format-bold', 'format-italic', 'format-underline', 'format-strike'],
            ['heading-p', 'heading-h1', 'heading-h2', 'heading-h3'],
            ['list-ul', 'list-ol', 'indent', 'outdent'],
            ['link', 'unlink'],
            ['image', 'table'],
            ['code', 'code-block', 'quote'],
            ['text-color', 'background-color'],
            ['clean-format', 'source-view', 'fullscreen'],
        ];
        $this->plugins = [
            'history', 'heading', 'list', 'link', 'image', 'table',
            'code', 'quote', 'color', 'clean', 'source', 'fullscreen',
        ];
        $this->allowedTags = [
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'a', 'img',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'pre', 'code', 'blockquote',
            'span', 'div', 'hr',
        ];
        $this->allowedClasses = [
            'text-*', 'bg-*', 'fa', 'fa-*', 'oe-*', 'ls-*', 'o_*', 'o_image', 'callout', 'callout-*',
        ];
        $this->allowedStyles = ['text-align', 'color', 'background-color', 'font-weight'];
        $this->minHeight = '200px';
        $this->maxHeight = '500px';
    }

    protected function applyKnowledgePreset(): void
    {
        $this->applyStandardPreset();
        $this->preset = self::PRESET_KB;
        $this->toolbar[] = ['callout', 'divider', 'toc'];
        $this->plugins[] = 'callout';
        $this->plugins[] = 'toc';
        $this->allowedTags[] = 'details';
        $this->allowedTags[] = 'summary';
        $this->allowedClasses[] = 'callout';
        $this->allowedClasses[] = 'callout-*';
        $this->renderEmbeds = true;
    }

    protected function applyFullPreset(): void
    {
        $this->applyStandardPreset();
        $this->preset = self::PRESET_FULL;
        $this->toolbar[] = ['mention', 'embed', 'emoji', 'math'];
        $this->plugins[] = 'mention';
        $this->plugins[] = 'embed';
        $this->plugins[] = 'emoji';
        $this->plugins[] = 'math';
        $this->allowedTags[] = 'svg';
        $this->allowedTags[] = 'path';
        $this->allowedTags[] = 'g';
    }

    // ══════════════════════════════════════════════════════
    //  Serialization (sent to the JS widget)
    // ══════════════════════════════════════════════════════

    /**
     * Convert to a plain array for JSON transport to the frontend.
     * The frontend widget uses this as its sole configuration source.
     */
    public function toArray(): array
    {
        return [
            'name'              => $this->name,
            'preset'            => $this->preset,
            'string'            => $this->string,
            'placeholder'       => $this->placeholder,
            'min_height'        => $this->minHeight,
            'max_height'        => $this->maxHeight,
            'readonly'          => $this->readonly,
            'compact'           => $this->compact,
            'autofocus'         => $this->autofocus,
            'show_stats'        => $this->showStats,
            'allow_fullscreen'  => $this->allowFullscreen,
            'toolbar_layout'    => $this->toolbarLayout,
            'toolbar'           => $this->toolbar,
            'plugins'           => $this->plugins,
            'allowed_tags'      => $this->allowedTags,
            'allowed_classes'   => $this->allowedClasses,
            'allowed_styles'    => $this->allowedStyles,
            'allowed_schemes'   => $this->allowedSchemes,
            'style_attributes'  => $this->styleAttributes,
            'extra_attributes'  => $this->extraAttributes,
            'image' => [
                'enabled'       => in_array('image', $this->plugins, true),
                'upload_route'  => $this->imageUploadRoute,
                'max_size'      => $this->imageMaxSize,
                'allowed_mimes' => $this->imageAllowedMimes,
            ],
            'mention' => [
                'enabled'    => in_array('mention', $this->plugins, true),
                'route'      => $this->mentionRoute,
                'model'      => $this->mentionModel,
            ],
            'embed' => [
                'enabled'        => in_array('embed', $this->plugins, true),
                'route'          => $this->embedRoute,
                'render_cards'   => $this->renderEmbeds,
            ],
            'sanitize' => [
                'strip_unknown'   => $this->stripUnknown,
                'strip_scripts'   => $this->stripScripts,
                'allow_blank'     => $this->allowBlankTarget,
                'options'         => $this->sanitizeOptions,
            ],
        ];
    }
}
