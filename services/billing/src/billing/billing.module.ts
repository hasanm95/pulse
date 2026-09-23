import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller.js';
import { BillingWebhookController } from './billing-webhook.controller.js';
import { BillingService } from './billing.service.js';
import { BillingRepository } from './billing.repository.js';

@Module({
  controllers: [BillingController, BillingWebhookController],
  providers: [BillingService, BillingRepository],
})
export class BillingModule {}