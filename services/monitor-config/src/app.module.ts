import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { MonitorConfigController } from './monitor-config.controller.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [],
  controllers: [MonitorConfigController],
  providers: [],
})
export class AppModule {}
