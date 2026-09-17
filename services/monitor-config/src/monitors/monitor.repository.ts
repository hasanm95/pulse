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

@Injectable()
export class MonitorRepository {
    constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

    async create(input: CreateMonitorInput): Promise<Monitor> {
        const result = await this.pool.query(
            `
                INSERT INTO monitors (org_id, url, type, interval_seconds, regions, status)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, org_id, url, type, interval_seconds, regions, status, created_at, updated_at
            `,
            [
                input.orgId,
                input.url,
                input.type,
                input.intervalSeconds,
                input.regions,
                input.status ?? "active",
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