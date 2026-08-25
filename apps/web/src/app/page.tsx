import { redirect } from "next/navigation";

import { routes } from "@/config/site";

export default function HomePage() {
  redirect(routes.dashboard);
}
