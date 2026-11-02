# Multi-stage Docker build for Go Data Plane Gateway
FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY go.mod go.sum* ./
RUN go mod download || true

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /tollary-gateway ./cmd/gateway

FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/
COPY --from=builder /tollary-gateway .

EXPOSE 8080

ENTRYPOINT ["./tollary-gateway"]
