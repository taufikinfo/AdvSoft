<?php

namespace App\Odoo\Core\Database;

use Adianti\Database\TTransaction;

/**
 * Base Seeder for Pure Adianti Framework.
 */
abstract class Seeder
{
    abstract public function run(): void;

    public function call(string $seederClass): void
    {
        if (class_exists($seederClass)) {
            $seeder = new $seederClass();
            $seeder->run();
        }
    }

    protected function db(): \PDO
    {
        TTransaction::open('advsoft');
        return TTransaction::get();
    }
}
