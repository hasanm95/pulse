import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MonitorConfigController } from './monitor.controller.js';

@Module({
    imports: [ConfigModule],
    controllers: [MonitorConfigController],
})

export class MonitorConfigModule {}
