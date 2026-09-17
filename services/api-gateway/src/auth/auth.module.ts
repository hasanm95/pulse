import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller.js';

@Module({
    imports: [ConfigModule],
    controllers: [AuthController],
})

export class AuthModule {}
