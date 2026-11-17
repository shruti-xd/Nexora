import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import { Logger } from '../utils/logger.js';

// =============================================================================
// Environment Configuration
// Resolves .env robustly across workspace root and backend directory
// =============================================================================

// Step 1: Explicitly load backend/.env and root .env
const cwd = process.cwd();
const backendEnvPath = path.resolve(cwd, 'backend/.env');
const rootEnvPath = path.resolve(cwd, '.env');
const relativeEnvPath = typeof __dirname !== 'undefined' ? path.resolve(__dirname, '../../.env') : backendEnvPath;

Logger.info(`[EnvConfig] Step 1: Loading environment variables...`);

// Load all candidate locations
dotenv.config({ path: rootEnvPath });
dotenv.config({ path: backendEnvPath });
dotenv.config({ path: relativeEnvPath });

// Step 2: Define strict environment schema with Zod
const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform((val) => parseInt(val, 10)),
});

// Step 3: Parse and validate environment variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  Logger.error('[EnvConfig] Invalid environment configuration detected:', parsed.error.format());
  throw new Error('Environment configuration validation failed');
}

// Step 4: Export validated environment configuration
Logger.info(`[EnvConfig] Environment initialized for Supabase URL: ${parsed.data.SUPABASE_URL}`);
Logger.info(`[EnvConfig] Running on port ${parsed.data.PORT} in "${parsed.data.NODE_ENV}" mode`);

export const env = parsed.data;
