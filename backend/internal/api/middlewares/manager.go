package middlewares

import "net/http"

type Middlewares func(http.Handler) http.Handler

type Manager struct {
	globalMiddlewares []Middlewares
}

func NewManager() *Manager {
	return &Manager{
		globalMiddlewares: make([]Middlewares,0),
	}
}
func (m *Manager)Use (middlewares ...Middlewares) *Manager{
	m.globalMiddlewares=append(m.globalMiddlewares, middlewares...)
	return m
}
func (m *Manager) With(handler http.Handler, middlewares ...Middlewares)http.Handler{
	var h http.Handler
	h=handler
	for _,m:=range middlewares{
		h=m(h)
	}

	for _,m:=range m.globalMiddlewares{
		h=m(h)
	}

	return h
}