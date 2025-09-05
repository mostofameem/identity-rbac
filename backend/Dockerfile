FROM golang:1.24.2-alpine3.20 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o main ./main.go

FROM alpine:3.14

WORKDIR /app

COPY --from=builder /app/main .
COPY --from=builder /app/internal/migrations /app/internal/migrations
COPY --from=builder /app/internal/Mail/template /app/internal/Mail/template

EXPOSE 5001

CMD ["/app/main", "serve-rest"]
