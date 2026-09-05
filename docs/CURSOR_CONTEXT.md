# PulseCrypto — Cursor chat handoff

Read this instead of reconstructing the prior conversation. Verify against the repo if anything looks stale.

Repo: `H:\Chathu\Amused-group\pulse-crypto`  
OS: Windows, PowerShell. Prefer `pnpm.cmd` / `npm.cmd` if execution policy blocks `*.ps1`.

---

## 1. Purpose and assignment

Staff Engineer / Architect practical assignment: a **real-time crypto market viewer**.

- NestJS backend: Binance public market WebSocket → process latest state → REST metadata + WS snapshots to mobile.
- Expo React Native client: watchlist and pair details implemented.
- Goals: real-time processing, mobile performance, bounded memory, clean architecture, maintainability.

Required pairs: `BTCUSDT`, `ETHUSDT`, `SOLUSDT`, `DOGEUSDT`, `XRPUSDT`.

Engineering rules: `.cursor/rules/pulse-crypto.mdc`. Architecture: `docs/`.

---

## 2. Repository structure

Nx 23 + pnpm **integrated** monorepo.

```text
apps/api                 NestJS REST + native WS gateway
apps/mobile              Expo React Native
libs/contracts           @pulse-crypto/contracts  (REST + WS DTOs)
libs/market-domain       @pulse-crypto/market-domain
libs/shared              @pulse-crypto/shared  (reconnect backoff)
docs/
.cursor/rules/pulse-crypto.mdc
```

API market layout: `feed/`, `processing/`, `gateway/`, `api/`, composed in `apps/api/src/market/market.module.ts`.

Imports use package `exports` and TS `customConditions: ["@pulse-crypto/source"]` (not deprecated `baseUrl`/`paths`).

---

## 3. Technologies and versions

Declared / verified in this project:

| Piece | Version |
|---|---|
| Node | `>=22.12.0` (setup used **22.23.2** via NVM) |
| pnpm | **11.25.0** (`packageManager`) |
| Nx | **23.2.0** |
| TypeScript | ~6.0.3 |
| NestJS | ^11.0.0 (`@nestjs/platform-ws`, `@nestjs/websockets`) |
| Expo | ~56.0.0 (lockfile / prior check: **56.0.21**) |
| React Native | **0.85.3** |
| React | ^19.2.0 |
| Jest | ~30.3.0 |
| `ws` | ^8.21.3 |
| Zustand | **5.0.8** |
| AsyncStorage | **2.2.0** (not 3.x — Expo 56 managed) |

Node 18 was incompatible with Nx 23 + Expo 56.

---

## 4. Nx configuration

- `nx.json`: plugins `@nx/js/typescript`, webpack, eslint, jest, `@nx/expo`. `defaultBase`: `master`. `test` `dependsOn: ["^build"]`.
- Commands: `pnpm nx serve api`, `pnpm nx start mobile`, `pnpm nx run-many -t lint,test,typecheck,build`.
- Tags / boundaries (`eslint.config.mjs`): `api` → shared, domain, contracts; `mobile` → **shared + contracts only** (not `market-domain`).

---

## 5. Expo / mobile configuration

- `apps/mobile/app.json` (slug `mobile`, `newArchEnabled: true`). No `app.config.js/ts`.
- Metro: `apps/mobile/metro.config.js` — `expo/metro-config` + `@expo/metro` `mergeConfig` + `withNxMetro`. `cacheVersion: 'mobile'`.
- Babel: `apps/mobile/.babelrc.js` — `api.cache(true)`, preset `babel-preset-expo`.
- Entry: `apps/mobile/index.js` → `src/app/App.tsx`.
- Start: `@nx/expo` `start` forks Expo CLI with `cwd` = `apps/mobile`.
- Jest: `jest-expo`; maps `@pulse-crypto/contracts` and `@pulse-crypto/shared` to lib **source**. `App.spec.tsx` mocks `readMobileEnv` so tests do not open sockets.

Zustand **5.0.8** and `@react-native-async-storage/async-storage` **2.2.0**. Jest mocks AsyncStorage in `src/test-setup.ts`.

---

## 6–8. Android Studio / SDK / AVD

Not documented in git. Observed on this machine (2026-09-05):

- `ANDROID_HOME=H:\Chathu\Sdk` (directory exists: `platform-tools`, `emulator`, `platforms`, …).
- `ANDROID_SDK_ROOT` unset.
- Another SDK tree exists at `C:\Users\stela\AppData\Local\Android\Sdk`.
- Default AVD folder `C:\Users\stela\.android\avd` exists; a listing of AVD `.ini` files returned none.
- No `apps/mobile/android/local.properties` (no committed native Android project).

The user ran the app on an **Android emulator**. Emulator host loopback is `10.0.2.2`.

---

## 9. Environment variables

**API** (`apps/api/.env.example`; `apps/api/.env` was **missing** when checked):

```text
PORT=3000
MARKET_UPDATE_INTERVAL_MS=100
ORDER_BOOK_DEPTH=10
BINANCE_WS_BASE_URL=wss://stream.binance.com:9443
BINANCE_FEED_ENABLED=true
```

**Mobile** (`apps/mobile/.env.example` and a gitignored `apps/mobile/.env` were created):

```text
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
EXPO_PUBLIC_WS_URL=ws://10.0.2.2:3000/market
```

`.env` is gitignored. Restart Metro after changing Expo public env (reload is not enough).

`readMobileEnv()` uses static `process.env.EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_WS_URL` (Expo inlining).

---

## 10. Agreed architecture decisions (ADRs)

See `docs/DECISIONS.md`. In short:

