<?php



use PhpOffice\PhpWord\Element\Table;
use PhpOffice\PhpWord\Element\TextRun;
use PhpOffice\PhpWord\SimpleType\TblWidth;
use PhpOffice\PhpWord\SimpleType\Jc;

class MarkdownToWordParser
{
    public static function parse($markdownText)
    {
        // 1. Container Setup: Set Margin ke 0 Mutlak
        // Ini penting agar 'SpaceAfter' paragraf bekerja akurat tanpa gangguan padding tabel
        $container = new Table([
            'unit' => TblWidth::PERCENT,
            'width' => 100 * 50,
            'borderSize' => 0,
            'borderColor' => 'FFFFFF',
            'cellMargin' => 0,
            'cellMarginTop' => 0,
            'cellMarginBottom' => 0,
            'cellMarginLeft' => 0,
            'cellMarginRight' => 0
        ]);

        $lines = explode("\n", $markdownText);
        $isTableMode = false;
        $tableBuffer = [];
        $prevLineType = 'start'; // Melacak tipe baris sebelumnya untuk logika spacing

        foreach ($lines as $line) {
            $trimmed = trim($line);

            // --- Deteksi Tabel Markdown ---
            $isTableLine = (strpos($trimmed, '|') === 0 && substr($trimmed, -1) === '|');

            if ($isTableLine) {
                $isTableMode = true;
                $tableBuffer[] = $trimmed;
                $prevLineType = 'table';
            } else {
                if ($isTableMode && !empty($tableBuffer)) {
                    self::addMarkdownTableToContainer($container, $tableBuffer);
                    $tableBuffer = [];
                    $isTableMode = false;
                }

                if (!empty($trimmed)) {
                    // --- Proses Teks / List / Header ---
                    $currentType = self::detectLineType($trimmed);

                    self::addTextLineToContainer($container, $line, $currentType, $prevLineType);

                    $prevLineType = $currentType;
                } else {
                    // --- Proses Baris Kosong (Empty Line) ---
                    // JANGAN buat baris normal. Buat baris mikro (2pt).
                    // Ini mencegah jarak menjadi "Double Spacing".
                    $row = $container->addRow();
                    $cell = $row->addCell();
                    $cell->addTextBreak(1, ['size' => 2]);
                    $prevLineType = 'empty';
                }
            }
        }

        if (!empty($tableBuffer)) {
            self::addMarkdownTableToContainer($container, $tableBuffer);
        }

        return $container;
    }

    private static function addTextLineToContainer(Table $container, $line, $type, $prevType)
    {
        // Skip Horizontal Rule (---) agar dokumen bersih
        if ($line === '---' || $line === '***') {
            // Opsional: Beri sedikit jeda tak terlihat
            $container->addRow()->addCell()->addTextBreak(1, ['size' => 4]);
            return;
        }

        $row = $container->addRow();
        $cell = $row->addCell();

        // --- LOGIKA "SMART SPACING" (Satuan Twips: 20 twips = 1 point) ---

        $spaceBefore = 0;
        $spaceAfter = 120; // Default: 6pt (Jarak standar paragraf nyaman)

        // A. Jika Header (## Judul)
        if ($type === 'header') {
            // Beri jarak besar di atasnya (12pt) KECUALI ini baris pertama dokumen
            $spaceBefore = ($prevType === 'start') ? 0 : 240;
            $spaceAfter = 120; // 6pt setelah header
        }

        // B. Jika List Item (1. atau *)
        else if ($type === 'list') {
            $spaceBefore = 0;
            $spaceAfter = 60; // 3pt (List item harus lebih rapat dari paragraf biasa)

            // Jika sebelumnya BUKAN list (misal paragraf biasa), beri jarak ekstra di atas list pertama
            if ($prevType !== 'list') {
                $spaceBefore = 120; // 6pt pemisah antara teks intro dan list
            }
        }

        // C. Jika Paragraf Teks Biasa
        else {
            // Jika sebelumnya adalah Header, kurangi sedikit spaceBefore agar menempel wajar
            if ($prevType === 'header') {
                $spaceBefore = 0;
            }
        }

        // D. Alignment Logic
        $alignment = Jc::BOTH; // Default Justified for Text & List
        if ($type === 'header') {
            $alignment = Jc::START; // Title/Header Left Aligned
        }

        // Terapkan Style Paragraf
        $paragraphStyle = ['spaceBefore' => $spaceBefore, 'spaceAfter' => $spaceAfter, 'alignment' => $alignment];
        $textRun = $cell->addTextRun($paragraphStyle);

        // --- Parsing Konten ---

        // 1. Header Logic
        if ($type === 'header') {
            preg_match('/^(#{1,6})\s+(.*)$/', $line, $matches);
            // Style Header: Arial, Biru, Bold, 12pt
            $textRun->addText($matches[2], ['bold' => true, 'size' => 12, 'color' => '2E74B5', 'name' => 'Arial']);
            return;
        }

        // 2. List Logic
        if ($type === 'list') {
            // Bullet List
            if (preg_match('/^[\*\-]\s+(.*)$/', $line, $matches)) {
                $textRun->addText("  •  ", ['name' => 'Arial']);
                self::parseInlineStyles($textRun, $matches[1]);
            }
            // Numbered List
            elseif (preg_match('/^(\d+\.)\s+(.*)$/', $line, $matches)) {
                $textRun->addText("  " . $matches[1] . " ", ['name' => 'Arial']);
                self::parseInlineStyles($textRun, $matches[2]);
            }
            return;
        }

        // 3. Normal Text Logic
        self::parseInlineStyles($textRun, $line);
    }

