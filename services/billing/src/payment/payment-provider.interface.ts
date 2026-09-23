import { NormalizedWebhookEvent } from '../billing/billing.types.js';

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export interface CheckoutSessionResult {
  checkoutUrl: string;
}

export interface PaymentProvider {
  createCustomer(orgId: string, email: string): Promise<string>;
  createCheckoutSession(
    providerCustomerId: string,
    providerPriceId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<CheckoutSessionResult>;
  cancelSubscription(providerSubscriptionId: string): Promise<void>;
  verifyWebhookSignature(rawBody: Buffer, headers: Record<string, string>): boolean;
  parseWebhookEvent(rawBody: Buffer): NormalizedWebhookEvent;
}