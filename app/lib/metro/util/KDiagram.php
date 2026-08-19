<?php

class KDiagram
{

    private $circleData;

    public function __construct($circleData)
    {
        $this->circleData = $circleData;
    }

    public function displayCanvas()
    {
        $output = '<html>
                <head>
                    <style>
                         @keyframes blink {
                            100% {
                                background-color: lightgreen; /* Change to light color at 50% of the animation */
                            }
                        }
                        .circle-container {
                            display: flex;
                            flex-wrap: wrap;
                        }
                        .circle {
                            width: 70px;
                            height: 70px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 20px;
                            text-align: center;                            
                            line-height: 1.4; 
                            font-weight: bold;
                            color: white;
                            /*animation: blink 1s infinite;*/ 
                        }
                        .circle.red {
                            background-color: #C70039;
                        }
                        .circle.orange {
                            background-color: #5B0888;
                        }
                        .circle.yellow {
                            background-color: #E7B10A;
                        }
                        .circle.green {
                            background-color: #005B41;
                        }
                        .circle.blue {
                            background-color: blue;
                        }
                    </style>
                </head>
                <body>
                    <div class="circle-container">';

        $circleCount = 0;

        foreach ($this->circleData as $label => $value) {
            $class = $value;
            $output .= '<div class="circle ' . $class . ' " data-bs-toggle="popover" data-trigger="hover" title="' . $label . '" data-content="Value: ' . $value . '">' . $label . '</div>';

            $circleCount++;

            // Start a new row after every 10 circles
            if ($circleCount % 10 == 0) {
                $output .= '</div><div class="circle-container">';
            }
        }

        $output .= '</div></body></html>';
        return $output;
    }

}
