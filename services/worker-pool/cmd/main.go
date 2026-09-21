package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"

	"github.com/hasanm95/pulsse/services/worker-pool/internal/config"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/redis/go-redis/v9"
)

func main() {
	ctx := context.Background()
	ctx, stop := signal.NotifyContext(ctx, syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	log.Println("[Worker] Connecting to Redis...")
	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
		Password: cfg.RedisPass,
		DB: 0,
	})

	if _, err := rdb.Ping(ctx).Result(); err != nil {
		log.Fatalf("[Worker] failed to connect redis: %v", err)
	}
	log.Println("Successfully connected to Redis!")

	log.Println("[Worker] Connected RabbitMQ...")
	rabbitConn, err := amqp.Dial(cfg.RabbitMQURL)
	if err != nil {
		log.Fatalf("[worker] failed to connect to RabbitMQ: %v", err)
	}

	rabbitChan, err := rabbitConn.Channel()
	if err != nil {
		rabbitConn.Close()
		log.Fatalf("[worker] failed to open a RabbitMQ channel: %v", err)
	}
}
