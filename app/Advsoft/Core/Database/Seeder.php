<?php

namespace App\Advsoft\Core\Database;

use Adianti\Database\TTransaction;

/**
 * Seeder
 *
 * @version    2.0.0
 * @package    Advsoft
 * @author     Taufik
 * @author     AdvSoft Team
 * @copyright  Copyright (c) 2026 AdvSoft Technologies
 * @license    https://opensource.org/licenses/MIT MIT License
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
