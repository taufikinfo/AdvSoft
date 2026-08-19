<?php

use Adianti\Database\TCriteria;
use Adianti\Database\TFilter;
use Adianti\Database\TRepository;
use Adianti\Database\TTransaction;

class ScoreClass
{
    private $score;
    private $ranges;
    private $referenceScores;

    public function __construct()
    {
        $this->referenceScores = self::getPsychogramScores();
    }

    public function convertScores($inputArray)
    {
        $outputArray = [];
        $iqTotal = 0;

        // Process TIKI values using the reference score array and sum for IQ
        foreach (['TIKI1', 'TIKI2', 'TIKI3', 'TIKI4'] as $key) {
            if (isset($inputArray[$key])) {
                $inputValue = $inputArray[$key];
                $outputValue = $this->referenceScores[$key][$inputValue] ?? 0; // Default to 0 if no reference score
                $outputArray[$key] = (int) $outputValue;
                $iqTotal += (int) $outputValue; // Sum TIKI values for IQ calculation
            }
        }

        // Add LOGIKA value (without affecting IQ)
        if (isset($inputArray['LOGIKA'])) {
            $logikaValue = $inputArray['LOGIKA'];
            $outputValue = $this->referenceScores['LOGIKA'][$logikaValue] ?? 0; // Default to 0 if no reference score
            $outputArray['LOGIKA'] = (int) $outputValue;
        }

        // Add KOSTIK and ADVERSITY values directly to the output array
        if (isset($inputArray['KOSTIK'])) {
            $outputArray['KOSTIK'] = $inputArray['KOSTIK'];
        }
        if (isset($inputArray['ADVERSITY'])) {
            $outputArray['ADVERSITY'] = $inputArray['ADVERSITY'];
        }

        // Calculate and map the IQ score based on the sum of TIKI values
        $outputArray['IQ'] = $this->mapIQ($iqTotal);

        return $outputArray;
    }

    public function mapIQ($key)
    {
        // Mapping array for IQ values
        $iqMapping = [
            22 => 56,
            23 => 57,
            24 => 58,
            25 => 59,
            26 => 60,
            27 => 62,
            28 => 63,
            29 => 64,
            30 => 65,
            31 => 66,
            32 => 68,
            33 => 69,
            34 => 70,
            35 => 71,
            36 => 72,
            37 => 73,
            38 => 74,
            39 => 76,
            40 => 77,
            41 => 78,
            42 => 79,
            43 => 80,
            44 => 81,
            45 => 82,
            46 => 84,
            47 => 85,
            48 => 86,
            49 => 87,
            50 => 88,
            51 => 89,
            52 => 90,
            53 => 92,
            54 => 93,
            55 => 94,
            56 => 95,
            57 => 96,
            58 => 97,
            59 => 99,
            60 => 100,
            61 => 101,
            62 => 102,
            63 => 103,
            64 => 104,
            65 => 105,
            66 => 106,
            67 => 107,
            68 => 109,
            69 => 110,
            70 => 111,
            71 => 112,
            72 => 114,
            73 => 115,
            74 => 116,
            75 => 117,
            76 => 118,
            77 => 119,
            78 => 121,
            79 => 122,
            80 => 123,
            81 => 124,
            82 => 125,
            83 => 127,
            84 => 128,
            85 => 129,
            86 => 130,
            87 => 131,
            88 => 132,
            89 => 134,
            90 => 135,
            91 => 136,
            92 => 137,
            93 => 138,
            94 => 139,
            95 => 140,
            96 => 142,
            97 => 143,
            98 => 144,
            99 => 145
        ];

        // Check if the given IQ value exists in the mapping
        return $iqMapping[$key] ?? null;
    }

