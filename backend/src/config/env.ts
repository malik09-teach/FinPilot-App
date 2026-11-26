import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(8).default('finpilot-jwt-super-secret-key-hackathon-2026'),
  AI_ENGINE: z.enum(['python', 'legacy']).default('python'),
  AGENT_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  AGENT_SERVICE_TOKEN: z.string().min(8).default('dev-agent-service-token'),
  AGENT_CONTEXT_SECRET: z.string().min(16).default('dev-agent-context-secret-change-in-prod'),
  AGENT_CONTEXT_TTL_SECONDS: z.coerce.number().int().min(10).max(300).default(120),
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(): AppEnv {
  return envSchema.parse(process.env);
}

// Validate at module load so invalid startup config fails fast
export const env: AppEnv = getEnv();
