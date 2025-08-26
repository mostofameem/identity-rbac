package mail

import (
	"bytes"
	"fmt"
	"html/template"
	"path/filepath"
)

func (s *mailService) SendMail(to, subject, body string) error {
	// Basic email sending implementation
	// TODO: Implement actual SMTP sending
	return nil
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
	
	// Extract subject from template content (first line after "Subject:")
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
	
	// Get body content (skip subject line)
	body := string(bytes.Join(lines[bodyStart:], []byte("\n")))
	
	// TODO: Implement actual SMTP sending with subject and body
	fmt.Printf("Sending email to: %s\nSubject: %s\nBody:\n%s\n", to, subject, body)
	
	return nil
}
