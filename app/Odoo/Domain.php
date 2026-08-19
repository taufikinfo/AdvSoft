<?php

namespace App\Odoo;

use Adianti\Database\TCriteria;
use Adianti\Database\TFilter;

/**
 * Domain – Odoo-style domain expression parser and query applier for Adianti.
 * Converts [['field','op','value'], ...] to SQL where clauses, TCriteria, or query builders.
 */
class Domain
{
    /**
     * Parse an Odoo domain string into a PHP array.
     */
    public static function parse(string $str): array
    {
        $str = trim($str);
        if ($str === '' || $str === '[]') return [];
        // Strip outer brackets
        if ($str[0] === '[') $str = substr($str, 1);
        if (substr($str, -1) === ']') $str = substr($str, 0, -1);
        $str = trim($str);
        if ($str === '') return [];

        $tokens = self::tokenize($str);
        return self::tokensToArray($tokens);
    }

    protected static function tokenize(string $s): array
    {
        $tokens = [];
        $i = 0;
        $len = strlen($s);
        while ($i < $len) {
            $c = $s[$i];
            if ($c === ' ' || $c === "\n" || $c === "\t" || $c === ',') { $i++; continue; }
            if ($c === '(') {
                $i++;
                $tuple = [];
                $buf = '';
                $inStr = false;
                $strCh = '';
                while ($i < $len) {
                    $c2 = $s[$i];
                    if ($inStr) {
                        if ($c2 === '\\' && $i + 1 < $len) { $buf .= $s[$i+1]; $i += 2; continue; }
                        if ($c2 === $strCh) { $inStr = false; $i++; continue; }
                        $buf .= $c2; $i++; continue;
                    }
                    if ($c2 === "'" || $c2 === '"') { $inStr = true; $strCh = $c2; $i++; continue; }
                    if ($c2 === ')') { $tuple[] = $buf; $buf = ''; $i++; break; }
                    if ($c2 === ',') { $tuple[] = trim($buf); $buf = ''; $i++; continue; }
                    $buf .= $c2; $i++;
                }
                $tuple = array_map('trim', $tuple);
                if (count($tuple) === 3) {
                    [$f, $op, $v] = $tuple;
                    if (is_numeric($v) && $op !== 'in' && $op !== 'not in') {
                        $v = $v + 0;
                    } elseif (in_array(strtolower($v), ['true', 'false'], true)) {
                        $v = strtolower($v) === 'true';
                    } elseif ($v === 'None' || $v === 'null') {
                        $v = null;
                    }
                    $tokens[] = [$f, $op, $v];
                }
                continue;
            }
            if ($c === "'" || $c === '"') {
                $inStr = true; $strCh = $c; $i++;
                $buf = '';
                while ($i < $len) {
                    $c2 = $s[$i];
                    if ($c2 === '\\' && $i + 1 < $len) { $buf .= $s[$i+1]; $i += 2; continue; }
                    if ($c2 === $strCh) { $inStr = false; $i++; break; }
                    $buf .= $c2; $i++;
                }
                $tokens[] = $buf;
                continue;
            }
            if ($c === '|') { $tokens[] = '|'; $i++; continue; }
            if ($c === '&') { $tokens[] = '&'; $i++; continue; }
            if ($c === '!') { $tokens[] = '!'; $i++; continue; }
            $i++;
        }
        return $tokens;
    }

    protected static function tokensToArray(array $tokens): array
    {
        $result = [];
        $prevOp = '&';
        for ($i = 0; $i < count($tokens); $i++) {
            $t = $tokens[$i];
            if ($t === '|' || $t === '&' || $t === '!') {
                $prevOp = $t;
                if ($t === '!' && isset($tokens[$i+1]) && is_array($tokens[$i+1])) {
                    $result[] = ['!', $tokens[$i+1]];
                    $i++;
                    $prevOp = '&';
                }
                continue;
            }
            if (is_array($t)) {
                $result[] = $t;
                $prevOp = '&';
            }
        }
        return $result;
    }

