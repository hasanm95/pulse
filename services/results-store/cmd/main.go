package main

import (
	"context"
	"log"
	"os/signal"
	"sync"
	"syscall"

	"github.com/hasanm95/pulse/services/results-store/internal/config"
	"github.com/hasanm95/pulse/services/results-store/internal/consumer"
	"github.com/hasanm95/pulse/services/results-store/internal/database"
	"github.com/hasanm95/pulse/services/results-store/internal/processor"
	"github.com/hasanm95/pulse/services/results-store/internal/repository"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	pool, err := database.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()
	log.Println("Database connected")

	rabbitConn, rabbitChan, msgs := consumer.Start(ctx, cfg.RabbitMQURL)
	defer rabbitConn.Close()
	defer rabbitChan.Close()

	repo := repository.NewResultRepository(pool)
	resultsProcessor := processor.NewResultsPorcessor(repo)

	var wg sync.WaitGroup

	wg.Add(1)
	go func ()  {
		defer wg.Done()
		resultsProcessor.ProcessMessages(ctx, msgs)
	}()

	<-ctx.Done()
	log.Println("[Results Store] Shutdown signal received, wrapping up processing cycles...")

	wg.Wait()
	log.Println("[Results Store] Service terminated cleanly and successfully.")
}
