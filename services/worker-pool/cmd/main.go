package main

import (
	"context"
	"log"
	"os/signal"
	"sync"
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
	defer rabbitConn.Close()

	rabbitChan, err := rabbitConn.Channel()
	if err != nil {
		log.Fatalf("[worker] failed to open a RabbitMQ channel: %v", err)
	}

	queueName := "monitor_checks_queue"
	q, err := rabbitChan.QueueDeclare(queueName, true, false, false, false, nil)
	if err != nil {
		log.Fatalf("failed to declare a queue: %v", err)
	}

	exchangeName := "monitor_events"
	err = rabbitChan.QueueBind(q.Name, "check.requested", exchangeName, false, nil)
	if err != nil {
		log.Fatalf("failed to bind queue: %v", err)
	}

	msgs, err := rabbitChan.Consume(q.Name, "", false, false, false, false, nil)
	if err != nil {
		log.Fatalf("Failed to register a consumer: %v", err)
	}

	var wg sync.WaitGroup

	wg.Add(1)
	go func (ctx context.Context)  {
		defer wg.Done()
		for {
			select {
			case <-ctx.Done():
				log.Println("Stopping loop...")
				return
			case d, ok := <-msgs:
				if !ok {
					log.Println("RabbitMQ message channel closed.")
					return
				}
				log.Printf("messages %s", string(d.Body))
			}
		}
	}(ctx)

	<-ctx.Done()
	log.Println("[Worker] Shutdown signal received, waiting for in-flight work to finish...")
	wg.Wait()
	log.Println("Woker service shut down completely.")
}
