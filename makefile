MAIN:=./cmd/server
TARGET:=main
WIN_TARGET:=${TARGET}.exe
SERVER_CMD:=./${TARGET} serve-rest
PROTOC_DEST:=./
PROTOC_FLAGS:=--go_out=${PROTOC_DEST} --go_opt=paths=source_relative --go-grpc_out=${PROTOC_DEST} --go-grpc_opt=paths=source_relative
USERS_PROTO_FILES:=./grpc/users/users.proto

build-proto:
	protoc ${PROTOC_FLAGS} ${USERS_PROTO_FILES}

run-server:
	${SERVER_CMD}

tidy:
	go mod tidy
	

install-proto-deps:
	go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

install-dev-deps:
	go install github.com/air-verse/air@latest

install-deps:
	go mod download

install-mockgen:
	go install go.uber.org/mock/mockgen@latest

prepare: install-proto-deps install-dev-deps install-deps tidy

dev: prepare
	air serve-rest

migrate-up: prepare
	air serve-migrate-up

migrate-down: prepare
	air serve-migrate-down

add-user: prepare
	air serve-add-user
seeding: prepare
	air serve-seeding

build: install-deps
	go build -o ${TARGET} ${MAIN}

start: build run-server