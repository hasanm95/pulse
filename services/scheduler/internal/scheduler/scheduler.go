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

func NewStorage(rdb *redis.Client) *Storage {
	return &Storage{
		rdb: rdb,
	}
}

func (s *Storage) SaveSchedule(ctx context.Context, monitorID string, intervalSeconds int64) error{
	// Set monitor definition in redis
	hashKey := fmt.Sprintf("monitor:meta:%s", monitorID)
	if err := s.rdb.HSet(ctx, hashKey, "intervalSeconds", intervalSeconds).Err(); err != nil {
		return nil
	}

	// Calculate the chronologically due timestamp (Current Unix Time + Interval Seconds)
	nextDueTimestamp := time.Now().Unix() + intervalSeconds

	// Insert or Update the monitor ID inside the Sorted Set (ZSET)
	err := s.rdb.ZAdd(ctx, "monitors:schedule", redis.Z{
		Score: float64(nextDueTimestamp),
		Member: monitorID,
	}).Err()

	return err
}

func (s *Storage) RemoveSchedule(ctx context.Context, monitorID string) error {
	// Drop it from execution pool
	if err := s.rdb.ZRem(ctx, "monitors:schedule", monitorID).Err(); err != nil {
		return err
	}

	// Remove metadata
	hashKey := fmt.Sprintf("monitor:meta:%s", monitorID)
	return s.rdb.Del(ctx, hashKey).Err()
}