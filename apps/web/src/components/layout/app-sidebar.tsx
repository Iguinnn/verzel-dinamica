"use client";

import {
  CalendarCheckIcon,
  CircleParkingIcon,
  LayoutDashboardIcon,
  ListOrderedIcon,
  MapPinnedIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navigation = [
  { title: "Visao geral", href: "/admin", icon: LayoutDashboardIcon },
  { title: "Setores", href: "/admin/setores", icon: MapPinnedIcon },
  { title: "Reservas", href: "/admin/reservas", icon: CalendarCheckIcon },
  {
    title: "Lista de espera",
    href: "/admin/lista-de-espera",
    icon: ListOrderedIcon,
  },
  { title: "Ranking", href: "/admin/ranking", icon: TrophyIcon },
  { title: "Usuarios", href: "/admin/usuarios", icon: UsersIcon },
];

/** Renders the collapsible administrative navigation adapted from Shadcn Admin. */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/admin" />}
              tooltip="Estacionamento Rotativo"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CircleParkingIcon />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">Estacionamento</span>
                <span className="truncate text-xs text-muted-foreground">
                  Painel administrativo
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operacao</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.href} />}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Administrador">
              <Avatar size="sm">
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">Administrador</span>
                <span className="truncate text-xs text-muted-foreground">
                  admin@parking.local
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
