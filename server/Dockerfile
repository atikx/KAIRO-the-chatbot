# -------- BUILD STAGE --------
FROM golang:1.25 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o server .

# -------- RUNTIME STAGE --------
FROM debian:bookworm-slim

WORKDIR /app

COPY --from=builder /app/server /app/server
COPY --from=builder /app/out /app/out

EXPOSE 4242

CMD ["/app/server"]