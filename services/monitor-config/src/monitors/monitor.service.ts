import { Injectable } from "@nestjs/common";
import { CreateMonitorInput, GetMonitorInput, MonitorRepository } from "./monitor.repository.js";
import { Monitor, MonitorRow } from "./monitor.types.js";


@Injectable()
export class MonitorService {
    constructor(private readonly monitorRepository: MonitorRepository){}

    async createMonitor(input: CreateMonitorInput): Promise<Monitor> {
        return this.monitorRepository.create(input)
    }

    async getMonitor(data: GetMonitorInput): Promise<Monitor> {
        return this.monitorRepository.getById(data)
    }
}