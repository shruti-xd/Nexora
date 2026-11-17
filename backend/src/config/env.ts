import dotenv from 'dotenv';
import { z } from 'zod';
import { Logger } from '../utils/logger.js';

// Step 1: Load environment variables from .env file
Logger.info('[EnvConfig] Loading environment variables...');
dotenv.config();

// Step 2: Define strict environment schema with Zod
const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url().default('https://example.supabase.co'),
  SUPABASE_ANON_KEY: z.string().min(1).default('dummy-anon-key-for-initial-setup'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('dummy-service-role-key-for-initial-setup'),
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
Logger.info(`[EnvConfig] Environment initialized successfully in "${parsed.data.NODE_ENV}" mode on port ${parsed.data.PORT}`);

export const env = parsed.data;
