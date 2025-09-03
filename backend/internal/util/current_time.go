package util

import (
	"time"
)

func GetCurrentTime() time.Time {
	currentTime, err := time.Parse("2006-01-02 15:04:05", time.Now().Format("2006-01-02 15:04:05"))
	if err != nil {
	}
	return currentTime
}
