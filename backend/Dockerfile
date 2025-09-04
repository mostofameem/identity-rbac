FROM golang:1.24.2-alpine3.20 AS builder

WORKDIR /app

# Copy go mod files first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy all source code including swagger dist files
COPY . .

# Build the application
RUN go build -o main ./main.go

FROM alpine:3.14

WORKDIR /app

COPY --from=builder /app/main .
COPY --from=builder /app/.env .
COPY --from=builder /app/internal/migrations /app/internal/migrations

EXPOSE 5001 

CMD ["/app/main", "serve-rest"]