<?php

namespace App\Odoo\QWeb;

/**
 * QWebCompiler – Compiles QWeb XML templates into PHP render functions.
 *
 * Supported directives:
 *   t-out / t-esc    – Output with HTML escaping
 *   t-if / t-elif / t-else – Conditionals
 *   t-foreach / t-as – Loops (with automatic: _index, _value, _first, _last, _odd, _even, _size)
 *   t-set / t-value  – Variable assignment
 *   t-call           – Sub-template call
 *   t-att-*          – Dynamic single attribute
 *   t-attf-*         – Dynamic format-string attribute
 *   t-att            – Dynamic attribute dict
 *   t-field          – Field rendering with widget
 */
class QWebCompiler
{
    private int $indent = 0;
    private array $lines = [];
    private static array $cache = [];
    private int $varCounter = 0;
    /** @var int[] SPL object IDs of nodes consumed by t-if chaining */
    private array $consumedNodes = [];

    public function compile(string $templateName, string $xml): \Closure
    {
        if (isset(self::$cache[$templateName])) {
            return self::$cache[$templateName];
        }

        $doc = new \DOMDocument();
        $doc->preserveWhiteSpace = true;
        $doc->formatOutput = false;

        if (!@$doc->loadXML($xml)) {
            throw new \InvalidArgumentException("Invalid QWeb XML for template '{$templateName}'");
        }

        $this->lines = [];
        $this->indent = 0;
        $this->varCounter = 0;
        $this->consumedNodes = [];

        $this->line('$output = "";');
        $this->line('$vars = $env["vars"] ?? [];');
        $this->line('$__body = $env["0"] ?? null;');
        $this->line('extract($vars, EXTR_SKIP);');

        $root = $doc->documentElement;
        $this->compileNode($root);

        $this->line('return $output;');

        $code = implode("\n", $this->lines);

        $closure = function ($env) use ($code, $templateName) {
            $vars = $env['vars'] ?? [];
            $__body = $env['0'] ?? null;
            $output = '';
            extract($vars, EXTR_SKIP);

            try {
                eval($code);
            } catch (\Throwable $e) {
                throw new \RuntimeException(
                    "QWeb error in '{$templateName}': " . $e->getMessage(),
                    0, $e
                );
            }

            return $output;
        };

        self::$cache[$templateName] = $closure;
        return $closure;
    }

    private function compileNode(\DOMNode $node): void
    {
        if ($node instanceof \DOMText) {
            $text = $node->textContent;
            if ($text !== '') {
                $this->line('$output .= ' . $this->exportString($text) . ';');
            }
            return;
        }

        if (!($node instanceof \DOMElement)) return;

        // Skip nodes already consumed as part of a t-if/t-elif/t-else chain
        if (in_array(spl_object_id($node), $this->consumedNodes, true)) {
            return;
        }

        $attrs = $this->getAttributes($node);

        // Check directives first (before transparent wrapper check)
        if (isset($attrs['t-if'])) {
            $this->compileIfBranch($node, 'if');
            return;
        }
        // t-elif / t-else without a preceding t-if should be skipped
        // (they are already handled by compileIfBranch chaining)
        if (isset($attrs['t-elif']) || isset($attrs['t-else'])) {
            return;
        }
        if (isset($attrs['t-foreach'])) {
            $this->compileForeach($node, $attrs);
            return;
        }
        if (isset($attrs['t-set'])) {
            $this->compileSet($node, $attrs);
            return;
        }
        if (isset($attrs['t-call'])) {
            $this->compileCall($node, $attrs);
            return;
        }
        if (isset($attrs['t-out']) || isset($attrs['t-esc'])) {
            $expr = $attrs['t-out'] ?? $attrs['t-esc'];
            $this->line('$output .= ' . $this->compileExpr($expr) . ';');
            return;
        }
        if (isset($attrs['t-field'])) {
            $this->compileField($attrs);
            return;
        }

        // <template> and <t> without directives are transparent wrappers
        if ($node->nodeName === 'template' || $node->nodeName === 't') {
            foreach ($node->childNodes as $child) {
                $this->compileNode($child);
            }
            return;
        }

        $this->compileElement($node, $attrs);
    }

