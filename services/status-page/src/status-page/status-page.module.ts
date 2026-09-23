import { Module } from '@nestjs/common';
import { StatusPageController } from './status-page.controller.js';
import { StatusPageService } from './status-page.service.js';
import { StatusPageRepository } from './status-page.repository.js';
import { StatusPageSubscriber } from './status-page.subscriber.js';

@Module({
  controllers: [StatusPageController],
  providers: [StatusPageService, StatusPageRepository, StatusPageSubscriber],
})
export class StatusPageModule {}