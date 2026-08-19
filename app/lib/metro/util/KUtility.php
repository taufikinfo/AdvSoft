<?php

class KUtility {

    public function truncateParagraph( $html, $maxLength = 100){
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

    public function navigateArray($inputArray, $currentKey, $direction) {
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

    public function calculateRemainingTime($startDatetime, $duration) {
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

    public function calculateElapsedTime($startDate,$duration) {
        // Convert start date to a DateTime object
        $startDateObj = new DateTime( $startDate );

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

}
