<?php
class LuminaSplashChart {
    private $width;
    private $height;
    private $values;

    public function __construct($width = 500, $height = 500, $values = []) {
        $this->width = $width;
        $this->height = $height;
        $this->values = $values;
    }

    public function generateSVG() {
        $centerX = $this->width / 2;
        $centerY = $this->height / 2;
        $maxRadius = min($this->width, $this->height) / 2 * 0.8;

        // Default values if not provided
        $defaultValues = [
            'People Focused' => 0.5,
            'Inspiration Driven' => 0.5,
            'Big Picture Thinking' => 0.5,
            'Outcome Focused' => 0.5,
            'Discipline Driven' => 0.5,
            'Down to Earth' => 0.5,
            'Introverted' => 0.5,
            'Extraverted' => 0.5
        ];

        // Merge default values with provided values
        $values = array_merge($defaultValues, $this->values);

        // Calculate points for the splash shape
        $points = [];
        $labels = array_keys($values);
        $numLabels = count($labels);
        foreach ($values as $index => $value) {
            $value = floatval($value); // Convert string to float
            $angle = (360 / $numLabels) * intval($index) - 90; // Ensure $index is an integer
            $x = $centerX + cos(deg2rad($angle)) * $maxRadius * $value;
            $y = $centerY + sin(deg2rad($angle)) * $maxRadius * $value;
            $points[] = "$x,$y";
        }

        $svgPoints = implode(' ', $points);

        // Create SVG
        $svg = <<<SVG
<svg width="{$this->width}" height="{$this->height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <radialGradient id="gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
            <stop offset="50%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(0,255,0);stop-opacity:1" />
        </radialGradient>
    </defs>
    <polygon points="$svgPoints" fill="url(#gradient)" stroke="black" stroke-width="2" />
    <circle cx="$centerX" cy="$centerY" r="$maxRadius" fill="none" stroke="black" stroke-width="1" />
SVG;

        // Add text labels
        foreach ($labels as $index => $label) {
            $angle = (360 / $numLabels) * intval($index) - 90; // Ensure $index is an integer
            $labelX = $centerX + cos(deg2rad($angle)) * ($maxRadius + 20);
            $labelY = $centerY + sin(deg2rad($angle)) * ($maxRadius + 20);
            $textAnchor = ($angle > 90 && $angle < 270) ? 'end' : 'start';
            $svg .= "<text x='$labelX' y='$labelY' text-anchor='$textAnchor' font-size='12' fill='black' transform='rotate(" . ($angle + 90) . ", $labelX, $labelY)'>$label</text>";
        }

        $svg .= "</svg>";
        return $svg;
    }
}