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
	ch *amqp.Channel
}

func NewEngine(rdb *redis.Client, ch *amqp.Channel) *Engine {
	return &Engine{
		rdb: rdb,
		ch:  ch,
	}
}

// Start spawns the infinite 1-second interval execution thread
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

	// Ask Redis for all monitor IDs whose schedule execution score is <= NOW
	opt := redis.ZRangeBy{
		Min: "-inf",
		Max: strconv.FormatInt(now, 10),
	}

	dueMonitors, err := e.rdb.ZRangeByScore(ctx, "monitors:schedule", &opt).Result()
	if err != nil {
		log.Printf("Scheduler engine failed to query Redis schedule timeline: %v", err)
		return
	}

	if len(dueMonitors) == 0 {
		return // Nothing due for this exact clock cycle
	}

	for _, monitorID := range dueMonitors {
		// Fetch the monitor's saved metadata to determine its real custom interval duration
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

		// Construct a unique, time-stamped deduplication key frame
		dedupKey := fmt.Sprintf("check:%s:%d", monitorID, now)

		// Construct clean JSON payload matching standard message structural design rules
		jsonPayload := fmt.Sprintf(`{"monitorId":"%s","dedupKey":"%s","requestedAt":%d}`, monitorID, dedupKey, now)

		// Fire the 'check.requested' task payload down to RabbitMQ
		err = e.ch.PublishWithContext(
			ctx,
			"monitor_events",
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
			continue
		}

		log.Printf("Published check.requested event -> Monitor: %s, DedupKey: %s", monitorID, dedupKey)

		// Push the execution score forward chronologically into the future
		nextDueTimestamp := now + intervalSeconds
		err = e.rdb.ZAdd(ctx, "monitors:schedule", redis.Z{
			Score:  float64(nextDueTimestamp),
			Member: monitorID,
		}).Err()
		
		if err != nil {
			log.Printf("Failed to push next runtime execution timeline step forward for Monitor %s: %v", monitorID, err)
		}
	}
}