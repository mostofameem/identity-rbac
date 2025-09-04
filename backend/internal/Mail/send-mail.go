package mail

import (
	"bytes"
	"fmt"
	"html/template"
	"identity-rbac/pkg/logger"
	"log/slog"
	"net/smtp"
	"path/filepath"
	"strconv"
	"strings"
)

func (s *mailService) SendMail(to, subject, body string) error {
	auth := smtp.PlainAuth("", s.From, s.Password, s.Host)

	msg := []byte("To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"Content-Type: text/html; charset=UTF-8\r\n" +
		"\r\n" +
		body + "\r\n")

	addr := s.Host + ":" + strconv.Itoa(s.Port)

	return smtp.SendMail(addr, auth, s.From, []string{to}, msg)
}

func (s *mailService) SendTemplateEmail(to, templateName string, data interface{}) error {
	tmplPath := filepath.Join("internal", "Mail", "template", templateName+".html")

	tmpl, err := template.ParseFiles(tmplPath)
	if err != nil {
		return fmt.Errorf("failed to parse template %s: %w", templateName, err)
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, data)
	if err != nil {
		return fmt.Errorf("failed to execute template %s: %w", templateName, err)
	}

	lines := bytes.Split(buf.Bytes(), []byte("\n"))
	subject := "Email Notification"
	var bodyStart int

	for i, line := range lines {
		if bytes.HasPrefix(line, []byte("Subject:")) {
			subject = string(bytes.TrimSpace(bytes.TrimPrefix(line, []byte("Subject:"))))
			bodyStart = i + 1
			break
		}
	}

	body := string(bytes.Join(lines[bodyStart:], []byte("\n")))
	body = strings.TrimSpace(body)

	err = s.SendMail(to, subject, body)
	if err != nil {
		slog.Error("failed to send email:", logger.Extra(map[string]any{
			"error": err.Error(),
		}))
		return fmt.Errorf("failed to send email: %w", err)
	}

	return err
}
