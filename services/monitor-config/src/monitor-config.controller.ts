import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";


@Controller()
export class MonitorConfigController {

    @GrpcMethod("MonitorConfigService", "HealthCheck")
    healthCheck() {
        return {
            status: "ok"
        }
    }
}