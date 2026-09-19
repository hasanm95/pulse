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
			log.Println("Stopping worker loop...")
			return
		case d, ok := <-msgs:
			if !ok {
				log.Println("RabbitMQ message channel closed.")
				return
			}

			switch d.RoutingKey {
			
			case "monitor.created", "monitor.updated":
				var event MonitorEventPayload
				err := json.Unmarshal(d.Body, &event)
				if err != nil {
					log.Printf("Failed to parse write event JSON: %v", err)
					continue
				}
				
				err = store.SaveSchedule(ctx, event.ID, event.IntervalSeconds)
				if err != nil {
					log.Printf("Failed to commit schedule to Redis: %v", err)
					continue
				}
				log.Printf("Safely scheduled Monitor %s in Redis (Interval: %ds)", event.ID, event.IntervalSeconds)
				

			case "monitor.deleted":
				var event MonitorDeletedPayload
				err := json.Unmarshal(d.Body, &event)
				if err != nil {
					log.Printf("Failed to parse delete event JSON: %v", err)
					continue
				}
				
				err = store.RemoveSchedule(ctx, event.ID)
				if err != nil {
					log.Printf("Failed to remove schedule from Redis: %v", err)
					continue
				}
				log.Printf("Safely removed Monitor %s from Redis tracking pool", event.ID)
				

			default:
				log.Printf("Received unknown routing event key: %s", d.RoutingKey)
			}
		}
	}
}