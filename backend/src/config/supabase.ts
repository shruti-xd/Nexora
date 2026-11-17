import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// Supabase Client Configuration
// Provides both public and privileged service-role clients for the backend
// =============================================================================

// Step 1: Initialize logging for Supabase client creation
Logger.info(`[SupabaseConfig] Initializing Supabase clients for URL: ${env.SUPABASE_URL}`);

// Step 2: Create public Supabase client (using anon key)
export const supabasePublic: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
Logger.info('[SupabaseConfig] Supabase public client created successfully');

// Step 3: Create privileged administrative Supabase client (using service role key)
// Notice: Never expose this key or client to the frontend
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
Logger.info('[SupabaseConfig] Supabase admin (service-role) client created successfully');
