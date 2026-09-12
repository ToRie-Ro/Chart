import dotenv from 'dotenv';

dotenv.config();

export const env = {
  appName: process.env.APP_NAME ?? 'SabayChat',
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'local-dev-secret',
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  environment: (process.env.APP_ENV ?? 'development') as 'development' | 'staging' | 'production',
  apiBaseUrl: process.env.API_BASE_URL ?? 'https://chart-ztyk.onrender.com',
};
