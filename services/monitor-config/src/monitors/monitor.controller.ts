import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { MonitorService } from "./monitor.service.js";
import { CreateMonitorInput, GetMonitorInput } from "./monitor.repository.js";


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
}