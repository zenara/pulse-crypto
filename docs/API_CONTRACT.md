# PulseCrypto REST API Contract

## GET /pairs/meta

Returns metadata for all supported trading pairs.

### Response

```json
{
  "pairs": [
    {
      "symbol": "BTCUSDT",
      "displayName": "BTC / USDT",
      "tradingStatus": "TRADING",
      "high24h": 112000.25,
      "low24h": 105000.12,
      "volume24h": 1234567.89
    }
  ]
}
```

## Trading Pair

Minimum supported pairs:

```text
BTCUSDT
ETHUSDT
SOLUSDT
DOGEUSDT
XRPUSDT
```

---

## Metadata Source

The assignment allows metadata to be mocked.

The initial implementation may therefore use a static/in-memory metadata provider.

The API should nevertheless be separated behind an interface so that a real provider could be introduced later.

---

## Error Response

Errors should use a consistent format.

Example:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Unable to retrieve pair metadata"
  }
}
```

Do not expose internal stack traces or infrastructure details to clients.
