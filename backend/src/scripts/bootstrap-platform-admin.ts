import { supabaseAdmin } from '../config/supabase.js';
import { Logger } from '../utils/logger.js';
import { AuditService } from '../services/audit.service.js';

// =============================================================================
// Platform Admin Bootstrap Script
// CLI-only administrative tool to safely bootstrap internal Nexora Platform Admins
// Usage: npx tsx src/scripts/bootstrap-platform-admin.ts <email> [fullName] [password]
// =============================================================================

async function bootstrap() {
  const args = process.argv.slice(2);
  const email = args[0]?.trim().toLowerCase();
  const fullName = args[1]?.trim() || 'Platform Administrator';
  const password = args[2]?.trim() || 'Admin@Nexora2026!';

  if (!email || !email.includes('@')) {
    console.error('Error: Please provide a valid email address.');
    console.error('Usage: npx tsx src/scripts/bootstrap-platform-admin.ts <email> [fullName] [password]');
    process.exit(1);
  }

  Logger.info(`[BootstrapPlatformAdmin] Step 1: Starting bootstrap for email: ${email}`);

  try {
    // Step 2: Check if user already exists in Supabase Auth
    Logger.info('[BootstrapPlatformAdmin] Step 2: Querying Supabase Auth for existing user...');
    const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    let authUser = userList.users.find((u) => u.email?.toLowerCase() === email);

    if (!authUser) {
      Logger.info(`[BootstrapPlatformAdmin] Step 3: User not found in Supabase Auth. Creating new user...`);
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (createError || !created.user) {
        throw new Error(`Failed to create auth user: ${createError?.message}`);
      }
      authUser = created.user;
      Logger.info(`[BootstrapPlatformAdmin] Auth user created with ID: ${authUser.id}`);
    } else {
      Logger.info(`[BootstrapPlatformAdmin] Existing auth user found with ID: ${authUser.id}`);
    }

    const userId = authUser.id;

    // Step 4: Upsert profile with is_platform_admin = true
    Logger.info(`[BootstrapPlatformAdmin] Step 4: Granting Platform Admin privileges in profiles table...`);
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        email,
        is_active: true,
        is_platform_admin: true,
        invitation_status: 'ACTIVE',
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    // Step 5: Insert into platform_admins table
    Logger.info(`[BootstrapPlatformAdmin] Step 5: Recording user in platform_admins table...`);
    const { error: adminTableError } = await supabaseAdmin
      .from('platform_admins')
      .upsert({
        user_id: userId,
        created_at: new Date().toISOString(),
      });

    if (adminTableError) {
      throw new Error(`Failed to record in platform_admins: ${adminTableError.message}`);
    }

    // Step 6: Record audit log
    await AuditService.log({
      userId,
      action: 'PLATFORM_ADMIN_BOOTSTRAPPED',
      resource: 'platform_admins',
      resourceId: userId,
      metadata: { email, fullName },
    });

    Logger.info(`[BootstrapPlatformAdmin] Step 6 completed: User "${email}" successfully configured as Platform Admin!`);
    console.log('\n======================================================');
    console.log('✓ Platform Admin successfully bootstrapped!');
    console.log(`  User ID:   ${userId}`);
    console.log(`  Email:     ${email}`);
    console.log(`  Full Name: ${fullName}`);
    console.log('======================================================\n');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    Logger.error(`[BootstrapPlatformAdmin] Bootstrap failed: ${errorMsg}`);
    process.exit(1);
  }
}

bootstrap();
