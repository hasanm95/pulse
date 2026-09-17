import { Injectable } from "@nestjs/common";
import { CreateMonitorInput, DeleteMonitorInput, GetMonitorInput, ListMonitorsIput, MonitorRepository } from "./monitor.repository.js";
import { Monitor, MonitorRow, UpdateMonitorGrpcPayload } from "./monitor.types.js";


@Injectable()
export class MonitorService {
    constructor(private readonly monitorRepository: MonitorRepository){}

    async createMonitor(input: CreateMonitorInput): Promise<Monitor> {
        return this.monitorRepository.create(input)
    }

    async getMonitor(data: GetMonitorInput): Promise<Monitor> {
        return this.monitorRepository.getById(data)
    }

    async listMonitors(data: ListMonitorsIput): Promise<Monitor[]> {
        return this.monitorRepository.getAllMonitors(data)
    }

    async updateMonitor(data: UpdateMonitorGrpcPayload): Promise<Monitor> {
        if (data.intervalSeconds !== undefined && data.intervalSeconds < 10) {
            data.intervalSeconds = 10;
        }

        return this.monitorRepository.update({
            id: data.id,
            url: data.url,
            interval_seconds: data.intervalSeconds,
            regions: data.regions,
            status: data.status,
        });
    }

    async deleteMonitor(data: DeleteMonitorInput): Promise<void> {
    const wasDeleted = await this.monitorRepository.delete({ id: data.id });
    
    if (!wasDeleted) {
        throw new Error(`Monitor with ID ${data.id} not found`);
    }
    }
}