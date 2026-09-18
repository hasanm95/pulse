export type MonitorType = 'http' | 'tcp' | 'ping';

export type MonitorStatus = 'active' | 'paused';

export interface Monitor {
  id: string;
  orgId: string;
  url: string;
  type: MonitorType;
  intervalSeconds: number;
  regions: string[];
  status: MonitorStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonitorRow {
  id: string;
  org_id: string;
  url: string;
  type: MonitorType;
  interval_seconds: number;
  regions: string[];
  status: MonitorStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMonitorInput {
  orgId: string;
  url: string;
  type: MonitorType;
  intervalSeconds: number;
  regions: string[];
  status?: MonitorStatus;
}

export interface GetMonitorInput {
  id: string;
  orgId: string;
}

export interface ListMonitorsInput {
  orgId: string;
}

export interface UpdateMonitorInput {
  id: string;
  orgId: string;
  url?: string;
  intervalSeconds?: number;
  regions?: string[];
  status?: MonitorStatus;
}

export interface DeleteMonitorInput {
  id: string;
  orgId: string;
}
