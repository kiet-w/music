import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(10000),

  // Database connection string
  DATABASE_URL: Joi.string()
    .optional()
    .default('postgresql://music_user:music_secure_password@localhost:5432/music_db?schema=public'),

  DIRECT_URL: Joi.string()
    .optional()
    .default('postgresql://music_user:music_secure_password@localhost:5432/music_db?schema=public'),

  // Authentication configurations
  JWT_SECRET: Joi.string()
    .optional()
    .default('music_app_super_secret_jwt_2026_key'),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  // Google OAuth configurations
  GOOGLE_CLIENT_ID: Joi.string()
    .optional()
    .default('dummy-google-client-id'),
  GOOGLE_CLIENT_SECRET: Joi.string()
    .optional()
    .default('dummy-google-client-secret'),
  GOOGLE_REDIRECT_URI: Joi.string()
    .optional()
    .default('https://music-backend-cb0i.onrender.com/vi/auth/callback/google'),

  // Security key (AES 256 GCM expects 64 hex characters)
  ENCRYPTION_KEY: Joi.string()
    .optional()
    .default('00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff'),

  // Supabase Storage configurations
  SUPABASE_URL: Joi.string()
    .optional()
    .default('https://dummy.supabase.co'),
  SUPABASE_KEY: Joi.string()
    .optional()
    .default('dummy-supabase-key'),

  // CORS origin configurations
  CORS_ORIGINS: Joi.string()
    .optional()
    .default('*'),

  // BullMQ Redis configurations
  REDIS_HOST: Joi.string().default('powerful-mayfly-186559.upstash.io'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow('').default('gQAAAAAAAti_AAIgcDFlYjU0ZThhODlhMTc0MjU1OGFjZDY4NzQ4OTMwNmUyMQ'),

  // Optional yt-dlp path configurations
  YTDLP_BINARY_PATH: Joi.string().optional().allow(''),
  YTDLP_COOKIES_PATH: Joi.string().optional().allow(''),
});
