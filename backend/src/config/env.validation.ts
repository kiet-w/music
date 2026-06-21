import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Required database connection string
  DATABASE_URL: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.string()
      .optional()
      .default('postgresql://mock:mock@localhost:5432/mock'),
    otherwise: Joi.string().required(),
  }),

  // Required authentication configurations
  JWT_SECRET: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.string()
      .optional()
      .default('mock-secret-key-for-testing-purposes-only'),
    otherwise: Joi.string().required(),
  }),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  // Required Google OAuth configurations
  GOOGLE_CLIENT_ID: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.string().optional().default('mock-google-client-id'),
    otherwise: Joi.string().required(),
  }),
  GOOGLE_CLIENT_SECRET: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.string().optional().default('mock-google-client-secret'),
    otherwise: Joi.string().required(),
  }),
  GOOGLE_REDIRECT_URI: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.string()
      .optional()
      .default('http://localhost:3000/mock-redirect'),
    otherwise: Joi.string().uri().required(),
  }),

  // Required security key (AES 256 GCM expects 64 hex characters)
  ENCRYPTION_KEY: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.string()
      .optional()
      .default(
        '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
      ),
    otherwise: Joi.string().hex().length(64).required(),
  }),

  // Required Supabase Storage configurations
  SUPABASE_URL: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.string().optional().default('https://mock.supabase.co'),
    otherwise: Joi.string().uri().required(),
  }),
  SUPABASE_KEY: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.string().optional().default('mock-supabase-key'),
    otherwise: Joi.string().required(),
  }),

  // Required CORS origin configurations
  CORS_ORIGINS: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),

  // Optional / Defaulted BullMQ Redis configurations
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),
});
