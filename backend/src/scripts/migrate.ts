import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// =============================================================================
// Database Migration & Seed Runner
// Connects directly to Supabase PostgreSQL and applies schema and seeds
// =============================================================================

async function runMigration() {
  // Step 1: Initialize database connection parameters
  console.log('[MigrationRunner] Step 1: Connecting to Supabase PostgreSQL...');

  const supabaseUrl = process.env.SUPABASE_URL;
  const databasePassword = process.env.SUPABASE_DB_PASSWORD;

  if (!supabaseUrl || !databasePassword) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_DB_PASSWORD must be set before running database migrations.'
    );
  }

  let projectRef: string;
  try {
    projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  } catch {
    throw new Error('SUPABASE_URL is not a valid URL.');
  }

  const client = new pg.Client({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: databasePassword,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('[MigrationRunner] Step 1: Connected successfully to PostgreSQL database');

    const cwd = process.cwd();
    const repoRoot = path.basename(cwd).toLowerCase() === 'backend'
      ? path.resolve(cwd, '..')
      : cwd;

    // Step 2: Apply the initial schema only when the core tables are absent
    const schemaCheck = await client.query(
      "SELECT to_regclass('public.organizations') IS NOT NULL AS exists;"
    );

    if (!schemaCheck.rows[0].exists) {
      const migrationPath = path.resolve(
        repoRoot,
        'supabase/migrations/20261117000001_initial_schema.sql'
      );
      console.log(`[MigrationRunner] Step 2: Reading schema migration from: ${migrationPath}`);
      const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

      console.log('[MigrationRunner] Step 2: Executing schema migration SQL statements...');
      await client.query(migrationSql);
      console.log('[MigrationRunner] Step 2: Schema migration applied successfully!');
    } else {
      console.log('[MigrationRunner] Step 2: Core schema already exists; skipping initial migration.');
    }

    // Step 3: Read and execute initial seed script
    const seedPath = path.resolve(repoRoot, 'supabase/seed.sql');
    console.log(`[MigrationRunner] Step 3: Reading seed SQL from: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, 'utf-8');

    console.log('[MigrationRunner] Step 3: Executing seed SQL statements...');
    await client.query(seedSql);
    console.log('[MigrationRunner] Step 3: Seed data inserted successfully!');

    // Step 3b: Apply the accounts table migration
    const accountsMigrationPath = path.resolve(
      repoRoot,
      'supabase/migrations/20261118000001_accounts.sql'
    );
    console.log(
      `[MigrationRunner] Step 3b: Reading accounts migration from: ${accountsMigrationPath}`
    );
    const accountsMigrationSql = fs.readFileSync(accountsMigrationPath, 'utf-8');

    console.log('[MigrationRunner] Step 3b: Applying accounts schema...');
    await client.query(accountsMigrationSql);
    console.log('[MigrationRunner] Step 3b: Accounts schema applied successfully!');

    // Step 4: Verify seeded roles
    console.log('[MigrationRunner] Step 4: Verifying seeded system roles in database...');
    const rolesRes = await client.query('SELECT id, name FROM roles ORDER BY name;');
    console.log('[MigrationRunner] Step 4: Available roles:', rolesRes.rows);

    // Step 5: Verify permissions
    const permsRes = await client.query('SELECT count(*) FROM permissions;');
    console.log('[MigrationRunner] Step 5: Total permissions registered:', permsRes.rows[0].count);

    console.log('[MigrationRunner] All migrations and seed scripts completed successfully!');
  } catch (err) {
    console.error('[MigrationRunner] Migration execution failed:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('[MigrationRunner] Database connection closed.');
  }
}

runMigration();
