import { BadRequestException, Controller, Headers, Inject, Post, Req, UnauthorizedException } from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service.js';
import { PAYMENT_PROVIDER, PaymentProvider } from '../payment/payment-provider.interface.js';

@Controller('billing/webhook')
export class BillingWebhookController {
  constructor(
    private readonly billingService: BillingService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
  ) {}

  @Post()
  async handleWebhook(@Req() req: RawBodyRequest<Request>, @Headers() headers: Record<string, string>) {
    if (!req.rawBody) {
      // Only happens if `rawBody: true` wasn't set on the Nest app - fail loudly,
      // don't silently accept an unverifiable webhook.
      throw new BadRequestException('Raw body not available - check app bootstrap config');
    }

    const isValid = this.paymentProvider.verifyWebhookSignature(req.rawBody, headers);
    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = this.paymentProvider.parseWebhookEvent(req.rawBody);
    await this.billingService.applyWebhookEvent(event);

    return { received: true };
  }
}