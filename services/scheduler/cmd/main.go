package main

import (
	"context"
	"log"
	"os/signal"
	"sync"
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

	ctx, stop := signal.NotifyContext(ctx, syscall.SIGINT, syscall.SIGTERM)	
	defer stop()

	log.Println("Connecting to Redis...")
	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
		Password: cfg.RedisPass,
		DB: 0,
	})

	if _, err := rdb.Ping(ctx).Result(); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	log.Println("Successfully connected to Redis!")

	store := scheduler.NewStorage(rdb)

	log.Println("Connecting to RabbitMQ...")
	conn, consumeCh, msgs := consumer.Start(ctx, cfg.RabbitMQURL)
	defer conn.Close()
	defer consumeCh.Close()

	// Dedicated channel for publishing
	publishCh, err := conn.Channel()
	if err != nil {
		log.Fatalf("Failed to open a publish channel: %v", err)
	}
	defer publishCh.Close()

	if err := publishCh.ExchangeDeclare("check_events", "topic", true, false, false, false, nil); err != nil {
		log.Fatalf("Failed to declare check_events exchange: %v", err)
	}

	engine := scheduler.NewEngine(rdb, publishCh)

	var wg sync.WaitGroup

	wg.Add(1)
	go func ()  {
		defer wg.Done()
		engine.Start(ctx)	
	}()

	wg.Add(1)
	go func ()  {
		defer wg.Done()
		consumer.ProcessMessages(ctx, msgs, store)
	}()

	<-ctx.Done()
	log.Println("Shutdown signal received, waiting for in-flight work to finish...")
	wg.Wait()
	log.Println("Scheduler service shut down completely.")
}