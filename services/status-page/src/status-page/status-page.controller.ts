import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { StatusPageService } from './status-page.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateStatusPageDto } from './dto/create-status-page.dto.js';
import { CreateAnnouncementDto } from './dto/create-announcement.dto.js';

@Controller('status-pages')
export class StatusPageController {
  constructor(private readonly statusPageService: StatusPageService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() request: Request, @Body() body: CreateStatusPageDto) {
    const orgId = request['user'].org_id;
    return this.statusPageService.createPage(orgId, body.slug, body.company_name);
  }

  // Deliberately no guard - public status pages are meant to be viewed without login
  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.statusPageService.getPageBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/announcements')
  async addAnnouncement(
    @Req() request: Request,
    @Param('id') statusPageId: string,
    @Body() body: CreateAnnouncementDto,
  ) {
    const orgId = request['user'].org_id;
    return this.statusPageService.createAnnouncement(orgId, statusPageId, body.message, body.current_status);
  }
}