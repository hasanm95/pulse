import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { DatabaseModule } from './database/database.module.js';
import { MonitorModule } from './monitors/monitor.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [DatabaseModule, MonitorModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
