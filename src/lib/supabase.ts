import { createClient } from '@supabase/supabase-js';

type RuntimeEnv = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

const getRuntimeEnv = (): RuntimeEnv | undefined => {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { _env_?: RuntimeEnv };
  return w._env_;
};

const normalizeEnvValue = (rawValue: string) => {
  return rawValue.trim().replace(/^`|`$/g, '').replace(/^"|"$/g, '').replace(/^'|'$/g, '');
};

const getSupabaseUrl = () => {
  const runtimeUrl = getRuntimeEnv()?.VITE_SUPABASE_URL;
  const url = runtimeUrl || import.meta.env.VITE_SUPABASE_URL || '';
  return url ? normalizeEnvValue(url) : '';
};

const getSupabaseAnonKey = () => {
  const runtimeKey = getRuntimeEnv()?.VITE_SUPABASE_ANON_KEY;
  const key = runtimeKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return key ? normalizeEnvValue(key) : '';
};

export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

