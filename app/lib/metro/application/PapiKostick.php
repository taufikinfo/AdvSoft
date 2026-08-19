<?php

/**
 * Class PapiKostick
 *
 * This class is responsible for managing scores based on item responses and their corresponding dimensions.
 */
class PapiKostick
{
    private $scores;
    private $itemToDimension;

    /**
     * PapiKostick constructor.
     *
     * Initializes the scores and item-to-dimension mappings.
     */
    public function __construct()
    {
        $this->scores = [
            'G' => 0, 'L' => 0, 'I' => 0, 'T' => 0, 'V' => 0,
            'S' => 0, 'R' => 0, 'D' => 0, 'C' => 0, 'E' => 0,
            'N' => 0, 'A' => 0, 'P' => 0, 'X' => 0, 'B' => 0,
            'O' => 0, 'Z' => 0, 'K' => 0, 'F' => 0, 'W' => 0
        ];

        $this->itemToDimension = [
            'G' => ['up' => [1, 11, 21, 31, 41, 51, 61, 71, 81], 'down' => []],
            'L' => ['up' => [12, 22, 32, 42, 52, 62, 72, 82], 'down' => [81]],
            'I' => ['up' => [23, 33, 43, 53, 63, 73, 83], 'down' => [71, 82]],
            'T' => ['up' => [34, 44, 54, 64, 74, 84], 'down' => [72, 83, 61]],
            'V' => ['up' => [45, 55, 65, 75, 85], 'down' => [73, 84, 51, 62]],
            'S' => ['up' => [56, 66, 76, 86], 'down' => [63, 74, 41, 52, 85]],
            'R' => ['up' => [67, 77, 87], 'down' => [53, 64, 75, 42, 86, 31]],
            'D' => ['up' => [78, 88], 'down' => [65, 87, 21, 54, 32, 43, 76]],
            'C' => ['up' => [89], 'down' => [11, 22, 33, 44, 55, 66, 77, 88]],
            'E' => ['up' => [], 'down' => [1, 12, 23, 34, 45, 56, 67, 78, 89]],
            'N' => ['up' => [], 'down' => [2, 13, 35, 24, 46, 57, 68, 79, 90]],
            'A' => ['up' => [2], 'down' => [3, 25, 14, 36, 47, 58, 69, 80]],
            'P' => ['up' => [3, 13], 'down' => [15, 4, 26, 37, 48, 59, 70]],
            'X' => ['up' => [4, 14, 24], 'down' => [5, 16, 27, 38, 49, 60]],
            'B' => ['up' => [5, 15, 25, 35], 'down' => [6, 17, 28, 39, 50]],
            'O' => ['up' => [6, 16, 26, 36, 46], 'down' => [7, 18, 29, 40]],
            'Z' => ['up' => [7, 17, 27, 37, 47, 57], 'down' => [8, 19, 30]],
            'K' => ['up' => [8, 18, 28, 38, 48, 58, 68], 'down' => [9, 20]],
            'F' => ['up' => [9, 19, 29, 39, 49, 59, 69, 79], 'down' => [10]],
            'W' => ['up' => [10, 20, 30, 40, 50, 60, 70, 80, 90], 'down' => []]
        ];
    }

    /**
     * Add score based on item number and response.
     *
     * @param int $itemNumber The item number.
     * @param int $response The response (1 or 2).
     */
    public function addScore($itemNumber, $response)
    {
        foreach ($this->itemToDimension as $dimension => $directions) {
            if (in_array($itemNumber, $directions['up'])) {
                $this->scores[$dimension] += ($response == 1) ? 1 : 0;
            } elseif (in_array($itemNumber, $directions['down'])) {
                $this->scores[$dimension] += ($response == 2) ? 1 : 0;
            }
        }
    }

    /**
     * Get the score for a specific dimension.
     *
     * @param string $dimension The dimension to get the score for.
     * @return int The score for the specified dimension.
     */
    public function getScore($dimension)
    {
        return $this->scores[$dimension] ?? 0;
    }

    /**
     * Get all scores.
     *
     * @return array An array of all scores.
     */
    public function getAllScores()
    {
        return $this->scores;
    }
}

/*
 * Usage example
$papiKostick = new PapiKostick();

// Example responses
$responses = [
    1, 2, 2, 1, 1, 2, 2, 2, 2, 1, 2, 1, 2, 2, 1, 2, 1, 2, 2, 1,
    1, 2, 2, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2,
    1, 2, 1, 2, 2, 2, 1, 1, 1, 1, 1, 2, 2, 1, 2, 1, 1, 1, 2, 2,
    1, 1, 2, 2, 2, 1, 1, 1, 2, 2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1,
    1, 1, 1, 2, 2, 2, 1, 2, 2, 2
];

// Add scores
foreach ($responses as $index => $response) {
    $itemNumber = $index + 1;
    $papiKostick->addScore($itemNumber, $response);
}

// Get and print all scores
$scores = $papiKostick->getAllScores();
foreach ($scores as $dimension => $score) {
    echo "Dimension $dimension: $score\n";
}
 */

?>