import {
  LayoutDashboardIcon,
  MapPinnedIcon,
  ScrollTextIcon,
  SlidersIcon,
  type LucideIcon,
} from "lucide-react";

import { routes } from "@/config/site";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** When true the route only matches exactly, so it stays inactive on children. */
  exact?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

/**
 * Sidebar navigation. Adding a story screen means appending an item here and
 * creating the matching module under `src/modules` — no layout edits required.
 */
export const navigation: NavGroup[] = [
  {
    label: "Operation",
    items: [
      {
        title: "Dashboard",
        href: routes.dashboard,
        icon: LayoutDashboardIcon,
        exact: true,
      },
      { title: "Sectors", href: routes.sectors, icon: MapPinnedIcon },
      {
        title: "Gestão de Setores",
        href: routes.sectorManagement,
        icon: SlidersIcon,
      },
      { title: "Histórico", href: routes.history, icon: ScrollTextIcon },
    ],
  },
];

/** Resolves whether `pathname` should mark `item` as the active route. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}
