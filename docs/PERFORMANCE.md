# Performance Strategy

## Primary Performance Requirement

The application must remain smooth while receiving market updates approximately every 100ms.

This means the application may process approximately:

```text
10 market snapshots / second
```

---

# Backend Performance

The backend avoids forwarding every Binance event.

Instead:

```text
High-frequency input
        ↓
Latest state
        ↓
100ms snapshot
        ↓
WebSocket clients
```

This reduces downstream work.

---

# Memory

The following structures must remain bounded:

- Market state
- Order-book depth
- Client state
- Reconnect timers

No unbounded event queue should be introduced.

---

# React Native Rendering

Avoid causing the entire application tree to re-render for every market update.

Use selective Zustand subscriptions.

`selectMarket(pair)` is used by watchlist rows so a price update re-renders that row, not the whole list. The watchlist screen subscribes to pair metadata, search input, and errors — not the `markets` map. The details screen subscribes to one pair only.

---

# Order Book

The order book is intentionally bounded.

Default:

```text
10 bids
10 asks
```

This prevents unnecessarily large lists from being rendered.

---

# FlatList

Use `FlatList` when list behavior benefits from virtualization or when the list could grow.

For the current five supported pairs, a simple list could also be sufficient.

The implementation should favor clarity unless profiling demonstrates a need for additional optimization.

---

# Animations

Price changes use a 350ms background tint on the updated row or details price block (`useTickFlash`). That is isolated to the component that already subscribed to that pair.

---

# Search

Search operates against the small supported-pair list.

It does not require complex optimization.

Avoid premature memoization.

---

# Performance Philosophy

Do not optimize everything by default.

The goal is:

```text
Measure / reason
      ↓
Identify bottleneck
      ↓
Apply targeted optimization
```

not:

```text
Add memoization everywhere
```

---

# Potential Future Scaling

If the number of trading pairs increased significantly, potential future improvements could include:

- More aggressive selector-based state subscriptions
- Virtualized watchlists
- More efficient order-book diffing
- Binary WebSocket protocols
- Worker-based processing
- Server-side subscription filtering

These are intentionally outside the scope of the assignment.

---

# Phase 12 review (current five pairs)

Observed from the implementation, not from a profiler run:

- Watchlist rows and details subscribe with `selectMarket(pair)`. The list does not subscribe to the full `markets` map.
- Snapshots replace latest state; the client does not queue ticks.
- Order-book bars are width + a 350ms quantity flash. No per-level `Animated.Value` (that would allocate on every 100ms snapshot).
- Five pairs do not need FlatList virtualization.
- Tick flash is local to the updated row or details price block.

If pair count grew into the hundreds, revisit virtualized lists and cheaper book diffs.

