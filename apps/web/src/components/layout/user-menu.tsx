"use client";

import { ChevronDownIcon, LogOutIcon, UserIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/modules/auth/actions";
import {
  getUserInitials,
  roleLabels,
  type SessionUser,
} from "@/modules/auth/types";

/**
 * Profile control anchored to the top-right of the app shell. Holds the
 * account summary and the sign-out entry point.
 */
export function UserMenu({ user }: { user: SessionUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-9 gap-2 px-1.5"
            aria-label="Open account menu"
          />
        }
      >
        <Avatar size="sm">
          <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-36 truncate text-sm font-medium sm:inline">
          {user.name}
        </span>
        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 px-1.5 py-1.5">
          <Avatar size="sm">
            <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled>
          <UserIcon />
          {roleLabels[user.role]}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void signOutAction();
          }}
        >
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
