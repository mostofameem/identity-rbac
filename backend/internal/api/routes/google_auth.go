package routes

import (
	"fmt"
	"html/template"
	"net/http"

	"github.com/markbates/goth/gothic"
)

var userTemplate = `
<p><a href="/logout/{{.Provider}}">logout</a></p>
<p>Name: {{.Name}} [{{.LastName}}, {{.FirstName}}]</p>
<p>Email: {{.Email}}</p>
<p>NickName: {{.NickName}}</p>
<p>Location: {{.Location}}</p>
<p>AvatarURL: {{.AvatarURL}} <img src="{{.AvatarURL}}"></p>
<p>Description: {{.Description}}</p>
<p>UserID: {{.UserID}}</p>
<p>AccessToken: {{.AccessToken}}</p>
<p>ExpiresAt: {{.ExpiresAt}}</p>
<p>RefreshToken: {{.RefreshToken}}</p>
`

func (server *Server) initAuthRoutes(mux *http.ServeMux) {

	// mux.HandleFunc("/auth/{provider}/login",
	// 	http.HandlerFunc(server.handlers.GoogleLogin),
	// )

	// mux.HandleFunc(
	// 	"/auth/{provider}/callback",
	// 	http.HandlerFunc(server.handlers.GoogleCallback),
	// )

	mux.Handle(
		"GET /auth/{provider}/callback",
		http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {

			user, err := gothic.CompleteUserAuth(res, req)
			if err != nil {
				fmt.Fprintln(res, err)
				return
			}
			t, _ := template.New("foo").Parse(userTemplate)
			t.Execute(res, user)
		}),
	)

	mux.Handle(
		"GET /auth/{provider}",
		http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
			// try to get the user without re-authenticating
			if gothUser, err := gothic.CompleteUserAuth(res, req); err == nil {
				t, _ := template.New("foo").Parse(userTemplate)
				t.Execute(res, gothUser)
			} else {
				gothic.BeginAuthHandler(res, req)
			}
		}),
	)

	mux.Handle(
		"GET /logout/{provider}",
		http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
			gothic.Logout(res, req)
			res.Header().Set("Location", "/")
			res.WriteHeader(http.StatusTemporaryRedirect)
		}),
	)

}
