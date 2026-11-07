# Ember — Tech Stack

## Core

- **Framework:** Next.js 16 (App Router) — this version has breaking changes vs. earlier releases. Always read `node_modules/next/dist/docs/` before writing Next.js-specific code.
- **React:** 19.3
- **Language:** TypeScript 5, strict mode enabled
- **Styling:** Tailwind CSS v4 via `@tailwindcss/turbopack` — loaded through Turbopack, not PostCSS. Do not add a `postcss.config` file.
- **Fonts:** Geist Sans + Geist Mono via `next/font/google`

## Build tooling

- **Dev server / bundler:** Turbopack (configured in `next.config.ts`)
- **Build:** `npm run build` → `next build`
- **Lint:** `npm run lint` → ESLint 9 with `eslint-config-next`

## Testing

- **Runner:** Vitest 3 with `@vitejs/plugin-react`
- **DOM environment:** jsdom
- **Coverage:** `@vitest/coverage-v8`
- **Property testing:** `fast-check`
- Commands:
  - `npm test` — single run
  - `npm run test:watch` — watch mode
  - `npm run test:coverage` — coverage report
- Test files live in `src/__tests__/` and co-located `*.test.ts(x)` files

## Path aliases

`@/*` maps to `src/*`. Use `@/components/Foo` not `../../components/Foo`.

## TypeScript notes

- `moduleResolution: bundler` — use Node-style imports without file extensions
- `strict: true` — no implicit any, no loose nulls
- `isolatedModules: true` — each file must be independently type-checkable

## Environment variables

Secrets and config go in `.env.local` (already gitignored). Access via `process.env.NEXT_PUBLIC_*` for client-side values, plain `process.env.*` for server-only.

## Conventions

- Prefer Server Components by default; add `"use client"` only when browser APIs or interactivity require it
- Co-locate component styles with the component using Tailwind utility classes — no separate CSS modules unless necessary
- API routes go in `src/app/api/` as Route Handlers (`route.ts`)
- Keep data fetching in Server Components or Route Handlers; avoid fetching in Client Components unless strictly needed for real-time UX
