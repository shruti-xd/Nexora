import fs from 'fs';
import path from 'path';
import pg from 'pg';

// =============================================================================
// Database Migration & Seed Runner
// Connects to Supabase PostgreSQL and applies migrations using a version ledger
// =============================================================================

async function runMigration() {
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

    // Create schema_migrations ledger table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // If initial schema was already installed before ledger existed, record it
    const checkInit = await client.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'organizations';
    `);
    if (checkInit.rows.length > 0) {
      await client.query(`
        INSERT INTO schema_migrations (version) 
        VALUES ('20261117000001_initial_schema.sql') 
        ON CONFLICT (version) DO NOTHING;
      `);
    }

    // Fetch already applied migrations
    const appliedRes = await client.query('SELECT version FROM schema_migrations;');
    const appliedSet = new Set(appliedRes.rows.map((r) => r.version));

    const cwd = process.cwd();
    const rootDir = fs.existsSync(path.resolve(cwd, 'supabase')) ? cwd : path.resolve(cwd, '..');
    const migrationsDir = path.resolve(rootDir, 'supabase/migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

    // Step 2: Apply unapplied migrations in chronological order
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`[MigrationRunner] Step 2: Skipping already applied migration: ${file}`);
        continue;
      }

      const migrationPath = path.join(migrationsDir, file);
      console.log(`[MigrationRunner] Step 2: Applying migration: ${file}`);
      const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

      // Execute within transaction
      await client.query('BEGIN');
      try {
        await client.query(migrationSql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[MigrationRunner] Step 2: Successfully applied and recorded ${file}`);
      } catch (migrationErr) {
        await client.query('ROLLBACK');
        throw migrationErr;
      }
    }

    // Step 3: Apply seed script
    const seedPath = path.resolve(rootDir, 'supabase/seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log(`[MigrationRunner] Step 3: Applying seed script: ${seedPath}`);
      const seedSql = fs.readFileSync(seedPath, 'utf-8');
      await client.query(seedSql);
      console.log('[MigrationRunner] Step 3: Seed script executed successfully');
    }

    // Step 4: Verify CRM tables in schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('[MigrationRunner] Step 4: Available public tables:');
    tablesRes.rows.forEach((r) => console.log(` - ${r.table_name}`));

    console.log('[MigrationRunner] All database migrations completed successfully!');
  } catch (err) {
    console.error('[MigrationRunner] Migration execution failed:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('[MigrationRunner] Database connection closed.');
  }
}

runMigration();
