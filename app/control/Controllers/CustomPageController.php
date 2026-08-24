<?php

namespace App\Control\Controllers;

use App\Advsoft\Core\Http\Request;
use App\Advsoft\Core\Http\JsonResponse;
use Adianti\Database\TTransaction;

/**
 * CustomPageController
 */
class CustomPageController extends Controller
{
    protected function getPdo(): \PDO
    {
        if (!TTransaction::get()) {
            TTransaction::open('advsoft');
        }
        return TTransaction::get();
    }

    public function index(): JsonResponse
    {
        TTransaction::open('advsoft');
        $pdo = TTransaction::get();
        $driver = $pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);
        $pkDef = ($driver === 'mysql') ? 'id INT AUTO_INCREMENT PRIMARY KEY' : 'id INTEGER PRIMARY KEY AUTOINCREMENT';
        $pdo->exec("CREATE TABLE IF NOT EXISTS custom_page_items (
            {$pkDef},
            name VARCHAR(255),
            description TEXT,
            status VARCHAR(50) DEFAULT 'active',
            created_at DATETIME,
            updated_at DATETIME
        )");

        $stmt = $pdo->query("SELECT * FROM custom_page_items ORDER BY id DESC");
        $items = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $active = 0;
        $pending = 0;
        $inactive = 0;
        foreach ($items as $item) {
            $st = $item['status'] ?? 'active';
            if ($st === 'active') $active++;
            elseif ($st === 'pending') $pending++;
            elseif ($st === 'inactive') $inactive++;
        }
        TTransaction::close();

        return new JsonResponse([
            'items' => $items,
            'stats' => [
                'total'    => count($items),
                'active'   => $active,
                'pending'  => $pending,
                'inactive' => $inactive,
            ],
        ]);
    }

    public function create(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required',
        ]);

        TTransaction::open('advsoft');
        $pdo = TTransaction::get();
        $stmt = $pdo->prepare("INSERT INTO custom_page_items (name, description, status, created_at, updated_at) VALUES (:name, :description, :status, :created_at, :updated_at)");
        $now = date('Y-m-d H:i:s');
        $stmt->execute([
            ':name'        => trim($data['name']),
            ':description' => $request->input('description'),
            ':status'      => $request->input('status', 'active'),
            ':created_at'  => $now,
            ':updated_at'  => $now,
        ]);

        $id = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT * FROM custom_page_items WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $item = $stmt->fetch(\PDO::FETCH_ASSOC);
        TTransaction::close();

        return new JsonResponse([
            'success' => true,
            'item'    => $item,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id'   => 'required',
            'name' => 'required',
        ]);

        TTransaction::open('advsoft');
        $pdo = TTransaction::get();
        $stmt = $pdo->prepare("UPDATE custom_page_items SET name = :name, description = :description, status = :status, updated_at = :updated_at WHERE id = :id");
        $now = date('Y-m-d H:i:s');
        $stmt->execute([
            ':id'          => $data['id'],
            ':name'        => trim($data['name']),
            ':description' => $request->input('description'),
            ':status'      => $request->input('status', 'active'),
            ':updated_at'  => $now,
        ]);

        $stmt = $pdo->prepare("SELECT * FROM custom_page_items WHERE id = :id");
        $stmt->execute([':id' => $data['id']]);
        $item = $stmt->fetch(\PDO::FETCH_ASSOC);
        TTransaction::close();

        return new JsonResponse([
            'success' => true,
            'item'    => $item,
        ]);
    }

    public function delete(Request $request): JsonResponse
    {
        $id = $request->input('id');
        if (!$id) {
            return new JsonResponse(['error' => 'ID wajib diisi.'], 422);
        }

        TTransaction::open('advsoft');
        $pdo = TTransaction::get();
        $stmt = $pdo->prepare("DELETE FROM custom_page_items WHERE id = :id");
        $stmt->execute([':id' => $id]);
        TTransaction::close();

        return new JsonResponse(['success' => true]);
    }
}
