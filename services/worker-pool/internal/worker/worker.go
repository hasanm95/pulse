package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/redis/go-redis/v9"
)

type CheckEventPayload struct {
	MonitorId   string `json:"monitorId"`
	DedupKey    string `json:"dedupKey"`
	RequestedAt int64  `json:"requestedAt"`
}

type CheckCompletedPayload struct {
	MonitorID      string `json:"monitorId"`
	Status         string `json:"status"`
	StatusCode     int    `json:"statusCode"`
	ResponseTimeMs int64  `json:"responseTimeMs"`
	CheckedAt      int64  `json:"checkedAt"`
}

type PoolWorker struct {
	rdb *redis.Client
	ch  *amqp.Channel
}

func NewPoolWorker(rdb *redis.Client, ch *amqp.Channel) *PoolWorker {
	return &PoolWorker{
		rdb: rdb,
		ch:  ch,
	}
}

func (w *PoolWorker) ProcessMessages(ctx context.Context, msgs <-chan amqp.Delivery) {
	log.Println("Listening for check.requested events...")

	client := &http.Client{Timeout: 10 * time.Second}

	for {
		select {
		case <-ctx.Done():
			log.Println("Stopping consumer worker loop...")
			return
		case d, ok := <-msgs:
			if !ok {
				log.Println("RabbitMQ message channel closed.")
				return
			}

			var event CheckEventPayload
			if err := json.Unmarshal(d.Body, &event); err != nil {
				log.Printf("Failed to parse check event data: %v", err)
				d.Ack(false)
				continue
			}

			// 1. Atomic Deduplication Lock using SetNX
			success := w.rdb.SetNX(ctx, event.DedupKey, "processing", 5*time.Minute).Val()
			if !success {
				log.Printf("Duplicate task detected, dropping message: %s", event.DedupKey)
				d.Ack(false)
				continue
			}

			// 2. Fetch Monitor metadata parameters from Redis
			hashKey := fmt.Sprintf("monitor:meta:%s", event.MonitorId)
			meta, err := w.rdb.HGetAll(ctx, hashKey).Result()
			if err != nil {
				log.Printf("Failed to fetch monitor meta from Redis: %v", err)
				d.Ack(false)
				continue
			}

			targetURL := meta["url"]
			if targetURL == "" {
				targetURL = "https://httpbin.org"
			}

			// 3. Trigger HTTP connection execution benchmarking
			startTime := time.Now()
			resp, err := client.Get(targetURL)
			responseTimeMs := time.Since(startTime).Milliseconds()

			var status string
			var statusCode int

			if err != nil {
				status = "down"
				statusCode = 0
				log.Printf("Failed to fetch %s, error: %v", targetURL, err)
			} else {
				if resp.StatusCode >= 200 && resp.StatusCode < 300 {
					status = "up"
					statusCode = resp.StatusCode
				} else {
					status = "down"
					statusCode = resp.StatusCode
				}
				
				resp.Body.Close()
			}

			log.Printf("[Check Completed] Monitor: %s | Status: %s | Code: %d | Time: %dms", event.MonitorId, status, statusCode, responseTimeMs)

			// 4. Construct and publish the telemetry completion payload
			completionEvent := CheckCompletedPayload{
				MonitorID:      event.MonitorId,
				Status:         status,
				StatusCode:     statusCode,
				ResponseTimeMs: responseTimeMs,
				CheckedAt:      time.Now().Unix(),
			}

			jsonPayload, err := json.Marshal(completionEvent)
			if err != nil {
				log.Printf("Failed to marshal completion event payload: %v", err)
				d.Ack(false)
				continue
			}

			err = w.ch.PublishWithContext(ctx, "monitor_events", "check.completed", false, false, amqp.Publishing{
				ContentType: "application/json",
				Body:        jsonPayload,
			})
			if err != nil {
				log.Printf("Failed to publish completion event to RabbitMQ: %v", err)
				d.Ack(false)
				continue
			}

			log.Printf("Successfully published check.completed event for Monitor: %s", event.MonitorId)
			d.Ack(false)
		}
	}
}