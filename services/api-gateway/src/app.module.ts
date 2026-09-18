import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { CommonModule } from './common/common.module.js';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './common/guards/auth.guard.js';
import { MonitorConfigModule } from './monitor-config/monitor.module.js';

@Module({
  imports: [CommonModule, AuthModule, MonitorConfigModule],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    }
  ],
})
export class AppModule {}
