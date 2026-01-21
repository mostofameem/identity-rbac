package util

import "fmt"

var (
	ErrEventNotFound                   = fmt.Errorf("event not found")
	ErrEventNotActive                  = fmt.Errorf("event not active")
	ErrEventNotStarted                 = fmt.Errorf("event not started")
	ErrEventAlreadyStarted             = fmt.Errorf("event already started")
	ErrEventAlreadyEnded               = fmt.Errorf("event already ended")
	ErrEventRegistrationNotStarted     = fmt.Errorf("event registration not started")
	ErrEventRegistrationTimeNotInRange = fmt.Errorf("event registration time not in range")
	ErrEventRegistrationTimeFinished   = fmt.Errorf("event registration time finished")
	ErrEventAlreadyRegistered          = fmt.Errorf("event already registered")
	ErrEventNotRegistered              = fmt.Errorf("event not registered")
	ErrEventLateRegistration           = fmt.Errorf("event late registration")
	ErrEventAlreadyExist               = fmt.Errorf("event already exist")
	ErrEventSomethingWentWrong         = fmt.Errorf("event something went wrong")
	ErrEventMaxParticipantsExceeded    = fmt.Errorf("event max participants exceeded")
)
