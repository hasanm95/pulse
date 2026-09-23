import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

interface CheckCompletedMessage {
  monitorId: string;
  status: string;
  statusCode: number;
  responseTimeMs: number;
}

@Injectable()
export class StatusPageSubscriber {
  private readonly logger = new Logger(StatusPageSubscriber.name);

  @RabbitSubscribe({
    exchange: 'check_events',
    routingKey: 'check.completed',
    queue: 'status_page_check_queue',
  })
  async handleCheckCompleted(msg: CheckCompletedMessage) {
    this.logger.log(`[StatusPage] Received check update for monitor ${msg.monitorId} -> Status: ${msg.status}`);
    // Persisting this into a real "current status per monitor" table is a real next step,
    // deliberately not built yet - needs a monitors-to-status-page mapping that doesn't exist
    // as a design decision yet, not something to invent silently here
  }
}