# Copilot instructions for `bankable`

## Build, test, lint, and local data commands

```bash
npm ci
npm run dev
npm run lint
npm run test
npx tsx --test src/lib/payment-gateways.test.ts
npm run build
```

Database workflows use Drizzle against PostgreSQL:

```bash
npm run db:push
npm run db:seed
npm run db:studio
```

CI parity command sequence (see `.github/workflows/ci.yml`):

```bash
npm ci
npm run lint
npm run test -- --runInBand
npm run build
```

## High-level architecture

This is a Next.js 16 App Router app with most business logic in Route Handlers under `src/app/api/**`. UI pages are split between public routes (`/`, `/courses`, `/pricing`) and authenticated flows (`/dashboard`, `/my-courses`, `/payments`, `/admin`), where pages typically call internal APIs rather than reading the DB directly.

Auth is built with Better Auth (`src/lib/auth.ts`) + Drizzle adapter, exposed via `src/app/api/auth/[...all]/route.ts`. Server-side guards live in `src/lib/auth-helpers.ts` (`requireAuth`, `requireMember`, `requireAdmin`). Route protection at navigation level is handled by `src/proxy.ts` via the `better-auth.session_token` cookie.

Persistence uses Drizzle (`src/db/index.ts`) with modular schema files in `src/db/schema/*` and a central barrel in `src/db/schema/index.ts`. Tables use text UUID primary keys and explicit relation wiring.

Payment/access is a core cross-cutting flow:

1. checkout creation: `/api/payments/checkout` (lifetime membership) and `/api/payments/premium-checkout` (single paid course/webinar)
2. status updates: `/api/payments/webhook` (Midtrans/Xendit) or admin manual approval at `/api/admin/payments/[id]`
3. entitlement activation:
   - membership tier activation via `activateMembership` in `src/lib/membership.ts`
   - premium course entitlement via `grantPaidCourseAccess` in `src/lib/course-access.ts`
4. course/progress APIs enforce entitlement checks (`/api/courses/[slug]`, `/api/progress`, dashboard aggregates)

Payment runtime behavior is centrally configurable from the DB row `payment_settings.id = "global"` through admin settings (`/api/admin/settings`) and helper `src/lib/payment-settings.ts`.

## Key repository conventions

- Follow the existing guard pattern in API handlers: call `requireAuth`/`requireMember`/`requireAdmin`, and in `catch` rethrow `Response` errors before handling generic errors.
- Treat `providerPayload.courseSlug` as the discriminator for premium-course purchases; no `courseSlug` means membership-style purchase.
- Keep payment mode/provider normalization in `src/lib/payment-settings.ts` (`MANUAL|GATEWAY`, `MIDTRANS|XENDIT`) and reuse it instead of re-parsing env vars in each route.
- Use `@/*` path aliases (`tsconfig.json`) for imports from `src`.
- IDs are generated in application code with `crypto.randomUUID()` and stored as `text` keys across schemas.
- Numeric DB values (price/amount) are stored as Drizzle `numeric`, so existing code converts with `Number(...)` / `parseFloat(...)` at usage boundaries.
- Existing tests use Node’s built-in test runner through `tsx --test` and live in `src/**/*.test.ts`.
- This repo has local AI guidance in `CLAUDE.md`: when changing Next.js behavior, check docs under `node_modules/next/dist/docs/` because this project uses a newer Next.js version with breaking changes from older patterns.

## MCP server setup in this repository

Playwright MCP is configured at `.vscode/mcp.json` so editor-based agent sessions can reuse it.

- Server name: `playwright`
- Command: `npx @playwright/mcp@latest`

For Copilot CLI specifically, MCP servers are read from `~/.copilot/mcp-config.json`. Mirror this same server definition there (or use `/mcp add`) if you want the terminal CLI session to use Playwright MCP directly.
