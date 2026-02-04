package util

// Ptr returns a pointer to the value passed in.
func Ptr[T any](v T) *T {
	return &v
}
