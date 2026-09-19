import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { DatabaseModule } from './database/database.module.js';
import { MonitorModule } from './monitors/monitor.module.js';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [DatabaseModule, MonitorModule, RabbitmqModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
