import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, GrpcMethod, Payload } from '@nestjs/microservices';
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
  constructor(
    private readonly monitorService: MonitorService,
    @Inject('RABBITMQ_CLIENT') private readonly client: ClientProxy
  ) {}

  @GrpcMethod('MonitorConfigService', 'HealthCheck')
  healthCheck() {
    return {
      status: 'ok',
    };
  }

  @GrpcMethod('MonitorConfigService', 'CreateMonitor')
  async createMonitor(
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

    const newMonitor = await this.monitorService.createMonitor(input);
    this.client.emit('monitor.created', newMonitor)
    return newMonitor
  }

  @GrpcMethod('MonitorConfigService', 'GetMonitor')
  getMonitor(
    @Payload(
      new GrpcValidationPipe(GetMonitorDto, (value: any) => ({
        id: value.id,
        orgId: value.orgId
      })),
    )
    data: GetMonitorDto,
  ) {
    const input: GetMonitorInput = {
      id: data.id,
      orgId: data.orgId
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
  async updateMonitor(
    @Payload(
      new GrpcValidationPipe(UpdateMonitorDto, (value: any) => ({
        id: value.id,
        orgId: value.orgId,
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
      orgId: data.orgId,
      url: data.url,
      intervalSeconds: data.intervalSeconds,
      regions: data.regions,
      status: data.status,
    };

    const updatedMonitor = this.monitorService.updateMonitor(input);
    this.client.emit('monitor.updated', updatedMonitor)

    return updatedMonitor
  }

  @GrpcMethod('MonitorConfigService', 'DeleteMonitor')
  async deleteMonitor(
    @Payload(
      new GrpcValidationPipe(DeleteMonitorDto, (value: any) => ({
        id: value.id,
        orgId: value.orgId
      })),
    )
    data: DeleteMonitorDto,
  ) {
    const input: DeleteMonitorInput = {
      id: data.id,
      orgId: data.orgId
    };

    await this.monitorService.deleteMonitor(input);
    this.client.emit('monitor.deleted', {id: data.id, orgId: data.orgId})

    return {};
  }
}
