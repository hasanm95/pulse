import { Global, Module } from "@nestjs/common";
import { RabbitMQModule } from "@golevelup/nestjs-rabbitmq";

@Global()
@Module({
    imports: [
        RabbitMQModule.forRoot({
            exchanges: [
                {
                    name: 'monitor_events',
                    type: 'fanout',
                },
            ],
            uri:  process.env.RABBITMQ_URL || 'amqp://admin:securepassword123@rabbitmq:5672',
            connectionInitOptions: { wait: true },
        }),
    ],
    exports: [RabbitMQModule], 
})
export class RabbitmqModule {}
