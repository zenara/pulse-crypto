# Real-Time Processing Strategy

## Problem

Cryptocurrency market feeds can produce updates much faster than a mobile UI needs to render.

Forwarding every Binance update would create:

```text
High-frequency Binance events
        ↓
Backend
        ↓
Mobile WebSocket
        ↓
Frequent UI updates
```

This could increase:

- CPU usage
- network traffic
- object allocations
- React Native renders
- battery consumption

---

# Latest-State Strategy

The backend maintains the latest state for each trading pair.

Conceptually:

```text
Map<TradingPair, MarketState>
```

Example:

```text
BTCUSDT → latest BTC state
ETHUSDT → latest ETH state
SOLUSDT → latest SOL state
DOGEUSDT → latest DOGE state
XRPUSDT → latest XRP state
```

When a new event arrives, the latest state is updated.

Intermediate states do not need to be retained.

---

# Batching

The processor publishes snapshots at a configurable interval.

Default:

```text
100ms
```

Incoming ticker and order-book updates replace the in-memory latest state immediately. A timer then publishes a cloned snapshot of complete pairs. If nothing changed since the last publish, the interval is skipped so idle state is not rebroadcast.

Therefore the maximum intended broadcast frequency is approximately:

```text
10 snapshots / second
```

This provides a balance between:

- responsiveness
- network usage
- rendering cost
- backend processing

---

# Slow Consumers

A slow mobile client must not accumulate an unlimited backlog.

The backend therefore prefers the latest snapshot over an event queue.

Conceptually:

```text
Snapshot 1
Snapshot 2
Snapshot 3
Snapshot 4
```

If a client cannot consume all snapshots:

```text
Snapshot 1 → discard
Snapshot 2 → discard
Snapshot 3 → discard
Snapshot 4 → consume
```

The gateway implements this with one in-flight send and one pending snapshot per client. Memory growth remains bounded.

---

# Order Book Depth

The mobile UI only requires a small visible order book.

Default:

```text
10 bids
10 asks
```

Only the required depth should be retained/rendered.

---

# Buy Pressure

Buy pressure is calculated from bid volume.

```text
bidVolume = sum(bid.quantity)
askVolume = sum(ask.quantity)

buyPressure =
    bidVolume /
    (bidVolume + askVolume)
    × 100
```

Sell pressure:

```text
sellPressure =
    askVolume /
    (bidVolume + askVolume)
    × 100
```

Therefore:

```text
buyPressure + sellPressure = 100
```

Edge cases where total volume is zero must be handled safely.

---

# Spread

For a normal order book:

```text
spread = bestAskPrice - bestBidPrice
```

If either side of the order book is unavailable, the spread should be represented safely rather than producing invalid numeric values.

---

# Design Trade-off

This strategy deliberately discards intermediate market states.

That is acceptable because:

- The application is a market viewer.
- Users care about current state.
- Historical event replay is outside the assignment.
- Mobile rendering is more important than displaying every upstream event.

If this were an exchange execution system, the requirements would be different.
