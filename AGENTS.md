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
    admin/                    ADMIN ONLY — see "Access by role".
      gestao-setores/page.tsx /admin/gestao-setores — sector management
    user/                     Any signed-in user.
      page.tsx                /user                 — main screen
      setores/page.tsx        /user/setores         — listing screen
      historico/page.tsx      /user/historico       — history screen
  api/sectors/route.ts        BFF route handler.

modules/                      One folder per business capability. Own your module.
  auth/
    types.ts                  SessionUser view model + helpers.
    session.ts                getSessionUser() — the ONLY auth seam. See below.
    actions.ts                signInAction / signOutAction Server Actions.
    components/               login-form.tsx, login-view.tsx
  sector-management/          ESTC-1, ADMIN ONLY. Fully mocked for now.
    types.ts                  Re-exports the shared Sector + form draft types.
    mock-data.ts              Seed list. Swap for the API when it exists.
    sector-status.ts          Occupancy → livre / atencao / lotado + totals.
    sector-form.ts            ESTC-1 rules + draft ⇄ Sector mapping.
    format.ts                 pt-BR currency.
    components/               view, table, row actions, form dialog, status badge, summary cards
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

### Access by role

Routes under `app/(dashboard)/` are split by audience:

- **`admin/`** — restricted to the `ADMIN` role. Currently only
  `/admin/gestao-setores` (the sector management screen from ESTC-1).
  **This screen is for administrators only.**
- **`user/`** — reachable by any signed-in user.

Right now this split is **only a folder convention**. There is no role check
yet, and the sidebar still lists every screen in a single group — that is
deliberate, and the menu gets divided when authentication is integrated. Put a
new screen in the folder matching its audience so the guard can later be added
per segment (a `layout.tsx` under `admin/` asserting `user.role === "ADMIN"`)
without moving files.

Authorisation must be enforced on the server. Hiding a sidebar entry is not
access control.

### Adding a screen

1. Create `modules/<name>/components/<name>-view.tsx`.
2. Add the path to `routes` in `config/site.ts`, under the right audience.
3. Add the sidebar entry to `config/navigation.ts`.
4. Add a page under `app/(dashboard)/admin/` or `app/(dashboard)/user/` that
   imports the view and nothing else.

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

`apps/web` talks to Express through `lib/server/sectors.ts`, switched by
`BACKEND_MODE`:

- `mock` (default) — contract-valid fixtures, no database needed.
- `live` — fetches `API_URL`.

Both modes validate through the same Zod schema, so a screen built against mocks
works against the real API unchanged. Preserve this pattern when adding data
access.

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
- Route slugs are Portuguese (`/user/setores`, `/admin/gestao-setores`) to match
  the backlog and the API — do not rename them.
- Repository prose (README, docs) is Portuguese. Identifiers, comments and file
  names are English.
- **UI copy is mixed and that is a known inconsistency**: the app shell, sidebar
  and login are English, while the sector management screen is Portuguese
  (built to match a supplied design). Pick one language for the whole product
  before shipping; do not add more screens in a third style.
- Run `npm run typecheck` and `npm run lint` before handing work back.
