package scheduler

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type Storage struct {
	rdb *redis.Client
}

func NewStorage (rdb *redis.Client) *Storage {
	return &Storage{
		rdb: rdb,
	}
}

func (s *Storage) SaveSchedule(ctx context.Context, monitorID string, intervalSeconds int64) error {
	hashKey := fmt.Sprintf("monitor:meta:%s", monitorID)
	if err := s.rdb.HSet(ctx, hashKey, "intervalSeconds", intervalSeconds).Err(); err != nil {
		return  err
	}

	nextDueTimestamp := time.Now().Unix() + intervalSeconds

	return s.rdb.ZAdd(ctx, "monitors:schedule", redis.Z{
		Score: float64(nextDueTimestamp),
		Member: monitorID,
	}).Err()
}

func (s *Storage) RemoveSchedule(ctx context.Context, monitorID string) error {
	if err := s.rdb.ZRem(ctx, "monitors:schedule", monitorID).Err(); err != nil {
		return err
	}

	hashKey := fmt.Sprintf("monitor:meta:%s", monitorID)
	return s.rdb.Del(ctx, hashKey).Err()
}