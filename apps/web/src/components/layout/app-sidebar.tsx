"use client";

import { CircleParkingIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavItemActive, navigation } from "@/config/navigation";
import { routes, site } from "@/config/site";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

/**
 * Primary navigation shown on every authenticated screen.
 *
 * Items come from `config/navigation`, so new story screens plug in without
 * editing this component.
 */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href={routes.dashboard} />}
              tooltip={site.name}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CircleParkingIcon />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{site.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {site.tagline}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isNavItemActive(item, pathname)}
                      render={<Link href={item.href} />}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
