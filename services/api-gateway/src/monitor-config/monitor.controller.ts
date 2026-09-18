import { Controller, Inject, OnModuleInit } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { MonitorConfigServiceClient } from "./monitor.interface.js";


@Controller("monitor_config")
export class MonitorConfigController implements OnModuleInit {
    private monitorConfigService: MonitorConfigServiceClient
    private client: ClientGrpc

    constructor(@Inject("MONITOR_CONFIG_PACKAGE") client: any) {
        this.client = client as ClientGrpc
    }

    onModuleInit() {
        this.monitorConfigService = this.client.getService<MonitorConfigServiceClient>("MonitorConfigService")
    }
}