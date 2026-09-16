import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { AuthController } from './auth.controller.js';

@Module({
    imports: [
        ConfigModule.forRoot(),
        ClientsModule.registerAsync([
            {
                name: "AUTH_PACKAGE",
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.GRPC,
                    options: {
                        package: "auth",
                        protoPath: join(__dirname, "../../../../proto/auth.proto"),
                        url: configService.get<string>('AUTH_SERVICE_URL', 'localhost:50051')
                    }
                })
            }
        ])
    ],
    controllers: [AuthController],
})

export class AuthModule {}
