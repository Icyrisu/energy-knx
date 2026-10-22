import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_LOCK_ID = 9823741;

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log('🔄 Checking and applying database migrations...');
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATIONS_LOCK_ID]);

    // Ensure schema_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Determine migrations folder path (handles both src/ in tsx and dist/ in node)
    const candidates = [
      process.env.MIGRATIONS_DIR ? path.resolve(process.env.MIGRATIONS_DIR) : '',
      path.resolve(__dirname, '../../../database/migrations'),
      path.resolve(__dirname, '../../database/migrations'),
      path.resolve(__dirname, '../database/migrations'),
      path.resolve(process.cwd(), 'database/migrations'),
      path.resolve(process.cwd(), '../database/migrations'),
      path.resolve(process.cwd(), 'migrations'),
    ].filter(Boolean);

    let migrationsDir: string | null = null;
    for (const dir of candidates) {
      try {
        const stat = await fs.stat(dir);
        if (stat.isDirectory()) {
          migrationsDir = dir;
          break;
        }
      } catch {
        // Continue searching
      }
    }

    if (!migrationsDir) {
      throw new Error(`Migrations directory could not be located in: ${candidates.join(', ')}`);
    }

    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();

    const { rows: appliedRows } = await client.query<{ version: string }>(
      'SELECT version FROM schema_migrations'
    );
    const appliedSet = new Set(appliedRows.map((r) => r.version));

    let count = 0;
    for (const file of sqlFiles) {
      if (appliedSet.has(file)) {
        continue;
      }

      console.log(`⏳ Applying migration: ${file}...`);
      const fullPath = path.join(migrationsDir, file);
      const sql = await fs.readFile(fullPath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW())',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✅ Migration applied successfully: ${file}`);
        count++;
      } catch (migrationError) {
        await client.query('ROLLBACK');
        console.error(`❌ Migration failed in ${file}:`, migrationError);
        throw migrationError;
      }
    }

    if (count === 0) {
      console.log('✅ Database schema is up to date. No pending migrations.');
    } else {
      console.log(`🎉 Total ${count} migration(s) applied successfully.`);
    }
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [MIGRATIONS_LOCK_ID]);
    } catch {
      // Ignored
    }
    client.release();
  }
}

// Standalone CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('Migration script finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal migration error:', err);
      process.exit(1);
    });
}
