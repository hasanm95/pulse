FROM golang:1.25-alpine

WORKDIR /app

RUN go install github.com/air-verse/air@v1.61.7

COPY go.mod go.su[m] ./
RUN go mod download

CMD ["air", "--build.cmd", "go build -o tmp/main ./cmd", "--build.bin", "./tmp/main"]