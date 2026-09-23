import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  CreateMonitorInput,
  DeleteMonitorInput,
  GetMonitorInput,
  ListMonitorsInput,
  Monitor,
  UpdateMonitorInput,
} from './monitor.types.js';
import { MonitorRepository } from './monitor.repository.js';
import { GrpcError } from '../common/errors/grpc-error.js';
import { BillingServiceClient } from '../billing/billing.interface.js';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MonitorService implements OnModuleInit {
  private billingService: BillingServiceClient;

  constructor(
    private readonly monitorRepository: MonitorRepository, 
    @Inject('BILLING_PACKAGE') private readonly billingClient: ClientGrpc
  ) {}

  onModuleInit() {
    this.billingService = this.billingClient.getService<BillingServiceClient>('BillingService');
  }

  async createMonitor(input: CreateMonitorInput): Promise<Monitor> {
    const currentCount = await this.monitorRepository.countByOrgId(input.orgId);
    const limitCheck = await firstValueFrom(
      this.billingService.checkLimit({
        orgId: input.orgId,
        limitType: 'monitor_count',
        currentCount: currentCount + 1,
      }),
    );

    if (!limitCheck.allowed) {
      throw GrpcError.invalidArgument(limitCheck.reason);
    }

    return this.monitorRepository.create(input);
  }

  async getMonitor(data: GetMonitorInput): Promise<Monitor> {
    const monitor = await this.monitorRepository.getById(data);

    if (!monitor) {
      throw GrpcError.notFound(`Monitor with ID ${data.id} not found`);
    }

    return monitor;
  }

  async listMonitors(data: ListMonitorsInput): Promise<Monitor[]> {
    return this.monitorRepository.getAllMonitors(data);
  }

  async updateMonitor(data: UpdateMonitorInput): Promise<Monitor> {
    const monitor = await this.monitorRepository.update(data);

    if (!monitor) {
      throw GrpcError.notFound(`Monitor with ID ${data.id} not found`);
    }

    return monitor;
  }

  async deleteMonitor(data: DeleteMonitorInput): Promise<void> {
    const wasDeleted = await this.monitorRepository.delete(data);

    if (!wasDeleted) {
      throw GrpcError.notFound(`Monitor with ID ${data.id} not found`);
    }
  }
}
