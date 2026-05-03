import { z } from 'zod';

/**
 * Frontend Environment Variables Schema
 * Uses VITE_ prefix as required by Vite
 */
const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:3000'),
  VITE_APP_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VITE_ENABLE_ANALYTICS: z.coerce.boolean().default(false),
});

const _env = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
  VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
});

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  // In development, we want to know immediately. In production, we might want to fallback to defaults.
  if (import.meta.env.DEV) {
    throw new Error('Invalid environment variables');
  }
}

export const env = _env.success ? _env.data : envSchema.parse({});
