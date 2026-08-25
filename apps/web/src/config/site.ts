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
 */
export const routes = {
  login: "/login",
  dashboard: "/admin",
  sectors: "/admin/setores",
  reservations: "/admin/reservas",
  history: "/admin/historico",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
