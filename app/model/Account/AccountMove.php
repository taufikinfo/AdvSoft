<?php

namespace App\Model\Account;

use App\Model\BaseModel;
use Adianti\Database\TTransaction;

class AccountMove extends BaseModel
{
    const TABLENAME  = 'account_move';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';

    public function lines()
    {
        return AccountMoveLine::where('move_id', $this->id);
    }

    /**
     * Post journal entry (validate balance, set state to posted)
     */
    public function actionPost(): array
    {
        self::openTransaction();

        if ($this->state === 'posted') {
            return ['error' => 'Entry ini sudah diposting.'];
        }

        $lines = AccountMoveLine::where('move_id', $this->id)->get();
        if ($lines->isEmpty()) {
            return ['error' => 'Entry harus memiliki minimal 2 baris jurnal.'];
        }

        $totalDebit = 0.0;
        $totalCredit = 0.0;

        foreach ($lines as $line) {
            $totalDebit += (float) ($line->debit ?? 0);
            $totalCredit += (float) ($line->credit ?? 0);
        }

        // Validate balance if entry is standard
        if (abs($totalDebit - $totalCredit) > 0.01) {
            $diff = round(abs($totalDebit - $totalCredit), 2);
            return ['error' => "Entry tidak seimbang! Total Debit: {$totalDebit}, Total Credit: {$totalCredit} (Selisih: {$diff})."];
        }

        // Generate sequence if name is draft or empty
        if (empty($this->name) || $this->name === '/' || str_starts_with($this->name, 'DRAFT')) {
            $prefix = strtoupper($this->move_type ?? 'ENTRY');
            $yearMonth = date('Y/m');
            $this->name = "{$prefix}/{$yearMonth}/" . str_pad($this->id, 4, '0', STR_PAD_LEFT);
        }

        $this->state = 'posted';
        $this->amount_total = $totalDebit;
        $this->save();

        return ['message' => "Entry '{$this->name}' berhasil diposting."];
    }

    /**
     * Reset entry to draft state
     */
    public function actionDraft(): array
    {
        self::openTransaction();
        $this->state = 'draft';
        $this->save();

        return ['message' => "Entry '{$this->name}' berhasil diubah ke draft."];
    }

    /**
     * Cancel journal entry
     */
    public function actionCancel(): array
    {
        self::openTransaction();
        $this->state = 'cancel';
        $this->save();

        return ['message' => "Entry '{$this->name}' telah dibatalkan."];
    }
}
