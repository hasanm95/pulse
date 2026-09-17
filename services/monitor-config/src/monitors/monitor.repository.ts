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