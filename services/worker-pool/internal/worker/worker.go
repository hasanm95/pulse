package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
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
	rdb              *redis.Client
	ch               *amqp.Channel
	concurrencyLimit int
}

func NewPoolWorker(rdb *redis.Client, ch *amqp.Channel, concurrencyLimit int) *PoolWorker {
	return &PoolWorker{
		rdb:              rdb,
		ch:               ch,
		concurrencyLimit: concurrencyLimit,
	}
}

func (w *PoolWorker) ProcessMessages(ctx context.Context, msgs <-chan amqp.Delivery) {
	log.Printf("Listening for check.requested events with concurrency limit of %d...", w.concurrencyLimit)

	// The Semaphore channel controls our max concurrent HTTP flight limits
	sem := make(chan struct{}, w.concurrencyLimit)
	var workerWg sync.WaitGroup
	client := &http.Client{Timeout: 10 * time.Second}

	for {
		select {
		case <-ctx.Done():
			log.Println("Stopping master consumer worker loop...")
			// Wait for all currently executing in-flight Goroutines to complete before returning
			workerWg.Wait()
			return
		case d, ok := <-msgs:
			if !ok {
				log.Println("RabbitMQ message channel closed.")
				workerWg.Wait()
				return
			}

			// Push an empty struct token into the semaphore slot.
			// If all concurrency tokens are full, this blocks reading the next message from RabbitMQ (QoS working perfectly!)
			select {
			case sem <- struct{}{}:
			case <-ctx.Done():
				return
			}

			workerWg.Add(1)
			// Launch the actual network check in a concurrent isolated background thread
			go func(delivery amqp.Delivery) {
				defer func() {
					<-sem           // Release token back to the semaphore channel slot
					workerWg.Done() // Signal tracking group task completion
				}()
				
				w.executeCheck(ctx, delivery, client)
			}(d)
		}
	}
}


func (w *PoolWorker) executeCheck(ctx context.Context, d amqp.Delivery, client *http.Client) {
	var event CheckEventPayload
	if err := json.Unmarshal(d.Body, &event); err != nil {
		log.Printf("[Worker] Failed to parse check event data: %v", err)
		d.Ack(false) // Poison pill - drop from queue
		return
	}

	// 1. Atomic Deduplication Lock using SetNX
	success := w.rdb.SetNX(ctx, event.DedupKey, "processing", 5*time.Minute).Val()
	if !success {
		log.Printf("[Worker] Duplicate task detected, dropping message: %s", event.DedupKey)
		d.Ack(false)
		return
	}

	// 2. Fetch Monitor metadata parameters from Redis
	hashKey := fmt.Sprintf("monitor:meta:%s", event.MonitorId)
	meta, err := w.rdb.HGetAll(ctx, hashKey).Result()
	if err != nil {
		log.Printf("[Worker] Failed to fetch monitor meta from Redis for %s: %v", event.MonitorId, err)
		d.Nack(false, true) // Temporary cache issue - Requeue to try again
		return
	}

	targetURL := meta["url"]
	if targetURL == "" {
		log.Printf("[Worker] CRITICAL: Received check request for Monitor %s but no target URL exists in Redis metadata!", event.MonitorId)
		d.Ack(false) 
		return
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
		log.Printf("[Worker] Failed to fetch %s, error: %v", targetURL, err)
	} else {
		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			status = "up"
			statusCode = resp.StatusCode
		} else {
			status = "down"
			statusCode = resp.StatusCode
		}
		// Safely close the response body immediately within this executing thread frame
		resp.Body.Close()
	}

	log.Printf("[Check Completed] Monitor: %s | URL %s | Status: %s | Code: %d | Time: %dms", event.MonitorId, targetURL, status, statusCode, responseTimeMs)

	// 4. Construct and publish the telemetry completion payload to 'check_events'
	completionEvent := CheckCompletedPayload{
		MonitorID:      event.MonitorId,
		Status:         status,
		StatusCode:     statusCode,
		ResponseTimeMs: responseTimeMs,
		CheckedAt:      time.Now().Unix(),
	}

	jsonPayload, err := json.Marshal(completionEvent)
	if err != nil {
		log.Printf("[Worker] Failed to marshal completion event payload: %v", err)
		d.Ack(false)
		return
	}

	// Publish directly onto the updated 'check_events' exchange network
	err = w.ch.PublishWithContext(ctx, "check_events", "check.completed", false, false, amqp.Publishing{
		ContentType: "application/json",
		Body:        jsonPayload,
	})
	if err != nil {
		log.Printf("[Worker] Failed to publish completion event to RabbitMQ: %v", err)
		// We Ack it even on metric failure to prevent infinite poison task re-delivery lockups
		d.Ack(false)
		return
	}

	log.Printf("[Worker] Successfully published check.completed event for Monitor: %s", event.MonitorId)
	d.Ack(false)
}