    private function compileElement(\DOMElement $node, array $attrs): void
    {
        $tagName = $node->nodeName;

        // <t> and <template> are transparent - handle t-out/t-esc then compile children
        if ($tagName === 't' || $tagName === 'template') {
            if (isset($attrs['t-out']) || isset($attrs['t-esc'])) {
                $expr = $attrs['t-out'] ?? $attrs['t-esc'];
                $this->line('$output .= ' . $this->compileExpr($expr) . ';');
                return;
            }
            foreach ($node->childNodes as $child) {
                $this->compileNode($child);
            }
            return;
        }

        $voidElements = ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'];
        $isVoid = in_array($tagName, $voidElements);

        $staticAttrs = [];
        $dynamicParts = [];

        foreach ($attrs as $name => $value) {
            if (str_starts_with($name, 't-') && !str_starts_with($name, 't-att')) continue;

            if ($name === 't-att') {
                $dynamicParts[] = $this->compileExpr($value);
            } elseif (str_starts_with($name, 't-attf-')) {
                $attrName = substr($name, 7);
                $staticAttrs[$attrName] = $this->compileFormatString($value);
            } elseif (str_starts_with($name, 't-att-')) {
                $attrName = substr($name, 6);
                $staticAttrs[$attrName] = $this->compileExpr($value);
            } else {
                $staticAttrs[$name] = $this->exportString($value);
            }
        }

        $this->line('$output .= ' . $this->exportString('<' . $tagName) . ';');

        foreach ($staticAttrs as $attrName => $attrValueExpr) {
            $this->line('$output .= ' . $this->exportString(' ' . $attrName . '="') . ' . ' . $attrValueExpr . ' . ' . $this->exportString('"') . ';');
        }

        foreach ($dynamicParts as $expr) {
            $var = $this->uniqueVar('__atts');
            $this->line('$' . $var . ' = ' . $expr . ';');
            $this->line('if (is_array($' . $var . ')) {');
            $this->line('  foreach ($' . $var . ' as $ak => $av) {');
            $this->line('    $output .= " " . $ak . "=\"" . $av . "\"";');
            $this->line('  }');
            $this->line('}');
        }

        if ($isVoid) {
            $this->line('$output .= ' . $this->exportString('/>') . ';');
        } else {
            $this->line('$output .= ' . $this->exportString('>') . ';');
            foreach ($node->childNodes as $child) {
                $this->compileNode($child);
            }
            $this->line('$output .= ' . $this->exportString('</' . $tagName . '>') . ';');
        }
    }

    private function compileIfBranch(\DOMNode $node, string $branchType): void
    {
        if (!($node instanceof \DOMElement)) return;
        $attrs = $this->getAttributes($node);

        if ($branchType === 'if' && isset($attrs['t-if'])) {
            $this->line('if (' . $this->compileExpr($attrs['t-if']) . ') {');
        } elseif ($branchType === 'elif' && isset($attrs['t-elif'])) {
            $this->line('} elseif (' . $this->compileExpr($attrs['t-elif']) . ') {');
        } elseif ($branchType === 'else' && isset($attrs['t-else'])) {
            $this->line('} else {');
        }

        $this->indent++;
        $cleanAttrs = array_diff_key($attrs, array_flip(['t-if', 't-elif', 't-else']));
        $this->compileElement($node, $cleanAttrs);
        $this->indent--;

        $next = $node->nextSibling;
        while ($next instanceof \DOMText && trim($next->textContent) === '') {
            $next = $next->nextSibling;
        }

        if ($next instanceof \DOMElement) {
            $nextAttrs = $this->getAttributes($next);
            if (isset($nextAttrs['t-elif'])) {
                $this->consumedNodes[] = spl_object_id($next);
                $this->compileIfBranch($next, 'elif');
                return;
            }
            if (isset($nextAttrs['t-else'])) {
                $this->consumedNodes[] = spl_object_id($next);
                $this->compileIfBranch($next, 'else');
                return;
            }
        }

        $this->line('}');
    }

