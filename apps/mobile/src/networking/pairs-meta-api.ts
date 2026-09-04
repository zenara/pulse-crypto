import {
  isTradingPair,
  type PairMetadata,
  type TradingStatus,
} from '@pulse-crypto/contracts';
import { ApiRequestError } from './api-error';
import { getJson, type FetchLike } from './rest-client';

const TRADING_STATUSES: ReadonlySet<TradingStatus> = new Set([
  'TRADING',
  'HALT',
  'BREAK',
  'UNKNOWN',
]);

export async function fetchPairsMeta(
  baseUrl: string,
  fetchFn: FetchLike = fetch,
): Promise<PairMetadata[]> {
  const body = await getJson(baseUrl, '/pairs/meta', fetchFn);
  const pairs = readPairs(body);
  if (pairs === undefined) {
    throw new ApiRequestError(
      'Invalid pair metadata response',
      'INVALID_RESPONSE',
    );
  }
  return pairs;
}

function readPairs(body: unknown): PairMetadata[] | undefined {
  if (typeof body !== 'object' || body === null || !('pairs' in body)) {
    return undefined;
  }

  const raw = (body as { pairs: unknown }).pairs;
  if (!Array.isArray(raw)) {
    return undefined;
  }

  const pairs: PairMetadata[] = [];
  for (const item of raw) {
    const pair = readPair(item);
    if (pair) {
      pairs.push(pair);
    }
  }

  return pairs;
}

function readPair(value: unknown): PairMetadata | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const row = value as Record<string, unknown>;
  if (typeof row.symbol !== 'string' || !isTradingPair(row.symbol)) {
    return undefined;
  }
  if (typeof row.displayName !== 'string') {
    return undefined;
  }
  if (!isTradingStatus(row.tradingStatus)) {
    return undefined;
  }
  if (
    !isFiniteNumber(row.high24h) ||
    !isFiniteNumber(row.low24h) ||
    !isFiniteNumber(row.volume24h)
  ) {
    return undefined;
  }

  return {
    symbol: row.symbol,
    displayName: row.displayName,
    tradingStatus: row.tradingStatus,
    high24h: row.high24h,
    low24h: row.low24h,
    volume24h: row.volume24h,
  };
}

function isTradingStatus(value: unknown): value is TradingStatus {
  return typeof value === 'string' && TRADING_STATUSES.has(value as TradingStatus);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
