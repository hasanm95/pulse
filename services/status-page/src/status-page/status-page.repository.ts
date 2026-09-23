import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import {
  Announcement,
  AnnouncementRow,
  CreateAnnouncementInput,
  CreateStatusPageInput,
  StatusPage,
  StatusPageRow,
} from './status-page.types.js';

@Injectable()
export class StatusPageRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async create(data: CreateStatusPageInput): Promise<StatusPage> {
    const result = await this.pool.query<StatusPageRow>(
      `INSERT INTO status_pages (org_id, slug, company_name)
       VALUES ($1, $2, $3)
       RETURNING id, org_id, slug, company_name, created_at, updated_at`,
      [data.orgId, data.slug, data.companyName],
    );
    return this.toStatusPage(result.rows[0]);
  }

  async getBySlug(slug: string): Promise<StatusPage | null> {
    const result = await this.pool.query<StatusPageRow>(
      `SELECT id, org_id, slug, company_name, created_at, updated_at
       FROM status_pages WHERE slug = $1`,
      [slug],
    );
    if (result.rowCount === 0) return null;
    return this.toStatusPage(result.rows[0]);
  }

  async getByIdForOrg(id: string, orgId: string): Promise<StatusPage | null> {
    const result = await this.pool.query<StatusPageRow>(
      `SELECT id, org_id, slug, company_name, created_at, updated_at
       FROM status_pages WHERE id = $1 AND org_id = $2`,
      [id, orgId],
    );
    if (result.rowCount === 0) return null;
    return this.toStatusPage(result.rows[0]);
  }

  async createAnnouncement(data: CreateAnnouncementInput): Promise<Announcement> {
    const result = await this.pool.query<AnnouncementRow>(
      `INSERT INTO incident_announcements (status_page_id, message, current_status)
       VALUES ($1, $2, $3)
       RETURNING id, status_page_id, incident_id, message, current_status, created_at`,
      [data.statusPageId, data.message, data.currentStatus],
    );
    return this.toAnnouncement(result.rows[0]);
  }

  async listAnnouncements(statusPageId: string, limit: number): Promise<Announcement[]> {
    const result = await this.pool.query<AnnouncementRow>(
      `SELECT id, status_page_id, incident_id, message, current_status, created_at
       FROM incident_announcements
       WHERE status_page_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [statusPageId, limit],
    );
    return result.rows.map((row) => this.toAnnouncement(row));
  }

  private toStatusPage(row: StatusPageRow): StatusPage {
    return {
      id: row.id,
      orgId: row.org_id,
      slug: row.slug,
      companyName: row.company_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toAnnouncement(row: AnnouncementRow): Announcement {
    return {
      id: row.id,
      statusPageId: row.status_page_id,
      incidentId: row.incident_id,
      message: row.message,
      currentStatus: row.current_status,
      createdAt: row.created_at,
    };
  }
}