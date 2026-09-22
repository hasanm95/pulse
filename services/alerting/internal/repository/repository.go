package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type MonitorState struct {
	MonitorID      string
	LastStatus     string
	FailureCount   int
	ActiveIncidentID sql.NullString
}

type AlertingRepository struct {
	pool *pgxpool.Pool
}

func NewAlertingRepository(pool *pgxpool.Pool) *AlertingRepository {
	return &AlertingRepository{
		pool: pool,
	}
}

func (r *AlertingRepository) GetOrCreateState(ctx context.Context, monitorID string) (*MonitorState, error) {
	query := `SELECT monitor_id, last_status, failure_count, active_incident_id FROM monitor_states WHERE monitor_id = $1;`

	var state MonitorState
	err := r.pool.QueryRow(ctx, query, monitorID).Scan(
		&state.MonitorID,
		&state.LastStatus,
		&state.FailureCount,
		&state.ActiveIncidentID,
	)

	if err != nil && (errors.Is(err, sql.ErrNoRows) || err.Error() == "no rows in result set") {
		return &MonitorState{
			MonitorID:    monitorID,
			LastStatus:   "up",
			FailureCount: 0,
		}, nil
	} else if err != nil {
		return nil, err
	}

	return &state, nil
}

// UpdateState updates the running operational metrics baseline
func (r *AlertingRepository) UpdateState(ctx context.Context, state *MonitorState) error {
	query := `
		INSERT INTO	monitor_states (monitor_id, last_status, failure_count, active_incident_id, updated_at)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (monitor_id) DO UPDATE SET 
			last_status = EXCLUDED.last_status,
			failure_count = $3,
			active_incident_id = EXCLUDED.active_incident_id,
			updated_at = NOW();
	`

	_, err := r.pool.Exec(ctx, query, 
		state.MonitorID,
		state.LastStatus,
		state.FailureCount,
		state.ActiveIncidentID,
	)

	return err
}


// OpenIncident records a new trackable historical downtime incident event block
func (r *AlertingRepository) OpenIncident(ctx context.Context, monitorID string) (string, error) {
	query := `
		INSERT INTO incidents (monitor_id, started_at, status)
		VALUES ($1, NOW(), 'open')
		RETURNING id::text;
	`
	
	rows, err := r.pool.Query(ctx, query, monitorID)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	var incidentID string
	if rows.Next() {
		values, err := rows.Values()
		if err != nil {
			return "", err
		}
		
		if len(values) > 0 {
			incidentID = fmt.Sprintf("%v", values[0])
		}
	}

	if err := rows.Err(); err != nil {
		return "", err
	}

	return incidentID, nil
}


// CloseIncident marks an ongoing incident resolved as the endpoint recovers
func (r *AlertingRepository) CloseIncident(ctx context.Context, incidentID string) error {
	query := `
		UPDATE incidents 
		SET resolved_at = NOW(), status = 'resolved'
		WHERE id = $1;
	`
	_, err := r.pool.Exec(ctx, query, incidentID)

	return  err
}