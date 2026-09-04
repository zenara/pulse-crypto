export interface MobileEnv {
  apiUrl: string | undefined;
  wsUrl: string | undefined;
}

type MobileEnvInput = {
  EXPO_PUBLIC_API_URL?: string;
  EXPO_PUBLIC_WS_URL?: string;
};

/**
 * Expo inlines `process.env.EXPO_PUBLIC_*` at bundle time.
 * Those names must appear as static property access, not `env[name]`.
 */
export function readMobileEnv(env?: MobileEnvInput): MobileEnv {
  const source: MobileEnvInput = env ?? {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_WS_URL: process.env.EXPO_PUBLIC_WS_URL,
  };

  return {
    apiUrl: normalizeUrl(source.EXPO_PUBLIC_API_URL),
    wsUrl: normalizeUrl(source.EXPO_PUBLIC_WS_URL),
  };
}

function normalizeUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.replace(/\/$/, '');
}
