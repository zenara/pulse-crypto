# PulseCrypto

Real-time cryptocurrency market viewer: a NestJS backend gateway over Binance public market data, and an Expo React Native client.

This is a Staff Engineer / Architect practical assignment. The architecture is documented in `docs/`. A longer technical paper is in [docs/presentation/PulseCrypto-Architecture.pdf](docs/presentation/PulseCrypto-Architecture.pdf). **That PDF does not replace this README.** The assignment asks for the sections below in the repository README.

## Deliverables

| Asked | Where |
|---|---|
| `GET /pairs/meta` | Implemented on the API (`http://localhost:3000/pairs/meta` when serving) |
| Complete source | This Git repository |
| Screen recording | Submit separately (not stored in git) |
| README | This file |

---

## Requirements

- Node.js 22 LTS (`22.23.2` or compatible `>=22.12.0`)
- pnpm 11 (via Corepack)
- Android emulator **or** iOS simulator for the mobile app (emulator host URLs differ; see Setup)

If NVM for Windows is installed:

```powershell
nvm install 22.23.2
nvm use 22.23.2
```

Enable pnpm:

```powershell
corepack enable
corepack prepare pnpm@11.25.0 --activate
```

PowerShell may block `npm.ps1` / `pnpm.ps1` when the execution policy is Restricted. Use `npm.cmd` / `pnpm.cmd`, or:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

## Setup

```powershell
pnpm install
copy apps\api\.env.example apps\api\.env
copy apps\mobile\.env.example apps\mobile\.env
```

`apps/mobile/.env` defaults to the Android emulator host (`10.0.2.2`). For the iOS simulator, use `localhost`. For a physical device, use the host LAN IP. Restart Metro after changing `.env`. Do not commit `.env` files.

---

## Build and run

Two processes: API first, then the Expo app.

```powershell
pnpm nx serve api
```

In a second terminal:

```powershell
pnpm nx start mobile
```

Then open the app on the Android emulator (Expo: press `a`, or run the project from Android Studio if you use a native run). Confirm metadata:

```text
GET http://localhost:3000/pairs/meta
```

From the emulator the same host is `http://10.0.2.2:3000`.

Other workspace commands:

```powershell
pnpm nx lint api
pnpm nx test api
pnpm nx build api
pnpm nx typecheck api
pnpm nx lint mobile
pnpm nx test mobile
pnpm nx run-many -t lint test build typecheck
```

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, and tests on every pull request, and builds `api` plus the shared libraries. Expo `mobile` `build` is omitted from CI because it needs EAS/native credentials.

### Workspace

```text
apps/api              NestJS REST + WebSocket gateway
apps/mobile           Expo React Native client
libs/contracts        Shared API / WebSocket DTOs
libs/market-domain    Market domain models and calculations
libs/shared           Small shared utilities
docs/                 Architecture and implementation notes
```

Live market data uses latest-state snapshots (default 100ms), not a 1:1 forward of every Binance event:

```text
Binance → BinanceFeedService → MarketProcessor → WebSocketGateway
  → React Native WebSocketService → MarketStore → UI
```

---

## Architectural decisions

Full ADRs: [docs/DECISIONS.md](docs/DECISIONS.md). Summary:

1. **Latest-state processing.** One in-memory `MarketState` per pair. Intermediate Binance events are discarded. This is a viewer, not an event log.
2. **100ms snapshot clock** (`MARKET_UPDATE_INTERVAL_MS`). Downstream cadence is ~10 Hz even if upstream is faster. Idle intervals are skipped.
3. **In-memory only.** No database. No Kafka/Redis/RabbitMQ. One process is enough for five pairs.
4. **Bounded order book** (default 10/10) from Binance partial depth (`@depthN@100ms`), not a local matching engine.
5. **Native WebSocket**, not Socket.IO. The mobile client uses the platform `WebSocket` API and a documented JSON protocol.
6. **REST vs WebSocket.** `GET /pairs/meta` for metadata. WebSocket `/market` for live snapshots. Pull-to-refresh must not restart the socket.
7. **Zustand, two stores.** `MarketStore` (live data, connection) vs `FavoritesStore` (persisted symbols only, AsyncStorage).
8. **Per-client coalescing.** At most one in-flight send and one pending snapshot per phone. Slow clients skip intermediate snapshots, never grow a queue.
9. **Nx 23 + Node 22.** Required by current Nest/Expo tooling.
10. **Mobile does not import `market-domain`.** Spread and pressure are computed on the server and sent in the snapshot.

---

## Assumptions

- Pair metadata may be static/mocked. The assignment allows that; the provider is still behind an interface.
- Supported pairs are the five USDT symbols: BTC, ETH, SOL, DOGE, XRP.
- Binance public streams require no API key. If Binance is unreachable, the API still serves last in-memory state to connected clients until process restart.
- The product is a **market viewer**. Dropping intermediate ticks is acceptable. An execution or audit system would not make this assumption.
- The order book is the exchange top-N at 100ms, not a full-book reconstruction.
- Favourites are device-local. There is no user account.
- Primary mobile target for local demo is the Android emulator (`10.0.2.2`).
- No authentication, no trading, no historical candles.

---

## Trade-offs

| Choice | Cost |
|---|---|
| Drop intermediate ticks | UI is not a complete tape of Binance events |
| 100ms broadcast | At most ~10 UI updates/s; depth and ticker are merged onto one clock |
| In-memory state | Lost on API restart; no horizontal scale of ingest vs fan-out without a later shared store |
| Partial depth snapshot | Book beyond N levels is omitted; brief gaps on reconnect are healed by the next snapshot |
| No Socket.IO | No rooms, acks, or HTTP fallback |
| No Redux / React Navigation | Less ceremony; two screens and two stores only |
| Static metadata | REST 24h high/low/volume may lag the live ticker until a live metadata source is plugged in |
| Coalesce slow clients | A slow phone skips snapshots B when C arrives; it always converges to latest |

If pair count or client count grew substantially, the next changes would be subscription filtering, virtualised lists, and (only then) a shared latest-value store — not an event broker.

---

## How AI-assisted development tools were used

Cursor was used throughout implementation. It was **not** allowed to invent the architecture.

Workflow: define the requirement and the decision in `docs/` → ask the agent to implement a bounded slice → review the diff → run lint/typecheck/tests → challenge the result (slow consumers, disconnect-without-wipe, selector scope).

Used for: scaffolding, tests, refactors, review prompts, documentation. Not used as an authority on Binance behaviour or as a substitute for the ADRs.

The developer remains responsible for architecture, correctness, and the failure-path behaviour. Longer notes: [docs/AI_DEVELOPMENT.md](docs/AI_DEVELOPMENT.md).

---

## Further reading

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/WEBSOCKET_PROTOCOL.md](docs/WEBSOCKET_PROTOCOL.md)
- [docs/API_CONTRACT.md](docs/API_CONTRACT.md)
- [docs/REALTIME_PROCESSING.md](docs/REALTIME_PROCESSING.md)
- [docs/MOBILE_ARCHITECTURE.md](docs/MOBILE_ARCHITECTURE.md)
- [docs/PERFORMANCE.md](docs/PERFORMANCE.md)
- [docs/TESTING.md](docs/TESTING.md)
- [docs/presentation/PulseCrypto-Architecture.pdf](docs/presentation/PulseCrypto-Architecture.pdf)
