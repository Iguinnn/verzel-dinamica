import type { Metadata } from "next";

import { SectorsView } from "@/modules/sectors/components/sectors-view";

export const metadata: Metadata = {
  title: "Sectors",
};

export default function SectorsPage() {
  return <SectorsView />;
}
