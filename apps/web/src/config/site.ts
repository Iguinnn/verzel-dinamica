/** Product-level strings shared by metadata, the sidebar brand and the login screen. */
export const site = {
  name: "ParkFlow",
  shortName: "PF",
  tagline: "Rotating parking control",
  description: "Manage sectors, reservations, waiting lists and history.",
} as const;

/**
 * Route constants. Import these instead of hardcoding paths so a future
 * rename touches one file.
 *
 * Routes are grouped by audience: `/admin/*` is restricted to the `ADMIN`
 * role, `/user/*` is reachable by any signed-in user. The split is currently
 * only a folder convention — enforcement arrives with authentication.
 */
export const routes = {
  login: "/login",

  /** Restricted to ADMIN. */
  sectorManagement: "/admin/gestao-setores",

  /** Available to any signed-in user. */
  dashboard: "/user",
  sectors: "/user/setores",
  reservations: "/user/reservas",
  history: "/user/historico",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
