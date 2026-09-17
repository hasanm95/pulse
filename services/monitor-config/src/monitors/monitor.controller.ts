import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { MonitorService } from './monitor.service.js';
import {
  CreateMonitorInput,
  DeleteMonitorInput,
  GetMonitorInput,
  ListMonitorsInput,
  UpdateMonitorInput,
} from './monitor.types.js';

@Controller()
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @GrpcMethod('MonitorConfigService', 'HealthCheck')
  healthCheck() {
    return {
      status: 'ok',
    };
  }

  @GrpcMethod('MonitorConfigService', 'CreateMonitor')
  createMonitor(data: CreateMonitorInput) {
    return this.monitorService.createMonitor(data);
  }

  @GrpcMethod('MonitorConfigService', 'GetMonitor')
  getMonitor(data: GetMonitorInput) {
    return this.monitorService.getMonitor(data);
  }

  @GrpcMethod('MonitorConfigService', 'ListMonitors')
  async listMonitors(data: ListMonitorsInput) {
    const monitors = await this.monitorService.listMonitors(data);

    return {
      monitors,
    };
  }

  @GrpcMethod('MonitorConfigService', 'UpdateMonitor')
  updateMonitor(data: UpdateMonitorInput) {
    return this.monitorService.updateMonitor(data);
  }

  @GrpcMethod('MonitorConfigService', 'DeleteMonitor')
  async deleteMonitor(data: DeleteMonitorInput) {
    await this.monitorService.deleteMonitor(data);

    return {};
  }
}
