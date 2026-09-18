import { Controller, Get, HttpCode, HttpStatus, Inject, OnModuleInit } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { HealthResponse, MonitorConfigServiceClient } from "./monitor.interface.js";
import { Public } from "../common/decorators/public.decorator.js";
import { Observable } from "rxjs";


@Controller("monitor-config")
export class MonitorConfigController implements OnModuleInit {
    private monitorConfigService: MonitorConfigServiceClient
    private client: ClientGrpc

    constructor(@Inject("MONITOR_CONFIG_PACKAGE") client: any) {
        this.client = client as ClientGrpc
    }

    onModuleInit() {
        this.monitorConfigService = this.client.getService<MonitorConfigServiceClient>("MonitorConfigService")
    }

    @Public()
    @Get("health")
    @HttpCode(HttpStatus.OK)
    healthCheck(): Observable<HealthResponse> {
        return this.monitorConfigService.healthCheck({})
    }
}