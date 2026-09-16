import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url))

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: "monitor",
      protoPath: process.env.MONITOR_CONFIG_PROTO_PATH || join(__dirname, '../../dist/proto/monitor-config.proto'),
      url: process.env.MONITOR_CONFIG_SERVICE_URL || '0.0.0.0:50052',
    }
  })
  await app.listen();
  console.log('Monitor Config gRPC microservice is listening on port 50052...');
}
await bootstrap();
