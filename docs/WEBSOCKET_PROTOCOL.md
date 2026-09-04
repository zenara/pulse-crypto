# WebSocket Protocol

Backend-to-mobile messages are JSON objects with a `type` discriminator.

The mobile application depends on this protocol, not on Binance payloads.

## Messages

### `market.snapshot`

Latest processed market state for all supported pairs.

```json
{
  "type": "market.snapshot",
  "timestamp": 1720802025000,
  "data": [
    {
      "pair": "BTCUSDT",
      "lastPrice": 65000.5,
      "change24hPercent": -1.25,
      "high24h": 67000,
      "low24h": 64000,
      "volume24h": 650000000,
      "spread": 1.5,
      "buyPressure": 55.2,
      "sellPressure": 44.8,
      "bids": [{ "price": 65000, "quantity": 1.2 }],
      "asks": [{ "price": 65001.5, "quantity": 0.8 }],
      "updatedAt": 1720802025000
    }
  ]
}
```

`spread`, `buyPressure`, and `sellPressure` are `null` when they cannot be calculated from the bounded book.

Snapshots use latest-state semantics. Intermediate Binance events are not forwarded.

### `connection.ready`

Sent after a client connects, before or with the first snapshot.

```json
{
  "type": "connection.ready",
  "timestamp": 1720802025000
}
```

### `error`

```json
{
  "type": "error",
  "timestamp": 1720802025000,
  "data": {
    "code": "INTERNAL_ERROR",
    "message": "Unable to process market snapshot"
  }
}
```

Do not include stack traces or Binance-specific details.

## Transport

- Native WebSocket, not Socket.IO
- One JSON object per message
- Server broadcasts snapshots at `MARKET_UPDATE_INTERVAL_MS` (default 100ms)
- URL: `ws://<host>:<port>/market` (same HTTP port as REST)
- A slow client keeps at most one in-flight message and one pending snapshot; older pending snapshots are discarded

On connect the server sends `connection.ready`, then the latest snapshot if one has already been published.
