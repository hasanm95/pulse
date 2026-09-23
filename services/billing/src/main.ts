import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module.js';

async function bootstrap() {
  // rawBody: true makes req.rawBody available on every request, needed specifically
  // for webhook signature verification - normal JSON parsing still works everywhere else.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'billing',
      protoPath: process.env.BILLING_PROTO_PATH || '/proto/billing.proto',
      url: process.env.BILLING_GRPC_URL || '0.0.0.0:50054',
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3006);

  console.log('Billing HTTP (webhook) + gRPC hybrid service started');
}
bootstrap();