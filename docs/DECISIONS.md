# Architectural Decisions

## ADR-001: Latest-State Processing

### Decision

Maintain only the latest market state per trading pair.

### Reason

The application is a real-time viewer rather than an event-replay system.

Retaining every upstream event would increase memory and downstream processing unnecessarily.

### Trade-off

Intermediate market states may be discarded.

### Alternative

An append-only event queue could preserve every update, but this would add memory pressure and complexity without providing value for this application.

---

# ADR-002: 100ms Broadcast Interval

### Decision

Broadcast processed market snapshots every 100ms by default.

### Reason

The UI does not need to render every upstream Binance event.

100ms provides approximately 10 updates per second, which is responsive while reducing unnecessary mobile work.

### Trade-off

The UI does not represent every intermediate market change.

---

# ADR-003: In-Memory Market State

### Decision

Keep current market state in memory.

### Reason

The assignment does not require persistence or historical market data.

### Trade-off

Market state is lost when the backend restarts.

### Alternative

Redis or a database could persist state, but that would introduce unnecessary infrastructure.

---

# ADR-004: Bounded Order Book

### Decision

Maintain/render only the top N order-book levels.

Default:

```text
10 bids
10 asks
```

### Reason

The UI only requires a small visible order book.

### Trade-off

The application does not represent the complete exchange order book.

---

# ADR-005: Zustand

### Decision

Use Zustand for mobile application state.

### Reason

The state requirements are relatively small, while selective subscriptions are useful for frequent market updates.

### Alternative

Redux could provide similar capabilities but would introduce additional ceremony for this application.

---

# ADR-006: AsyncStorage for Favourites

### Decision

Persist favourites using AsyncStorage.

### Reason

Favourites are small local user preferences and do not require a backend.

### Trade-off

Favourites are device-local.

---

# ADR-007: REST and WebSocket Separation

### Decision

Use REST for metadata and WebSocket for live market state.

### Reason

These have different lifecycle and consistency requirements.

Pull-to-refresh should not interrupt the live market stream.

---

# ADR-008: No Database

### Decision

Do not use a database.

### Reason

No persistent server-side state is required by the assignment.

Introducing a database would add operational complexity without improving the core solution.

---

# ADR-009: No Message Broker

### Decision

Do not use Kafka, RabbitMQ, Redis Streams, or similar infrastructure.

### Reason

The assignment has a single backend process and a small number of responsibilities.

The latest-state model is sufficient.

### Future

A message broker could become appropriate if ingestion and client broadcasting needed to scale independently across multiple backend instances.

---

# ADR-010: Nx + pnpm Integrated Monorepo

### Decision

Use Nx 23 as an integrated monorepo with pnpm workspaces.

### Reason

The assignment has two applications and a small number of shared libraries. Nx gives consistent lint/test/build/typecheck targets without introducing extra runtime infrastructure.

### Trade-off

Developers need to use Nx project commands (`pnpm nx ...`) rather than ad-hoc per-app scripts.

---

# ADR-011: Node 22 LTS

### Decision

Require Node.js 22 LTS (`>=22.12.0`).

### Reason

Nx 23, Expo SDK 56, and current NestJS tooling are not compatible with Node 18. Node 22 is still in LTS and is the conservative version that satisfies all three.

### Trade-off

Contributors must upgrade from Node 18.

---

# ADR-012: Native WebSockets, Not Socket.IO

### Decision

Use NestJS native WebSockets (`@nestjs/platform-ws`) rather than Socket.IO.

### Reason

The mobile client will use the React Native `WebSocket` API and a documented JSON protocol. Socket.IO would add a second protocol and an extra client dependency without a demonstrated benefit.

### Trade-off

We do not get Socket.IO rooms, acknowledgements, or automatic fallbacks. Those are not required for snapshot broadcast.
