<?php

namespace App\Model\Ir;

use App\Model\BaseModel;

class IrConfigParameter extends BaseModel
{
    const TABLENAME  = 'ir_config_parameter';
    const PRIMARYKEY = 'id';
    const IDPOLICY   = 'serial';

    public static function getParam(string $key, mixed $default = null): mixed
    {
        $param = self::firstWhere('key', $key);
        return $param ? $param->value : $default;
    }

    public static function setParam(string $key, mixed $value): static
    {
        $param = self::firstWhere('key', $key);
        if (!$param) {
            $param = new self;
            $param->key = $key;
        }
        $param->value = (string) $value;
        $param->save();
        return $param;
    }
}
