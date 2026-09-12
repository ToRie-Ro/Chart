import dotenv from 'dotenv';

dotenv.config();

const environment = (process.env.APP_ENV ?? 'development') as 'development' | 'staging' | 'production';
const jwtSecret = process.env.JWT_SECRET ?? (environment === 'production' ? '' : 'local-dev-secret');

if (environment === 'production' && !jwtSecret) {
  throw new Error('JWT_SECRET must be configured in production.');
}

export const env = {
  appName: process.env.APP_NAME ?? 'SabayChat',
  port: Number(process.env.PORT ?? 4000),
  jwtSecret,
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  environment,
  apiBaseUrl: process.env.API_BASE_URL ?? 'https://chart-ztyk.onrender.com',
};
