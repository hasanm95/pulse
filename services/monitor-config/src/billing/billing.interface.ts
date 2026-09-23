import { Observable } from "rxjs";

export interface CheckLimitRequest {
    orgId: string;
    limitType: string;
    currentCount: number;
}

export interface CheckLimitResponse {
    allowed: boolean;
    reason: string;
}

export interface BillingServiceClient {
    checkLimit(request: CheckLimitRequest): Observable<CheckLimitResponse>;
}