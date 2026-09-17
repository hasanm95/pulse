import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { MonitorService } from "./monitor.service.js";
import { CreateMonitorInput } from "./monitor.repository.js";


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
    createMonitory(data: CreateMonitorInput) {
        return this.monitorService.createMonitor(data)
    }
}