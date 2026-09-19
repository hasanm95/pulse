package main

import (
	"context"
	"log"

	"github.com/hasanm95/pulse/services/scheduler/internal/config"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/redis/go-redis/v9"
)


func main() {
	ctx := context.Background()
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

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

	// Rabbitmq setup
	log.Println("Connecting to RabbitMQ...")

	rabbitConn, err := amqp.Dial(cfg.RabbitMQURL)
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %v", err)
	}
	defer rabbitConn.Close()

	rabbitChan, err := rabbitConn.Channel()
	if err != nil {
		log.Fatalf("Failed to open a RabbitMQ channel: %v", err)
	}
	defer rabbitChan.Close()

	log.Println("Successfully connected to RabbitMQ!")

	// Fanout exchange declaration
	rabbitChan.ExchangeDeclare(
		"monitor_events",
		"fanout",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("Failed to declare fanout exchange: %v", err)
	}
	log.Println("Fanout exchange 'monitor_events' validated/created.")

}
