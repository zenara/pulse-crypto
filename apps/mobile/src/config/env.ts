export interface MobileEnv {
  apiUrl: string | undefined;
  wsUrl: string | undefined;
}

export function readMobileEnv(
  env: NodeJS.ProcessEnv = process.env,
): MobileEnv {
  return {
    apiUrl: normalizeBaseUrl(env.EXPO_PUBLIC_API_URL),
    wsUrl: normalizeWsUrl(env.EXPO_PUBLIC_WS_URL),
  };
}

function normalizeBaseUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.replace(/\/$/, '');
}

function normalizeWsUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.replace(/\/$/, '');
}