    private function compileForeach(\DOMElement $node, array $attrs): void
    {
        $expr = $attrs['t-foreach'];
        $asName = preg_replace('/[^a-zA-Z0-9_]/', '_', $attrs['t-as'] ?? 'item');

        $iterVar = $this->uniqueVar('__iter');
        $keyVar = $this->uniqueVar('__key');
        $sizeVar = $this->uniqueVar('__size');

        $this->line('$' . $iterVar . ' = ' . $this->compileExpr($expr) . ';');
        $this->line('$' . $sizeVar . ' = is_array($' . $iterVar . ') ? count($' . $iterVar . ') : 0;');
        $this->line('$' . $keyVar . ' = 0;');
        $this->line('foreach ($' . $iterVar . ' as $' . $keyVar . ' => $' . $asName . ') {');
        $this->line('  $' . $asName . '_index = $' . $keyVar . ';');
        $this->line('  $' . $asName . '_value = $' . $asName . ';');
        $this->line('  $' . $asName . '_first = ($' . $keyVar . ' === 0);');
        $this->line('  $' . $asName . '_last = ($' . $keyVar . ' === $' . $sizeVar . ' - 1);');
        $this->line('  $' . $asName . '_odd = ($' . $keyVar . ' % 2 === 1);');
        $this->line('  $' . $asName . '_even = ($' . $keyVar . ' % 2 === 0);');
        $this->line('  $' . $asName . '_size = $' . $sizeVar . ';');

        $this->indent++;
        $cleanAttrs = array_diff_key($attrs, array_flip(['t-foreach', 't-as']));
        $this->compileElement($node, $cleanAttrs);
        $this->indent--;

        $this->line('}');
    }

    private function compileSet(\DOMElement $node, array $attrs): void
    {
        $varName = preg_replace('/[^a-zA-Z0-9_]/', '_', $attrs['t-set']);

        if (isset($attrs['t-value'])) {
            $this->line('$' . $varName . ' = ' . $this->compileExpr($attrs['t-value']) . ';');
        } elseif (isset($attrs['t-valuef'])) {
            $this->line('$' . $varName . ' = ' . $this->compileFormatString($attrs['t-valuef']) . ';');
        } else {
            $this->line('$' . $varName . ' = "";');
            $saveOutput = $this->uniqueVar('__save');
            $this->line('$' . $saveOutput . ' = $output;');
            $this->line('$output = "";');
            foreach ($node->childNodes as $child) {
                $this->compileNode($child);
            }
            $this->line('$' . $varName . ' = $output;');
            $this->line('$output = $' . $saveOutput . ';');
        }
    }

    /**
     * Compile t-field directive.
     * t-field renders a field value with widget formatting.
     * Usage: <span t-field="record.date_start"/>
     *        <span t-field="record.amount" t-options='{"widget": "monetary"}'/>
     */
    private function compileField(array $attrs): void
    {
        $expr = $attrs['t-field'];
        $compiled = $this->compileExpr($expr);

        $var = $this->uniqueVar('__field');
        $this->line('$' . $var . ' = ' . $compiled . ';');
        $this->line('if ($' . $var . ' instanceof \\DateTime) {');
        $this->line('  $output .= $' . $var . '->format("Y-m-d");');
        $this->line('} elseif (is_numeric($' . $var . ')) {');
        $this->line('  $output .= number_format((float)$' . $var . ', 2, \'.\', \',\');');
        $this->line('} elseif (is_string($' . $var . ')) {');
        $this->line('  $output .= htmlspecialchars($' . $var . ', ENT_QUOTES, \'UTF-8\');');
        $this->line('} elseif ($' . $var . ' !== null) {');
        $this->line('  $output .= (string) $' . $var . ';');
        $this->line('}');
    }

    private function compileCall(\DOMElement $node, array $attrs): void
    {
        $tplName = trim($attrs['t-call'], '"\'');
        $tplNameEscaped = addslashes($tplName);

        $callResult = $this->uniqueVar('__callResult');
        $saveOutput = $this->uniqueVar('__save');

        $this->line('$' . $saveOutput . ' = $output;');
        $this->line('$output = "";');

        if ($node->hasChildNodes()) {
            foreach ($node->childNodes as $child) {
                $this->compileNode($child);
            }
        }

        $this->line('$__bodyContent = $output;');
        $this->line('$output = $' . $saveOutput . ';');

        $this->line('$__tplFn = $env["_engine"]->load("' . $tplNameEscaped . '");');
        $this->line('$' . $callResult . ' = $__tplFn ? $__tplFn(["vars" => $vars, "0" => $__bodyContent, "_engine" => $env["_engine"]]) : "";');
        $this->line('$output .= $' . $callResult . ';');
    }

