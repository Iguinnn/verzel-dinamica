import type { Metadata } from "next";

import { SectorManagementView } from "@/modules/sector-management/components/sector-management-view";

export const metadata: Metadata = {
  title: "Gestão de Setores",
};

export default function SectorManagementPage() {
  return <SectorManagementView />;
}
