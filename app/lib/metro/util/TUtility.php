<?php

class TUtility
{

    public function truncateParagraph($html, $maxLength = 100)
    {
        // Remove HTML tags from the input
        $text = strip_tags($html ?? "");

        // Trim the text to the specified maximum length
        $truncatedText = mb_substr($text, 0, $maxLength);

        // Check if the last character is part of a broken HTML tag
        if (preg_match('/<[^>]*$/', $truncatedText)) {
            // Find the position of the last complete HTML tag
            $lastTagPos = mb_strrpos($html, '>');

            // If a complete tag is found, truncate the text to the end of that tag
            if ($lastTagPos !== false) {
                $truncatedText = mb_substr($html, 0, $lastTagPos + 1);
            }
        }

        return $truncatedText;
    }

    function navigateArray($inputArray, $currentKey, $direction)
    {
        $keys = array_keys($inputArray);
        $currentIndex = array_search($currentKey, $keys);

        if ($currentIndex === false) {
            // Handle the case where the current key is not found in the array
            return null;
        }

        $arrayLength = count($keys);

        // Handle navigation direction
        if ($direction == 'prev') {
            $currentIndex = ($currentIndex - 1 + $arrayLength) % $arrayLength;
        } elseif ($direction == 'next') {
            $currentIndex = ($currentIndex + 1) % $arrayLength;
        }

        return $inputArray[$keys[$currentIndex]];
    }

    function calculateRemainingTime($startDatetime, $duration)
    {
        $now = new DateTime();
        $start = new DateTime($startDatetime);
        $end = clone $start;
        $end->add(new DateInterval("PT{$duration}S")); // Duration in seconds

        $remainingTime = $now->diff($end);

        return [
            'days' => $remainingTime->d,
            'hours' => $remainingTime->h,
            'minutes' => $remainingTime->i,
            'seconds' => $remainingTime->s,
        ];
    }

    function calculateElapsedTime($startDate, $duration)
    {
        // Convert start date to a DateTime object
        $startDateObj = new DateTime($startDate);

        // Calculate the end date based on the start date and duration
        $endDateObj = clone $startDateObj;
        $endDateObj->add(new DateInterval("PT{$duration}M"));

        // Get the current date and time
        $currentTime = new DateTime();

        // Calculate the remaining time in minutes
        $remainingTime = $currentTime->diff($endDateObj);

        // Convert the remaining time to minutes
        $remainingMinutes = $remainingTime->days * 24 * 60 +
            $remainingTime->h * 60 +
            $remainingTime->i;

        return $remainingMinutes;
    }


    public function calculateScore($submitAnswer, $correctAnswer, $typeOfQuestions)
    {
        $totalScore = 0;

        foreach ($submitAnswer as $questionID => $userAnswer) {
            // Check if the question exists in correctAnswer and typeOfQuestions arrays
            if (isset($correctAnswer[$questionID]) && isset($typeOfQuestions[$questionID])) {
                $correctOptions = $correctAnswer[$questionID];
                $userAnswerType = $typeOfQuestions[$questionID]['answer_type'];

                switch ($userAnswerType) {
                    case 'single_answer':
                        // Single answer: Match 1 optionID from submit Answer with correct Answer
                        if ($userAnswer == $correctOptions) {
                            $totalScore += 1;
                        }
                        break;

                    case 'multiple_answer':
                        // Multiple answers: Match 1 or more optionID from submit Answer with correct Answer
                        //$matchingOptions = array_intersect($userAnswer, $correctOptions);
                        //$totalScore += count($matchingOptions);
                        // Multiple answers: Ensure all submitted answers match all correct answers

                        if (is_array($userAnswer) && is_array($correctOptions)) {
                            // Check if the submitted answers contain exactly the correct answers
                            if (empty(array_diff($userAnswer, $correctOptions)) && empty(array_diff($correctOptions, $userAnswer))) {
                                $totalScore += 1; // Full point if all options are correct and no extras
                            }
                        }
                        break;

                    case 'range':
                        // Range answer: Multiply the scores of matching optionIDs from submit Answer and correct Answer
                        $matchingOptions = array_intersect_key($correctOptions, [$userAnswer => $questionID]);
                        foreach ($matchingOptions as $optionID => $score) {
                            $totalScore += $score;
                        }
                        break;

                    case 'kostick':

                        break;
                }
            }
        }

        return $totalScore;
    }


    function generateSampleId($length = 10)
    {
        // Define the characters you want to use
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $charactersLength = strlen($characters);
        $randomString = '';

        // Loop to generate a random string of the specified length
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }

        return $randomString;
    }

    public static function convertDateToIndonesian($dateString)
    {
        // Array of Indonesian month names
        $months = [
            1 => 'Januari',
            2 => 'Februari',
            3 => 'Maret',
            4 => 'April',
            5 => 'Mei',
            6 => 'Juni',
            7 => 'Juli',
            8 => 'Agustus',
            9 => 'September',
            10 => 'Oktober',
            11 => 'November',
            12 => 'Desember'
        ];

        // Convert the date string to a DateTime object
        $date = new DateTime($dateString);

        // Extract day, month, and year from the DateTime object
        $day = $date->format('d');
        $month = (int)$date->format('m');  // Cast to int to use as array index
        $year = $date->format('Y');

        // Format the date in Indonesian format
        $indonesianDate = $day . ' ' . $months[$month] . ' ' . $year;

        return $indonesianDate;
    }

    public static function convertDateToIndonesian2($dateString)
    {
        // Array of Indonesian month names
        $months = [
            1 => 'Januari',
            2 => 'Februari',
            3 => 'Maret',
            4 => 'April',
            5 => 'Mei',
            6 => 'Juni',
            7 => 'Juli',
            8 => 'Agustus',
            9 => 'September',
            10 => 'Oktober',
            11 => 'November',
            12 => 'Desember'
        ];

        // Convert the date string to a DateTime object
        $date = new DateTime($dateString);

        // Extract day, month, year, and time from the DateTime object
        $day = $date->format('d'); // Day
        $month = (int)$date->format('m'); // Month number, cast to int to use as array index
        $year = $date->format('Y'); // Year
        $time = $date->format('H:i:s'); // Time (hours:minutes:seconds)

        // Format the date in Indonesian format
        $indonesianDate = $day . ' ' . $months[$month] . ' ' . $year . ' ' . $time;

        return $indonesianDate;
    }
}