    private function compileExpr(string $expr): string
    {
        $expr = trim($expr);

        // String literal
        if ((str_starts_with($expr, '"') && str_ends_with($expr, '"')) ||
            (str_starts_with($expr, "'") && str_ends_with($expr, "'"))) {
            return $this->exportString(substr($expr, 1, -1));
        }

        // Handle negation prefix: !expr → !$compiled
        if (str_starts_with($expr, '!') && !str_starts_with($expr, '!=')) {
            $inner = $this->compileExpr(substr($expr, 1));
            return '(!' . $inner . ')';
        }

        // Python-like booleans
        $expr = str_replace(
            ['True', 'False', 'None'],
            ['true', 'false', 'null'],
            $expr
        );

        // Handle "not in" first (before general "in" replacement)
        $expr = preg_replace('/\s+not\s+in\s+/', ' NOT_IN ', $expr);
        $expr = preg_replace('/\s+in\s+/', ' IN_ARRAY ', $expr);
        $expr = str_replace([' not '], [' ! '], $expr);

        // Replace NOT_IN with !in_array
        if (preg_match('/(\S+)\s+NOT_IN\s+(.+)/', $expr, $m)) {
            return '!in_array(' . $m[1] . ', ' . $m[2] . ')';
        }

        // Replace IN_ARRAY with in_array
        if (preg_match('/(\S+)\s+IN_ARRAY\s+(.+)/', $expr, $m)) {
            return 'in_array(' . $m[1] . ', ' . $m[2] . ')';
        }

        // Equality
        $expr = preg_replace('/\s*==\s*/', ' === ', $expr);
        $expr = preg_replace('/\s*!=\s*/', ' !== ', $expr);

        // Handle comparison operators with expression on both sides
        // Skip if expression contains function calls
        if (!str_contains($expr, '(') && preg_match('/^(.+?)\s*(===|!==|>=|<=|>|<)\s*(.+)$/', $expr, $m)) {
            $left = $this->compileExpr(trim($m[1]));
            $op = $m[2];
            $right = $this->compileExpr(trim($m[3]));
            return '(' . $left . ' ' . $op . ' ' . $right . ')';
        }

        // Handle null coalescing (??) - before dot notation
        if (str_contains($expr, ' ?? ')) {
            if (preg_match('/^(.+?)\s+\?\?\s+(.+)$/', $expr, $m)) {
                $left = $this->compileExpr(trim($m[1]));
                $right = $this->compileExpr(trim($m[2]));
                return '(' . $left . ' ?? ' . $right . ')';
            }
        }

        // Handle logical OR (Python-style 'or' → PHP ?? null coalescing)
        // Must be before dot notation since it splits the expression
        if (preg_match('/^(.+?)\s+or\s+(.+)$/', $expr, $m)) {
            $left = $this->compileExpr(trim($m[1]));
            $right = $this->compileExpr(trim($m[2]));
            return '(' . $left . ' ?? ' . $right . ')';
        }

        // Handle logical AND
        if (preg_match('/^(.+?)\s+and\s+(.+)$/', $expr, $m)) {
            $left = $this->compileExpr(trim($m[1]));
            $right = $this->compileExpr(trim($m[2]));
            return '(' . $left . ' && ' . $right . ')';
        }

        // Handle logical operators: || and &&
        if (str_contains($expr, ' || ') || str_contains($expr, ' && ')) {
            // Split on || first (lower precedence), then &&
            if (preg_match('/^(.+?)\s+\|\|\s+(.+)$/', $expr, $m)) {
                $left = $this->compileExpr(trim($m[1]));
                $right = $this->compileExpr(trim($m[2]));
                return '(' . $left . ' ?? ' . $right . ')';
            }
            if (preg_match('/^(.+?)\s+&&\s+(.+)$/', $expr, $m)) {
                $left = $this->compileExpr(trim($m[1]));
                $right = $this->compileExpr(trim($m[2]));
                return '(' . $left . ' && ' . $right . ')';
            }
        }

        // Handle arithmetic and concatenation: a + b, a - b, a * b, a / b, a % b
        // Skip if expression contains function calls (parentheses) to avoid corrupting args
        if (!str_contains($expr, '(') && preg_match('/^(.+?)\s*([\+\-\*\/\%])\s*(.+)$/', $expr, $m)) {
            $left = trim($m[1]);
            $op = $m[2];
            $right = trim($m[3]);

            // Python-style string concatenation: use PHP . operator
            // If either side is a string literal, use concatenation
            if ($op === '+' && (
                (str_starts_with($left, '"') || str_starts_with($left, "'")) ||
                (str_starts_with($right, '"') || str_starts_with($right, "'"))
            )) {
                $leftCompiled = $this->compileExpr($left);
                $rightCompiled = $this->compileExpr($right);
                return '(' . $leftCompiled . ' . ' . $rightCompiled . ')';
            }

            $leftCompiled = $this->compileExpr($left);
            $rightCompiled = $this->compileExpr($right);
            return '(' . $leftCompiled . ' ' . $op . ' ' . $rightCompiled . ')';
        }

        // Handle .length → count() (Python/JS-style length property)
        if (preg_match('/^(.+)\.length$/', $expr, $m)) {
            $inner = trim($m[1]);
            // Avoid matching function calls like func().length
            if (!str_contains($inner, '(')) {
                $compiled = $this->compileExpr($inner);
                return 'count(' . $compiled . ')';
            }
        }

        // Dot notation for simple property access: record.name
        if (preg_match('/^([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)$/', $expr, $m)) {
            $obj = '$' . $m[1];
            $prop = $m[2];
            return "((is_array({$obj}) && isset({$obj}['{$prop}'])) ? {$obj}['{$prop}'] : (is_object({$obj}) ? {$obj}->{$prop} : ''))";
        }

        // Chained access: a.b.c.d
        if (preg_match('/^([a-zA-Z_][a-zA-Z0-9_]*)\.(.+)$/', $expr, $m) && !str_contains($expr, '(')) {
            $root = '$' . $m[1];
            $parts = explode('.', $m[2]);
            $code = $root;
            foreach ($parts as $part) {
                $code = "((is_array({$code}) && isset({$code}['{$part}'])) ? {$code}['{$part}'] : (is_object({$code}) ? {$code}->{$part} : ''))";
            }
            return $code;
        }

        // Method call: obj.method(args)
        if (preg_match('/^([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\((.*)\)$/', $expr, $m)) {
            return '$' . $m[1] . '->' . $m[2] . '(' . $m[3] . ')';
        }

        // Array access: var[key]
        if (preg_match('/^([a-zA-Z_][a-zA-Z0-9_]*)\[(.+)\]$/', $expr, $m)) {
            return '$' . $m[1] . '[' . $m[2] . ']';
        }

        // Simple variable
        if (preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $expr)) {
            return '$' . $expr;
        }

