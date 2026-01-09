import PocketBase from 'pocketbase';

type RuntimeEnv = {
  VITE_POCKETBASE_URL?: string;
};

const getRuntimeEnv = (): RuntimeEnv | undefined => {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { _env_?: RuntimeEnv };
  return w._env_;
};

const normalizePocketBaseUrl = (rawUrl: string) => {
  let url = rawUrl.trim();
  url = url.replace(/^`|`$/g, '').replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
};

const getPocketBaseUrl = () => {
  // Check for runtime environment variable (injected via window._env_)
  const runtimeUrl = getRuntimeEnv()?.VITE_POCKETBASE_URL;
  // Fallback to build-time environment variable
  const url = runtimeUrl || import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
  return normalizePocketBaseUrl(url);
};

export const pb = new PocketBase(getPocketBaseUrl());
pb.autoCancellation(false); // Disable auto-cancellation to prevent race conditions

// Global error handler for PocketBase
pb.beforeSend = function (url: string, options: RequestInit) {
    console.log(`[PB Request] ${url}`, options);
    return { url, options };
};

pb.afterSend = function (response: Response, data: unknown) {
    if (response.status >= 400) {
        console.error(`[PB Error] ${response.status} ${response.url}`, data);
    }
    return data;
};
