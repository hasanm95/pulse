import { Observable } from "rxjs"


export interface HealthRequest {}

export interface HealthResponse {
    status: string
}

export interface Monitor {
    id: string;
    org_id: string;
    url: string;
    type: string;
    interval_seconds: number;
    regions: string[];
    status: string;
    created_at: string;
    updated_at: string;
}

export interface CreateMonitorRequest {
    orgId: string;
    url: string;
    type: string;
    intervalSeconds: number;
    regions: string[];
}

export interface GetMonitorRequest {
    id: string;
    orgId: string;
}

export interface ListMonitorsRequest {
   orgId: string;
}

export interface ListMonitorsResponse {
   monitors: string[];
}

export interface UpdateMonitorRequest {
    id: string;
    orgId: string;
    url?: string;
    intervalSeconds?: number;
    regions?: string[];
    status?: string;
}

export interface MonitorConfigServiceClient {
    healthCheck(request: HealthRequest): Observable<HealthResponse>;
    createMonitor(request: CreateMonitorRequest): Observable<Monitor>;
    getMonitor(request: GetMonitorRequest): Observable<Monitor>;
    listMonitors(request: ListMonitorsRequest): Observable<ListMonitorsResponse>;
    updateMonitor(request: UpdateMonitorRequest): Observable<Monitor>;
}