import { isTradingPair, type TradingPair } from '@pulse-crypto/contracts';
import type { OrderBookUpdate, TickerUpdate } from '@pulse-crypto/market-domain';

export type ParsedBinanceMessage =
  | { kind: 'ticker'; update: TickerUpdate }
  | { kind: 'orderBook'; update: OrderBookUpdate }
  | { kind: 'ignored'; reason: string };

export function parseBinanceMessage(
  raw: string,
  receivedAt = Date.now(),
): ParsedBinanceMessage {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { kind: 'ignored', reason: 'invalid-json' };
  }

  if (!isRecord(payload)) {
    return { kind: 'ignored', reason: 'not-an-object' };
  }

  if ('result' in payload && !('stream' in payload)) {
    return { kind: 'ignored', reason: 'control-message' };
  }

  const stream = payload.stream;
  const data = payload.data;
  if (typeof stream !== 'string' || !isRecord(data)) {
    return { kind: 'ignored', reason: 'missing-combined-envelope' };
  }

  const pair = pairFromStreamName(stream);
  if (!pair) {
    return { kind: 'ignored', reason: 'unsupported-pair' };
  }

  if (stream.includes('@ticker')) {
    return parseTicker(pair, data, receivedAt);
  }

  if (stream.includes('@depth')) {
    return parseOrderBook(pair, data, receivedAt);
  }

  return { kind: 'ignored', reason: 'unknown-stream' };
}

export function pairFromStreamName(stream: string): TradingPair | undefined {
  const symbol = stream.split('@')[0]?.toUpperCase();
  return symbol && isTradingPair(symbol) ? symbol : undefined;
}

function parseTicker(
  pair: TradingPair,
  data: Record<string, unknown>,
  receivedAt: number,
): ParsedBinanceMessage {
  const lastPrice = parseFiniteNumber(data.c);
  const change24hPercent = parseFiniteNumber(data.P);
  const high24h = parseFiniteNumber(data.h);
  const low24h = parseFiniteNumber(data.l);
  const volume24h = parseFiniteNumber(data.q);
  const eventTime = parseFiniteNumber(data.E) ?? receivedAt;

  if (
    lastPrice === undefined ||
    change24hPercent === undefined ||
    high24h === undefined ||
    low24h === undefined ||
    volume24h === undefined
  ) {
    return { kind: 'ignored', reason: 'invalid-ticker-fields' };
  }

  return {
    kind: 'ticker',
    update: {
      pair,
      lastPrice,
      change24hPercent,
      high24h,
      low24h,
      volume24h,
      eventTime,
    },
  };
}

function parseOrderBook(
  pair: TradingPair,
  data: Record<string, unknown>,
  receivedAt: number,
): ParsedBinanceMessage {
  const lastUpdateId = parseFiniteNumber(data.lastUpdateId);
  const bids = parseLevels(data.bids);
  const asks = parseLevels(data.asks);

  if (lastUpdateId === undefined || bids === undefined || asks === undefined) {
    return { kind: 'ignored', reason: 'invalid-order-book-fields' };
  }

  return {
    kind: 'orderBook',
    update: {
      pair,
      bids,
      asks,
      lastUpdateId,
      eventTime: receivedAt,
    },
  };
}

function parseLevels(
  value: unknown,
): Array<{ price: number; quantity: number }> | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const levels: Array<{ price: number; quantity: number }> = [];
  for (const row of value) {
    if (!Array.isArray(row) || row.length < 2) {
      return undefined;
    }
    const price = parseFiniteNumber(row[0]);
    const quantity = parseFiniteNumber(row[1]);
    if (price === undefined || quantity === undefined || price < 0 || quantity < 0) {
      return undefined;
    }
    levels.push({ price, quantity });
  }
  return levels;
}

function parseFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
