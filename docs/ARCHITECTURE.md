# PulseCrypto Architecture

## 1. Overview

PulseCrypto is a real-time cryptocurrency market viewer.

The system contains two primary applications:

- Node.js backend
- React Native mobile application

The backend acts as a market-data gateway between Binance and mobile clients.

```text
                    Binance
                       │
                       │ WebSocket
                       ▼
              ┌─────────────────┐
              │ Binance Feed    │
              └────────┬────────┘
                       │
                       │ raw events
                       ▼
              ┌─────────────────┐
              │ Market Processor│
              │                 │
              │ Latest state    │
              │ per pair        │
              └────────┬────────┘
                       │
                    100ms
                       │
                       ▼
              ┌─────────────────┐
              │ WebSocket       │
              │ Gateway         │
              └────────┬────────┘
                       │
                       │ snapshots
                       ▼
              ┌─────────────────┐
              │ React Native    │
              │ WebSocket       │
              │ Service         │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Market Store    │
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
        Watchlist          Market Details
```

---

# 2. Backend Responsibilities

The backend has four major responsibilities.

## Binance Feed

Responsible for:

- Establishing Binance WebSocket connections
- Subscribing to required trading pairs
- Receiving market updates
- Reconnecting after connection failures
- Normalizing Binance-specific messages

It must not know about mobile clients.

---

## Market Processor

Responsible for:

- Maintaining latest market state
- Processing order-book information
- Calculating derived market values
- Limiting order-book depth
- Batching updates
- Publishing snapshots at the configured interval

The processor must not depend on WebSocket transport.

---

## WebSocket Gateway

Responsible for:

- Managing mobile WebSocket clients
- Broadcasting processed market snapshots
- Handling client connections/disconnections
- Preventing slow consumers from creating unbounded memory usage

The gateway must not depend directly on Binance.

---

## REST API

Responsible for:

```http
GET /pairs/meta
```

The endpoint returns metadata for supported trading pairs.

---

# 3. Mobile Responsibilities

The mobile application contains:

```text
Networking
State
Persistence
UI
Navigation
```

Networking is separated from state management.

The WebSocket service receives data and updates the market store.

The screens consume store state.

---

# 4. State Ownership

## Market State

Owned by:

```text
MarketStore
```

Contains:

- Current price
- 24-hour change
- Spread
- Buy pressure
- Sell pressure
- Order book
- Last updated timestamp

---

## Favourite State

Owned by:

```text
FavoritesStore
```

Persisted using:

```text
AsyncStorage
```

Market data must not be persisted to AsyncStorage.

---

## Connection State

Owned by the networking/state layer.

The UI consumes:

```text
connecting
connected
reconnecting
disconnected
error
```

---

# 5. Data Flow

### Market data

```text
Binance
 ↓
BinanceFeedService
 ↓
MarketProcessor
 ↓
WebSocketGateway
 ↓
MobileWebSocketService
 ↓
MarketStore
 ↓
UI
```

### Metadata

```text
Mobile
 ↓
GET /pairs/meta
 ↓
Backend
```

Pull-to-refresh only refreshes metadata.

It does not restart the market WebSocket.

---

# 6. Architectural Principles

The system follows:

- Single responsibility
- Dependency inversion where useful
- Explicit contracts
- Bounded memory
- Latest-value semantics
- Transport/domain separation
- Server-state/client-state separation

The architecture intentionally avoids unnecessary distributed infrastructure.

---

# 7. Repository Layout

The workspace is an Nx integrated monorepo using pnpm:

```text
apps/api                 NestJS backend
apps/mobile              Expo React Native app
libs/contracts           Shared wire contracts (REST + WebSocket DTOs)
libs/market-domain       Domain models and market calculations
libs/shared              Small reusable utilities only
```

TypeScript imports use workspace package names as aliases: `@pulse-crypto/contracts`, `@pulse-crypto/market-domain`, and `@pulse-crypto/shared`. Nx 23 + TypeScript 6 resolve these through package `exports` rather than deprecated `baseUrl`/`paths`.

Nx module boundaries:

- `api` may depend on `contracts`, `market-domain`, and `shared`
- `mobile` may depend on `contracts` and `shared`
- `market-domain` may depend on `contracts` and `shared`
- `contracts` may depend on `shared` only
- apps must not depend on each other

Market calculations stay in `market-domain` / the backend processor. The mobile app consumes already-processed snapshots from the WebSocket protocol.
