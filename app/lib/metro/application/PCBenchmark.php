<?php

class PCBenchmark 
{

    private $min_os = ["Windows 10", "Mac OS X", "Ubuntu"];
    private $min_browser = ["Chrome", "Firefox", "Edge"];
    private $min_resolution = ["width" => 1024, "height" => 768];
    private $min_speed_mbps = 5; // Kecepatan minimum dalam Mbps

    private $client_speed_mbps = 0;

    public function getClientOS() {
        $os_platform = "Unknown OS Platform";
        $os_array = [
            '/windows nt 10/i'      => 'Windows 10',
            '/windows nt 6.3/i'     => 'Windows 8.1',
            '/windows nt 6.2/i'     => 'Windows 8',
            '/windows nt 6.1/i'     => 'Windows 7',
            '/windows nt 6.0/i'     => 'Windows Vista',
            '/windows nt 5.1/i'     => 'Windows XP',
            '/windows xp/i'         => 'Windows XP',
            '/macintosh|mac os x/i' => 'Mac OS X',
            '/mac_powerpc/i'        => 'Mac OS 9',
            '/linux/i'              => 'Linux',
            '/ubuntu/i'             => 'Ubuntu',
            '/iphone/i'             => 'iPhone',
            '/ipod/i'               => 'iPod',
            '/ipad/i'               => 'iPad',
            '/android/i'            => 'Android',
            '/blackberry/i'         => 'BlackBerry',
            '/webos/i'              => 'Mobile'
        ];

        foreach ($os_array as $regex => $value) { 
            if (preg_match($regex, $_SERVER['HTTP_USER_AGENT'])) {
                $os_platform = $value;
                break;
            }
        }
        return $os_platform;
    }

    public function getClientBrowser() {
        $browser = "Unknown Browser";
        $browser_array = [
            '/msie/i'      => 'Internet Explorer',
            '/firefox/i'   => 'Firefox',
            '/safari/i'    => 'Safari',
            '/chrome/i'    => 'Chrome',
            '/edge/i'      => 'Edge',
            '/opera/i'     => 'Opera',
            '/netscape/i'  => 'Netscape',
            '/maxthon/i'   => 'Maxthon',
            '/konqueror/i' => 'Konqueror',
            '/mobile/i'    => 'Mobile Browser'
        ];

        foreach ($browser_array as $regex => $value) { 
            if (preg_match($regex, $_SERVER['HTTP_USER_AGENT'])) {
                $browser = $value;
                break;
            }
        }
        return $browser;
    }

    public function getScreenResolution() {
        return "<script type='text/javascript'>
                    document.write(screen.width + 'x' + screen.height);
                </script>";
    }

    public function checkOS() {
        $client_os = $this->getClientOS();
        return in_array($client_os, $this->min_os);
    }

    public function checkBrowser() {
        $client_browser = $this->getClientBrowser();
        return in_array($client_browser, $this->min_browser);
    }

    public function checkResolution() {
        return "<script>
                    document.write(screen.width >= {$this->min_resolution['width']} && screen.height >= {$this->min_resolution['height']} ? 'true' : 'false');
                </script>";
    }

    public function isPCCompatible() {
        $os_check = $this->checkOS();
        $browser_check = $this->checkBrowser();
        // Resolution check will be handled separately
        return ($os_check && $browser_check);
    }

    // Menambahkan metode untuk mengukur dan memproses kecepatan internet
    public function generateSpeedTestScript() {
        return "
            <script type='text/javascript'>
                function measureDownloadSpeed(callback) {
                    var startTime, endTime;
                    var download = new Image();
                    var imageUrl = 'https://ipro.iradatkonsultan.com/app/images/speedtest.jpg?' + new Date().getTime();
                    
                    download.onload = function () {
                        endTime = new Date().getTime();
                        showResults();
                    }

                    download.onerror = function (err, msg) {
                        console.log('Error measuring download speed.');
                        callback(0);
                    }

                    startTime = new Date().getTime();
                    download.src = imageUrl;

                    function showResults() {
                        var duration = (endTime - startTime) / 1000;
                        var bitsLoaded = 1024 * 8; // 1KB
                        var speedBps = (bitsLoaded / duration).toFixed(2);
                        var speedKbps = (speedBps / 1024).toFixed(2);
                        var speedMbps = (speedKbps / 1024).toFixed(2);
                        callback(speedMbps);
                    }
                }

                function sendSpeedToServer(speed) {
                    var xhr = new XMLHttpRequest();
                    xhr.open('POST', 'index.php', true);
                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState == 4 && xhr.status == 200) {
                            // Anda dapat menambahkan tindakan setelah menerima respons dari server
                        }
                    };
                    xhr.send('speed_mbps=' + speed);
                }

                // Mengukur kecepatan dan mengirim ke server
                measureDownloadSpeed(function(speed) {
                    sendSpeedToServer(speed);
                    // Reload halaman setelah mengukur kecepatan
                    window.location.reload();
                });
            </script>
        ";
    }

    public function processSpeedTest() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['speed_mbps'])) {
            $this->client_speed_mbps = floatval($_POST['speed_mbps']);
            // Menyimpan kecepatan dalam sesi
            $_SESSION['client_speed_mbps'] = $this->client_speed_mbps;
        }
    }

    public function checkSpeed() {
        if (isset($_SESSION['client_speed_mbps'])) {
            return $_SESSION['client_speed_mbps'] >= $this->min_speed_mbps;
        }
        return false;
    }

    public function isPCFullyCompatible() {
        return ($this->isPCCompatible() && $this->checkSpeed());
    }

    public function displayResults() {
        $client_os = $this->getClientOS();
        $client_browser = $this->getClientBrowser();
        $client_resolution = $this->getScreenResolution();
        $client_speed = isset($_SESSION['client_speed_mbps']) ? $_SESSION['client_speed_mbps'] : 'Mengukur...';

        if ($this->isPCFullyCompatible()) {
            echo "<div style='color: green;'>PC Anda memenuhi spesifikasi minimum untuk ujian online.</div>";
        } else {
            echo "<div style='color: red;'>PC Anda tidak memenuhi spesifikasi minimum untuk ujian online.</div>";
            echo "<br><strong>Detil:</strong>";
            echo "<br>Sistem Operasi: " . $client_os;
            echo "<br>Browser: " . $client_browser;
            echo "<br>Resolusi Layar: " . $client_resolution;
            echo "<br>Kecepatan Internet: " . ($client_speed !== 'Mengukur...' ? $client_speed . " Mbps" : $client_speed);
        }

        // Tampilkan skrip pengukuran kecepatan jika belum diukur
        if (!isset($_SESSION['client_speed_mbps'])) {
            echo $this->generateSpeedTestScript();
        }
    }
}
