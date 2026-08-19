<?php

class KHtml
{
    static $selfClosedTags = array(
        "area",
        "base",
        "br",
        "col",
        "command",
        "embed",
        "hr",
        "img",
        "input",
        "keygen",
        "link",
        "menuitem",
        "meta",
        "param",
        "source",
        "track",
        "wbr"
    );

    public    $onclick;
    protected $type = 'div';
    protected $attributes = array();
    protected $content = array();
    protected $format = true; // Added property

    public static function __callStatic($method, $args)
    {
        $object = new self();
        $object->type = $method;
        $object->content = $args;

        return $object;
    }

    public function dontFormat()
    {
        $this->format = false;
        return $this;
    }

    public function __call($method, $args)
    {
        $value = new KArgument($args[0] ?? '');
        if (count($args) > 1) {
            $value->quotation = $args[1];
        }
        $this->attributes[$method] = $value;
        return $this;
    }

    public function schema(array $components)
    {
        $this->content = $components;
        return $this;
    }

    public function show()
    {
        echo $this->__toString();
        return $this;
    }

    public function __toString()
    {
        $str = "";

        if (in_array($this->type, KHtml::$selfClosedTags)) {
            $str .= $this->selfClosing();
        } else {
            $str .= $this->opening();
            $str .= $this->_content();
            $str .= $this->closing();
        }

        return $str;
    }

    public function selfClosing()
    {
        $str = $this->startOpening();
        $str .= "/>";
        return $str;
    }

    private function startOpening()
    {
        $str = "<" . $this->type;
        foreach ($this->attributes as $key => $value) {
            $val = $value->value;
            if ($value->quotation) {
                $str .= " " . $key . "=\"" . $val . "\"";
            } else {
                $str .= " " . $key . "=" . $val;
            }
        }
        return $str;
    }

    public function opening()
    {
        $str = $this->startOpening();
        $str .= ">";
        return $str;
    }

    public function _content()
    {
        $str = "";
        foreach ($this->content as $element) {
            if (is_object($element)) {
                ob_start();
                if (method_exists($element, 'show')) {
                    $element->show();
                } elseif (method_exists($element, 'render')) {
                    echo $element->render();
                }
                $a = ob_get_clean();
            } else {
                $a = (string)$element;
            }
            $lines = explode("\n", $a);
            foreach ($lines as $line) {
                if (ctype_space($line)) {
                    continue;
                }
                if ($this->format) {
                    $str .= "\n\t";
                }
                $str .= $line;
            }
        }
        return $str;
    }

    public function closing()
    {
        $str = "";
        if (count($this->content) > 0) {
            if ($this->format) {
                $str .= "\n";
            }
        }
        $str .= "</" . $this->type . ">\n";
        return $str;
    }

    public function showSelfClosing()
    {
        echo $this->selfClosing();
    }

    public function showOpening()
    {
        echo $this->opening();
    }

    public function showClosing()
    {
        echo $this->closing();
    }

    public function showContent()
    {
        echo $this->_content();
    }
}

?>
