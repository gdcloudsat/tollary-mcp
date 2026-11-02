.PHONY: all build-go run-go dev build test

all: dev

# Build Go Data Plane Gateway binary
build-go:
	cd services/gateway && CGO_ENABLED=0 go build -o ../../bin/tollary-gateway ./cmd/gateway

# Run Go Data Plane Gateway locally on port 8080
run-go:
	cd services/gateway && go run ./cmd/gateway

# Run full-stack TypeScript environment on port 3000
dev:
	npm run dev

# Run full test suite
test:
	npm run lint
	cd services/gateway && go test -v ./... || true

# Production build
build:
	npm run build
	$(MAKE) build-go
