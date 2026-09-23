import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { MigrationService } from './migration.service.js';

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE_POOL',
      useFactory: async () => {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        await pool.query('SELECT 1');
        return pool;
      },
    },
    MigrationService,
  ],
  exports: ['DATABASE_POOL', MigrationService],
})
export class DatabaseModule {}