package config

import (
	"fmt"

	"github.com/caarlos0/env"
)


type Config struct {
	DatabaseURL string `env:"DATABASE_URL,required"`
	RabbitMQURL string `env:"RABBITMQ_URL,required"`
}

func Load() (*Config, error) {
	cfg := &Config{}

	if err := env.Parse(cfg); err != nil {
		return nil, fmt.Errorf("invalid env config: %v", err)
	}

	return cfg, nil
}