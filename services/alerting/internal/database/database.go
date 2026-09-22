package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func New(ctx context.Context, databaseURL string)(*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("[Alerting] failed to create connection pool: %v", err)
	}
	
	pingCtx, cancel := context.WithTimeout(ctx, 5 * time.Second)
	defer cancel()

	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return  nil, fmt.Errorf("[Results store] database ping failed: %v", err)
	}

	return pool, nil
}