    /**
     * Compile domain into SQL WHERE expression and parameter bindings for PDO.
     */
    public static function toSql(array $domain, ModelDefinition $modelDef): array
    {
        $clauses = [];
        $params = [];
        $pIndex = 0;

        foreach ($domain as $condition) {
            if (!is_array($condition)) continue;

            if (count($condition) === 2 && $condition[0] === '!' && is_array($condition[1])) {
                $sub = self::toSql([$condition[1]], $modelDef);
                if (!empty($sub['where'])) {
                    $clauses[] = "NOT (" . $sub['where'] . ")";
                    $params = array_merge($params, $sub['params']);
                }
                continue;
            }

            if (count($condition) < 3) continue;
            [$field, $operator, $value] = $condition;

            if ($field === '__search__') {
                $searchable = array_filter($modelDef->getFields(), fn(Field $f) => $f->searchable && $f->isScalar());
                $orParts = [];
                foreach ($searchable as $sf) {
                    $pKey = ":dom_p" . ($pIndex++);
                    $orParts[] = "{$sf->name} LIKE {$pKey}";
                    $params[$pKey] = "%{$value}%";
                }
                if (!empty($orParts)) {
                    $clauses[] = "(" . implode(" OR ", $orParts) . ")";
                }
                continue;
            }

            $fieldDef = $modelDef->getField($field);
            if (!$fieldDef) continue;

            $pKey = ":dom_p" . ($pIndex++);
            switch (strtolower($operator)) {
                case '=':
                    if ($value === null) {
                        $clauses[] = "{$field} IS NULL";
                    } else {
                        $clauses[] = "{$field} = {$pKey}";
                        $params[$pKey] = $value;
                    }
                    break;
                case '!=':
                    if ($value === null) {
                        $clauses[] = "{$field} IS NOT NULL";
                    } else {
                        $clauses[] = "{$field} != {$pKey}";
                        $params[$pKey] = $value;
                    }
                    break;
                case '>': case 'gt':
                    $clauses[] = "{$field} > {$pKey}";
                    $params[$pKey] = $value;
                    break;
                case '>=':
                    $clauses[] = "{$field} >= {$pKey}";
                    $params[$pKey] = $value;
                    break;
                case '<': case 'lt':
                    $clauses[] = "{$field} < {$pKey}";
                    $params[$pKey] = $value;
                    break;
                case '<=':
                    $clauses[] = "{$field} <= {$pKey}";
                    $params[$pKey] = $value;
                    break;
                case 'like': case 'ilike':
                    $clauses[] = "{$field} LIKE {$pKey}";
                    $params[$pKey] = "%{$value}%";
                    break;
                case 'in':
                    $valArray = is_array($value) ? $value : [$value];
                    if (empty($valArray)) {
                        $clauses[] = "1=0";
                    } else {
                        $inKeys = [];
                        foreach ($valArray as $item) {
                            $k = ":dom_p" . ($pIndex++);
                            $inKeys[] = $k;
                            $params[$k] = $item;
                        }
                        $clauses[] = "{$field} IN (" . implode(',', $inKeys) . ")";
                    }
                    break;
                case 'not in':
                    $valArray = is_array($value) ? $value : [$value];
                    if (!empty($valArray)) {
                        $inKeys = [];
                        foreach ($valArray as $item) {
                            $k = ":dom_p" . ($pIndex++);
                            $inKeys[] = $k;
                            $params[$k] = $item;
                        }
                        $clauses[] = "{$field} NOT IN (" . implode(',', $inKeys) . ")";
                    }
                    break;
                case 'is_set':
                    $clauses[] = "({$field} IS NOT NULL AND {$field} != '')";
                    break;
                case 'is_not_set':
                    $clauses[] = "({$field} IS NULL OR {$field} = '')";
                    break;
            }
        }

        return [
            'where'  => implode(' AND ', $clauses),
            'params' => $params,
        ];
    }

    /**
     * Apply domain conditions to an object/query.
     */
    public static function apply(mixed $query, array $domain, ModelDefinition $modelDef): mixed
    {
        if (is_object($query) && method_exists($query, 'where')) {
            foreach ($domain as $condition) {
                if (!is_array($condition) || count($condition) < 3) continue;
                [$field, $operator, $value] = $condition;
                $fieldDef = $modelDef->getField($field);
                if (!$fieldDef && $field !== '__search__') continue;

                if ($operator === '=') $query->where($field, '=', $value);
                elseif ($operator === '!=') $query->where($field, '!=', $value);
                elseif ($operator === 'like' || $operator === 'ilike') $query->where($field, 'like', "%{$value}%");
                elseif ($operator === 'in') $query->whereIn($field, (array)$value);
                elseif ($operator === 'not in') $query->whereNotIn($field, (array)$value);
                elseif ($operator === '>') $query->where($field, '>', $value);
                elseif ($operator === '>=') $query->where($field, '>=', $value);
                elseif ($operator === '<') $query->where($field, '<', $value);
                elseif ($operator === '<=') $query->where($field, '<=', $value);
            }
        }
        return $query;
    }
}
