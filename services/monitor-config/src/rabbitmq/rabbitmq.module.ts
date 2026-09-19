import { Global, Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";


@Global()
@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'RABBITMQ_CLIENT',
                transport: Transport.RMQ,
                options: {
                    urls: [process.env.RABBITMQ_URL || 'amqp://admin:securepassword123@localhost:5672'],
                    queue: 'monitor_events',
                    queueOptions: {
                        durable: true,
                    },
                }
            }
        ])
    ],
    exports: [ClientsModule],
})

export class RabbitmqModule {}