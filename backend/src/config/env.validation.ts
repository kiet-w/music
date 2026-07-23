import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(10000),

  // Database connection string (Supabase Postgres)
  DATABASE_URL: Joi.string()
    .required()
    .description('PostgreSQL connection string'),
  DIRECT_URL: Joi.string()
    .optional()
    .description('Direct PostgreSQL connection string (bypasses pgbouncer)'),

  // Authentication configurations
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('Secret key for JWT signing — must be at least 32 characters'),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  // Google OAuth configurations
  GOOGLE_CLIENT_ID: Joi.string()
    .required()
    .description('Google OAuth client ID'),
  GOOGLE_CLIENT_SECRET: Joi.string()
    .required()
    .description('Google OAuth client secret'),
  GOOGLE_REDIRECT_URI: Joi.string()
    .optional()
    .description('Google OAuth redirect URI'),

  // Security key (AES 256 GCM expects 64 hex characters)
  ENCRYPTION_KEY: Joi.string()
    .pattern(/^[0-9a-fA-F]{64}$/)
    .required()
    .description('AES-256-GCM key — exactly 64 hex characters'),

  // Supabase Storage configurations
  SUPABASE_URL: Joi.string()
    .required()
    .description('Supabase project URL'),
  SUPABASE_KEY: Joi.string()
    .required()
    .description('Supabase service role key'),

  // CORS origin configurations
  CORS_ORIGINS: Joi.string()
    .optional()
    .default('http://localhost:3003')
    .description('Comma-separated allowed CORS origins'),

  // BullMQ Redis configurations
  REDIS_HOST: Joi.string().required().description('Redis host'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),

  // Optional yt-dlp path configurations
  YTDLP_BINARY_PATH: Joi.string().optional().allow(''),
  YTDLP_COOKIES_PATH: Joi.string().optional().allow(''),
});
