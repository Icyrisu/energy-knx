import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default(
    process.env.DATABASE_URL || 'postgresql://energy_user:energy_secure_password_123!@database:5432/energy_scada'
  ),
  INTERNAL_API_SECRET: z.string().min(8).default(
    process.env.INTERNAL_API_SECRET || 'energy-scada-internal-secret-token-change-in-prod'
  ),
  NODERED_URL: z.string().default(process.env.NODERED_URL || 'http://nodered:1880'),
  ENERGY_SOURCE_MODE: z.enum(['simulation', 'device', 'modbus', 'off']).default('modbus'),
  HISTORY_INTERVAL_SECONDS: z.coerce.number().min(5).default(60),

  STALE_AFTER_SECONDS: z.coerce.number().min(3).default(10),
  HISTORY_RETENTION_DAYS: z.coerce.number().default(1),
  MIGRATE_ON_START: z.preprocess((val) => val === 'true' || val === true || val === '1', z.boolean()).default(true),
  TZ: z.string().default('Asia/Jakarta'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables configuration:');
    for (const issue of result.error.issues) {
      console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
