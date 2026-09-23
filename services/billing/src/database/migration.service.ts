import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class MigrationService implements OnModuleInit {
  constructor(
    @Inject('DATABASE_POOL')
    private readonly pool: Pool,
  ) {}

  async onModuleInit() {
    await this.runMigrations();
  }

  private async runMigrations() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = join(process.cwd(), 'migrations');

    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const version = file.replace('.sql', '');

      const result = await this.pool.query(
        `SELECT 1 FROM schema_migrations WHERE version = $1`,
        [version],
      );

      if (result.rowCount !== 0) {
        continue;
      }

      const sql = await readFile(join(migrationsDir, file), 'utf8');

      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          `INSERT INTO schema_migrations (version) VALUES ($1)`,
          [version],
        );
        await client.query('COMMIT');

        console.log(`Migration applied: ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  }
}
