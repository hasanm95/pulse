import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { Plan, PlanRow, Subscription, SubscriptionRow } from './billing.types.js';

@Injectable()
export class BillingRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async getAllPlans(): Promise<Plan[]> {
    const result = await this.pool.query<PlanRow>(
      `SELECT id, name, provider, provider_price_id, max_monitors, min_interval_seconds FROM plans ORDER BY max_monitors ASC`,
    );
    return result.rows.map(this.toPlan);
  }

  async getPlanById(id: string): Promise<Plan | null> {
    const result = await this.pool.query<PlanRow>(
      `SELECT id, name, provider, provider_price_id, max_monitors, min_interval_seconds FROM plans WHERE id = $1`,
      [id],
    );
    return result.rowCount === 0 ? null : this.toPlan(result.rows[0]);
  }

  async getPlanByName(name: string): Promise<Plan | null> {
    const result = await this.pool.query<PlanRow>(
      `SELECT id, name, provider, provider_price_id, max_monitors, min_interval_seconds FROM plans WHERE name = $1`,
      [name],
    );
    return result.rowCount === 0 ? null : this.toPlan(result.rows[0]);
  }

  async getSubscriptionByOrgId(orgId: string): Promise<Subscription | null> {
    const result = await this.pool.query<SubscriptionRow>(
      `SELECT id, org_id, provider, provider_customer_id, provider_subscription_id, plan_id, status, current_period_end
       FROM subscriptions WHERE org_id = $1`,
      [orgId],
    );
    return result.rowCount === 0 ? null : this.toSubscription(result.rows[0]);
  }

  async findByProviderCustomerId(providerCustomerId: string): Promise<Subscription | null> {
    const result = await this.pool.query<SubscriptionRow>(
      `SELECT id, org_id, provider, provider_customer_id, provider_subscription_id, plan_id, status, current_period_end
       FROM subscriptions WHERE provider_customer_id = $1`,
      [providerCustomerId],
    );
    return result.rowCount === 0 ? null : this.toSubscription(result.rows[0]);
  }

  async createPendingSubscription(
    orgId: string,
    planId: string,
    provider: string,
    providerCustomerId: string,
  ): Promise<Subscription> {
    const result = await this.pool.query<SubscriptionRow>(
      `INSERT INTO subscriptions (org_id, plan_id, provider, provider_customer_id, status)
       VALUES ($1, $2, $3, $4, 'pending_checkout')
       RETURNING id, org_id, provider, provider_customer_id, provider_subscription_id, plan_id, status, current_period_end`,
      [orgId, planId, provider, providerCustomerId],
    );
    return this.toSubscription(result.rows[0]);
  }

  async updateSubscriptionByCustomerId(
    providerCustomerId: string,
    fields: { providerSubscriptionId?: string; status?: string; currentPeriodEnd?: Date | null },
  ): Promise<Subscription | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (fields.providerSubscriptionId !== undefined) {
      values.push(fields.providerSubscriptionId);
      setClauses.push(`provider_subscription_id = $${values.length}`);
    }
    if (fields.status !== undefined) {
      values.push(fields.status);
      setClauses.push(`status = $${values.length}`);
    }
    if (fields.currentPeriodEnd !== undefined) {
      values.push(fields.currentPeriodEnd);
      setClauses.push(`current_period_end = $${values.length}`);
    }

    if (setClauses.length === 0) {
      return this.findByProviderCustomerId(providerCustomerId);
    }

    values.push(providerCustomerId);

    const result = await this.pool.query<SubscriptionRow>(
      `UPDATE subscriptions
       SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE provider_customer_id = $${values.length}
       RETURNING id, org_id, provider, provider_customer_id, provider_subscription_id, plan_id, status, current_period_end`,
      values,
    );

    return result.rowCount === 0 ? null : this.toSubscription(result.rows[0]);
  }

  private toPlan(row: PlanRow): Plan {
    return {
      id: row.id,
      name: row.name,
      provider: row.provider,
      providerPriceId: row.provider_price_id,
      maxMonitors: row.max_monitors,
      minIntervalSeconds: row.min_interval_seconds,
    };
  }

  private toSubscription(row: SubscriptionRow): Subscription {
    return {
      id: row.id,
      orgId: row.org_id,
      provider: row.provider,
      providerCustomerId: row.provider_customer_id,
      providerSubscriptionId: row.provider_subscription_id,
      planId: row.plan_id,
      status: row.status,
      currentPeriodEnd: row.current_period_end,
    };
  }
}