package mail

import (
	"identity-rbac/config"
)

type mailService struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
}

func NewMailService(cnf *config.MailConfig) MailService {
	return &mailService{
		Host:     cnf.Host,
		Port:     cnf.Port,
		Username: cnf.Username,
		Password: cnf.Password,
		From:     cnf.Email,
	}
}

type MailService interface {
	SendMail(to, subject, body string) error
}
