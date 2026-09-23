import { Observable } from "rxjs";


export interface HealthRequest{}
export interface HealthResponse {
    status: string
}

export interface Plan {
    id: string;
    name: string;
    providerPriceId: string;
    maxMonitors: number;
    minIntervalSeconds: number;
}

export interface GetPlansRequest {}
export interface GetPlansResponse {
    plans: Plan[];
}

export interface SubscribeRequest {
    orgId: string;
    planId: string;
    email: string;
    successUrl: string;
    cancelUrl: string;
}
export interface SubscribeResponse {
    checkoutUrl: string;
}

export interface CancelSubscriptionRequest {
    orgId: string;
}
export interface CancelSubscriptionResponse {}

export interface GetUsageRequest {
    orgId: string;
}
export interface GetUsageResponse {
    planId: string;
    planName: string;
    maxMonitors: number;
    minIntervalSeconds: number;
}

export interface BillingServiceClient {
    healthCheck(request: HealthRequest): Observable<HealthResponse>;
    getPlans(request: GetPlansRequest): Observable<GetPlansResponse>;
    subscribe(request: SubscribeRequest): Observable<SubscribeResponse>;
    cancelSubscription(request: CancelSubscriptionRequest): Observable<CancelSubscriptionResponse>;
    getUsage(request: GetUsageRequest): Observable<GetUsageResponse>;
}