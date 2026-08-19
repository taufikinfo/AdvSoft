<?php

class TDiagram
{
    private $circleData;

    public function __construct($circleData)
    {
        $this->circleData = $circleData;
    }

    public function displayCanvas()
    {
        $output =
            '<html>
                <head>
                    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        @keyframes pulse {
                            0% { transform: scale(1); }
                            50% { transform: scale(1.05); }
                            100% { transform: scale(1); }
                        }
                        .circle-container {
                            display: grid;
                            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                            gap: 15px;
                            padding: 20px;
                            justify-items: center;
                        }
                        .circle {
                            width: 80px;
                            height: 80px;
                            border-radius: 50%;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            text-align: center;
                            font-family: "Roboto", sans-serif;
                            font-size: 12px;
                            font-weight: 700;
                            color: white;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                            transition: transform 0.2s ease, box-shadow 0.2s ease;
                            cursor: pointer;
                            animation: pulse 2s infinite;
                            position: relative;
                            border: 3px solid transparent;
                        }
                        .circle.online {
                            border: 3px solid #00FF00; /* Border hijau untuk Online */
                        }
                        .circle.offline {
                            border: 3px solid #FF0000; /* Border merah untuk Offline */
                        }
                        .circle.neutral {
                            border: 3px solid #CCCCCC; /* Border abu-abu untuk Neutral */
                        }
                        .circle:hover {
                            transform: scale(1.1);
                            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
                        }
                        .circle-icon {
                            font-size: 16px;
                            margin-bottom: 5px;
                        }
                        .circle.gray {
                            background: linear-gradient(135deg, #6B7280, #4B5563);
                        }
                        .circle.cyan {
                            background: linear-gradient(135deg, #06B6D4, #0891B2);
                        }
                        .circle.purple {
                            background: linear-gradient(135deg, #5B0888, #4C1D95);
                        }
                        .circle.pink {
                            background: linear-gradient(135deg, #EC4899, #DB2777);
                        }
                        .circle.orange {
                            background: linear-gradient(135deg, #E7B10A, #D97706);
                        }
                        .circle.green {
                            background: linear-gradient(135deg, #005B41, #064E3B);
                        }
                        .circle.blue {
                            background: linear-gradient(135deg, #3B82F6, #2563EB);
                        }
                        .circle.red {
                            background: linear-gradient(135deg, #C70039, #B91C1C);
                        }
                    </style>
                </head>
                <body>
                    <div class="circle-container">';

        $statusIcons = [
            'gray' => '▶️', // Play icon for Start
            'cyan' => '💻', // Laptop icon for Device Check
            'purple' => '📜', // Scroll icon for EULA
            'pink' => '📸', // Camera icon for Face Register
            'orange' => '📋', // Clipboard icon for Pre-Requisite
            'green' => '✍️', // Writing icon for Exam
            'blue' => '✅', // Checkmark icon for Complete
            'red' => '⏳' // Hourglass icon for Not Started
        ];

        foreach ($this->circleData as $label => $value) {
            $class = $value;
            $icon = $statusIcons[$class] ?? '❓';

            // Deteksi status koneksi dari label
            $connectionStatus = 'neutral';
            $cleanLabel = $label;
            if ($class === 'green') { // Hanya untuk status 'exam'
                if (strpos($label, '<span style="color: green;">●</span>') !== false) {
                    $connectionStatus = 'online';
                    $cleanLabel = str_replace('<span style="color: green;">●</span>', '', $label);
                } elseif (strpos($label, '<span style="color: red;">●</span>') !== false) {
                    $connectionStatus = 'offline';
                    $cleanLabel = str_replace('<span style="color: red;">●</span>', '', $label);
                }
            }

            // Tambahkan kelas online/offline/neutral ke lingkaran
            $output .= '<div class="circle ' . $class . ' ' . $connectionStatus . '"><span class="circle-icon">' . $icon . '</span>' . htmlspecialchars(trim($cleanLabel)) . '</div>';
        }

        $output .= '</div></body></html>';
        return $output;
    }
}