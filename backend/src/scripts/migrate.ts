import fs from 'fs';
import path from 'path';
import pg from 'pg';

// =============================================================================
// Database Migration & Seed Runner
// Tracks schema_migrations table and executes pending migrations in order
// =============================================================================

async function runMigration() {
  // Step 1: Initialize database connection parameters
  console.log('[MigrationRunner] Step 1: Connecting to Supabase PostgreSQL...');

  const client = new pg.Client({
    host: 'db.flkzhcvpajttpotokngs.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'ShrutiSomesh@123456',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('[MigrationRunner] Step 1: Connected successfully to PostgreSQL database');

    // Force search path to public schema
    await client.query('SET search_path = public, pg_catalog;');

    // Step 2: Ensure schema_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Check if initial schema is already in schema_migrations
    const tableCheck = await client.query(`
      SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations';
    `);
    if (tableCheck.rows.length > 0) {
      await client.query(`
        INSERT INTO public.schema_migrations (version) 
        VALUES ('20261117000001_initial_schema.sql') 
        ON CONFLICT (version) DO NOTHING;
      `);
    }

    const { rows: executedRows } = await client.query('SELECT version FROM public.schema_migrations;');
    const executedVersions = new Set(executedRows.map((r: any) => r.version));
    console.log('[MigrationRunner] Current executed versions:', Array.from(executedVersions));

    // Step 3: Determine repository root directory
    let rootDir = process.cwd();
    if (!fs.existsSync(path.resolve(rootDir, 'supabase'))) {
      rootDir = path.resolve(rootDir, '..');
    }

    const migrationsDir = path.resolve(rootDir, 'supabase/migrations');
    console.log(`[MigrationRunner] Step 3: Scanning migrations in: ${migrationsDir}`);

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    // Step 4: Execute pending migrations sequentially
    for (const file of migrationFiles) {
      if (executedVersions.has(file)) {
        console.log(`[MigrationRunner] Skipping already executed migration: ${file}`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      console.log(`[MigrationRunner] Step 4: Executing pending migration: ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO public.schema_migrations (version) VALUES ($1);', [file]);
        await client.query('COMMIT');
        console.log(`[MigrationRunner] Step 4: Applied ${file} and recorded in schema_migrations!`);
      } catch (sqlErr: any) {
        await client.query('ROLLBACK');
        console.error(`[MigrationRunner] SQL Error in ${file}:`, sqlErr.message);
        throw sqlErr;
      }
    }

    // Step 5: Execute seed script
    const seedPath = path.resolve(rootDir, 'supabase/seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log(`[MigrationRunner] Step 5: Executing seed SQL from: ${seedPath}`);
      const seedSql = fs.readFileSync(seedPath, 'utf-8');
      await client.query(seedSql);
      console.log('[MigrationRunner] Step 5: Seed data updated successfully!');
    }

    // Step 6: Verify database state
    const rolesRes = await client.query('SELECT count(*) FROM public.roles;');
    console.log(`[MigrationRunner] Step 6: Verification complete. Total roles in DB: ${rolesRes.rows[0].count}`);
    console.log('[MigrationRunner] All migrations and seed operations executed successfully!');
  } catch (error) {
    console.error('[MigrationRunner] Migration execution failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
