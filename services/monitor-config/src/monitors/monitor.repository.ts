import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import {
  CreateMonitorInput,
  DeleteMonitorInput,
  GetMonitorInput,
  ListMonitorsInput,
  Monitor,
  MonitorRow,
  MonitorStatus,
  UpdateMonitorInput,
} from './monitor.types.js';

@Injectable()
export class MonitorRepository {
  constructor(
    @Inject('DATABASE_POOL')
    private readonly pool: Pool,
  ) {}

  async create(data: CreateMonitorInput): Promise<Monitor> {
    const result = await this.pool.query<MonitorRow>(
      `
        INSERT INTO monitors (
          org_id,
          url,
          type,
          interval_seconds,
          regions,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          org_id,
          url,
          type,
          interval_seconds,
          regions,
          status,
          created_at,
          updated_at
      `,
      [
        data.orgId,
        data.url,
        data.type,
        data.intervalSeconds,
        data.regions,
        data.status ?? 'active',
      ],
    );

    return this.toMonitor(result.rows[0]);
  }

  async getById(data: GetMonitorInput): Promise<Monitor | null> {
    const result = await this.pool.query<MonitorRow>(
      `
        SELECT
          id,
          org_id,
          url,
          type,
          interval_seconds,
          regions,
          status,
          created_at,
          updated_at
        FROM monitors
        WHERE id = $1
      `,
      [data.id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.toMonitor(result.rows[0]);
  }

  async getAllMonitors(data: ListMonitorsInput): Promise<Monitor[]> {
    const result = await this.pool.query<MonitorRow>(
      `
        SELECT
          id,
          org_id,
          url,
          type,
          interval_seconds,
          regions,
          status,
          created_at,
          updated_at
        FROM monitors
        WHERE org_id = $1
        ORDER BY created_at DESC
      `,
      [data.orgId],
    );

    return result.rows.map((row) => this.toMonitor(row));
  }

  async update(data: UpdateMonitorInput): Promise<Monitor | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    const updateFields: Record<
      string,
      string | number | string[] | MonitorStatus | undefined
    > = {
      url: data.url,
      interval_seconds: data.intervalSeconds,
      regions: data.regions,
      status: data.status,
    };

    for (const [column, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        values.push(value);
        setClauses.push(`${column} = $${values.length}`);
      }
    }

    if (setClauses.length === 0) {
      return this.getById({ id: data.id });
    }

    values.push(data.id);

    const result = await this.pool.query<MonitorRow>(
      `
        UPDATE monitors
        SET
          ${setClauses.join(', ')},
          updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING
          id,
          org_id,
          url,
          type,
          interval_seconds,
          regions,
          status,
          created_at,
          updated_at
      `,
      values,
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.toMonitor(result.rows[0]);
  }

  async delete(data: DeleteMonitorInput): Promise<boolean> {
    const result = await this.pool.query(
      `
        DELETE FROM monitors
        WHERE id = $1
      `,
      [data.id],
    );

    return result.rowCount > 0;
  }

  private toMonitor(row: MonitorRow): Monitor {
    return {
      id: row.id,
      orgId: row.org_id,
      url: row.url,
      type: row.type,
      intervalSeconds: row.interval_seconds,
      regions: row.regions,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