        // Odoo body content reference: t-out="0" → $__body
        if ($expr === '0') {
            return '$__body';
        }

        return $expr;
    }

    private function compileFormatString(string $fmt): string
    {
        $fmt = trim($fmt, '"\'');
        $parts = preg_split('/\{\{(.+?)\}\}/', $fmt, -1, PREG_SPLIT_DELIM_CAPTURE);

        if (count($parts) === 1) {
            return $this->exportString($parts[0]);
        }

        $codeParts = [];
        for ($i = 0; $i < count($parts); $i++) {
            if ($i % 2 === 0) {
                if ($parts[$i] !== '') $codeParts[] = $this->exportString($parts[$i]);
            } else {
                $codeParts[] = $this->compileExpr($parts[$i]);
            }
        }

        return implode(' . ', $codeParts);
    }

    private function exportString(string $value): string
    {
        return "'" . addcslashes($value, "\\'") . "'";
    }

    private function getAttributes(\DOMElement $node): array
    {
        $attrs = [];
        if ($node->hasAttributes()) {
            foreach ($node->attributes as $attr) {
                $attrs[$attr->nodeName] = $attr->nodeValue;
            }
        }
        return $attrs;
    }

    private function line(string $code): void
    {
        $this->lines[] = str_repeat('  ', $this->indent) . $code;
    }

    private function uniqueVar(string $prefix): string
    {
        return $prefix . '_' . (++$this->varCounter);
    }

    public static function clearCache(): void
    {
        self::$cache = [];
    }
}
