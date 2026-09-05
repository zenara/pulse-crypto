# Testing Strategy

## Goals

Tests should validate important behavior rather than maximize raw coverage.

---

# Backend Unit Tests

## Market Processor

Test:

- New market update
- Existing market update
- Multiple trading pairs
- Latest-state replacement
- 100ms batching
- Configurable batching interval
- Spread calculation
- Buy pressure
- Sell pressure
- Zero-volume edge case
- Order-book depth limit

---

# Binance Feed

Test:

- Connection
- Message parsing
- Invalid message handling
- Disconnection
- Reconnection
- Backoff
- Cleanup

Binance should be mocked in unit tests.

Tests should not depend on the real Binance service.

---

# WebSocket Gateway

Test:

- Client connection
- Client disconnection
- Broadcast
- Multiple clients
- Client errors
- Slow consumers
- Cleanup

---

# REST

Test:

```http
GET /pairs/meta
```

Verify:

- HTTP status
- Supported pairs
- Response structure
- Error behavior

---

# Mobile Tests

## Market Store

Test:

- Market updates
- Multiple market updates
- Connection state
- Existing state preserved on disconnect

---

# Favorites

Test:

- Add favourite
- Remove favourite
- Persist favourite
- Restore favourite

---

# Watchlist

Test:

- Rendering supported pairs
- Price rendering
- Search
- Favourite interaction
- Connection state

---

# Market Details

Test:

- Current price
- Pressure values
- Spread
- Order book
- Timestamp

---

# Resilience (mobile)

Covered in store/session/screen tests:

- REST metadata failure keeps previous pairs
- Metadata loading flag
- WebSocket disconnect does not clear markets
- Favourite hydrate on session start
- Retry control on metadata error
- Stale-price hint while disconnected

Binance disconnect is covered on the API feed tests, not by driving a live exchange.

---

# Integration Tests

Where practical, verify:

```text
Backend
   ↓
WebSocket
   ↓
Mobile networking layer
   ↓
Store
```

without requiring real Binance connectivity.

---

# Test Philosophy

Prefer deterministic tests.

Avoid tests that rely on:

- Real network timing
- Real Binance data
- Arbitrary sleeps
- External services

Real external integration can be demonstrated manually during the recording.
