import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

async function main() {
  const isOptional = process.argv.includes('--optional');
  const databaseUrl = (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  ).trim();
  if (!databaseUrl) {
    if (isOptional) {
      console.log('DATABASE_URL not set; skipping automatic build-time migration.');
      return;
    }
    console.error('ERROR: DATABASE_URL environment variable is required to run migrations.');
    process.exit(1);
  }

  const isLocal =
    databaseUrl.includes('localhost') ||
    databaseUrl.includes('127.0.0.1');

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  const migrationsDir = path.resolve(process.cwd(), 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        filename text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    const appliedRes = await client.query<{ filename: string; checksum: string }>(
      'SELECT filename, checksum FROM public.schema_migrations'
    );
    const appliedMap = new Map(appliedRes.rows.map((r) => [r.filename, r.checksum]));

    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');

      if (appliedMap.has(file)) {
        console.log(`Skipping already applied migration: ${file}`);
        continue;
      }

      console.log(`Running migration: ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO public.schema_migrations (filename, checksum) VALUES ($1, $2)`,
          [file, checksum]
        );
        await client.query('COMMIT');
        console.log(`Completed migration: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    // Automatic initial Super Admin creation from env vars if no admin exists
    const initialEmail = (process.env.ADMIN_INITIAL_EMAIL || '').trim().toLowerCase();
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || '';

    if (initialEmail && initialPassword) {
      await client.query('BEGIN');
      try {
        await client.query('SELECT pg_advisory_xact_lock(92837465)');
        const countRes = await client.query<{ cnt: number }>(
          'SELECT count(*)::int AS cnt FROM public.admin_roles'
        );
        if ((countRes.rows[0]?.cnt ?? 0) === 0) {
          if (initialPassword.length < 6) {
            throw new Error('ADMIN_INITIAL_PASSWORD must be at least 6 characters.');
          }
          const passwordHash = await bcrypt.hash(initialPassword, 12);
          const profileRes = await client.query<{ id: string }>(
            `INSERT INTO public.profiles (email, password_hash, full_name)
             VALUES ($1, $2, $3)
             ON CONFLICT (email) DO UPDATE
               SET password_hash = EXCLUDED.password_hash
             RETURNING id`,
            [initialEmail, passwordHash, 'Super Administrator']
          );
          const userId = profileRes.rows[0].id;
          await client.query(
            `INSERT INTO public.admin_roles (user_id, role, is_active)
             VALUES ($1, 'super_admin', true)`,
            [userId]
          );
          await client.query(
            `INSERT INTO public.activity_logs (admin_id, admin_email, action, entity_type, entity_id, description)
             VALUES ($1, $2, 'admin_created', 'admin_roles', $3, $4)`,
            [
              userId,
              initialEmail,
              userId,
              `Initial Super Administrator (${initialEmail}) initialized during database setup.`,
            ]
          );
          console.log(`Initial super_admin created for ${initialEmail}.`);
        } else {
          console.log('Administrator already exists; skipped ADMIN_INITIAL_EMAIL bootstrap.');
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    console.log('All Neon PostgreSQL migrations completed successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
