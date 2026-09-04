# Mobile Architecture

## Overview

The React Native application follows a layered architecture:

```text
Screens / Components
        ↓
Stores
        ↓
Services
        ↓
External APIs
```

---

# WebSocket

The WebSocket service is responsible for:

- Connection
- Disconnection
- Reconnection
- Parsing messages
- Passing normalized data to the store

It should not directly manipulate React components.

```text
WebSocketService
       ↓
MarketStore
       ↓
Components
```

---

# Market Store

The market store contains the latest market state.

Example conceptual structure:

```ts
{
  markets: {
    BTCUSDT: {...},
    ETHUSDT: {...},
    SOLUSDT: {...},
    DOGEUSDT: {...},
    XRPUSDT: {...}
  },
  connectionStatus: "connected"
}
```

---

# Favourite Store

Favourite pairs are independent of market data.

Example:

```ts
{
  favorites: ['BTCUSDT', 'SOLUSDT'];
}
```

The favourites are persisted using AsyncStorage.

---

# Watchlist

The watchlist displays:

- Trading pair
- Current price
- 24-hour change
- Connection indicator
- Favourite state

Search/filtering should operate on the supported pair list without modifying market state.

---

# Market Details

The details screen displays:

- Current price
- Buy pressure
- Sell pressure
- Spread
- Bids
- Asks
- Last updated timestamp

The screen consumes the selected pair from the market store.

---

# Offline Behavior

When disconnected:

```text
connectionStatus = disconnected
```

Existing market data remains visible.

The UI must not clear prices or order-book information simply because the WebSocket connection is unavailable.

---

# Pull to Refresh

Pull-to-refresh calls:

```http
GET /pairs/meta
```

It must not restart the WebSocket.

REST and WebSocket lifecycles are independent.

---

# Navigation

The application should use a simple navigation structure:

```text
Watchlist
   │
   └── Market Details
```

Avoid unnecessary navigation complexity.
