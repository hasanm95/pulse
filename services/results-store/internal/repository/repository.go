package repository

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrDuplicateResult = errors.New("duplicate check result, already recorded")

type MonitorResultRecord struct {
	MonitorID string `json:"monitorId"`
	DedupKey       string    `json:"dedupKey"`
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
	query := `INSERT INTO monitor_results (monitor_id, dedup_key, status, status_code, response_time_ms, checked_at) VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.pool.Exec(ctx, query, record.MonitorID, record.DedupKey, record.Status, record.StatusCode, record.ResponseTimeMs, record.CheckedAt)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrDuplicateResult
		}
		return err
	}

	return nil
}