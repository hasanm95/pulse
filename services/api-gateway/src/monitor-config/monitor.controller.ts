import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, OnModuleInit, Param, Patch, Post, Req } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { Empty, HealthResponse, ListMonitorsResponse, Monitor, MonitorConfigServiceClient } from "./monitor.interface.js";
import { Public } from "../common/decorators/public.decorator.js";
import { Observable } from "rxjs";
import { CreateMonitorRequestDto, MonitorParamDto, UpdateMonitorRequestDto } from "./dto/monitor.dto.js";
import { Request } from "express";


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

    @Get("monitors/:id")
    getMonitor(@Req() request: Request, @Param() param: MonitorParamDto): Observable<Monitor>  {
        const orgId = request["user"].orgId
        return this.monitorConfigService.getMonitor({
            id: param.id,
            orgId: orgId
        })
    }

    @Get("monitors")
    listMonitors(@Req() request: Request): Observable<ListMonitorsResponse> {
        const orgId = request["user"].orgId
        return this.monitorConfigService.listMonitors({
            orgId: orgId
        })
    }

    @Patch("monitors/:id")
    updateMonitor(@Req() request: Request, @Param() param: MonitorParamDto, @Body() reqBody: UpdateMonitorRequestDto): Observable<Monitor> {
        const orgId = request["user"].orgId
        return this.monitorConfigService.updateMonitor({
            id: param.id,
            orgId: orgId,
            url: reqBody.url,
            intervalSeconds: reqBody.intervalSeconds,
            regions: reqBody.regions,
            status: reqBody.status
        })
    }

    @Delete("monitors/:id")
    deleteMonitor(@Req() request: Request, @Param() param: MonitorParamDto): Observable<Empty> {
        const orgId = request["user"].orgId
        return this.monitorConfigService.deleteMonitor({
            id: param.id,
            orgId: orgId
        })
    }
}