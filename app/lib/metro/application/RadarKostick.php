<?php

class RadarKostick
{
    private $labels;
    private $values;
    private $maxValue;

    public function __construct($labels, $values, $maxValue)
    {
        $this->labels = $labels;
        $this->values = $values;
        $this->maxValue = $maxValue;
    }

    public function render($width = 600, $height = 600, $padding = 100)
    {
        $cx = $width / 2 + $padding;
        $cy = $height / 2 + $padding;
        $points = count($this->labels);
        $angleStep = 2 * M_PI / $points;
        $canvasWidth = $width + 2 * $padding;
        $canvasHeight = $height + 2 * $padding;

        $svg = '<svg width="' . $canvasWidth . '" height="' . $canvasHeight . '" xmlns="http://www.w3.org/2000/svg">';

        // Draw grid and numbering
        for ($i = 0; $i <= $this->maxValue; $i++) {
            $r = ($width / 2) * ($i / $this->maxValue);
            $svg .= '<circle cx="' . $cx . '" cy="' . $cy . '" r="' . $r . '" fill="none" stroke="gray" />';
            if ($i > 0) {
                $svg .= '<text x="' . $cx . '" y="' . ($cy - $r - 5) . '" fill="black" text-anchor="middle" dominant-baseline="middle">' . $i . '</text>';
            }
        }

        // Draw axes
        for ($i = 0; $i < $points; $i++) {
            $angle = $i * $angleStep - M_PI / 2; // Adjust angle so that N is at the top center
            $x = $cx + ($width / 2) * cos($angle);
            $y = $cy + ($height / 2) * sin($angle);
            $svg .= '<line x1="' . $cx . '" y1="' . $cy . '" x2="' . $x . '" y2="' . $y . '" stroke="gray" />';
            $labelX = $cx + ($width / 2 + 30) * cos($angle); // Adjusted for more spacing
            $labelY = $cy + ($height / 2 + 30) * sin($angle); // Adjusted for more spacing
            $svg .= '<text x="' . $labelX . '" y="' . $labelY . '" font-weight="bold" font-size="smaller" fill="black" text-anchor="middle" dominant-baseline="middle">' . $this->labels[$i] . '</text>';
        }

        // Draw the data polygon
        $pointsData = [];
        for ($i = 0; $i < $points; $i++) {
            $angle = $i * $angleStep - M_PI / 2; // Adjust angle so that N is at the top center
            $value = $this->values[$i] / $this->maxValue;
            $x = $cx + ($width / 2) * $value * cos($angle);
            $y = $cy + ($height / 2) * $value * sin($angle);
            $pointsData[] = $x . ',' . $y;
        }
        $svg .= '<polygon points="' . implode(' ', $pointsData) . '" fill="lightcyan" fill-opacity="0.4" stroke-width="2" stroke="blue" />';

        $svg .= '</svg>';

        return $svg;
    }
}

?>
