import dotenv from 'dotenv';

dotenv.config();

const environment = (process.env.APP_ENV ?? 'development') as 'development' | 'staging' | 'production';
const jwtSecret = process.env.JWT_SECRET ?? (environment === 'production' ? '' : 'local-development-secret-change-me-32');

if (environment === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is missing. Add a 32+ character secret in Render Environment Variables.');
}

if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long.');
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
  smtpHost: process.env.SMTP_HOST ?? 'smtp-relay.brevo.com',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPassword: process.env.SMTP_PASSWORD ?? '',
  emailFrom: process.env.EMAIL_FROM ?? '',
};
