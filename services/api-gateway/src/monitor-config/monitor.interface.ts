import { Observable } from "rxjs"


export interface HealthRequest {}

export interface HealthResponse {
    status: string
}

export interface Monitor {
    id: string;
    orgId: string;
    url: string;
    type: string;
    intervalSeconds: number;
    regions: string[];
    status: string;
    createdAt: string;
    updatedAt: string;
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
   monitors: Monitor[];
}

export interface UpdateMonitorRequest {
    id: string;
    orgId: string;
    url?: string;
    intervalSeconds?: number;
    regions?: string[];
    status?: string;
}

export interface DeleteMonitorRequest {
    id: string;
    orgId: string;
}

export interface Empty {}

export interface MonitorConfigServiceClient {
    healthCheck(request: HealthRequest): Observable<HealthResponse>;
    createMonitor(request: CreateMonitorRequest): Observable<Monitor>;
    getMonitor(request: GetMonitorRequest): Observable<Monitor>;
    listMonitors(request: ListMonitorsRequest): Observable<ListMonitorsResponse>;
    updateMonitor(request: UpdateMonitorRequest): Observable<Monitor>;
    deleteMonitor(request: DeleteMonitorRequest): Observable<Empty>
}