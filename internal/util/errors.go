package util

import "fmt"

var (
	ErrNotFound                   = fmt.Errorf("not found")
	ErrPasswordMismatch           = fmt.Errorf("password mismatch")
	ErrDuplicateRow               = fmt.Errorf("duplicate row found")
	ErrRoleNotActive              = fmt.Errorf("role not active")
	ErrRegistrationNotStarted     = fmt.Errorf("registration time not started")
	ErrRegistrationTimeNotInRange = fmt.Errorf("registration time not in time")
	ErrRegistrationTimeFinished   = fmt.Errorf("registration time finished")
	ErrAlreadyRegistered          = fmt.Errorf("already registered")
	ErrAlreadyInvited             = fmt.Errorf("already invited for this event")
	ErrNotRegistered              = fmt.Errorf("you did not register yet")
	ErrLateRegistration           = fmt.Errorf("Oops, it looks like you missed the pre-booking deadline, so the kitchen is closed for now. No worries though—we've got you covered! We'll order some delicious food from outside and make sure you're all sorted.")
)
