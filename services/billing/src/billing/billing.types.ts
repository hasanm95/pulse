export interface Plan {
  id: string;
  name: string;
  provider: string;
  providerPriceId: string;
  maxMonitors: number;
  minIntervalSeconds: number;
}

export interface PlanRow {
  id: string;
  name: string;
  provider: string;
  provider_price_id: string;
  max_monitors: number;
  min_interval_seconds: number;
}

export interface Subscription {
  id: string;
  orgId: string;
  provider: string;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  planId: string;
  status: string;
  currentPeriodEnd: Date | null;
}

export interface SubscriptionRow {
  id: string;
  org_id: string;
  provider: string;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  plan_id: string;
  status: string;
  current_period_end: Date | null;
}

export interface NormalizedWebhookEvent {
  type: 'subscription.active' | 'subscription.canceled' | 'payment.failed';
  providerCustomerId: string;
  providerSubscriptionId?: string;
  status: string;
  currentPeriodEnd?: Date;
}