    // Helper sederhana deteksi tipe baris
    private static function detectLineType($line)
    {
        if (preg_match('/^(#{1,6})\s+/', $line)) return 'header';
        if (preg_match('/^[\*\-]\s+/', $line)) return 'list';
        if (preg_match('/^\d+\.\s+/', $line)) return 'list';
        return 'text';
    }

    private static function addMarkdownTableToContainer(Table $container, array $lines)
    {
        $row = $container->addRow();
        $cell = $row->addCell();

        // Spacer mikro sebelum tabel
        $cell->addTextBreak(1, ['size' => 4]);

        $styleTable = [
            'borderSize' => 6,
            'borderColor' => '999999',
            'cellMargin' => 80, // Padding DALAM sel tabel (biar teks tidak nempel garis)
            'unit' => TblWidth::PERCENT,
            'width' => 100 * 50
        ];

        $innerTable = $cell->addTable($styleTable);
        $isHeader = true;

        foreach ($lines as $line) {
            if (preg_match('/^\|[\s\-:|]+\|$/', $line)) {
                $isHeader = false;
                continue;
            }

            $innerRow = $innerTable->addRow();
            $content = trim($line, '|');
            $columns = explode('|', $content);

            foreach ($columns as $colText) {
                $colText = trim($colText);
                $cellStyle = $isHeader ? ['bgColor' => 'E0E0E0'] : [];
                // Font dalam tabel kita set Arial 10pt
                $baseFontStyle = $isHeader ? ['bold' => true, 'size' => 10, 'name' => 'Arial'] : ['size' => 10, 'name' => 'Arial'];

                $innerCell = $innerRow->addCell(2000, $cellStyle);

                // PENTING: spaceAfter 0 di dalam tabel agar sel tidak menjadi terlalu tinggi
                $innerRun = $innerCell->addTextRun(['spaceAfter' => 0]);

                self::parseInlineStyles($innerRun, $colText, $baseFontStyle);
            }
        }

        // Spacer mikro setelah tabel
        $container->addRow()->addCell()->addTextBreak(1, ['size' => 6]);
    }

    private static function parseInlineStyles(TextRun $textRun, $text, $baseStyle = ['name' => 'Arial', 'size' => 10])
    {
        $parts = preg_split('/(\*\*.*?\*\*)/', $text, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);

        foreach ($parts as $part) {
            if (preg_match('/^\*\*(.*?)\*\*$/', $part, $matches)) {
                $style = array_merge($baseStyle, ['bold' => true]);
                $textRun->addText($matches[1], $style);
            } else {
                self::parseItalic($textRun, $part, $baseStyle);
            }
        }
    }

    private static function parseItalic(TextRun $textRun, $text, $baseStyle)
    {
        $parts = preg_split('/(\*.*?\*)/', $text, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);

        foreach ($parts as $part) {
            if (preg_match('/^\*(.*?)\*$/', $part, $matches)) {
                $style = array_merge($baseStyle, ['italic' => true]);
                $textRun->addText($matches[1], $style);
            } else {
                $textRun->addText($part, $baseStyle);
            }
        }
    }
}
