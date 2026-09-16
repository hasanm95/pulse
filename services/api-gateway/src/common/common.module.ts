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
    ]),
  ],
  exports: [ClientsModule],
})

export class CommonModule {}