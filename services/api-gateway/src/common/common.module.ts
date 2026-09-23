import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Global()
@Module({
    imports: [
    ConfigModule.forRoot({
        isGlobal: true,
    }),
    ClientsModule.registerAsync([
      {
        name: 'AUTH_PACKAGE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'auth',
            protoPath: configService.get('AUTH_PROTO_PATH', '/proto/auth.proto'),
            url: configService.get<string>('AUTH_SERVICE_URL', 'localhost:50051'),
          },
        }),
      },
      {
        name: 'MONITOR_CONFIG_PACKAGE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'monitor_config',
            protoPath: configService.get('MONITOR_CONFIG_PROTO_PATH', '/proto/monitor-config.proto'),
            url: configService.get<string>('MONITOR_CONFIG_SERVICE_URL', 'localhost:50052'),
          },
        }),
      },
      {
        name: 'BILLING_PACKAGE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'billing',
            protoPath: configService.get('BILLING_PROTO_PATH', '/proto/billing.proto'),
            url: configService.get<string>('BILLING_SERVICE_URL', 'localhost:50054'),
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})

export class CommonModule {}