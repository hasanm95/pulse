
export type MonitorType = "http" | "tcp" | "ping";

export type MonitorStatus = "active" | "paused";

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