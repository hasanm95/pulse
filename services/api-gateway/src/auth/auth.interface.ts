import { Observable } from "rxjs";


export interface HealthRequest {}

export interface HealthResponse {
    status: string;
}

export interface AuthServiceClient {
    healthCheck(request: HealthRequest): Observable<HealthResponse>;
}