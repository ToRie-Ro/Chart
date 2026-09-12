import dotenv from 'dotenv';

dotenv.config();

const environment = (process.env.APP_ENV ?? 'development') as 'development' | 'staging' | 'production';
const jwtSecret = process.env.JWT_SECRET ?? (environment === 'production' ? '' : 'local-development-secret-change-me-32');

if (jwtSecret.length < 32 || (environment === 'production' && !process.env.JWT_SECRET)) {
  throw new Error('JWT_SECRET must be a configured value of at least 32 characters.');
}

export const env = {
  appName: process.env.APP_NAME ?? 'SabayChat',
  port: Number(process.env.PORT ?? 4000),
  jwtSecret,
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  environment,
  apiBaseUrl: process.env.API_BASE_URL ?? 'https://chart-ztyk.onrender.com',
  premiumLicenseKeys: (process.env.PREMIUM_LICENSE_KEYS ?? '').split(',').map((key) => key.trim()).filter(Boolean),
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean),
};
