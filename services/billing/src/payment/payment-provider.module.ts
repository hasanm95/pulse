import { Global, Module } from '@nestjs/common';
import { PAYMENT_PROVIDER } from './payment-provider.interface.js';
import { MockPaymentProvider } from './mock-payment-provider.js';

@Global()
@Module({
  providers: [
    {
      provide: PAYMENT_PROVIDER,
      useFactory: () => {
        const providerName = process.env.PAYMENT_PROVIDER || 'mock';
        switch (providerName) {
          case 'mock':
            return new MockPaymentProvider();
          // case 'sslcommerz':
          //   return new SslcommerzProvider(process.env.SSLCOMMERZ_STORE_ID, ...);
          default:
            throw new Error(`Unknown PAYMENT_PROVIDER: ${providerName}`);
        }
      },
    },
  ],
  exports: [PAYMENT_PROVIDER],
})
export class PaymentProviderModule {}