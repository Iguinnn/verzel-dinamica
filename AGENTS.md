# AGENTS.md

Working notes for coding agents in this repository. Human-facing docs live in
[README.md](README.md), [CHALANGE.md](CHALANGE.md) and [docs/work-plan.md](docs/work-plan.md).

## What this is

A rotating parking lot manager: sectors, reservations, waiting lists, ranking and
per-reservation history. The backlog is split into five stories (`ESTC-1` to
`ESTC-5`) built in parallel by different people, so **the folder layout exists to
keep those stories from colliding**. Respect it.

## Stack

| Layer     | Choice                                       |
| --------- | -------------------------------------------- |
| Monorepo  | npm workspaces                               |
| Frontend  | Next.js 16 (App Router, RSC), React 19        |
| UI        | shadcn/ui (`base-nova` style) on Base UI      |
| Styling   | Tailwind CSS v4 (CSS-first, no `tailwind.config`) |
| Backend   | Express + TypeScript                          |
| Database  | PostgreSQL + Drizzle ORM                      |
| Contracts | Zod, shared via `@parking/contracts`          |

## Repository layout

```text
apps/
  api/                  Express API and database access
  web/                  Next.js interface and BFF
packages/
  contracts/            Zod contracts shared by API and web
docs/                   Data model (DBML) and work plan
scripts/dev.mjs         Runs api + web together
```

## Frontend layout (`apps/web/src`)

Organised by **module**, not by file type. A screen and everything it needs live
together; only routing lives in `app/`.

```text
app/                          Routing only. Pages are thin and just mount a module view.
  layout.tsx                  Root layout. Pins `class="dark"` and the font.
  page.tsx                    Redirects to routes.dashboard.
  globals.css                 THE DESIGN SYSTEM — all design tokens live here.
  (auth)/                     Route group rendered WITHOUT the app shell.
    login/page.tsx            /login
  (dashboard)/                Route group rendered INSIDE the app shell.
    layout.tsx                Session guard + <AppShell>.
    admin/page.tsx            /admin              — main screen
    admin/setores/page.tsx    /admin/setores      — listing screen
    admin/historico/page.tsx  /admin/historico    — history screen
  api/sectors/route.ts        BFF route handler.

modules/                      One folder per business capability. Own your module.
  auth/
    types.ts                  SessionUser view model + helpers.
    session.ts                getSessionUser() — the ONLY auth seam. See below.
    actions.ts                signInAction / signOutAction Server Actions.
    components/               login-form.tsx, login-view.tsx
  dashboard/components/       dashboard-view.tsx
  sectors/components/         sectors-view.tsx
  history/components/         history-view.tsx

components/
  ui/                         shadcn primitives. GENERATED — add via CLI, avoid hand-edits.
  layout/                     app-shell, app-sidebar, app-topbar, user-menu
  common/                     Cross-module pieces: page-header, page-shell, hello-world

config/
  site.ts                     Branding strings + the `routes` map.
  navigation.ts               Sidebar items + active-route matching.

lib/
  utils.ts                    cn() helper.
  server/sectors.ts           Server-side data access for the BFF.

hooks/                        Shared React hooks (use-mobile).
```

### Adding a screen

1. Create `modules/<name>/components/<name>-view.tsx`.
2. Add the path to `routes` in `config/site.ts`.
3. Add the sidebar entry to `config/navigation.ts`.
4. Add a page under `app/(dashboard)/` that imports the view and nothing else.

No layout file needs editing. Two people adding two screens touch disjoint files.

### Rules

- **Pages stay thin.** A `page.tsx` exports `metadata` and returns one module
  view. Business logic, data fetching and markup belong to the module.
- **Never import across modules.** If `sectors` and `history` both need
  something, it goes in `components/common/`, `lib/` or `packages/contracts`.
- **Never hardcode a path.** Import from `routes` in `config/site.ts`.
- **Server Components by default.** Add `"use client"` only where you need
  state, effects or event handlers — currently `app-sidebar` and `user-menu`.
- Shared request/response shapes belong in `packages/contracts` so the API and
  the web app validate against the same schema.

## Design system

Defined entirely in `apps/web/src/app/globals.css` as CSS custom properties.
There is no `tailwind.config` — Tailwind v4 reads tokens from `@theme inline`.

**Dark-only and monochromatic, on purpose.**

- Tokens sit on `:root`, so they apply unconditionally.
- `<html>` still carries `class="dark"` because the shadcn primitives ship
  `dark:` utilities internally. **Do not remove that class** — the components
  break subtly without it.
- Do not add a light palette or a theme toggle.
- Every neutral is pure greyscale (`oklch(L 0 0)`, zero chroma). `--primary` is
  white: on a dark monochrome surface, emphasis comes from luminance, not hue.
- Only `--destructive`, `--success` and `--warning` carry a hue, and only
  because they are semantic. Never introduce a decorative colour.
- Charts separate series by lightness (`--chart-1`…`--chart-5`), not by hue.

Token groups: surfaces (`background`, `card`, `popover`), brand (`primary`),
neutrals (`secondary`, `muted`, `accent`), feedback (`destructive`, `success`,
`warning`), lines and focus (`border`, `input`, `ring`), charts, and sidebar.

Style with token utilities — `bg-card`, `text-muted-foreground`, `border-border`.
Never write a raw hex, and never reach for a Tailwind palette colour such as
`bg-zinc-800`; that bypasses the system.

Two helpers live in `@layer components`: `.ds-page` (standard screen padding and
rhythm, used by `PageShell`) and `.ds-aurora` (the login backdrop glow).

### Adding a shadcn component

```bash
npx shadcn@latest add <component>
```

Run it from `apps/web`. It respects `components.json` and writes to
`src/components/ui`. Compose primitives in `components/common` or inside a
module rather than editing generated files.

## Authentication

Not implemented yet. Everything routes through **one seam**:

- `modules/auth/session.ts` — `getSessionUser()` returns a hardcoded
  `SessionUser`. Replace the body with the real lookup and return `null` when
  signed out; `app/(dashboard)/layout.tsx` already redirects on `null`.
- `modules/auth/actions.ts` — `signInAction` and `signOutAction` currently just
  redirect. Add credential checks and cookie teardown here.

The UI depends only on the `SessionUser` type, so wiring the backend should not
touch any component. Keep it that way. Authorisation must be enforced on the
server, not by hiding UI elements.

## BFF

`apps/web` talks to Express through `lib/server/sectors.ts` using `API_URL`.
The BFF validates successful responses and API errors with the shared Zod
contracts. Do not add a second in-memory implementation when the Express route
already exists.

## Commands

Run from the repository root.

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm test
```

`npm run dev:web` and `npm run dev:api` start a single service. Web is on
`http://localhost:3000`, API on `http://localhost:3333`.

## Conventions

- TypeScript is strict and `noUncheckedIndexedAccess` is on — guard array and
  record access instead of asserting.
- File names are kebab-case; components are PascalCase.
- **UI copy is English.** Route slugs remain Portuguese (`/admin/setores`,
  `/admin/historico`) to match the existing backlog and API — do not rename them.
- Repository prose (README, docs) is Portuguese; code and UI are English.
- Run `npm run typecheck` and `npm run lint` before handing work back.
