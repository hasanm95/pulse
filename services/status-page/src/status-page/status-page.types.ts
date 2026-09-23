export interface StatusPage {
  id: string;
  orgId: string;
  slug: string;
  companyName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StatusPageRow {
  id: string;
  org_id: string;
  slug: string;
  company_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Announcement {
  id: string;
  statusPageId: string;
  incidentId: string | null;
  message: string;
  currentStatus: string;
  createdAt: Date;
}

export interface AnnouncementRow {
  id: string;
  status_page_id: string;
  incident_id: string | null;
  message: string;
  current_status: string;
  created_at: Date;
}

export interface CreateStatusPageInput {
  orgId: string;
  slug: string;
  companyName: string;
}

export interface CreateAnnouncementInput {
  statusPageId: string;
  message: string;
  currentStatus: string;
}