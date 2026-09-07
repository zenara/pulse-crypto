# PulseCrypto

Real-time cryptocurrency market viewer: a NestJS backend gateway over Binance public market data, and an Expo React Native client.

This is a Staff Engineer / Architect practical assignment. Architecture lives in `docs/`. A longer paper is [docs/presentation/PulseCrypto-Architecture.pdf](docs/presentation/PulseCrypto-Architecture.pdf); this README is the assignment entry point.

## Deliverables

| Asked | Where |
|---|---|
| `GET /pairs/meta` | API at `http://localhost:3000/pairs/meta` when serving |
| Complete source | This Git repository |
| Screen recording | Submit separately (not stored in git). A 30–45s path is under [Expected behaviour](#expected-behaviour). |
| README | This file |

---

## Requirements

- Node.js 22 LTS (`>=22.12.0`; this repo was developed on `22.23.2`)
- pnpm 11 via Corepack (`packageManager` is `pnpm@11.25.0`)
- Android emulator **or** iOS simulator (host URLs differ; see Setup)

**Windows (NVM):**

```powershell
nvm install 22.23.2
nvm use 22.23.2
corepack enable
corepack prepare pnpm@11.25.0 --activate
```

PowerShell may block `npm.ps1` / `pnpm.ps1` when execution policy is Restricted. Use `npm.cmd` / `pnpm.cmd`, or `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

**macOS / Linux:**

```bash
# nvm, fnm, or any Node 22 LTS
corepack enable
corepack prepare pnpm@11.25.0 --activate
```

---

## Setup

```powershell
pnpm install
copy apps\api\.env.example apps\api\.env
copy apps\mobile\.env.example apps\mobile\.env
```

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

`apps/mobile/.env` defaults to the **Android emulator** host (`10.0.2.2`). For the **iOS simulator**, use `localhost`. For a **physical device**, use the host LAN IP. Restart Metro after changing `.env`. Do not commit `.env` files.

Expo Go on the emulator is enough (`pnpm nx start mobile`, then press `a`). A custom dev client is not required for the local demo.

### API environment

Copied from `apps/api/.env.example`:

| Variable | Default | Role |
|---|---|---|
| `PORT` | `3000` | HTTP + WebSocket port |
| `MARKET_UPDATE_INTERVAL_MS` | `100` | Snapshot publish interval |
| `ORDER_BOOK_DEPTH` | `10` | Bounded bids/asks (`5`, `10`, or `20`) |
| `BINANCE_WS_BASE_URL` | `wss://stream.binance.com:9443` | Combined stream base |
| `BINANCE_FEED_ENABLED` | `true` | Set `false` to run the API without Binance |

---

## Build and run

Two processes: API first, then Expo.

```bash
pnpm nx serve api
```

Second terminal:

```bash
pnpm nx start mobile
```

Open the Android emulator (Expo: press `a`). From the host, confirm REST:

```bash
curl http://localhost:3000/pairs/meta
```

From the Android emulator that URL is `http://10.0.2.2:3000/pairs/meta`. Live snapshots are `ws://localhost:3000/market` (emulator: `ws://10.0.2.2:3000/market`). On connect the server sends `connection.ready`, then `market.snapshot` when a snapshot exists.

### Checks that match CI

GitHub Actions (`.github/workflows/ci.yml`) runs on pull requests and on pushes to `main` / `master`:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm nx run-many -t build -p api,contracts,shared,market-domain
```

Equivalent Nx forms: `pnpm nx lint api`, `pnpm nx test mobile`, and so on.

Do **not** run a workspace-wide `build` that includes `mobile`. Expo `mobile` `build` is omitted from CI because it needs EAS / native credentials.

---

## Workspace

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

## Expected behaviour

- Watchlist: five USDT pairs (BTC, ETH, SOL, DOGE, XRP), last price, 24h change, connection pill.
- Search filters the pair list; it does not reset market state.
- Star a pair: favourites persist across app restart (AsyncStorage only).
- Open a pair: details show spread, buy/sell pressure, bounded order book (~10/10), last updated.
- Pull-to-refresh calls `GET /pairs/meta` only. The WebSocket must keep running.
- Stop the API: pill goes disconnected / reconnecting; **last prices stay on screen**.
- Restart the API: the app reconnects and applies the next snapshot.

Connection pill means **phone ↔ this API**, not **API ↔ Binance**. If Binance is down but the mobile socket is up, the UI can still say connected while prices freeze. The API keeps serving the last in-memory snapshot until process restart.

**Screen recording (about 30–45s):** watchlist ticking → search → star → details + book → kill API (stale hint) → restart API (reconnect). Still frames: [docs/presentation/SCREENSHOTS.md](docs/presentation/SCREENSHOTS.md).

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

- Pair metadata may be static/mocked. The assignment allows that; the provider is still behind an interface. REST 24h high/low/volume on `/pairs/meta` are placeholders; live stats come from the ticker snapshot.
- Supported pairs are the five USDT symbols: BTC, ETH, SOL, DOGE, XRP.
- Binance public streams require no API key.
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
| Connection status = client socket | Binance outage is not a separate UI state; prices can go stale while the pill still says connected |

If pair count or client count grew substantially, the next changes would be subscription filtering, virtualised lists, and (only then) a shared latest-value store — not an event broker.

---

## How AI-assisted development tools were used

Cursor (agent chat in the IDE) was used throughout. It was **not** the source of the architecture.

**What stayed human:** system boundaries, latest-state vs event replay, 100ms batching, native WebSocket protocol, Zustand store split, no Kafka/Redis/database, and the ADRs in `docs/` **before** the corresponding code.

**Workflow:** write or update the decision in `docs/` → ask for a bounded slice → review the diff → run lint / typecheck / tests → challenge failure paths (slow consumers, disconnect without wiping markets, selector scope, details-view update loops).

**Used for:** Nx/Nest/Expo scaffolding, tests, refactors, review prompts, README and architecture docs, and a later staff-style review of the implementation.

**Not used for:** inventing Binance stream behaviour, choosing Socket.IO or a message broker “because it is common”, or accepting generated code without running tests.

Generated output was treated as a proposal. The developer remains responsible for architecture, correctness, and failure-path behaviour. Longer notes: [docs/AI_DEVELOPMENT.md](docs/AI_DEVELOPMENT.md).

---

## Further reading

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/WEBSOCKET_PROTOCOL.md](docs/WEBSOCKET_PROTOCOL.md)
- [docs/API_CONTRACT.md](docs/API_CONTRACT.md)
- [docs/REALTIME_PROCESSING.md](docs/REALTIME_PROCESSING.md)
- [docs/MOBILE_ARCHITECTURE.md](docs/MOBILE_ARCHITECTURE.md)
- [docs/PERFORMANCE.md](docs/PERFORMANCE.md)
- [docs/TESTING.md](docs/TESTING.md)
- [docs/AI_DEVELOPMENT.md](docs/AI_DEVELOPMENT.md)
- [docs/presentation/PulseCrypto-Architecture.pdf](docs/presentation/PulseCrypto-Architecture.pdf)
