package config

import (
	"fmt"

	"github.com/caarlos0/env"
)



type Config struct {
	RabbitMQURL string `env:"RABBITMQ_URL,required"`
	RedisAddr string `env:"REDIS_ADDR,required"`
	RedisPass string `env:"REDIS_PASS,required"`
	WorkerConcurrency int    `env:"WORKER_CONCURRENCY" envDefault:"5"`
}

func Load()(*Config, error) {
	cfg := &Config{}

	if err := env.Parse(cfg); err != nil {
		return  nil, fmt.Errorf("invalid env config: %v", err)
	}

	return cfg, nil
}