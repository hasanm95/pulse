import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { Monitor, MonitorRow, MonitorStatus, MonitorType } from "./monitor.types.js";

export interface CreateMonitorInput {
    orgId: string;
    url: string;
    type: MonitorType;
    intervalSeconds: number;
    regions: string[];
    status?: MonitorStatus;
}

export interface GetMonitorInput {
    id: string;
}

export interface ListMonitorsIput {
    orgId: string;
}

export interface UpdateMonitorInput {
  id: string;
  url?: string;
  interval_seconds?: number;
  regions?: string[];
  status?: string;
}

export interface DeleteMonitorInput {
    id: string;
}

@Injectable()
export class MonitorRepository {
    constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

    async create(data: CreateMonitorInput): Promise<Monitor> {
        const result = await this.pool.query(
            `
                INSERT INTO monitors (org_id, url, type, interval_seconds, regions, status)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, org_id, url, type, interval_seconds, regions, status, created_at, updated_at
            `,
            [
                data.orgId,
                data.url,
                data.type,
                data.intervalSeconds,
                data.regions,
                data.status ?? "active",
            ]
        )

        return this.toMonitor(result.rows[0])
    }

    async getById(data: GetMonitorInput): Promise<Monitor> {
        const result = await this.pool.query(
            `SELECT id, org_id, url, type, interval_seconds, regions, status, created_at, updated_at FROM monitors WHERE id = $1`,
            [data.id]
        )

        return this.toMonitor(result.rows[0])
    }

    async getAllMonitors(data: ListMonitorsIput): Promise<Monitor[]> {
        const result = await this.pool.query(
            `SELECT id, org_id, url, type, interval_seconds, regions, status, created_at, updated_at FROM monitors WHERE org_id = $1`,
            [data.orgId]
        )

        let monitors: Monitor[] = []

        if (result.rowCount > 0) {
            for(let i = 0; i < result.rowCount; i++){
                const monitor = this.toMonitor(result.rows[i])
                monitors.push(monitor)
            }
        }
        
        return monitors;
    }

    async update(data: UpdateMonitorInput): Promise<Monitor> {
        const { id, ...fieldsToUpdate } = data;
        
        const setClauses: string[] = [];
        const values: any[] = [id];
        let paramIndex = 2;

        Object.entries(fieldsToUpdate).forEach(([key, value]) => {
            if (value !== undefined) {
                setClauses.push(`${key} = \$${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        });

        if (setClauses.length === 0) {
            const existing = await this.getById({ id });
            if (!existing) throw new Error(`Monitor with ID ${id} not found`);
            return existing;
        }

        const query = `
            UPDATE monitors 
            SET ${setClauses.join(', ')}, updated_at = NOW()
            WHERE id = $1
            RETURNING id, org_id, url, type, interval_seconds, regions, status, created_at, updated_at
        `;

        const result = await this.pool.query(query, values);
        
        if (result.rowCount === 0) {
            throw new Error(`Monitor with ID ${id} not found`);
        }

        return this.toMonitor(result.rows[0]);
    }

    async delete(data: DeleteMonitorInput) {
        const result = await this.pool.query("DELETE FROM monitors WHERE id = $1", [data.id])
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
        }
    }

}