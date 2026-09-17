import { Controller } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { MonitorService } from './monitor.service.js';
import {
  CreateMonitorDto,
  DeleteMonitorDto,
  GetMonitorDto,
  ListMonitorsDto,
  UpdateMonitorDto,
} from './dto/monitor.dto.js';
import {
  CreateMonitorInput,
  DeleteMonitorInput,
  GetMonitorInput,
  ListMonitorsInput,
  UpdateMonitorInput,
} from './monitor.types.js';
import { GrpcValidationPipe } from '../common/pipes/grpc-validation.pipe.js';

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
  createMonitor(
    @Payload(
      new GrpcValidationPipe(CreateMonitorDto, (value: any) => ({
        orgId: value.orgId,
        url: value.url,
        type: value.type,
        intervalSeconds: value.intervalSeconds,
        regions: value.regions,
      })),
    )
    data: CreateMonitorDto,
  ) {
    const input: CreateMonitorInput = {
      orgId: data.orgId,
      url: data.url,
      type: data.type,
      intervalSeconds: data.intervalSeconds,
      regions: data.regions,
    };

    return this.monitorService.createMonitor(input);
  }

  @GrpcMethod('MonitorConfigService', 'GetMonitor')
  getMonitor(
    @Payload(
      new GrpcValidationPipe(GetMonitorDto, (value: any) => ({
        id: value.id,
      })),
    )
    data: GetMonitorDto,
  ) {
    const input: GetMonitorInput = {
      id: data.id,
    };

    return this.monitorService.getMonitor(input);
  }

  @GrpcMethod('MonitorConfigService', 'ListMonitors')
  async listMonitors(
    @Payload(
      new GrpcValidationPipe(ListMonitorsDto, (value: any) => ({
        orgId: value.orgId,
      })),
    )
    data: ListMonitorsDto,
  ) {
    const input: ListMonitorsInput = {
      orgId: data.orgId,
    };

    const monitors = await this.monitorService.listMonitors(input);

    return {
      monitors,
    };
  }

  @GrpcMethod('MonitorConfigService', 'UpdateMonitor')
  updateMonitor(
    @Payload(
      new GrpcValidationPipe(UpdateMonitorDto, (value: any) => ({
        id: value.id,
        url: value.url,
        intervalSeconds: value.intervalSeconds,
        regions: value.regions,
        status: value.status,
      })),
    )
    data: UpdateMonitorDto,
  ) {
    const input: UpdateMonitorInput = {
      id: data.id,
      url: data.url,
      intervalSeconds: data.intervalSeconds,
      regions: data.regions,
      status: data.status,
    };

    return this.monitorService.updateMonitor(input);
  }

  @GrpcMethod('MonitorConfigService', 'DeleteMonitor')
  async deleteMonitor(
    @Payload(
      new GrpcValidationPipe(DeleteMonitorDto, (value: any) => ({
        id: value.id,
      })),
    )
    data: DeleteMonitorDto,
  ) {
    const input: DeleteMonitorInput = {
      id: data.id,
    };

    await this.monitorService.deleteMonitor(input);

    return {};
  }
}
