export const SONG_SOURCE_TYPE = {
  YOUTUBE: 'youtube',
} as const;

export const CONVERSION_JOB = {
  NAME: 'convert',
  MAX_ATTEMPTS: 3,
  BACKOFF_DELAY_MS: 5000,
} as const;
