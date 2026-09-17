import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ReflectionService } from '@grpc/reflection';
import { AppModule } from './app.module.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'monitor_config',
        protoPath:
          process.env.MONITOR_CONFIG_PROTO_PATH ||
          join(__dirname, '../../dist/proto/monitor-config.proto'),
        url:
          process.env.MONITOR_CONFIG_SERVICE_URL ||
          '0.0.0.0:50052',
        onLoadPackageDefinition: (packageDefinition, grpcServer) => {
          const reflectionService = new ReflectionService(packageDefinition);
          reflectionService.addToServer(grpcServer);
        },
      },
    },
  );

  await app.listen();

  console.log(
    'Monitor Config gRPC microservice is listening on port 50052...',
  );
}

await bootstrap();