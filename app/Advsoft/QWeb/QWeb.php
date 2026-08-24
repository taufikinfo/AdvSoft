<?php

namespace App\Advsoft\QWeb;


/**
 * QWeb – Main QWeb template engine (ir.qweb equivalent).
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  QWeb Engine — Server-side XML template rendering           ║
 * ║                                                              ║
 * ║  Templates stored in ir_ui_views (type='qweb')              ║
 * ║  Inheritance via inherit_id + XPath transformations          ║
 * ║  Compiled to PHP closures and cached                         ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   $qweb = app(QWeb::class);
 *   $html = $qweb->render('my.template', ['record' => $data]);
 */
class QWeb
{
    private QWebCompiler $compiler;
    private QWebLoader $loader;

    /** @var array Loaded template XMLs (name → SimpleXMLElement) */
    private array $loadedTemplates = [];

    /** @var array Rendered output stack (for t-call nesting) */
    private array $callStack = [];

    public function __construct()
    {
        $this->compiler = new QWebCompiler();
        $this->loader = new QWebLoader();
    }

    /**
     * Render a QWeb template with given variables.
     *
     * @param string $templateName  Template reference (XML ID or name)
     * @param array  $variables     Template variables
     * @return string                Rendered HTML
     */
    public function render(string $templateName, array $variables = []): string
    {
        $xml = $this->loadTemplate($templateName);

        $closure = $this->compiler->compile($templateName, $xml);

        $env = [
            'vars' => $variables,
            '0' => null,
            '_engine' => $this,
        ];

        return $closure($env);
    }

    /**
     * Load a template XML string by name.
     * Checks cache, then DB (ir_ui_views), then file system.
     */
    public function load(string $templateName): ?\Closure
    {
        $xml = $this->loadTemplate($templateName);
        if (!$xml) {
            return null;
        }
        return $this->compiler->compile($templateName, $xml);
    }

    /**
     * Load and resolve a template XML by name.
     * Applies inheritance if needed.
     */
    private function loadTemplate(string $templateName): string
    {
        if (isset($this->loadedTemplates[$templateName])) {
            return $this->loadedTemplates[$templateName];
        }

        // 1. Try loading from ir_ui_views (type='qweb')
        $xml = $this->loader->loadFromDb($templateName);

        // 2. Try loading from addon XML files
        if (!$xml) {
            $xml = $this->loader->loadFromAddonFiles($templateName);
        }

        if (!$xml) {
            throw new \InvalidArgumentException("QWeb template '{$templateName}' not found.");
        }

        // 3. Apply template inheritance
        $xml = $this->applyInheritance($templateName, $xml);

        $this->loadedTemplates[$templateName] = $xml;
        return $xml;
    }

    /**
     * Apply template inheritance transformations.
     *
     * Loads all child templates that inherit from this one,
     * applies XPath modifications in priority order.
     */
    private function applyInheritance(string $templateName, string $xml): string
    {
        $children = $this->loader->getInheritChildren($templateName);

        if (empty($children)) {
            return $xml;
        }

        $doc = new \DOMDocument();
        $doc->preserveWhiteSpace = true;
        $doc->formatOutput = false;
        @$doc->loadXML($xml);

        foreach ($children as $child) {
            $childArch = is_array($child) ? ($child['arch'] ?? '') : ($child->arch ?? '');
            $childDoc = new \DOMDocument();
            $childDoc->preserveWhiteSpace = true;
            @$childDoc->loadXML($childArch);

            $xpath = new \DOMXPath($childDoc);

            // Find all xpath elements in the child template
            $xpathNodes = $xpath->query('//xpath');
            if ($xpathNodes === false) continue;

            foreach ($xpathNodes as $xpathNode) {
                $expr = $xpathNode->getAttribute('expr');
                $position = $xpathNode->getAttribute('position') ?: 'replace';

                $targetNodes = $this->xpathQuery($doc, $expr);
                if ($targetNodes === false || $targetNodes->length === 0) {
                    continue;
                }

                $target = $targetNodes->item(0);

                switch ($position) {
                    case 'inside':
                        foreach ($xpathNode->childNodes as $childNode) {
                            $imported = $doc->importNode($childNode, true);
                            $target->appendChild($imported);
                        }
                        break;

                    case 'after':
                        $parent = $target->parentNode;
                        foreach ($xpathNode->childNodes as $childNode) {
                            $imported = $doc->importNode($childNode, true);
                            $parent->insertBefore($imported, $target->nextSibling);
                        }
                        break;

                    case 'before':
                        $parent = $target->parentNode;
                        foreach ($xpathNode->childNodes as $childNode) {
                            $imported = $doc->importNode($childNode, true);
                            $parent->insertBefore($imported, $target);
                        }
                        break;

                    case 'replace':
                        $parent = $target->parentNode;
                        foreach ($xpathNode->childNodes as $childNode) {
                            $imported = $doc->importNode($childNode, true);
                            $parent->insertBefore($imported, $target);
                        }
                        $parent->removeChild($target);
                        break;

                    case 'attributes':
                        foreach ($xpathNode->attributes as $attr) {
                            if (in_array($attr->nodeName, ['expr', 'position'])) continue;
                            $target->setAttribute($attr->nodeName, $attr->nodeValue);
                        }
                        break;
                }
            }
        }

        return $doc->saveXML();
    }

    /**
     * Execute an XPath expression on a DOM document.
     */
    private function xpathQuery(\DOMDocument $doc, string $expr): ?\DOMNodeList
    {
        $xpath = new \DOMXPath($doc);
        // Register default namespace prefix
        return @$xpath->query($expr);
    }

    /**
     * Get the compiler instance.
     */
    public function getCompiler(): QWebCompiler
    {
        return $this->compiler;
    }

    /**
     * Clear all caches.
     */
    public function clearCache(): void
    {
        $this->loadedTemplates = [];
        QWebCompiler::clearCache();
    }
}
