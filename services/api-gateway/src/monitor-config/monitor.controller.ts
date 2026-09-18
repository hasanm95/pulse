import { Body, Controller, Get, HttpCode, HttpStatus, Inject, OnModuleInit, Post, Req } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { HealthResponse, Monitor, MonitorConfigServiceClient } from "./monitor.interface.js";
import { Public } from "../common/decorators/public.decorator.js";
import { Observable } from "rxjs";
import { CreateMonitorRequestDto } from "./dto/create-monitor-request.dto.js";


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

    @Post("monitors")
    createMonitor(@Req() request: Request, @Body() reqBody: CreateMonitorRequestDto): Observable<Monitor> {
        const orgId = request["user"].orgId
        return this.monitorConfigService.createMonitor({
            orgId: orgId,
            url: reqBody.url,
            type: reqBody.type,
            regions: reqBody.regions,
            intervalSeconds: reqBody.interval_seconds
        })
    }
}