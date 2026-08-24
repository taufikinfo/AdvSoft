<?php

namespace App\Model\Ir;

use App\Model\BaseModel;

class IrSequence extends BaseModel
{
    const TABLENAME  = 'ir_sequence';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';

    public function next(array $context = []): string
    {
        $prefix = $this->prefix ?: '';
        $suffix = $this->suffix ?: '';
        $num    = (int) ($this->number_next ?: 1);
        $pad    = (int) ($this->padding ?: 4);
        $inc    = (int) ($this->number_increment ?: 1);

        $now = new \DateTime();
        $prefix = str_replace(['%(year)s', '%(month)s', '%(day)s'], [$now->format('Y'), $now->format('m'), $now->format('d')], $prefix);
        $suffix = str_replace(['%(year)s', '%(month)s', '%(day)s'], [$now->format('Y'), $now->format('m'), $now->format('d')], $suffix);

        $formattedNum = str_pad((string) $num, $pad, '0', STR_PAD_LEFT);
        $this->number_next = $num + $inc;
        $this->save();

        return "{$prefix}{$formattedNum}{$suffix}";
    }

    public static function nextByCode(string $code, array $context = []): ?string
    {
        $seq = self::firstWhere('code', $code);
        return $seq ? $seq->next($context) : null;
    }
}
