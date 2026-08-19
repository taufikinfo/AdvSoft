<?php

class RadarChart
{
    private $labels;
    private $values;
    private $maxValues;

    public function __construct($labels, $values, $maxValues)
    {
        $this->labels = $labels;
        $this->values = $values;
        $this->maxValues = $maxValues;
    }

    public function render($width = 500, $height = 500, $padding = 50)
    {
        $cx = $width / 2 + $padding;
        $cy = $height / 2 + $padding;
        $levels = max($this->maxValues);
        $points = count($this->labels);
        $angleStep = 2 * M_PI / $points;
        $canvasWidth = $width + 2 * $padding;
        $canvasHeight = $height + 2 * $padding;

        $svg = '<svg width="' . $canvasWidth . '" height="' . $canvasHeight . '" xmlns="http://www.w3.org/2000/svg">';
        $svg .= '<circle cx="' . $cx . '" cy="' . $cy . '" r="' . ($width / 2) . '" fill="lightcyan" stroke="white" stroke-width="2" />';
        $svg .= '<circle cx="' . $cx . '" cy="' . $cy . '" r="' . ($width / 2.5) . '" fill="lightgreen" stroke="white" stroke-width="2" />';
        $svg .= '<circle cx="' . $cx . '" cy="' . $cy . '" r="' . ($width / 4) . '" fill="gold" stroke="white" stroke-width="2" />';
        $svg .= '<circle cx="' . $cx . '" cy="' . $cy . '" r="' . ($width / 8) . '" fill="red" stroke="white" stroke-width="2" />';

        // Adding labels for each colored area
        $svg .= '<text x="' . $cx . '" y="' . ($cy + 5) . '" fill="white" text-anchor="middle" dominant-baseline="middle" transform="rotate(45, ' . $cx . ', ' . $cy . ')">Rendah</text>';
        $svg .= '<text x="' . $cx . '" y="' . ($cy - $width / 8 - 7) . '" fill="black" text-anchor="middle" dominant-baseline="middle" transform="rotate(45, ' . $cx . ', ' . $cy . ')">Rata-rata</text>';
        $svg .= '<text x="' . $cx . '" y="' . ($cy - $width / 4 - 7) . '" fill="black" text-anchor="middle" dominant-baseline="middle" transform="rotate(45, ' . $cx . ', ' . $cy . ')">Diatas Rata-rata</text>';
        $svg .= '<text x="' . $cx . '" y="' . ($cy - $width / 2.5 - 7) . '" fill="black" text-anchor="middle" dominant-baseline="middle" transform="rotate(45, ' . $cx . ', ' . $cy . ')">Tinggi</text>';

        // Draw labels and axes
        for ($i = 0; $i < $points; $i++) {
            $angle = $i * $angleStep;
            $x = $cx + ($width / 2) * cos($angle);
            $y = $cy + ($height / 2) * sin($angle);
            $svg .= '<line x1="' . $cx . '" y1="' . $cy . '" x2="' . $x . '" y2="' . $y . '" stroke="white" />';
            $labelX = $cx + ($width / 2 + 20) * cos($angle);
            $labelY = $cy + ($height / 2 + 20) * sin($angle);
            $svg .= '<text x="' . $labelX . '" y="' . $labelY . '"  font-weight="bold" font-size="smaller" fill="black"  text-anchor="middle" dominant-baseline="middle">' . $this->labels[$i] . '</text>';
        }

        // Draw the data polygon
        $pointsData = [];
        for ($i = 0; $i < $points; $i++) {
            $angle = $i * $angleStep;
            $value = $this->values[$i] / $this->maxValues[$i];
            $x = $cx + ($width / 2) * $value * cos($angle);
            $y = $cy + ($height / 2) * $value * sin($angle);
            $pointsData[] = $x . ',' . $y;

            // Draw purple star at the point
            $svg .= $this->drawStar($x, $y, 5, 10, 5, 'purple');
        }

        $svg .= '<polygon points="' . implode(' ', $pointsData) . '" fill="none" stroke-width="2" stroke="purple" />';
        $svg .= '</svg>';

        return $svg;
    }

    private function drawStar($cx, $cy, $spikes, $outerRadius, $innerRadius, $color)
    {
        $svg = '';
        $step = M_PI / $spikes;
        $path = '';

        for ($i = 0; $i < 2 * $spikes; $i++) {
            $radius = ($i % 2 == 0) ? $outerRadius : $innerRadius;
            $x = $cx + cos($i * $step) * $radius;
            $y = $cy - sin($i * $step) * $radius;
            $path .= ($i == 0) ? 'M' . $x . ',' . $y : 'L' . $x . ',' . $y;
        }

        $path .= 'Z';
        $svg .= '<path d="' . $path . '" fill="' . $color . '" stroke="' . $color . '" stroke-width="1" />';
        return $svg;
    }
}

?>