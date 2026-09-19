package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"

	"github.com/hasanm95/pulse/services/scheduler/internal/config"
	"github.com/hasanm95/pulse/services/scheduler/internal/consumer"
	"github.com/hasanm95/pulse/services/scheduler/internal/scheduler"
	"github.com/redis/go-redis/v9"
)


func main() {
	ctx := context.Background()
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	// Listen for termination signals directly in main
	ctx, stop := signal.NotifyContext(ctx, syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Redis setup
	log.Println("Connection to redis")
	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
		Password: cfg.RedisPass,
		DB:       0, 
	})

	_, err = rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	log.Println("Successfully connected to Redis!")

	// Connect Schedulre
	stroe := scheduler.NewStorage(rdb)

	// Rabbitmq setup

	// Start the consumer infrastructure
	log.Println("Connecting to RabbitMQ...")
	conn, ch, msgs := consumer.Start(ctx, cfg.RabbitMQURL)
	defer conn.Close()
	defer ch.Close()

	// Process incoming channel deliveries continuously
	go consumer.ProcessMessages(ctx, msgs, stroe)

	// Block main process thread until system interrupt (Ctrl+C / Docker Stop)
	<-ctx.Done()
	log.Println("Scheduler service shut down completely.")
}
