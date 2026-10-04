import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  FIREBASE_PROJECT_ID: z.string().min(1).default('demo-safar'),
  FIREBASE_AUTH_EMULATOR_HOST: z.string().min(1).optional(),
  DATABASE_URL: z.string().url().default('postgresql://safar@127.0.0.1:5432/safar'),
  ADMIN_EMAILS: z.string().default(''),
});

export type AppConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  apiPort: number;
  webOrigin: string;
  firebase: {
    projectId: string;
    authEmulatorHost?: string;
  };
  adminEmails: string[];
  database: {
    url: string;
  };
};

export function loadConfig(environment: NodeJS.ProcessEnv): AppConfig {
  const parsed = environmentSchema.safeParse(environment);
  if (!parsed.success) {
    throw new Error(`Invalid application configuration: ${parsed.error.message}`);
  }
  if (parsed.data.NODE_ENV === 'production') {
    const required = ['WEB_ORIGIN', 'FIREBASE_PROJECT_ID', 'DATABASE_URL'];
    const missing = required.filter((key) => !environment[key]);
    if (missing.length > 0) {
      throw new Error(
        `Invalid application configuration: ${missing.join(', ')} are required in production`,
      );
    }
    if (parsed.data.FIREBASE_AUTH_EMULATOR_HOST) {
      throw new Error('Invalid application configuration: Firebase Auth Emulator must not be enabled in production');
    }
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    apiPort: parsed.data.API_PORT,
    webOrigin: parsed.data.WEB_ORIGIN,
    firebase: {
      projectId: parsed.data.FIREBASE_PROJECT_ID,
      ...(parsed.data.FIREBASE_AUTH_EMULATOR_HOST
        ? { authEmulatorHost: parsed.data.FIREBASE_AUTH_EMULATOR_HOST }
        : {}),
    },
    adminEmails: parsed.data.ADMIN_EMAILS.split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
    database: {
      url: parsed.data.DATABASE_URL,
    },
  };
}
