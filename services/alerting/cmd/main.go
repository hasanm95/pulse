package main

import (
	"context"
	"log"
	"os/signal"
	"sync"
	"syscall"

	"github.com/hasanm95/pulse/services/alerting/internal/config"
	"github.com/hasanm95/pulse/services/alerting/internal/consumer"
	"github.com/hasanm95/pulse/services/alerting/internal/database"
	"github.com/hasanm95/pulse/services/alerting/internal/processor"
	"github.com/hasanm95/pulse/services/alerting/internal/repository"
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
	log.Println("[Alerting] Database connected")

	rabbitConn, rabbitChan, msgs := consumer.Start(ctx, cfg.RabbitMQURL)
	defer rabbitConn.Close()
	defer rabbitChan.Close()

	repo := repository.NewAlertingRepository(pool)
	alertProcessor := processor.NewAlertProcessor(repo)

	var wg sync.WaitGroup

	wg.Add(1)
	go func ()  {
		defer wg.Done()
		alertProcessor.ProcessMessages(ctx, msgs)
	}()

	<-ctx.Done()
	log.Println("[Alerting] Shutdown signal received, wrapping up active processing logs...")
	
	wg.Wait()
	log.Println("[Alerting] Alerting service shut down completely and cleanly.")
}
