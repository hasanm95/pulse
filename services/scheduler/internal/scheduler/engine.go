package scheduler

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/redis/go-redis/v9"
)

type Engine struct {
	rdb *redis.Client
	ch  *amqp.Channel
}

func NewEngine(rdb *redis.Client, ch *amqp.Channel) *Engine {
	return &Engine{
		rdb: rdb,
		ch:  ch,
	}
}

func (e *Engine) Start(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	log.Println("Background scheduling polling loop activated.")

	for {
		select {
		case <-ctx.Done():
			log.Println("Stopping scheduler background polling loop...")
			return
		case <-ticker.C:
			e.processDueMonitors(ctx)
		}
	}
}

func (e *Engine) processDueMonitors(ctx context.Context) {
	now := time.Now().Unix()

	dueMonitors, err := e.rdb.ZRangeArgs(ctx, redis.ZRangeArgs{
		Key:     "monitors:schedule",
		Start:   "-inf",                  
		Stop:    strconv.FormatInt(now, 10),
		ByScore: true,
	}).Result()

	if err != nil {
		log.Printf("Scheduler engine failed to query Redis schedule timeline: %v", err)
		return
	}

	if len(dueMonitors) == 0 {
		return
	}

	for _, monitorID := range dueMonitors {
		hashKey := fmt.Sprintf("monitor:meta:%s", monitorID)
		intervalStr, err := e.rdb.HGet(ctx, hashKey, "intervalSeconds").Result()
		if err != nil {
			log.Printf("Missing configuration meta for Monitor %s. Skipping step.", monitorID)
			continue
		}

		intervalSeconds, err := strconv.ParseInt(intervalStr, 10, 64)
		if err != nil {
			log.Printf("Invalid interval parameter value stored for Monitor %s: %v", monitorID, err)
			continue
		}

		// RESCHEDULE IMMEDIATELY BEFORE PUBLISHING (Prevents race conditions if publish slows down)
		nextDueTimestamp := now + intervalSeconds
		if err := e.rdb.ZAdd(ctx, "monitors:schedule", redis.Z{
			Score:  float64(nextDueTimestamp),
			Member: monitorID,
		}).Err(); err != nil {
			log.Printf("Failed to push next runtime execution timeline step forward for Monitor %s: %v", monitorID, err)
			continue
		}

		dedupKey := fmt.Sprintf("check:%s:%d", monitorID, now)
		jsonPayload := fmt.Sprintf(`{"monitorId":"%s","dedupKey":"%s","requestedAt":%d}`, monitorID, dedupKey, now)

		err = e.ch.PublishWithContext(
			ctx,
			"check_events",
			"check.requested",
			false,
			false,
			amqp.Publishing{
				ContentType: "application/json",
				Body:        []byte(jsonPayload),
			},
		)

		if err != nil {
			log.Printf("Failed to broadcast check execution request for Monitor %s: %v", monitorID, err)
			
			// Rollback the timeline step back to original state so it retries on next clock tick
			_ = e.rdb.ZAdd(ctx, "monitors:schedule", redis.Z{Score: float64(now), Member: monitorID})
			continue
		}

		log.Printf("Published check.requested event -> Monitor: %s, DedupKey: %s", monitorID, dedupKey)
	}
}
