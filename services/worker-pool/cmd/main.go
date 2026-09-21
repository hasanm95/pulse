package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/hasanm95/pulsse/services/worker-pool/internal/config"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/redis/go-redis/v9"
)

type CheckEventPayload struct {
	MonitorId string `json:"monitorId"`
	DedupKey string `json:"dedupKey"`
	RequestedAt int64 `json:"requestedAt"`
}

type CheckCompletedPayload struct {
	MonitorID      string `json:"monitorId"`
	Status         string `json:"status"`         
	StatusCode     int    `json:"statusCode"`    
	ResponseTimeMs int64  `json:"responseTimeMs"` 
	CheckedAt      int64  `json:"checkedAt"`      
}

func main() {
	ctx := context.Background()
	ctx, stop := signal.NotifyContext(ctx, syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	log.Println("[Worker] Connecting to Redis...")
	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
		Password: cfg.RedisPass,
		DB: 0,
	})

	if _, err := rdb.Ping(ctx).Result(); err != nil {
		log.Fatalf("[Worker] failed to connect redis: %v", err)
	}
	log.Println("Successfully connected to Redis!")

	log.Println("[Worker] Connected RabbitMQ...")
	rabbitConn, err := amqp.Dial(cfg.RabbitMQURL)
	if err != nil {
		log.Fatalf("[worker] failed to connect to RabbitMQ: %v", err)
	}
	defer rabbitConn.Close()

	rabbitChan, err := rabbitConn.Channel()
	if err != nil {
		log.Fatalf("[worker] failed to open a RabbitMQ channel: %v", err)
	}

	queueName := "monitor_checks_queue"
	q, err := rabbitChan.QueueDeclare(queueName, true, false, false, false, nil)
	if err != nil {
		log.Fatalf("failed to declare a queue: %v", err)
	}

	exchangeName := "monitor_events"
	err = rabbitChan.QueueBind(q.Name, "check.requested", exchangeName, false, nil)
	if err != nil {
		log.Fatalf("failed to bind queue: %v", err)
	}

	msgs, err := rabbitChan.Consume(q.Name, "", false, false, false, false, nil)
	if err != nil {
		log.Fatalf("Failed to register a consumer: %v", err)
	}

	var wg sync.WaitGroup

	wg.Add(1)
	go func (ctx context.Context)  {
		defer wg.Done()
		for {
			select {
			case <-ctx.Done():
				log.Println("Stopping loop...")
				return
			case d, ok := <-msgs:
				if !ok {
					log.Println("RabbitMQ message channel closed.")
					return
				}
				var event CheckEventPayload
				if err := json.Unmarshal(d.Body, &event); err != nil {
					log.Printf("failed to parse check event data: %v", err)
					d.Ack(false)
					continue
				}

				success := rdb.SetNX(ctx, event.DedupKey, "processing", 5*time.Minute).Val()
			
				if !success {
					log.Printf("Duplicate task detected, dropping message: %s", event.DedupKey)
					d.Ack(false)
					continue
				}

				hashKey := fmt.Sprintf("monitor:meta:%s", event.MonitorId)
				meta, err := rdb.HGetAll(ctx, hashKey).Result()
				if err != nil {
					log.Printf("failed to fetch monitors: %s", err)
					d.Ack(false)
					continue
				}

				targetURL := meta["url"]
				if targetURL == "" {
					targetURL = "https://httpbin.org"
				}

				client := &http.Client{Timeout: 10 *time.Second}

				startTime := time.Now()
				resp, err := client.Get(targetURL)
				responseTimeMs := time.Since(startTime).Milliseconds()

				var status string
				var statusCode int

				if err != nil {
					status = "down"
					statusCode = 0
					log.Printf("failed to fetch %s, error %v", targetURL, err)
				} else {
					defer resp.Body.Close() 
					if resp.StatusCode >= 200 && resp.StatusCode < 300 {
						status = "up"
						statusCode = resp.StatusCode
					} else {
						status = "down"
						statusCode = resp.StatusCode
					}
				}

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

				err = rabbitChan.PublishWithContext(ctx, "monitor_events", "check.completed", false, false, amqp.Publishing{
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
	}(ctx)

	<-ctx.Done()
	log.Println("[Worker] Shutdown signal received, waiting for in-flight work to finish...")
	wg.Wait()
	log.Println("Woker service shut down completely.")
}
