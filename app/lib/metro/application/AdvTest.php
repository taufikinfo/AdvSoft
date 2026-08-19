<?php

/**
 * Class AdvTest
 *
 * This class is responsible for calculating various scores and levels based on responses.
 */
class AdvTest
{
    private $responses;
    private $ranges;

    /**
     * AdvTest constructor.
     *
     * @param array $responses Array of responses.
     * @param array $ranges Array of ranges, default is [1, 5].
     */
    public function __construct($responses, $ranges = [1, 5])
    {
        $this->responses = $responses;
        $this->ranges = $ranges;
    }

    /**
     * Calculate category scores.
     *
     * @param array $categories Array of categories with their respective questions.
     * @return array Array of calculated scores for each category.
     */
    private function calculateCategoryScores($categories)
    {
        $scores = [];
        foreach ($categories as $key => $questions) {
            $score = 0;
            foreach ($questions as $question) {
                //$score += $this->responses[$question - 1] * 2;
                $score += (isset($this->responses[$question - 1]) ? $this->responses[$question - 1] : 0) * 2;

            }
            $scores[$key] = $score;
        }
        return $scores;
    }

    /**
     * Calculate high scores based on thresholds.
     *
     * @param int $score The score to evaluate.
     * @param array $thresholds Array of thresholds and their corresponding values.
     * @return mixed The calculated high score or an empty string if score is 0.
     */
    private function calculateHighScores($score, $thresholds)
    {
        if ($score == 0) {
            return "";
        }

        foreach ($thresholds as $threshold => $value) {
            if ($score > $threshold) {
                return $value;
            }
        }

        return 1;
    }

    /**
     * Sum two category scores.
     *
     * @param int $category1 Score of the first category.
     * @param int $category2 Score of the second category.
     * @return int The sum of the two category scores.
     */
    private function sumCategoryScores($category1, $category2)
    {
        return $category1 + $category2;
    }

    /**
     * Calculate level based on sum score and thresholds.
     *
     * @param int $sumScore The sum score to evaluate.
     * @param array $thresholds Array of thresholds and their corresponding values.
     * @return mixed The calculated level or an empty string if sum score is 0.
     */
    private function calculateLevel($sumScore, $thresholds)
    {
        if ($sumScore == 0) {
            return "";
        }

        foreach ($thresholds as $threshold => $value) {
            if ($sumScore > $threshold) {
                return $value;
            }
        }

        return 1;
    }

    /**
     * Count the number of levels that match the target level.
     *
     * @param array $levels Array of levels.
     * @param int $targetLevel The target level to count.
     * @return int The count of levels that match the target level.
     */
    private function countLevels($levels, $targetLevel)
    {
        return count(array_filter($levels, function ($level) use ($targetLevel) {
            return $level == $targetLevel;
        }));
    }

    /**
     * Calculate various scores and levels.
     *
     * @return array An array containing normal scores, high scores, levels, ARP, TOT1, TOT2, and CATEGORY.
     */
    public function calculateScores()
    {
        $categories = [
            'C1' => [1, 7, 13],
            'C2' => [15, 17],
            'O1' => [2, 6],
            'O2' => [11, 16, 18],
            'R1' => [9, 12, 20],
            'R2' => [3, 5],
            'E1' => [10, 19],
            'E2' => [4, 8, 14]
        ];

        $normalScores = $this->calculateCategoryScores($categories);

        $highScoreThresholds = [
            'C1' => [23 => 4, 17 => 3, 11 => 2],
            'C2' => [15 => 4, 11 => 3, 7 => 2],
            'O1' => [15 => 4, 11 => 3, 7 => 2],
            'O2' => [23 => 4, 17 => 3, 11 => 2],
            'R1' => [23 => 4, 17 => 3, 11 => 2],
            'R2' => [15 => 4, 11 => 3, 7 => 2],
            'E1' => [15 => 4, 11 => 3, 7 => 2],
            'E2' => [23 => 4, 17 => 3, 11 => 2]
        ];

        $highScores = [];
        foreach ($normalScores as $key => $score) {
            $highScores[$key] = $this->calculateHighScores($score, $highScoreThresholds[$key]);
        }

        $C = $this->sumCategoryScores($normalScores['C1'], $normalScores['C2']);
        $O = $this->sumCategoryScores($normalScores['O1'], $normalScores['O2']);
        $R = $this->sumCategoryScores($normalScores['R1'], $normalScores['R2']);
        $E = $this->sumCategoryScores($normalScores['E1'], $normalScores['E2']);

        $levelThresholds = [39 => 4, 29 => 3, 19 => 2];
        $CC = $this->calculateLevel($C, $levelThresholds);
        $OO = $this->calculateLevel($O, $levelThresholds);
        $RR = $this->calculateLevel($R, $levelThresholds);
        $EE = $this->calculateLevel($E, $levelThresholds);

        $TOT1 = $this->countLevels([$CC, $OO, $RR, $EE], 4);
        $TOT2 = $this->countLevels([$CC, $OO, $RR, $EE], 1);

        $CATEGORY = "";
        if ($TOT2 == 0) {
            $CATEGORY = ($TOT1 > 1) ? 1 : 2;
        } else {
            $CATEGORY = ($TOT2 > 1) ? (($TOT1 == 0) ? 3 : 2) : 2;
        }

        return [
            'NormalScores' => $normalScores,
            'HighScores' => $highScores,
            'Levels' => [
                'CC' => $CC,
                'OO' => $OO,
                'RR' => $RR,
                'EE' => $EE
            ],
            'ARP' => [
                'C' => $C,
                'O' => $O,
                'R' => $R,
                'E' => $E
            ],
            'TOT1' => $TOT1,
            'TOT2' => $TOT2,
            'CATEGORY' => $CATEGORY
        ];
    }
}