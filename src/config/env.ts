/**
 * Environment variables (set in `.env.local` for development and in the
 * hosting dashboard for production). See `.env.example`.
 */
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  authEmailDomain: (import.meta.env.VITE_AUTH_EMAIL_DOMAIN as string | undefined) || 'shundorproduct.app',
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
