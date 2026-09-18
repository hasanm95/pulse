import { Observable } from "rxjs"


export interface HealthRequest {}

export interface HealthResponse {
    status: string
}

export interface MonitorConfigServiceClient {
    healthCheck(request: HealthRequest): Observable<HealthResponse>;
}