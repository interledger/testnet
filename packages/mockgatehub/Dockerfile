# Build stage
FROM golang:1.24-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git make

WORKDIR /app

# Copy go mod files
COPY packages/mockgatehub/go.mod packages/mockgatehub/go.sum ./
RUN go mod download

# Copy source code
COPY packages/mockgatehub/ ./

# Run tests - must pass before building
RUN go test -v ./...

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o mockgatehub ./cmd/mockgatehub

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates curl tzdata

WORKDIR /root/

# Copy binary and web assets
COPY --from=builder /app/mockgatehub .
COPY --from=builder /app/web ./web

EXPOSE 8080

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["./mockgatehub"]