    public static function getPsychogramScores(): array
    {
        try {
            // Open a transaction with the 'exam' database
            TTransaction::open('exam');

            // Repository for psychogram_score_quiz
            $quizRepo = new TRepository('PsychogramScoreQuiz');

            // Create criteria to fetch all records
            $criteria = new TCriteria();
            $quizzes = $quizRepo->load($criteria) ?? [];

            // Initialize the result array
            $result = [];

            // Loop through the quizzes
            foreach ($quizzes as $quiz) {
                // Fetch related psychogram_score_table rows
                $scoreRepo = new TRepository('PsychogramScoreTable');
                $criteriaScore = new TCriteria();
                $criteriaScore->add(new TFilter('psychogram_score_quiz_id', '=', $quiz->psychogram_score_quiz_id ?? null));
                $scores = $scoreRepo->load($criteriaScore) ?? [];

                // Prepare an array for the scores
                $scoreArray = [];
                foreach ($scores as $score) {
                    // Build the raw_score => standard_score array
                    $scoreArray[$score->raw_score ?? null] = $score->standard_score ?? null;
                }

                // Add the quiz code and its corresponding scores to the result array
                $result[$quiz->code ?? null] = $scoreArray;
            }

            // Close the transaction
            TTransaction::close();

            // Return the built array
            return $result;
        } catch (Exception $e) {
            // Handle exception and rollback the transaction if any error occurs
            TTransaction::rollback();
            throw new Exception($e->getMessage());
        }
    }

    public static function getScaleForPsychogram($inputData)
    {
        try {
            // Get the mappingScale array from the previous function
            $mappingScale = self::getMappingScale();
            $result = [];

            foreach ($mappingScale as $psychogramCode => $scales) {
                // For each psychogram code, try to find the matching input data
                foreach ($scales as $scale => $formula) {
                    // Use a function to evaluate the formula based on input data
                    if (self::evaluateFormula($formula, $inputData)) {
                        // If formula matches, store the result and break to next psychogram
                        $result[$psychogramCode] = $scale;
                        break;
                    }
                }

                // If no scale was found, set it to null
                $result[$psychogramCode] = $result[$psychogramCode] ?? null;
            }

            return $result;
        } catch (Exception $e) {
            throw $e;
        }
    }

    // Helper function to evaluate the formula
    private static function evaluateFormula($formula, $inputData)
    {
        // Check if the formula is a valid string before applying regex
        if (!is_string($formula) || empty($formula)) {
            return 0;  // Return 0 if formula is invalid
        }

        // Handle special case when formula variables come from the 'KOSTIK' array
        $kostikVariables = ['G', 'L', 'I', 'T', 'V', 'S', 'R', 'D', 'C', 'E', 'N', 'A', 'P', 'X', 'B', 'O', 'Z', 'K', 'F', 'W'];

        // Split the formula by semicolon (;) to handle multiple conditions
        $conditions = explode(';', $formula);
        $totalConditions = count($conditions);
        $satisfiedConditions = 0;

        // Evaluate each condition
        foreach ($conditions as $condition) {
            // Trim spaces
            $condition = trim($condition);

            // Check if the condition matches INRANGE
            if (preg_match('/(\w+)\s*=\s*INRANGE\((\d+),(\d+)\)/', $condition, $matches)) {
                $variable = $matches[1] ?? null;
                $min = $matches[2] ?? null;
                $max = $matches[3] ?? null;

                // Check if the variable is in KOSTIK array
                if (in_array($variable, $kostikVariables) && isset($inputData['KOSTIK'][$variable])) {
                    if ($inputData['KOSTIK'][$variable] >= $min && $inputData['KOSTIK'][$variable] <= $max) {
                        $satisfiedConditions++;
                    }
                } elseif (isset($inputData[$variable])) {
                    if ($inputData[$variable] >= $min && $inputData[$variable] <= $max) {
                        $satisfiedConditions++;
                    }
                }
            } elseif (preg_match('/(\w+)\s*=\s*(\d+)/', $condition, $matches)) {
                $variable = $matches[1] ?? null;
                $value = $matches[2] ?? null;

                // Check if the variable is in KOSTIK array
                if (in_array($variable, $kostikVariables) && isset($inputData['KOSTIK'][$variable])) {
                    if ($inputData['KOSTIK'][$variable] == $value) {
                        $satisfiedConditions++;
                    }
                } elseif (isset($inputData[$variable])) {
                    if ($inputData[$variable] == $value) {
                        $satisfiedConditions++;
                    }
                }
            } elseif (preg_match('/(\w+)\s*>\s*(\d+)/', $condition, $matches)) {
                $variable = $matches[1] ?? null;
                $value = $matches[2] ?? null;

                // Check if the variable is in KOSTIK array
                if (in_array($variable, $kostikVariables) && isset($inputData['KOSTIK'][$variable])) {
                    if ($inputData['KOSTIK'][$variable] > $value) {
                        $satisfiedConditions++;
                    }
                } elseif (isset($inputData[$variable])) {
                    if ($inputData[$variable] > $value) {
                        $satisfiedConditions++;
                    }
                }
            } elseif (preg_match('/(\w+)\s*<=\s*(\d+)/', $condition, $matches)) {
                $variable = $matches[1] ?? null;
                $value = $matches[2] ?? null;

                // Check if the variable is in KOSTIK array
                if (in_array($variable, $kostikVariables) && isset($inputData['KOSTIK'][$variable])) {
                    if ($inputData['KOSTIK'][$variable] <= $value) {
                        $satisfiedConditions++;
                    }
                } elseif (isset($inputData[$variable])) {
                    if ($inputData[$variable] <= $value) {
                        $satisfiedConditions++;
                    }
                }
            }
        }

        // Calculate the percentage of satisfied conditions
        $satisfactionRate = ($totalConditions > 0) ? ($satisfiedConditions / $totalConditions) * 100 : 0;
        return $satisfactionRate;
    }

