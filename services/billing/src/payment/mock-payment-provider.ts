import { randomUUID } from 'crypto';
import { PaymentProvider, CheckoutSessionResult } from './payment-provider.interface.js';
import { NormalizedWebhookEvent } from '../billing/billing.types.js';

export class MockPaymentProvider implements PaymentProvider {
  async createCustomer(orgId: string, email: string): Promise<string> {
    return `mock_cust_${orgId}`;
  }

  async createCheckoutSession(
    providerCustomerId: string,
    providerPriceId: string,
    successUrl: string,
  ): Promise<CheckoutSessionResult> {
    // Real gateways redirect to their own hosted page; mock just points straight
    // to your own success URL with fake IDs attached, so the full loop is testable
    // without ever leaving your machine.
    const fakeSubscriptionId = `mock_sub_${randomUUID()}`;
    return {
      checkoutUrl: `${successUrl}?mock_subscription_id=${fakeSubscriptionId}&customer=${providerCustomerId}`,
    };
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    // No real gateway call - nothing to do
  }

  verifyWebhookSignature(): boolean {
    return true; // no real signature to check in mock mode
  }

  parseWebhookEvent(rawBody: Buffer): NormalizedWebhookEvent {
    const body = JSON.parse(rawBody.toString('utf8'));
    return {
      type: body.type,
      providerCustomerId: body.providerCustomerId,
      providerSubscriptionId: body.providerSubscriptionId,
      status: body.status,
      currentPeriodEnd: body.currentPeriodEnd ? new Date(body.currentPeriodEnd) : undefined,
    };
  }
}