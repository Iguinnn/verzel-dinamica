import type { Metadata } from "next";

import "./globals.css";
import { Geist } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: site.description,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // `dark` is fixed: the platform ships a single dark theme, and the class
    // keeps the `dark:` utilities inside the shadcn primitives active.
    <html lang="en" className={cn("dark font-sans", geist.variable)}>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