    public static function getMappingScale()
    {
        try {
            // Start a transaction with the 'exam' database
            TTransaction::open('exam');

            // Prepare repository for Psychogram and PsychogramScale
            $psychogramRepo = new TRepository('Psychogram');
            $psychogramScaleRepo = new TRepository('PsychogramScale');

            // Fetch all psychogram records
            $psychograms = $psychogramRepo->load() ?? [];
            $result = [];

            // Loop through each psychogram
            foreach ($psychograms as $psychogram) {
                $psychogramId = $psychogram->psychogram_id ?? null;
                $psychogramCode = $psychogram->code ?? null;

                // Load all scales related to the current psychogram
                $criteria = new TCriteria;
                $criteria->add(new TFilter('psychogram_id', '=', $psychogramId));
                $scales = $psychogramScaleRepo->load($criteria) ?? [];

                $scaleData = [];
                foreach ($scales as $scale) {
                    $scaleData[$scale->scale ?? null] = $scale->formula ?? null;
                }

                // Map psychogram.code to the scale data
                $result[$psychogramCode] = $scaleData;
            }

            // Close the transaction
            TTransaction::close();
            return $result;
        } catch (Exception $e) {
            // Handle exception, and ensure transaction is closed
            TTransaction::rollback();
            throw $e;
        }
    }

