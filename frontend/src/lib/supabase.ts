import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Helper to validate URL
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const isConfigured = isValidUrl(rawUrl) && !!rawKey;

// Use a safe fallback for initialization if not configured to prevent runtime crash
const supabaseUrl = isConfigured ? rawUrl! : 'https://placeholder.supabase.co';
const supabaseAnonKey = isConfigured ? rawKey! : 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

if (!isConfigured) {
  if (typeof window !== 'undefined') {
    console.warn(
      'Supabase is not correctly configured. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.',
      { url: rawUrl, hasKey: !!rawKey }
    );
  }
}

export { isConfigured };
