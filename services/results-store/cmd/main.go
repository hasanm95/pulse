package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"

	"github.com/hasanm95/pulse/services/results-store/internal/config"
	"github.com/hasanm95/pulse/services/results-store/internal/database"
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

}
