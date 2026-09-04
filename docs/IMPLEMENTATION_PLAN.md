# PulseCrypto Implementation Plan

## Phase 0 — Project Setup

### Tasks

- Create repository
- Configure TypeScript
- Configure workspace
- Create backend application
- Create Expo React Native application
- Configure linting
- Configure formatting
- Configure testing

### Exit Criteria

```text
Backend starts
Mobile starts
TypeScript passes
Tests execute
```

---

# Phase 1 — Domain Contracts

Create:

- TradingPair
- OrderBookLevel
- MarketState
- PairMetadata
- WebSocket messages

### Exit Criteria

Domain models compile independently of networking.

---

# Phase 2 — REST API

Implement:

```http
GET /pairs/meta
```

Initially use mocked/static metadata.

### Exit Criteria

Endpoint returns all required trading pairs.

---

# Phase 3 — Binance Feed

Implement:

- Binance WebSocket connection
- Required subscriptions
- Message normalization
- Reconnection
- Cleanup

Required symbols:

```text
BTCUSDT
ETHUSDT
SOLUSDT
DOGEUSDT
XRPUSDT
```

### Exit Criteria

Backend receives live Binance market updates.

---

# Phase 4 — Market Processor

Implement:

- Latest state per pair
- Order-book processing
- Top N levels
- Spread
- Buy pressure
- Sell pressure
- 100ms batching
- Configurable interval

### Exit Criteria

Processor can be tested independently of Binance and WebSocket.

---

# Phase 5 — WebSocket Gateway

Implement:

- Client connection
- Client disconnection
- Snapshot broadcasting
- Slow-consumer handling
- Cleanup

### Exit Criteria

A WebSocket client receives consolidated market snapshots.

---

# Phase 6 — Mobile Networking

Implement:

- REST client
- WebSocket service
- Connection states
- Reconnection
- Error handling

### Exit Criteria

Mobile app receives live backend data.

---

# Phase 7 — Mobile State

Implement:

- MarketStore
- FavoritesStore
- AsyncStorage persistence

### Exit Criteria

Market state updates without direct screen-level WebSocket management.

---

# Phase 8 — Watchlist

Implement:

- Pair rows
- Price
- 24-hour change
- Connection indicator
- Search
- Favourite toggle

### Exit Criteria

Watchlist is fully functional.

---

# Phase 9 — Market Details

Implement:

- Current price
- Spread
- Buy pressure
- Sell pressure
- Order book
- Last updated timestamp

### Exit Criteria

Selecting a pair opens a live details view.

---

# Phase 10 — UX

Implement:

- Price increase animation
- Price decrease animation
- Order-book volume animation
- Loading states
- Error states
- Connection states
- Pull-to-refresh

### Exit Criteria

UI behaves correctly during live updates and failures.

---

# Phase 11 — Resilience

Test:

- Backend unavailable
- WebSocket disconnect
- Reconnect
- Binance disconnect
- REST failure
- App restart
- Favourite persistence

### Exit Criteria

Application recovers gracefully.

---

# Phase 12 — Performance Review

Review:

- React re-renders
- Zustand subscriptions
- WebSocket processing
- Object allocation
- Order-book rendering
- List rendering
- Animation performance

### Exit Criteria

No obvious performance bottlenecks remain.

---

# Phase 13 — Testing

Complete meaningful:

- Backend unit tests
- Backend integration tests
- Mobile store tests
- Component tests

### Exit Criteria

Critical behavior has automated coverage.

---

# Phase 14 — CI

Add:

```text
lint
typecheck
test
build
```

### Exit Criteria

CI validates every pull request.

---

# Phase 15 — Documentation

Complete:

- README
- Architecture
- API contract
- WebSocket protocol
- Performance
- Testing
- Decisions
- AI-assisted development notes

---

# Phase 16 — Final Review

Before submission verify:

- Android emulator works
- Live Binance data works
- Search works
- Favourites persist
- Details work
- Reconnection works
- Offline state works
- Pull-to-refresh works
- Tests pass
- README is complete
- Screen recording is complete
