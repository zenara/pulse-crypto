import { ApiRequestError } from './api-error';

export type FetchLike = (
  input: string,
  init?: { method?: string },
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

export async function getJson(
  baseUrl: string,
  path: string,
  fetchFn: FetchLike = fetch,
): Promise<unknown> {
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  let response: Awaited<ReturnType<FetchLike>>;
  try {
    response = await fetchFn(url);
  } catch {
    throw new ApiRequestError('Unable to reach the market API', 'NETWORK_ERROR');
  }

  const body = await readJsonBody(response);

  if (!response.ok) {
    const apiError = readApiError(body);
    throw new ApiRequestError(
      apiError?.message ?? 'Unable to retrieve pair metadata',
      apiError?.code ?? 'REQUEST_ERROR',
      response.status,
    );
  }

  return body;
}

async function readJsonBody(response: {
  json: () => Promise<unknown>;
}): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function readApiError(
  body: unknown,
): { code: string; message: string } | undefined {
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return undefined;
  }

  const error = (body as { error: unknown }).error;
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  const message = (error as { message?: unknown }).message;
  if (typeof code === 'string' && typeof message === 'string') {
    return { code, message };
  }

  return undefined;
}
