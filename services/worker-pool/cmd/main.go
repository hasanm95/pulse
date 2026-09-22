package main

import (
	"context"
	"log"
	"os/signal"
	"sync"
	"syscall"

	"github.com/hasanm95/pulse/services/worker-pool/internal/config"
	"github.com/hasanm95/pulse/services/worker-pool/internal/consumer"
	"github.com/hasanm95/pulse/services/worker-pool/internal/worker"
	"github.com/redis/go-redis/v9"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
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
	log.Println("[Worker] Successfully connected to Redis!")

	rabbitConn, consumeCh, msgs := consumer.Start(ctx, cfg.RabbitMQURL)
	defer rabbitConn.Close()
	defer consumeCh.Close()

	// Configure QoS Prefetch Limit to control how many tasks this container buffers
	numWorkers := cfg.WorkerConcurrency
	if numWorkers < 1 {
		numWorkers = 1
	}
	if err := consumeCh.Qos(numWorkers, 0, false); err != nil {
		log.Fatalf("[Worker] failed to set QoS: %v", err)
	}

	// One dedicated publish channel for the whole application is safe and high-performance
	publishCh, err := rabbitConn.Channel()
	if err != nil {
		log.Fatalf("[Worker] failed to open publish channel: %v", err)
	}
	defer publishCh.Close()

	// Single worker controller instance
	poolWorker := worker.NewPoolWorker(rdb, publishCh, numWorkers)

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		// Let the worker internally handle spawning concurrent tasks
		poolWorker.ProcessMessages(ctx, msgs)
	}()

	<-ctx.Done()
	log.Println("[Worker] Shutdown signal received, waiting for in-flight work to finish...")
	wg.Wait()
	log.Println("[Worker] Worker service shut down completely.")
}