    public static function getScaleScore($inputData)
    {
        // Ensure default values for potentially missing keys
        $inputData['TIKI1'] = $inputData['TIKI1'] ?? 0;
        $inputData['TIKI2'] = $inputData['TIKI2'] ?? 0;
        $inputData['TIKI3'] = $inputData['TIKI3'] ?? 0;
        $inputData['TIKI4'] = $inputData['TIKI4'] ?? 0;

        // Handle nested arrays safely
        $adversityHighScores = $inputData['ADVERSITY']['HighScores'] ?? [];
        $inputData['ADVERSITY']['HighScores']['E1'] = $adversityHighScores['E1'] ?? 0;
        $inputData['ADVERSITY']['HighScores']['E2'] = $adversityHighScores['E2'] ?? 0;

        // Compute derived values
        $dataI2 = (($inputData['TIKI2'] ?? 0) + ($inputData['TIKI4'] ?? 0)) / 2;
        $dataI3 = (($inputData['TIKI3'] ?? 0) + ($inputData['TIKI4'] ?? 0)) / 2;

        // Safely access KOSTIK and LOGIKA arrays
        $kostik = $inputData['KOSTIK'] ?? [];
        $logika = $inputData['LOGIKA'] ?? 0; // Default value for LOGIKA
        $adversityArp = $inputData['ADVERSITY']['ARP'] ?? [];

        // Define the rules for each scale with null-safe checks
        $mappingRule = [
            'I1' => ($inputData['IQ'] < 70) ? 1 : (($inputData['IQ'] < 85) ? 2 : (($inputData['IQ'] < 116) ? 3 : (($inputData['IQ'] < 131) ? 4 : 5))),
            'I2' => ($dataI2 < 9) ? 1 : (($dataI2 < 15) ? 2 : (($dataI2 < 21) ? 3 : (($dataI2 < 27) ? 4 : 5))),
            'I3' => ($dataI3 < 9) ? 1 : (($dataI3 < 15) ? 2 : (($dataI3 < 21) ? 3 : (($dataI3 < 27) ? 4 : 5))),
            'I4' => ($logika < 5) ? 1 : (($logika < 9) ? 2 : (($logika < 12) ? 3 : (($logika < 14) ? 4 : 5))), // Use $logika safely
            'I5' => ($inputData['TIKI4'] < 6) ? 1 : (($inputData['TIKI4'] < 15) ? 2 : (($inputData['TIKI4'] < 21) ? 3 : (($inputData['TIKI4'] < 27) ? 4 : 5))),

            'W1' => ($kostik['W'] ?? 0) > 7 ? 1 : (($kostik['W'] ?? 0) > 4 ? 2 : (($kostik['W'] ?? 0) > 2 ? 3 : ((($kostik['W'] ?? 0) == 2) ? 4 : 5))),
            'W2' => ($kostik['R'] ?? 0) < 2 ? 1 : (($kostik['R'] ?? 0) < 4 ? 2 : (($kostik['R'] ?? 0) < 7 ? 3 : (($kostik['R'] ?? 0) < 9 ? 4 : 5))),
            'W3' => ($kostik['C'] ?? 0) < 2 ? 1 : (($kostik['C'] ?? 0) < 4 ? 2 : (($kostik['C'] ?? 0) < 7 ? 3 : (($kostik['C'] ?? 0) < 8 ? 4 : 5))),
            'W4' => ($kostik['C'] ?? 0) > 7 ? 1 : (($kostik['C'] ?? 0) > 6 ? 2 : (($kostik['C'] ?? 0) > 3 ? 3 : (($kostik['C'] ?? 0) > 1 ? 4 : 5))),
            'W5' => ($kostik['D'] ?? 0) < 2 ? 1 : (($kostik['D'] ?? 0) < 4 ? 2 : (($kostik['D'] ?? 0) < 6 ? 3 : (($kostik['D'] ?? 0) < 8 ? 4 : 5))),
            'W6' => ($kostik['N'] ?? 0) < 2 ? 1 : (($kostik['N'] ?? 0) < 4 ? 2 : (($kostik['N'] ?? 0) < 7 ? 3 : (($kostik['N'] ?? 0) < 8 ? 4 : 5))),
            'W7' => ($adversityArp['E'] ?? 0) < 10 ? 1 : (($adversityArp['E'] ?? 0) < 20 ? 2 : (($adversityArp['E'] ?? 0) < 30 ? 3 : (($adversityArp['E'] ?? 0) < 40 ? 4 : 5))),

            'P1' => ($kostik['E'] ?? 0) < 2 ? 1 : (($kostik['E'] ?? 0) < 4 ? 2 : (($kostik['E'] ?? 0) < 7 ? 3 : (($kostik['E'] ?? 0) < 9 ? 4 : 5))),
            'P2' => ($kostik['Z'] ?? 0) < 2 ? 1 : (($kostik['Z'] ?? 0) < 4 ? 2 : (($kostik['Z'] ?? 0) < 6 ? 3 : (($kostik['Z'] ?? 0) < 8 ? 4 : 5))),
            'P3' => ($kostik['S'] ?? 0) < 3 ? 1 : (($kostik['S'] ?? 0) < 5 ? 2 : (($kostik['S'] ?? 0) < 7 ? 3 : (($kostik['S'] ?? 0) < 9 ? 4 : 5))),
            'P4' => round((
                (($kostik['B'] ?? 0) < 3 ? 1 : (($kostik['B'] ?? 0) < 6 ? 2 : (($kostik['B'] ?? 0) < 8 ? 3 : (($kostik['B'] ?? 0) < 9 ? 4 : 5))))
                + (($kostik['K'] ?? 0) < 2 ? 1 : (($kostik['K'] ?? 0) < 3 ? 2 : (($kostik['K'] ?? 0) < 8 ? 3 : (($kostik['K'] ?? 0) < 9 ? 4 : 5))))
                + (($kostik['O'] ?? 0) < 3 ? 1 : (($kostik['O'] ?? 0) < 4 ? 2 : (($kostik['O'] ?? 0) < 6 ? 3 : (($kostik['O'] ?? 0) < 8 ? 4 : 5))))
            ) / 3, 0),
            'P5' => round((
                (($kostik['X'] ?? 0) < 2 ? 1 : (($kostik['X'] ?? 0) < 4 ? 2 : (($kostik['X'] ?? 0) < 8 ? 3 : (($kostik['X'] ?? 0) < 9 ? 4 : 5))))
                + (($kostik['S'] ?? 0) < 3 ? 1 : (($kostik['S'] ?? 0) < 5 ? 2 : (($kostik['S'] ?? 0) < 7 ? 3 : (($kostik['S'] ?? 0) < 9 ? 4 : 5))))
            ) / 2, 0),
            'P6' => round((
                (($kostik['L'] ?? 0) < 4 ? 1 : (($kostik['L'] ?? 0) < 5 ? 2 : (($kostik['L'] ?? 0) < 8 ? 3 : (($kostik['L'] ?? 0) < 9 ? 4 : 5))))
                + (($kostik['P'] ?? 0) < 4 ? 1 : (($kostik['P'] ?? 0) < 6 ? 2 : (($kostik['P'] ?? 0) < 8 ? 3 : (($kostik['P'] ?? 0) < 9 ? 4 : 5))))
            ) / 2, 0),
            'P7' => round((
                (($kostik['I'] ?? 0) < 4 ? 1 : (($kostik['I'] ?? 0) < 6 ? 2 : (($kostik['I'] ?? 0) < 7 ? 3 : (($kostik['I'] ?? 0) < 9 ? 4 : 5))))
                + (($kostik['T'] ?? 0) < 4 ? 1 : (($kostik['T'] ?? 0) < 6 ? 2 : (($kostik['T'] ?? 0) < 7 ? 3 : (($kostik['T'] ?? 0) < 9 ? 4 : 5))))
            ) / 2, 0),
            'P8' => ($kostik['A'] ?? 0) < 3 ? 1 : (($kostik['A'] ?? 0) < 5 ? 2 : (($kostik['A'] ?? 0) < 7 ? 3 : (($kostik['A'] ?? 0) < 9 ? 4 : 5))),
            'P9' => round((
                (($kostik['G'] ?? 0) < 2 ? 1 : (($kostik['G'] ?? 0) < 4 ? 2 : (($kostik['G'] ?? 0) < 6 ? 3 : (($kostik['G'] ?? 0) < 8 ? 4 : 5))))
                + (($kostik['N'] ?? 0) < 3 ? 1 : (($kostik['N'] ?? 0) < 5 ? 2 : (($kostik['N'] ?? 0) < 7 ? 3 : (($kostik['N'] ?? 0) < 8 ? 4 : 5))))
            ) / 2, 0)
        ];

        // Return the final score array
        return $mappingRule;
    }
}
