package processor

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/hasanm95/pulse/services/results-store/internal/repository"
	amqp "github.com/rabbitmq/amqp091-go"
)

type CheckCompletedEvent struct {
	MonitorID string `json:"monitorId"`
	Status string `json:"status"`
	StatusCode int `json:"statusCode"`
	ResponseTimeMs int64 `json:"responseTimeMs"`
	CheckedAt int64 `json:"checkedAt"`
}

type ResultsPocessor struct {
	repo *repository.ResultRepository
}

func NewResultsPorcessor(repo *repository.ResultRepository) *ResultsPocessor {
	return &ResultsPocessor{repo: repo}
}

func (p *ResultsPocessor) ProcessMessages(ctx context.Context, msgs <-chan amqp.Delivery) {
	log.Println("[Results Store] Listening for check.completed telemetry events...")
	
	for {
		select{
		case <-ctx.Done():
			log.Println("Stopping Results Store message logging loop...")
			return
		case d, ok := <-msgs:
			if !ok {
				log.Println("RabbitMQ message channel closed unexpectedly.")
				return
			}
			var event CheckCompletedEvent
			if err := json.Unmarshal(d.Body, &event); err != nil {
				log.Printf("Failed to parse check completed json payload: %v", err)
				d.Ack(false)
				continue
			}

			record := repository.MonitorResultRecord{
				MonitorID: event.MonitorID,
				Status: event.Status,
				StatusCode: event.StatusCode,
				ResponseTimeMs: event.ResponseTimeMs,
				CheckedAt: time.Unix(event.CheckedAt, 0),
			}

			if err := p.repo.SaveResult(ctx, &record); err != nil {
				log.Printf("Failed to commit metric log to PostgreSQL: %v", err)
				d.Nack(false, true) // Requeue on transient DB infrastructure failures
				continue
			}
			log.Printf("[Results Logged] Monitor: %s | Status: %s | Latency: %dms", record.MonitorID, record.Status, record.ResponseTimeMs)
			d.Ack(false)
		}
	}
}