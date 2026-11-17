import { createClient } from '@supabase/supabase-js';

// =============================================================================
// Client-side Supabase Client
// Step 1: Initialize Supabase client using public Anon Key exclusively
// =============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-anon-key';

// Step 2: Log client initialization (never printing keys)
console.log(`[SupabaseClient] Step 1: Initializing client for URL: ${supabaseUrl}`);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
