package main

import (
	"context"
	"log"
	"os/signal"
	"sync"
	"syscall"

	"github.com/hasanm95/pulsse/services/worker-pool/internal/config"
	"github.com/hasanm95/pulsse/services/worker-pool/internal/consumer"
	"github.com/hasanm95/pulsse/services/worker-pool/internal/worker"
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
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPass,
		DB:       0,
	})

	if _, err := rdb.Ping(ctx).Result(); err != nil {
		log.Fatalf("[Worker] failed to connect redis: %v", err)
	}
	log.Println("Successfully connected to Redis!")

	rabbitConn, rabbitChan, msgs := consumer.Start(ctx, cfg.RabbitMQURL)
	defer rabbitConn.Close()
	defer rabbitChan.Close()

	poolWorker := worker.NewPoolWorker(rdb, rabbitChan)
	var wg sync.WaitGroup

	wg.Add(1)
	go func(ctx context.Context) {
		defer wg.Done()
		poolWorker.ProcessMessages(ctx, msgs)
	}(ctx)

	<-ctx.Done()
	log.Println("[Worker] Shutdown signal received, waiting for in-flight work to finish...")
	wg.Wait()
	log.Println("Worker service shut down completely.")
}
