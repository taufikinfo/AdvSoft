<?php

namespace App\Model\Ir;

use App\Model\BaseModel;
use Adianti\Database\TTransaction;
use Exception;
use PDO;

class IrTranslation extends BaseModel
{
    const TABLENAME  = 'ir_translations';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';

    /**
     * In-memory cache for translations per language:
     * [lang => [src => value, ...]]
     */
    protected static array $dictionaryCache = [];
    protected static array $namedDictionaryCache = [];

    /**
     * Load all translations for a given language into the in-memory cache.
     */
    public static function loadLanguageDictionary(string $lang, bool $forceReload = false): array
    {
        $normalizedLang = self::normalizeLang($lang);

        if (!$forceReload && isset(self::$dictionaryCache[$normalizedLang])) {
            return self::$dictionaryCache[$normalizedLang];
        }

        self::$dictionaryCache[$normalizedLang] = [];
        self::$namedDictionaryCache[$normalizedLang] = [];

        try {
            $hasActiveTx = false;
            try {
                TTransaction::get();
                $hasActiveTx = true;
            } catch (\Throwable $e) {
                TTransaction::open('advsoft');
            }

            $conn = TTransaction::get();
            // Match exact lang or prefix (e.g. 'en' matches 'en' or 'en_US')
            $stmt = $conn->prepare("SELECT name, type, src, value, res_id FROM ir_translations WHERE (lang = :l1 OR lang LIKE :l2) AND value IS NOT NULL AND value != '' ORDER BY id ASC");
            $stmt->execute([
                ':l1' => $normalizedLang,
                ':l2' => $normalizedLang . '_%',
            ]);

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $src = $row['src'];
                $val = $row['value'];
                $name = $row['name'];

                if ($src !== null && $src !== '') {
                    self::$dictionaryCache[$normalizedLang][$src] = $val;
                }
                if ($name !== null && $name !== '') {
                    self::$namedDictionaryCache[$normalizedLang][$name] = $val;
                }
            }

            if (!$hasActiveTx) {
                TTransaction::close();
            }
        } catch (\Throwable $e) {
            // Graceful fallback if table is not yet accessible
        }

        return self::$dictionaryCache[$normalizedLang];
    }

    /**
     * Translate a source string into the target language.
     */
    public static function translate(string $src, ?string $lang = null, string $type = 'code', ?string $name = null): string
    {
        if (empty($src)) {
            return $src;
        }

        $targetLang = self::normalizeLang($lang ?: self::getActiveLanguage());

        // Ensure dictionary is cached
        if (!isset(self::$dictionaryCache[$targetLang])) {
            self::loadLanguageDictionary($targetLang);
        }

        // 1. Try by exact name identifier if provided
        if ($name && isset(self::$namedDictionaryCache[$targetLang][$name])) {
            return self::$namedDictionaryCache[$targetLang][$name];
        }

        // 2. Try by source text
        if (isset(self::$dictionaryCache[$targetLang][$src])) {
            return self::$dictionaryCache[$targetLang][$src];
        }

        // 3. Fallback to source text unchanged
        return $src;
    }

    /**
     * Set or update a translation record in the database.
     */
    public static function setTranslation(
        string $name,
        string $src,
        string $value,
        string $lang,
        string $type = 'code',
        ?string $module = null,
        ?int $res_id = null,
        string $state = 'translated'
    ): static {
        $normalizedLang = self::normalizeLang($lang);

        $hasActiveTx = false;
        try {
            TTransaction::get();
            $hasActiveTx = true;
        } catch (\Throwable $e) {
            TTransaction::open('advsoft');
        }

        $record = null;
        if ($res_id) {
            $record = self::where('name', '=', $name)
                          ->where('lang', '=', $normalizedLang)
                          ->where('res_id', '=', $res_id)
                          ->first();
        } else {
            $record = self::where('name', '=', $name)
                          ->where('lang', '=', $normalizedLang)
                          ->where('src', '=', $src)
                          ->first();
        }

        if (!$record) {
            $record = new self;
            $record->name = $name;
            $record->src = $src;
            $record->lang = $normalizedLang;
            $record->type = $type;
            $record->module = $module;
            $record->res_id = $res_id;
        }

        $record->value = $value;
        $record->state = $state;
        if ($module && empty($record->module)) {
            $record->module = $module;
        }
        $record->save();

        // Update in-memory cache
        self::$dictionaryCache[$normalizedLang][$src] = $value;
        self::$namedDictionaryCache[$normalizedLang][$name] = $value;

        if (!$hasActiveTx) {
            TTransaction::close();
        }

        return $record;
    }

    /**
     * Normalize language code (e.g. 'en_US' -> 'en', 'id_ID' -> 'id' or preserve 'en_US' if configured).
     */
    public static function normalizeLang(?string $lang): string
    {
        if (empty($lang)) {
            return 'en';
        }
        $lang = str_replace('-', '_', trim($lang));
        // Return 2-character base language if common (e.g. 'en_US' -> 'en' / 'id_ID' -> 'id')
        $parts = explode('_', $lang);
        return strtolower($parts[0]);
    }

    /**
     * Determine active application language from Session / Config / User.
     */
    public static function getActiveLanguage(): string
    {
        if (session_status() === PHP_SESSION_ACTIVE && !empty($_SESSION['lang'])) {
            return $_SESSION['lang'];
        }

        $cfgLang = config('general.language');
        if (!empty($cfgLang)) {
            return $cfgLang;
        }

        return 'en';
    }

    /**
     * Clear all cached dictionaries in memory.
     */
    public static function clearCache(): void
    {
        self::$dictionaryCache = [];
        self::$namedDictionaryCache = [];
    }
}
