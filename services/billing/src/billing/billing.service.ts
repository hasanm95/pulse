import { Inject, Injectable } from '@nestjs/common';
import { BillingRepository } from './billing.repository.js';
import { GrpcError } from '../common/errors/grpc-error.js';
import { PAYMENT_PROVIDER, PaymentProvider } from '../payment/payment-provider.interface.js';
import { NormalizedWebhookEvent, Plan } from './billing.types.js';

const FREE_PLAN_NAME = 'free';

@Injectable()
export class BillingService {
  constructor(
    private readonly repository: BillingRepository,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
  ) {}

  async getPlans() {
    return this.repository.getAllPlans();
  }

  async getEffectivePlan(orgId: string): Promise<Plan> {
    const subscription = await this.repository.getSubscriptionByOrgId(orgId);

    if (subscription && subscription.status === 'active') {
      const plan = await this.repository.getPlanById(subscription.planId);
      if (plan) return plan;
    }

    // No active subscription - fall back to the seeded free plan, not an error.
    // Deliberate v1 simplification: orgs aren't auto-provisioned a subscription
    // row at signup, so "no row" and "on the free tier" are treated as the same thing.
    const freePlan = await this.repository.getPlanByName(FREE_PLAN_NAME);
    if (!freePlan) {
      throw GrpcError.internal(`No '${FREE_PLAN_NAME}' plan seeded - cannot determine limits`);
    }
    return freePlan;
  }

  async subscribe(orgId: string, planId: string, email: string, successUrl: string, cancelUrl: string) {
    const plan = await this.repository.getPlanById(planId);
    if (!plan) {
      throw GrpcError.notFound(`Plan '${planId}' not found`);
    }

    const existing = await this.repository.getSubscriptionByOrgId(orgId);
    if (existing && existing.status === 'active') {
      // Plan changes/upgrades deliberately not handled yet - flagged, not silently ignored
      throw GrpcError.alreadyExists('Organization already has an active subscription');
    }

    const providerCustomerId = existing?.providerCustomerId
      ?? await this.paymentProvider.createCustomer(orgId, email);

    if (!existing) {
      await this.repository.createPendingSubscription(orgId, plan.id, plan.provider, providerCustomerId);
    }

    const session = await this.paymentProvider.createCheckoutSession(
      providerCustomerId,
      plan.providerPriceId,
      successUrl,
      cancelUrl,
    );

    return session.checkoutUrl;
  }

  async cancelSubscription(orgId: string) {
    const subscription = await this.repository.getSubscriptionByOrgId(orgId);
    if (!subscription || !subscription.providerSubscriptionId) {
      throw GrpcError.notFound(`No active subscription found for org '${orgId}'`);
    }

    await this.paymentProvider.cancelSubscription(subscription.providerSubscriptionId);
    // Final status change happens via the webhook, not assumed here - the gateway
    // is the source of truth for whether cancellation actually succeeded.
  }

  async getUsage(orgId: string) {
    // Deliberate scope limit: this returns plan LIMITS only. Billing doesn't own
    // monitor counts - combining this with actual usage is Gateway's job, calling
    // Monitor Config separately, same reasoning as CheckLimit's design.
    return this.getEffectivePlan(orgId);
  }

  async checkLimit(orgId: string, limitType: string, currentCount: number): Promise<{ allowed: boolean; reason: string }> {
    const plan = await this.getEffectivePlan(orgId);

    if (limitType === 'monitor_count') {
      const allowed = currentCount <= plan.maxMonitors;
      return {
        allowed,
        reason: allowed ? '' : `Plan '${plan.name}' allows up to ${plan.maxMonitors} monitors`,
      };
    }

    // Unknown limit types pass through rather than blocking - extensible for
    // future limits (check interval, regions, etc.) without breaking existing callers
    return { allowed: true, reason: '' };
  }

  async applyWebhookEvent(event: NormalizedWebhookEvent) {
    switch (event.type) {
      case 'subscription.active':
        await this.repository.updateSubscriptionByCustomerId(event.providerCustomerId, {
          providerSubscriptionId: event.providerSubscriptionId,
          status: 'active',
          currentPeriodEnd: event.currentPeriodEnd ?? null,
        });
        break;
      case 'subscription.canceled':
        await this.repository.updateSubscriptionByCustomerId(event.providerCustomerId, {
          status: 'canceled',
        });
        break;
      case 'payment.failed':
        await this.repository.updateSubscriptionByCustomerId(event.providerCustomerId, {
          status: 'past_due',
        });
        break;
    }
  }
}