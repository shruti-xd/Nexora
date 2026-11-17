import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// Database Migration & Seed Runner
// Connects directly to Supabase PostgreSQL and applies schema and seeds
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

    // Step 2: Read and execute initial schema migration
    const migrationPath = path.resolve(__dirname, '../../../supabase/migrations/20261117000001_initial_schema.sql');
    console.log(`[MigrationRunner] Step 2: Reading schema migration from: ${migrationPath}`);
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('[MigrationRunner] Step 2: Executing schema migration SQL statements...');
    await client.query(migrationSql);
    console.log('[MigrationRunner] Step 2: Schema migration applied successfully!');

    // Step 3: Read and execute initial seed script
    const seedPath = path.resolve(__dirname, '../../../supabase/seed.sql');
    console.log(`[MigrationRunner] Step 3: Reading seed SQL from: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, 'utf-8');

    console.log('[MigrationRunner] Step 3: Executing seed SQL statements...');
    await client.query(seedSql);
    console.log('[MigrationRunner] Step 3: Seed data inserted successfully!');

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
