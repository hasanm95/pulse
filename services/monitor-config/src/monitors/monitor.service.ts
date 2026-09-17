import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  CreateMonitorInput,
  DeleteMonitorInput,
  GetMonitorInput,
  ListMonitorsInput,
  Monitor,
  UpdateMonitorInput,
} from './monitor.types.js';
import { MonitorRepository } from './monitor.repository.js';

@Injectable()
export class MonitorService {
  constructor(private readonly monitorRepository: MonitorRepository) {}

  async createMonitor(input: CreateMonitorInput): Promise<Monitor> {
    return this.monitorRepository.create(input);
  }

  async getMonitor(data: GetMonitorInput): Promise<Monitor> {
    const monitor = await this.monitorRepository.getById(data);

    if (!monitor) {
      throw new RpcException({
        code: 5,
        message: `Monitor with ID ${data.id} not found`,
      });
    }

    return monitor;
  }

  async listMonitors(data: ListMonitorsInput): Promise<Monitor[]> {
    return this.monitorRepository.getAllMonitors(data);
  }

  async updateMonitor(data: UpdateMonitorInput): Promise<Monitor> {
    const input: UpdateMonitorInput = {
      ...data,
      intervalSeconds:
        data.intervalSeconds !== undefined
          ? Math.max(data.intervalSeconds, 10)
          : undefined,
    };

    const monitor = await this.monitorRepository.update(input);

    if (!monitor) {
      throw new RpcException({
        code: 5,
        message: `Monitor with ID ${data.id} not found`,
      });
    }

    return monitor;
  }

  async deleteMonitor(data: DeleteMonitorInput): Promise<void> {
    const wasDeleted = await this.monitorRepository.delete(data);

    if (!wasDeleted) {
      throw new RpcException({
        code: 5,
        message: `Monitor with ID ${data.id} not found`,
      });
    }
  }
}
