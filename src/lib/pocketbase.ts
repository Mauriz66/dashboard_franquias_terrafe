import PocketBase from 'pocketbase';

const getPocketBaseUrl = () => {
  // Check for runtime environment variable (injected via window._env_)
  if (typeof window !== 'undefined' && (window as any)._env_?.VITE_POCKETBASE_URL) {
    return (window as any)._env_.VITE_POCKETBASE_URL;
  }
  // Fallback to build-time environment variable
  return import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
};

export const pb = new PocketBase(getPocketBaseUrl());
pb.autoCancellation(false); // Disable auto-cancellation to prevent race conditions

// Global error handler for PocketBase
pb.beforeSend = function (url, options) {
    console.log(`[PB Request] ${url}`, options);
    return { url, options };
};

pb.afterSend = function (response, data) {
    if (response.status >= 400) {
        console.error(`[PB Error] ${response.status} ${response.url}`, data);
    }
    return data;
};
