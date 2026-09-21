package consumer

import (
	"context"
	"encoding/json"
	"log"

	"github.com/hasanm95/pulse/services/scheduler/internal/scheduler"
	amqp "github.com/rabbitmq/amqp091-go"
)

type MonitorEventPayload struct {
	ID              string   `json:"id"`
	OrgID           string   `json:"orgId"`
	URL             string   `json:"url"`
	Type            string   `json:"type"`
	IntervalSeconds int64    `json:"intervalSeconds"`
	Regions         []string `json:"regions"`
	Status          string   `json:"status,omitempty"`
}

type MonitorDeletedPayload struct {
	ID    string `json:"id"`
	OrgID string `json:"orgId"`
}

func ProcessMessages(ctx context.Context, msgs <-chan amqp.Delivery, store *scheduler.Storage) {
	log.Println("Listening for fanout events...")

	for {
		select {
		case <-ctx.Done():
			log.Println("Stopping consumer loop...")
			return
		case d, ok := <-msgs:
			if !ok {
				log.Println("RabbitMQ message channel closed.")
				return
			}

			switch d.RoutingKey {
			
			case "monitor.created", "monitor.updated":
				var event MonitorEventPayload
				if err := json.Unmarshal(d.Body, &event); err != nil {
					log.Printf("Failed to parse monitor event data: %v", err)
					d.Ack(false) // malformed forever
					continue
				}

				if err := store.SaveSchedule(ctx, event.ID, event.IntervalSeconds); err != nil {
					log.Printf("Failed to commit schedule to Redis: %v", err)
					d.Nack(false, true) // transient - requeue for retry
					continue
				}

				log.Printf("Safely scheduled Monitor %s in Redis (Interval: %ds)", event.ID, event.IntervalSeconds)
				d.Ack(false)

			case "monitor.deleted":
				var event MonitorDeletedPayload
				if err := json.Unmarshal(d.Body, &event); err != nil {
					log.Printf("Failed to parse delete event data: %v", err)
					d.Ack(false)
					continue
				}

				if err := store.RemoveSchedule(ctx, event.ID); err != nil {
					log.Printf("Failed to remove schedule from Redis: %v", err)
					d.Nack(false, true)
					continue
				}

				log.Printf("Safely removed Monitor %s from Redis tracking pool", event.ID)
				d.Ack(false)

			default:
				log.Printf("Received unrecognized event routing key: %s", d.RoutingKey)
				d.Ack(false)
			}
		}
	}
}