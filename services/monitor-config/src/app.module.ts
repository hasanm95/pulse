import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { MonitorConfigController } from './monitor-config.controller.js';
import { DatabaseModule } from './database/database.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [DatabaseModule],
  controllers: [MonitorConfigController],
  providers: [],
})
export class AppModule {}
