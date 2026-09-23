import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { BillingService } from './billing.service.js';

@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @GrpcMethod('BillingService', 'HealthCheck')
  healthCheck() {
    return { status: 'ok' };
  }

  @GrpcMethod('BillingService', 'GetPlans')
  async getPlans() {
    const plans = await this.billingService.getPlans();
    return {
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        providerPriceId: p.providerPriceId,
        maxMonitors: p.maxMonitors,
        minIntervalSeconds: p.minIntervalSeconds,
      })),
    };
  }

  @GrpcMethod('BillingService', 'Subscribe')
  async subscribe(data: { orgId: string; planId: string; email: string; successUrl: string; cancelUrl: string }) {
    const checkoutUrl = await this.billingService.subscribe(
      data.orgId,
      data.planId,
      data.email,
      data.successUrl,
      data.cancelUrl,
    );
    return { checkoutUrl };
  }

  @GrpcMethod('BillingService', 'CancelSubscription')
  async cancelSubscription(data: { orgId: string }) {
    await this.billingService.cancelSubscription(data.orgId);
    return {};
  }

  @GrpcMethod('BillingService', 'GetUsage')
  async getUsage(data: { orgId: string }) {
    const plan = await this.billingService.getUsage(data.orgId);
    return {
      planId: plan.id,
      planName: plan.name,
      maxMonitors: plan.maxMonitors,
      minIntervalSeconds: plan.minIntervalSeconds,
    };
  }

  @GrpcMethod('BillingService', 'CheckLimit')
  async checkLimit(data: { orgId: string; limitType: string; currentCount: number }) {
    return this.billingService.checkLimit(data.orgId, data.limitType, data.currentCount);
  }
}