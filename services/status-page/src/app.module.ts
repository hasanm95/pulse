import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DatabaseModule } from './database/database.module.js';
import { StatusPageModule } from './status-page/status-page.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    JwtModule.register({
      global: true,
      secret: process.env.SECRET_KEY, // required, no fallback - throws on boot if unset
      signOptions: { expiresIn: '1d' },
    }),
    RabbitMQModule.forRoot({
      exchanges: [
        { name: 'monitor_events', type: 'fanout' },
        { name: 'check_events', type: 'topic' },
      ],
      uri: process.env.RABBITMQ_URL, // required, no hardcoded fallback credentials
      connectionInitOptions: { wait: true },
    }),
    StatusPageModule,
  ],
})
export class AppModule {}