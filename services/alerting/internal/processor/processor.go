package processor

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"

	"github.com/hasanm95/pulse/services/alerting/internal/repository"
	amqp "github.com/rabbitmq/amqp091-go"
)

type CheckCompletedEvent struct {
	MonitorID      string `json:"monitorId"`
	Status         string `json:"status"`
	StatusCode     int    `json:"statusCode"`
	ResponseTimeMs int64  `json:"responseTimeMs"`
	CheckedAt      int64  `json:"checkedAt"`
}

type AlertProcessor struct {
	repo *repository.AlertingRepository
}

func NewAlertProcessor(repo *repository.AlertingRepository) *AlertProcessor {
	return &AlertProcessor{repo: repo}
}

// ProcessMessages continuously reads check results and handles the incident state transitions
func (p *AlertProcessor) ProcessMessages(ctx context.Context, msgs <-chan amqp.Delivery) {
	log.Println("[Alerting] Listening for check.completed events...")
	
	// Hardcoded rule threshold for this stage (Alert if failed 3 times consecutively)
	const failureThreshold = 3

	for {
		select {
		case <-ctx.Done():
			log.Println("Stopping Alerting processor loop...")
			return
		case d, ok := <-msgs:
			if !ok {
				log.Println("RabbitMQ message channel closed unexpectedly.")
				return
			}

			var event CheckCompletedEvent
			if err := json.Unmarshal(d.Body, &event); err != nil {
				log.Printf("[Alerting] Failed to parse JSON body: %v", err)
				d.Ack(false)
				continue
			}

			// 1. Fetch current running historical state memory for this monitor
			state, err := p.repo.GetOrCreateState(ctx, event.MonitorID)
			if err != nil {
				log.Printf("[Alerting] Failed to fetch state context from database: %v", err)
				d.Nack(false, true) // Transient error - requeue task
				continue
			}

			// 2. Evaluate State Status Matrix
			if event.Status == "down" {
				state.FailureCount++
				state.LastStatus = "down"

				// CRITICAL THRESHOLD TRIGGER: Crossed threshold and no active incident exists yet
				if state.FailureCount >= failureThreshold && !state.ActiveIncidentID.Valid {
					log.Printf("[OUTAGE DETECTED] Monitor %s failed %d times consecutively! Opening incident...", event.MonitorID, state.FailureCount)
					
					incidentID, err := p.repo.OpenIncident(ctx, event.MonitorID)
					if err != nil {
						log.Printf("[Alerting] Failed to log new incident entry to database: %v", err)
						d.Nack(false, true)
						continue
					}

					state.ActiveIncidentID = sql.NullString{String: incidentID, Valid: true}
					
					// SIMULATE NOTIFICATION (Email, Webhook etc.)
					p.dispatchAlertNotification(event.MonitorID, "down", state.FailureCount)
				}
			} else {
				// RECOVERY MATCH: Check is healthy ("up")
				
				// If an ongoing incident was active, it means the website just recovered!
				if state.ActiveIncidentID.Valid {
					log.Printf("[RECOVERY DETECTED] Monitor %s is back UP! Resolving incident %s...", event.MonitorID, state.ActiveIncidentID.String)
					
					err := p.repo.CloseIncident(ctx, state.ActiveIncidentID.String)
					if err != nil {
						log.Printf("[Alerting] Failed to resolve open database incident entry: %v", err)
						d.Nack(false, true)
						continue
					}
					
					// SIMULATE NOTIFICATION (Recovery notice)
					p.dispatchAlertNotification(event.MonitorID, "recovered", 0)
				}

				// Reset baseline state numbers
				state.FailureCount = 0
				state.LastStatus = "up"
				state.ActiveIncidentID = sql.NullString{String: "", Valid: false}
			}

			// 3. Commit state changes back to PostgreSQL
			if err := p.repo.UpdateState(ctx, state); err != nil {
				log.Printf("[Alerting] Failed to sync updated monitor state data: %v", err)
				d.Nack(false, true)
				continue
			}

			d.Ack(false)
		}
	}
}

func (p *AlertProcessor) dispatchAlertNotification(monitorID string, eventType string, failureStreak int) {
	if eventType == "down" {
		log.Printf("[ALERT SYSTEM DISPATCHED] -> TO: Team Admins | SUBJECT: Outage Alert! | MSG: Monitor %s has failed %d times consecutively. Endpoint is unreachable.", monitorID, failureStreak)
	} else if eventType == "recovered" {
		log.Printf("[ALERT SYSTEM DISPATCHED] -> TO: Team Admins | SUBJECT: System Recovered | MSG: Monitor %s is responding successfully again. Incident closed.", monitorID)
	}
}