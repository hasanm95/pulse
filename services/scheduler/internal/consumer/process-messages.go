package consumer

import (
	"context"
	"encoding/json"
	"log"

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

func ProcessMessages(ctx context.Context, msgs <-chan amqp.Delivery) {
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
				
				log.Printf("Parsed %s event -> ID: %s, Interval: %ds, URL: %s", 
					d.RoutingKey, event.ID, event.IntervalSeconds, event.URL)
				

			case "monitor.deleted":
				var event MonitorDeletedPayload
				err := json.Unmarshal(d.Body, &event)
				if err != nil {
					log.Printf("Failed to parse delete event JSON: %v", err)
					continue
				}
				
				log.Printf("Parsed monitor.deleted event -> ID: %s, OrgID: %s", event.ID, event.OrgID)
				

			default:
				log.Printf("Received unknown routing event key: %s", d.RoutingKey)
			}
		}
	}
}