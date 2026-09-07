package utils

import (
	"errors"
	"reflect"
	"strings"

	"github.com/go-playground/locales"
	"github.com/go-playground/locales/en"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	en_translations "github.com/go-playground/validator/v10/translations/en"
)

type Validator struct {
	en       locales.Translator
	uniTrans *ut.UniversalTranslator
	trans    ut.Translator
	validate *validator.Validate
}

var val *Validator

func InitValidator() {
	val = &Validator{}
	val.en = en.New()
	val.uniTrans = ut.New(val.en, val.en)
	val.trans, _ = val.uniTrans.GetTranslator("en")
	val.validate = validator.New()
	en_translations.RegisterDefaultTranslations(val.validate, val.trans)
	val.validate.RegisterValidation("mode",
		modeValidation([]string{
			"ALL",
			"UPCOMING",
			"RECENT",
			"ONGOING",
		}))
	val.validate.RegisterValidation("statusMode",
		modeValidation([]string{
			"ALL",
			"REGISTERED",
			"CANCELED",
		}))
	val.validate.RegisterValidation("registerMode",
		modeValidation([]string{
			"NOT_REGISTERED",
			"REGISTER",
			"CANCEL",
		}))
}

func Validate(v interface{}) error {
	vValue := reflect.ValueOf(v)
	if vValue.Kind() == reflect.Slice {
		for i := 0; i < vValue.Len(); i++ {
			if err := val.validate.Struct(vValue.Index(i).Interface()); err != nil {
				return validationError(err)
			}
		}
	} else {
		if err := val.validate.Struct(v); err != nil {
			return validationError(err)
		}
	}
	return nil
}

// validationError translates the raw validator error into a readable,
// field-level message, e.g. "validation error: The EventTypeId field is required"
func validationError(err error) error {
	translated := TranslateError(err)
	parts := make([]string, 0, len(translated))
	for _, msg := range translated {
		if msg != "" {
			parts = append(parts, msg)
		}
	}
	if len(parts) == 0 {
		return errors.New("validation error")
	}
	return errors.New("validation error: " + strings.Join(parts, "; "))
}

func TranslateError(e error) validator.ValidationErrorsTranslations {
	valErr, ok := e.(validator.ValidationErrors)
	if !ok {
		return validator.ValidationErrorsTranslations{
			"error": e.Error(),
		}
	}
	return valErr.Translate(val.trans)
}

func modeValidation(allowedStatuses []string) validator.Func {
	return func(fl validator.FieldLevel) bool {
		for _, status := range allowedStatuses {
			if fl.Field().String() == status {
				return true
			}
		}
		return false
	}
}
