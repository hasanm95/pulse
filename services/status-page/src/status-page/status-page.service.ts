import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { StatusPageRepository } from './status-page.repository.js';
import { Announcement, CreateAnnouncementInput, StatusPage } from './status-page.types.js';

@Injectable()
export class StatusPageService {
  constructor(private readonly repository: StatusPageRepository) {}

  async createPage(orgId: string, slug: string, companyName: string): Promise<StatusPage> {
    return this.repository.create({ orgId, slug, companyName });
  }

  async getPageBySlug(slug: string): Promise<{ page: StatusPage; announcements: Announcement[] }> {
    const page = await this.repository.getBySlug(slug);
    if (!page) {
      throw new NotFoundException(`Status page with slug '${slug}' not found`);
    }
    const announcements = await this.repository.listAnnouncements(page.id, 10);
    return { page, announcements };
  }

  async createAnnouncement(
    orgId: string,
    statusPageId: string,
    message: string,
    currentStatus: string,
  ): Promise<Announcement> {
    // Ownership check: this org must actually own this status page
    const page = await this.repository.getByIdForOrg(statusPageId, orgId);
    if (!page) {
      // Same NotFoundException whether it doesn't exist or belongs to someone else -
      // never reveal which, same reasoning as Login's identical error message
      throw new NotFoundException(`Status page with ID '${statusPageId}' not found`);
    }

    return this.repository.createAnnouncement({ statusPageId, message, currentStatus });
  }
}