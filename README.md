# PulseCrypto

Real-time cryptocurrency market viewer: a NestJS backend gateway over Binance public market data, and an Expo React Native client.

This is a Staff Engineer / Architect practical assignment. The architecture is documented in `docs/`.

## Requirements

- Node.js 22 LTS (`22.23.2` or compatible `>=22.12.0`)
- pnpm 11 (via Corepack)

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

## Setup

```powershell
pnpm install
copy apps\api\.env.example apps\api\.env
copy apps\mobile\.env.example apps\mobile\.env
```

`apps/mobile/.env` defaults to the Android emulator host (`10.0.2.2`). Restart Metro after changing it. Do not commit `.env` files.

## Workspace

```text
apps/api              NestJS REST + WebSocket gateway
apps/mobile           Expo React Native client
libs/contracts        Shared API / WebSocket DTOs
libs/market-domain    Market domain models and calculations
libs/shared           Small shared utilities
docs/                 Architecture and implementation notes
```

## Commands

Prefer `pnpm nx ...` over global Nx.

```powershell
pnpm nx graph
pnpm nx serve api
pnpm nx start mobile
pnpm nx lint api
pnpm nx test api
pnpm nx build api
pnpm nx typecheck api
pnpm nx lint mobile
pnpm nx test mobile
pnpm nx run-many -t lint test build typecheck
```

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, and tests on every pull request, and builds `api` plus the shared libraries. Expo `mobile` `build` is omitted from CI because it needs EAS/native credentials.

## Architecture

Live market data uses latest-state snapshots (default 100ms), not a 1:1 forward of every Binance event.

```text
Binance → BinanceFeedService → MarketProcessor → WebSocketGateway
  → React Native WebSocketService → MarketStore → UI
```

See:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
- [docs/DECISIONS.md](docs/DECISIONS.md)
