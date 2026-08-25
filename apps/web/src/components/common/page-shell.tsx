import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Scroll container for a module screen. Pairs with `PageHeader` and keeps the
 * spacing rhythm identical across every route inside the app shell.
 */
export function PageShell({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("ds-page", className)} {...props} />;
}
