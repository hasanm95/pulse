import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { MonitorService } from "./monitor.service.js";
import { CreateMonitorInput, GetMonitorInput, ListMonitorsIput } from "./monitor.repository.js";


@Controller()
export class MonitorController {
    constructor(private readonly monitorService: MonitorService){}

    @GrpcMethod("MonitorConfigService", "HealthCheck")
    healthCheck() {
        return {
            status: "ok"
        }
    }

    @GrpcMethod("MonitorConfigService", "CreateMonitor")
    createMonitor(data: CreateMonitorInput) {
        return this.monitorService.createMonitor(data)
    }

    @GrpcMethod("MonitorConfigService", "GetMonitor")
    getMonitor(data: GetMonitorInput){
        return this.monitorService.getMonitor(data)
    }

    @GrpcMethod("MonitorConfigService", "ListMonitors")
    async listMonitors(data: ListMonitorsIput) {
        const monitorsArray = await this.monitorService.listMonitors(data)

        return {
            monitors: monitorsArray
        }
    }
}