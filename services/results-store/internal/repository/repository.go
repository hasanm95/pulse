package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type MonitorResultRecord struct {
	MonitorID string `json:"monitorId"`
	Status string `json:"status"`
	StatusCode int `json:"statusCode"`
	ResponseTimeMs int64 `json:"responseTimeMs"`
	CheckedAt time.Time `json:"checkedAt"`
}

type ResultRepository struct {
	pool *pgxpool.Pool
}

func NewResultRepository(pool *pgxpool.Pool) *ResultRepository {
	return &ResultRepository{pool: pool}
}

func (r *ResultRepository) SaveResult(ctx context.Context, record *MonitorResultRecord) error {
	query := `INSERT INTO monitor_results (monitor_id, status, status_code, response_time_ms, checked_at) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.pool.Exec(ctx, query, record.MonitorID, record.Status, record.StatusCode, record.ResponseTimeMs, record.CheckedAt)

	return err
}