<?php

class RadarSplashChart {
    private $width;
    private $height;
    private $dataPoints;
    private $labels;

    public function __construct($width, $height, $dataPoints, $labels) {
        $this->width = $width;
        $this->height = $height;
        $this->dataPoints = $dataPoints;
        $this->labels = $labels;
    }

    private function getPolygonPoints($radius, $centerX, $centerY) {
        $points = [];
        $numPoints = count($this->labels);
        for ($i = 0; $i < $numPoints; $i++) {
            $angle = (2 * M_PI / $numPoints) * $i;
            $x = $centerX + $radius * $this->dataPoints[$i] * cos($angle);
            $y = $centerY + $radius * $this->dataPoints[$i] * sin($angle);
            $points[] = "$x,$y";
        }
        return implode(" ", $points);
    }

    public function generateSVG() {
        $centerX = $this->width / 2;
        $centerY = $this->height / 2;
        $radius = min($centerX, $centerY) * 0.6;
        $polygonPoints = $this->getPolygonPoints($radius, $centerX, $centerY);

        $svg = "<svg width='{$this->width}' height='{$this->height}' xmlns='http://www.w3.org/2000/svg'>";
        $svg .= $this->generateColorSpectrum($centerX, $centerY, $radius);
        $svg .= $this->generateSplashShape($centerX, $centerY, $radius);
        $svg .= "<polygon points='$polygonPoints' fill='rgba(255, 255, 255, 0.7)' stroke='black' stroke-width='2' />";
        $svg .= $this->generateLabels($centerX, $centerY, $radius);
        $svg .= $this->generateGridLines($centerX, $centerY, $radius);
        $svg .= "</svg>";

        return $svg;
    }

    private function generateColorSpectrum($centerX, $centerY, $radius) {
        $spectrum = "";
        $colors = [
            'blue', 'green', 'yellow', 'orange', 'red'
        ];
        $numColors = count($colors);
        for ($i = 0; $i < $numColors; $i++) {
            $angleStart = (360 / $numColors) * $i;
            $angleEnd = (360 / $numColors) * ($i + 1);
            $spectrum .= "
                <path d='M $centerX $centerY 
                L " . ($centerX + $radius * cos(deg2rad($angleStart))) . " " . ($centerY + $radius * sin(deg2rad($angleStart))) . " 
                A $radius $radius 0 0 1 " . ($centerX + $radius * cos(deg2rad($angleEnd))) . " " . ($centerY + $radius * sin(deg2rad($angleEnd))) . " 
                Z' fill='{$colors[$i % $numColors]}' opacity='0.5' />";
        }
        return $spectrum;
    }

    private function generateSplashShape($centerX, $centerY, $radius) {
        // This is a simplified representation of a splash shape, adjust as needed
        $splashPoints = [
            [$centerX, $centerY - $radius * 0.7],
            [$centerX + $radius * 0.5, $centerY - $radius * 0.4],
            [$centerX + $radius * 0.6, $centerY + $radius * 0.1],
            [$centerX + $radius * 0.2, $centerY + $radius * 0.6],
            [$centerX - $radius * 0.3, $centerY + $radius * 0.6],
            [$centerX - $radius * 0.6, $centerY + $radius * 0.1],
            [$centerX - $radius * 0.5, $centerY - $radius * 0.4],
        ];
        $splashPath = "M {$splashPoints[0][0]},{$splashPoints[0][1]} ";
        for ($i = 1; $i < count($splashPoints); $i++) {
            $splashPath .= "L {$splashPoints[$i][0]},{$splashPoints[$i][1]} ";
        }
        $splashPath .= "Z";

        return "<path d='$splashPath' fill='url(#splashGradient)' />";
    }

    private function generateLabels($centerX, $centerY, $radius) {
        $labelsSVG = "";
        $numPoints = count($this->labels);
        $labelRadius = $radius + 30;
        for ($i = 0; $i < $numPoints; $i++) {
            $angle = (2 * M_PI / $numPoints) * $i;
            $x = $centerX + $labelRadius * cos($angle);
            $y = $centerY + $labelRadius * sin($angle);
            $alignment = $x < $centerX ? "end" : "start";
            $rotation = ($angle * 180 / M_PI);
            if ($angle > M_PI / 2 && $angle < 3 * M_PI / 2) {
                $rotation += 180;
            }
            $labelsSVG .= "<text x='$x' y='$y' text-anchor='$alignment' transform='rotate($rotation $x,$y)' dominant-baseline='middle'>{$this->labels[$i]}</text>";
        }
        return $labelsSVG;
    }

    private function generateGridLines($centerX, $centerY, $radius) {
        $gridLinesSVG = "";
        $numPoints = count($this->labels);
        for ($i = 0; $i < $numPoints; $i++) {
            $angle = (2 * M_PI / $numPoints) * $i;
            $x = $centerX + $radius * cos($angle);
            $y = $centerY + $radius * sin($angle);
            $gridLinesSVG .= "<line x1='$centerX' y1='$centerY' x2='$x' y2='$y' stroke='gray' stroke-dasharray='5,5' />";
        }
        return $gridLinesSVG;
    }
}