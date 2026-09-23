import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'BILLING_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'billing',
                    protoPath: process.env.BILLING_PROTO_PATH || '/proto/billing.proto',
                    url: process.env.BILLING_SERVICE_URL || 'localhost:50054',
                },
            },
        ]),
    ],
    exports: [ClientsModule],
})
export class BillingClientModule {}