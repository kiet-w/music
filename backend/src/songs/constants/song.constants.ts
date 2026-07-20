// ponytail: SONG_SOURCE_TYPE removed — only one value, use string 'youtube' directly at call sites
export const CONVERSION_JOB = {
  NAME: 'convert',
  MAX_ATTEMPTS: 3,
  BACKOFF_DELAY_MS: 5000,
} as const;
