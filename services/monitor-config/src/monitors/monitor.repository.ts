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
import { GrpcError } from '../common/errors/grpc-error.js';

@Injectable()
export class MonitorRepository {
  constructor(
    @Inject('DATABASE_POOL')
    private readonly pool: Pool,
  ) {}

  async create(data: CreateMonitorInput): Promise<Monitor> {
    try {
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
    } catch (error) {
      console.error('Failed to create monitor:', error);
      throw GrpcError.internal();
    }
  }

  async getById(data: GetMonitorInput): Promise<Monitor | null> {
    try {
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
          WHERE id = $1 AND org_id = $2
        `,
        [data.id, data.orgId],
      );

      if (result.rowCount === 0) {
        return null;
      }

      return this.toMonitor(result.rows[0]);
    } catch (error) {
      console.error('Failed to get monitor:', error);
      throw GrpcError.internal();
    }
  }

  async getAllMonitors(data: ListMonitorsInput): Promise<Monitor[]> {
    try {
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
    } catch (error) {
      console.error('Failed to list monitors:', error);
      throw GrpcError.internal();
    }
  }

  async update(data: UpdateMonitorInput): Promise<Monitor | null> {
    try {
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
        return this.getById({ id: data.id, orgId: data.orgId });
      }

      values.push(data.id);
      const idPlaceholder = `$${values.length}`;

      values.push(data.orgId);
      const orgIdPlaceholder = `$${values.length}`;

      const result = await this.pool.query<MonitorRow>(
        `
          UPDATE monitors
          SET
            ${setClauses.join(', ')},
            updated_at = NOW()
          WHERE id =  ${idPlaceholder} AND org_id = ${orgIdPlaceholder}
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
    } catch (error) {
      console.error('Failed to update monitor:', error);
      throw GrpcError.internal();
    }
  }

  async delete(data: DeleteMonitorInput): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `
          DELETE FROM monitors
          WHERE id = $1 AND org_id = $2
        `,
        [data.id, data.orgId],
      );

      return result.rowCount > 0;
    } catch (error) {
      console.error('Failed to delete monitor:', error);
      throw GrpcError.internal();
    }
  }

  async countByOrgId(orgId: string): Promise<number> {
    try {
        const result = await this.pool.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM monitors WHERE org_id = $1`,
            [orgId],
        );
        return parseInt(result.rows[0].count, 10);
    } catch (error) {
        console.error('Failed to count monitors:', error);
        throw GrpcError.internal();
    }
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