- Latest-state per pair, in memory, no event replay (ADR-001, 003).
- Default 100ms snapshots (ADR-002).
- Bounded book, default 10/10 (ADR-004).
- Zustand + AsyncStorage favourites (ADR-005, 006) — implemented in Phase 7.
- REST metadata vs WS live data (ADR-007).
- No DB, no Kafka/Redis/RabbitMQ (ADR-008, 009).
- Nx + pnpm (ADR-010), Node 22 (ADR-011).
- Native WS, not Socket.IO (ADR-012).
- Binance `<symbol>@ticker` + `<symbol>@depthN@100ms` as replacement snapshots, not a local book engine (ADR-013, 014).
- Processor publishes via `MarketSnapshotSink`; gateway implements it (ADR-015).
- Per-client coalescing: 1 in-flight + 1 pending snapshot (ADR-016).

---

## 11. WebSocket / realtime

```text
Binance → BinanceFeedService → MarketProcessor → MarketGateway
  → MarketWebSocketService → MarketStore / FavoritesStore → UI
```

- Combined stream; parser normalizes to domain types; no Binance payloads on mobile.
- Processor: `Map` of latest state; ticker required before a pair is published; interval `MARKET_UPDATE_INTERVAL_MS`; skip publish if not dirty.
- Gateway path: `/market` (`MARKET_WS_PATH`). Protocol: `docs/WEBSOCKET_PROTOCOL.md` — `connection.ready`, `market.snapshot`, `error`.
- `main.ts` uses `applyNativeWsAdapter` (`WsAdapter` cast: Nest 11 typings mismatch).
- Mobile reconnect: `reconnectDelayMs` — 1s, 2s, 4s, 8s, 16s, 30s cap; one timer; reset on open.

---

## 12. Mobile state management

`MarketSession` → Zustand `MarketStore` + `FavoritesStore` → UI.

- `apps/mobile/src/session/market-session.ts` owns REST `GET /pairs/meta` and `MarketWebSocketService`. `refreshMeta()` does not restart the socket.
- `MarketStore`: `connectionStatus`, `markets` (map by pair, latest-state merge), `pairs` metadata, `metaError`, `protocolError`. Disconnect updates status only; markets are not cleared.
- `FavoritesStore`: favourite symbols only, hydrated/saved through `FavoritesStorage` (AsyncStorage key `@pulse-crypto/favorites`).
- `App.tsx` starts/stops `MarketSession` and switches Markets / Terminal via local tab + `selectedPair` state (no React Navigation). Visual tokens come from `UI/` PNG exports (`src/theme.ts`). Details subscribe with `selectMarket(pair)`. Pull-to-refresh on Markets calls `refreshMeta()` only.

---

## 13. Performance and resilience

- Do not forward every Binance event. ~10 snapshots/s max.
- Bounded maps, book depth, client send slots. No unbounded queues.
- Slow WS clients: drop older pending snapshots.
- Disconnect: set status; **do not clear** last market data.
- Pull-to-refresh = `GET /pairs/meta` only; must not restart WS.
- Do not log every market tick.
- RN: watchlist rows subscribe with `selectMarket(pair)`; the list does not subscribe to the full `markets` map (`docs/PERFORMANCE.md`).

---

## 14. Explicitly not used

Kafka, Redis, RabbitMQ, databases, CQRS/event sourcing, Socket.IO, React Navigation, a full order-book engine, REST polling for live prices, `any` without cause, extra state libraries beyond Zustand.

---

## 15. Completed (code)

- **Phase 0–5:** workspace, contracts, REST `GET /pairs/meta` (static metadata), Binance feed, processor, mobile WS gateway + tests.
- **Phase 6:** `fetchPairsMeta`, `MarketWebSocketService`, connection states, reconnect, live path confirmed on Android emulator.
- **Phase 7:** Zustand `MarketStore` / `FavoritesStore`, AsyncStorage favourites, `MarketSession` as the networking composition root.
- **Phase 8:** Watchlist with pair rows, price, 24h change, connection indicator, search, and favourite toggle.
- **Phase 9:** Market details (price, spread, buy/sell pressure, bounded order book, last updated). Watchlist → details via local selected-pair state.
- **Phase 10 (partial) + visual pass:** Dark PulseCrypto theme from `UI/` PNGs (not Figma MCP — Dev Mode unavailable). Markets/Terminal chrome, order-book depth bars, price tick flash, pull-to-refresh metadata. Telemetry/Settings/account sidebar from the Figma exports were not built — they are not assignment features and would require fake telemetry.

---

## 16. Currently in progress

Nothing in-flight. Visual restyle from PNG references is in place. Remaining Phase 10 polish: loading placeholders, richer error states, order-book quantity animation.

---

## 17. Exact next step

**Phase 10 remainder:** loading placeholders and stronger empty/error states. Order-book quantity animation if it stays cheap. Do not add Figma Telemetry/Settings unless real data exists.

---

## 18. Known issues

- Earlier emulator blank-env (`Set EXPO_PUBLIC_WS_URL…`) was resolved by updating env values and running Expo; keep Metro restarted after `.env` changes.
- `apps/api/.env` missing when last checked; API can still use example defaults from `process.env` / code defaults.
- Nest 11 `WsAdapter` vs `WebSocketAdapter` types: cast in `applyNativeWsAdapter`.
- PowerShell may block `pnpm`/`npm` scripts; use `pnpm.cmd`.
- `api.cache(true)` in mobile Babel can cache a config from before env existed.
- Jest worker leak was seen when `App` tests accidentally started WS; mitigated by mocking `readMobileEnv`.
- Processor omits pairs until a ticker arrives; book-only updates are held internally.
- REST 24h stats are **static placeholders**, not Binance.

---

## Commands cheat sheet

```powershell
pnpm.cmd nx serve api
pnpm.cmd nx start mobile
pnpm.cmd nx run-many -t lint,test,typecheck -p api,mobile
```
