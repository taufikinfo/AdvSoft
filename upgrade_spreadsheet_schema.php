<?php
/** One-shot schema alignment for live databases (idempotent). */

require_once __DIR__ . '/init.php';

use Adianti\Database\TTransaction;

TTransaction::open('advsoft');
$conn = TTransaction::get();

function columnExists(PDO $conn, string $table, string $column): bool {
    $stmt = $conn->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?");
    $stmt->execute([$table, $column]);
    return (bool) $stmt->fetchColumn();
}

function indexExists(PDO $conn, string $table, string $index): bool {
    $stmt = $conn->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?");
    $stmt->execute([$table, $index]);
    return (bool) $stmt->fetchColumn();
}

function tableExists(PDO $conn, string $table): bool {
    $stmt = $conn->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?");
    $stmt->execute([$table]);
    return (bool) $stmt->fetchColumn();
}

// 1. spreadsheet_operations: sequence -> revision + applied_at
if (tableExists($conn, 'spreadsheet_operations')) {
    if (!columnExists($conn, 'spreadsheet_operations', 'revision')) {
        if (columnExists($conn, 'spreadsheet_operations', 'sequence')) {
            $conn->exec("ALTER TABLE spreadsheet_operations CHANGE `sequence` `revision` BIGINT NOT NULL DEFAULT '0'");
            echo "Renamed spreadsheet_operations.sequence -> revision\n";
        } else {
            $conn->exec("ALTER TABLE spreadsheet_operations ADD COLUMN `revision` BIGINT NOT NULL DEFAULT '0'");
            echo "Added spreadsheet_operations.revision\n";
        }
    }
    if (!columnExists($conn, 'spreadsheet_operations', 'applied_at')) {
        $conn->exec("ALTER TABLE spreadsheet_operations ADD COLUMN `applied_at` DATETIME NULL");
        echo "Added spreadsheet_operations.applied_at\n";
    }
    $idx = 'spreadsheet_operations_spreadsheet_id_revision_index';
    if (!indexExists($conn, 'spreadsheet_operations', $idx)) {
        $conn->exec("ALTER TABLE spreadsheet_operations ADD INDEX `{$idx}` (`spreadsheet_id`, `revision`)");
        echo "Added index {$idx}\n";
    }
}

// 2. spreadsheet_collaborations (plural) -> spreadsheet_collaboration (singular)
if (tableExists($conn, 'spreadsheet_collaborations') && !tableExists($conn, 'spreadsheet_collaboration')) {
    $conn->exec("RENAME TABLE `spreadsheet_collaborations` TO `spreadsheet_collaboration`");
    echo "Renamed spreadsheet_collaborations -> spreadsheet_collaboration\n";
}

TTransaction::close();
echo "Schema alignment done.\n";
